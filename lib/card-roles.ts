// What a card is *for*, and where it goes.
//
// The cards database answers "what does this card do" one card at a time.
// The question players actually arrive with is the other way round: I want
// to stop getting frozen / I want to hit Demi-Human harder / I need my
// armour to be Holy -- which card, and does it go in my armour or my shield?
// That grouping exists on two outside sites and nowhere in Thai.
//
// The role is read out of our own items table: the client writes each card's
// effect in a small, repetitive English, so a set of patterns over that text
// is a reading of the game's own words rather than an opinion about what
// each card is worth. Cards the patterns cannot place fall into `other`
// instead of being forced into a bucket.
//
// The slot is the same idea and lives in lib/card-slot, which owned it
// first; it is re-exported here so a page that groups cards imports one
// module rather than two.

export { cardSlot, SLOT_TH, SLOT_ORDER, type CardSlot } from './card-slot';

/** The effect text, without the client's trailing Type/Equipped on/Weight block. */
export function cardEffect(description: string | null | undefined): string {
  const text = (description ?? '').split(/\n(?:Type|Class|Weight|Equipped on)\s*:/)[0];
  return text.trim();
}

export type CardRole =
  | 'armor-element'
  | 'element-resist'
  | 'status-resist'
  | 'status-inflict'
  | 'race-damage'
  | 'damage-reduce'
  | 'exp-loot'
  | 'hp-sp'
  | 'stats'
  | 'offence'
  | 'defence'
  | 'skill'
  | 'cast'
  | 'other';

/** The question each group answers, in the words players use. */
export const ROLE_TH: Record<CardRole, { title: string; asks: string }> = {
  'armor-element': { title: 'เปลี่ยนธาตุชุด', asks: 'อยากให้ชุดเป็นธาตุอะไรสักอย่าง' },
  'element-resist': { title: 'ต้านธาตุ', asks: 'โดนธาตุไหนเจ็บหนัก อยากลดลง' },
  'status-resist': { title: 'กันสถานะ', asks: 'โดนแข็ง โดนสตัน โดนมืด แล้วตายฟรี' },
  'status-inflict': { title: 'ใส่สถานะให้มอน', asks: 'อยากให้มอนแข็ง มืด หลับ ตอนเราตี' },
  'race-damage': { title: 'ตีเผ่านี้แรงขึ้น', asks: 'ไปฟาร์มเผ่าไหนประจำ' },
  'damage-reduce': { title: 'โดนตีเจ็บน้อยลง', asks: 'ยืนแทงค์ไหว อยู่ได้นานขึ้น' },
  'exp-loot': { title: 'ได้ของ/EXP เพิ่ม', asks: 'ฟาร์มเงิน ฟาร์มเลเวล' },
  'hp-sp': { title: 'เลือดกับมานา', asks: 'เลือดน้อย มานาหมดไว' },
  stats: { title: 'เพิ่มสเตตัส', asks: 'ขาดสเตตัสอีกนิดเดียวถึงจะใส่ของได้' },
  offence: { title: 'ตีแรงขึ้น', asks: 'ATK, MATK, คริ, ความเร็วตี' },
  defence: { title: 'ป้องกัน', asks: 'DEF, MDEF, หลบ' },
  skill: { title: 'ได้สกิลติดตัว', asks: 'ใช้สกิลที่อาชีพเราไม่มี' },
  cast: { title: 'ร่ายเวท', asks: 'ร่ายไม่ขาด ร่ายเร็วขึ้น' },
  other: { title: 'อื่น ๆ', asks: 'ผลเฉพาะตัว จัดกลุ่มไม่ได้' },
};

export const ROLE_ORDER: CardRole[] = [
  'armor-element',
  'element-resist',
  'status-resist',
  'race-damage',
  'damage-reduce',
  'offence',
  'defence',
  'hp-sp',
  'stats',
  'exp-loot',
  'status-inflict',
  'skill',
  'cast',
  'other',
];

const ELEMENTS = 'Neutral|Water|Earth|Fire|Wind|Poison|Holy|Shadow|Ghost|Undead';

// One pattern set per role, written against the client's own phrasing. Kept
// as a list rather than a chain of ifs because a card can honestly belong to
// several: Munak resists Petrify AND Earth, and hiding either from the
// player who needs it defeats the point of the page.
const RULES: [CardRole, RegExp][] = [
  ['armor-element', new RegExp(`Armor gains (?:${ELEMENTS})-Property|Changes? armor element|Enchants? (?:your )?Armor with`, 'i')],
  ['element-resist', new RegExp(`(?:${ELEMENTS})-Property Resistance \+`, 'i')],
  ['status-resist', /Resistance to \w+ ?\+|Completely prevents|Immun(?:e|ity)|Resistance to Frozen/i],
  ['status-inflict', /chance (?:to|of) inflict|chance to cause/i],
  ['race-damage', /(?:Physical|Magic(?:al)?) [Dd]amage (?:to|against) [\w\-, ]+ \+\d|Damage to [\w\- ]+(?:Monsters|Enemies) \+\d|Critical Rate against \w+ monsters \+/i],
  ['damage-reduce', /[Dd]amage (?:Taken |[Rr]eceived )?from [\w\- ]+ ?-\d|Reduces? damage from|Damage Taken -\d|Reflects \d+% of/i],
  ['exp-loot', /chance to (?:obtain|drop)|Drops? [\w' ]+ with a chance|may drop|EXP Gained from/i],
  ['hp-sp', /\bMax ?HP ?\+|\bMHP ?\+|\bMax ?SP ?\+|\bMSP ?\+|\bHP ?\+\d|\bSP ?\+\d|HP Recovery|SP Recovery|Recovers \d+ SP|restores? \d+ (?:HP|SP)|Restores all HP|Heal Amount \+/i],
  // `LUK + 1` and `LUK +1` are both in the client's text, so the spaces have
  // to be optional on both sides of the sign.
  ['stats', /\b(?:STR|AGI|VIT|INT|DEX|LUK)\s*[+-]\s*\d/i],
  ['offence', /\bATK ?\+|\bMATK ?\+|Critical (?:Rate|Damage) ?\+|\bCRIT ?\+|\bHIT ?(?:Rate )?\+|ASPD|Attack Delay|Raises MATK|Physical Damage \+\d|size penalties|splash attacks|Ignores the DEF/i],
  ['defence', /\bDEF ?\+|\bMDEF ?\+|FLEE(?: Rate)? ?\+|Perfect Dodge ?\+|never destroyed|not damaged/i],
  // Not `[^.]`: the skill level is written "Lv.1", so a dot appears inside
  // the very phrase this is looking for.
  ['skill', /\[[^\]]+\][^\n]{0,30}can be used|autocast|Casts? [\w ]+ Lv|Grants continuous \[/i],
  ['cast', /Casting cannot be interrupted|Casting Time|SP cost of skills/i],
];

/** Every role the card's own effect text puts it in, in display order. */
export function cardRoles(description: string | null | undefined): CardRole[] {
  const text = cardEffect(description);
  if (!text) return ['other'];
  const hits = RULES.filter(([, re]) => re.test(text)).map(([role]) => role);
  if (hits.length === 0) return ['other'];
  return ROLE_ORDER.filter((r) => hits.includes(r));
}
