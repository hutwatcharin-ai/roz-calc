import { describe, expect, it } from 'vitest';
import file from '@/data/classic-twins.json';
import { ZERO_ID_FLOOR, zeroTwinOf } from './classic-twins';
import { recipesMaking } from './crafting';
import { isAbsentFromGame } from './game-absent';
import { ALL_NPCS } from './npcs';
import { shopsFor } from './npc-shops';

const twins = (file as { twins: Record<string, { to: number | null; among: number[] }> }).twins;

describe('classic leftovers moved to their Zero copy', () => {
  it('maps every leftover to one of its own Zero namesakes', () => {
    for (const [id, t] of Object.entries(twins)) {
      expect(Number(id)).toBeLessThan(ZERO_ID_FLOOR);
      if (t.to !== null) expect(t.among).toContain(t.to);
    }
  });

  it('puts the Weapon Dealer on 630053 Hallberd, the copy sold for 1,650z, not 1463', () => {
    expect(zeroTwinOf(1463)).toBe(630053);
    expect(shopsFor(1463)).toEqual([]);
    expect(shopsFor(630053).some((s) => s.npc === 'Weapon Dealer')).toBe(true);
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
