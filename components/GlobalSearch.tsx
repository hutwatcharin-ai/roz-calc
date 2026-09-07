'use client';

// The one box that searches everything, in the header.
//
// It existed before, opened with Ctrl+K, and was taken out at the start of
// September along with the shortcut. Back on 7 Sep 2026 at the user's
// request, without any shortcut: a button you can see, and Escape to close
// the dialog once it is open (that is what a dialog does, not a way in).
//
// It searches the same way every other box on the site now does
// (lib/smart-search): one condition per word so order stops mattering, and
// the merged rows ranked so an exact name beats something that merely
// contains the word.

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { supabaseBrowser } from '@/lib/supabase';
import { mergeSearchResults, SEARCH_TYPE_LABELS, type SearchResult } from '@/lib/search';
import { escapeLikePattern } from '@/lib/like-escape';
import { matchScore, searchWords } from '@/lib/smart-search';

const LIMIT_PER_KIND = 5;

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  // True when at least one of the seven underlying queries failed. A partial
  // list must never present itself as complete -- a player typing "prontera"
  // during a maps outage still sees monster/item hits, but the box has to
  // say a category could not be searched instead of implying maps simply has
  // no match.
  const [hasError, setHasError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults([]);
      setHasError(false);
      return;
    }
    inputRef.current?.focus();
    // Escape closes the dialog. This is the dialog's own behaviour, not a
    // shortcut for reaching it: nothing here opens the box.
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setHasError(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      const db = supabaseBrowser();
      const words = searchWords(query);
      // Every word has to appear, in any order: "card poring" finds Poring
      // Card, which a single `%card poring%` never could.
      const allWords = <T,>(q: T, column: string): T => {
        let out = q;
        for (const word of words) {
          out = (out as { ilike: (c: string, p: string) => T }).ilike(
            column,
            `%${escapeLikePattern(word)}%`,
          );
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

      const failures = [monsters, items, cards, equipment, costumes, skills, maps].filter((r) => r.error);
      for (const f of failures) console.error('global search: a query failed', f.error);
      setHasError(failures.length > 0);

      const merged = mergeSearchResults({
        monsters: monsters.data ?? [],
        items: items.data ?? [],
        cards: cards.data ?? [],
        equipment: equipment.data ?? [],
        costumes: costumes.data ?? [],
        skills: skills.data ?? [],
        maps: maps.data ?? [],
      });
      // Best name first across all seven groups, so "orc" opens on Orc and
      // not on whichever category happened to be listed first. Ties go to
      // the shorter name: "card poring" should offer Poring Card before Gem
      // Poring Card.
      merged.sort(
        (a, b) =>
          matchScore(b.name, query) - matchScore(a.name, query) ||
          a.name.length - b.name.length ||
          a.name.localeCompare(b.name),
      );
      // One row per name per kind. Equipment genuinely has same-named rows
      // (Arc Wand [1] and [2] are two ids), and a map's channel copies all
      // carry the display name -- "orc" was returning Orc Village three
      // times and Orc Hammer twice. The best-ranked one stands for them.
      const seen = new Set<string>();
      setResults(
        merged.filter((r) => {
          const key = `${r.type}:${r.name.toLowerCase()}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        }),
      );
      setLoading(false);
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <>
      <button type="button" className="searchbtn" onClick={() => setOpen(true)}>
        <span aria-hidden="true">🔍</span> ค้นหาทุกอย่าง
      </button>

      {open && (
        <div className="searchmodal" onClick={() => setOpen(false)}>
          <div
            className="card searchmodal__box"
            role="dialog"
            aria-modal="true"
            aria-label="ค้นหาทุกอย่างในฐานข้อมูล"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              ref={inputRef}
              className="searchmodal__input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="พิมพ์ชื่อมอน ไอเทม การ์ด สกิล หรือแมพ..."
            />

            <div className="searchmodal__list">
              {loading && <p className="searchmodal__note">กำลังค้นหา...</p>}
              {/* A failed category must not read as "nothing there" -- results
                  from the categories that succeeded are still shown below,
                  but the list is flagged as incomplete rather than complete. */}
              {!loading && hasError && (
                <p className="searchmodal__note searchmodal__note--warn">
                  ค้นบางหมวดไม่สำเร็จ ผลลัพธ์ด้านล่างอาจไม่ครบ
                </p>
              )}
              {!loading && query.trim() && results.length === 0 && (
                <p className="searchmodal__note">
                  {hasError ? 'ค้นหาไม่สำเร็จ ลองใหม่อีกครั้ง' : 'ไม่พบผลลัพธ์ · ลองพิมพ์สั้นลงเหลือ 3-4 ตัวอักษร'}
                </p>
              )}
              {!loading && !query.trim() && (
                <p className="searchmodal__note">ค้นได้ทุกหมวดพร้อมกัน — มอนสเตอร์ ไอเทม การ์ด อุปกรณ์ คอสตูม สกิล แมพ</p>
              )}
              {results.map((r) => (
                <Link key={`${r.type}-${r.id}`} href={r.href} onClick={() => setOpen(false)} className="searchmodal__row">
                  <span className="searchmodal__name">
                    {r.iconUrl && (
                      <img src={r.iconUrl} alt="" width={20} height={20} style={{ imageRendering: 'pixelated' }} />
                    )}
                    {r.name}
                  </span>
                  <span className="mono searchmodal__badge">{SEARCH_TYPE_LABELS[r.type]}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
