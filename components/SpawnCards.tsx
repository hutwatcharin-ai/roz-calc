// The "จุดเกิด" list on a monster page: one card per map with the map's
// picture always showing, the spawn count, and on a pointer device a bigger
// picture on hover (owner's pick B, 30 Sep 2026, from
// public/draft/spawn-minimap). A phone has no hover, which is why the small
// picture is always there rather than only in the popover.
//
// Maps that are not open on Global yet (data/map-availability.json) sink to
// the end with a "ยังไม่เปิด" tag and no month, the owner's rule for dates
// that come from one fan source.

import Link from 'next/link';
import { mapImage } from '@/lib/map-image';
import availability from '@/data/map-availability.json';
import type { SpawnChip } from '@/lib/spawn-chips';

const CLOSED = (availability as { maps: Record<string, unknown> }).maps;

export default function SpawnCards({ chips }: { chips: SpawnChip[] }) {
  // Two spawn groups can land on the same map page (an MVP's habitat and its
  // PK copy both link to one code); show that map once, keeping the bigger count.
  const byCode = new Map<string, SpawnChip>();
  for (const c of chips) {
    const prev = byCode.get(c.code);
    if (!prev) byCode.set(c.code, c);
    else byCode.set(c.code, { ...prev, amount: Math.max(prev.amount ?? 0, c.amount ?? 0) || null, channels: prev.channels + c.channels + 1 });
  }
  const rows = [...byCode.values()]
    .map((c) => ({ ...c, closed: Boolean(CLOSED[c.code]), picture: mapImage(c.code) }))
    .sort((a, b) => Number(a.closed) - Number(b.closed));
  const top = rows.find((r) => !r.closed)?.code;

  return (
    <ul className="spgrid">
      {rows.map((c) => (
        <li key={c.code}>
          <Link
            href={`/database/maps/${encodeURIComponent(c.code)}`}
            className={'sp' + (c.code === top ? ' sp--top' : '') + (c.closed ? ' sp--closed' : '')}
          >
            {c.picture ? (
              <img className="sp__thumb" src={c.picture.src} alt="" width={56} height={56} loading="lazy" />
            ) : (
              <span className="sp__thumb sp__thumb--none" aria-hidden="true" />
            )}
            <span className="sp__name">
              {c.label}
              <span className="sp__code">
                {c.code}
                {c.channels > 0 ? ` · อีก ${c.channels} ช่อง` : ''}
              </span>
              {c.closed && <span className="tag tag--unknown sp__tag">ยังไม่เปิด</span>}
            </span>
            {c.amount != null && <span className="sp__n">×{c.amount}</span>}
            {c.picture && (
              <span className="sp__pop" aria-hidden="true">
                <img src={c.picture.src} alt="" width={250} height={Math.round((250 * c.picture.height) / c.picture.width)} loading="lazy" />
                <span>
                  <strong>{c.label}</strong> · {c.code}
                  {c.amount != null ? ` · เกิด ${c.amount} ตัว` : ''}
                </span>
              </span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
