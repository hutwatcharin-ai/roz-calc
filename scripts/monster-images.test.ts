import { describe, it, expect } from 'vitest';
import { missingImages, withServableImages, type HasImage } from './monster-images';

const ROWS: HasImage[] = [
  { id: 1002, name_en: 'Poring', image_url: '/images/monsters/1002.gif' },
  { id: 1582, name_en: 'Deviling', image_url: '/images/monsters/1582.png' },
  { id: 2812, name_en: 'C4 Golem', image_url: '/images/monsters/2812.png' },
  { id: 9999, name_en: 'No Picture', image_url: null },
];

// The real production state: everything mirrored as .gif exists, the two .png
// paths do not.
const exists = (p: string) => p.endsWith('.gif');

describe('missingImages', () => {
  it('names exactly the monsters whose picture the site cannot serve', () => {
    expect(missingImages(ROWS, exists).map((r) => r.name_en)).toEqual(['Deviling', 'C4 Golem']);
  });

  it('does not count a monster that never claimed to have a picture', () => {
    // image_url null is "no picture", which renders nothing and is fine. Only a
    // URL pointing at a file we do not serve is a defect.
    expect(missingImages(ROWS, exists).some((r) => r.id === 9999)).toBe(false);
  });

  it('reports nothing when every file is present', () => {
    expect(missingImages(ROWS, () => true)).toEqual([]);
  });
});

describe('withServableImages', () => {
  it('drops the unusable URL and keeps the monster', () => {
    const cleaned = withServableImages(ROWS, exists);
    expect(cleaned).toHaveLength(ROWS.length);
    expect(cleaned.find((r) => r.id === 1582)?.image_url).toBeNull();
    expect(cleaned.find((r) => r.id === 2812)?.image_url).toBeNull();
  });

  it('leaves a working image alone', () => {
    expect(withServableImages(ROWS, exists).find((r) => r.id === 1002)?.image_url).toBe(
      '/images/monsters/1002.gif',
    );
  });

  it('returns rows unchanged when nothing is missing', () => {
    expect(withServableImages(ROWS, () => true)).toEqual(ROWS);
  });
});
