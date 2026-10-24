import { describe, expect, it } from 'vitest';
import { PRESET_CLASSES, buildPresets } from './build-presets';
import { decodeBuild } from './build-calc';
import { BASE_LEVEL_CAP } from './level-cap';

describe('sample builds on /tools/build', () => {
  // A class guide edited so that no row qualifies would quietly drop its
  // button; the page should keep one per class.
  it('finds one sample for every class it offers', () => {
    expect(buildPresets().map((p) => p.slug)).toEqual(PRESET_CLASSES);
  });

  it('each opens as a real build of its class, within the level cap', () => {
    for (const p of buildPresets()) {
      const build = decodeBuild(new URL(p.href, 'https://x').searchParams.get('b'));
      expect(build, p.slug).not.toBeNull();
      expect(build!.cls).toBe(p.slug);
      expect(build!.lv).toBeLessThanOrEqual(BASE_LEVEL_CAP);
      expect(Object.values(build!.st).filter((v) => v > 1).length).toBeGreaterThanOrEqual(3);
    }
  });
});
