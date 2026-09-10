// What a piece of gear is, in one place.
//
// The equipment list used to read items.weapon_type straight, and that column
// is empty for 248 of the 876 gear rows -- all of the ones carrying Zero's
// renumbered ids. The visible effect was a filter that lied: "รองเท้า" listed
// 7 pairs of shoes when the game has 38, and Mirror Shield could not be found
// by picking โล่ at all. data/gear-types.json fills 243 of those rows from
// rAthena (see scripts/build-gear-types.mjs for how each row was resolved and
// how the two inferred passes were checked).
//
// It also carries a category correction for two rows: Bow Thimble 2671 and
// Rainbow Eggshell 5039 are filed as weapons in our table and are an accessory
// and a hat in rAthena's.

import file from '@/data/gear-types.json';

const filled = (file as { types: Record<string, { type: string; how: string; category?: string }> }).types;

export const ARMOR_TYPES = ['Headgear', 'Armor', 'Garment', 'Shoes', 'Shield', 'Accessory'] as const;

// Every value that occurs in items.weapon_type after the 2026-08-31
// normalisation pass, in the order the filter shows them: the shapes a player
// thinks in first (sword, dagger, bow), then the class-locked ones.
export const WEAPON_TYPES = [
  'Dagger',
  'One-handed Sword',
  'Two-handed Sword',
  'One-handed Axe',
  'Two-handed Axe',
  'One-handed Spear',
  'Two-handed Spear',
  'Mace',
  'One-handed Staff',
  'Two-handed Staff',
  'Book',
  'Bow',
  'Arrow',
  'Katar',
  'Knuckle',
  'Whip',
  'Instrument',
  'Huuma Shuriken',
] as const;

export const TYPE_TH: Record<string, string> = {
  Headgear: 'หมวก/ศีรษะ',
  Armor: 'ชุดเกราะ',
  Garment: 'ผ้าคลุม',
  Shoes: 'รองเท้า',
  Shield: 'โล่',
  Accessory: 'เครื่องประดับ',
  Dagger: 'มีด',
  'One-handed Sword': 'ดาบมือเดียว',
  'Two-handed Sword': 'ดาบสองมือ',
  'One-handed Axe': 'ขวานมือเดียว',
  'Two-handed Axe': 'ขวานสองมือ',
  'One-handed Spear': 'หอกมือเดียว',
  'Two-handed Spear': 'หอกสองมือ',
  Mace: 'กระบอง',
  'One-handed Staff': 'คทามือเดียว',
  'Two-handed Staff': 'คทาสองมือ',
  Book: 'หนังสือ',
  Bow: 'ธนู',
  Arrow: 'ลูกธนู',
  Katar: 'คาตาร์',
  Knuckle: 'สนับมือ',
  Whip: 'แส้',
  Instrument: 'เครื่องดนตรี',
  'Huuma Shuriken': 'ชูริเคน',
};

export const CATEGORY_TH: Record<string, string> = {
  Weapon: 'อาวุธ',
  Armor: 'เกราะ/สวมใส่',
};

export interface GearRow {
  id: number;
  category: string | null;
  weapon_type: string | null;
}

/** The type to filter and label by: our column when it has one, rAthena's answer otherwise. */
export function gearType(row: GearRow): string | null {
  if (row.weapon_type) return row.weapon_type;
  return filled[String(row.id)]?.type ?? null;
}

/** Weapon or Armor, with the two rows our table files under the wrong one corrected. */
export function gearCategory(row: GearRow): string | null {
  return filled[String(row.id)]?.category ?? row.category;
}

/** Which half of the filter a type belongs to. */
export function categoryOfType(type: string): 'Weapon' | 'Armor' {
  return (ARMOR_TYPES as readonly string[]).includes(type) ? 'Armor' : 'Weapon';
}

export function typesFor(category: string): readonly string[] {
  if (category === 'Armor') return ARMOR_TYPES;
  if (category === 'Weapon') return WEAPON_TYPES;
  return [];
}

/** Rows whose slot no source could establish -- 5 of 876, and they stay listed. */
export const UNTYPED_ROWS: number[] = (file as { _meta: { stillUnknown: { id: number }[] } })._meta.stillUnknown.map((u) => u.id);

export const SLOTS_FILLED = Object.keys(filled).length;
