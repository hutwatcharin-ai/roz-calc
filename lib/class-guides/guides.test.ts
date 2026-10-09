import { describe, expect, it } from 'vitest';
import { CLASS_GUIDES } from './index';
import { checkGuide } from './check-guide';

describe('class guides', () => {
  it.each(CLASS_GUIDES.map((g) => [g.slug, g] as const))('%s is internally consistent', (_, guide) => {
    checkGuide(guide);
  });
});

describe('citeHref', () => {
  it('turns m:ss and h:mm:ss into seconds', async () => {
    const { citeHref } = await import('./index');
    const u = 'https://www.youtube.com/watch?v=x';
    expect(citeHref(u, '1:05')).toBe(`${u}&t=65s`);
    expect(citeHref(u, '4:49:40')).toBe(`${u}&t=17380s`);
  });
});
