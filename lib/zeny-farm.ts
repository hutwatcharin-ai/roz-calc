// Zeny from what a monster drops, and the maps a player cannot walk into.
//
// The ranking that used to live here moved to lib/farm-engine (11 Sep 2026),
// where every farm mode shares one rule set. What stays is what the farm-data
// route needs to build the payload.

/**
 * A drop as the table holds it: rate is a PERCENT, so 70 is 70% (Poring's
 * Jellopy). rAthena's own scale is per-10,000, and this file was first written
 * against that -- every zeny figure on the draft page came out a hundred times
 * too small until the Poring row was checked by hand on 11 Sep 2026.
 */
export interface DropRow {
  itemId: number;
  rate: number | null;
  sellPrice: number | null;
}

/**
 * Expected zeny from one kill. A drop with no rate, or an item with no sell
 * price, contributes nothing -- counted separately so a page can say the
 * figure is a floor rather than a total.
 */
export function zenyPerKill(drops: DropRow[]): { perKill: number; unpriced: number } {
  let perKill = 0;
  let unpriced = 0;
  for (const drop of drops) {
    if (drop.rate === null || !drop.sellPrice) {
      unpriced += 1;
      continue;
    }
    perKill += (drop.rate / 100) * drop.sellPrice;
  }
  return { perKill, unpriced };
}

/**
 * Maps a player cannot simply walk into, so no ranking may offer them. The
 * treasure rooms outrank every real field by a factor of five and only exist
 * inside War of Emperium; a memorial dungeon needs a party and a quest.
 */
const CLOSED_TO_WALK_INS = [
  { test: /^treasure/, why: 'ห้องสมบัติ WoE' },
  { test: /^gld_?dun|^gld2?_/, why: 'ดันเจี้ยนกิลด์' },
  { test: /^(prt|pay|gef|alde)_gld/, why: 'ปราสาท WoE' },
  { test: /^(ma_|md_|1@|2@)/, why: 'Memorial Dungeon' },
  { test: /^job_|^que_|^new_|^force_/, why: 'แมพเควส/ทดสอบ' },
];

export function walkInReason(mapCode: string): string | null {
  return CLOSED_TO_WALK_INS.find((rule) => rule.test.test(mapCode))?.why ?? null;
}
