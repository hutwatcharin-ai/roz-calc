// The ranking behind the monster-name suggestions on /database/monsters
// (owner's pick B, 1 Oct 2026, from public/draft/monster-suggest).
//
// Pure, so it runs in the browser on every keystroke and in a test. The list
// is the ~355 monsters the page ships anyway; no request per letter.

import { matchScore, normalise } from '@/lib/smart-search';

export interface SuggestMonster {
  id: number;
  /** The client's name. */
  name: string;
  /** What the row shows: the players' name where it differs (Baphomet Jr.). */
  label: string;
  level: number;
  mvp: boolean;
  mini: boolean;
  /** Thai race and element, already translated, for the line under the name. */
  race: string;
  element: string;
  /** Element in English, for the frame colour. */
  elementKey: string;
  sprite: string | null;
  /** Thai names players were seen searching for (lib/thai-aliases). */
  aliases: string[];
}

export interface SuggestHit {
  monster: SuggestMonster;
  /** The alias that matched, when the match came from a Thai name. */
  via: string | null;
}

export const SUGGEST_LIMIT = 8;

export function rankSuggestions(list: SuggestMonster[], query: string, limit = SUGGEST_LIMIT): SuggestHit[] {
  if (!normalise(query)) return [];
  const scored: { hit: SuggestHit; score: number }[] = [];
  for (const m of list) {
    const byName = Math.max(matchScore(m.label, query), matchScore(m.name, query));
    let via: string | null = null;
    let byAlias = 0;
    for (const a of m.aliases) {
      const s = matchScore(a, query);
      if (s > byAlias) {
        byAlias = s;
        via = a;
      }
    }
    const score = Math.max(byName, byAlias);
    if (score === 0) continue;
    scored.push({ hit: { monster: m, via: byName >= byAlias ? null : via }, score });
  }
  scored.sort(
    (a, b) =>
      b.score - a.score ||
      a.hit.monster.level - b.hit.monster.level ||
      a.hit.monster.label.localeCompare(b.hit.monster.label),
  );
  return scored.slice(0, limit).map((s) => s.hit);
}

/** Splits text around the first case-insensitive occurrence of the query. */
export function highlightParts(text: string, query: string): [string, string, string] {
  const q = query.trim().toLowerCase();
  const at = q ? text.toLowerCase().indexOf(q) : -1;
  if (at < 0) return [text, '', ''];
  return [text.slice(0, at), text.slice(at, at + q.length), text.slice(at + q.length)];
}
