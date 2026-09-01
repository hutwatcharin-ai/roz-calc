import Link from 'next/link';
import type { Metadata } from 'next';
import PageHeader from '@/components/PageHeader';
import WorldMap from '@/components/WorldMap';
import { buildWorldMapEntries, WORLD_MAP_CODES, WORLD_MAP_REGIONS, type WorldMapSpawnRow } from '@/lib/world-map';
import { supabaseBrowser } from '@/lib/supabase';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'แผนที่โลก Ragnarok Zero',
  description: 'Explore 102 Ragnarok Zero map tiles with English map names, monster previews, level ranges, aggressive spawn counts, search, pan and zoom.',
};

export default async function WorldMapPage() {
  const db = supabaseBrowser();
  const [{ data, error }, { count, error: countError }] = await Promise.all([
    db.from('monster_spawns')
      .select('map_code, map_display_name, monsters(id, name_en, level, image_url, is_aggressive)')
      .in('map_code', WORLD_MAP_CODES),
    db.from('map_stats').select('map_code', { count: 'exact', head: true }),
  ]);

  if (error) console.error('world map spawn query failed', error);
  if (countError) console.error('world map count query failed', countError);
  const { tiles, dungeons } = buildWorldMapEntries((data ?? []) as unknown as WorldMapSpawnRow[]);

  return (
    <main className="shell worldmap-page">
      <nav className="crumbs" aria-label="ตำแหน่งหน้า">
        <Link href="/database/maps">ฐานข้อมูลแมพ</Link><span className="crumbs__sep" aria-hidden="true">›</span><span className="crumbs__here">Interactive World Map</span>
      </nav>
      <PageHeader title="แผนที่โลก Ragnarok Zero — Interactive World Map" lead="ชี้แต่ละช่องเพื่อดูมอนสเตอร์ทันที หรือเลือก Region เพื่อซูมไปยังพื้นที่นั้น" />
      {(error || countError) && <p className="worldmap-page__warning">โหลดสถิติบางส่วนไม่สำเร็จชั่วคราว แต่ยังค้นหาและเปิดแผนที่ได้</p>}
      <WorldMap tiles={tiles} dungeons={dungeons} regions={WORLD_MAP_REGIONS} totalMaps={count ?? 497} />
      <p className="worldmap-page__foot">World atlas แสดง 102 map IDs และ dungeon หลัก ส่วนรายการฐานข้อมูลครบทั้งหมดอยู่ที่ <Link href="/database/maps">ฐานข้อมูลแมพ →</Link></p>
    </main>
  );
}
