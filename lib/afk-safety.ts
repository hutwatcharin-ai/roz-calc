// Which monsters a player can leave the game's built-in bot on without coming
// back to a corpse (spec 3.8).
//
// The filter itself is blunt on purpose: drop every monster that attacks first,
// then keep only the ones that die to a single hit. Both come straight from the
// data. What is NOT blunt is the skill list -- a monster that never attacks
// first still fights back once the bot hits it, so its skills matter.

export type SkillRisk = 'summons' | 'locks' | 'explodes' | 'transforms';

export const SKILL_RISK_LABELS: Record<SkillRisk, string> = {
  summons: 'เรียกลูกสมุน',
  locks: 'ทำให้ขยับหรือสู้ไม่ได้',
  explodes: 'ระเบิดตัวเอง',
  transforms: 'แปลงร่าง',
};

export const SKILL_RISK_WHY: Record<SkillRisk, string> = {
  summons: 'ลูกสมุนที่เรียกมาเป็นมอนคนละตัว เว็บนี้ยังไม่ได้ตรวจว่ามันโจมตีก่อนหรือเปล่า',
  locks: 'ถ้าบอทติดสถานะจนตีไม่ได้ มันจะหยุดฆ่าแต่ยังโดนตีอยู่',
  explodes: 'ความเสียหายก้อนเดียวที่ไม่ได้มาจากการโจมตีปกติ จึงไม่เกี่ยวกับดาเมจที่คุณกรอก',
  transforms: 'กลายเป็นมอนอีกตัวที่เว็บนี้ไม่ได้ตรวจว่าโจมตีก่อนหรือเปล่า',
};

// Classified from the skill's own name in the game files -- nothing here comes
// from testing in game. A name that does not say what it does is left
// unclassified rather than guessed at: NPC_EMOTION is the clearest example,
// widely said to change a monster's mode, but our rows carry no value column to
// show it, so flagging it would be repeating a rumour as data.
const RISK_PATTERNS: ReadonlyArray<[SkillRisk, RegExp]> = [
  ['summons', /SUMMONSLAVE|CALLSLAVE/],
  ['explodes', /SELFDESTRUCTION|SUICIDE/],
  ['transforms', /METAMORPHOSIS/],
  [
    'locks',
    /STUN|SILENCE|SLEEP|PETRIFY|STONE|FREEZE|FROSTDIVER|STORMGUST|ANKLESNARE|SANDMAN|SPIDERWEB|NPC_STOP/,
  ],
];

export function skillRisk(skillName: string): SkillRisk | null {
  for (const [risk, pattern] of RISK_PATTERNS) {
    if (pattern.test(skillName)) return risk;
  }
  return null;
}

export interface RiskySkill {
  skillName: string;
  risk: SkillRisk;
}

export function riskySkills(skillNames: readonly string[]): RiskySkill[] {
  const seen = new Set<string>();
  const out: RiskySkill[] = [];
  for (const skillName of skillNames) {
    const risk = skillRisk(skillName);
    if (risk === null || seen.has(skillName)) continue;
    seen.add(skillName);
    out.push({ skillName, risk });
  }
  return out;
}

// hp of 0 is the unknown-HP marker the importer writes for a "???" feed value,
// not a monster that dies to nothing. Treating it as a one-hit kill would put
// the most dangerous rows at the top of a page about safety.
export function diesInOneHit(monsterHp: number | null, damagePerHit: number): boolean {
  if (monsterHp === null || !Number.isFinite(monsterHp) || monsterHp <= 0) return false;
  if (!Number.isFinite(damagePerHit) || damagePerHit <= 0) return false;
  return monsterHp <= damagePerHit;
}
