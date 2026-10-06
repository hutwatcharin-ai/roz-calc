// Ranking the monsters that drop an item by how fast a player actually gets
// it (owner, 6 Oct 2026: "the drop finder looks plain"). The drop rate alone
// put a 1% monster with two of its kind on the map above a 0.5% one with
// sixty. The score here is items per full clear of the best map:
//
//   perClear = rate% / 100 × (how many of that monster the map holds)
//
// using the map with the most of it that is open on Global. A monster found
// only on maps not open yet goes to the end, and one whose spawn count we do
// not know ranks by its rate after every monster we can score.

export interface DropRowIn {
  monster_id: number;
  rate: number | null;
}

export interface SpawnIn {
  monster_id: number;
  map_code: string;
  map_name: string | null;
  amount: number | null;
}

export interface BestMap {
  code: string;
  name: string;
  amount: number | null;
}

export interface RankedDrop<T extends DropRowIn> {
  row: T;
  /** The open map with the most of this monster; null when it spawns nowhere open. */
  best: BestMap | null;
  /** Items per full clear of `best`; null without a rate or a count. */
  perClear: number | null;
  /** Kills for one item on average (100 / rate), rounded up. */
  killsPerItem: number | null;
  /** Every map it spawns on is closed (or it spawns nowhere). */
  closed: boolean;
}

export function rankDrops<T extends DropRowIn>(rows: T[], spawns: SpawnIn[], isClosed: (map: string) => boolean): RankedDrop<T>[] {
  // A map can hold a monster in several spawn groups (several rows); what
  // the player meets is their sum. A null count stays unknown for that map.
  const byMonster = new Map<number, SpawnIn[]>();
  for (const s of spawns) {
    const list = byMonster.get(s.monster_id) ?? [];
    const same = list.find((x) => x.map_code === s.map_code);
    if (same) same.amount = same.amount === null || s.amount === null ? null : same.amount + s.amount;
    else list.push({ ...s });
    byMonster.set(s.monster_id, list);
  }
  const ranked = rows.map((row) => {
    const open = (byMonster.get(row.monster_id) ?? []).filter((s) => !isClosed(s.map_code));
    // Most of the monster first; a known count beats an unknown one.
    open.sort((a, b) => (b.amount ?? -1) - (a.amount ?? -1) || a.map_code.localeCompare(b.map_code));
    const top = open[0];
    const best = top ? { code: top.map_code, name: top.map_name ?? top.map_code, amount: top.amount } : null;
    const rate = row.rate ?? null;
    return {
      row,
      best,
      perClear: rate !== null && best?.amount ? (rate / 100) * best.amount : null,
      killsPerItem: rate !== null && rate > 0 ? Math.ceil(100 / rate) : null,
      closed: open.length === 0,
    };
  });
  const tier = (r: RankedDrop<T>) => (r.closed ? 2 : r.perClear === null ? 1 : 0);
  return ranked.sort(
    (a, b) =>
      tier(a) - tier(b) ||
      (b.perClear ?? 0) - (a.perClear ?? 0) ||
      (b.row.rate ?? -1) - (a.row.rate ?? -1) ||
      a.row.monster_id - b.row.monster_id,
  );
}
