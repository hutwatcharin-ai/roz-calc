// The name a monster used to be filed under here.
//
// Thirty monsters were renamed on 7 and 8 Sep 2026 because their own card --
// and a second, independent Zero database -- spelled them differently from
// our table. The rename is right, but it moves the target: search matches
// words against the current name, so "Pecopeco" stopped finding Peco Peco
// and "Wootan Fighter" stopped finding Utan Fighter the moment the row
// changed. Half of these old names are typos nobody would ever type; the
// other half are the form a player who started years ago still uses.
//
// Kept separate from data/aliases-th.json on purpose. That file records what
// people were observed searching for; this one records what this table
// itself used to say, which needs no search to evidence it.

import file from '@/data/monster-former-names.json';

export interface FormerName {
  name: string;
  /** The date the table stopped using it. */
  until: string;
}

const data = (file as unknown as { monsters: Record<string, FormerName[]> }).monsters;

export function formerNames(id: number | string): FormerName[] {
  return data[String(id)] ?? [];
}

function squash(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Ids whose former name answers this query. Punctuation and spacing are
 * dropped on both sides, so "peco peco egg" finds the row that used to be
 * "Pecopeco Egg" and vice versa.
 */
export function formerNameIdsFor(query: string): number[] {
  const q = squash(query);
  if (q.length < 3) return [];
  const out: number[] = [];
  for (const [id, names] of Object.entries(data)) {
    if (names.some((n) => squash(n.name).includes(q) || q.includes(squash(n.name)))) out.push(Number(id));
  }
  return out;
}
