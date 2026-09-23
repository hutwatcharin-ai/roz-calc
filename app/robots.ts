import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

// The site shipped without one: /robots.txt returned 404, so nothing pointed a
// crawler at the 2,300-URL sitemap and the only way in was whatever a crawler
// happened to follow from the home page.
//
// Everything is allowed except pages parked on purpose. There is no admin
// area, no user data and no paid content -- every other route here is a public
// reference page, and a Disallow rule added "just in case" is how a site
// quietly loses pages it wanted indexed.
//
// /tools/enchant is parked: the system is not in the live game yet (owner,
// 24 Sep 2026). It was reachable for a few minutes, so it is refused here as
// well as carrying a noindex, and it is out of the menu and the sitemap.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/tools/enchant'] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
