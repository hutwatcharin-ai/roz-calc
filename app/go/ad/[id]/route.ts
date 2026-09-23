// Every advertising click passes through here on its way out, so the click
// count is ours rather than the advertiser's word, and an ad blocker cannot
// hide it the way it hides GA4.
//
// The count itself still goes to GA4, server side, through the Measurement
// Protocol -- which needs GA4_API_SECRET (GA4 admin > Data Streams > Measurement
// Protocol API secrets). Without it the redirect still works and the click
// simply goes uncounted, because sending a reader to a dead end to record a
// number would be the wrong trade.

import { NextResponse } from 'next/server';
import { adsFor } from '@/lib/ads';
import { SITE_URL } from '@/lib/site';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const today = new Date().toISOString().slice(0, 10);
  const ad = [...adsFor('top', today), ...adsFor('inline', today)].find((a) => a.id === params.id);
  // SITE_URL, not request.url: behind the proxy the request carries the
  // container's own host, and the fallback sent readers to localhost:3000
  // (seen on production, 23 Sep 2026).
  if (!ad) return NextResponse.redirect(new URL('/advertise', SITE_URL), 302);

  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  const secret = process.env.GA4_API_SECRET;
  if (gaId && secret) {
    try {
      await fetch(`https://www.google-analytics.com/mp/collect?measurement_id=${gaId}&api_secret=${secret}`, {
        method: 'POST',
        body: JSON.stringify({
          // No cookie is read here, so each click is its own anonymous client:
          // the number of clicks is what the report needs, not who made them.
          client_id: `${Date.now()}.${Math.floor(Math.random() * 1e9)}`,
          events: [{ name: 'banner_click', params: { ad_id: ad.id, ad_slot: ad.slot, advertiser: ad.advertiser } }],
        }),
      });
    } catch (error) {
      console.error('ad click not counted', error);
    }
  }

  return NextResponse.redirect(ad.href, 302);
}
