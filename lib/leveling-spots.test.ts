import { describe, expect, it } from 'vitest';
import { dedupeZoneVariants, levelWeight, rankSpots, scoreSpot, type Spot } from './leveling-spots';

function mob(over: Partial<Spot['monsters'][number]> = {}) {
  return {
    monster_id: 1,
    name_en: 'Test',
    level: 50,
    hp: 1000,
    base_exp: 100,
    hit_100: 200,
    is_aggressive: false,
    amount: 10,
    ...over,
  };
}

const CHAR = { level: 50, damagePerHit: 500, attacksPerSecond: 2, hit: 200 };

describe('levelWeight', () => {
  it('is 1 at the player level and 0 at the span edge', () => {
    expect(levelWeight(50, 50)).toBe(1);
    expect(levelWeight(65, 50)).toBe(0);
    expect(levelWeight(35, 50)).toBe(0);
  });

  it('never goes negative for a monster far outside the span', () => {
    expect(levelWeight(1, 50)).toBe(0);
    expect(levelWeight(200, 50)).toBe(0);
  });

  it('tapers symmetrically', () => {
    expect(levelWeight(55, 50)).toBeCloseTo(levelWeight(45, 50));
  });
});

describe('scoreSpot', () => {
  it('weights density by spawn amount and level distance', () => {
    const spot: Spot = {
      map_code: 'a',
      map_name: 'A',
      monsters: [mob({ amount: 10, base_exp: 100, level: 50 })],
    };
    // 10 monsters x 100 EXP x weight 1
    expect(scoreSpot(spot, 50, null).density).toBe(1000);
    // same map read by a level-60 player: weight 1 - 10/15
    expect(scoreSpot(spot, 60, null).density).toBeCloseTo(1000 * (1 / 3));
  });

  it('ignores the unknown-EXP marker instead of counting it as zero worth', () => {
    // base_exp 0 is the importer's "the feed said ???" marker (202 of 524
    // monsters carry it), so it must not drag a map's density down.
    const spot: Spot = { map_code: 'a', map_name: 'A', monsters: [mob({ base_exp: 0 })] };
    expect(scoreSpot(spot, 50, null).density).toBe(0);
    expect(scoreSpot(spot, 50, CHAR).bestExpPerHour).toBeNull();
  });

  it('counts misses in the EXP/hour it reports', () => {
    // hit_100 220 against HIT 200 is an 80% hit chance: the same monster pays
    // a fifth less per hour than one the player never misses. HP is high here
    // so the swing count is large -- on a two-hit monster the ceil() on whole
    // swings dominates and the ratio lands at 2/3, not 4/5 (next test).
    const easy: Spot = { map_code: 'a', map_name: 'A', monsters: [mob({ hp: 100000, hit_100: 200 })] };
    const hard: Spot = { map_code: 'b', map_name: 'B', monsters: [mob({ hp: 100000, hit_100: 220 })] };
    const e = scoreSpot(easy, 50, CHAR).bestExpPerHour!;
    const h = scoreSpot(hard, 50, CHAR).bestExpPerHour!;
    expect(h).toBeLessThan(e);
    expect(h / e).toBeCloseTo(0.8, 2);
  });

  it('rounds a partial swing up, which costs more on a monster that dies fast', () => {
    // 2 landed hits at 80% is 2.5 swings, and half a swing does not exist --
    // so a two-hit monster loses a third of its rate, not a fifth.
    const easy: Spot = { map_code: 'a', map_name: 'A', monsters: [mob({ hp: 1000, hit_100: 200 })] };
    const hard: Spot = { map_code: 'b', map_name: 'B', monsters: [mob({ hp: 1000, hit_100: 220 })] };
    const ratio =
      scoreSpot(hard, 50, CHAR).bestExpPerHour! / scoreSpot(easy, 50, CHAR).bestExpPerHour!;
    expect(ratio).toBeCloseTo(2 / 3, 5);
  });

  it('mixes EXP/hour by population, not by species', () => {
    // 90 cheap monsters and 10 rich ones: what you meet is mostly the cheap
    // one, so the map's mixed rate must sit near the cheap one's.
    const spot: Spot = {
      map_code: 'a',
      map_name: 'A',
      monsters: [
        mob({ monster_id: 1, amount: 90, base_exp: 100 }),
        mob({ monster_id: 2, amount: 10, base_exp: 1000 }),
      ],
    };
    const s = scoreSpot(spot, 50, CHAR);
    expect(s.bestExpPerHour).toBeGreaterThan(s.mixedExpPerHour!);
    expect(s.mixedExpPerHour!).toBeLessThan(s.bestExpPerHour! / 3);
  });

  it('reports spawn totals and how many species attack on sight', () => {
    const spot: Spot = {
      map_code: 'a',
      map_name: 'A',
      monsters: [mob({ amount: 30, is_aggressive: true }), mob({ monster_id: 2, amount: 12 })],
    };
    const s = scoreSpot(spot, 50, null);
    expect(s.spawnTotal).toBe(42);
    expect(s.aggressiveCount).toBe(1);
  });

  it('treats a missing spawn amount as no population rather than one', () => {
    // 307 of our 3,032 spawn rows have no count from any source.
    const spot: Spot = { map_code: 'a', map_name: 'A', monsters: [mob({ amount: null })] };
    const s = scoreSpot(spot, 50, CHAR);
    expect(s.spawnTotal).toBe(0);
    expect(s.density).toBe(0);
    expect(s.mixedExpPerHour).toBeNull();
    // The monster itself still gets a rate: the map just cannot be weighted.
    expect(s.bestExpPerHour).not.toBeNull();
  });
});

describe('rankSpots', () => {
  const dense: Spot = { map_code: 'dense', map_name: 'Dense', monsters: [mob({ amount: 100 })] };
  const rich: Spot = {
    map_code: 'rich',
    map_name: 'Rich',
    monsters: [mob({ monster_id: 2, amount: 5, base_exp: 5000 })],
  };

  it('ranks by density when nothing is known about the player', () => {
    expect(rankSpots([rich, dense], 50, null).map((s) => s.map_code)).toEqual(['rich', 'dense']);
  });

  it('ranks by the mixed EXP/hour once a character is known', () => {
    // Rich pays more per kill and both die in the same number of swings, so it
    // wins on rate too -- but now for a reason the player can check.
    expect(rankSpots([dense, rich], 50, CHAR).map((s) => s.map_code)).toEqual(['rich', 'dense']);
  });

  it('puts maps it cannot score last without dropping them', () => {
    const unknown: Spot = {
      map_code: 'unknown',
      map_name: 'Unknown',
      monsters: [mob({ monster_id: 3, amount: null, base_exp: 0, hp: 0 })],
    };
    const ranked = rankSpots([unknown, dense], 50, CHAR);
    expect(ranked.map((s) => s.map_code)).toEqual(['dense', 'unknown']);
    expect(ranked).toHaveLength(2);
  });
});

describe('dedupeZoneVariants', () => {
  const variant = (code: string, amount: number | null): Spot => ({
    map_code: code,
    map_name: 'Orc Village',
    monsters: [mob({ monster_id: 1023, amount }), mob({ monster_id: 1273, amount: 55 })],
  });

  it('collapses zones of one map into the variant with the most population', () => {
    // gef_fild10 and gef_f10_a/_b/_z are the same field: four identical rows
    // pushed three real maps out of the top ten.
    const out = dedupeZoneVariants([
      variant('gef_f10_a', 179),
      variant('gef_fild10', 179),
      variant('gef_f10_z', null),
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].zoneCount).toBe(3);
    expect(out[0].monsters[0].amount).toBe(179);
  });

  it('keeps two maps apart when they share a name but not their monsters', () => {
    const field: Spot = { map_code: 'gef_fild10', map_name: 'Orc Village', monsters: [mob({ monster_id: 1023 })] };
    const battleground: Spot = { map_code: 'b_gef_f10', map_name: 'Orc Village', monsters: [mob({ monster_id: 1190 })] };
    expect(dedupeZoneVariants([field, battleground])).toHaveLength(2);
  });

  it('leaves a single map alone', () => {
    const out = dedupeZoneVariants([variant('gef_fild10', 10)]);
    expect(out).toHaveLength(1);
    expect(out[0].zoneCount).toBe(1);
  });
});
