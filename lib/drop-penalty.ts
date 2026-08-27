// Drop rate versus the level gap between player and monster.
//
// Two facts are confirmed (spec 3.9, from players reporting the same thing
// across several videos): inside +/-19 there is no penalty at all, and beyond
// +/-40 drops are halved. Nothing confirms what happens in between, so this
// returns a third state instead of interpolating -- a made-up curve through the
// middle would look more precise than the evidence and would be read as a game
// value.

export type DropPenalty = 'none' | 'unknown' | 'halved';

export const NO_PENALTY_GAP = 19;
export const HALVED_GAP = 40;

export function dropPenalty(playerLevel: number, monsterLevel: number): DropPenalty {
  if (!Number.isFinite(playerLevel) || !Number.isFinite(monsterLevel)) return 'unknown';
  const gap = Math.abs(playerLevel - monsterLevel);
  if (gap <= NO_PENALTY_GAP) return 'none';
  if (gap > HALVED_GAP) return 'halved';
  return 'unknown';
}

export const DROP_PENALTY_LABELS: Record<DropPenalty, string> = {
  none: 'ดรอปเต็ม',
  unknown: 'ดรอปเท่าไรยังไม่ยืนยัน',
  halved: 'ดรอปหักครึ่ง',
};

export function dropPenaltyDetail(playerLevel: number, monsterLevel: number): string {
  const gap = Math.abs(playerLevel - monsterLevel);
  switch (dropPenalty(playerLevel, monsterLevel)) {
    case 'none':
      return `ห่างกัน ${gap} เลเวล — ในช่วง ±${NO_PENALTY_GAP} ไม่มีบทลงโทษดรอป`;
    case 'halved':
      return `ห่างกัน ${gap} เลเวล — เกิน ±${HALVED_GAP} อัตราดรอปเหลือครึ่งเดียว`;
    default:
      return (
        `ห่างกัน ${gap} เลเวล — อยู่ระหว่าง ±${NO_PENALTY_GAP} กับ ±${HALVED_GAP} ` +
        'ซึ่งยังไม่มีใครยืนยันว่าหักเท่าไร เว็บนี้จึงไม่เดาให้'
      );
  }
}
