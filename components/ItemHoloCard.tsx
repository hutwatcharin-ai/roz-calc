'use client';
// The item's collection picture as a holo trading card on a gear page (owner,
// 3 Nov 2026, design 1 of 5). The card tilts toward the pointer or finger and
// a rainbow sheen follows it; with nothing touching it the sheen drifts by
// itself, since a phone has no hover. Reduced motion keeps the card still.
import { useRef } from 'react';

export default function ItemHoloCard({
  src,
  name,
  kind,
  type,
  slots,
  level,
}: {
  src: string;
  name: string;
  kind: 'weapon' | 'armor';
  type: string | null;
  slots: number;
  level: number | null;
}) {
  const card = useRef<HTMLDivElement>(null);

  function move(e: React.PointerEvent) {
    const el = card.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    const py = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
    el.style.setProperty('--rx', `${(0.5 - py) * 18}deg`);
    el.style.setProperty('--ry', `${(px - 0.5) * 18}deg`);
    el.style.setProperty('--px', `${px * 100}%`);
    el.style.setProperty('--py', `${py * 100}%`);
    el.classList.add('is-live');
  }

  function leave() {
    const el = card.current;
    if (!el) return;
    el.classList.remove('is-live');
    el.style.removeProperty('--rx');
    el.style.removeProperty('--ry');
  }

  return (
    <div className="holo" onPointerMove={move} onPointerLeave={leave} onPointerUp={leave}>
      <div ref={card} className="holo__card" data-kind={kind}>
        <div className="holo__top">
          <span>{kind === 'weapon' ? 'WEAPON' : 'ARMOR'}</span>
          {level !== null && <span>Lv.{level}+</span>}
        </div>
        <div className="holo__win">
          <img src={src} alt={name} width={75} height={100} />
        </div>
        <div className="holo__name">
          {name}
          {slots > 0 && <span className="holo__slots">[{slots}]</span>}
        </div>
        {type && <div className="holo__type">{type}</div>}
        <span className="holo__shine" aria-hidden="true" />
      </div>
    </div>
  );
}
