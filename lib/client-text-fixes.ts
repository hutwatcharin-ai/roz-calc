// Lines in the game's own item text that the owner has tested and found do
// nothing in the live game. They are kept out of anything that lists items by
// effect, and cut from the in-game text on the item's page (owner, 9 Oct
// 2026: a note under a wrong line still left players reading the line).
//
// Crab Card (owner, 8 Oct 2026): in game it is ATK +5 and nothing else. The
// client's "Physical Damage to Water-property monsters +30%" line had put it
// on the "cards that hit Water monsters" page. Its one-line Thai effect
// (items.description_th) was corrected in the database the same day.

export interface ClientTextFix {
  /** Card topic slugs (lib/card-topics) this item must not appear on. */
  topics: string[];
  /** Shown under the in-game text on the item's page, if anything needs saying. */
  note?: string;
  /** Whole Thai in-game lines to cut. */
  dropThai?: RegExp[];
  /** Parts of English in-game lines to cut. */
  stripEnglish?: RegExp[];
  /** Replaces the curated one-line Thai effect (items.description_th) on the card page. */
  effectTh?: string;
}

export const CLIENT_TEXT_FIXES: Record<number, ClientTextFix> = {
  4153: {
    topics: ['vs-water'],
    dropThai: [/^เพิ่ม Damage ทางกายภาพต่อมอนสเตอร์$/, /^ธาตุ Water 30%$/],
    stripEnglish: [/,? and Physical Damage to Water-property Monsters \+30%/i],
  },
};

export function clientTextFix(id: number): ClientTextFix | null {
  return CLIENT_TEXT_FIXES[id] ?? null;
}

/** The card's one-line Thai effect: the owner-tested fix when there is one, else the stored line. */
export function cardEffectTh(id: number | null | undefined, stored: string | null | undefined): string | null {
  return (id != null ? CLIENT_TEXT_FIXES[id]?.effectTh : undefined) ?? stored ?? null;
}

/** The in-game text with the owner-tested dead lines cut. */
export function fixGameLines(id: number, lines: string[], lang: 'th' | 'en'): string[] {
  const fix = CLIENT_TEXT_FIXES[id];
  if (!fix) return lines;
  if (lang === 'th') return lines.filter((l) => !(fix.dropThai ?? []).some((re) => re.test(l.trim())));
  return lines.map((l) => (fix.stripEnglish ?? []).reduce((t, re) => t.replace(re, ''), l)).filter((l) => l.trim());
}
