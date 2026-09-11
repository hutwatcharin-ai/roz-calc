// The one payload every mode of the farm tool reads (spec:
// docs/superpowers/specs/2026-09-11-farm-tool-integration-design.md).
//
// A route rather than browser queries because two inputs only exist on the
// server: map pictures are found by reading public/ on disk, and channel
// folding needs the canonical map rule. The player's numbers never reach here.

import { supabaseBrowser } from '@/lib/supabase';
import { fetchAllRows } from '@/lib/fetch-all-rows';
import { getMapCanonical } from '@/lib/map-canonical';
import { mapImage } from '@/lib/map-image';
import { isCVariant } from '@/lib/c-variant';
import { mapDisplayName } from '@/lib/npcs';
import { riskySkills } from '@/lib/afk-safety';
import { walkInReason, zenyPerKill } from '@/lib/zeny-farm';
import { mapRelease } from '@/lib/map-availability';
import type { FarmData, FarmMonster } from '@/lib/farm-engine/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = supabaseBrowser();

  const [drops, items, monsters, spawns, names, skills, canonical] = await Promise.all([
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
      base_exp: number | null;
      image_url: string | null;
      is_mvp: boolean | null;
      is_aggressive: boolean | null;
      flee_95: number | null;
      hit_100: number | null;
    }>((from, to) =>
      db
        .from('monsters')
        .select('id, name_en, level, hp, base_exp, image_url, is_mvp, is_aggressive, flee_95, hit_100')
        .order('id')
        .range(from, to),
    ),
    fetchAllRows<{ id: number; map_code: string; monster_id: number; amount: number | null }>((from, to) =>
      db.from('monster_spawns').select('id, map_code, monster_id, amount').order('id').range(from, to),
    ),
    fetchAllRows<{ map_code: string; map_display_name: string | null }>((from, to) =>
      db.from('map_stats').select('map_code, map_display_name').order('map_code').range(from, to),
    ),
    // Paginated: well over a thousand skill rows, and PostgREST truncates
    // silently -- a short list would read as "no dangerous skills".
    fetchAllRows<{ monster_id: number; skill_name: string }>((from, to) =>
      db.from('monster_skills').select('monster_id, skill_name').order('monster_id').order('skill_name').range(from, to),
    ),
    getMapCanonical(),
  ]);

  const failed = [drops, items, monsters, spawns, names, skills].find((result) => result.error);
  if (failed || canonical.failed) {
    console.error('farm data query failed', failed?.error ?? 'map canonical');
    return Response.json({ failed: true }, { status: 503, headers: { 'cache-control': 'no-store' } });
  }

  const itemById = new Map((items.data ?? []).map((item) => [item.id, item]));
  const nameOf = new Map((names.data ?? []).map((row) => [row.map_code, row.map_display_name]));

  const skillsOf = new Map<number, string[]>();
  for (const row of skills.data ?? []) {
    const list = skillsOf.get(row.monster_id) ?? [];
    list.push(row.skill_name);
    skillsOf.set(row.monster_id, list);
  }

  const dropsOf = new Map<number, { item_id: number; rate: number | null }[]>();
  for (const drop of drops.data ?? []) {
    const list = dropsOf.get(drop.monster_id) ?? [];
    list.push(drop);
    dropsOf.set(drop.monster_id, list);
  }

  // Largest known count anywhere. A monster is solo when some spawn point
  // gives a count and none gives more than one -- how mini-bosses spawn.
  // Unknown counts say nothing either way.
  const largestKnown = new Map<number, number>();
  for (const spawn of spawns.data ?? []) {
    if (spawn.amount === null) continue;
    largestKnown.set(spawn.monster_id, Math.max(largestKnown.get(spawn.monster_id) ?? 0, spawn.amount));
  }

  const out: Record<number, FarmMonster> = {};
  for (const row of monsters.data ?? []) {
    if (isCVariant(row.name_en)) continue;
    const rows = dropsOf.get(row.id) ?? [];
    const { perKill, unpriced } = zenyPerKill(
      rows.map((drop) => ({ itemId: drop.item_id, rate: drop.rate, sellPrice: itemById.get(drop.item_id)?.sell_price ?? null })),
    );
    const priced = rows
      .map((drop) => ({ rate: drop.rate, item: itemById.get(drop.item_id), itemId: drop.item_id }))
      .filter((entry): entry is { rate: number; item: NonNullable<typeof entry.item>; itemId: number } =>
        entry.rate !== null && (entry.item?.sell_price ?? 0) > 0,
      );
    const best = priced.reduce<(typeof priced)[number] | null>(
      (top, entry) => (!top || entry.rate * (entry.item.sell_price as number) > top.rate * (top.item.sell_price as number) ? entry : top),
      null,
    );
    const known = largestKnown.get(row.id);
    out[row.id] = {
      id: row.id,
      name: row.name_en,
      level: row.level,
      hp: row.hp && row.hp > 0 ? row.hp : null,
      baseExp: row.base_exp && row.base_exp > 0 ? row.base_exp : null,
      sprite: row.image_url,
      isMvp: row.is_mvp === true,
      solo: known !== undefined && known <= 1,
      isAggressive: row.is_aggressive,
      flee95: row.flee_95,
      hit100: row.hit_100,
      drops: priced.map((entry) => ({ rate: entry.rate, sell: entry.item.sell_price as number })),
      unpriced,
      perKill,
      best: best
        ? {
            name: best.item.name_en,
            icon: best.item.icon_url,
            category: best.item.category,
            value: (best.rate / 100) * (best.item.sell_price as number),
          }
        : null,
      risks: riskySkills(skillsOf.get(row.id) ?? []),
    };
  }

  // Walk-in maps with channel copies folded: the largest known count, never
  // the sum (adding gef_f10_a, _b and _z once put 1,848 Lunatics on a field).
  const folded = new Map<string, Map<number, number | null>>();
  // Maps not open on Global yet never rank (owner, 11 Sep 2026: "show only
  // what can actually be used now"). See lib/map-availability for the sources.
  const closedCodes = new Set<string>();
  for (const spawn of spawns.data ?? []) {
    if (!out[spawn.monster_id]) continue;
    const code = canonical.byCode[spawn.map_code] ?? spawn.map_code;
    if (walkInReason(code) || walkInReason(spawn.map_code)) continue;
    if (mapRelease(code) || mapRelease(spawn.map_code)) {
      closedCodes.add(code);
      continue;
    }
    const byMonster = folded.get(code) ?? new Map<number, number | null>();
    const current = byMonster.get(spawn.monster_id) ?? null;
    const next = spawn.amount === null ? current : Math.max(current ?? 0, spawn.amount);
    byMonster.set(spawn.monster_id, next);
    folded.set(code, byMonster);
  }

  const onMap = new Set<number>();
  for (const byMonster of folded.values()) for (const id of byMonster.keys()) onMap.add(id);
  const standing = [...onMap].map((id) => out[id]);

  const data: FarmData = {
    monsters: out,
    maps: [...folded].map(([code, byMonster]) => ({
      code,
      name: nameOf.get(code) ?? mapDisplayName(code) ?? code,
      image: mapImage(code)?.src ?? null,
      spawns: [...byMonster].map(([id, amount]) => ({ id, amount })),
    })),
    excluded: {
      mvp: standing.filter((m) => m.isMvp).length,
      solo: standing.filter((m) => !m.isMvp && m.solo).length,
      closedMaps: [...closedCodes].filter((code) => !folded.has(code)).length,
    },
    coverage: {
      pricedItems: (items.data ?? []).filter((item) => (item.sell_price ?? 0) > 0).length,
      totalItems: (items.data ?? []).length,
      ratedDrops: (drops.data ?? []).filter((drop) => drop.rate !== null).length,
      totalDrops: (drops.data ?? []).length,
    },
  };

  return Response.json(data, { headers: { 'cache-control': 'public, s-maxage=3600', 'x-robots-tag': 'noindex' } });
}
