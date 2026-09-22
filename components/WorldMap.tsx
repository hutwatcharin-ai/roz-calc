'use client';

import Link from 'next/link';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { WorldMapEntry, WorldMapRegion } from '@/lib/world-map';
import { regionBounds, searchWorldMap } from '@/lib/world-map';
import { clampViewport, focusRegion, resetViewport, zoomAt, type ViewportState } from '@/lib/map-viewport';

export interface WorldGridView {
  /** Fields, towns and dungeon floors, positioned in grid pixels. */
  entries: WorldMapEntry[];
  /** Each dungeon's way in, anchor to first floor, in grid pixels. */
  lines: { dungeon: string; anchor: string; points: { x: number; y: number }[] }[];
  /** A name over each dungeon cluster. */
  labels: { dungeon: string; x: number; y: number; text: string }[];
  width: number;
  height: number;
}

interface Props {
  tiles: WorldMapEntry[];
  dungeons: WorldMapEntry[];
  regions: WorldMapRegion[];
  totalMaps: number;
  /** The map-grid view (every map its own picture); opens first when given. */
  grid?: WorldGridView;
}

type Mode = 'grid' | 'atlas';

function levelText(entry: WorldMapEntry) {
  if (entry.minLevel == null || entry.maxLevel == null) return '—';
  return entry.minLevel === entry.maxLevel ? `Lv.${entry.minLevel}` : `Lv.${entry.minLevel}–${entry.maxLevel}`;
}

export default function WorldMap({ tiles: atlasTiles, dungeons, regions, totalMaps, grid }: Props) {
  // Two views of one world (owner's pick, 22 Sep 2026): the grid of map
  // pictures opens first, the painted atlas stays one tap away.
  const [mode, setMode] = useState<Mode>(grid ? 'grid' : 'atlas');
  const tiles = mode === 'grid' && grid ? grid.entries : atlasTiles;
  const content = useMemo(() => (mode === 'grid' && grid ? { w: grid.width, h: grid.height } : { w: 1280, h: 1024 }), [mode, grid]);
  const viewportRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: number; x: number; y: number; originX: number; originY: number } | null>(null);
  const [view, setView] = useState<ViewportState>({ scale: 0.5, x: 0, y: 0 });
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const entries = useMemo(() => [...tiles, ...dungeons], [tiles, dungeons]);
  const matches = useMemo(() => new Set(searchWorldMap(entries, query)), [entries, query]);
  const selected = entries.find((entry) => entry.key === selectedKey) ?? null;
  const active = selected ?? entries.find((entry) => entry.key === hoveredKey) ?? null;
  const tipRef = useRef<HTMLDivElement>(null);
  // Measured, not guessed: the card grew a map picture (22 Sep 2026) and a
  // fixed height guess let it hang off the bottom of the viewport.
  const [tipSize, setTipSize] = useState({ width: 226, height: 380 });
  useLayoutEffect(() => {
    const el = tipRef.current;
    if (!el) return;
    const measure = () => setTipSize((size) => (size.width === el.offsetWidth && size.height === el.offsetHeight ? size : { width: el.offsetWidth, height: el.offsetHeight }));
    measure();
    // The picture loads after the first paint and changes the height.
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [active?.key]);

  const dimensions = useCallback(() => {
    const rect = viewportRef.current?.getBoundingClientRect();
    return { width: rect?.width ?? 1, height: rect?.height ?? 1 };
  }, []);

  const reset = useCallback(() => {
    const { width, height } = dimensions();
    setView(resetViewport(width, height, content));
  }, [dimensions, content]);

  useEffect(() => {
    reset();
    const observer = new ResizeObserver(reset);
    if (viewportRef.current) observer.observe(viewportRef.current);
    return () => observer.disconnect();
  }, [reset]);

  const focusEntry = useCallback((entry: WorldMapEntry) => {
    const { width, height } = dimensions();
    const area = { x: entry.x - entry.width / 2, y: entry.y - entry.height / 2, width: entry.width, height: entry.height };
    setView((current) => focusRegion(current, area, width, height, content));
  }, [dimensions, content]);

  const selectEntry = useCallback((entry: WorldMapEntry | null, push = true) => {
    setSelectedKey(entry?.key ?? null);
    if (!push) return;
    const url = new URL(window.location.href);
    url.searchParams.delete('region');
    entry ? url.searchParams.set('map', entry.mapCode) : url.searchParams.delete('map');
    window.history.pushState({}, '', `${url.pathname}${url.search}${url.hash}`);
  }, []);

  const jumpToRegion = useCallback((regionId: string, push = true) => {
    const bounds = regionBounds(regionId, tiles);
    if (!bounds) return;
    const { width, height } = dimensions();
    setSelectedKey(null);
    setHoveredKey(null);
    setView((current) => focusRegion(current, bounds, width, height, content));
    if (push) {
      const url = new URL(window.location.href);
      url.searchParams.delete('map');
      url.searchParams.set('region', regionId);
      window.history.pushState({}, '', `${url.pathname}${url.search}${url.hash}`);
    }
    viewportRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [dimensions, tiles, content]);

  useEffect(() => {
    const syncFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const mapCode = params.get('map');
      const entry = entries.find((item) => item.mapCode === mapCode || item.key === mapCode);
      if (entry) {
        setSelectedKey(entry.key);
        focusEntry(entry);
        return;
      }
      const regionId = params.get('region');
      if (regionId) jumpToRegion(regionId, false);
      else setSelectedKey(null);
    };
    syncFromUrl();
    window.addEventListener('popstate', syncFromUrl);
    return () => window.removeEventListener('popstate', syncFromUrl);
  }, [entries, focusEntry, jumpToRegion]);

  // Every dungeon once, for the "dungeon entrance" picker (ratemyserver's
  // first dropdown): in the grid it jumps to the floors, in the atlas to the
  // field it opens from.
  const dungeonChoices = useMemo(() => {
    const seen = new Map<string, { key: string; name: string; target: WorldMapEntry }>();
    for (const entry of tiles) {
      if (mode === 'grid' && entry.kind === 'dungeon' && entry.dungeonKey && !seen.has(entry.dungeonKey)) {
        seen.set(entry.dungeonKey, { key: entry.dungeonKey, name: entry.dungeonName ?? entry.nameEn, target: entry });
      }
      if (mode === 'atlas') for (const d of entry.dungeons ?? []) if (!seen.has(d.key)) seen.set(d.key, { key: d.key, name: d.name, target: entry });
    }
    return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [tiles, mode]);

  // The ways in are drawn only for what is in focus: the dungeon under the
  // pointer or selected, or every dungeon that opens off the hovered map.
  // Twenty grey lines at once could not be told apart (owner, 22 Sep 2026).
  const traced = useMemo(() => {
    if (mode !== 'grid' || !grid || !active) return new Set<string>();
    const keys = new Set<string>();
    if (active.dungeonKey) keys.add(active.dungeonKey);
    for (const line of grid.lines) if (line.anchor === active.mapCode) keys.add(line.dungeon);
    for (const d of active.dungeons ?? []) keys.add(d.key);
    return keys;
  }, [mode, grid, active]);
  const tracedCodes = useMemo(() => {
    const codes = new Set<string>();
    if (!grid) return codes;
    for (const line of grid.lines) if (traced.has(line.dungeon)) codes.add(line.anchor);
    for (const entry of grid.entries) if (entry.dungeonKey && traced.has(entry.dungeonKey)) codes.add(entry.mapCode);
    return codes;
  }, [grid, traced]);

  function onPickDungeon(key: string) {
    const choice = dungeonChoices.find((d) => d.key === key);
    if (!choice) return;
    selectEntry(choice.target);
    focusEntry(choice.target);
  }

  function onSearch(value: string) {
    setQuery(value);
    const ids = searchWorldMap(entries, value);
    if (!value.trim() || !ids.length) return;
    const entry = entries.find((item) => item.key === ids[0]);
    if (entry) focusEntry(entry);
  }

  function pointerDown(event: React.PointerEvent) {
    if ((event.target as HTMLElement).closest('button, a, input')) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { id: event.pointerId, x: event.clientX, y: event.clientY, originX: view.x, originY: view.y };
  }

  function pointerMove(event: React.PointerEvent) {
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId) return;
    const { width, height } = dimensions();
    setView(clampViewport({ ...view, x: drag.originX + event.clientX - drag.x, y: drag.originY + event.clientY - drag.y }, width, height, undefined, content));
  }

  function changeZoom(factor: number) {
    const { width, height } = dimensions();
    setView((current) => zoomAt(current, current.scale * factor, width / 2, height / 2, width, height, content));
  }

  function renderTooltip(entry: WorldMapEntry) {
    const icons = entry.monsters.filter((monster) => monster.imageUrl).slice(0, 6);
    const remaining = entry.monsters.length - icons.length;
    // Placed against the part of the world the reader can see, not the whole
    // 1280x1024 image: after a pan or zoom a tile near the viewport's bottom
    // edge can sit mid-image, and the card used to drop out of sight below it.
    const { width: viewW, height: viewH } = dimensions();
    const gap = 8;
    const screenX = view.x + entry.x * view.scale;
    const screenY = view.y + entry.y * view.scale;
    const dx = screenX + 14 + tipSize.width > viewW - gap ? -(tipSize.width + 14) : 14;
    let dy = -10;
    if (screenY + dy + tipSize.height > viewH - gap) {
      dy = screenY - tipSize.height - 10 >= gap
        ? -(tipSize.height + 10)
        // Fits neither below nor above: pin it inside the viewport instead.
        : Math.max(gap - screenY, viewH - gap - tipSize.height - screenY);
    }
    return (
      <div
        ref={tipRef}
        className={`worldmap__tooltip${selectedKey === entry.key ? ' is-pinned' : ''}`}
        style={{
          left: entry.x,
          top: entry.y,
          // Offsets are screen pixels; the card is counter-scaled, so they are
          // divided by the stage scale to land where they are meant to.
          transform: `translate(${dx / view.scale}px, ${dy / view.scale}px) scale(${1 / view.scale})`,
        }}
        onPointerEnter={() => setHoveredKey(entry.key)}
        onPointerLeave={() => setHoveredKey((key) => key === entry.key ? null : key)}
        onClick={(event) => event.stopPropagation()}
      >
        <span className="worldmap__tooltip-region" style={{ color: regions.find((region) => region.id === entry.regionId)?.color }}>{regions.find((region) => region.id === entry.regionId)?.label ?? (entry.kind === 'dungeon' ? 'Dungeon' : '')}</span>
        {/* Decorative: the name under it says which map this is. Keyed so a
            new tile never flashes the previous tile's picture while loading. */}
        {entry.image && <img key={entry.image} className="worldmap__tooltip-pic" src={entry.image} alt="" width="200" height="200" decoding="async" />}
        <strong>{entry.nameEn}</strong>
        <code>{entry.mapCodes.length > 1 ? `${entry.mapCode} +${entry.mapCodes.length - 1}` : entry.mapCode}</code>
        <div className="worldmap__tooltip-icons">
          {icons.map((monster) => <img key={monster.id} src={monster.imageUrl ?? ''} alt={monster.nameEn} title={`${monster.nameEn} · Lv.${monster.level}`} width="28" height="28" loading="lazy" />)}
          {remaining > 0 && <span>+{remaining}</span>}
          {!entry.monsters.length && <em>{entry.cellKind === 'town' ? 'เมือง · ชี้เพื่อดูทางเข้าดันเจี้ยน' : entry.cellKind === 'passage' ? `ทางผ่านไป ${entry.dungeonName ?? 'ดันเจี้ยน'}` : 'No monsters recorded'}</em>}
        </div>
        {entry.monsters.length > 0 && <small>{levelText(entry)} · {entry.monsters.length} monsters{entry.aggressiveCount ? ` · ⚠ ${entry.aggressiveCount} aggressive` : ''}</small>}
        {entry.dungeons?.length ? <small className="worldmap__tooltip-dungeons">ดันเจี้ยน: {entry.dungeons.map((d) => `${d.name} (${d.floors.length} ชั้น)`).join(' · ')}</small> : null}
        {selectedKey === entry.key && <Link href={`/database/maps/${encodeURIComponent(entry.mapCode)}`}>Open full map page →</Link>}
      </div>
    );
  }

  return (
    <section className="worldmap" aria-label="Interactive Ragnarok Zero world map">
      <div className="worldmap__toolbar">
        <label className="worldmap__search"><span className="sr-only">ค้นหาในแผนที่</span><input type="search" value={query} onChange={(event) => onSearch(event.target.value)} placeholder="Search map ID, English name or monster..." /></label>
        {grid && (
          <div className="worldmap__views" role="group" aria-label="มุมมอง">
            <button type="button" aria-pressed={mode === 'grid'} onClick={() => { setMode('grid'); setSelectedKey(null); }}>ตารางแมพ</button>
            <button type="button" aria-pressed={mode === 'atlas'} onClick={() => { setMode('atlas'); setSelectedKey(null); }}>ภาพโลก</button>
          </div>
        )}
        <label className="worldmap__pick">
          <span className="sr-only">ไปที่ดันเจี้ยน</span>
          <select value="" onChange={(event) => onPickDungeon(event.target.value)}>
            <option value="">ไปที่ดันเจี้ยน…</option>
            {dungeonChoices.map((d) => <option key={d.key} value={d.key}>{d.name}</option>)}
          </select>
        </label>
        <span className="worldmap__match" aria-live="polite">{query ? `${matches.size} matches` : `${tiles.length} plotted · ${Math.max(0, totalMaps - tiles.length)} in full database`}</span>
      </div>

      <div className="worldmap__jump" aria-label="Jump to Region">
        <strong>JUMP TO REGION</strong>
        <div>{regions.map((region) => <button key={region.id} type="button" style={{ '--region': region.color } as React.CSSProperties} onClick={() => jumpToRegion(region.id)}>{region.label}</button>)}</div>
        <span className="worldmap__legend"><i />Field tile <b className="worldmap__badge worldmap__badge--legend" aria-hidden="true">1</b> ทางเข้าดันเจี้ยน</span>
      </div>

      <div className="worldmap__layout">
        <div
          ref={viewportRef}
          className="worldmap__viewport"
          onPointerDown={pointerDown}
          onPointerMove={pointerMove}
          onPointerUp={() => { dragRef.current = null; }}
          onPointerCancel={() => { dragRef.current = null; }}
          onWheel={(event) => { event.preventDefault(); const rect = event.currentTarget.getBoundingClientRect(); setView((current) => zoomAt(current, current.scale * (event.deltaY < 0 ? 1.18 : 0.85), event.clientX - rect.left, event.clientY - rect.top, rect.width, rect.height, content)); }}
          onClick={(event) => { if (!(event.target as HTMLElement).closest('button, a')) selectEntry(null); }}
        >
          <div className={`worldmap__stage${mode === 'grid' ? ' is-grid' : ''}`} style={{ width: content.w, height: content.h, transform: `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.scale})` }}>
            {mode === 'atlas' && <img src="/images/maps/worldmap.jpg" width="1280" height="1024" alt="Orbis of Midgard world map" draggable={false} />}
            {mode === 'atlas' && regions.map((region) => <span key={region.id} className="worldmap__region-label" style={{ left: region.x, top: region.y, color: region.color }}>{region.label}</span>)}
            {mode === 'grid' && grid && (
              <svg className="worldmap__gridlines" width={grid.width} height={grid.height} aria-hidden="true">
                {grid.lines.filter((l) => traced.has(l.dungeon)).map((l) => (
                  <polyline key={l.dungeon} points={l.points.map((p) => `${p.x},${p.y}`).join(' ')} />
                ))}
              </svg>
            )}
            {mode === 'grid' && grid && grid.labels.map((label) => (
              <span key={label.dungeon} className={`worldmap__grouplabel${traced.has(label.dungeon) ? ' is-traced' : ''}`} style={{ left: label.x, top: label.y }}>{label.text}</span>
            ))}
            {mode === 'grid' && grid && traced.size > 0 && (
              <span className="sr-only" aria-live="polite">กำลังแสดงทางเข้าดันเจี้ยน</span>
            )}
            {mode === 'grid' && tiles.map((entry) => (
              <button
                key={entry.key}
                type="button"
                className={`worldmap__cell is-${entry.cellKind ?? 'field'}${traced.size && tracedCodes.has(entry.mapCode) ? ' is-traced' : ''}${traced.size && !tracedCodes.has(entry.mapCode) && hoveredKey !== entry.key && selectedKey !== entry.key ? ' is-faded' : ''}${selectedKey === entry.key ? ' is-selected' : ''}${query && !matches.has(entry.key) ? ' is-dimmed' : ''}${query && matches.has(entry.key) ? ' is-match' : ''}`}
                style={{ left: entry.x, top: entry.y, width: entry.width, height: entry.height }}
                aria-label={`${entry.nameEn}, ${entry.mapCode}${entry.monsters.length ? `, ${entry.monsters.length} monsters` : ''}`}
                aria-pressed={selectedKey === entry.key}
                onPointerEnter={() => setHoveredKey(entry.key)}
                onPointerLeave={() => setHoveredKey((k) => (k === entry.key ? null : k))}
                onFocus={() => setHoveredKey(entry.key)}
                onBlur={() => setHoveredKey((k) => (k === entry.key ? null : k))}
                onClick={(event) => { event.stopPropagation(); selectEntry(entry); }}
              >
                {entry.image ? <img src={entry.image} alt="" loading="lazy" decoding="async" draggable={false} /> : <span className="worldmap__cellname">{entry.nameEn}</span>}
                {entry.cellKind === 'town' && <span className="worldmap__celltag">{entry.nameEn}</span>}
                {entry.dungeons?.length ? <span className="worldmap__badge" aria-hidden="true">{entry.dungeons.length}</span> : null}
              </button>
            ))}
            {mode === 'atlas' && tiles.map((entry) => {
              const color = regions.find((region) => region.id === entry.regionId)?.color ?? '#3DE8FF';
              return <button key={entry.key} type="button" className={`worldmap__tile${selectedKey === entry.key ? ' is-selected' : ''}${query && !matches.has(entry.key) ? ' is-dimmed' : ''}${query && matches.has(entry.key) ? ' is-match' : ''}`} style={{ left: entry.x, top: entry.y, width: entry.width, height: entry.height, '--region': color } as React.CSSProperties} aria-label={`${entry.nameEn}, ${entry.mapCode}, ${entry.monsters.length} monsters${entry.dungeons?.length ? `, ทางเข้าดันเจี้ยน ${entry.dungeons.length} แห่ง` : ''}`} aria-pressed={selectedKey === entry.key} onPointerEnter={() => setHoveredKey(entry.key)} onPointerLeave={() => setHoveredKey((key) => key === entry.key ? null : key)} onFocus={() => setHoveredKey(entry.key)} onBlur={() => setHoveredKey((key) => key === entry.key ? null : key)} onClick={(event) => { event.stopPropagation(); selectEntry(entry); }}>{entry.dungeons?.length ? <span className="worldmap__badge" aria-hidden="true">{entry.dungeons.length}</span> : null}</button>;
            })}
            {active && tiles.includes(active) && renderTooltip(active)}
          </div>
          <div className="worldmap__controls" aria-label="ควบคุมการซูม"><button type="button" onClick={() => changeZoom(1.25)} aria-label="ซูมเข้า">+</button><button type="button" onClick={() => changeZoom(0.8)} aria-label="ซูมออก">−</button><button type="button" onClick={reset}>RESET</button></div>
          <p className="worldmap__hint">{mode === 'grid' ? 'ชี้รูปแมพเพื่อดูมอนและทางเข้าดันเจี้ยน · กดเพื่อดูรายละเอียด' : 'Hover a tile to preview monsters · click for details'}</p>
        </div>

        <aside className={`worldmap__panel${selected ? ' is-open' : ''}`} aria-live="polite">
          {selected ? <>
            <button className="worldmap__close" type="button" onClick={() => selectEntry(null)} aria-label="ปิดรายละเอียด">×</button>
            <span className="worldmap__eyebrow">{selected.kind === 'dungeon' ? `DUNGEON${selected.dungeonName ? ` · ${selected.dungeonName}` : ''}` : selected.cellKind === 'town' ? 'TOWN' : selected.cellKind === 'passage' ? `ทางผ่าน${selected.dungeonName ? ` · ${selected.dungeonName}` : ''}` : regions.find((region) => region.id === selected.regionId)?.label}</span>
            <h2>{selected.nameEn}</h2><p className="mono worldmap__code">{selected.mapCode}</p>
            {/* Touch has no hover, so the panel carries the same picture. */}
            {selected.image && <img key={selected.image} className="worldmap__panel-pic" src={selected.image} alt={`แผนที่ ${selected.nameEn}`} width="240" height="240" decoding="async" />}
            <dl className="worldmap__stats"><div><dt>Map IDs</dt><dd>{selected.mapCodes.length}</dd></div><div><dt>Monster level</dt><dd>{levelText(selected)}</dd></div><div><dt>Monsters</dt><dd>{selected.monsters.length || '—'}</dd></div><div><dt>Aggressive</dt><dd>{selected.aggressiveCount ? `⚠ ${selected.aggressiveCount}` : '—'}</dd></div></dl>
            <h3>Monsters on this map</h3>
            <ul className="worldmap__monsters">{selected.monsters.map((monster) => <li key={monster.id}><Link href={`/database/monsters/${monster.id}`}>{monster.imageUrl && <img src={monster.imageUrl} alt="" width="32" height="32" loading="lazy" />}<span><strong>{monster.nameEn}</strong><small>Lv.{monster.level}{monster.isAggressive ? ' · ⚠ Aggressive' : ''}</small></span></Link></li>)}{!selected.monsters.length && <li className="worldmap__none">No monsters recorded</li>}</ul>
            {selected.dungeons?.length ? (
              <section className="worldmap__dungeons" aria-label="ดันเจี้ยนจากแมพนี้">
                <h3>ดันเจี้ยนจากแมพนี้</h3>
                {selected.dungeons.map((dungeon) => (
                  <div key={dungeon.key} className="wmdungeon">
                    <strong>{dungeon.name} <span className="muted">· {dungeon.floors.length} ชั้น</span></strong>
                    {/* The portal into the dungeon, which may stand in a town or
                        a ruin next to this field rather than on it. */}
                    <code className="mono navicmd wmdungeon__navi">/navi {dungeon.entrance.map} {dungeon.entrance.x}/{dungeon.entrance.y}</code>
                    <ul className="wmdungeon__floors">
                      {dungeon.floors.map((floor) => (
                        <li key={floor.code}>
                          <Link href={`/database/maps/${encodeURIComponent(floor.code)}`} className="wmfloor">
                            {floor.image ? <img src={floor.image} alt="" width="48" height="48" loading="lazy" /> : <span className="wmfloor__blank" aria-hidden="true" />}
                            <span className="wmfloor__body">
                              <span className="wmfloor__name">{floor.name}</span>
                              <span className="wmfloor__meta mono">
                                {floor.minLevel == null ? 'ไม่มีข้อมูลมอน' : floor.minLevel === floor.maxLevel ? `Lv.${floor.minLevel}` : `Lv.${floor.minLevel}–${floor.maxLevel}`}
                                {floor.closed && <span className="wmfloor__closed"> · {floor.closed}</span>}
                              </span>
                              {floor.monsters.length > 0 && (
                                <span className="wmfloor__mobs">
                                  {floor.monsters.map((monster) => <img key={monster.id} src={monster.imageUrl ?? ''} alt={monster.nameEn} title={`${monster.nameEn} · Lv.${monster.level}`} width="24" height="24" loading="lazy" />)}
                                </span>
                              )}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </section>
            ) : null}
            <Link className="btn worldmap__open" href={`/database/maps/${encodeURIComponent(selected.mapCode)}`}>Open full map page →</Link>
          </> : <div className="worldmap__empty"><strong>Hover any map tile</strong><p>ดูมอนสเตอร์ทันที หรือคลิกช่องเพื่อเปิดรายละเอียดและรายชื่อเต็ม</p></div>}
        </aside>
      </div>
    </section>
  );
}
