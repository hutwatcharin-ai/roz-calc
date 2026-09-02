'use client';

// The hit/flee tool's result table with clickable column sorting (user, 2
// Sep). Extracted from the server page so the sort can live in the browser;
// the page still fetches the rows and passes the player's HIT/FLEE down.
import Link from 'next/link';
import AggroBadge from '@/components/AggroBadge';
import { hitChanceVsMob, mobHitChance } from '@/lib/hit-flee';
import { bySorted, useTableSort } from '@/lib/use-table-sort';

export interface HitFleeRow {
  id: number;
  name_en: string;
  level: number | null;
  hit_100: number | null;
  flee_95: number | null;
  image_url: string | null;
  is_aggressive: boolean | null;
  atk_max: number | null;
}

export default function HitFleeTable({ monsters, myHit, myFlee }: { monsters: HitFleeRow[]; myHit: number; myFlee: number }) {
  const { sort, toggle, indicator } = useTableSort();

  // Derived once per row so the sort keys and the cells agree.
  const rows = monsters.map((m) => {
    const hit100 = m.hit_100 ?? null;
    const flee95 = m.flee_95 ?? null;
    return {
      ...m,
      hit100,
      flee95,
      youHit: hit100 !== null ? hitChanceVsMob(myHit, hit100) : null,
      theyHit: flee95 !== null ? mobHitChance(flee95, myFlee) : null,
    };
  });

  const sorted = bySorted(rows, sort, (r, key) =>
    key === 'name' ? r.name_en
    : key === 'level' ? r.level
    : key === 'you' ? r.youHit
    : key === 'they' ? r.theyHit
    : key === 'hit' ? r.hit100
    : key === 'flee' ? r.flee95
    : null,
  );

  return (
    <table className="data-table">
      <thead>
        <tr>
          <th><button type="button" className="thsort" onClick={() => toggle('name', false)}>มอนสเตอร์ {indicator('name')}</button></th>
          <th className="num"><button type="button" className="thsort" onClick={() => toggle('level', false)}>Lv {indicator('level')}</button></th>
          <th className="num"><button type="button" className="thsort" onClick={() => toggle('you')}>คุณตีมันโดน {indicator('you')}</button></th>
          <th className="num"><button type="button" className="thsort" onClick={() => toggle('they', false)}>มันตีคุณโดน {indicator('they')}</button></th>
          <th className="num"><button type="button" className="thsort" onClick={() => toggle('hit', false)}>โดน 100% ต้อง HIT {indicator('hit')}</button></th>
          <th className="num"><button type="button" className="thsort" onClick={() => toggle('flee', false)}>หลบตัน 95% ต้อง FLEE {indicator('flee')}</button></th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((m) => (
          <tr key={m.id}>
            <td data-label="">
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                {m.image_url && (
                  <img loading="lazy" decoding="async" src={m.image_url} alt="" width={24} height={24} style={{ imageRendering: 'pixelated' }} />
                )}
                <Link href={`/database/monsters/${m.id}`}>{m.name_en}</Link>
                <AggroBadge monster={{ is_aggressive: m.is_aggressive, atk_max: m.atk_max }} />
              </span>
            </td>
            <td data-label="Lv" className="num">{m.level}</td>
            <td data-label="คุณตีมันโดน" className="num">
              {m.youHit === null ? '—' : (
                <span style={{ color: m.youHit === 100 ? 'var(--status-safe)' : m.youHit < 70 ? 'var(--status-danger)' : 'var(--yellow)' }}>
                  {m.youHit}%
                </span>
              )}
            </td>
            <td data-label="มันตีคุณโดน" className="num">
              {m.theyHit === null ? '—' : (
                <span style={{ color: m.theyHit <= 5 ? 'var(--status-safe)' : m.theyHit >= 50 ? 'var(--status-danger)' : undefined }}>
                  {m.theyHit}%
                </span>
              )}
            </td>
            <td data-label="โดน 100% ต้อง HIT" className="num">{m.hit100 === null ? '—' : m.hit100}</td>
            <td data-label="หลบตัน 95% ต้อง FLEE" className="num">{m.flee95 === null ? '—' : m.flee95}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
