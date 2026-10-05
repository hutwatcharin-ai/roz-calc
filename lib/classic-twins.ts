// Classic leftovers (owner question, 5 Oct 2026: "the low-numbered Hallberd
// and the six-digit one -- what's the difference?"). The Zero client still
// carries many classic-RO item ids (1463 Hallberd) next to Zero's own
// six-digit copy of the same item (630039, 630053). In the client the two are
// identical -- name, text, ATK, weight -- only the id differs. Monsters drop
// the six-digit one: of 51 such weapon/armour names, 46 drop the Zero id and
// none drop only the classic id (5 Oct 2026). So a classic id whose name also
// exists as a Zero id, and which no monster drops, is a leftover nobody holds.
// Equipment only: consumables and boxes come from shops and the cash shop,
// not drops, so "no drop" says nothing there (Small Healing Potion 22817 is
// named in the client's WoE rules next to its 107046 copy).

import file from '@/data/classic-twins.json';

/** Zero's own item ids start here; below it are classic-RO ids. */
export const ZERO_ID_FLOOR = 100000;

/** Ids of classic leftovers: a classic id with a Zero-id namesake and no drop. */
export function classicTwinIds(items: { id: number; name: string; category: string | null }[], dropped: Set<number>): Set<number> {
  const gear = (i: { category: string | null }) => i.category === 'Weapon' || i.category === 'Armor';
  const zeroNames = new Set(items.filter((i) => i.id >= ZERO_ID_FLOOR).map((i) => i.name.toLowerCase()));
  return new Set(
    items.filter((i) => gear(i) && i.id < ZERO_ID_FLOOR && zeroNames.has(i.name.toLowerCase()) && !dropped.has(i.id)).map((i) => i.id),
  );
}

// The site's own list, built by scripts/build-classic-twins.mjs with the rule
// above, each leftover mapped to the one Zero copy it stands for (the shop
// copy first: 1463 Hallberd -> 630053, sold for 1,650z).
const TWINS = (file as { twins: Record<string, { category: string; to: number | null; shop: number | null }> }).twins;

/** The Zero item a classic leftover stands for, or null when `id` is not one. */
export function zeroTwinOf(id: number): number | null {
  return TWINS[String(id)]?.to ?? null;
}

/** Leftover ids by category, for lib/game-absent's lists. */
export const LEFTOVER_IDS_BY_CATEGORY: Record<string, number[]> = Object.entries(TWINS).reduce<Record<string, number[]>>((acc, [id, t]) => {
  (acc[t.category] ??= []).push(Number(id));
  return acc;
}, {});

/** A data id (rAthena forge row) moved to the Zero copy when it is a leftover. */
export const toZeroId = (id: number): number => zeroTwinOf(id) ?? id;

/** Zero items that exist only as the drop copy (Sword [4] 500096): no shop copy. */
const DROP_ONLY = new Set(Object.values(TWINS).filter((t) => t.to !== null && t.shop === null).map((t) => t.to as number));

/**
 * The shop does not sell this piece (owner, 5 Oct 2026: "the max-slot drop
 * copy has no buy price, you can only find it"). True for a Zero weapon or
 * armour with a same-name Zero copy that has fewer slots -- Gladius [3] next
 * to Gladius [2] -- and for the copies Zero has only as a drop.
 */
export function isDropCopy(
  item: { id: number; slots: number | null; category: string | null },
  sameName: readonly { id: number; slots: number | null }[],
): { shopCopy: { id: number; slots: number } | null } | null {
  if (item.id < ZERO_ID_FLOOR || (item.category !== 'Weapon' && item.category !== 'Armor')) return null;
  const fewer = sameName
    .filter((o) => o.id >= ZERO_ID_FLOOR && (o.slots ?? 0) < (item.slots ?? 0))
    .sort((a, b) => (a.slots ?? 0) - (b.slots ?? 0));
  if (fewer.length) return { shopCopy: { id: fewer[0].id, slots: fewer[0].slots ?? 0 } };
  return DROP_ONLY.has(item.id) ? { shopCopy: null } : null;
}

/**
 * Where a shop row for `id` belongs: the Zero shop copy, `id` itself when it
 * is not a leftover, or null when the leftover has no shop copy in Zero
 * (Sword exists only as the [4] drop copy; nobody has seen a shop sell it).
 */
export function shopIdOf(id: number): number | null {
  const t = TWINS[String(id)];
  return t ? t.shop : id;
}
