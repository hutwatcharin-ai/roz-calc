// The ranking behind the arcade "SELECT ..." suggestion panels
// (components/SuggestInput): the monster box first (owner's pick B, 1 Oct
// 2026, public/draft/monster-suggest), then items, cards, equipment and
// costumes the same day.
//
// Pure, so it runs in the browser on every keystroke and in a test.

import { matchScore, normalise } from '@/lib/smart-search';

export interface SuggestEntry {
  id: number;
  href: string;
  /** The game's name. */
  name: string;
  /** What the row shows; differs from name only where players say otherwise (Baphomet Jr.). */
  label: string;
  /** The small line under the label. */
  sub: string;
  /** Thai names players were seen searching for (lib/thai-aliases). */
  aliases: string[];
  sprite: string | null;
  /** Element in English, for the frame colour; '' for none. */
  el: string;
  /** Level shown on the right: the monster's level, or the level gear needs. */
  lv: number | null;
  tag: 'mvp' | 'mini' | null;
}

export interface SuggestHit {
  entry: SuggestEntry;
  /** The alias that matched, when the match came from a Thai name. */
  via: string | null;
}

export const SUGGEST_LIMIT = 8;

export function rankSuggestions(list: SuggestEntry[], query: string, limit = SUGGEST_LIMIT): SuggestHit[] {
  if (!normalise(query)) return [];
  const scored: { hit: SuggestHit; score: number }[] = [];
  for (const e of list) {
    const byName = Math.max(matchScore(e.label, query), matchScore(e.name, query));
    let via: string | null = null;
    let byAlias = 0;
    for (const a of e.aliases) {
      const s = matchScore(a, query);
      if (s > byAlias) {
        byAlias = s;
        via = a;
      }
    }
    const score = Math.max(byName, byAlias);
    if (score === 0) continue;
    scored.push({ hit: { entry: e, via: byName >= byAlias ? null : via }, score });
  }
  scored.sort(
    (a, b) =>
      b.score - a.score ||
      (a.hit.entry.lv ?? 0) - (b.hit.entry.lv ?? 0) ||
      a.hit.entry.label.localeCompare(b.hit.entry.label),
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
