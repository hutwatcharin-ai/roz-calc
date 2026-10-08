// Card pages by what a card does (owner, 8 Oct 2026): "การ์ดกันใบ้",
// "การ์ดตีมอนธาตุดิน", "การ์ดใส่โล่". Players search exactly those words, and
// Google sent them to the whole card list, which answers none of them.
//
// The matching reads the client's own Thai card text (data/game-items.json),
// not the structured effects: the client text exists for every card, the
// structured numbers only for some. The text is formulaic enough -- "ป้องกัน
// สถานะ Silence", "ความต้านทานต่อการโจมตี ธาตุ Earth", "เพิ่ม Damage ทางกายภาพ
// ต่อ มอนสเตอร์เผ่า Undead" -- that each topic is a pattern, and the line that
// matched is shown, so a reader sees why a card is on the page.

import file from '@/data/game-items.json';
import { ELEMENT_TH, RACE_TH } from '@/lib/monster-th';

const items = (file as unknown as { items: Record<string, { name: string; desc?: string[] }> }).items;

export interface CardTopic {
  slug: string;
  /** "การ์ดกันใบ้ (Silence)" */
  title: string;
  /** Group on the hub: กันสถานะ, กันธาตุ, ... */
  group: string;
  /** One sentence for the page and its description. */
  lead: string;
  /** The card text lines that answer the topic, or null when the card does not. */
  match: (lines: string[]) => string[] | null;
}

/** A card's Thai effect lines, without the type/slot/weight boilerplate and colour codes. */
export function cardLines(id: number): string[] {
  return (items[String(id)]?.desc ?? [])
    .map((l) => l.replace(/\^[0-9a-fA-F]{6}/g, '').trim())
    .filter((l) => l && !/^(ประเภท|ใช้กับ|น้ำหนัก)\s*:/.test(l));
}

/** The slot line the client prints ("ใช้กับ : Shield"), as the game's English word. */
export function cardSlotWord(id: number): string | null {
  for (const l of items[String(id)]?.desc ?? []) {
    const m = /ใช้กับ\s*:\s*(?:\^[0-9a-fA-F]{6})?([A-Za-z ]+)/.exec(l);
    if (m) return m[1].trim();
  }
  return null;
}

/**
 * Lines matching a pattern. The client breaks a sentence over several lines
 * ("ความต้านทานต่อการโจมตี" / "ธาตุ Earth 30%"), so each line is tried joined
 * with the next one; the pair is what is returned.
 */
function grep(lines: string[], re: RegExp): string[] | null {
  const out: string[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    const one = lines[i];
    const two = i + 1 < lines.length ? `${one} ${lines[i + 1]}` : one;
    if (re.test(one)) out.push(one);
    else if (re.test(two)) {
      out.push(two);
      i += 1;
    }
  }
  return out.length ? out : null;
}

const STATUS: [string, string, string][] = [
  ['silence', 'Silence', 'ใบ้'], ['stun', 'Stun', 'สตัน'], ['sleep', 'Sleep', 'หลับ'], ['stone', 'Stone', 'กลายเป็นหิน'],
  ['frozen', 'Frozen', 'แช่แข็ง'], ['poison', 'Poison', 'พิษ'], ['blind', 'Blind', 'ตาบอด'], ['curse', 'Curse', 'คำสาป'],
  ['confusion', 'Confusion', 'สับสน'], ['bleeding', 'Bleeding', 'เลือดไหล'],
];
const ELEMENTS = ['Neutral', 'Water', 'Earth', 'Fire', 'Wind', 'Poison', 'Holy', 'Shadow', 'Ghost', 'Undead'];
const RACES = ['Demi-Human', 'Brute', 'Undead', 'Demon', 'Insect', 'Plant', 'Formless', 'Fish', 'Angel', 'Dragon'];
const SLOTS: [string, string, string][] = [
  ['weapon', 'Weapon', 'อาวุธ'], ['armor', 'Armor', 'เสื้อ'], ['shield', 'Shield', 'โล่'], ['garment', 'Garment', 'ผ้าคลุม'],
  ['shoes', 'Footgear', 'รองเท้า'], ['headgear', 'Headgear', 'หมวก'], ['accessory', 'Accessory', 'แหวน/เครื่องประดับ'],
];
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-');
// "เพิ่ม Damage ... X" that is about the damage you deal, not the damage you take.
const dealt = (what: string) => new RegExp(`เพิ่ม Damage(?:(?!ที่ได้รับ|ได้รับ).){0,45}${what}`);
const taken = (what: string) => new RegExp(`(?:ความต้านทานต่อการโจมตี|ลด Damage)(?:(?!เพิ่ม).){0,45}${what}`);

export const CARD_TOPICS: CardTopic[] = [
  ...STATUS.map(([key, en, th]): CardTopic => ({
    slug: `guard-${key}`,
    title: `การ์ดกัน${th} (${en})`,
    group: 'กันสถานะ',
    lead: `การ์ดที่ป้องกันหรือลดโอกาสติดสถานะ${th} (${en})`,
    match: (l) => grep(l, new RegExp(`(?:ป้องกันสถานะ|ต้านทาน(?:ต่อ)?สถานะ)\\s*${en}`)),
  })),
  ...ELEMENTS.map((en): CardTopic => ({
    slug: `guard-${slug(en)}`,
    title: `การ์ดกันธาตุ${ELEMENT_TH[en]} (${en})`,
    group: 'กันธาตุ',
    lead: `การ์ดที่ลดดาเมจที่โดนจากธาตุ${ELEMENT_TH[en]} (${en})`,
    match: (l) => grep(l, taken(`ธาตุ\\s*${en}\\b`)),
  })),
  ...ELEMENTS.map((en): CardTopic => ({
    slug: `vs-${slug(en)}`,
    title: `การ์ดตีมอนธาตุ${ELEMENT_TH[en]} (${en})`,
    group: 'ตีธาตุ',
    lead: `การ์ดที่เพิ่มดาเมจใส่มอนธาตุ${ELEMENT_TH[en]} (${en})`,
    match: (l) => grep(l, dealt(`ธาตุ\\s*${en}\\b`)),
  })),
  ...RACES.map((en): CardTopic => ({
    slug: `vs-race-${slug(en)}`,
    title: `การ์ดตีเผ่า${RACE_TH[en]} (${en})`,
    group: 'ตีเผ่า',
    lead: `การ์ดที่เพิ่มดาเมจใส่มอนเผ่า${RACE_TH[en]} (${en})`,
    match: (l) => grep(l, dealt(`เผ่า\\s*${en}\\b`)),
  })),
  ...RACES.map((en): CardTopic => ({
    slug: `guard-race-${slug(en)}`,
    title: `การ์ดกันเผ่า${RACE_TH[en]} (${en})`,
    group: 'กันเผ่า',
    lead: `การ์ดที่ลดดาเมจที่โดนจากมอนเผ่า${RACE_TH[en]} (${en})`,
    match: (l) => grep(l, taken(`เผ่า\\s*${en}\\b`)),
  })),
  ...([
    ['matk', 'การ์ดเพิ่ม MATK (ความแรงเวท)', 'การ์ดที่เพิ่มพลังเวท MATK', /MATK\s*\+/],
    ['atk', 'การ์ดเพิ่ม ATK', 'การ์ดที่เพิ่มพลังโจมตี ATK', /(?<!M)ATK\s*\+/],
    ['aspd', 'การ์ดเพิ่ม ASPD (ตีเร็ว)', 'การ์ดที่เพิ่มความเร็วโจมตี', /ASPD|ความเร็ว(?:ใน)?การโจมตี/],
    ['crit', 'การ์ดเพิ่มคริ (Critical)', 'การ์ดที่เพิ่มอัตราคริหรือคริแรง', /Critical|คริ/],
    ['flee', 'การ์ดเพิ่ม FLEE (หลบ)', 'การ์ดที่เพิ่ม FLEE หรือ Perfect Dodge', /FLEE\s*\+|Perfect Dodge/],
    ['hit', 'การ์ดเพิ่ม HIT (ความแม่น)', 'การ์ดที่เพิ่ม HIT', /HIT\s*\+/],
    ['hp', 'การ์ดเพิ่ม MaxHP (เลือด)', 'การ์ดที่เพิ่ม HP สูงสุด', /MaxHP\s*\+|Max HP\s*\+/],
    ['sp', 'การ์ดเพิ่ม MaxSP', 'การ์ดที่เพิ่ม SP สูงสุด', /MaxSP\s*\+|Max SP\s*\+/],
    ['cast', 'การ์ดลดเวลาร่าย', 'การ์ดที่ลดเวลาร่ายหรือดีเลย์หลังร่าย', /ลดระยะเวลาร่าย|ลดเวลาร่าย|ดีเลย์หลังร่าย/],
  ] as [string, string, string, RegExp][]).map(([key, title, lead, re]): CardTopic => ({
    slug: key,
    title,
    group: 'เพิ่มค่า',
    lead,
    match: (l) => grep(l, re),
  })),
];

/** Slot pages are a different question ("which cards go in a shield"), answered by the slot line. */
export const SLOT_TOPICS = SLOTS.map(([key, word, th]) => ({ slug: `slot-${key}`, word, title: `การ์ดใส่${th}`, lead: `การ์ดทุกใบที่ใส่ในช่อง${th}ได้` }));

export function topicBySlug(s: string): CardTopic | (typeof SLOT_TOPICS)[number] | null {
  return CARD_TOPICS.find((t) => t.slug === s) ?? SLOT_TOPICS.find((t) => t.slug === s) ?? null;
}

/** Card ids in the client's item file. */
export function allCardIds(): number[] {
  return Object.entries(items)
    .filter(([, v]) => / Card$/.test(v.name))
    .map(([k]) => Number(k));
}

/** The cards on a topic page, each with the lines that put it there. */
export function cardsForTopic(slugName: string, ids = allCardIds()): { id: number; lines: string[] }[] {
  const t = topicBySlug(slugName);
  if (!t) return [];
  if ('word' in t) return ids.filter((id) => cardSlotWord(id) === t.word).map((id) => ({ id, lines: cardLines(id) }));
  return ids.flatMap((id) => {
    const m = t.match(cardLines(id));
    return m ? [{ id, lines: m }] : [];
  });
}

/**
 * The topic pages that exist: every topic with at least one card, plus the
 * "hits element X" ones even when empty -- people search "การ์ดตีมอนธาตุดิน",
 * and "there is none, use a Fire weapon" is the answer they need.
 */
export function publishedTopics(): { slug: string; title: string; group: string }[] {
  const ids = allCardIds();
  return [
    ...CARD_TOPICS.filter((t) => /^vs-(?!race-)/.test(t.slug) || cardsForTopic(t.slug, ids).length > 0),
    ...SLOT_TOPICS.map((t) => ({ ...t, group: 'ช่องที่ใส่' })),
  ].map((t) => ({ slug: t.slug, title: t.title, group: t.group }));
}
