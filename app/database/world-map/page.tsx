import Link from 'next/link';
import type { Metadata } from 'next';
import PageHeader from '@/components/PageHeader';
import WorldMap from '@/components/WorldMap';
import {
  buildWorldMapEntries,
  monstersFor,
  stats,
  WORLD_MAP_CODES,
  WORLD_MAP_REGIONS,
  type WorldDungeon,
  type WorldMapEntry,
  type WorldMapSpawnRow,
} from '@/lib/world-map';
import { supabaseBrowser } from '@/lib/supabase';
import { fetchAllRows } from '@/lib/fetch-all-rows';
import { mapImage } from '@/lib/map-image';
import { mapRelease } from '@/lib/map-availability';
import { getMapCanonical } from '@/lib/map-canonical';
import { dungeonName, dungeonsByTile, type MapLinksFile } from '@/lib/world-dungeons';
import mapLinks from '@/data/map-links.json';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'แผนที่โลก Ragnarok Zero',
  description: 'Explore 102 Ragnarok Zero map tiles with English map names, monster previews, level ranges, aggressive spawn counts, every dungeon floor by floor, search, pan and zoom.',
};

const TILE_CODES = new Set(WORLD_MAP_CODES);

export default async function WorldMapPage() {
  const db = supabaseBrowser();
  const [{ data: mapRows, error: mapsError }, canonical] = await Promise.all([
    fetchAllRows<{ map_code: string; map_display_name: string | null }>((from, to) =>
      db.from('map_stats').select('map_code, map_display_name').order('map_code').range(from, to),
    ),
    getMapCanonical(),
  ]);
  if (mapsError) console.error('world map: map list failed', mapsError);
  const mapNames = new Map((mapRows ?? []).map((row) => [row.map_code, row.map_display_name ?? row.map_code]));

  // Dungeons come from the game's warp table, not a hand-kept list: every one
  // a tile opens into, every floor (lib/world-dungeons).
  const byTile = dungeonsByTile(
    mapLinks as unknown as MapLinksFile,
    TILE_CODES,
    new Set(mapNames.keys()),
    (code) => canonical.byCode[code] ?? code,
  );
  const floorCodes = [...new Set([...byTile.values()].flat().flatMap((d) => d.floors.map((f) => f.code)))];

  const { data, error } = await fetchAllRows<any>((from, to) =>
    db.from('monster_spawns')
      .select('id, map_code, map_display_name, monsters(id, name_en, level, image_url, is_aggressive)')
      .in('map_code', [...WORLD_MAP_CODES, ...floorCodes])
      .order('id')
      .range(from, to),
  );
  if (error) console.error('world map spawn query failed', error);
  const rows = (data ?? []) as unknown as WorldMapSpawnRow[];
  const built = buildWorldMapEntries(rows.filter((row) => TILE_CODES.has(row.map_code)));

  const floorCache = new Map<string, WorldDungeon['floors'][number]>();
  const floorOf = (code: string) => {
    if (!floorCache.has(code)) {
      const monsters = monstersFor([code], rows);
      const s = stats(monsters);
      const release = mapRelease(code);
      floorCache.set(code, {
        code,
        name: mapNames.get(code) ?? code,
        image: mapImage(code)?.src ?? null,
        minLevel: s.minLevel,
        maxLevel: s.maxLevel,
        monsters: monsters.filter((m) => m.imageUrl).slice(0, 4),
        closed: release ? `ยังไม่เปิด${release.when ? ` (${release.when})` : ''}` : null,
      });
    }
    return floorCache.get(code)!;
  };

  // Resolved here, not in the client: mapImage reads the mirror off disk.
  const withExtras = (entry: WorldMapEntry): WorldMapEntry => ({
    ...entry,
    image: entry.mapCodes.map((code) => mapImage(code)?.src).find(Boolean) ?? null,
    dungeons: (byTile.get(entry.mapCode) ?? []).map((dungeon): WorldDungeon => ({
      key: dungeon.key,
      name: dungeonName(mapNames.get(dungeon.key) ?? dungeon.key),
      entrance: dungeon.entrance,
      // A floor with no monsters on record says nothing a player can use.
      floors: dungeon.floors.map((floor) => floorOf(floor.code)).filter((floor) => floor.minLevel !== null),
    })).filter((dungeon) => dungeon.floors.length > 0),
  });
  const tiles = built.tiles.map(withExtras);
  const dungeonCount = new Set([...byTile.values()].flat().map((d) => d.key)).size;

  return (
    <main className="shell worldmap-page">
      <nav className="crumbs" aria-label="ตำแหน่งหน้า">
        <Link href="/database/maps">ฐานข้อมูลแมพ</Link><span className="crumbs__sep" aria-hidden="true">›</span><span className="crumbs__here">Interactive World Map</span>
      </nav>
      <PageHeader title="แผนที่โลก Ragnarok Zero — Interactive World Map" lead="ชี้แต่ละช่องเพื่อดูมอนสเตอร์ทันที ช่องที่มีเลขสีเหลืองที่มุม คือมีทางเข้าดันเจี้ยน กดเพื่อดูทุกชั้น" />
      {(error || mapsError) && <p className="worldmap-page__warning">โหลดสถิติบางส่วนไม่สำเร็จชั่วคราว แต่ยังค้นหาและเปิดแผนที่ได้</p>}
      <WorldMap tiles={tiles} dungeons={[]} regions={WORLD_MAP_REGIONS} totalMaps={mapNames.size || 497} />
      <p className="worldmap-page__foot">World atlas แสดง {tiles.length} ช่องแมพ และดันเจี้ยน {dungeonCount} แห่งจากตารางวาร์ปของตัวเกม ส่วนรายการฐานข้อมูลครบทั้งหมดอยู่ที่ <Link href="/database/maps">ฐานข้อมูลแมพ →</Link></p>

      {/* Every tile and every dungeon floor, as plain links: the atlas only
          reveals a link once a tile is selected, which leaves a reader without
          a mouse -- and every crawler -- with no way out of it. */}
      <section className="card" style={{ marginTop: 20 }}>
        <h2 className="section-title">แมพทั้งหมดในแผนที่นี้ ({tiles.length})</h2>
        <div className="chips" style={{ marginTop: 10 }}>
          {tiles.map((entry) => (
            <Link key={entry.key} className="chip" href={`/database/maps/${encodeURIComponent(entry.mapCode)}`}>
              {entry.nameEn} <span className="chip__count">{entry.monsters.length}</span>
            </Link>
          ))}
        </div>
        <h2 className="section-title" style={{ marginTop: 18 }}>ดันเจี้ยน ({dungeonCount})</h2>
        <div className="chips" style={{ marginTop: 10 }}>
          {[...new Map(tiles.flatMap((t) => t.dungeons ?? []).map((d) => [d.key, d])).values()].map((d) => (
            <Link key={d.key} className="chip" href={`/database/maps/${encodeURIComponent(d.key)}`}>
              {d.name} <span className="chip__count">{d.floors.length} ชั้น</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
