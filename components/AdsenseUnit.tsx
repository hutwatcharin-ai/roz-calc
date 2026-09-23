'use client';

// One AdSense unit, in the three places the owner picked (lib/ads).
//
// The box reserves its height before anything loads: an ad that arrives late
// and pushes the page down is the fastest way to lose the CLS score the site
// keeps at 0. Google fills the width itself (data-full-width-responsive), so
// only the height is ours to hold.
//
// The script that draws these is loaded once, after the page has settled
// (components/AdsenseScript). Until it arrives the box simply stays empty --
// which is also what happens for a reader with an ad blocker, and why the
// report an advertiser gets counts our own numbers, not Google's.

import { useEffect, useRef } from 'react';
import { ADSENSE_CLIENT, ADSENSE_HEIGHT, ADSENSE_SLOTS, ADSENSE_WIDTH, type AdsenseSlot } from '@/lib/ads';

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export default function AdsenseUnit({ slot }: { slot: AdsenseSlot }) {
  const pushed = useRef(false);
  const height = ADSENSE_HEIGHT[slot];
  const size = ADSENSE_WIDTH[slot];

  useEffect(() => {
    if (pushed.current) return;
    pushed.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (error) {
      // An ad blocker, or the script never arriving, is not a page error.
      console.debug('adsense push skipped', error);
    }
  }, []);

  return (
    <aside
      className={`adslot adslot--inline adslot--unit adslot--unit-${slot}`}
      style={{ '--ad-h': `${height.wide}px`, '--ad-narrow-h': `${height.narrow}px`, '--ad-w': `${size.wide}px`, '--ad-narrow-w': `${size.narrow}px` } as React.CSSProperties}
      aria-label="โฆษณา"
    >
      <span className="adslot__tag">โฆษณา</span>
      {/* A fixed size, not data-ad-format="auto": the responsive unit sized
          itself once the script ran and grew the box from 250 px to 390 px on
          a phone, moving the page under the reader (CLS 0.07 in testing,
          0.003 with this). The sizes are the ones the slots are sold at. */}
      <ins
        className="adsbygoogle adslot__ins"
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={ADSENSE_SLOTS[slot]}
      />
    </aside>
  );
}
