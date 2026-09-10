// How a Qpet is actually used, which is not how a Ragnarok pet works.
//
// This site published the egg bonuses on 9 Sep 2026 with the sentence "โบนัส
// ขึ้นกับความสนิท — ระดับ 2 ต้องเลี้ยงจนสนิทมากขึ้น". That was invented: the
// mirrored guide's two columns are headed "Niveau 1" and "Niveau 2", and the
// obvious-looking reading -- classic RO intimacy, fed up over time -- was
// written down without checking what the page around the table said.
//
// What it actually says (roz-global.info/qpets.html, mirrored 8 Sep 2026):
// a Qpet is not tamed and kept. You buy a Taming Ring, equip it, and attach
// the egg to the ring in the enchantment window. Level 2 of that enchantment
// is a second copy of the same egg at a 50% success rate.
//
// The negative check matters as much as the positive one: the source contains
// no "nourrir", "faim", "intimité", "loyauté" or "fidélité" anywhere, so
// nothing on that page supports a feeding mechanic.

/** Zeny the Taming Ring costs at a Taming Merchant. */
export const TAMING_RING_PRICE = 50_000;

/** Chance that attaching the second identical egg (enchant level 2) works. */
export const LEVEL_2_SUCCESS_PERCENT = 50;

/** The taming quest that hands out taming items, for a player with no Zeny. */
export const TAMING_QUEST = {
  npc: 'Adept Adventurer',
  town: 'Izlude',
  map: 'iz_ac01',
  x: 45,
  y: 78,
  /** What the quest is about, in the guide's words. */
  about: 'จับ Little Poring แลกของสำหรับจับสัตว์',
};

/** The three tabs of the enchantment window, as the guide describes them. */
export const RING_TABS: { name: string; does: string }[] = [
  { name: 'General', does: 'เลือกไข่ที่จะใส่ลงแหวน' },
  { name: 'Growth', does: 'อัปเอนแชนต์เป็นระดับ 2' },
  { name: 'Reset', does: 'ถอดออกแล้วเริ่มใหม่' },
];
