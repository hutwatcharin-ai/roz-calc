// The maps the dodge gate took out, and the monster on each that did it --
// so an empty or short list says "your FLEE is the problem here", not nothing.

import Link from 'next/link';
import type { RankedMap } from '@/lib/farm-engine/rank';

const SHOWN = 12;

export default function BlockedMaps({ blocked }: { blocked: RankedMap[] }) {
  if (blocked.length === 0) return null;
  return (
    <details className="farm-more">
      <summary>ดูแมพที่ถูกตัด ({blocked.length}) และมอนตัวที่หลบไม่พ้น</summary>
      <ul className="farm-blocked">
        {blocked.slice(0, SHOWN).map((map) => (
          <li key={map.code}>
            <Link href={`/database/maps/${encodeURIComponent(map.code)}`}>{map.name}</Link>
            <span className="farmcard__code"> {map.code}</span>
            <span className="farm-blocked__why">
              {(map.blockers ?? [])
                .slice(0, 3)
                .map((b) => (b.reason === 'dodge' ? `${b.name} ตีคุณโดน ${b.theirHitPct}%` : `${b.name} ไม่มีค่า FLEE`))
                .join(' · ')}
            </span>
          </li>
        ))}
      </ul>
    </details>
  );
}
