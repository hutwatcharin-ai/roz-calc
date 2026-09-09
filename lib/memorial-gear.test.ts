import { describe, it, expect } from 'vitest';
import { memorialGear, LEVEL_CAP } from './memorial-gear';

// data/memorial-gear.json is generated from a mirrored guide by
// scripts/build-memorial-gear.mjs. The page built on it makes claims a player
// will act on -- which piece upgrades into which, and what an enchant is
// likely to roll -- so the shape of that file is checked here rather than
// trusted because it parsed.

describe('the gear ladder', () => {
  it('has four ranks, each with a level and a way to get it', () => {
    expect(memorialGear.ranks).toHaveLength(4);
    for (const rank of memorialGear.ranks) {
      expect(rank.level, rank.name).toBeGreaterThan(0);
      expect(rank.from.length, rank.name).toBeGreaterThan(0);
    }
  });

  it('rises in level from rank IV up to rank I', () => {
    const levels = memorialGear.ranks.map((r) => r.level);
    expect(levels).toEqual([...levels].sort((a, b) => a - b));
  });

  // The page's whole framing -- one rank wearable, three not -- falls apart if
  // this stops being true, so it is stated rather than assumed.
  it('has exactly one rank inside the current level cap', () => {
    expect(memorialGear.ranks.filter((r) => r.level <= LEVEL_CAP)).toHaveLength(1);
  });

  it('gives every set four pieces and a role, and every piece a rank', () => {
    const ranks = new Set(memorialGear.ranks.map((r) => r.rank));
    for (const set of memorialGear.sets) {
      expect(set.pieces, set.role).toHaveLength(4);
      expect(set.role.length).toBeGreaterThan(0);
      expect(ranks.has(set.rank), `${set.rank} is not a rank`).toBe(true);
    }
  });

  it('lists no piece twice', () => {
    const all = memorialGear.sets.flatMap((s) => s.pieces);
    expect(new Set(all).size).toBe(all.length);
  });
});

describe('enchant outcomes', () => {
  const { outcomes } = memorialGear.enchantRules as unknown as {
    outcomes: { stat: string; value: string; armor: number | null; garment: number | null; shoes: number | null }[];
  };

  // The reason these are usable at all. Three columns of datamined rates, each
  // adding to exactly 100 -- an eyeballed table does not do that. If a
  // re-extraction drops a row or misreads a decimal comma, this is what says so.
  it('has each slot\'s chances add up to 100%', () => {
    for (const slot of ['armor', 'garment', 'shoes'] as const) {
      const total = outcomes.reduce((sum, o) => sum + (o[slot] ?? 0), 0);
      expect(Number(total.toFixed(2)), slot).toBe(100);
    }
  });

  it('states a stat and an amount for every outcome', () => {
    expect(outcomes.length).toBeGreaterThan(15);
    for (const o of outcomes) {
      expect(o.stat.length, JSON.stringify(o)).toBeGreaterThan(0);
      expect(o.value, JSON.stringify(o)).toMatch(/^\+\d+$/);
    }
  });

  // Armour has no Max HP +300 or +400 row upstream. That absence is data, so
  // it is carried as null and rendered as a dash -- never as 0%, which would
  // read as "this cannot happen" rather than "this is not on the list".
  it('carries a missing rate as null, not as zero', () => {
    const armourGaps = outcomes.filter((o) => o.armor === null);
    expect(armourGaps.length).toBeGreaterThan(0);
    expect(outcomes.every((o) => o.armor !== 0 && o.garment !== 0 && o.shoes !== 0)).toBe(true);
  });
});
