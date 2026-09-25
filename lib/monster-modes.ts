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

/** What each flag means and what a player does about it -- shown on the
 *  monster list next to the นิสัย filter (it was a guide page for a day;
 *  the owner wanted it where the monsters are). */
export const MODE_GUIDE: Record<ModeFilter, { meaning: string; why: string }> = {
  assist: { meaning: BEHAVIOUR_LABELS.assist.title, why: 'ตีตัวเดียวแล้วโดนทั้งฝูง เลือกจุดที่ตัวอื่นอยู่ห่าง หรือเตรียมรับหลายตัว' },
  castSensor: { meaning: BEHAVIOUR_LABELS.castSensor.title, why: 'สายเวทเจอตัวพวกนี้ต้องยืนให้ไกลกว่าระยะที่มันเห็น หรือฆ่าให้ทันก่อนมันถึงตัว' },
  detector: { meaning: BEHAVIOUR_LABELS.detector.title, why: 'Hiding / Cloaking หนีตัวพวกนี้ไม่ได้ อย่าพึ่งสกิลซ่อนตัวใกล้มัน' },
  plant: { meaning: BEHAVIOUR_LABELS.plant.title, why: 'ดาเมจไม่มีผล ใช้อาวุธเร็ว ๆ หรือสกิลที่ตีหลายครั้ง แทนสกิลตีแรงครั้งเดียว' },
  rooted: { meaning: 'ยืนอยู่กับที่ ไม่เดินตาม ตีจากระยะไกลได้โดยไม่โดนไล่', why: 'เหมาะกับสายระยะไกลและสายเวท ยืนตีจากนอกระยะได้เรื่อย ๆ' },
  mini: { meaning: 'บอสตัวเล็ก ดรอปดีกว่ามอนธรรมดา แต่ไม่ใช่ MVP', why: 'ตีได้เหมือนมอนปกติแต่แข็งกว่า ไม่มีกติกาแย่ง MVP' },
};
/** The class the badge uses for its colour, per filter key. */
export const MODE_BADGE_CLASS: Record<ModeFilter, string> = {
  assist: 'tag--assist', castSensor: 'tag--castSensor', detector: 'tag--detector', plant: 'tag--plant', rooted: 'tag--rooted', mini: 'tag--mini',
};

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
