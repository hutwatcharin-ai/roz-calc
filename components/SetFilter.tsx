'use client';

// Search box plus kind chips for /guides/item-sets. Both filter the server-
// rendered cards in place (the `hidden` attribute), so the page works and is
// crawlable without JavaScript; this only narrows it.

import { useEffect, useState } from 'react';

export default function SetFilter({ kinds }: { kinds: { kind: string; label: string; count: number }[] }) {
  const [q, setQ] = useState('');
  const [kind, setKind] = useState<string>('all');
  const [shown, setShown] = useState<number | null>(null);

  useEffect(() => {
    const needle = q.trim().toLowerCase();
    let n = 0;
    document.querySelectorAll<HTMLElement>('.isetgroup').forEach((group) => {
      let any = false;
      group.querySelectorAll<HTMLElement>('.iset').forEach((card) => {
        const hit = (kind === 'all' || card.dataset.kind === kind) && (!needle || (card.dataset.q ?? '').includes(needle));
        card.hidden = !hit;
        if (hit) { any = true; n += 1; }
      });
      group.hidden = !any;
    });
    setShown(needle || kind !== 'all' ? n : null);
  }, [q, kind]);

  const total = kinds.reduce((a, k) => a + k.count, 0);

  return (
    <div className="setfilter">
      <label className="field__label" htmlFor="setq">ค้นชื่อไอเทม ชื่อการ์ด หรือค่าที่อยากได้</label>
      <input id="setq" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="เช่น Wolf Card หรือ FLEE" autoComplete="off" />
      <div className="chips setfilter__chips" role="group" aria-label="เลือกหมวด">
        {[{ kind: 'all', label: 'ทั้งหมด', count: total }, ...kinds].map((k) => (
          <button
            key={k.kind}
            type="button"
            className={'chip' + (kind === k.kind ? ' chip--on' : '')}
            aria-pressed={kind === k.kind}
            onClick={() => setKind(k.kind)}
          >
            {k.label} <span className="chip__count">{k.count}</span>
          </button>
        ))}
      </div>
      <p className="muted setfilter__count" aria-live="polite">{shown !== null ? (shown ? `เจอ ${shown} เซ็ต` : 'ไม่เจอเซ็ตที่ตรง ลองคำอื่น') : ' '}</p>
    </div>
  );
}
