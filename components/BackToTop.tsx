'use client';

// A button back to the top of the page, shown once the reader is well down
// it. The UX audit of 30 Oct 2026 found the long pages (the world map, the
// quest lists, the battle pass item table) left the reader thumbing all the
// way back up. On a phone it sits above the bottom nav (components/BottomNav).

import { useEffect, useState } from 'react';

/** How far down, in screen heights, before the button shows. */
const SHOW_AFTER_SCREENS = 1.5;

export default function BackToTop() {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const onScroll = () => setShown(window.scrollY > window.innerHeight * SHOW_AFTER_SCREENS);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const toTop = () => {
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: still ? 'auto' : 'smooth' });
  };

  return (
    <button
      type="button"
      className={shown ? 'totop totop--on' : 'totop'}
      onClick={toTop}
      aria-label="กลับขึ้นบนสุด"
      title="กลับขึ้นบนสุด"
      tabIndex={shown ? 0 : -1}
      aria-hidden={!shown}
    >
      <span className="totop__arrow" aria-hidden="true">▲</span>
      <span className="totop__label" aria-hidden="true">TOP</span>
    </button>
  );
}
