// Formatting and tags every farm view shares, so "โจมตีก่อน 2 ชนิด" and
// "ดรอปหักครึ่ง" read the same on every tab.

import { SKILL_RISK_LABELS, SKILL_RISK_WHY } from '@/lib/afk-safety';
import type { RankedMap } from '@/lib/farm-engine/rank';
import type { CardFigure, CardTag } from './MapCard';

export const whole = (n: number) => Math.round(n).toLocaleString('en-US');
/** Small amounts keep a decimal so 0.4z does not read as nothing. */
export const small = (n: number) => (n >= 100 ? whole(n) : n.toFixed(1));

export const mobsFigure = (map: RankedMap): CardFigure => ({ label: 'มอน', value: String(map.mobs), unit: ' ตัว' });

export function mapCardTags(map: RankedMap): CardTag[] {
  const tags: CardTag[] = [];
  if (map.dropTags.includes('unconfirmed')) {
    tags.push({
      tone: 'warn',
      text: 'ดรอปช่วงเลเวลนี้ยังไม่ยืนยัน',
      title: 'มอนหลักห่างจากเลเวลคุณ 20–40 เลเวล เกมไม่ได้บอกว่าหักดรอปเท่าไร ตัวเลขนี้คิดเต็ม',
    });
  }
  if (map.dropTags.includes('halved')) {
    tags.push({ tone: 'info', text: 'ดรอปหักครึ่ง', title: 'มอนที่ห่างจากเลเวลคุณเกิน 40 เลเวลดรอปครึ่งเดียว ตัวเลขหักให้แล้ว' });
  }
  if (map.tags.aggressiveKinds > 0) {
    tags.push({ tone: 'warn', text: `โจมตีก่อน ${map.tags.aggressiveKinds} ชนิด`, title: 'ชนิดของมอนในแมพนี้ที่เดินเข้ามาตีเอง' });
  }
  for (const { risk, names } of map.tags.risks) {
    tags.push({ tone: 'warn', text: SKILL_RISK_LABELS[risk], title: `${names.join(', ')} — ${SKILL_RISK_WHY[risk]}` });
  }
  return tags;
}

/** The monster that took out the most maps, for an empty list's explanation. */
export function commonestBlocker(blocked: RankedMap[]): string | null {
  const counts = new Map<string, number>();
  for (const map of blocked) for (const b of map.blockers ?? []) counts.set(b.name, (counts.get(b.name) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}
