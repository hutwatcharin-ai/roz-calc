// The farming finder behind the homepage's level search: every monster in a
// level range, ranked by lib/farm-picks. Shared by the homepage and its drafts.
import { supabaseRead } from '@/lib/supabase';
import { C_VARIANT_SQL_OP, C_VARIANT_SQL_NOT_LIKE } from '@/lib/c-variant';
import { rankFarmRange } from '@/lib/farm-picks';

export async function getFarmingRows(minLevel: number, maxLevel: number, showC: boolean) {
  const db = supabaseRead();
  let query = db
    .from('monster_farming_stats')
    .select('*')
    .gte('level', minLevel)
    .lte('level', maxLevel);
  // Challenge clones dominate the EXP/HP ranking (they are inflated copies),
  // so the default ranking is the real world; ?c=1 opts them in, same rule as
  // the monster list.
  if (!showC) query = query.not('name_en', C_VARIANT_SQL_OP, C_VARIANT_SQL_NOT_LIKE);
  // Every monster in the range, not the top 20 by ratio: the ranking needs to
  // know how many of each stand on a map before it can pick a top 20, and
  // ordering by exp_per_hp first threw that away. It used to put Eclipse first
  // at level 30 -- a monster whose busiest map holds one of it.
  const { data: stats, error } = await query.order('exp_per_hp', { ascending: false }).limit(200);

  if (error) {
    console.error('monster_farming_stats query failed', error);
    return [];
  }

  const monsterIds = (stats ?? []).map((s) => s.monster_id);
  const [{ data: spawns }, { data: accStats }] = await Promise.all([
    db.from('monster_spawns').select('monster_id, map_display_name, amount').in('monster_id', monsterIds),
    // midgardhub's hit_100 threshold (player HIT for 100%) powers the hit-chance column.
    db.from('monsters').select('id, hit_100').in('id', monsterIds),
  ]);

  const byId = new Map((stats ?? []).map((s) => [s.monster_id, s]));
  const { ranked, unplaced } = rankFarmRange(
    (stats ?? []).map((s) => ({
      monsterId: s.monster_id,
      name: s.name_en,
      level: s.level,
      hp: s.hp,
      baseExp: s.base_exp,
      expPerHp: s.exp_per_hp,
      isAggressive: s.is_aggressive,
      imageUrl: s.image_url,
    })),
    (spawns ?? []).map((s) => ({ monsterId: s.monster_id, map: s.map_display_name, amount: s.amount })),
  );

  const accById = new Map((accStats ?? []).map((m) => [m.id, m]));
  // The unplaced ones keep their place in the table but say so: this is the
  // reader's own level range, and dropping rows out of it would read as
  // missing data rather than as a ranking decision.
  return [
    ...ranked.map((r) => ({ row: byId.get(r.monsterId)!, spawn: r.bestMap, amount: r.amount })),
    ...unplaced.map((r) => ({ row: byId.get(r.monsterId)!, spawn: undefined, amount: null })),
  ].map(({ row, spawn, amount }) => ({
    ...row,
    spawn,
    spawnAmount: amount,
    hit100: accById.get(row.monster_id)?.hit_100 ?? null,
  }));
}
