// Every costume a monster drops, with where to stand to farm it (owner,
// 14 Oct 2026: a page that lists them by monster or by map).
//
// Monsters drop the Bound copy of a costume, so these rows are Bound items;
// the free copy has no drop source at all (see lib/gear-detail boundTwin).
//
// A dropper whose every map is closed on Global stays out, and so does a
// costume left with no dropper: the page answers "what can I farm now", and
// the costume's own page still lists the closed ones. Challenge clones
// (C1_..C5_) stay out too -- they are not the monster a player meets on the
// plain map, and their drop list mirrors the base monster's.

export interface CostumeIn {
  id: number;
  name_en: string;
  weapon_type: string | null;
}

export interface DropIn {
  item_id: number;
  monster_id: number;
  rate: number | null;
}

export interface MonsterIn {
  id: number;
  name_en: string;
  level: number | null;
  is_mvp: boolean;
}

export interface SpawnIn {
  monster_id: number;
  map_code: string;
  map_name: string | null;
  amount: number | null;
}

export interface DropperMap {
  code: string;
  name: string;
  amount: number | null;
}

export interface Dropper {
  id: number;
  name: string;
  level: number | null;
  isMvp: boolean;
  rate: number | null;
  /** Open maps, most of this monster first. */
  maps: DropperMap[];
}

export interface CostumeDrop {
  id: number;
  name: string;
  position: string | null;
  /** Lowest level first. */
  droppers: Dropper[];
  /** Level of the easiest dropper; null when no dropper has a known level. */
  minLevel: number | null;
}

export interface MapGroup {
  code: string;
  name: string;
  entries: { costume: CostumeDrop; dropper: Dropper; amount: number | null }[];
}

export function buildCostumeDrops(opts: {
  costumes: CostumeIn[];
  drops: DropIn[];
  monsters: MonsterIn[];
  spawns: SpawnIn[];
  isClosed: (code: string) => boolean;
  isClone: (name: string) => boolean;
  /** False for a channel copy folded into another map's page. */
  isCanonical: (code: string) => boolean;
}): CostumeDrop[] {
  const monsters = new Map(opts.monsters.map((m) => [m.id, m]));

  // Monster -> open, canonical maps with the summed count of its spawn rows.
  const mapsOf = new Map<number, DropperMap[]>();
  for (const s of opts.spawns) {
    if (opts.isClosed(s.map_code) || !opts.isCanonical(s.map_code)) continue;
    const list = mapsOf.get(s.monster_id) ?? [];
    const same = list.find((m) => m.code === s.map_code);
    if (same) same.amount = same.amount === null || s.amount === null ? null : same.amount + s.amount;
    else list.push({ code: s.map_code, name: s.map_name ?? s.map_code, amount: s.amount });
    mapsOf.set(s.monster_id, list);
  }
  for (const list of mapsOf.values()) {
    list.sort((a, b) => (b.amount ?? -1) - (a.amount ?? -1) || a.code.localeCompare(b.code));
  }

  const dropsOf = new Map<number, DropIn[]>();
  for (const d of opts.drops) {
    const list = dropsOf.get(d.item_id) ?? [];
    list.push(d);
    dropsOf.set(d.item_id, list);
  }

  const out: CostumeDrop[] = [];
  for (const c of opts.costumes) {
    const droppers: Dropper[] = [];
    for (const d of dropsOf.get(c.id) ?? []) {
      const m = monsters.get(d.monster_id);
      if (!m || opts.isClone(m.name_en)) continue;
      const maps = mapsOf.get(m.id) ?? [];
      if (maps.length === 0) continue;
      if (droppers.some((x) => x.id === m.id)) continue;
      droppers.push({ id: m.id, name: m.name_en, level: m.level, isMvp: m.is_mvp, rate: d.rate, maps });
    }
    if (droppers.length === 0) continue;
    droppers.sort((a, b) => (a.level ?? 999) - (b.level ?? 999) || a.id - b.id);
    const levels = droppers.map((d) => d.level).filter((l): l is number => l !== null);
    out.push({
      id: c.id,
      name: c.name_en,
      position: c.weapon_type,
      droppers,
      minLevel: levels.length ? Math.min(...levels) : null,
    });
  }
  return out.sort((a, b) => (a.minLevel ?? 999) - (b.minLevel ?? 999) || a.name.localeCompare(b.name));
}

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

/** "OCT 2026" -> 202610; anything else (TBD) sorts last. */
export function releaseOrder(when: string | null): number {
  const m = /^([A-Z]{3}) (\d{4})$/.exec(when ?? '');
  const month = m ? MONTHS.indexOf(m[1]) : -1;
  return m && month >= 0 ? Number(m[2]) * 100 + month + 1 : 999999;
}

export interface UpcomingCostume {
  costume: CostumeDrop;
  /** Earliest month any dropper's map is due to open; null when no source names one. */
  when: string | null;
}

/**
 * Costumes whose droppers all stand on maps not open yet, with the earliest
 * month a source names. `all` is buildCostumeDrops run with nothing closed,
 * `open` the normal run; `releaseOf` reads lib/map-availability.
 */
export function upcomingCostumes(all: CostumeDrop[], open: CostumeDrop[], releaseOf: (code: string) => string | null): UpcomingCostume[] {
  const openIds = new Set(open.map((c) => c.id));
  return all
    .filter((c) => !openIds.has(c.id))
    .map((costume) => {
      const months = costume.droppers.flatMap((d) => d.maps.map((m) => releaseOf(m.code)));
      const when = months.reduce<string | null>((best, w) => (releaseOrder(w) < releaseOrder(best) ? w : best), null);
      return { costume, when: when && releaseOrder(when) < 999999 ? when : null };
    })
    .sort((a, b) => releaseOrder(a.when) - releaseOrder(b.when) || a.costume.name.localeCompare(b.costume.name));
}

/** The same rows turned around: each map and the costumes farmable on it. */
export function groupByMap(costumes: CostumeDrop[]): MapGroup[] {
  const groups = new Map<string, MapGroup>();
  for (const costume of costumes) {
    for (const dropper of costume.droppers) {
      for (const map of dropper.maps) {
        const g = groups.get(map.code) ?? { code: map.code, name: map.name, entries: [] };
        g.entries.push({ costume, dropper, amount: map.amount });
        groups.set(map.code, g);
      }
    }
  }
  for (const g of groups.values()) {
    g.entries.sort((a, b) => (a.dropper.level ?? 999) - (b.dropper.level ?? 999) || a.costume.name.localeCompare(b.costume.name));
  }
  // Maps with the most costumes on offer first.
  return [...groups.values()].sort((a, b) => b.entries.length - a.entries.length || a.code.localeCompare(b.code));
}

/** Matches a costume, a monster that drops it, or a map it drops on. */
export function matchesCostumeDrop(c: CostumeDrop, needle: string): boolean {
  const n = needle.trim().toLowerCase();
  if (!n) return true;
  if (c.name.toLowerCase().includes(n)) return true;
  return c.droppers.some(
    (d) => d.name.toLowerCase().includes(n) || d.maps.some((m) => m.code.toLowerCase().includes(n) || m.name.toLowerCase().includes(n)),
  );
}
