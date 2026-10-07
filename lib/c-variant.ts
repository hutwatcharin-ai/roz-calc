// Champion monsters: the game's C1-C5 series of a normal monster ("Swift
// Poring", internally C1_PORING). They spawn one or two at a time among the
// normal ones in fields and dungeons, with more HP, far more EXP and better
// drops (rozerodb's spawn atlas; the owner has met them in game). Our import
// filed them as "C1 Poring"; scripts/rename-champions.mjs gave them the names
// the game shows on 7 Oct 2026. 159 rows, and nothing else in the table
// starts with these words or ends in "Ringleader" (checked that day).
export const CHAMPION_TIERS = [
  { prefix: 'Swift', th: 'เร็ว' },
  { prefix: 'Solid', th: 'ถึก' },
  { prefix: 'Ringleader', th: 'หัวหน้าฝูง' },
  { prefix: 'Furious', th: 'ดุ' },
  { prefix: 'Elusive', th: 'หลบเก่ง' },
] as const;
const CHAMPION_RE = /^(Swift|Solid|Furious|Elusive) .|. Ringleader$/;

// For PostgREST: .not('name_en', C_VARIANT_SQL_OP, C_VARIANT_SQL_NOT_LIKE)
export const C_VARIANT_SQL_OP = 'like(any)';
export const C_VARIANT_SQL_NOT_LIKE = '{"Swift %","Solid %","Furious %","Elusive %","% Ringleader"}';

export function isCVariant(name: string | null | undefined): boolean {
  return !!name && CHAMPION_RE.test(name);
}

/** The normal monster's name and the tier ("Swift Poring" -> Poring, Swift), or null. */
export function championOf(name: string | null | undefined): { base: string; tier: (typeof CHAMPION_TIERS)[number] } | null {
  if (!name || !CHAMPION_RE.test(name)) return null;
  const ring = / Ringleader$/.exec(name);
  if (ring) return { base: name.slice(0, ring.index), tier: CHAMPION_TIERS[2] };
  const [prefix, ...rest] = name.split(' ');
  const tier = CHAMPION_TIERS.find((t) => t.prefix === prefix)!;
  return { base: rest.join(' '), tier };
}

// Monsters that only exist inside an instance, an event, or a memorial
// dungeon. Four families, all told apart by a marker the game puts in the
// name, all counted against the whole table on 9 Sep 2026:
//
//   " Mj" suffix   16  memorial-dungeon versions of a normal monster
//                      (an Orc Warrior is level 52, its Mj is 62)
//   "Md " prefix    8  the Poring Village memorial dungeon's own monsters
//   "Mq " prefix    7  quest-instance monsters -- every one of them has no
//   "Ztw " prefix   3  stats at all in either source, so a row for one says
//   "B " prefix     2  nothing but its name
//
// They are real monsters and keep their pages. What they must not do is
// double the list for someone browsing for a place to level, which is what
// the monster list is for -- so the list hides them behind one checkbox, and
// the checkbox says how many.
//
// The "B " prefix is the loosest of the five patterns: it would also catch a
// future monster whose name genuinely starts with a capital B and a space.
// Nothing in the table does today, and the check runs against the table when
// this list changes.
export const INSTANCE_VARIANT_SQL_NOT_LIKE = ['% Mj', 'Md %', 'Mq %', 'Ztw %', 'B %'];

export function isInstanceVariant(name: string | null | undefined): boolean {
  return !!name && (/ Mj$/.test(name) || /^(?:Md|Mq|Ztw|B) /.test(name));
}

/** The " Mj" family alone, kept because a memorial-dungeon *variant* of a
 *  normal monster is a different thing from a monster that only exists there. */
export function isMjVariant(name: string | null | undefined): boolean {
  return !!name && / Mj$/.test(name);
}
