import { describe, expect, it } from 'vitest';
import { GUIDE_GROUPS, SECTION_LINKS } from './nav-links';
import { GUIDES } from './guide-cards';

// The guides row, the phone picker and the /guides page all read their order
// and grouping from SECTION_LINKS.guides. These keep a new guide from landing
// in no group (it would vanish from /guides) or in a group run split in two.
describe('guide groups', () => {
  const links = SECTION_LINKS.guides;

  it('puts every guide link in a known group', () => {
    expect(links.filter((link) => !GUIDE_GROUPS.includes(link.group as (typeof GUIDE_GROUPS)[number])).map((l) => l.href)).toEqual([]);
  });

  it('keeps each group in one unbroken run, in GUIDE_GROUPS order', () => {
    const runs = links.map((l) => l.group).filter((g, i, all) => g !== all[i - 1]);
    expect(runs).toEqual([...GUIDE_GROUPS]);
  });

  it('has a /guides card for every guide link and no card without one', () => {
    expect(GUIDES.map((g) => g.href).sort()).toEqual(links.map((l) => l.href).sort());
  });
});
