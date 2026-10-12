// GET /api/search?q=: the header search box's seven lookups (components/
// GlobalSearch), run here so the browser no longer holds a database key
// (owner, 12 Oct 2026). Same queries as before: every word of the query has
// to appear, five rows per kind. The box merges and ranks them itself.
import { NextResponse } from 'next/server';
import { supabaseRead } from '@/lib/supabase';
import { escapeLikePattern } from '@/lib/like-escape';
import { searchWords } from '@/lib/smart-search';

export const dynamic = 'force-dynamic';

const LIMIT_PER_KIND = 5;
const MAX_QUERY = 60;

export async function GET(req: Request) {
  const q = (new URL(req.url).searchParams.get('q') ?? '').slice(0, MAX_QUERY);
  const words = searchWords(q);
  if (!words.length) return NextResponse.json({ groups: {}, failed: 0 });

  const db = supabaseRead();
  // Every word has to appear, in any order: "card poring" finds Poring
  // Card, which a single `%card poring%` never could.
  const allWords = <T,>(query: T, column: string): T => {
    let out = query;
    for (const word of words) {
      out = (out as { ilike: (c: string, p: string) => T }).ilike(column, `%${escapeLikePattern(word)}%`);
    }
    return out;
  };

  const [monsters, items, cards, equipment, costumes, skills, maps] = await Promise.all([
    allWords(db.from('monsters').select('id, name_en, image_url'), 'name_en').limit(LIMIT_PER_KIND),
    // Items excludes cards and equipment so the same row cannot appear
    // twice under two different badges.
    allWords(
      db
        .from('items')
        .select('id, name_en, icon_url')
        .not('category', 'in', '("Card","Armor","Weapon","Costume Equipment")'),
      'name_en',
    ).limit(LIMIT_PER_KIND),
    allWords(db.from('items').select('id, name_en, icon_url').eq('category', 'Card'), 'name_en').limit(LIMIT_PER_KIND),
    allWords(db.from('items').select('id, name_en, icon_url').in('category', ['Armor', 'Weapon']), 'name_en').limit(LIMIT_PER_KIND),
    // Costumes are their own group, not gear: they outnumber real
    // equipment 940 to 875, so sharing one bucket of five meant a search
    // for "wing" could return nothing a player can fight in.
    allWords(db.from('items').select('id, name_en, icon_url').eq('category', 'Costume Equipment'), 'name_en').limit(LIMIT_PER_KIND),
    // classes is fetched so mergeSearchResults can route a skill to the
    // tab it actually lives on (isInGameSkill(classes)) instead of always
    // landing on the default "ingame" tab, which 511 of 851 skills fail.
    allWords(db.from('skills').select('slug, name, icon_url, classes'), 'name').limit(LIMIT_PER_KIND),
    // map_stats is one row per map already, so no de-duplication is
    // needed here the way monster_spawns would have required.
    allWords(db.from('map_stats').select('map_code, map_display_name'), 'search_text').limit(LIMIT_PER_KIND),
  ]);

  const all = { monsters, items, cards, equipment, costumes, skills, maps };
  let failed = 0;
  const groups: Record<string, unknown[]> = {};
  for (const [kind, r] of Object.entries(all)) {
    if (r.error) {
      failed += 1;
      console.error(`api/search: ${kind} query failed`, r.error);
    }
    groups[kind] = r.data ?? [];
  }
  return NextResponse.json(
    { groups, failed },
    { headers: { 'Cache-Control': 'public, max-age=300, s-maxage=3600' } },
  );
}
