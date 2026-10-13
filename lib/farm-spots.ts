// "ฟาร์มที่ไหนดี" on an item, gear or card page (13 Oct 2026). The dropper
// list says who drops the thing and at what rate; this says where to stand:
// the open map with the most of each dropper, how many kills one piece takes
// on average, and how many pieces a full clear of that map gives.
//
// The ranking is /drop-finder's (lib/drop-rank). Champion monsters are left
// out: they replace an ordinary spawn at random, so no map "has" a number of
// them. A dropper found only on maps not open yet is counted, not listed, so
// the box can say the item is not farmable today instead of saying nothing.

import { rankDrops, type SpawnIn } from '@/lib/drop-rank';
import { isCVariant } from '@/lib/c-variant';

export interface FarmDropper {
  monster_id: number;
  name: string;
  level: number | null;
  rate: number | null;
}

export interface FarmSpot {
  monster: { id: number; name: string; level: number | null };
  map: { code: string; name: string };
  /** How many of the monster the map holds; null when the count is unknown. */
  amount: number | null;
  rate: number | null;
  /** Average kills for one piece (100 / rate, rounded up); null without a rate. */
  killsPerItem: number | null;
  /** Pieces per full clear of the map; null without a rate or a count. */
  perClear: number | null;
}

export interface FarmSpots {
  spots: FarmSpot[];
  /** Droppers that only live on maps not open on Global yet. */
  closedOnly: number;
}

export function farmSpots(droppers: FarmDropper[], spawns: SpawnIn[], isClosed: (map: string) => boolean, limit = 3): FarmSpots {
  const rows = droppers.filter((d) => !isCVariant(d.name));
  const ranked = rankDrops(rows, spawns, isClosed);
  const spots = ranked
    .filter((r) => !r.closed && r.best)
    .slice(0, limit)
    .map((r) => ({
      monster: { id: r.row.monster_id, name: r.row.name, level: r.row.level },
      map: { code: r.best!.code, name: r.best!.name },
      amount: r.best!.amount,
      rate: r.row.rate,
      killsPerItem: r.killsPerItem,
      perClear: r.perClear,
    }));
  // "Closed only" means it spawns somewhere, just nowhere open; a monster with
  // no spawn row at all (an instance boss, a summon) is simply unknown.
  const spawnsOf = new Set(spawns.map((s) => s.monster_id));
  const closedOnly = ranked.filter((r) => r.closed && spawnsOf.has(r.row.monster_id)).length;
  return { spots, closedOnly };
}
