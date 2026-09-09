// Counts that appear in the words on a page.
//
// A number written into a sentence is a claim, and a claim in a literal goes
// stale the moment an import runs. It happened on 8 Sep 2026: adding the ten
// Nordfeld monsters left the monsters page titled "349 ตัว" while the page
// listed 359, and three other pages still saying "524 ตัว" for a table of
// 534. Nothing errored and no test failed -- the site simply started lying
// about its own size.
//
// components/SiteStats already counts live for the home page's stat row; the
// comment there says a hardcoded total "becomes a lie the first time an
// import adds one", which turned out to be exactly right. This module is
// that same rule for prose and page titles.
//
// Not everything with a number in it belongs here. A sentence about work
// that was done once -- "cross-checked 524 monsters against this source" --
// is history, and making it live would claim we checked ten monsters we
// never checked. Those keep their literal and gain a date instead.

import { cache } from 'react';
import { supabaseBrowser } from '@/lib/supabase';
import { C_VARIANT_SQL_NOT_LIKE, INSTANCE_VARIANT_SQL_NOT_LIKE } from '@/lib/c-variant';

export interface MonsterCounts {
  /** Every row in the table. */
  total: number | null;
  /** What the monsters page shows before anyone touches a filter: no
   *  Challenge clones, no memorial-dungeon Mj variants. */
  listed: number | null;
  /** Everything except the Challenge clones. This is the universe the
   *  hit/flee tool works in, and a sentence on that page must count in it --
   *  the old copy said "34 of 524", a denominator that included 159 monsters
   *  the page filters out. */
  noChallenge: number | null;
  /** Of `noChallenge`, how many have no HIT or FLEE threshold in the game
   *  files, so the tool cannot place them. */
  noChallengeMissingHitFlee: number | null;
  /** Instance, event and memorial-dungeon monsters, named on the toggle that
   *  hides them. */
  mjVariants: number | null;
}

/**
 * Counted with `head: true`, so five counts cost five empty responses rather
 * than five copies of the table.
 *
 * A failed count comes back null and every caller renders it as "—". Zero is
 * not a safe stand-in: "0 ตัว" is a claim about the database, and a claim is
 * the thing this module exists to keep honest.
 */
export const monsterCounts = cache(async (): Promise<MonsterCounts> => {
  const db = supabaseBrowser();
  const [total, listed, noChallenge, missing, mj] = await Promise.all([
    db.from('monsters').select('id', { count: 'exact', head: true }),
    INSTANCE_VARIANT_SQL_NOT_LIKE.reduce(
      (query, pattern) => query.not('name_en', 'like', pattern),
      db.from('monsters').select('id', { count: 'exact', head: true }).not('name_en', 'like', C_VARIANT_SQL_NOT_LIKE),
    ),
    db.from('monsters').select('id', { count: 'exact', head: true }).not('name_en', 'like', C_VARIANT_SQL_NOT_LIKE),
    db
      .from('monsters')
      .select('id', { count: 'exact', head: true })
      .not('name_en', 'like', C_VARIANT_SQL_NOT_LIKE)
      .or('hit_100.is.null,flee_95.is.null'),
    // The same patterns the list filters *out* with, used here to count what
    // is being hidden. PostgREST has no OR of LIKEs on one column without the
    // `or` string form, so the five patterns go in as one.
    db
      .from('monsters')
      .select('id', { count: 'exact', head: true })
      .or(INSTANCE_VARIANT_SQL_NOT_LIKE.map((pattern) => `name_en.like.${pattern}`).join(',')),
  ]);
  for (const result of [total, listed, noChallenge, missing, mj]) {
    if (result.error) console.error('monster count failed', result.error);
  }
  return {
    total: total.count ?? null,
    listed: listed.count ?? null,
    noChallenge: noChallenge.count ?? null,
    noChallengeMissingHitFlee: missing.count ?? null,
    mjVariants: mj.count ?? null,
  };
});

/** A count for a sentence: the number, or "—" when the count did not come back. */
export function countText(count: number | null): string {
  return count === null ? '—' : count.toLocaleString('en-US');
}
