import { describe, expect, it } from 'vitest';
import { findNames, isTimingOnly, isUrgent } from './discord-match.mjs';

const NAMES = [
  { name: 'Marc', href: '/database/monsters/1045', kind: 'monster' },
  { name: 'Northern Cave Luanda', href: '/database/maps/lua_dun02', kind: 'map' },
  { name: 'Cave', href: '/database/maps/cave', kind: 'map' },
  { name: 'Orc', href: '/database/monsters/1', kind: 'monster' },
  { name: 'Marcus', href: '/database/monsters/2', kind: 'monster' },
];

describe('findNames', () => {
  it('finds a monster and a map from the 22 Oct maintenance post', () => {
    const text = '• Marc will be added as a natural monster spawn in Northern Cave Luanda';
    expect(findNames(text, NAMES).map((n: { name: string }) => n.name)).toEqual(['Northern Cave Luanda', 'Marc']);
  });

  it('does not match inside a longer word, nor names under 4 letters', () => {
    expect(findNames('Marcus and the Orcs met an Orc', NAMES).map((n: { name: string }) => n.name)).toEqual(['Marcus']);
  });

  it('still lists a short name used on its own elsewhere in the post', () => {
    const text = 'Northern Cave Luanda opens. Another Cave too.';
    expect(findNames(text, NAMES).map((n: { name: string }) => n.name)).toEqual(['Northern Cave Luanda', 'Cave']);
  });
});

describe('isUrgent', () => {
  it('flags maintenance and patch posts only', () => {
    expect(isUrgent('[Notice] Ragnarok Zero: Global Scheduled Maintenance Reminder – 22nd October, 2026')).toBe(true);
    expect(isUrgent('Patch Notes 29 October')).toBe(true);
    expect(isUrgent('[Crossover Event] ROZG X RO Lite Arrow Cross Event #3')).toBe(false);
  });
});

describe('isTimingOnly', () => {
  // The 22 Oct "Has Begun" post as the inbox saved it.
  const BEGUN = 'Adventurers,\n\nThe scheduled maintenance for Ragnarok Zero: Global on 22 ต.ค. 2569 08:00 น. has now begun.\n\n🛠️ Maintenance Schedule\n⏰ Maintenance Time: 22 ต.ค. 2569 08:00 น. – 22 ต.ค. 2569 14:00 น.\n⏱️ Duration: 6 Hours\n\nWe will provide a follow-up announcement once maintenance has been completed.';
  const TITLE = '[Notice] Ragnarok Zero: Global Scheduled Maintenance Has Begun – 22nd October 2026';

  it('passes a post that only gives the times', () => {
    expect(isTimingOnly(TITLE, BEGUN, [])).toBe(true);
    expect(isTimingOnly('Maintenance Completed', 'Servers are back.', [])).toBe(true);
  });

  it('keeps a reminder, a post with a list, and a post that names something on the site', () => {
    expect(isTimingOnly('[Notice] Scheduled Maintenance Reminder – 22nd October, 2026', BEGUN, [])).toBe(false);
    expect(isTimingOnly('Maintenance Completed', 'Changes:\n• Marc will be added in Northern Cave Luanda', [])).toBe(false);
    expect(isTimingOnly('Maintenance Completed', '1. New dungeon', [])).toBe(false);
    expect(isTimingOnly(TITLE, BEGUN, [{ name: 'Marc', href: '/database/monsters/1045', kind: 'monster' }])).toBe(false);
  });
});

describe('findNames on item names', () => {
  it('skips one-word items and words in another case', () => {
    const names = [
      { name: 'Arrow', href: '/database/items/1750', kind: 'item' },
      { name: 'Unlimited Fly Wing', href: '/database/items/12887', kind: 'item' },
      { name: 'Poring', href: '/database/monsters/1002', kind: 'monster' },
    ];
    const text = 'RO Lite - ARROW: an Arrow, an Unlimited Fly Wing, and PORING';
    expect(findNames(text, names).map((n: { name: string }) => n.name)).toEqual(['Unlimited Fly Wing']);
  });
});
