// Challenge-dungeon clones ("C1 Yoyo" ... "C9 ..."): 159 monsters whose
// name_en starts with C<digit><space>. Verified against the full table —
// every C-variant matches this prefix and nothing else does, so the same
// pattern drives both the SQL filter and the per-row class.
export const C_VARIANT_SQL_NOT_LIKE = 'C_ %';

export function isCVariant(name: string | null | undefined): boolean {
  return !!name && /^C\d /.test(name);
}
