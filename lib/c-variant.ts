// Challenge-dungeon clones ("C1 Yoyo" ... "C9 ..."): 159 monsters whose
// name_en starts with C<digit><space>. Verified against the full table —
// every C-variant matches this prefix and nothing else does, so the same
// pattern drives both the SQL filter and the per-row class.
export const C_VARIANT_SQL_NOT_LIKE = 'C_ %';

export function isCVariant(name: string | null | undefined): boolean {
  return !!name && /^C\d /.test(name);
}

// Memorial-dungeon variants ("Orc Warrior Mj", "Hode Mj"): 16 monsters whose
// name ends in " Mj". Unlike the Challenge clones these are genuinely
// different monsters -- an Orc Warrior is level 52 and its Mj is 62 -- but
// they are the same creature met somewhere else, so they double the list for
// anyone browsing it. Checked against the whole table on 7 Sep 2026: exactly
// these 16 end in " Mj" and no other name contains "mj" at all, so one
// pattern drives both the SQL filter and the per-row check.
export const MJ_VARIANT_SQL_NOT_LIKE = '% Mj';

export function isMjVariant(name: string | null | undefined): boolean {
  return !!name && / Mj$/.test(name);
}
