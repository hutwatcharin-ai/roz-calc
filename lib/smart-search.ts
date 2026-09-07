// One search behaviour for every box on the site.
//
// Built from what people actually typed: 511 searches over 60 days pulled
// out of GA4 and replayed against the real tables (7 Sep 2026). 76 of the
// 427 replayable ones -- 17% -- found nothing, and almost none of them were
// hopeless:
//
//   typo, one or two letters off   muffer -> Muffler, damacus/damarcus/
//                                  darmacus -> Damascus, Hydar/hidar ->
//                                  Hydra, Gukkung -> Gakkung Bow, graud ->
//                                  Guard, shinning -> Shining, Arc ward ->
//                                  Arc Wand, Venom Canine -> Venomous Canine
//   right word, wrong page         "clip" on the items page (Clip is
//                                  equipment), "grove"/"dwarf"/"Desert Wolf
//                                  Card" on the monsters page (all items)
//   two words the wrong way round  nothing in the log yet, but the substring
//                                  rule fails it, so it is handled here
//
// The old rule was one line -- `ilike '%q%'` -- which answers "does this
// exact run of characters appear" and nothing else. This module answers
// three questions instead: does it match, how well, and if not, what did
// they probably mean.
//
// No database extension involved: everything here is pure string work over
// a name list, so it runs the same in a test, on the server, and (if ever
// needed) in the browser.

/** Lowercase, strip punctuation, collapse whitespace. */
export function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/[[\]()<>{}'"`,.!?:;/\\|+*~^$#@&_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * How well a name answers a query. Higher is better; 0 means no match.
 *
 * The bands matter more than the numbers: a page sorted by this puts the
 * thing you typed first, then the things that start with it, then the
 * things that merely contain it. Searching "Orc" used to return Orcish Axe
 * above Orc Warrior purely by row order.
 */
export function matchScore(name: string, query: string): number {
  const n = normalise(name);
  const q = normalise(query);
  if (!q) return 0;
  if (n === q) return 100;
  if (n.startsWith(q)) return 80;

  const words = n.split(' ');
  // "wolf" against "Desert Wolf B": a word of the name starts with the query.
  if (words.some((w) => w.startsWith(q))) return 70;
  if (n.includes(q)) return 60;

  // Every word of the query appears somewhere, in any order: "potion red"
  // finds Red Potion, "card poring" finds Poring Card.
  const terms = q.split(' ');
  if (terms.length > 1 && terms.every((t) => n.includes(t))) return 50;
  return 0;
}

/**
 * The words of a query, for a caller that has to build one condition per
 * word (the server-paginated pages AND them together in SQL).
 */
export function searchWords(query: string): string[] {
  return normalise(query).split(' ').filter(Boolean);
}

export function matches(name: string, query: string): boolean {
  return matchScore(name, query) > 0;
}

/**
 * Letter-pair (Dice) overlap: 1 is identical, 0 shares no pair. Cheap, and
 * symmetric about word order.
 */
export function dice(a: string, b: string): number {
  const x = normalise(a).replace(/\s/g, '');
  const y = normalise(b).replace(/\s/g, '');
  if (!x || !y) return 0;
  if (x === y) return 1;
  if (x.length < 2 || y.length < 2) return 0;

  const pairs = new Map<string, number>();
  for (let i = 0; i < x.length - 1; i += 1) {
    const p = x.slice(i, i + 2);
    pairs.set(p, (pairs.get(p) ?? 0) + 1);
  }
  let shared = 0;
  for (let i = 0; i < y.length - 1; i += 1) {
    const p = y.slice(i, i + 2);
    const left = pairs.get(p) ?? 0;
    if (left > 0) {
      pairs.set(p, left - 1);
      shared += 1;
    }
  }
  return (2 * shared) / (x.length - 1 + (y.length - 1));
}

/** 1 minus the edit distance over the longer length. */
export function editRatio(a: string, b: string): number {
  const x = normalise(a).replace(/\s/g, '');
  const y = normalise(b).replace(/\s/g, '');
  if (!x || !y) return 0;
  if (x === y) return 1;
  let prev = Array.from({ length: y.length + 1 }, (_, i) => i);
  for (let i = 1; i <= x.length; i += 1) {
    const row = [i];
    for (let j = 1; j <= y.length; j += 1) {
      row[j] = Math.min(
        prev[j] + 1,
        row[j - 1] + 1,
        prev[j - 1] + (x[i - 1] === y[j - 1] ? 0 : 1),
      );
    }
    prev = row;
  }
  return 1 - prev[y.length] / Math.max(x.length, y.length);
}

/**
 * How alike two strings are, 0 to 1. The better of two measures, because
 * each misses a case the other catches: letter pairs score "damarcus" ->
 * "damascus" 0.75 but "graud" -> "guard" a flat 0 (a swap destroys every
 * pair), while edit distance scores the swap 0.6.
 */
export function similarity(a: string, b: string): number {
  return Math.max(dice(a, b), editRatio(a, b));
}

/** Default floor for "did you mean". Below this the suggestions are noise. */
export const SUGGEST_FLOOR = 0.55;

export interface Suggestion<T> {
  item: T;
  score: number;
}

/**
 * The closest few names to a query that matched nothing.
 *
 * A name that CONTAINS a query word gets a floor of the suggest threshold,
 * because "Desert Wolf Card" against "Baby Desert Wolf Card" is obviously
 * the right answer even though the extra word drags the pair score down.
 */
export function suggest<T>(
  items: readonly T[],
  query: string,
  nameOf: (item: T) => string,
  { limit = 5, floor = SUGGEST_FLOOR }: { limit?: number; floor?: number } = {},
): Suggestion<T>[] {
  const q = normalise(query);
  if (q.length < 2) return [];
  const terms = q.split(' ').filter((t) => t.length >= 3);

  const scored: Suggestion<T>[] = [];
  for (const item of items) {
    const name = nameOf(item);
    const n = normalise(name);
    // Against the whole name, and against each of its words: "gukkung" is
    // a typo of the "Gakkung" in "Gakkung Bow", and the trailing word
    // would otherwise drag the pair count below the floor.
    let score = similarity(n, q);
    if (!q.includes(' ')) {
      for (const word of n.split(' ')) {
        if (word.length >= 3) score = Math.max(score, similarity(word, q));
      }
    }
    // Long names are penalised by the pair count; a shared whole word is
    // stronger evidence than the ratio suggests.
    if (terms.length > 0 && terms.every((t) => n.includes(t))) score = Math.max(score, floor + 0.1);
    else if (terms.some((t) => n.includes(t))) score = Math.max(score, floor);
    if (score >= floor) scored.push({ item, score });
  }
  return scored
    .sort((a, b) => b.score - a.score || nameOf(a.item).length - nameOf(b.item).length)
    .slice(0, limit);
}

/**
 * Filter and rank in one pass: the rows that match, best first.
 *
 * `tiebreak` keeps a stable order inside a score band (alphabetical is the
 * usual choice; the caller may prefer id).
 */
export function rankMatches<T>(
  items: readonly T[],
  query: string,
  nameOf: (item: T) => string,
  tiebreak?: (a: T, b: T) => number,
): T[] {
  if (!normalise(query)) return [...items];
  const scored = items
    .map((item) => ({ item, score: matchScore(nameOf(item), query) }))
    .filter((s) => s.score > 0);
  scored.sort(
    (a, b) =>
      b.score - a.score ||
      (tiebreak ? tiebreak(a.item, b.item) : nameOf(a.item).localeCompare(nameOf(b.item))),
  );
  return scored.map((s) => s.item);
}
