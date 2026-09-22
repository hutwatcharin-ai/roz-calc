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
import layout from '@/data/world-map-layout.json';
import mapPictures from '@/public/images/maps/full/_index.json';
import { layoutGrid } from '@/lib/world-grid';
import type { WorldGridView } from '@/components/WorldMap';

// Towns drawn as cells in the grid view: every place players walk out of onto
// an atlas field that has a picture in the client. Guild castles and indoor
// rooms are left out; dungeons get their own clusters.
const GRID_TOWNS = ['prontera', 'geffen', 'payon', 'morocc', 'alberta', 'izlude', 'aldebaran', 'umbala', 'xmas', 'prt_monk', 'comodo'];
// Comodo has no portal onto a field in the warp table: players come in through
// the caves from Comodo Field (owner, 22 Sep 2026: the town was missing).
const TOWN_FIELDS_BY_HAND: Record<string, string[]> = { comodo: ['cmd_fild01', 'cmd_fild02'] };
// Ways in the owner corrected by hand (22 Sep 2026), map by map from where the
// path starts: the warp table's shortest walk reached these from the wrong side.
const WAY_IN_BY_HAND: Record<string, string[]> = {
  prt_ca01: ['prt_fild05', 'prt_cas'],
  pay_dun00: ['payon', 'pay_arche'],
};
// Towns off the world map, reached only by a warp NPC in another town.
// Nordfeld: a quest from the NPC in north Prontera sends you to one in Alberta,
// who takes you there; its fields are not in the client files we hold
// (youtube.com/watch?v=QIPSG6aKCDI, 4:00-4:48).
const OUTPOSTS = [{ code: 'nordfeld', from: 'alberta', name: 'Nordfeld', note: 'เมืองนอกแผนที่ · ไปได้จาก NPC ในเมือง Alberta (รับเควสจาก NPC ทางเหนือของ Prontera ก่อน) · ไม่มีวาร์ปไปแมพอื่น' }];
const CELL = 64;
const PITCH = 70;

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

  const viaOf = new Map<string, string[]>();
  for (const [tile, list] of byTile) for (const d of list) viaOf.set(`${tile}|${d.key}`, d.via);

  // The grid view: the same fields, plus towns and every dungeon floor, each
  // map in a cell of its own (lib/world-grid).
  const links = (mapLinks as unknown as MapLinksFile).links;
  const fieldCodes = new Set(tiles.map((t) => t.mapCode));
  const towns = GRID_TOWNS.map((code) => ({
    code,
    fields: TOWN_FIELDS_BY_HAND[code]?.filter((f) => fieldCodes.has(f))
      ?? [...new Set(links.filter(([from, , , to, kind]) => from === code && kind === 200 && fieldCodes.has(to)).map((l) => l[3]))],
  })).filter((t) => t.fields.length > 0);
  const gridDungeons = new Map<string, { key: string; entranceMap: string; fallbackTile: string; floors: string[]; via: string[] }>();
  for (const tile of tiles) {
    for (const d of tile.dungeons ?? []) {
      if (!gridDungeons.has(d.key)) gridDungeons.set(d.key, { key: d.key, entranceMap: d.entrance.map, fallbackTile: tile.mapCode, floors: d.floors.map((f) => f.code), via: viaOf.get(`${tile.mapCode}|${d.key}`) ?? [] });
    }
  }
  for (const [key, path] of Object.entries(WAY_IN_BY_HAND)) {
    const dungeon = gridDungeons.get(key);
    if (!dungeon) continue;
    // The path's first map is the anchor (a field, or a town cell), the rest passages.
    Object.assign(dungeon, { entranceMap: path[path.length - 1], fallbackTile: fieldCodes.has(path[0]) ? path[0] : dungeon.fallbackTile, via: path });
  }
  const rawTiles = (layout as { tiles: Record<string, { x: number; y: number }> }).tiles;
  const laid = layoutGrid({
    tiles: tiles.map((t) => ({ code: t.mapCode, x: rawTiles[t.mapCode]?.x ?? t.x, y: rawTiles[t.mapCode]?.y ?? t.y })),
    towns,
    dungeons: [...gridDungeons.values()],
    outposts: OUTPOSTS,
  });
  const centre = (col: number, row: number) => ({ x: col * PITCH + PITCH / 2, y: row * PITCH + PITCH / 2 });
  const tileByCode = new Map(tiles.map((t) => [t.mapCode, t]));
  const regionOf = new Map(tiles.map((t) => [t.mapCode, t.regionId]));
  const pictures = mapPictures as Record<string, { name?: string }>;
  const gridEntries: WorldMapEntry[] = laid.cells.map((cell) => {
    const at = centre(cell.col, cell.row);
    const box = { x: at.x, y: at.y, width: CELL, height: CELL, cellKind: cell.kind };
    if (cell.kind === 'field') {
      const tile = tileByCode.get(cell.code)!;
      return { ...tile, ...box };
    }
    const outpost = OUTPOSTS.find((o) => o.code === cell.code);
    if (outpost) {
      const from = towns.find((t) => t.code === outpost.from);
      return {
        key: `town:${cell.code}`, mapCode: cell.code, mapCodes: [cell.code], nameEn: outpost.name,
        regionId: regionOf.get(from?.fields[0] ?? '') ?? '', kind: 'tile' as const, ...box,
        monsters: [], minLevel: null, maxLevel: null, aggressiveCount: 0, image: mapImage(cell.code)?.src ?? null,
        dungeonKey: cell.code, note: outpost.note,
      };
    }
    if (cell.kind === 'town') {
      const town = towns.find((t) => t.code === cell.code)!;
      return {
        key: `town:${cell.code}`, mapCode: cell.code, mapCodes: [cell.code], nameEn: pictures[cell.code]?.name ?? cell.code,
        regionId: regionOf.get(town.fields[0]) ?? '', kind: 'tile' as const, ...box,
        monsters: [], minLevel: null, maxLevel: null, aggressiveCount: 0, image: mapImage(cell.code)?.src ?? null,
      };
    }
    const dungeon = gridDungeons.get(cell.dungeon!)!;
    if (cell.kind === 'passage') {
      // A dock or lobby on the way in: half a cell, its own picture, no monsters.
      return {
        key: `via:${cell.code}`, mapCode: cell.code, mapCodes: [cell.code], nameEn: pictures[cell.code]?.name ?? cell.code,
        regionId: regionOf.get(dungeon.fallbackTile) ?? '', kind: 'tile' as const, ...box, width: CELL / 2, height: CELL / 2,
        monsters: [], minLevel: null, maxLevel: null, aggressiveCount: 0, image: mapImage(cell.code)?.src ?? null,
        dungeonKey: dungeon.key, dungeonName: dungeonName(mapNames.get(dungeon.key) ?? dungeon.key),
      };
    }
    const monsters = monstersFor([cell.code], rows);
    return {
      key: `floor:${cell.code}`, mapCode: cell.code, mapCodes: [cell.code], nameEn: mapNames.get(cell.code) ?? cell.code,
      regionId: regionOf.get(dungeon.fallbackTile) ?? '', kind: 'dungeon' as const, ...box,
      ...stats(monsters), image: mapImage(cell.code)?.src ?? null,
      dungeonKey: dungeon.key, dungeonName: dungeonName(mapNames.get(dungeon.key) ?? dungeon.key),
    };
  });
  const gridView: WorldGridView = {
    entries: gridEntries,
    lines: laid.lines.map((l) => ({ dungeon: l.dungeon, anchor: l.anchor, points: l.points.map((p) => centre(p.col, p.row)) })),
    labels: laid.lines.filter((l) => gridDungeons.has(l.dungeon)).map((l) => {
      const first = l.points[l.points.length - 1];
      const at = centre(first.col, first.row);
      const d = gridDungeons.get(l.dungeon)!;
      return { dungeon: l.dungeon, x: at.x, y: at.y - CELL / 2 - 4, text: `${dungeonName(mapNames.get(d.key) ?? d.key)} · ${d.floors.length} ชั้น` };
    }),
    width: laid.cols * PITCH,
    height: laid.rows * PITCH,
  };
  const dungeonCount = new Set([...byTile.values()].flat().map((d) => d.key)).size;

  return (
    <main className="shell worldmap-page">
      <nav className="crumbs" aria-label="ตำแหน่งหน้า">
        <Link href="/database/maps">ฐานข้อมูลแมพ</Link><span className="crumbs__sep" aria-hidden="true">›</span><span className="crumbs__here">Interactive World Map</span>
      </nav>
      <PageHeader title="แผนที่โลก Ragnarok Zero — Interactive World Map" lead="ชี้แต่ละช่องเพื่อดูมอนสเตอร์ทันที ช่องที่มีเลขสีเหลืองที่มุม คือมีทางเข้าดันเจี้ยน กดเพื่อดูทุกชั้น" />
      {(error || mapsError) && <p className="worldmap-page__warning">โหลดสถิติบางส่วนไม่สำเร็จชั่วคราว แต่ยังค้นหาและเปิดแผนที่ได้</p>}
      <WorldMap tiles={tiles} dungeons={[]} regions={WORLD_MAP_REGIONS} totalMaps={mapNames.size || 497} grid={gridView} />
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
