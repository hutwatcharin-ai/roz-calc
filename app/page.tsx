import { supabaseBrowser } from '@/lib/supabase';
import FarmingTable from '@/components/FarmingTable';
import Link from 'next/link';
import SiteStats, { getSiteStats } from '@/components/SiteStats';
import RecentlyViewed from '@/components/RecentlyViewed';
import CVariantToggle from '@/components/CVariantToggle';
import { C_VARIANT_SQL_NOT_LIKE } from '@/lib/c-variant';

export const metadata = {
  title: 'หามอนสเตอร์คุ้มสุดสำหรับเลเวลของคุณ',
  description:
    'ใส่เลเวลแล้วดูว่ามอนสเตอร์ตัวไหนให้ EXP ต่อ HP สูงสุด พร้อมฐานข้อมูลมอนสเตอร์ ไอเทม การ์ด อุปกรณ์ และเควสแปลไทยของ Ragnarok Zero Global',
};

async function getFarmingRows(minLevel: number, maxLevel: number, showC: boolean) {
  const db = supabaseBrowser();
  let query = db
    .from('monster_farming_stats')
    .select('*')
    .gte('level', minLevel)
    .lte('level', maxLevel);
  // Challenge clones dominate the EXP/HP ranking (they are inflated copies),
  // so the default ranking is the real world; ?c=1 opts them in, same rule as
  // the monster list.
  if (!showC) query = query.not('name_en', 'like', C_VARIANT_SQL_NOT_LIKE);
  const { data: stats, error } = await query.order('exp_per_hp', { ascending: false }).limit(20);

  if (error) {
    console.error('monster_farming_stats query failed', error);
    return [];
  }

  const monsterIds = (stats ?? []).map((s) => s.monster_id);
  const [{ data: spawns }, { data: accStats }] = await Promise.all([
    db.from('monster_spawns').select('monster_id, map_display_name').in('monster_id', monsterIds),
    // The REAL per-mob flee from the game files powers the hit-chance column.
    db.from('monsters').select('id, flee').in('id', monsterIds),
  ]);

  const spawnByMonster = new Map<number, string>();
  for (const s of spawns ?? []) {
    if (!spawnByMonster.has(s.monster_id) && s.map_display_name) {
      spawnByMonster.set(s.monster_id, s.map_display_name);
    }
  }

  const accById = new Map((accStats ?? []).map((m) => [m.id, m]));
  return (stats ?? []).map((s) => ({
    ...s,
    spawn: spawnByMonster.get(s.monster_id),
    flee: accById.get(s.monster_id)?.flee ?? null,
  }));
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: { level?: string; range?: string; c?: string };
}) {
  // The farming finder still lives at "/" (spec 6.2: the link people share in
  // game chat keeps working, params and all). What changed is the default
  // view: intent cards first, and the results table renders only after a
  // search -- a first-time visitor sees what the site can do, not a table
  // computed for a level they never chose.
  const searched = searchParams.level !== undefined;
  const level = Number(searchParams.level ?? 50);
  const range = Number(searchParams.range ?? 10);
  const showC = searchParams.c === '1';

  const [rows, stats] = await Promise.all([
    searched ? getFarmingRows(Math.max(1, level - range), level + range, showC) : Promise.resolve([]),
    getSiteStats(),
  ]);

  const resultsHref = (show: boolean) =>
    `/?level=${level}&range=${range}${show ? '&c=1' : ''}#results`;

  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <h1 className="pagehead__title">ตอนนี้แกติดอะไรอยู่?</h1>
      <p className="muted" style={{ marginTop: 8, maxWidth: '65ch' }}>
        ฐานข้อมูล Ragnarok Zero Global ภาษาไทย พร้อมเครื่องมือที่คิดจากค่าตัวละครของแกเอง
      </p>

      <div className="qgrid">
        {/* Card one IS the tool, not a link to it: the embedded form submits
            to this same page, so the regular player still searches from "/"
            in one step, exactly like before the redesign. */}
        <div className="qcard qcard--yellow">
          <strong>เลเวลตันแล้ว ตีอะไรดี</strong>
          <span>เดี๋ยวจัดมอนคุ้มสุดให้ พร้อมเตือนตัวที่โจมตีก่อน</span>
          <form className="qcard__form" action="/#results">
            {showC && <input type="hidden" name="c" value="1" />}
            <label>
              เลเวล{' '}
              <input className="mono" type="number" name="level" defaultValue={searched ? level : 50} inputMode="numeric" style={{ width: 80 }} />
            </label>
            <label>
              ±<input className="mono" type="number" name="range" defaultValue={range} inputMode="numeric" style={{ width: 56 }} />
            </label>
            <button type="submit" className="btn">ค้นหา</button>
          </form>
        </div>

        <div className="qcard qcard--cyan">
          <strong>อยากได้ของชิ้นนี้</strong>
          <span>พิมพ์ชื่อไอเทม บอกเลยว่ามอนตัวไหนดรอป อัตราเท่าไร</span>
          <form className="qcard__form" action="/drop-finder">
            <input type="search" name="q" placeholder="เช่น Jellopy" aria-label="ค้นชื่อไอเทม" style={{ flex: 1, minWidth: 110 }} />
            <button type="submit" className="btn">ค้นดรอป</button>
          </form>
        </div>

        <Link href="/database/equipment" className="qcard qcard--pink">
          <strong>ของชิ้นนี้ดีไหม ใส่ได้ไหม</strong>
          <span>อุปกรณ์ 1,815 ชิ้น กรองตามอาชีพ ชนิด เลเวล — การ์ดอีก 313 ใบ</span>
          <em className="qcard__go">เปิดฐานข้อมูลอุปกรณ์ →</em>
        </Link>

        <Link href="/tools/afk-finder" className="qcard qcard--cyan">
          <strong>จะนอนแล้ว ทิ้งบอทไว้ไหน</strong>
          <span>เฉพาะมอนที่ไม่โจมตีก่อนและดาเมจแกฆ่าได้หมัดเดียว พร้อมเตือนสกิลอันตราย</span>
          <em className="qcard__go">หาจุด AFK →</em>
        </Link>
      </div>

      {searched && (
        <div className="panel" id="results" style={{ marginTop: 24 }}>
          <div className="pagehead__row" style={{ alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <h2 className="pagehead__title" style={{ fontSize: 20, margin: 0 }}>
              มอนคุ้มสุดช่วงเลเวล {Math.max(1, level - range)}–{level + range}
            </h2>
            <CVariantToggle mode="nav" navShow={showC} navHrefShow={resultsHref(true)} navHrefHide={resultsHref(false)} />
          </div>
          <FarmingTable rows={rows} />
        </div>
      )}

      <RecentlyViewed />
      <SiteStats stats={stats} />

      {/* Explore row: the sections the four cards do not cover. Chips, not
          cards -- this row must stay quieter than the questions above it. */}
      <div className="explorerow">
        {/* No counts here: the live numbers sit in SiteStats right above, and
            hardcoded copies drift the day the data changes. */}
        <Link href="/database/monsters" className="chiplink">มอนสเตอร์</Link>
        <Link href="/database/quests" className="chiplink">เควสแปลไทย</Link>
        <Link href="/database/world-map" className="chiplink">แผนที่โลก</Link>
        <Link href="/database/skills" className="chiplink">สกิล</Link>
        <Link href="/tools/farm-planner" className="chiplink">แผนฟาร์ม</Link>
        <Link href="/database/maps" className="chiplink">แมพ</Link>
      </div>
    </main>
  );
}
