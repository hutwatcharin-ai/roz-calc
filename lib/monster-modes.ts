// Behaviour flags the monsters table has no column for -- see
// scripts/build-monster-modes.mjs for where they come from and what
// known:false means.

import file from '@/data/monster-modes.json';

/** The four flags rozerodb lacks, from rAthena (see scripts/build-rathena-modes.py);
 *  null when that id has no rAthena row. */
export type Behaviour = { assist: boolean; castSensor: boolean; detector: boolean; plant: boolean } | null;
export type MonsterModes =
  | { known: true; canMove: boolean; mini: boolean; behaviour: Behaviour }
  | { known: false; behaviour: Behaviour };

/** The in-game slang for each flag, the words players actually use. */
export const BEHAVIOUR_LABELS: Record<keyof NonNullable<Behaviour>, { label: string; title: string }> = {
  assist: { label: 'ลุม', title: 'ตีตัวหนึ่ง ตัวข้าง ๆ ชนิดเดียวกันมาช่วยรุม' },
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
