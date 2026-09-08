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

// The AFK verdict (7 Sep 2026, replacing "dies in one hit"). The old gate
// let through only monsters with HP under one hit of damage, which for any
// real character is the Lv 1-25 shelf, however strong the numbers typed in.
// The user's own definition of safe: "I dodge it, I hit it, I can farm all
// night". The first two are computable from midgardhub's thresholds; the
// third is not (no monster attack speed in the data), so it is stood in for
// by a short fight -- at most N hits -- and the page says so.

export type AfkStyle = 'melee' | 'magic';

export type AfkFail =
  | 'dodge' // the monster lands on us more often than the cap
  | 'hit' // we land on it under 80% (melee only; magic never misses)
  | 'hits' // takes more hits than the cap
  | 'unknown_hp' // hp is the importer's 0/"???" marker
  | 'unknown_flee' // no flee_95 for this monster: cannot judge, so not safe
  | 'unknown_hit'; // no hit_100 (melee): same

export const AFK_FAIL_LABELS: Record<AfkFail, string> = {
  dodge: 'มันตีเราโดนบ่อยเกิน',
  hit: 'เราตีมันไม่ค่อยโดน',
  hits: 'ต้องตีหลายทีเกิน',
  unknown_hp: 'ไม่มีค่า HP',
  unknown_flee: 'ไม่มีค่า FLEE ของมอน',
  unknown_hit: 'ไม่มีค่า HIT ของมอน',
};

export interface AfkRuleInput {
  style: AfkStyle;
  monster: {
    hp: number | null;
    flee95: number | null;
    hit100: number | null;
    isAggressive: boolean | null;
    /** Aggressive monster kinds on the map we would stand on; null = unknown. */
    mapAggroCount: number | null;
  };
  me: {
    flee: number;
    /** Required for melee, ignored for magic. */
    hit: number | null;
    damagePerHit: number;
  };
  /** Most hits (casts) a kill may take. */
  maxHits: number;
}

export interface AfkVerdict {
  ok: boolean;
  fails: AfkFail[];
  /** % chance the monster's attack lands on us. */
  theirHitPct: number | null;
  /** % chance our attack lands. 100 for magic. */
  myHitPct: number | null;
  /** Hits (casts) to kill, or null when HP is unknown. */
  hits: number | null;
  /** The dodge cap this monster was held to: 10 (strict) or 20. */
  dodgeCap: number;
}

// One in five for a monster that waits to be hit; one in ten when it comes
// to us, when its neighbours do, or when we cast (a landed hit breaks the
// cast, so a hit costs the whole round, not a sliver of HP).
export const DODGE_CAP_RELAXED = 20;
export const DODGE_CAP_STRICT = 10;
export const MY_HIT_FLOOR = 80;
export const DEFAULT_MAX_HITS = 5;

function theirChance(flee95: number, myFlee: number): number {
  return Math.min(100, Math.max(5, 5 + flee95 - myFlee));
}
function myChance(myHit: number, hit100: number): number {
  return Math.min(100, Math.max(5, 100 + myHit - hit100));
}

export function afkVerdict(input: AfkRuleInput): AfkVerdict {
  const { style, monster, me, maxHits } = input;
  const fails: AfkFail[] = [];
  // Not `=== true`: a monster whose flag we do not have is held to the strict
  // cap, the same as a known aggressive one. A missing threshold has always
  // failed here rather than passed, and the aggression flag is a threshold.
  const strict = style === 'magic' || monster.isAggressive !== false || (monster.mapAggroCount ?? 0) > 0;
  const dodgeCap = strict ? DODGE_CAP_STRICT : DODGE_CAP_RELAXED;

  let theirHitPct: number | null = null;
  if (monster.flee95 == null) fails.push('unknown_flee');
  else {
    theirHitPct = theirChance(monster.flee95, me.flee);
    if (theirHitPct > dodgeCap) fails.push('dodge');
  }

  let myHitPct: number | null = null;
  if (style === 'magic') myHitPct = 100;
  else if (monster.hit100 == null || me.hit == null) fails.push('unknown_hit');
  else {
    myHitPct = myChance(me.hit, monster.hit100);
    if (myHitPct < MY_HIT_FLOOR) fails.push('hit');
  }

  let hits: number | null = null;
  if (monster.hp == null || !Number.isFinite(monster.hp) || monster.hp <= 0) fails.push('unknown_hp');
  else if (!Number.isFinite(me.damagePerHit) || me.damagePerHit <= 0) fails.push('unknown_hp');
  else {
    hits = Math.ceil(monster.hp / me.damagePerHit);
    if (hits > maxHits) fails.push('hits');
  }

  return { ok: fails.length === 0, fails, theirHitPct, myHitPct, hits, dodgeCap };
}
