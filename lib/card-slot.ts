// A card's equip slot lives in its description text, on a line reading
// "Equipped on : X". There is no column for it, and the values are not
// normalised: Headgear and Helmet both occur, as do Shoes and Footgear, and
// one card carries a typo from upstream. This reports what the data says and
// nothing more -- normalising here would be inventing a game value.

const SLOT_LINE = /^\s*Equipped on\s*:[ \t]*(.*)$/m;

export function parseCardSlot(description: string | null): string | null {
  if (!description) return null;
  const match = SLOT_LINE.exec(description);
  if (!match) return null;
  const slot = match[1].trim();
  return slot === '' ? null : slot;
}
