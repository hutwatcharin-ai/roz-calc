import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

// The site shipped without one: /robots.txt returned 404, so nothing pointed a
// crawler at the 2,300-URL sitemap and the only way in was whatever a crawler
// happened to follow from the home page.
//
// Everything is allowed. There is no admin area, no user data and no paid
// content -- every route here is a public reference page, and a Disallow rule
// added "just in case" is how a site quietly loses pages it wanted indexed.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/' }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
