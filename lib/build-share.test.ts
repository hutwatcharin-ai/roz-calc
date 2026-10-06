import { describe, expect, it } from 'vitest';
import { BUILD_ID, buildId } from './build-share';
import { buildCardSvg } from './build-card';
import { EMPTY_BUILD, sanitizeBuild, type Build } from './build-calc';

const b: Build = { ...EMPTY_BUILD, cls: 'assassin', g: { weapon: { id: 1201, r: 7, c: [4029, 0, 0] } } };

describe('build short links', () => {
  it('gives the same build the same id, and a different build another', () => {
    const id = buildId(sanitizeBuild(b)!);
    expect(id).toMatch(BUILD_ID);
    expect(buildId(sanitizeBuild(JSON.parse(JSON.stringify(b)))!)).toBe(id);
    expect(buildId(sanitizeBuild({ ...b, lv: 51 })!)).not.toBe(id);
  });

  it('never uses letters that read as 0 or 1', () => {
    for (let lv = 1; lv <= 60; lv++) expect(buildId(sanitizeBuild({ ...b, lv })!)).not.toMatch(/[lIoO]/);
  });
});

describe('build card', () => {
  it('draws the class, the numbers, the link and the gear', () => {
    const svg = buildCardSvg(sanitizeBuild(b)!, 'abcd1234');
    expect(svg).toContain('ASSASSIN');
    expect(svg).toContain('rozerothai.com/b/abcd1234');
    expect(svg).toContain('+7');
    // The knife GIF arrives as pixel rectangles, the sprite as an embedded PNG.
    expect((svg.match(/<rect /g) ?? []).length).toBeGreaterThan(100);
    expect(svg).toContain('data:image/png;base64,');
  });

  it('escapes text', () => {
    expect(buildCardSvg(sanitizeBuild(b)!, 'a<b>"&')).toContain('a&lt;b&gt;&quot;&amp;');
  });
});
