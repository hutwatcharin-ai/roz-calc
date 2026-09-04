'use client';

import Link from 'next/link';
import AggroBadge from '@/components/AggroBadge';
import AddToPlanButton from '@/components/AddToPlanButton';
import { bySorted, useTableSort } from '@/lib/use-table-sort';

interface FarmingRow {
  monster_id: number;
  name_en: string;
  level: number;
  hp: number;
  base_exp: number | null;
  exp_per_hp: number;
  avg_zeny_per_kill: number;
  image_url: string | null;
  is_aggressive: boolean | null;
  atk_max: number | null;
  spawn?: string;
  hit100?: number | null;
}

export default function FarmingTable({ rows }: { rows: FarmingRow[] }) {
  const { sort, toggle, indicator } = useTableSort();

  if (rows.length === 0) {
    return <p style={{ color: 'var(--faint)' }}>ไม่พบมอนสเตอร์ในช่วงเลเวลนี้</p>;
  }

  return (
    <div className="card card--yellow" style={{ overflowX: 'auto' }}>
      <table className="data-table">
        <thead>
          <tr>
            <th><button type="button" className="thsort" onClick={() => toggle('name', false)}>มอนสเตอร์ {indicator('name')}</button></th>
            <th className="num"><button type="button" className="thsort" onClick={() => toggle('level')}>Lv {indicator('level')}</button></th>
            <th className="num"><button type="button" className="thsort" onClick={() => toggle('hp')}>HP {indicator('hp')}</button></th>
            <th className="num"><button type="button" className="thsort" onClick={() => toggle('exp')}>EXP {indicator('exp')}</button></th>
            <th className="num"><button type="button" className="thsort" onClick={() => toggle('exp_per_hp')}>EXP/HP {indicator('exp_per_hp')}</button></th>
            <th className="num"><button type="button" className="thsort" onClick={() => toggle('zeny')}>Zeny/ตัว {indicator('zeny')}</button></th>
            <th>แมพ</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {bySorted(rows, sort, (r, key) =>
            key === 'name' ? r.name_en
            : key === 'level' ? r.level
            : key === 'hp' ? r.hp
            : key === 'exp' ? r.base_exp ?? 0
            : key === 'exp_per_hp' ? r.exp_per_hp
            : key === 'zeny' ? r.avg_zeny_per_kill
            : null,
          ).map((row) => {
            return (
              <tr key={row.monster_id}>
                <td data-label="">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    {row.image_url && (
                      <img loading="lazy" decoding="async"
                        src={row.image_url}
                        alt=""
                        width={24}
                        height={24}
                        style={{ imageRendering: 'pixelated', flexShrink: 0 }}
                      />
                    )}
                    <Link href={`/database/monsters/${row.monster_id}`}>{row.name_en}</Link>
                    {/* The flag travels with the monster wherever it appears
                        (spec 3.15.1); this table is where a player picks a spot
                        to stand, so it matters most here. */}
                    <AggroBadge monster={{ is_aggressive: row.is_aggressive, atk_max: row.atk_max }} />
                  </div>
                </td>
                <td data-label="Lv" className="num">{row.level}</td>
                <td data-label="HP" className="num">{row.hp.toLocaleString()}</td>
                {/* Base EXP per kill (user, 2 Sep): the ratio alone hides
                    whether a 5.2 comes from 300 EXP or 18,000. */}
                <td data-label="EXP" className="num">{row.base_exp == null ? '—' : row.base_exp.toLocaleString()}</td>
                <td data-label="EXP/HP" className="num" style={{ color: 'var(--yellow)' }}>{row.exp_per_hp}</td>
                <td data-label="Zeny/ตัว" className="num">{row.avg_zeny_per_kill.toLocaleString()}</td>
                <td data-label="แมพ">{row.spawn ?? '—'}</td>
                {/* spec 3.6: the plan is built from the row a player is already
                    looking at, not by retyping a name on another page. */}
                <td data-label="">
                  <AddToPlanButton monsterId={row.monster_id} compact />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

    </div>
  );
}
