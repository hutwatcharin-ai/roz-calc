'use client';
// The item's collection picture as a trading card (owner, 3 Nov 2026, design
// 1 of 5). Gear and costumes get the holo: the card tilts toward the pointer
// or finger and a rainbow sheen follows it, drifting by itself when nothing
// touches it, since a phone has no hover. Everyday items (potions, loot) get
// the plain card, still and without the sheen. Reduced motion keeps every
// card still.
import { useRef, type ReactNode } from 'react';

export default function ItemHoloCard({
  src,
  name,
  kind,
  type,
  slots,
  level,
  plain = false,
  icon = null,
}: {
  src: string;
  name: string;
  kind: 'weapon' | 'armor' | 'costume' | 'item';
  type: string | null;
  slots: number;
  level: number | null;
  plain?: boolean;
  /** The inventory icon. On a phone it takes the card's top corner, where the
   *  kind label was, so the page needs no second picture (owner, 3 Nov 2026). */
  icon?: ReactNode;
}) {
  const card = useRef<HTMLDivElement>(null);

  function move(e: React.PointerEvent) {
    const el = card.current;
    if (!el || plain) return;
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
      <div ref={card} className={plain ? 'holo__card holo__card--plain' : 'holo__card'} data-kind={kind}>
        <div className="holo__top">
          {icon && <span className="holo__slot">{icon}</span>}
          <span className="holo__kind">{kind.toUpperCase()}</span>
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
        <div className="holo__foot" aria-hidden="true">{kind.toUpperCase()}</div>
        {!plain && <span className="holo__shine" aria-hidden="true" />}
      </div>
    </div>
  );
}
