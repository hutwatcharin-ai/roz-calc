// "ทางเชื่อม" on a map page: the minimap with every warp on it, and the list
// of where each one leads with a /navi line to walk there (owner, 5 Oct 2026).
// Server-rendered; the only interaction is links.

import Link from 'next/link';
import { mapRelease } from '@/lib/map-availability';
import { mapWarps, warpMapName, warpPosition, type WarpExit } from '@/lib/map-warps';

function Dest({ exit }: { exit: WarpExit }) {
  const name = warpMapName(exit.to);
  return exit.page ? <Link href={`/database/maps/${exit.to}`}>{name}</Link> : <span>{name}</span>;
}

export default function MapWarps({ code, name }: { code: string; name: string }) {
  const warps = mapWarps(code);
  if (!warps || (warps.exits.length === 0 && warps.doors.length === 0)) return null;
  const closed = (to: string) => Boolean(mapRelease(to));

  return (
    <section className="card warps" style={{ marginTop: 20 }} aria-labelledby="warps-title">
      <h2 id="warps-title" className="section-title">
        ทางเชื่อม · วาร์ป
      </h2>
      <p className="muted warps__lead">
        เลขบนแผนที่ตรงกับรายการ · <span className="warps__key warps__key--portal">ประตูวาร์ป</span>{' '}
        <span className="warps__key warps__key--npc">NPC พาไป</span> · ก๊อป <code className="mono">/navi</code> ไปวางในแชต
        เกมจะนำทางไปที่ประตู
      </p>
      <div className="warps__lay">
        <figure className="warps__map">
          <img src={warps.picture} alt={`แผนที่ย่อ ${name} พร้อมจุดวาร์ป`} width={512} height={512} loading="lazy" decoding="async" />
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
          {warps.from.length > 0 && (
            <p className="muted warps__from">
              <strong>เข้ามาได้จาก:</strong>{' '}
              {warps.from.map((f, i) => (
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
