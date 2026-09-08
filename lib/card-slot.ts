// A card's equip slot lives in its description text, on a line reading
// "Equipped on : X". There is no column for it, and the values are not
// normalised: Headgear and Helmet both occur, as do Shoes and Footgear, and
// one card carries a typo from upstream.
//
// Two readings of that line, and both are wanted:
//
//   parseCardSlot  reports the string exactly as the client wrote it. The
//                  card's own page uses it, because a page about one card
//                  should show what that card says.
//   cardSlot       folds the client's synonym pairs into the seven places a
//                  card can actually go, so a list can be filtered without
//                  splitting Headgear from Helmet into two options that mean
//                  the same thing. Anything it does not recognise -- the
//                  upstream typo included -- comes back null rather than
//                  being pushed into the nearest slot.

const SLOT_LINE = /^\s*Equipped on\s*:[ \t]*(.*)$/m;

export function parseCardSlot(description: string | null): string | null {
  if (!description) return null;
  const match = SLOT_LINE.exec(description);
  if (!match) return null;
  const slot = match[1].trim();
  return slot === '' ? null : slot;
}

export type CardSlot = 'weapon' | 'armor' | 'shield' | 'garment' | 'shoes' | 'headgear' | 'accessory';

export const SLOT_TH: Record<CardSlot, string> = {
  weapon: 'อาวุธ',
  armor: 'ชุด',
  shield: 'โล่',
  garment: 'ผ้าคลุม',
  shoes: 'รองเท้า',
  headgear: 'หมวก',
  accessory: 'เครื่องประดับ',
};

export const SLOT_ORDER: CardSlot[] = ['weapon', 'armor', 'shield', 'garment', 'shoes', 'headgear', 'accessory'];

const SLOT_WORDS: Record<string, CardSlot> = {
  weapon: 'weapon',
  armor: 'armor',
  armour: 'armor',
  shield: 'shield',
  garment: 'garment',
  shoes: 'shoes',
  footgear: 'shoes',
  headgear: 'headgear',
  helmet: 'headgear',
  accessory: 'accessory',
};

/** The place the card goes, with the client's synonyms folded together. */
export function cardSlot(description: string | null | undefined): CardSlot | null {
  const raw = parseCardSlot(description ?? null);
  if (!raw) return null;
  return SLOT_WORDS[raw.toLowerCase()] ?? null;
}
