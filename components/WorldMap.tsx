'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { WorldMapEntry, WorldMapRegion } from '@/lib/world-map';
import { regionBounds, searchWorldMap } from '@/lib/world-map';
import { clampViewport, focusRegion, resetViewport, zoomAt, type ViewportState } from '@/lib/map-viewport';

interface Props {
  tiles: WorldMapEntry[];
  dungeons: WorldMapEntry[];
  regions: WorldMapRegion[];
  totalMaps: number;
}

function levelText(entry: WorldMapEntry) {
  if (entry.minLevel == null || entry.maxLevel == null) return '—';
  return entry.minLevel === entry.maxLevel ? `Lv.${entry.minLevel}` : `Lv.${entry.minLevel}–${entry.maxLevel}`;
}

export default function WorldMap({ tiles, dungeons, regions, totalMaps }: Props) {
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

  const dimensions = useCallback(() => {
    const rect = viewportRef.current?.getBoundingClientRect();
    return { width: rect?.width ?? 1, height: rect?.height ?? 1 };
  }, []);

  const reset = useCallback(() => {
    const { width, height } = dimensions();
    setView(resetViewport(width, height));
  }, [dimensions]);

  useEffect(() => {
    reset();
    const observer = new ResizeObserver(reset);
    if (viewportRef.current) observer.observe(viewportRef.current);
    return () => observer.disconnect();
  }, [reset]);

  const focusEntry = useCallback((entry: WorldMapEntry) => {
    const { width, height } = dimensions();
    const area = entry.kind === 'tile'
      ? { x: entry.x - entry.width / 2, y: entry.y - entry.height / 2, width: entry.width, height: entry.height }
      : { x: entry.x - 30, y: entry.y - 20, width: 60, height: 40 };
    setView((current) => focusRegion(current, area, width, height));
  }, [dimensions]);

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
    setView((current) => focusRegion(current, bounds, width, height));
    if (push) {
      const url = new URL(window.location.href);
      url.searchParams.delete('map');
      url.searchParams.set('region', regionId);
      window.history.pushState({}, '', `${url.pathname}${url.search}${url.hash}`);
    }
    viewportRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [dimensions, tiles]);

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
    setView(clampViewport({ ...view, x: drag.originX + event.clientX - drag.x, y: drag.originY + event.clientY - drag.y }, width, height));
  }

  function changeZoom(factor: number) {
    const { width, height } = dimensions();
    setView((current) => zoomAt(current, current.scale * factor, width / 2, height / 2, width, height));
  }

  function renderTooltip(entry: WorldMapEntry) {
    const icons = entry.monsters.filter((monster) => monster.imageUrl).slice(0, 6);
    const remaining = entry.monsters.length - icons.length;
    const rightEdge = entry.x > 1020;
    const bottomEdge = entry.y > 850;
    return (
      <div
        className={`worldmap__tooltip${selectedKey === entry.key ? ' is-pinned' : ''}`}
        style={{
          left: entry.x,
          top: entry.y,
          transform: `translate(${rightEdge ? 'calc(-100% - 14px)' : '14px'}, ${bottomEdge ? 'calc(-100% - 10px)' : '-10px'}) scale(${1 / view.scale})`,
        }}
        onPointerEnter={() => setHoveredKey(entry.key)}
        onPointerLeave={() => setHoveredKey((key) => key === entry.key ? null : key)}
        onClick={(event) => event.stopPropagation()}
      >
        <span className="worldmap__tooltip-region" style={{ color: regions.find((region) => region.id === entry.regionId)?.color }}>{regions.find((region) => region.id === entry.regionId)?.label ?? (entry.kind === 'dungeon' ? 'Dungeon' : '')}</span>
        <strong>{entry.nameEn}</strong>
        <code>{entry.mapCodes.length > 1 ? `${entry.mapCode} +${entry.mapCodes.length - 1}` : entry.mapCode}</code>
        <div className="worldmap__tooltip-icons">
          {icons.map((monster) => <img key={monster.id} src={monster.imageUrl ?? ''} alt={monster.nameEn} title={`${monster.nameEn} · Lv.${monster.level}`} width="28" height="28" loading="lazy" />)}
          {remaining > 0 && <span>+{remaining}</span>}
          {!entry.monsters.length && <em>No monsters recorded</em>}
        </div>
        <small>{levelText(entry)} · {entry.monsters.length} monsters{entry.aggressiveCount ? ` · ⚠ ${entry.aggressiveCount} aggressive` : ''}</small>
        {selectedKey === entry.key && <Link href={`/database/maps/${encodeURIComponent(entry.mapCode)}`}>Open full map page →</Link>}
      </div>
    );
  }

  return (
    <section className="worldmap" aria-label="Interactive Ragnarok Zero world map">
      <div className="worldmap__toolbar">
        <label className="worldmap__search"><span className="sr-only">ค้นหาในแผนที่</span><input type="search" value={query} onChange={(event) => onSearch(event.target.value)} placeholder="Search map ID, English name or monster..." /></label>
        <span className="worldmap__match" aria-live="polite">{query ? `${matches.size} matches` : `${tiles.length} plotted · ${Math.max(0, totalMaps - tiles.length)} in full database`}</span>
      </div>

      <div className="worldmap__jump" aria-label="Jump to Region">
        <strong>JUMP TO REGION</strong>
        <div>{regions.map((region) => <button key={region.id} type="button" style={{ '--region': region.color } as React.CSSProperties} onClick={() => jumpToRegion(region.id)}>{region.label}</button>)}</div>
        <span className="worldmap__legend"><i />Field tile <i className="is-dungeon" />Dungeon</span>
      </div>

      <div className="worldmap__layout">
        <div
          ref={viewportRef}
          className="worldmap__viewport"
          onPointerDown={pointerDown}
          onPointerMove={pointerMove}
          onPointerUp={() => { dragRef.current = null; }}
          onPointerCancel={() => { dragRef.current = null; }}
          onWheel={(event) => { event.preventDefault(); const rect = event.currentTarget.getBoundingClientRect(); setView((current) => zoomAt(current, current.scale * (event.deltaY < 0 ? 1.18 : 0.85), event.clientX - rect.left, event.clientY - rect.top, rect.width, rect.height)); }}
          onClick={(event) => { if (!(event.target as HTMLElement).closest('button, a')) selectEntry(null); }}
        >
          <div className="worldmap__stage" style={{ transform: `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.scale})` }}>
            <img src="/images/maps/worldmap.jpg" width="1280" height="1024" alt="Orbis of Midgard world map" draggable={false} />
            {regions.map((region) => <span key={region.id} className="worldmap__region-label" style={{ left: region.x, top: region.y, color: region.color }}>{region.label}</span>)}
            {tiles.map((entry) => {
              const color = regions.find((region) => region.id === entry.regionId)?.color ?? '#3DE8FF';
              return <button key={entry.key} type="button" className={`worldmap__tile${selectedKey === entry.key ? ' is-selected' : ''}${query && !matches.has(entry.key) ? ' is-dimmed' : ''}${query && matches.has(entry.key) ? ' is-match' : ''}`} style={{ left: entry.x, top: entry.y, width: entry.width, height: entry.height, '--region': color } as React.CSSProperties} aria-label={`${entry.nameEn}, ${entry.mapCode}, ${entry.monsters.length} monsters`} aria-pressed={selectedKey === entry.key} onPointerEnter={() => setHoveredKey(entry.key)} onPointerLeave={() => setHoveredKey((key) => key === entry.key ? null : key)} onFocus={() => setHoveredKey(entry.key)} onBlur={() => setHoveredKey((key) => key === entry.key ? null : key)} onClick={(event) => { event.stopPropagation(); selectEntry(entry); }} />;
            })}
            <svg className="worldmap__routes" viewBox="0 0 1280 1024" aria-hidden="true">{dungeons.map((entry) => <line key={entry.key} x1={entry.parentX} y1={entry.parentY} x2={entry.x} y2={entry.y} />)}</svg>
            {dungeons.map((entry) => <button key={entry.key} type="button" className={`worldmap__dungeon${selectedKey === entry.key ? ' is-selected' : ''}${query && !matches.has(entry.key) ? ' is-dimmed' : ''}${query && matches.has(entry.key) ? ' is-match' : ''}`} style={{ left: entry.x, top: entry.y }} aria-label={`${entry.nameEn}, ${entry.mapCodes.length} floors, ${entry.monsters.length} monsters`} aria-pressed={selectedKey === entry.key} onPointerEnter={() => setHoveredKey(entry.key)} onPointerLeave={() => setHoveredKey((key) => key === entry.key ? null : key)} onFocus={() => setHoveredKey(entry.key)} onBlur={() => setHoveredKey((key) => key === entry.key ? null : key)} onClick={(event) => { event.stopPropagation(); selectEntry(entry); }}>{entry.nameEn}</button>)}
            {active && renderTooltip(active)}
          </div>
          <div className="worldmap__controls" aria-label="ควบคุมการซูม"><button type="button" onClick={() => changeZoom(1.25)} aria-label="ซูมเข้า">+</button><button type="button" onClick={() => changeZoom(0.8)} aria-label="ซูมออก">−</button><button type="button" onClick={reset}>RESET</button></div>
          <p className="worldmap__hint">Hover a tile to preview monsters · click for details</p>
        </div>

        <aside className={`worldmap__panel${selected ? ' is-open' : ''}`} aria-live="polite">
          {selected ? <>
            <button className="worldmap__close" type="button" onClick={() => selectEntry(null)} aria-label="ปิดรายละเอียด">×</button>
            <span className="worldmap__eyebrow">{selected.kind === 'dungeon' ? 'DUNGEON' : regions.find((region) => region.id === selected.regionId)?.label}</span>
            <h2>{selected.nameEn}</h2><p className="mono worldmap__code">{selected.mapCode}</p>
            <dl className="worldmap__stats"><div><dt>Map IDs</dt><dd>{selected.mapCodes.length}</dd></div><div><dt>Monster level</dt><dd>{levelText(selected)}</dd></div><div><dt>Monsters</dt><dd>{selected.monsters.length || '—'}</dd></div><div><dt>Aggressive</dt><dd>{selected.aggressiveCount ? `⚠ ${selected.aggressiveCount}` : '—'}</dd></div></dl>
            <h3>Monsters on this map</h3>
            <ul className="worldmap__monsters">{selected.monsters.map((monster) => <li key={monster.id}><Link href={`/database/monsters/${monster.id}`}>{monster.imageUrl && <img src={monster.imageUrl} alt="" width="32" height="32" loading="lazy" />}<span><strong>{monster.nameEn}</strong><small>Lv.{monster.level}{monster.isAggressive ? ' · ⚠ Aggressive' : ''}</small></span></Link></li>)}{!selected.monsters.length && <li className="worldmap__none">No monsters recorded</li>}</ul>
            <Link className="btn worldmap__open" href={`/database/maps/${encodeURIComponent(selected.mapCode)}`}>Open full map page →</Link>
          </> : <div className="worldmap__empty"><strong>Hover any map tile</strong><p>ดูมอนสเตอร์ทันที หรือคลิกช่องเพื่อเปิดรายละเอียดและรายชื่อเต็ม</p></div>}
        </aside>
      </div>
    </section>
  );
}
