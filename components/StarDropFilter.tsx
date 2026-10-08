'use client';

// Narrows the star gear guide's "who drops the ordinary piece" list, which
// runs to some forty blocks (owner, 8 Oct 2026: the guides should be easy to
// use, not only long). Search matches the piece or a monster; the switch
// hides monsters that are not in the game yet. Server-rendered blocks are
// hidden in place, so the list reads in full without JavaScript.

import { useEffect, useState } from 'react';

export default function StarDropFilter() {
  const [q, setQ] = useState('');
  const [liveOnly, setLiveOnly] = useState(false);
  const [shown, setShown] = useState<number | null>(null);

  useEffect(() => {
    const needle = q.trim().toLowerCase();
    let n = 0;
    document.querySelectorAll<HTMLElement>('#sec-drops .stardrop__item').forEach((item) => {
      const head = (item.querySelector('.stardrop__head')?.textContent ?? '').toLowerCase();
      let anyMon = false;
      item.querySelectorAll<HTMLElement>('.stardrop__mon').forEach((mon) => {
        const off = mon.classList.contains('stardrop__mon--off');
        const nameHit = !needle || head.includes(needle) || (mon.textContent ?? '').toLowerCase().includes(needle);
        const show = !(liveOnly && off) && nameHit;
        mon.hidden = !show;
        if (show) anyMon = true;
      });
      const hasMons = item.querySelector('.stardrop__mon') !== null;
      const hit = hasMons ? anyMon : !liveOnly && (!needle || head.includes(needle));
      item.hidden = !hit;
      if (hit) n += 1;
    });
    setShown(needle || liveOnly ? n : null);
  }, [q, liveOnly]);

  return (
    <div className="rfilter">
      <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นชื่อของ หรือชื่อมอน เช่น Stiletto หรือ Muka" aria-label="ค้นของหรือมอน" autoComplete="off" />
      <div className="rfilter__foot">
        <span aria-live="polite">{shown === null ? ' ' : shown ? `เจอ ${shown} ชิ้น` : 'ไม่เจอ ลองคำอื่น'}</span>
        <label className="rfilter__unsure">
          <input type="checkbox" checked={liveOnly} onChange={(e) => setLiveOnly(e.target.checked)} />
          เฉพาะมอนที่ตีได้ตอนนี้
        </label>
      </div>
    </div>
  );
}
