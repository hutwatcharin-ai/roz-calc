// Behaviour flags the monsters table has no column for -- see
// scripts/build-monster-modes.mjs for where they come from and what
// known:false means.

import file from '@/data/monster-modes.json';

/** The four flags rozerodb lacks, from rAthena (see scripts/build-rathena-modes.py);
 *  null when that id has no rAthena row. */
export type Behaviour = { aggressive: boolean; assist: boolean; castSensor: boolean; detector: boolean; plant: boolean } | null;
export type MonsterModes =
  | { known: true; canMove: boolean; mini: boolean; behaviour: Behaviour }
  | { known: false; behaviour: Behaviour };

/** The in-game slang for each flag, the words players actually use. */
export const BEHAVIOUR_LABELS: Record<Exclude<keyof NonNullable<Behaviour>, 'aggressive'>, { label: string; title: string }> = {
  assist: { label: 'รุม', title: 'ตีตัวหนึ่ง ตัวข้าง ๆ ชนิดเดียวกันมาช่วยรุม' },
  castSensor: { label: 'ไวต่อเวท', title: 'ร่ายเวทใกล้ ๆ แล้วมันจะเข้ามาตี แม้ปกติจะไม่โจมตีก่อน' },
  detector: { label: 'มองมุด', title: 'เห็นตัวที่ Hiding / Cloaking' },
  plant: { label: 'ตีทีละ 1', title: 'โดนตีแค่ 1 ดาเมจต่อครั้ง ไม่ว่าจะแรงแค่ไหน' },
};

const FILE = file as unknown as { modes: Record<string, MonsterModes>; _meta: { rathena: { agree: number; disagree: number } } };
const MODES = FILE.modes;
/** How well rAthena agreed with rozerodb on the flag they share -- the page
 *  prints it next to the rAthena-sourced badges. */
export const modesMeta = FILE._meta;

/** null when the id is not in the export at all (e.g. a Nordfeld row). */
export function monsterModes(id: number): MonsterModes | null {
  return MODES[String(id)] ?? null;
}

/** The list page's "นิสัย" filter: which ids carry a flag. Static file, so
 *  this is a scan of ~520 entries per request, not a query. */
export const MODE_FILTERS = {
  assist: BEHAVIOUR_LABELS.assist.label,
  castSensor: BEHAVIOUR_LABELS.castSensor.label,
  detector: BEHAVIOUR_LABELS.detector.label,
  plant: BEHAVIOUR_LABELS.plant.label,
  rooted: 'ขยับไม่ได้',
  mini: 'มินิบอส',
} as const;
export type ModeFilter = keyof typeof MODE_FILTERS;

export function isModeFilter(value: string | undefined): value is ModeFilter {
  return value !== undefined && value in MODE_FILTERS;
}

export function monsterIdsWithMode(mode: ModeFilter): number[] {
  const out: number[] = [];
  for (const [id, m] of Object.entries(MODES)) {
    const hit =
      mode === 'rooted' ? m.known && !m.canMove
      : mode === 'mini' ? m.known && m.mini
      : Boolean(m.behaviour && m.behaviour[mode]);
    if (hit) out.push(Number(id));
  }
  return out;
}

/** Ids rozerodb has no aggro flag for but rAthena does, split by its value --
 *  so the list's โจมตีก่อน filter can include Poring and the plants. */
export function aggroFallbackIds(aggressive: boolean): number[] {
  const out: number[] = [];
  for (const [id, m] of Object.entries(MODES)) {
    if (!m.known && m.behaviour && m.behaviour.aggressive === aggressive) out.push(Number(id));
  }
  return out;
}
