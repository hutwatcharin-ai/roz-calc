import { supabaseBrowser } from '@/lib/supabase';
import FarmingTable from '@/components/FarmingTable';

async function getFarmingRows(minLevel: number, maxLevel: number) {
  const db = supabaseBrowser();
  const { data: stats, error } = await db
    .from('monster_farming_stats')
    .select('*')
    .gte('level', minLevel)
    .lte('level', maxLevel)
    .order('exp_per_hp', { ascending: false })
    .limit(20);

  if (error) {
    console.error('monster_farming_stats query failed', error);
    return [];
  }

  const monsterIds = (stats ?? []).map((s) => s.monster_id);
  const { data: spawns } = await db
    .from('monster_spawns')
    .select('monster_id, map_display_name')
    .in('monster_id', monsterIds);

  const spawnByMonster = new Map<number, string>();
  for (const s of spawns ?? []) {
    if (!spawnByMonster.has(s.monster_id) && s.map_display_name) {
      spawnByMonster.set(s.monster_id, s.map_display_name);
    }
  }

  return (stats ?? []).map((s) => ({ ...s, spawn: spawnByMonster.get(s.monster_id) }));
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: { level?: string; range?: string };
}) {
  const level = Number(searchParams.level ?? 50);
  const range = Number(searchParams.range ?? 10);
  const rows = await getFarmingRows(Math.max(1, level - range), level + range);

  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <h1 style={{ fontFamily: '"Chakra Petch", sans-serif', fontSize: 32 }}>
        หามอนสเตอร์คุ้มสุด สำหรับเลเวลของแก
      </h1>
      <form style={{ display: 'flex', gap: 12, margin: '20px 0' }}>
        <label>
          เลเวล{' '}
          <input className="mono" type="number" name="level" defaultValue={level} />
        </label>
        <label>
          ±<input className="mono" type="number" name="range" defaultValue={range} style={{ width: 60 }} />
        </label>
        <button type="submit">ค้นหา</button>
      </form>
      <div className="panel">
        <FarmingTable rows={rows} />
      </div>
    </main>
  );
}
