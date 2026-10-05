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

/** Spawns of one map: monster ids, or monster id -> how many spawn. */
export type MapSpawns = Set<number> | Map<number, number>;

const stem = (code: string) => code.replace(/_[abz]$/, '');

/**
 * Groups channel copies of one map.
 *
 * Two maps fold when they hold the same monsters and either
 *   - share a display name (gef_fild10 / gef_f10_a, both "Orc Village"), or
 *   - are the same code but for a channel suffix (b_nif / b_nif_z), or
 *   - hold two or more species in exactly the same numbers (5 Oct 2026).
 *
 * The third rule is for the Zero channel copies of a classic dungeon, which
 * the game names differently: iz_dun02 "Izlude Undersea Tunnel 3F" and
 * iz_d02_a "Undersea Cave 3F" are one map -- an NPC on the first moves you to
 * the others -- and their spawn lists match monster for monster. It needs the
 * counts: Greenwood Lake Dungeon 1F and 2F hold the same species in different
 * numbers and are different floors. One species is never enough on its own:
 * two fields that both hold only Poring are not one place.
 */
export function groupMapVariants(maps: MapRow[], monstersByMap: Map<string, MapSpawns>): MapGroup[] {
  const info = maps.map((map) => {
    const spawns = monstersByMap.get(map.map_code);
    const ids = spawns ? [...spawns.keys()].sort((a, b) => a - b) : [];
    const counted = spawns instanceof Map;
    const species = ids.join(',');
    const full = counted ? ids.map((id) => `${id}x${(spawns as Map<number, number>).get(id)}`).join(',') : species;
    return { code: map.map_code, name: map.map_display_name ?? map.map_code, species, full, counted, size: ids.length };
  });

  // Union-find over maps that share a monster set.
  const parent = info.map((_, i) => i);
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  const bySpecies = new Map<string, number[]>();
  info.forEach((m, i) => {
    // The name is part of the key for a map with no spawns: two empty maps
    // under different names must not collapse into one page.
    const key = m.size ? m.species : `|${m.name}`;
    bySpecies.set(key, [...(bySpecies.get(key) ?? []), i]);
  });
  for (const members of bySpecies.values()) {
    for (let x = 0; x < members.length; x++) {
      for (let y = x + 1; y < members.length; y++) {
        const a = info[members[x]];
        const b = info[members[y]];
        const sameCounts = a.counted && b.counted && a.full === b.full;
        if (a.name === b.name || stem(a.code) === stem(b.code) || (sameCounts && a.size >= 2)) {
          parent[find(members[x])] = find(members[y]);
        }
      }
    }
  }

  const groups = new Map<number, string[]>();
  info.forEach((m, i) => groups.set(find(i), [...(groups.get(find(i)) ?? []), m.code]));
  return [...groups.values()].map((codes) => {
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
