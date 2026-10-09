// Where to get each material a crafting calculator lists: the best dropper on
// a map open on Global (ranked the way /drop-finder ranks, lib/drop-rank),
// and whether an NPC shop is listed as selling it. Read at build time by the
// guide pages and handed to the client calculator as a small map.
//
// The shop flag comes from data/npc-shops.json, which is rAthena's classic
// shop layout filtered to this game's maps; its own _meta says the NPCs are
// unverified for Zero, so the calculator words it as "listed", not "sold".

import { supabaseBrowser } from '@/lib/supabase';
import { fetchAllRows } from '@/lib/fetch-all-rows';
import { rankDrops } from '@/lib/drop-rank';
import { mapRelease } from '@/lib/map-availability';
import shops from '@/data/npc-shops.json';

export interface MaterialSource {
  monster: { id: number; name: string; level: number | null } | null;
  rate: number | null;
  map: { code: string; name: string } | null;
  /** Average kills for one of the item (100 / rate, rounded up). */
  killsPerItem: number | null;
  shop: boolean;
}

const SHOP_IDS = new Set(Object.keys((shops as unknown as { items: Record<string, unknown> }).items).map(Number));

export async function materialSources(ids: number[]): Promise<Record<number, MaterialSource>> {
  const want = [...new Set(ids)];
  const out: Record<number, MaterialSource> = {};
  for (const id of want) out[id] = { monster: null, rate: null, map: null, killsPerItem: null, shop: SHOP_IDS.has(id) };
  if (!want.length) return out;

  const db = supabaseBrowser();
  const { data: drops, error } = await fetchAllRows<any>((from, to) =>
    db
      .from('monster_drops')
      .select('id, item_id, monster_id, rate, monsters(name_en, level)')
      .in('item_id', want)
      .order('id')
      .range(from, to),
  );
  if (error || !drops?.length) {
    if (error) console.error('material sources: drops failed', error);
    return out;
  }
  const monsterIds = [...new Set(drops.map((d) => d.monster_id as number))];
  const { data: spawns, error: spawnError } = await fetchAllRows<any>((from, to) =>
    db
      .from('monster_spawns')
      .select('id, monster_id, map_code, map_display_name, amount')
      .in('monster_id', monsterIds)
      .order('id')
      .range(from, to),
  );
  if (spawnError) console.error('material sources: spawns failed', spawnError);
  const spawnRows = (spawns ?? []).map((s) => ({ monster_id: s.monster_id, map_code: s.map_code, map_name: s.map_display_name, amount: s.amount }));

  for (const id of want) {
    const rows = drops
      .filter((d) => d.item_id === id)
      .map((d) => ({ monster_id: d.monster_id as number, rate: d.rate as number | null, name: d.monsters?.name_en as string, level: (d.monsters?.level ?? null) as number | null }));
    const best = rankDrops(rows, spawnRows, (code) => Boolean(mapRelease(code))).find((r) => !r.closed);
    if (!best) continue;
    out[id] = {
      ...out[id],
      monster: { id: best.row.monster_id, name: best.row.name, level: best.row.level },
      rate: best.row.rate,
      map: best.best ? { code: best.best.code, name: best.best.name } : null,
      killsPerItem: best.killsPerItem,
    };
  }
  return out;
}
