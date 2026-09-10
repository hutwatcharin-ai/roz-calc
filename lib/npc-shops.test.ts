// The two questions that made this data worth building, plus the shape of the
// rows so a rebuild that changes the parser cannot empty it silently.
import { describe, it, expect } from 'vitest';
import { shopsFor, ITEMS_WITH_A_SELLER } from '@/lib/npc-shops';

describe('npc shops', () => {
  it('answers the search that the site could not: where Milk is sold', () => {
    // "milk ro ซื้อที่ไหน" -- Search Console, landing on our Milk page.
    const milk = shopsFor(519);
    expect(milk).toHaveLength(1);
    expect(milk[0]).toMatchObject({ npc: 'Vendor from Milk Ranch', map: 'izlude', x: 128, y: 158 });
  });

  it('answers where the cooking books come from', () => {
    // /guides/cooking says you need the matching cookbook and nothing said
    // where to get one; only Lv.6, 7 and 9 drop from monsters.
    const book = shopsFor(7473);
    expect(book[0]).toMatchObject({ npc: 'Chef Assistant', map: 'prontera' });
  });

  it('carries several towns for an item sold in several towns', () => {
    const kit = shopsFor(12125);
    expect(kit.length).toBeGreaterThan(1);
    expect(new Set(kit.map((s) => s.map)).size).toBe(kit.length);
  });

  it('has nothing for an item nobody sells', () => {
    // A card is monster loot; no shop line should have produced a row.
    expect(shopsFor(4001)).toEqual([]);
  });

  it('covers a real slice of the catalogue', () => {
    expect(ITEMS_WITH_A_SELLER).toBeGreaterThan(50);
  });
});
