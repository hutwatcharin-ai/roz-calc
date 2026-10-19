// Formatting and tags every farm view shares, so "โจมตีก่อน 2 ชนิด" and
// "ดรอปหักครึ่ง" read the same on every tab.

import { SKILL_RISK_LABELS, SKILL_RISK_WHY } from '@/lib/afk-safety';
import type { RankedMap } from '@/lib/farm-engine/rank';
import { MAX_RUN_HOURS, type BotRun } from '@/lib/farm-engine/bot-session';
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
  // Without every monster's ATK there is no damage figure to show: saying
  // "0 potions" there would be a claim the model never made.
  if (s.blockers.some((b) => b.reason === 'unknown_atk')) {
    out.push({ label: 'เดินหามอน', value: s.walkSeconds.toFixed(1), unit: ' วิ/ตัว' });
    return out;
  }
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
    case 'one_shot':
      return `${b.name} ตีทีเดียวราว ${whole(b.damage ?? 0)} เกินเลือดเต็มหลอด`;
    case 'followers':
      return `${b.name} โจมตีก่อนแต่ติ๊กแล้วสู้ไม่ไหว ไม่ติ๊กก็ตามตีไม่เลิก (ลองตั้งวาร์ปเมื่อโดนรุม)`;
    case 'short':
      return `บอทอยู่ได้ไม่ถึงชั่วโมง เลือดกับยาก็หมด`;
  }
}

const STOP_TEXT: Record<BotRun['stop'], string> = {
  hp: 'ยาหมด',
  weight: 'กระเป๋าเต็ม',
  none: '',
};

/**
 * Potions an hour as a range: average luck to the cautious figure (a bad hour,
 * some teleports late -- lib/farm-engine/bot-session). Owner, 19 Oct 2026:
 * one optimistic number had players packing too few.
 */
export function potionRange(run: BotRun): string {
  const low = small(run.potionsPerHour);
  const high = small(run.potionsPerHourHigh);
  return low === high ? low : `${low}–${high}`;
}

/** What a bot run adds to an overnight card. */
export function botFigures(run: BotRun | null): CardFigure[] {
  if (!run) return [];
  const out: CardFigure[] = [];
  out.push(
    run.stop === 'none'
      ? { label: 'บอทอยู่ได้', value: `${MAX_RUN_HOURS}+`, unit: ' ชม.' }
      : { label: `อยู่ได้ (${STOP_TEXT[run.stop]})`, value: run.hours.toFixed(1), unit: ' ชม.' },
  );
  if (run.potionsPerHourHigh > 0) out.push({ label: 'ยาที่ใช้', value: potionRange(run), unit: ' ขวด/ชม.' });
  if (Number.isFinite(run.lootHours) && run.lootHours < MAX_RUN_HOURS) out.push({ label: 'กระเป๋าถึงที่ตั้งใน', value: run.lootHours.toFixed(1), unit: ' ชม.' });
  if (run.teleportsPerHour >= 1) out.push({ label: 'วาร์ป', value: whole(run.teleportsPerHour), unit: ' ครั้ง/ชม.' });
  return out;
}

/** "ทั้งคืน 8 ชม." or, when the bot goes home first, how long it lasted. */
export function nightLabel(run: BotRun): string {
  return run.hours < NIGHT_HOURS ? `จนบอทกลับเมือง (${run.hours.toFixed(1)} ชม.) ราว` : `ทั้งคืน ${NIGHT_HOURS} ชม. ราว`;
}

/** The bot setup page for a map, with the ticked set carried over. */
export function botSetupHref(code: string, run: BotRun | null): string {
  const q = new URLSearchParams({ map: code });
  if (run) q.set('tick', run.targets.join(','));
  return `/tools/bot-setup?${q.toString()}`;
}

/** The bot run's own warnings, as card tags. */
export function botTags(run: BotRun | null, data: { monsters: Record<number, { name: string }> }): CardTag[] {
  if (!run) return [];
  const tags: CardTag[] = [
    {
      tone: 'info',
      text: `ติ๊ก ${run.targets.map((id) => data.monsters[id]?.name ?? id).join(', ')}`,
      title: 'มอนที่ควรติ๊กในแท็บมอนสเตอร์ของบอท ชุดนี้ได้มากสุดทั้งคืน',
    },
  ];
  if (run.followers.length > 0) {
    tags.push({
      tone: 'warn',
      text: `ไม่ติ๊ก ${run.followers.map((f) => f.name).join(', ')} (ตามตี)`,
      title: 'มอนโจมตีก่อนที่ไม่ได้ติ๊ก บอทไม่สู้กลับ มันจะเดินตามตีจนกว่าบอทจะวาร์ป',
    });
  }
  if (run.spShortPerHour > 0) {
    tags.push({ tone: 'warn', text: 'SP ไม่พอวาร์ป', title: `วาร์ปด้วย Creamy ใช้ SP มากกว่าที่ฟื้นเองราว ${whole(run.spShortPerHour)} ต่อชั่วโมง` });
  }
  return tags;
}

/** The monster that took out the most maps, for an empty list's explanation. */
export function commonestBlocker(blocked: RankedMap[]): string | null {
  const counts = new Map<string, number>();
  for (const map of blocked) for (const b of map.blockers ?? []) counts.set(b.name, (counts.get(b.name) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}
