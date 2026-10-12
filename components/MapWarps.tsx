// "ทางเชื่อม" on a map page: the minimap with every warp on it, and the list
// of where each one leads with a /navi line to walk there (owner, 5 Oct 2026).
// Server-rendered; the only interaction is links.
//
// The minimap is its own export (WarpMap) since 12 Oct 2026: a monster map
// page showed the same terrain twice, once beside the monsters and once here
// (owner: "ดูซ้ำซ้อนไหม"). There it now stands beside the monsters with the
// warp numbers and NPC pins on it, and this section keeps only the list.

import Link from 'next/link';
import { mapRelease } from '@/lib/map-availability';
import { mapWarps, warpMapName, warpPosition, type WarpExit, type MapWarps as MapWarpInfo } from '@/lib/map-warps';

function Dest({ exit }: { exit: WarpExit }) {
  const name = warpMapName(exit.to);
  return exit.page ? <Link href={`/database/maps/${exit.to}`}>{name}</Link> : <span>{name}</span>;
}

const closed = (to: string) => Boolean(mapRelease(to));

/** An NPC to pin on the minimap (map coordinates). */
export interface MapPin {
  x: number;
  y: number;
  name: string;
}

/** The minimap with numbered warps, building doors and NPC pins. */
export function WarpMap({ warps, name, pins = [], className = 'warps__map', eager = false }: {
  warps: MapWarpInfo;
  name: string;
  pins?: MapPin[];
  className?: string;
  /** Above the fold on a monster map page: a lazy image paints empty first. */
  eager?: boolean;
}) {
  if (!warps.picture) return null;
  return (
    <figure className={className}>
      <img
        src={warps.picture}
        alt={`แผนที่ย่อ ${name} พร้อมจุดวาร์ป`}
        width={512}
        height={512}
        loading={eager ? undefined : 'lazy'}
        decoding="async"
      />
      {warps.doors.flatMap((exit) =>
        exit.pts.map(([x, y]) => {
          const p = warpPosition(x, y, warps.w, warps.h);
          return (
            <span
              key={`d-${exit.to}-${x}-${y}`}
              className="warps__door"
              style={{ left: `${p.left}%`, top: `${p.top}%` }}
              title={warpMapName(exit.to)}
              aria-hidden="true"
            />
          );
        }),
      )}
      {pins.map((pin) => {
        const p = warpPosition(pin.x, pin.y, warps.w, warps.h);
        return (
          <span
            key={`n-${pin.name}-${pin.x}-${pin.y}`}
            className="warps__pin"
            style={{ left: `${p.left}%`, top: `${p.top}%` }}
            title={pin.name}
            aria-hidden="true"
          />
        );
      })}
      {warps.exits.flatMap((exit, i) =>
        exit.pts.map(([x, y]) => {
          const p = warpPosition(x, y, warps.w, warps.h);
          return (
            <span
              key={`e-${exit.to}-${x}-${y}`}
              className={`warps__dot${exit.kind === 201 ? ' warps__dot--npc' : ''}${closed(exit.to) ? ' warps__dot--closed' : ''}`}
              style={{ left: `${p.left}%`, top: `${p.top}%` }}
              title={warpMapName(exit.to)}
              aria-hidden="true"
            >
              {i + 1}
            </span>
          );
        }),
      )}
      <figcaption>แผนที่ย่อจากไฟล์ของตัวเกม</figcaption>
    </figure>
  );
}

export default function MapWarps({ code, name, mapShown = false }: {
  code: string;
  name: string;
  /** The minimap is already on the page (beside the monsters), so leave it out here. */
  mapShown?: boolean;
}) {
  const warps = mapWarps(code);
  if (!warps || (warps.exits.length === 0 && warps.doors.length === 0)) return null;
  const withMap = Boolean(warps.picture) && !mapShown;
  // "เข้ามาได้จาก" only names what the exits above do not: on most fields
  // every way in is also a way out, and the line repeated the list.
  const exitTo = new Set(warps.exits.map((e) => e.to));
  const onlyIn = warps.from.filter((f) => !exitTo.has(f.code));

  return (
    <section className="card warps" style={{ marginTop: 20 }} aria-labelledby="warps-title">
      <h2 id="warps-title" className="section-title">
        ทางเชื่อม · วาร์ป
      </h2>
      <p className="muted warps__lead">
        {mapShown && warps.picture ? (
          'เลขตรงกับแผนที่ STAGE ·'
        ) : (
          <>
            {warps.picture && 'เลขบนแผนที่ตรงกับรายการ · '}
            <span className="warps__key warps__key--portal">ประตูวาร์ป</span>{' '}
            <span className="warps__key warps__key--npc">NPC พาไป</span> ·
          </>
        )}{' '}
        ก๊อป <code className="mono">/navi</code> ไปวางในแชต
        เกมจะนำทางไปที่ประตู
      </p>
      <div className={withMap ? 'warps__lay' : undefined}>
        {withMap && <WarpMap warps={warps} name={name} />}

        <div className="warps__side">
          {warps.exits.length > 0 && (
            <ol className="warps__list">
              {warps.exits.map((exit, i) => (
                <li key={`${exit.to}-${exit.kind}`}>
                  <b className={`warps__num${exit.kind === 201 ? ' warps__num--npc' : ''}`}>{i + 1}</b>
                  <span className="warps__to">
                    <Dest exit={exit} />
                    {closed(exit.to) && <em className="warps__closed">ยังไม่เปิด</em>}
                    <small>{exit.kind === 201 ? 'NPC พาไป' : 'ประตูวาร์ป'}{exit.pts.length > 1 && ` · ${exit.pts.length} จุด`}</small>
                  </span>
                  <code className="mono warps__navi">
                    /navi {exit.navi} {exit.pts[0][0]}/{exit.pts[0][1]}
                  </code>
                </li>
              ))}
            </ol>
          )}
          {warps.doors.length > 0 && (
            <p className="muted warps__doors">
              <span className="warps__door warps__door--key" aria-hidden="true" /> ประตูเข้าอาคาร:{' '}
              {warps.doors.map((exit, i) => (
                <span key={exit.to}>
                  {i > 0 && ' · '}
                  <Dest exit={exit} /> ({exit.pts.length})
                </span>
              ))}
            </p>
          )}
          {onlyIn.length > 0 && (
            <p className="muted warps__from">
              <strong>เข้ามาได้จากอีกทาง:</strong>{' '}
              {onlyIn.map((f, i) => (
                <span key={f.code}>
                  {i > 0 && ' · '}
                  {f.page ? <Link href={`/database/maps/${f.code}`}>{warpMapName(f.code)}</Link> : warpMapName(f.code)}
                </span>
              ))}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
