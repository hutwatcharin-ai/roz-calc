// The two questions that made this data worth building, plus the shape of the
// rows so a rebuild that changes the parser cannot empty it silently.
import { describe, it, expect } from 'vitest';
import { shopsFor, ALL_SHOPS, ALL_SHOP_ROWS, ITEMS_WITH_A_SELLER } from '@/lib/npc-shops';

describe('npc shops', () => {
  it('answers the search that the site could not: where Milk is sold', () => {
    // "milk ro ซื้อที่ไหน" -- Search Console, landing on our Milk page.
    const milk = shopsFor(519);
    expect(milk.map((s) => s.map).sort()).toEqual(['izlude', 'prontera']);
    expect(milk).toContainEqual({ npc: 'Vendor from Milk Ranch', map: 'izlude', x: 128, y: 158, price: null });
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
    // 167 at the last build. The renewal-only first version reached 81, so a
    // number back down near that means a source stopped being read.
    expect(ITEMS_WITH_A_SELLER).toBeGreaterThan(150);
  });

  it('sends nobody to a region this game does not have', () => {
    // The first version put 84 of its 299 rows in Dewata, Malangdo, Malaya,
    // Lighthalzen, El Dicastes and Mora, and 14 items had their only seller
    // there -- a /navi to a town you cannot reach.
    const closed = /^(dew|malangdo|malaya|ma_in|lhz|lighthalzen|ein|bra|ra_|rachel|dic|mosk|moscovia|hu_|hugel|yuno|ve_|veins|mora|mid_camp|que_ng|s_atelier|jawaii)/;
    const bad = ALL_SHOP_ROWS.filter((row) => closed.test(row.map));
    expect(bad.map((row) => `${row.npc} ${row.map}`)).toEqual([]);
  });

  it('never lists the same NPC twice for one item', () => {
    // Three source files overlap; the same Tool Dealer appears in two of them.
    for (const [id, rows] of ALL_SHOPS) {
      const places = new Set(rows.map((r) => `${r.npc}|${r.map}|${r.x}|${r.y}`));
      expect(places.size, `item ${id}`).toBe(rows.length);
    }
  });
});
