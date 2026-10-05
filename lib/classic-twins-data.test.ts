import { describe, expect, it } from 'vitest';
import file from '@/data/classic-twins.json';
import { ZERO_ID_FLOOR, shopIdOf, zeroTwinOf } from './classic-twins';
import { recipesMaking } from './crafting';
import { isAbsentFromGame } from './game-absent';
import { ALL_NPCS } from './npcs';
import { shopsFor } from './npc-shops';

const twins = (file as { twins: Record<string, { to: number | null; shop: number | null; among: number[] }> }).twins;

describe('classic leftovers moved to their Zero copy', () => {
  it('maps every leftover to one of its own Zero namesakes', () => {
    for (const [id, t] of Object.entries(twins)) {
      expect(Number(id)).toBeLessThan(ZERO_ID_FLOOR);
      if (t.to !== null) expect(t.among).toContain(t.to);
    }
  });

  it('sells the shop copy (classic slot count), not the drop copy with a slot more', () => {
    // Owner, 5 Oct 2026: the shop sells Gladius [2] 510136 for 1,200z; Gladius
    // [3] 510182 is the drop copy.
    expect(zeroTwinOf(1219)).toBe(510136);
    expect(shopsFor(1219)).toEqual([]);
    expect(shopsFor(510182)).toEqual([]);
    expect(shopsFor(510136).some((s) => s.npc === 'Weapon Dealer')).toBe(true);
    expect(zeroTwinOf(1463)).toBe(630039);
  });

  it('gives no seller to an item Zero has only as the drop copy', () => {
    // Sword exists in Zero only as [4] 500096; no shop is known to sell it.
    expect(shopIdOf(1101)).toBeNull();
    expect(shopsFor(500096)).toEqual([]);
  });

  it('never moves a shop row to a copy with more slots than the classic one', () => {
    for (const t of Object.values(twins)) if (t.shop !== null) expect(t.shop).toBe(t.to);
  });

  it('forges the Zero Sword, not the classic one', () => {
    expect(recipesMaking(1101)).toEqual([]);
    expect(recipesMaking(zeroTwinOf(1101)!).length).toBeGreaterThan(0);
  });

  it('lists no leftover among any NPC goods', () => {
    const leftovers = new Set(Object.keys(twins).map(Number));
    expect(ALL_NPCS.flatMap((n) => n.sells).filter((id) => leftovers.has(id))).toEqual([]);
  });

  it('keeps leftovers out of lists and the sitemap', () => {
    expect(isAbsentFromGame(1463)).toBe(true);
    expect(isAbsentFromGame(630053)).toBe(false);
  });
});
