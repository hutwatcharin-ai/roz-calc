// How much damage a weapon type does to each monster size.
//
// Source: Ragnarok Zero's own game guide, ระบบพิเศษ > ระบบขนาด. Percentages
// exactly as the page prints them -- 100 means unchanged, 50 means half.
//
// This is the other half of the "will my weapon actually hurt this thing"
// question the element table answers. A Book against a Large monster is 50%
// before any element modifier, which is a bigger swing than most cards.
//
// One cell is disputed. rozerodb transcribed the same guide and reads Whip
// against Large as 50 where this reads 75; scripts/compare-rozerodb-tables.ts
// tracks it, and the other 59 cells agree. rAthena cannot settle it -- its
// Renewal table says 75 and its pre-Renewal table says 50, and its size_fix.yml
// lists only overrides rather than the whole matrix. Classic Ragnarok gives Whip
// and Book the same profile, which would make 50 right, but that is an argument
// from convention rather than a reading of the page, so the transcription
// stands until someone looks at the guide again.
//
// rozerodb also carries a row this table does not: Spear while mounted on a
// Peco or Gryphon, at 75 / 100 / 100. Whether the official page prints it is
// unconfirmed, so it is not invented here.

export const SIZES = ['small', 'medium', 'large'] as const;
export type MonsterSize = (typeof SIZES)[number];

export const SIZE_LABELS: Record<MonsterSize, string> = {
  small: 'เล็ก',
  medium: 'กลาง',
  large: 'ใหญ่',
};

export interface WeaponSizeRow {
  /** The name the game uses, kept in English where the guide prints English. */
  weapon: string;
  /** The guide's Thai label, for the rows it writes in Thai. */
  label: string;
  small: number;
  medium: number;
  large: number;
}

// Row order follows the guide so the table can be re-checked against it line by
// line.
export const SIZE_TABLE: WeaponSizeRow[] = [
  { weapon: 'Bare hand', label: 'มือเปล่า', small: 100, medium: 100, large: 100 },
  { weapon: 'One-Handed Sword', label: 'ดาบมือเดียว', small: 75, medium: 100, large: 75 },
  { weapon: 'Two-Handed Sword', label: 'ดาบสองมือ', small: 75, medium: 75, large: 100 },
  { weapon: 'Dagger', label: 'กริช', small: 100, medium: 75, large: 50 },
  { weapon: 'One-Handed Axe', label: 'ขวานมือเดียว', small: 50, medium: 75, large: 100 },
  { weapon: 'Two-Handed Axe', label: 'ขวานสองมือ', small: 50, medium: 75, large: 100 },
  { weapon: 'Katar', label: 'กะตาร์', small: 75, medium: 100, large: 75 },
  { weapon: 'One-Handed Staff', label: 'ไม้เท้ามือเดียว', small: 100, medium: 100, large: 100 },
  { weapon: 'Two-Handed Staff', label: 'ไม้เท้าสองมือ', small: 100, medium: 100, large: 100 },
  { weapon: 'One-Handed Mace', label: 'กระบองมือเดียว', small: 75, medium: 100, large: 100 },
  { weapon: 'Two-Handed Mace', label: 'กระบองสองมือ', small: 75, medium: 100, large: 100 },
  { weapon: 'Bow', label: 'ธนู', small: 100, medium: 100, large: 75 },
  { weapon: 'One-Handed Spear', label: 'หอกมือเดียว', small: 75, medium: 75, large: 100 },
  { weapon: 'Two-Handed Spear', label: 'หอกสองมือ', small: 75, medium: 75, large: 100 },
  { weapon: 'Fist', label: 'หมัด', small: 100, medium: 100, large: 75 },
  { weapon: 'Book', label: 'หนังสือ', small: 100, medium: 100, large: 50 },
  { weapon: 'Whip', label: 'แส้', small: 75, medium: 100, large: 75 },
  { weapon: 'Instrument', label: 'เครื่องดนตรี', small: 75, medium: 100, large: 75 },
  { weapon: 'Huuma Shuriken', label: 'ชูริเคนลม', small: 75, medium: 75, large: 100 },
  { weapon: 'Gun', label: 'ปืน', small: 100, medium: 100, large: 100 },
];

// The monsters table stores "Small" / "Medium" / "Large"; anything else is a
// value we have not seen and must not be guessed into one of the three.
export function parseSize(raw: string | null): MonsterSize | null {
  if (raw === null) return null;
  const normalised = raw.trim().toLowerCase();
  return (SIZES as readonly string[]).includes(normalised) ? (normalised as MonsterSize) : null;
}

export function sizeModifier(row: WeaponSizeRow, size: MonsterSize): number {
  return row[size];
}

/** Weapon rows sorted best-first against one size, for "what should I bring". */
export function bestWeaponsFor(size: MonsterSize): WeaponSizeRow[] {
  return [...SIZE_TABLE].sort((a, b) => b[size] - a[size] || a.weapon.localeCompare(b.weapon));
}
