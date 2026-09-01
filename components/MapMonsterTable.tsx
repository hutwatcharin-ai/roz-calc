'use client';

// The map page's monster table with clickable column sorting. Extracted from
// the server page so the sort can live in the browser; the page still fetches
// and passes plain rows.
import Link from 'next/link';
import AggroBadge from '@/components/AggroBadge';
import CVariantToggle from '@/components/CVariantToggle';
import { isCVariant } from '@/lib/c-variant';
import { bySorted, useTableSort } from '@/lib/use-table-sort';

export interface MapMonsterRow {
  id: number;
  name_en: string;
  level: number | null;
  hp: number | null;
  base_exp: number | null;
  image_url: string | null;
  is_aggressive: boolean | null;
  atk_max: number | null;
}

export default function MapMonsterTable({ monsters, cCount }: { monsters: MapMonsterRow[]; cCount: number }) {
  const { sort, toggle, indicator } = useTableSort();

  const rows = bySorted(monsters, sort, (m, key) =>
    key === 'name' ? m.name_en
    : key === 'level' ? m.level
    : key === 'hp' ? (m.hp && m.hp > 0 ? m.hp : null)
    : key === 'exp' ? (m.base_exp && m.base_exp > 0 ? m.base_exp : null)
    : null,
  );

  return (
    <>
      {cCount > 0 && <CVariantToggle mode="local" />}
      <div className="card" style={{ marginTop: 20 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th><button type="button" className="thsort" onClick={() => toggle('name', false)}>มอนสเตอร์ {indicator('name')}</button></th>
              <th className="num"><button type="button" className="thsort" onClick={() => toggle('level', false)}>Lv {indicator('level')}</button></th>
              <th className="num"><button type="button" className="thsort" onClick={() => toggle('hp')}>HP {indicator('hp')}</button></th>
              <th className="num"><button type="button" className="thsort" onClick={() => toggle('exp')}>Base EXP {indicator('exp')}</button></th>
              <th>โจมตีก่อน</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => (
              <tr key={m.id} className={isCVariant(m.name_en) ? 'cvariant' : undefined}>
                <td data-label="">
                  <Link href={`/database/monsters/${m.id}`} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {m.image_url && (
                      <img src={m.image_url} alt="" width={24} height={24} style={{ imageRendering: 'pixelated' }} />
                    )}
                    {m.name_en}
                  </Link>
                </td>
                <td data-label="Lv" className="num">{m.level}</td>
                {/* hp and base_exp of 0 are the unknown-value sentinels, not real zeros. */}
                <td data-label="HP" className="num">{m.hp && m.hp > 0 ? m.hp.toLocaleString('en-US') : '—'}</td>
                <td data-label="Base EXP" className="num">{m.base_exp && m.base_exp > 0 ? m.base_exp.toLocaleString('en-US') : '—'}</td>
                <td data-label="โจมตีก่อน">
                  <AggroBadge monster={{ is_aggressive: m.is_aggressive, atk_max: m.atk_max }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
