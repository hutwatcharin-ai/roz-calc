// The maps the overnight gate took out, and why -- so an empty or short list
// says "your HP/FLEE is the problem here", not nothing.

import Link from 'next/link';
import type { RankedMap } from '@/lib/farm-engine/rank';
import { blockerText } from './card-helpers';

const SHOWN = 12;

export default function BlockedMaps({ blocked }: { blocked: RankedMap[] }) {
  if (blocked.length === 0) return null;
  return (
    <details className="farm-more">
      <summary>ดูแมพที่ถูกตัด ({blocked.length}) และเหตุผล</summary>
      <ul className="farm-blocked">
        {blocked.slice(0, SHOWN).map((map) => (
          <li key={map.code}>
            <Link href={`/database/maps/${encodeURIComponent(map.code)}`}>{map.name}</Link>
            <span className="farmcard__code"> {map.code}</span>
            <span className="farm-blocked__why">
              {(map.blockers ?? [])
                .slice(0, 3)
                .map(blockerText)
                .join(' · ')}
            </span>
          </li>
        ))}
      </ul>
    </details>
  );
}
