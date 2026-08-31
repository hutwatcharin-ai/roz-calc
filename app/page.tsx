import { supabaseBrowser } from '@/lib/supabase';
import FarmingTable from '@/components/FarmingTable';
import Link from 'next/link';
import SiteStats, { getSiteStats } from '@/components/SiteStats';
import RecentlyViewed from '@/components/RecentlyViewed';

export const metadata = {
  title: 'หามอนสเตอร์คุ้มสุดสำหรับเลเวลของคุณ',
  description:
    'ใส่เลเวลแล้วดูว่ามอนสเตอร์ตัวไหนให้ EXP ต่อ HP สูงสุด เรียงอันดับให้อัตโนมัติจากมอนสเตอร์ทั้งหมดในเกม Ragnarok Zero Global',
};

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
  // Both reads start together: the stat row does not depend on the level
  // filter, so waiting for one before the other would add a round trip for
  // nothing.
  const [rows, stats] = await Promise.all([
    getFarmingRows(Math.max(1, level - range), level + range),
    getSiteStats(),
  ]);

  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <h1 className="pagehead__title">
        หามอนสเตอร์คุ้มสุด สำหรับเลเวลของแก
      </h1>
      {/* spec 6.2 keeps the farming finder AT "/" rather than moving it behind
          a landing page: the link people share in game chat stays the same and
          a returning player still lands on the tool, not on a menu. What is
          added is context around it. */}
      <p className="muted" style={{ marginTop: 8, maxWidth: '65ch' }}>
        ส่วนหนึ่งของฐานข้อมูล Ragnarok Zero Global ภาษาไทย — มอนสเตอร์ ไอเทม การ์ด อุปกรณ์ สกิล และแมพ
        พร้อมเครื่องมือที่คิดจากค่าตัวละครของคุณเอง
      </p>
      <SiteStats stats={stats} />
      {/* The three controls did not wrap, so at 320px the button sat 41px
          past the right edge -- the last thing on the site that did. */}
      <form className="filterbar" style={{ margin: '20px 0' }}>
        <label>
          เลเวล{' '}
          <input className="mono" type="number" name="level" defaultValue={level} inputMode="numeric" style={{ width: 96 }} />
        </label>
        <label>
          ±<input className="mono" type="number" name="range" defaultValue={range} inputMode="numeric" style={{ width: 72 }} />
        </label>
        <button type="submit" className="btn">ค้นหา</button>
      </form>
      <RecentlyViewed />

      <div className="panel">
        <FarmingTable rows={rows} />
      </div>

      {/* Four cards, not eight: spec 6.2 caps this row so the page does not
          turn into the link menu it deliberately is not. The element table is
          not among them because that page does not exist yet -- an entry card
          pointing at a 404 is worse than one fewer card. */}
      <div className="entrycards">
        <Link href="/drop-finder" className="entrycard">
          <strong>ค้นของดรอป</strong>
          <span>พิมพ์ชื่อไอเทม แล้วดูว่ามอนตัวไหนดรอปและอัตราเท่าไร</span>
        </Link>
        <Link href="/tools/afk-finder" className="entrycard">
          <strong>หาจุด AFK</strong>
          <span>มอนที่ไม่เข้าตีเองและตายในหมัดเดียว สำหรับปล่อยบอททิ้งไว้</span>
        </Link>
        <Link href="/tools/farm-planner" className="entrycard">
          <strong>แผนฟาร์ม</strong>
          <span>เก็บรายชื่อมอนที่ตั้งใจจะไปตี ไว้เทียบกันในหน้าเดียว</span>
        </Link>
        <Link href="/database/maps" className="entrycard">
          <strong>แมพ</strong>
          <span>ดูว่าแต่ละแมพมีมอนอะไร ระดับไหน และอันตรายแค่ไหน</span>
        </Link>
      </div>
    </main>
  );
}
