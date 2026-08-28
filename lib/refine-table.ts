// Refining: success chances, the bonus each level gives, and what it costs.
//
// Source: Ragnarok Zero's own game guide, คู่มือผู้เชี่ยวชาญ > การตีบวก. That page
// publishes four tables -- success chance per level, ATK/MATK gained per level,
// the extra ATK/MATK high refines give on top, and DEF gained per level -- plus
// the ore and fee each equipment level needs.
//
// Three of those four are pure arithmetic, and lib/refine-table.test.ts derives
// them from formula and asserts they reproduce these digits exactly. That is
// the cross-check that makes a hand transcription of ~200 numbers trustworthy:
// a misread digit breaks the line and the test says which one.
//
// The success table is the one with no formula behind it. It is checked only
// for shape (never rises with refine level, special never worse than normal),
// and its low rows are the numbers to doubt first if a player reports a
// mismatch.

export const GEAR_TYPES = ['armour', 'weapon1', 'weapon2', 'weapon3', 'weapon4'] as const;
export type GearType = (typeof GEAR_TYPES)[number];
export type WeaponType = Exclude<GearType, 'armour'>;

export const GEAR_LABELS: Record<GearType, string> = {
  armour: 'ชุดเกราะ',
  weapon1: 'อาวุธเลเวล 1',
  weapon2: 'อาวุธเลเวล 2',
  weapon3: 'อาวุธเลเวล 3',
  weapon4: 'อาวุธเลเวล 4',
};

export const MAX_REFINE = 20;

/** Chance to go from +n-1 to +n, as a percentage. Index 0 is the +0 -> +1 step. */
export type RefineChance = { normal: number; special: number };

export const REFINE_CHANCE: Record<GearType, RefineChance[]> = {
  armour: [
    { normal: 90, special: 100 },
    { normal: 90, special: 100 },
    { normal: 90, special: 100 },
    { normal: 80, special: 100 },
    { normal: 60, special: 90 },
    { normal: 40, special: 70 },
    { normal: 40, special: 70 },
    { normal: 20, special: 40 },
    { normal: 20, special: 40 },
    { normal: 9, special: 20 },
    { normal: 8, special: 18 },
    { normal: 8, special: 18 },
    { normal: 8, special: 18 },
    { normal: 8, special: 18 },
    { normal: 7, special: 7 },
    { normal: 7, special: 7 },
    { normal: 7, special: 7 },
    { normal: 7, special: 7 },
    { normal: 5, special: 5 },
    { normal: 5, special: 5 },
  ],
  weapon1: [
    { normal: 90, special: 100 },
    { normal: 90, special: 100 },
    { normal: 90, special: 100 },
    { normal: 90, special: 100 },
    { normal: 90, special: 100 },
    { normal: 90, special: 100 },
    { normal: 80, special: 100 },
    { normal: 60, special: 90 },
    { normal: 40, special: 70 },
    { normal: 19, special: 30 },
    { normal: 18, special: 18 },
    { normal: 18, special: 18 },
    { normal: 18, special: 18 },
    { normal: 18, special: 18 },
    { normal: 18, special: 18 },
    { normal: 17, special: 17 },
    { normal: 17, special: 17 },
    { normal: 17, special: 17 },
    { normal: 15, special: 15 },
    { normal: 15, special: 15 },
  ],
  weapon2: [
    { normal: 90, special: 100 },
    { normal: 90, special: 100 },
    { normal: 90, special: 100 },
    { normal: 90, special: 100 },
    { normal: 90, special: 100 },
    { normal: 80, special: 100 },
    { normal: 60, special: 90 },
    { normal: 40, special: 70 },
    { normal: 20, special: 40 },
    { normal: 19, special: 30 },
    { normal: 18, special: 18 },
    { normal: 18, special: 18 },
    { normal: 18, special: 18 },
    { normal: 18, special: 18 },
    { normal: 18, special: 18 },
    { normal: 17, special: 17 },
    { normal: 17, special: 17 },
    { normal: 17, special: 17 },
    { normal: 15, special: 15 },
    { normal: 15, special: 15 },
  ],
  weapon3: [
    { normal: 90, special: 100 },
    { normal: 90, special: 100 },
    { normal: 90, special: 100 },
    { normal: 90, special: 100 },
    { normal: 80, special: 100 },
    { normal: 60, special: 90 },
    { normal: 50, special: 80 },
    { normal: 20, special: 40 },
    { normal: 20, special: 40 },
    { normal: 19, special: 30 },
    { normal: 15, special: 15 },
    { normal: 15, special: 15 },
    { normal: 15, special: 15 },
    { normal: 15, special: 15 },
    { normal: 11, special: 11 },
    { normal: 11, special: 11 },
    { normal: 11, special: 11 },
    { normal: 11, special: 11 },
    { normal: 9, special: 9 },
    { normal: 9, special: 9 },
  ],
  weapon4: [
    { normal: 90, special: 100 },
    { normal: 90, special: 100 },
    { normal: 90, special: 100 },
    { normal: 80, special: 100 },
    { normal: 60, special: 90 },
    { normal: 40, special: 70 },
    { normal: 40, special: 70 },
    { normal: 20, special: 40 },
    { normal: 20, special: 40 },
    { normal: 9, special: 20 },
    { normal: 8, special: 8 },
    { normal: 8, special: 8 },
    { normal: 8, special: 8 },
    { normal: 8, special: 8 },
    { normal: 7, special: 7 },
    { normal: 7, special: 7 },
    { normal: 7, special: 7 },
    { normal: 7, special: 7 },
    { normal: 5, special: 5 },
    { normal: 5, special: 5 },
  ],
};

/**
 * ATK/MATK a weapon gains at each refine level, cumulative. Index 0 is +1.
 * Two straight lines: a gentle one up to +15, a much steeper one after.
 */
export const WEAPON_ATK: Record<WeaponType, number[]> = {
  weapon1: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 48, 66, 84, 102, 120],
  weapon2: [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36, 39, 42, 45, 80, 115, 150, 185, 220],
  weapon3: [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 134, 193, 252, 311, 370],
  weapon4: [8, 16, 24, 32, 40, 48, 56, 64, 72, 80, 88, 96, 104, 112, 120, 215, 310, 405, 500, 595],
};

/**
 * The extra ATK/MATK high refines add on top of WEAPON_ATK. Zero until the
 * level where the guide stops printing a dash. Index 0 is +1.
 */
export const WEAPON_ATK_BONUS: Record<WeaponType, number[]> = {
  weapon1: [0, 0, 0, 0, 0, 0, 0, 3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36, 39],
  weapon2: [0, 0, 0, 0, 0, 0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70],
  weapon3: [0, 0, 0, 0, 0, 8, 16, 24, 32, 40, 48, 56, 64, 72, 80, 88, 96, 104, 112, 120],
  weapon4: [0, 0, 0, 0, 14, 28, 42, 56, 70, 84, 98, 112, 126, 140, 154, 168, 182, 196, 210, 224],
};

/** DEF armour gains at each refine level, cumulative. Index 0 is +1. */
export const ARMOUR_DEF: number[] = [
  1, 4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144, 169, 196, 225, 256, 289, 324, 361, 400,
];

/**
 * What one attempt needs. Ore prices are the guide's NPC prices where it gives
 * one; the refine fee is charged whether the attempt succeeds or not.
 *
 * The guide lists three ores for weapon Lv3, Lv4 and armour (plain,
 * Concentrated, HD) and one for Lv1 and Lv2. Concentrated is the "special"
 * chance column. HD is a different game -- it drops the refine by one instead
 * of destroying the item -- and is deliberately not costed here.
 */
export type OreSpec = { ore: string; oreZeny: number | null; feeZeny: number };

export const ORE: Record<GearType, { normal: OreSpec; special: OreSpec | null }> = {
  weapon1: {
    normal: { ore: 'Phracon', oreZeny: 200, feeZeny: 1_000 },
    special: null,
  },
  weapon2: {
    normal: { ore: 'Emveretarcon', oreZeny: 1_000, feeZeny: 2_000 },
    special: null,
  },
  weapon3: {
    normal: { ore: 'Oridecon', oreZeny: null, feeZeny: 10_000 },
    special: { ore: 'Concentrated Oridecon', oreZeny: null, feeZeny: 10_000 },
  },
  weapon4: {
    normal: { ore: 'Oridecon', oreZeny: null, feeZeny: 10_000 },
    special: { ore: 'Concentrated Oridecon', oreZeny: null, feeZeny: 10_000 },
  },
  armour: {
    normal: { ore: 'Elunium', oreZeny: null, feeZeny: 10_000 },
    special: { ore: 'Concentrated Elunium', oreZeny: null, feeZeny: 10_000 },
  },
};

export function isWeapon(gear: GearType): gear is WeaponType {
  return gear !== 'armour';
}

/** Chance of the +level-1 -> +level step, as a percentage. */
export function chanceAt(gear: GearType, level: number, special: boolean): number {
  const row = REFINE_CHANCE[gear][level - 1];
  if (!row) throw new Error(`no refine chance for ${gear} +${level}`);
  return special ? row.special : row.normal;
}

/** Total ATK/MATK a weapon carries at a refine level: base line plus high-refine bonus. */
export function weaponAtkAt(gear: WeaponType, level: number): number {
  if (level <= 0) return 0;
  return WEAPON_ATK[gear][level - 1] + WEAPON_ATK_BONUS[gear][level - 1];
}

export function armourDefAt(level: number): number {
  if (level <= 0) return 0;
  return ARMOUR_DEF[level - 1];
}
