import Link from 'next/link';
import type { Metadata } from 'next';
import PageHeader from '@/components/PageHeader';
import WorldMap from '@/components/WorldMap';
import { MAP_REGION_SEEDS } from '@/data/map-regions';
import { buildMapRegions, type SpawnRow } from '@/lib/map-regions';
import { supabaseBrowser } from '@/lib/supabase';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Interactive World Map — Ragnarok Zero',
  description: 'Interactive Ragnarok Zero world map with English region and map names, monster level ranges, aggressive spawn counts, search, pan and zoom.',
};

export default async function WorldMapPage() {
  const codes = [...new Set(MAP_REGION_SEEDS.flatMap((region) => region.mapCodes))];
  const { data, error } = await supabaseBrowser()
    .from('monster_spawns')
    .select('map_code, monsters(name_en, level, is_aggressive)')
    .in('map_code', codes);

  if (error) console.error('world map spawn query failed', error);
  const regions = buildMapRegions(MAP_REGION_SEEDS, (data ?? []) as unknown as SpawnRow[]);

  return (
    <main className="shell worldmap-page">
      <nav className="crumbs" aria-label="ตำแหน่งหน้า">
        <Link href="/database/maps">ฐานข้อมูลแมพ</Link><span className="crumbs__sep" aria-hidden="true">›</span><span className="crumbs__here">แผนที่โลก</span>
      </nav>
      <PageHeader title="Interactive World Map" lead="เลือก Region เพื่อดู Map IDs ช่วงเลเวลมอน และความอันตรายของพื้นที่" />
      {error && <p className="worldmap-page__warning">โหลดสถิติมอนสเตอร์ไม่สำเร็จชั่วคราว แต่ยังใช้แผนที่และเปิดรายชื่อพื้นที่ได้</p>}
      <WorldMap regions={regions} />
      <p className="worldmap-page__foot">แผนที่นี้เน้นพื้นที่สำคัญและกำลังเพิ่มจุดอย่างต่อเนื่อง รายการแมพที่มีมอนสเตอร์ครบทั้งหมดอยู่ที่ <Link href="/database/maps">ฐานข้อมูลแมพ →</Link></p>
    </main>
  );
}
