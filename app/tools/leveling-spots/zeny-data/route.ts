// The zeny mode's data, built on the server and fetched by the browser when
// someone opens that mode -- the same lazy pattern as the AFK mode, so the
// other modes never pay for five tables they do not read.
//
// It is a route rather than a browser query because two of its inputs only
// exist server-side: the map pictures are found by reading public/ on disk
// (lib/map-image), and the channel folding needs the canonical map rule.
// The player's numbers never reach here; the ranking runs in the browser.

import { supabaseBrowser } from '@/lib/supabase';
import { fetchAllRows } from '@/lib/fetch-all-rows';
import { getMapCanonical } from '@/lib/map-canonical';
import { mapImage } from '@/lib/map-image';
import { isCVariant } from '@/lib/c-variant';
import { mapDisplayName } from '@/lib/npcs';
import { walkInReason, zenyPerKill, type ZenyData, type ZenyMonster } from '@/lib/zeny-farm';

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = supabaseBrowser();

  const [drops, items, monsters, spawns, names, canonical] = await Promise.all([
    fetchAllRows<{ monster_id: number; item_id: number; rate: number | null }>((from, to) =>
      db.from('monster_drops').select('monster_id, item_id, rate').order('monster_id').order('item_id').range(from, to),
    ),
    fetchAllRows<{ id: number; name_en: string; sell_price: number | null; icon_url: string | null; category: string | null }>(
      (from, to) => db.from('items').select('id, name_en, sell_price, icon_url, category').order('id').range(from, to),
    ),
    fetchAllRows<{
      id: number;
      name_en: string;
      level: number | null;
      hp: number | null;
      image_url: string | null;
      is_mvp: boolean | null;
      is_aggressive: boolean | null;
      flee_95: number | null;
      hit_100: number | null;
    }>((from, to) =>
      db
        .from('monsters')
        .select('id, name_en, level, hp, image_url, is_mvp, is_aggressive, flee_95, hit_100')
        .order('id')
        .range(from, to),
    ),
    fetchAllRows<{ id: number; map_code: string; monster_id: number; amount: number | null }>((from, to) =>
      db.from('monster_spawns').select('id, map_code, monster_id, amount').order('id').range(from, to),
    ),
    fetchAllRows<{ map_code: string; map_display_name: string | null }>((from, to) =>
      db.from('map_stats').select('map_code, map_display_name').order('map_code').range(from, to),
    ),
    getMapCanonical(),
  ]);

  // A partial read would rank a partial world with a straight face; the
  // browser shows a retry instead.
  const failed = [drops, items, monsters, spawns, names].find((result) => result.error);
  if (failed || canonical.failed) {
    console.error('zeny data query failed', failed?.error ?? 'map canonical');
    return Response.json({ failed: true }, { status: 503, headers: { 'cache-control': 'no-store' } });
  }

  const itemById = new Map((items.data ?? []).map((item) => [item.id, item]));
  const monsterById = new Map((monsters.data ?? []).filter((m) => !isCVariant(m.name_en)).map((m) => [m.id, m]));
  const nameOf = new Map((names.data ?? []).map((row) => [row.map_code, row.map_display_name]));

  // Largest count of each monster anywhere: 1 means every spawn point holds a
  // single one, which is how mini-bosses (Dragon Fly, Eclipse, Vocal) spawn.
  const largestAnywhere = new Map<number, number>();
  for (const spawn of spawns.data ?? []) {
    const amount = spawn.amount ?? 1;
    largestAnywhere.set(spawn.monster_id, Math.max(largestAnywhere.get(spawn.monster_id) ?? 0, amount));
  }

  // Channel copies hold the same monsters in the same numbers, so folding
  // takes the largest count, never the sum: adding gef_f10_a to _b to _z once
  // put 1,848 Lunatics on a field that holds about 500.
  const folded = new Map<string, Map<number, number>>();
  for (const spawn of spawns.data ?? []) {
    if (!monsterById.has(spawn.monster_id)) continue;
    const code = canonical.byCode[spawn.map_code] ?? spawn.map_code;
    if (walkInReason(code) || walkInReason(spawn.map_code)) continue;
    const byMonster = folded.get(code) ?? new Map<number, number>();
    byMonster.set(spawn.monster_id, Math.max(byMonster.get(spawn.monster_id) ?? 0, spawn.amount ?? 1));
    folded.set(code, byMonster);
  }

  const dropsByMonster = new Map<number, { item_id: number; rate: number | null }[]>();
  for (const drop of drops.data ?? []) {
    const list = dropsByMonster.get(drop.monster_id) ?? [];
    list.push(drop);
    dropsByMonster.set(drop.monster_id, list);
  }

  const out: Record<number, ZenyMonster> = {};
  for (const byMonster of folded.values()) {
    for (const id of byMonster.keys()) {
      if (out[id]) continue;
      const row = monsterById.get(id);
      if (!row) continue;
      const rows = dropsByMonster.get(id) ?? [];
      const { perKill, unpriced } = zenyPerKill(
        rows.map((drop) => ({ itemId: drop.item_id, rate: drop.rate, sellPrice: itemById.get(drop.item_id)?.sell_price ?? null })),
      );
      const priced = rows
        .map((drop) => ({ drop, item: itemById.get(drop.item_id) }))
        .filter((entry) => entry.drop.rate !== null && (entry.item?.sell_price ?? 0) > 0);
      const bestEntry = priced.reduce<(typeof priced)[number] | null>(
        (best, entry) =>
          !best || (entry.drop.rate as number) * (entry.item?.sell_price as number) > (best.drop.rate as number) * (best.item?.sell_price as number)
            ? entry
            : best,
        null,
      );
      out[id] = {
        id,
        name: row.name_en,
        level: row.level,
        hp: row.hp && row.hp > 0 ? row.hp : null,
        sprite: row.image_url,
        isMvp: row.is_mvp === true,
        solo: (largestAnywhere.get(id) ?? 0) <= 1,
        isAggressive: row.is_aggressive,
        flee95: row.flee_95,
        hit100: row.hit_100,
        drops: priced.map((entry) => ({ rate: entry.drop.rate as number, sell: entry.item?.sell_price as number })),
        unpriced,
        perKill,
        best: bestEntry
          ? {
              name: bestEntry.item?.name_en ?? `#${bestEntry.drop.item_id}`,
              icon: bestEntry.item?.icon_url ?? null,
              category: bestEntry.item?.category ?? null,
              value: ((bestEntry.drop.rate as number) / 100) * (bestEntry.item?.sell_price as number),
            }
          : null,
      };
    }
  }

  const all = Object.values(out);
  const data: ZenyData = {
    monsters: out,
    maps: [...folded].map(([code, byMonster]) => ({
      code,
      name: nameOf.get(code) ?? mapDisplayName(code) ?? code,
      image: mapImage(code)?.src ?? null,
      spawns: [...byMonster].map(([id, amount]) => ({ id, amount })),
    })),
    excluded: {
      mvp: all.filter((m) => m.isMvp).length,
      solo: all.filter((m) => !m.isMvp && m.solo).length,
    },
    coverage: {
      pricedItems: (items.data ?? []).filter((item) => (item.sell_price ?? 0) > 0).length,
      totalItems: (items.data ?? []).length,
      ratedDrops: (drops.data ?? []).filter((drop) => drop.rate !== null).length,
      totalDrops: (drops.data ?? []).length,
    },
  };

  return Response.json(data, { headers: { 'x-robots-tag': 'noindex' } });
}
