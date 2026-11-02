// Costume drops players report on the Taiwan server (twROZ) that our Global
// data lacks (owner, 2 Nov 2026). These are claims from another server, not
// Global game data: they are shown beside the Global droppers with a label,
// and never merged into monster_drops (that would say "drops on Global").
//
// A monster we have no Global record of keeps its name and says so, rather
// than being dropped from the list (owner: "put the name and say it isn't
// there yet").

import raw from '@/data/costume-drops-tw.json';

export interface TwMonster {
  /** Our monsters.id, or null when Global has no such monster. */
  id: number | null;
  /** Global English name, or null when unknown. */
  name: string | null;
  name_zh: string;
}

export interface TwReport {
  item_id: number;
  /** Global English item name. */
  name: string;
  kind: 'extra' | 'new';
  name_zh: string;
  /** Chinese name matched to the Global item by meaning, not literally. */
  guess?: boolean;
  monsters: TwMonster[];
}

export const TW_SOURCE_URL: string = raw.sourceUrl;
/** Last edit of the player sheet the reports come from. */
export const TW_SHEET_EDITED: string = raw._meta.sheet_edited;

const REPORTS = raw.reports as TwReport[];

/** All reports, in file order. */
export function twReports(): readonly TwReport[] {
  return REPORTS;
}

/** Reports for any of these item ids (a free costume and its Bound copy). */
export function twReportsFor(ids: readonly (number | null | undefined)[]): TwReport[] {
  const want = new Set(ids.filter((id): id is number => typeof id === 'number'));
  return REPORTS.filter((r) => want.has(r.item_id));
}

/** Reports naming this monster as a dropper. */
export function twReportsByMonster(monsterId: number): TwReport[] {
  return REPORTS.filter((r) => r.monsters.some((m) => m.id === monsterId));
}

/** "Hunter Fly", or the Chinese name with a note when Global has no record. */
export function twMonsterLabel(m: TwMonster): string {
  return m.name ?? m.name_zh;
}

/** 2025-10-04 -> 4 ต.ค. 2568 */
export function thaiDate(iso: string): string {
  const [y, mo, d] = iso.split('-').map(Number);
  const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  return `${d} ${months[mo - 1]} ${y + 543}`;
}
