// Challenge-dungeon clones ("C1 Yoyo" ... "C9 ..."): 159 monsters whose
// name_en starts with C<digit><space>. Verified against the full table —
// every C-variant matches this prefix and nothing else does, so the same
// pattern drives both the SQL filter and the per-row class.
export const C_VARIANT_SQL_NOT_LIKE = 'C_ %';

export function isCVariant(name: string | null | undefined): boolean {
  return !!name && /^C\d /.test(name);
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
