// "รายการของฉัน": the monsters a player picked, compared one at a time on
// both EXP and zeny. Never a sum -- a player stands in one place at a time.

import { canRate, dropFactor, dropTag, metOn, myHitChance, secondsPerKill, steadyPerKill, theirHitChance, type DropTag } from './basics';
import { NIGHT_HOURS, type FarmData, type FarmMonster, type PlayerInput } from './types';

export interface PlanRow {
  m: FarmMonster;
  expPerHour: number | null;
  /** Steady drops only, over a night of killing this one monster. */
  zenyPerHour: number | null;
  /** Every priced drop, after the level factor. */
  zenyPerKill: number;
  /** Melee only. */
  myHitPct: number | null;
  theirHitPct: number | null;
  dropTag: DropTag | null;
  homeMap: { code: string; name: string; aggressiveKinds: number } | null;
}

/** The walk-in map holding most of each monster; the calmer map wins a tie. */
function homeMaps(data: FarmData): Map<number, { code: string; name: string; aggressiveKinds: number; amount: number }> {
  const best = new Map<number, { code: string; name: string; aggressiveKinds: number; amount: number }>();
  for (const map of data.maps) {
    const met = metOn(map, data.monsters);
    const aggressiveKinds = met.filter((row) => row.m.isAggressive === true).length;
    for (const row of met) {
      const current = best.get(row.m.id);
      const better =
        !current ||
        row.amount > current.amount ||
        (row.amount === current.amount && aggressiveKinds < current.aggressiveKinds);
      if (better) best.set(row.m.id, { code: map.code, name: map.name, aggressiveKinds, amount: row.amount });
    }
  }
  return best;
}

export function comparePlan(
  ids: number[],
  data: FarmData,
  player: PlayerInput,
): { rows: PlanRow[]; missing: number[]; bestExp: PlanRow | null; bestZeny: PlanRow | null } {
  const homes = homeMaps(data);
  const rows: PlanRow[] = [];
  const missing: number[] = [];

  for (const id of ids) {
    const m = data.monsters[id];
    if (!m) {
      missing.push(id);
      continue;
    }
    const factor = dropFactor(player.level, m.level);
    const seconds = canRate(player) ? secondsPerKill(m, player) : null;
    const home = homes.get(id);
    rows.push({
      m,
      expPerHour: seconds !== null && m.baseExp ? (m.baseExp / seconds) * 3600 : null,
      zenyPerHour: seconds !== null ? (steadyPerKill(m, (NIGHT_HOURS * 3600) / seconds, factor) / seconds) * 3600 : null,
      zenyPerKill: m.perKill * factor,
      myHitPct: player.style === 'melee' ? myHitChance(m, player) : null,
      theirHitPct: theirHitChance(m, player),
      dropTag: dropTag(player.level, m.level),
      homeMap: home ? { code: home.code, name: home.name, aggressiveKinds: home.aggressiveKinds } : null,
    });
  }

  const bestBy = (pick: (row: PlanRow) => number | null) =>
    rows.reduce<PlanRow | null>((best, row) => {
      const value = pick(row);
      if (value === null || value <= 0) return best;
      return !best || value > (pick(best) as number) ? row : best;
    }, null);

  return { rows, missing, bestExp: bestBy((r) => r.expPerHour), bestZeny: bestBy((r) => r.zenyPerHour) };
}

/** The monsters worth most per kill among those a bot can farm on a walk-in map. */
export function topEarners(data: FarmData, limit: number, playerLevel: number | null): { m: FarmMonster; value: number }[] {
  const onMap = new Set<number>();
  for (const map of data.maps) for (const spawn of map.spawns) onMap.add(spawn.id);
  return Object.values(data.monsters)
    .filter((m) => !m.isMvp && !m.solo && m.perKill > 0 && onMap.has(m.id))
    .map((m) => ({ m, value: m.perKill * dropFactor(playerLevel, m.level) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}
