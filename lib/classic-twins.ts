// Classic leftovers (owner question, 5 Oct 2026: "the low-numbered Hallberd
// and the six-digit one -- what's the difference?"). The Zero client still
// carries many classic-RO item ids (1463 Hallberd) next to Zero's own
// six-digit copy of the same item (630039, 630053). In the client the two are
// identical -- name, text, ATK, weight -- only the id differs. Monsters drop
// the six-digit one: of 51 such weapon/armour names, 46 drop the Zero id and
// none drop only the classic id (5 Oct 2026). So a classic id whose name also
// exists as a Zero id, and which no monster drops, is a leftover nobody holds.

/** Zero's own item ids start here; below it are classic-RO ids. */
export const ZERO_ID_FLOOR = 100000;

/** Ids of classic leftovers: a classic id with a Zero-id namesake and no drop. */
export function classicTwinIds(items: { id: number; name: string }[], dropped: Set<number>): Set<number> {
  const zeroNames = new Set(items.filter((i) => i.id >= ZERO_ID_FLOOR).map((i) => i.name.toLowerCase()));
  return new Set(
    items.filter((i) => i.id < ZERO_ID_FLOOR && zeroNames.has(i.name.toLowerCase()) && !dropped.has(i.id)).map((i) => i.id),
  );
}
