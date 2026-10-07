// The build simulator's strip on the homepage (owner, 7 Oct 2026): one
// button per second job that opens /tools/build with that class's first
// guide build and a monster worth hunting at its level, so the first screen
// of the simulator already shows real numbers (hit %, dodge %, hits to kill)
// instead of an empty level-1 character.
//
// Server side and cached for a day: the presets come from the class guides
// and the targets from the same farming ranking as the homepage's "เลเวลนี้
// ตีอะไรดี" card, neither of which changes between deploys and table loads.

import { unstable_cache } from 'next/cache';
import { buildPresets } from '@/lib/build-presets';
import { EMPTY_BUILD, decodeBuild, encodeBuild, maxJobLevel, sanitizeBuild } from '@/lib/build-calc';
import { classStats } from '@/lib/class-stats';
import { C_VARIANT_SQL_NOT_LIKE, C_VARIANT_SQL_OP } from '@/lib/c-variant';
import { rankFarmRange } from '@/lib/farm-picks';
import { supabaseBrowser } from '@/lib/supabase';

export const HOME_CLASSES = ['knight', 'crusader', 'wizard', 'sage', 'hunter', 'bard', 'dancer', 'priest', 'monk', 'assassin', 'rogue', 'blacksmith', 'alchemist'] as const;

// A class with no guide build of its own borrows its first job's.
const BORROW: Record<string, string> = { hunter: 'archer' };

export interface HomeBuildClass {
  cls: string;
  name: string;
  /** /tools/build?b=...&monster=... */
  href: string;
  level: number;
  /** The target picked for that level, when the ranking found one. */
  target: string | null;
  /** Set when the build is borrowed from another class's guide. */
  note: string | null;
}

/** The best farming monster within ±5 levels, by the homepage's ranking. */
async function pickTarget(level: number): Promise<{ id: number; name: string } | null> {
  const db = supabaseBrowser();
  const { data: stats, error } = await db
    .from('monster_farming_stats')
    .select('monster_id, name_en, level, hp, base_exp, exp_per_hp, is_aggressive, image_url')
    .gte('level', Math.max(1, level - 5))
    .lte('level', level + 5)
    .not('name_en', C_VARIANT_SQL_OP, C_VARIANT_SQL_NOT_LIKE)
    .order('exp_per_hp', { ascending: false })
    .limit(200);
  if (error || !stats?.length) {
    if (error) console.error('home build: farming stats failed', error);
    return null;
  }
  const { data: spawns } = await db.from('monster_spawns').select('monster_id, map_display_name, amount').in('monster_id', stats.map((s) => s.monster_id));
  const { ranked } = rankFarmRange(
    stats.map((s) => ({
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
    1,
  );
  const top = ranked[0];
  return top ? { id: top.monsterId, name: stats.find((s) => s.monster_id === top.monsterId)?.name_en ?? '' } : null;
}

async function load(): Promise<HomeBuildClass[]> {
  const presets = buildPresets();
  const out: HomeBuildClass[] = [];
  for (const cls of HOME_CLASSES) {
    // Of a class's guide builds, the one nearest level 60, where most players
    // are; a guide's early row (Blacksmith at 13) is not what a second job is.
    const own = presets.filter((p) => p.cls === cls);
    const pool = own.length ? own : presets.filter((p) => p.cls === BORROW[cls]);
    const from = pool
      .map((p) => ({ p, lv: decodeBuild(p.b)?.lv ?? 0 }))
      .sort((a, b) => Math.abs(a.lv - 60) - Math.abs(b.lv - 60))[0]?.p;
    let build = from ? decodeBuild(from.b) : null;
    // A second job is at least level 45 here; the borrowed Archer row is a
    // level-21 one. Points left over show as unspent in the simulator.
    if (build) build = sanitizeBuild({ ...build, cls, lv: Math.max(45, build.lv), job: build.cls === cls ? build.job : maxJobLevel(cls) });
    if (!build) continue;
    const target = await pickTarget(build.lv);
    const params = new URLSearchParams({ b: encodeBuild(build) });
    if (target) params.set('monster', String(target.id));
    out.push({
      cls,
      name: classStats(cls)?.name ?? cls,
      href: `/tools/build?${params}`,
      level: build.lv,
      target: target?.name ?? null,
      note: from && from.cls !== cls ? `ยังไม่มีไกด์ ${classStats(cls)?.name ?? cls} ใช้บิลด์ ${classStats(from.cls)?.name ?? from.cls} จากไกด์แทน` : null,
    });
  }
  return out;
}

// A blank build as a link: the simulator keeps the remembered build until the
// visitor edits this one (BuildSimulator fromLink).
export const NEW_BUILD_HREF = `/tools/build?${new URLSearchParams({ b: encodeBuild(EMPTY_BUILD) })}`;

export const homeBuildClasses = unstable_cache(load, ['home-build-classes-v2'], { revalidate: 86400 });
