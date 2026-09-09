// The small permanent bonuses that come from things other than gear: joining
// a clan, resetting stats, marrying someone.
//
// Sources, and which parts have two:
//
//   Clans -- roz-global.info (mirrored 8 Sep 2026) lists the four clans, their
//   masters and their bonuses. rAthena's own data agrees on all four names and
//   masters (sql-files/main.sql) and on all four stat bonuses, quoted inside
//   the clan NPC dialogue (npc/re/other/clans.txt). Two independent sources,
//   read 9 Sep 2026.
//
//   Marriage skills -- the guide names three; rAthena's skill_db carries the
//   same three (WE_MALE "I Will Protect You", WE_FEMALE "I Look up to You",
//   WE_CALLPARTNER "I miss You") with the same effects. The guide is explicit
//   that marriage is not live on Global yet, so this describes a system that
//   is announced rather than one anybody can use today.
//
//   Stat reset price -- the guide alone. It publishes a 60-row table of
//   Zelstar prices, level 41 to 99, and that table is one rule: free through
//   level 40, one Zelstar per level above it. Every row of the table matches
//   the rule, which is why the rule is stored here and the table is not.
//
// rAthena is the general Ragnarok codebase, not Zero's server, so it can only
// corroborate; where the two disagreed the guide would win and the
// disagreement would be written down. They did not disagree.

export interface Clan {
  name: string;
  master: string;
  /** Stat bonus, as the clan NPC states it. */
  bonus: string;
}

export const CLANS: Clan[] = [
  { name: 'Sword Clan', master: 'Raffam Oranpere', bonus: 'STR +1 · VIT +1 · Max HP +30 · Max SP +10' },
  { name: 'Arch Wand Clan', master: 'Devon Aire', bonus: 'INT +1 · DEX +1 · Max HP +30 · Max SP +10' },
  { name: 'Golden Mace Clan', master: 'Berman Aire', bonus: 'INT +1 · LUK +1 · Max HP +30 · Max SP +10' },
  { name: 'Crossbow Clan', master: 'Shaam Rumi', bonus: 'DEX +1 · AGI +1 · Max HP +30 · Max SP +10' },
];

/** Where every clan master stands, for the /navi command. */
export const CLAN_MASTER_SPOT = { map: 'prt_in', x: 37, y: 112 };

/** How many characters one clan holds. */
export const CLAN_CAPACITY = 300;

export interface MarriageSkill {
  /** The name rAthena's skill_db gives it in English. */
  nameEn: string;
  effect: string;
}

export const MARRIAGE_SKILLS: MarriageSkill[] = [
  { nameEn: 'I Will Protect You', effect: 'เสีย HP ตัวเอง 10% เพื่อฟื้น HP ให้คู่ 10%' },
  { nameEn: 'I Look up to You', effect: 'เสีย SP ตัวเอง 10% เพื่อฟื้น SP ให้คู่ 10%' },
  { nameEn: 'I miss You', effect: 'วาร์ปคู่ที่ใส่แหวนคู่กันมาหาตัวเอง' },
];

/** Base level both characters need before the wedding can be booked. */
export const MARRIAGE_MIN_LEVEL = 45;

/** Resetting stats and skills is free up to here. */
export const FREE_RESET_MAX_LEVEL = 40;

/** Zelstars a reset costs at a given base level: one per level above 40. */
export function resetCost(level: number): number {
  return Math.max(0, level - FREE_RESET_MAX_LEVEL);
}
