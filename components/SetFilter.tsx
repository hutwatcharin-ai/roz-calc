'use client';

// Filters the set cards on /guides/item-sets as you type, by set name, piece
// name or bonus. Hides cards with the `hidden` attribute; a group whose cards
// are all hidden hides too.

import { useEffect, useState } from 'react';

export default function SetFilter() {
  const [q, setQ] = useState('');
  const [shown, setShown] = useState<number | null>(null);

  useEffect(() => {
    const needle = q.trim().toLowerCase();
    let n = 0;
    document.querySelectorAll<HTMLElement>('.isetgroup').forEach((group) => {
      let any = false;
      group.querySelectorAll<HTMLElement>('.iset').forEach((card) => {
        const hit = !needle || (card.dataset.q ?? '').includes(needle);
        card.hidden = !hit;
        if (hit) { any = true; n += 1; }
      });
      group.hidden = !any;
    });
    setShown(needle ? n : null);
  }, [q]);

  return (
    <div className="field" style={{ maxWidth: 420 }}>
      <label className="field__label" htmlFor="setq">ค้นชื่อชุด ชื่อการ์ด หรือโบนัส</label>
      <input id="setq" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="เช่น Wolf Card หรือ FLEE" autoComplete="off" />
      {shown !== null && <p className="muted" style={{ margin: '6px 0 0', fontSize: 13 }} aria-live="polite">เจอ {shown} ชุด</p>}
    </div>
  );
}
