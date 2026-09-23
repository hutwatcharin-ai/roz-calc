'use client';

// Counts an advertising impression once the slot is actually on screen, not
// when the page renders: a banner below the fold that nobody scrolled to was
// not seen, and the monthly report an advertiser pays for has to say what
// happened rather than what was served.
//
// Ad blockers take GA4 with them, so this counts perhaps 10-20% low. The
// report says so; clicks are counted by our own /go/ad route instead.

import { useEffect, useRef } from 'react';
import { track } from '@/lib/analytics';

export default function AdImpression({ id, slot, advertiser }: { id: string; slot: string; advertiser: string }) {
  const marker = useRef<HTMLSpanElement>(null);
  const sent = useRef(false);

  useEffect(() => {
    const node = marker.current;
    if (!node || sent.current) return;
    if (typeof IntersectionObserver !== 'function') {
      sent.current = true;
      track('ad_impression', { ad_id: id, ad_slot: slot, advertiser });
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting || sent.current) continue;
        sent.current = true;
        track('ad_impression', { ad_id: id, ad_slot: slot, advertiser });
        observer.disconnect();
      }
    }, { threshold: 0.5 });
    observer.observe(node);
    return () => observer.disconnect();
  }, [id, slot, advertiser]);

  return <span ref={marker} aria-hidden="true" className="adslot__marker" />;
}
