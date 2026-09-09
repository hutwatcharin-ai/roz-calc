// "อีกตัวที่ชื่อเหมือนกัน: Whisper Lv 46" under a monster whose name is not unique.
//
// Six names in the table belong to more than one monster, which is the game's
// doing and not ours -- so a player who searched "Whisper" gets two identical
// rows, opens one, and has no way to know whether the other one was the one
// they meant. This says the other exists, what level it is, and links to it,
// and gives each page the client's internal name so the difference has a name
// at all.

import Link from 'next/link';
import { aegisName } from '@/lib/aegis-names';

export interface SameNameMonster {
  id: number;
  level: number | null;
}

export default function SameNameLine({ id, name, others }: { id: number; name: string; others: SameNameMonster[] }) {
  if (others.length === 0) return null;
  const mine = aegisName(id);
  return (
    <p className="aliasline">
      มีมอนชื่อเดียวกันอีก {others.length} ตัว:{' '}
      {others.map((other, i) => (
        <span key={other.id}>
          {i > 0 && ' · '}
          {/* The name is in the link text on purpose: "Lv 46" alone is not a
              destination anyone can read out of context. */}
          <Link href={`/database/monsters/${other.id}`}>
            <strong>
              {name} Lv {other.level ?? '—'}
            </strong>
          </Link>
          {aegisName(other.id) && <span className="mono"> ({aegisName(other.id)})</span>}
        </span>
      ))}
      {mine && <span> · ตัวนี้คือ <span className="mono">{mine}</span></span>}
    </p>
  );
}
