import { describe, it, expect } from 'vitest';
import robots from './robots';
import { SITE_URL } from '@/lib/site';

describe('robots.txt', () => {
  it('points crawlers at the sitemap', () => {
    // The whole reason this file exists: /robots.txt was a 404, so nothing led
    // a crawler to the 2,300 URLs the sitemap lists.
    expect(robots().sitemap).toBe(`${SITE_URL}/sitemap.xml`);
  });

  it('allows everything, and disallows nothing', () => {
    // Every route is a public reference page. A Disallow added "just in case"
    // is how a site quietly loses pages it meant to have indexed, and this
    // asserts none has crept in.
    const rules = Array.isArray(robots().rules) ? robots().rules : [robots().rules];
    expect(rules).toHaveLength(1);
    for (const rule of rules as { userAgent?: string | string[]; allow?: string | string[]; disallow?: string | string[] }[]) {
      expect(rule.userAgent).toBe('*');
      expect(rule.allow).toBe('/');
      expect(rule.disallow).toBeUndefined();
    }
  });

  it('uses an absolute sitemap URL, which is the only form robots.txt accepts', () => {
    expect(String(robots().sitemap)).toMatch(/^https?:\/\//);
  });
});
