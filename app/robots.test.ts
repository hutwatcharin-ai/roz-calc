import { describe, it, expect } from 'vitest';
import robots from './robots';
import { SITE_URL } from '@/lib/site';

describe('robots.txt', () => {
  it('points crawlers at the sitemap', () => {
    // The whole reason this file exists: /robots.txt was a 404, so nothing led
    // a crawler to the 2,300 URLs the sitemap lists.
    expect(robots().sitemap).toBe(`${SITE_URL}/sitemap.xml`);
  });

  // Pages parked on purpose, each with the reason. A Disallow added "just in
  // case" is how a site quietly loses pages it meant to have indexed, so a new
  // path has to be added here before robots.ts may refuse it.
  const PARKED = [
    {
      path: '/tools/enchant',
      why: 'enchanting is not in the live game yet (owner, 24 Sep 2026); unpark with the noindex on the page and its nav entry',
    },
  ];

  it('allows everything except the paths parked on purpose', () => {
    const rules = Array.isArray(robots().rules) ? robots().rules : [robots().rules];
    expect(rules).toHaveLength(1);
    for (const rule of rules as { userAgent?: string | string[]; allow?: string | string[]; disallow?: string | string[] }[]) {
      expect(rule.userAgent).toBe('*');
      expect(rule.allow).toBe('/');
      const disallow = rule.disallow === undefined ? [] : [rule.disallow].flat();
      expect(disallow).toEqual(PARKED.map((p) => p.path));
    }
  });

  it('uses an absolute sitemap URL, which is the only form robots.txt accepts', () => {
    expect(String(robots().sitemap)).toMatch(/^https?:\/\//);
  });
});
