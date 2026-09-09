// Which cards this site has a picture of, and where that picture is.
//
// The picture is the card's own artwork -- the framed illustration with the
// card's name along the top -- not the item icon. Our icons are 8 distinct
// images across 313 cards, so they identify nothing; the artwork is different
// for every card that has one.
//
// 290 of 315 cards have one. The other 25 get the generic card back, which is
// a picture of a card rather than a picture of *that* card, so every caller
// has to label it as missing rather than let it pass as the artwork.
// `hasCardArt` is what tells the two apart.
//
// Built by scripts/mirror-card-art.mjs then scripts/compress-card-art.py.

import file from '@/data/card-art.json';

const data = file as {
  withArt: number[];
  withoutArt: Record<string, string>;
};

const withArt = new Set(data.withArt);

/** True when the site serves this card's own artwork. */
export function hasCardArt(id: number): boolean {
  return withArt.has(id);
}

/** Full size, 150x200 -- a card's own page. */
export function cardArtUrl(id: number): string {
  return hasCardArt(id) ? `/images/cards/${id}.webp` : '/images/cards/back.webp';
}

/** 60x80 -- the list and the hover popup. */
export function cardArtThumbUrl(id: number): string {
  return hasCardArt(id) ? `/images/cards/thumb/${id}.webp` : '/images/cards/thumb/back.webp';
}

/** What to put on the image, so a card back never reads as the artwork. */
export function cardArtAlt(id: number, name: string): string {
  return hasCardArt(id) ? `รูปการ์ด ${name}` : `ยังไม่มีรูปการ์ด ${name}`;
}

/** For the sentence on the list page. */
export const CARDS_WITH_ART = data.withArt.length;
export const CARDS_WITHOUT_ART = Object.keys(data.withoutArt).length;
