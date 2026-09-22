import { describe, it } from 'vitest';
import { CLASS_GUIDES } from './index';
import { checkGuide } from './check-guide';

describe('class guides', () => {
  it.each(CLASS_GUIDES.map((g) => [g.slug, g] as const))('%s is internally consistent', (_, guide) => {
    checkGuide(guide);
  });
});
