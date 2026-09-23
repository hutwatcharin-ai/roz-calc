'use client';

// The AdSense loader, once for the whole site.
//
// lazyOnload, like gtag: it is a third-party script of about 100 kB and the
// page must not wait on it. Moving gtag off afterInteractive took the home
// page's blocking time from 715 ms to 132 ms (23 Sep 2026); this one gets the
// same treatment from the start.

import Script from 'next/script';
import { ADSENSE_CLIENT } from '@/lib/ads';

export default function AdsenseScript() {
  return (
    <Script
      id="adsbygoogle"
      strategy="lazyOnload"
      async
      crossOrigin="anonymous"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
    />
  );
}
