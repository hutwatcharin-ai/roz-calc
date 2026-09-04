// Channel copies of one map, folded to a single page.
//
// A Zero map exists on the server several times over: gef_fild10 is Orc
// Village, and gef_f10_a and gef_f10_b are the same field on other channels --
// same name, same monsters, same spawn counts. 202 of our 497 map pages are
// copies like that, which is 118 pages of identical content sitting on
// different URLs.
//
// What is NOT a copy, and must keep its own page:
//   gef_f10_z   the same field plus an event monster (8 species, not 7)
//   b_gef_f10   the boss room -- one monster, Orc Lord
// So the grouping keys on the monster set, never on the code's shape. A future
// patch that adds a monster to one channel splits that channel back out on its
// own, which is the correct answer rather than a bug.

export interface MapRow {
  map_code: string;
  map_display_name: string | null;
}

export interface MapGroup {
  canonical: string;
  variants: string[];
}

/**
 * The code that keeps its page. Preference order, most "base" first:
 *   1. no channel suffix and no b_ prefix (gef_fild10)
 *   2. anything else, alphabetically (so the choice is stable across runs)
 */
export function canonicalOf(codes: string[]): string {
  const plain = codes.filter((c) => !/_[abz]$/.test(c) && !c.startsWith('b_'));
  const pool = plain.length > 0 ? plain : codes;
  return [...pool].sort((a, b) => a.length - b.length || a.localeCompare(b))[0];
}

/**
 * Groups maps that share a display name AND an identical monster set.
 * Maps with nothing to fold into return a group of one, so a caller can treat
 * every map the same way.
 */
export function groupMapVariants(
  maps: MapRow[],
  monstersByMap: Map<string, Set<number>>,
): MapGroup[] {
  const byKey = new Map<string, string[]>();

  for (const map of maps) {
    const species = [...(monstersByMap.get(map.map_code) ?? [])].sort((a, b) => a - b).join(',');
    // The name is part of the key as well as the species: two unrelated maps
    // can both hold nothing but Poring, and folding those together would claim
    // they are one place.
    const key = `${map.map_display_name ?? map.map_code}|${species}`;
    byKey.set(key, [...(byKey.get(key) ?? []), map.map_code]);
  }

  return [...byKey.values()].map((codes) => {
    const canonical = canonicalOf(codes);
    return { canonical, variants: codes.filter((c) => c !== canonical).sort() };
  });
}

/** variant code -> canonical code, for every code that is not already canonical. */
export function canonicalByCode(groups: MapGroup[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const group of groups) {
    for (const variant of group.variants) out[variant] = group.canonical;
  }
  return out;
}
