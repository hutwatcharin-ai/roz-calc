'use client';

// components/MyHitFlee.tsx
//
// Under a monster's HIT/FLEE targets: what they mean for this player, from
// the HIT and FLEE the build simulator (/tools/build) last saved in this
// browser (lib/player-numbers). Before any build is saved it is one link to
// the simulator with this monster already picked. Owner, 6 Oct 2026: a player
// who wants to hit a monster looks on that monster's page, so the answer
// belongs here rather than on a separate table.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { readPlayerNumbers } from '@/lib/player-numbers';
import { hitChanceVsMob, mobHitChance } from '@/lib/hit-flee';

export default function MyHitFlee({ monsterId, hit100, flee95 }: { monsterId: number; hit100: number | null; flee95: number | null }) {
  const [mine, setMine] = useState<{ hit?: number; flee?: number } | null>(null);
  useEffect(() => {
    try {
      const n = readPlayerNumbers(window.localStorage);
      setMine({ hit: n.hit, flee: n.flee });
    } catch {
      setMine({});
    }
  }, []);
  if (mine === null || (hit100 === null && flee95 === null)) return null;
  const href = `/tools/build?monster=${monsterId}`;
  if (!mine.hit && !mine.flee) {
    return (
      <p className="myhitflee">
        <Link href={href}>▶ ใส่บิลด์ของคุณ</Link> แล้วหน้านี้จะบอกว่าคุณตีโดนกี่ % หลบได้กี่ % และขาดอีกเท่าไหร่
      </p>
    );
  }
  return (
    <div className="myhitflee">
      <b>บิลด์ของคุณ</b>
      {hit100 !== null && mine.hit ? (
        <span>
          HIT {mine.hit} · ตีโดน <b className="mono">{hitChanceVsMob(mine.hit, hit100)}%</b>
          {mine.hit < hit100 ? ` · ขาดอีก ${hit100 - mine.hit}` : ' ✔'}
        </span>
      ) : null}
      {flee95 !== null && mine.flee ? (
        <span>
          FLEE {mine.flee} · หลบได้ <b className="mono">{100 - mobHitChance(flee95, mine.flee)}%</b>
          {mine.flee < flee95 ? ` · หลบตันขาดอีก ${flee95 - mine.flee}` : ' ✔'}
        </span>
      ) : null}
      <Link href={href}>แก้บิลด์</Link>
    </div>
  );
}
