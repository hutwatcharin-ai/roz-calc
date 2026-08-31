'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MapRegion } from '@/lib/map-regions';
import { searchMapRegions } from '@/lib/map-search';
import { clampViewport, focusRegion, resetViewport, zoomAt, type ViewportState } from '@/lib/map-viewport';

const KAFRA_DESTINATIONS = ['Prontera', 'Geffen', 'Payon', 'Morroc', 'Alberta', 'Aldebaran', 'Comodo', 'Izlude', 'Umbala'];

function levelText(region: MapRegion) {
  if (region.minLevel == null || region.maxLevel == null) return '—';
  return region.minLevel === region.maxLevel ? `Lv.${region.minLevel}` : `Lv.${region.minLevel}–${region.maxLevel}`;
}

export default function WorldMap({ regions }: { regions: MapRegion[] }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: number; x: number; y: number; originX: number; originY: number } | null>(null);
  const [view, setView] = useState<ViewportState>({ scale: 0.5, x: 0, y: 0 });
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const matches = useMemo(() => new Set(searchMapRegions(regions, query)), [regions, query]);
  const selected = regions.find((region) => region.slug === selectedSlug) ?? null;

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

  useEffect(() => {
    const syncFromUrl = () => {
      const slug = new URLSearchParams(window.location.search).get('region');
      setSelectedSlug(regions.some((region) => region.slug === slug) ? slug : null);
    };
    syncFromUrl();
    window.addEventListener('popstate', syncFromUrl);
    return () => window.removeEventListener('popstate', syncFromUrl);
  }, [regions]);

  const selectRegion = useCallback((region: MapRegion | null, push = true) => {
    setSelectedSlug(region?.slug ?? null);
    if (push) {
      const url = new URL(window.location.href);
      region ? url.searchParams.set('region', region.slug) : url.searchParams.delete('region');
      window.history.pushState({}, '', `${url.pathname}${url.search}${url.hash}`);
    }
  }, []);

  const changeZoom = useCallback((factor: number) => {
    const { width, height } = dimensions();
    setView((current) => zoomAt(current, current.scale * factor, width / 2, height / 2, width, height));
  }, [dimensions]);

  function onSearch(value: string) {
    setQuery(value);
    const ids = searchMapRegions(regions, value);
    if (value.trim() && ids.length) {
      const region = regions.find((item) => item.slug === ids[0]);
      if (region) {
        const { width, height } = dimensions();
        setView((current) => focusRegion(current, region, width, height));
      }
    }
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

  function pointerUp(event: React.PointerEvent) {
    if (dragRef.current?.id === event.pointerId) dragRef.current = null;
  }

  return (
    <section className="worldmap" aria-label="แผนที่โลก Ragnarok Zero">
      <div className="worldmap__toolbar">
        <label className="worldmap__search">
          <span className="sr-only">ค้นหาในแผนที่</span>
          <input type="search" value={query} onChange={(event) => onSearch(event.target.value)} placeholder="ค้นหาแมพ มอนสเตอร์ หรือเขต..." />
        </label>
        <span className="worldmap__match" aria-live="polite">{query ? `พบ ${matches.size} จุด` : `${regions.length} พื้นที่สำคัญ`}</span>
      </div>

      <div className="worldmap__layout">
        <div
          ref={viewportRef}
          className="worldmap__viewport"
          onPointerDown={pointerDown}
          onPointerMove={pointerMove}
          onPointerUp={pointerUp}
          onPointerCancel={pointerUp}
          onWheel={(event) => {
            event.preventDefault();
            const rect = event.currentTarget.getBoundingClientRect();
            setView((current) => zoomAt(current, current.scale * (event.deltaY < 0 ? 1.18 : 0.85), event.clientX - rect.left, event.clientY - rect.top, rect.width, rect.height));
          }}
          onClick={(event) => { if (event.target === event.currentTarget) selectRegion(null); }}
        >
          <div className="worldmap__stage" style={{ transform: `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.scale})` }}>
            <img src="/images/maps/worldmap.jpg" width="1280" height="1024" alt="แผนที่โลก Orbis of Midgard" draggable={false} />
            {regions.map((region) => {
              const isMatch = matches.has(region.slug);
              return (
                <button
                  key={region.slug}
                  type="button"
                  className={`worldmap__pin worldmap__pin--${region.kind}${selectedSlug === region.slug ? ' is-selected' : ''}${query && !isMatch ? ' is-dimmed' : ''}${query && isMatch ? ' is-match' : ''}`}
                  style={{ left: region.x, top: region.y, width: Math.max(44, region.width), height: Math.max(44, region.height) }}
                  aria-label={`${region.nameTh ?? region.nameEn}, ${region.mapCodes.length} แมพ`}
                  aria-pressed={selectedSlug === region.slug}
                  onClick={(event) => { event.stopPropagation(); selectRegion(region); }}
                >
                  <span>{region.nameTh ?? region.nameEn}</span>{region.hasKafra && <b aria-label="มี Kafra Teleport">K</b>}
                </button>
              );
            })}
          </div>
          <div className="worldmap__controls" aria-label="ควบคุมการซูม">
            <button type="button" onClick={() => changeZoom(1.25)} aria-label="ซูมเข้า">+</button>
            <button type="button" onClick={() => changeZoom(0.8)} aria-label="ซูมออก">−</button>
            <button type="button" onClick={reset}>RESET</button>
          </div>
          <p className="worldmap__hint">ลากเพื่อเลื่อน · หมุนล้อหรือใช้ปุ่มเพื่อซูม</p>
        </div>

        <aside className={`worldmap__panel${selected ? ' is-open' : ''}`} aria-live="polite">
          {selected ? (
            <>
              <button className="worldmap__close" type="button" onClick={() => selectRegion(null)} aria-label="ปิดรายละเอียด">×</button>
              <span className="worldmap__eyebrow">{selected.kind === 'city' ? 'เมือง' : selected.kind === 'dungeon' ? 'ดันเจียน' : 'พื้นที่'}</span>
              <h2>{selected.nameTh ?? selected.nameEn}</h2>
              <p className="worldmap__english">{selected.nameEn}</p>
              <dl className="worldmap__stats">
                <div><dt>แมพ</dt><dd>{selected.mapCodes.length}</dd></div>
                <div><dt>เลเวลมอน</dt><dd>{levelText(selected)}</dd></div>
                <div><dt>มอนที่เกิด</dt><dd>{selected.monsterCount || '—'}</dd></div>
                <div><dt>เข้าตีเอง</dt><dd>{selected.aggressiveCount ? `⚠ ${selected.aggressiveCount} ชนิด` : '—'}</dd></div>
              </dl>
              {selected.hasKafra && <p className="worldmap__kafra"><strong>Kafra Teleport</strong><br />เชื่อมเมืองหลัก: {KAFRA_DESTINATIONS.join(', ')}</p>}
              <h3>แมพในพื้นที่</h3>
              <ul className="worldmap__maplist">
                {selected.mapCodes.map((code) => {
                  const available = selected.monsterNames.length > 0 || selected.monsterCount > 0;
                  return <li key={code}>{available ? <Link href={`/database/maps/${encodeURIComponent(code)}`}>{code} <span>→</span></Link> : <span className="mono">{code}</span>}</li>;
                })}
              </ul>
            </>
          ) : (
            <div className="worldmap__empty"><strong>เลือกพื้นที่บนแผนที่</strong><p>กดหมุดเพื่อดูเลเวลมอน ความอันตราย และแมพย่อยในพื้นที่นั้น</p></div>
          )}
        </aside>
      </div>
    </section>
  );
}
