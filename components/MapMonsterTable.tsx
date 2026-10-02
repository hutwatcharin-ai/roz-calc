'use client';

// The map page's monsters with sorting. Extracted from the server page so the
// sort can live in the browser; the page still fetches and passes plain rows.
//
// A table until 2 Oct 2026, now character-select tiles like the monster list
// (owner's pick, public/draft/arcade-rest): frame in the element's colour,
// level in the corner, EXP in yellow, the HIT/FLEE targets and the
// first-strike badge kept on every tile. The column headers became a row of
// sort buttons.
import Link from 'next/link';
import AggroBadge from '@/components/AggroBadge';
import CVariantToggle from '@/components/CVariantToggle';
import { isCVariant } from '@/lib/c-variant';
import { bySorted, useTableSort } from '@/lib/use-table-sort';
import { ELEMENT_COLOUR, ELEMENT_COLOUR_UNKNOWN } from '@/lib/element-colour';

export interface MapMonsterRow {
  id: number;
  name_en: string;
  level: number | null;
  hp: number | null;
  base_exp: number | null;
  image_url: string | null;
  is_aggressive: boolean | null;
  atk_max: number | null;
  // midgardhub player-side thresholds: HIT for 100% and FLEE for 95%
  // (user, 2 Sep: on every map page). Never mob stats -- see
  // lib/monster-thresholds.ts.
  hit_100?: number | null;
  flee_95?: number | null;
  element?: string | null;
}

export default function MapMonsterTable({ monsters, cCount }: { monsters: MapMonsterRow[]; cCount: number }) {
  const { sort, toggle, indicator } = useTableSort();

  const rows = bySorted(monsters, sort, (m, key) =>
    key === 'name' ? m.name_en
    : key === 'level' ? m.level
    : key === 'hp' ? (m.hp && m.hp > 0 ? m.hp : null)
    : key === 'exp' ? (m.base_exp && m.base_exp > 0 ? m.base_exp : null)
    : key === 'hit' ? m.hit_100 ?? null
    : key === 'flee' ? m.flee_95 ?? null
    : null,
  );

  return (
    <>
      {cCount > 0 && <CVariantToggle mode="local" />}
      <div className="mapsort" role="group" aria-label="เรียงมอนสเตอร์">
        <span className="mapsort__label">เรียง</span>
        {(
          [
            ['level', 'LV', false],
            ['name', 'ชื่อ', false],
            ['hp', 'HP', true],
            ['exp', 'EXP', true],
            ['hit', 'HIT 100%', false],
            ['flee', 'FLEE 95%', false],
          ] as const
        ).map(([key, label, desc]) => (
          <button key={key} type="button" className={`mapsort__btn${sort?.key === key ? ' on' : ''}`} onClick={() => toggle(key, desc)}>
            {label} {indicator(key)}
          </button>
        ))}
      </div>
      <ul className="maproster">
        {rows.map((m) => (
          <li key={m.id} className={isCVariant(m.name_en) ? 'cvariant' : undefined}>
            <Link
              href={`/database/monsters/${m.id}`}
              className="maptile"
              style={{ ['--el' as string]: (m.element && ELEMENT_COLOUR[m.element]) || ELEMENT_COLOUR_UNKNOWN }}
            >
              <span className="maptile__lv">LV {m.level ?? '—'}</span>
              <span className="maptile__art">{m.image_url && <img src={m.image_url} alt="" loading="lazy" />}</span>
              <b className="maptile__name">{m.name_en}</b>
              {/* hp and base_exp of 0 are the unknown-value sentinels, not real zeros. */}
              <span className="maptile__exp">{m.base_exp && m.base_exp > 0 ? `${m.base_exp.toLocaleString('en-US')} EXP` : 'EXP —'}</span>
              <span className="maptile__stats">
                HP {m.hp && m.hp > 0 ? m.hp.toLocaleString('en-US') : '—'}
                <span title="HIT ที่ต้องมีเพื่อตีมอนตัวนี้โดน 100%"> · HIT <b className="maptile__hit">{m.hit_100 ?? '—'}</b></span>
                <span title="FLEE ที่ต้องมีเพื่อหลบมอนตัวนี้ 95%"> · FLEE <b className="maptile__flee">{m.flee_95 ?? '—'}</b></span>
              </span>
              <AggroBadge monster={{ is_aggressive: m.is_aggressive, atk_max: m.atk_max }} />
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
