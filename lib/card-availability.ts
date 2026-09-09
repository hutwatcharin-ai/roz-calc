// Which cards are not in the game yet.
//
// The items table carries every card the client ships, and 42 of the 315 on
// /database/cards belong to content that has not opened on Global. Listing
// them beside cards a player can farm today, with no mark, is the page
// telling a reader to go and get something that does not drop anywhere.
//
// Built by scripts/build-card-availability.mjs from two sources that agree on
// every card they both cover. Only the unreleased ones are stored: available
// is the default, so an empty answer here means "nothing says otherwise",
// never "confirmed available".

import file from '@/data/card-availability.json';

export interface CardRelease {
  /** The patch month each source names, e.g. "JAN 2027", or null if unknown. */
  when: string | null;
  /** For sorting by when a card lands; unknown dates sort last. */
  sortKey: number;
  sources: string[];
}

const cards = (file as { cards: Record<string, CardRelease> }).cards;

const squash = (text: string): string => text.toLowerCase().replace(/[^a-z0-9]/g, '');

const MONTH_TH: Record<string, string> = {
  JAN: 'ม.ค.',
  FEB: 'ก.พ.',
  MAR: 'มี.ค.',
  APR: 'เม.ย.',
  MAY: 'พ.ค.',
  JUN: 'มิ.ย.',
  JUL: 'ก.ค.',
  AUG: 'ส.ค.',
  SEP: 'ก.ย.',
  OCT: 'ต.ค.',
  NOV: 'พ.ย.',
  DEC: 'ธ.ค.',
};

/** Null when nothing says the card is unreleased. Accepts either "Alice" or
 *  "Alice Card", because callers hold both spellings. */
export function cardRelease(name: string): CardRelease | null {
  return cards[squash(name.replace(/card$/i, ''))] ?? null;
}

/** "JAN 2027" as Thai, or a plain "ยังไม่มีกำหนด" when no source names a date. */
export function releaseText(release: CardRelease): string {
  if (!release.when) return 'ยังไม่มีกำหนด';
  const [month, year] = release.when.split(' ');
  return `${MONTH_TH[month] ?? month} ${year}`;
}

/** How many cards are recorded as not yet released, for a sentence. */
export const UNRELEASED_CARD_COUNT = Object.keys(cards).length;
