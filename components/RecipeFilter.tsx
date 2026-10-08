'use client';

// Search, filter chips and the "show unconfirmed" switch for RecipeCards.
// It hides server-rendered cards in place (the `hidden` attribute), so the
// guide reads in full without JavaScript and to search engines.

import { useEffect, useState } from 'react';

export interface RecipeFacet {
  label: string;
  options: { value: string; label: string; count: number; icon?: string }[];
}

export default function RecipeFilter({
  group,
  facets = [],
  placeholder,
  unsureCount = 0,
}: {
  group: string;
  facets?: RecipeFacet[];
  placeholder: string;
  unsureCount?: number;
}) {
  const [q, setQ] = useState('');
  const [picked, setPicked] = useState<string[]>(() => facets.map(() => ''));
  const [unsure, setUnsure] = useState(false);
  const [shown, setShown] = useState<number | null>(null);

  useEffect(() => {
    const needle = q.trim().toLowerCase();
    let n = 0;
    document.querySelectorAll<HTMLElement>(`[data-rgroup="${group}"] .rcard`).forEach((card) => {
      const tags = (card.dataset.tags ?? '').split(' ');
      const hit =
        (unsure || !card.dataset.unsure) &&
        picked.every((p) => !p || tags.includes(p)) &&
        (!needle || (card.dataset.q ?? '').includes(needle));
      card.hidden = !hit;
      if (hit) n += 1;
    });
    setShown(n);
  }, [q, picked, unsure, group]);

  return (
    <div className="rfilter">
      <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} aria-label="ค้นสูตร" autoComplete="off" />
      {facets.map((f, i) => (
        <div key={f.label} className="rfilter__row" role="group" aria-label={f.label}>
          <span className="rfilter__label">{f.label}</span>
          {[{ value: '', label: 'ทั้งหมด', count: 0 }, ...f.options].map((o) => {
            const on = picked[i] === o.value;
            return (
              <button
                key={o.value || 'all'}
                type="button"
                className={'rfilter__chip' + (on ? ' is-on' : '')}
                aria-pressed={on}
                onClick={() => setPicked((p) => p.map((v, j) => (j === i ? o.value : v)))}
              >
                {'icon' in o && o.icon && <img src={o.icon} alt="" width={18} height={18} />}
                {o.label}
                {o.count > 0 && <small>{o.count}</small>}
              </button>
            );
          })}
        </div>
      ))}
      <div className="rfilter__foot">
        <span aria-live="polite">{shown === null ? ' ' : shown ? `แสดง ${shown} สูตร` : 'ไม่เจอสูตรที่ตรง ลองคำอื่น'}</span>
        {unsureCount > 0 && (
          <label className="rfilter__unsure">
            <input type="checkbox" checked={unsure} onChange={(e) => setUnsure(e.target.checked)} />
            รวมสูตรที่ยังไม่ยืนยัน ({unsureCount})
          </label>
        )}
      </div>
    </div>
  );
}
