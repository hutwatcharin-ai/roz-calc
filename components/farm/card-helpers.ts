// Formatting and tags every farm view shares, so "โจมตีก่อน 2 ชนิด" and
// "ดรอปหักครึ่ง" read the same on every tab.

import { SKILL_RISK_LABELS, SKILL_RISK_WHY } from '@/lib/afk-safety';
import type { RankedMap } from '@/lib/farm-engine/rank';
import { NIGHT_HOURS } from '@/lib/farm-engine/types';
import type { CardFigure, CardTag } from './MapCard';

export const whole = (n: number) => Math.round(n).toLocaleString('en-US');
/** Small amounts keep a decimal so 0.4z does not read as nothing. */
export const small = (n: number) => (n >= 100 ? whole(n) : n.toFixed(1));

export const mobsFigure = (map: RankedMap): CardFigure => ({ label: 'มอน', value: String(map.mobs), unit: ' ตัว' });

/** Hours for a card: "ทั้งคืน" past the night, else one decimal. */
export const hoursText = (h: number) => (h === Infinity ? 'ไม่หมด' : h >= 100 ? '100+ ชม.' : `${h.toFixed(1)} ชม.`);

/** What the damage model adds to an overnight card: potions, the pile-on, the walk. */
export function survivalFigures(map: RankedMap): CardFigure[] {
  const s = map.survival;
  if (!s) return [];
  const out: CardFigure[] = [];
  if (s.potionsPerHour > 0) {
    out.push({ label: 'ยาที่ใช้', value: small(s.potionsPerHour), unit: ' ขวด/ชม.' });
    if (s.potionsCarried === null) out.push({ label: 'ทั้งคืนต้องมี', value: whole(s.potionsPerHour * NIGHT_HOURS), unit: ' ขวด' });
    if (s.potionCostPerHour > 0) out.push({ label: 'ค่ายา', value: `${whole(s.potionCostPerHour)}z`, unit: '/ชม.' });
  } else if (s.netDamagePerHour > 0) {
    out.push({ label: 'เลือดหมดใน', value: hoursText(s.hoursAlive) });
  } else {
    out.push({ label: 'ยาที่ใช้', value: '0', unit: ' (ฟื้นเองทัน)' });
  }
  if (s.extraAttackers >= 0.05) out.push({ label: 'โดนรุมเพิ่มเฉลี่ย', value: s.extraAttackers.toFixed(1), unit: ' ตัว' });
  out.push({ label: 'เดินหามอน', value: s.walkSeconds.toFixed(1), unit: ' วิ/ตัว' });
  return out;
}

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
  if (map.tags.bosses.length > 0) {
    tags.push({
      tone: 'warn',
      text: `มีบอสเดินอยู่ ${map.tags.bosses.length} ตัว`,
      title: `${map.tags.bosses.join(', ')} — MVP หรือมอนที่เกิดทีละตัว ไม่ได้เอามาคิดว่ารอดไหม ถ้าบอทไปเจอเข้าอาจตาย`,
    });
  }
  const s = map.survival;
  if (s && (s.assumedDelay.length > 0 || s.assumedFlee.length > 0)) {
    const parts = [];
    if (s.assumedDelay.length) parts.push(`${s.assumedDelay.join(', ')}: ไม่มีความเร็วตี ใช้ค่ากลาง`);
    if (s.assumedFlee.length) parts.push(`${s.assumedFlee.join(', ')}: ไม่มีค่า FLEE คิดว่าตีโดนทุกที`);
    tags.push({ tone: 'info', text: 'ข้อมูลมอนไม่ครบบางตัว', title: parts.join(' · ') });
  }
  return tags;
}

/** Why a map was taken out, in a line. */
export function blockerText(b: NonNullable<RankedMap['blockers']>[number]): string {
  switch (b.reason) {
    case 'dodge':
      return `${b.name} ตีคุณโดน ${b.theirHitPct}%`;
    case 'unknown_flee':
      return `${b.name} ไม่มีค่า FLEE`;
    case 'unknown_atk':
      return `${b.name} ไม่มีค่า ATK`;
    case 'burst':
      return `สู้กับ ${b.name} ทีเดียวเลือดหายราว ${whole(b.damage ?? 0)}`;
    case 'runs_out':
      return `อยู่ได้ราว ${hoursText(b.hours ?? 0)} เลือดกับยาก็หมด (${b.name} ตีเจ็บสุด)`;
    case 'interrupted':
      return `${b.name} ตีขัดร่ายจนแทบร่ายไม่ออก`;
  }
}

/** The monster that took out the most maps, for an empty list's explanation. */
export function commonestBlocker(blocked: RankedMap[]): string | null {
  const counts = new Map<string, number>();
  for (const map of blocked) for (const b of map.blockers ?? []) counts.set(b.name, (counts.get(b.name) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}
