import { describe, expect, it } from 'vitest';
import { rankMaps } from './rank';
import { caster, mob, nobody, place, world } from './fixtures';

const at50 = { level: 50 };

describe('zeny mode', () => {
  it('ranks by zeny per HP times headcount without numbers', () => {
    const { ranked } = rankMaps(
      world([mob(1, { perKill: 10 }), mob(2, { perKill: 1 })], [place('b', [[2, 20]]), place('a', [[1, 20]])]),
      nobody,
      'zeny',
      at50,
    );
    expect(ranked.map((m) => m.code)).toEqual(['a', 'b']);
    expect(ranked[0].avgPerKill).toBeCloseTo(10, 5);
    expect(ranked[0].perHour).toBeNull();
    expect(ranked[0].blockers).toBeNull();
  });

  it('never counts an MVP or a monster that spawns one at a time', () => {
    const { ranked } = rankMaps(
      world([mob(1), mob(2, { isMvp: true, perKill: 1000 }), mob(3, { solo: true, perKill: 2000 })], [place('a', [[1, 20], [2, 1], [3, 1]])]),
      nobody,
      'zeny',
      at50,
    );
    expect(ranked[0].mobs).toBe(20);
    expect(ranked[0].avgPerKill).toBeCloseTo(5, 5);
    expect(ranked[0].top.map((t) => t.id)).toEqual([1]);
  });

  it('ignores a map too empty to farm', () => {
    expect(rankMaps(world([mob(1)], [place('a', [[1, 3]])]), nobody, 'zeny', at50).ranked).toEqual([]);
  });

  it('folds channels that hold the same earners', () => {
    const { ranked } = rankMaps(world([mob(1)], [place('gef_f10_a', [[1, 20]]), place('gef_f10_b', [[1, 20]])]), nobody, 'zeny', at50);
    expect(ranked).toHaveLength(1);
    expect(ranked[0].channels).toBe(2);
  });

  it('turns kill time into zeny per hour', () => {
    // 5z every 2 seconds.
    const { ranked } = rankMaps(world([mob(1)], [place('a', [[1, 20]])]), caster(), 'zeny', at50);
    expect(ranked[0].perHour).toBeCloseTo(9000, 3);
    expect(ranked[0].blockers).toEqual([]);
  });

  it('averages the kill time over everything the bot meets', () => {
    // Ten 2-second kills worth 5z, ten 10-second kills worth nothing: 1,500z/h.
    const { ranked } = rankMaps(
      world([mob(1), mob(2, { hp: 500, drops: [], perKill: 0 })], [place('a', [[1, 10], [2, 10]])]),
      caster(),
      'zeny',
      at50,
    );
    expect(ranked[0].avgPerKill).toBeCloseTo(2.5, 5);
    expect(ranked[0].perHour).toBeCloseTo(1500, 3);
  });

  it('leaves out a drop a whole night would not see three times', () => {
    const lucky = mob(1, { drops: [{ rate: 50, sell: 10 }, { rate: 0.01, sell: 1_000_000 }], perKill: 105 });
    const data = world([lucky], [place('a', [[1, 20]])]);
    expect(rankMaps(data, nobody, 'zeny', at50).ranked[0].avgPerKill).toBeCloseTo(105, 5);
    expect(rankMaps(data, caster(), 'zeny', at50).ranked[0].perHour).toBeCloseTo(9000, 3);
  });

  it('halves drops more than 40 levels away and tags the unconfirmed band', () => {
    const data18 = world([mob(1, { level: 18 })], [place('a', [[1, 20]])]);
    const lv60 = rankMaps(data18, caster({ level: 60 }), 'zeny', at50).ranked[0];
    expect(lv60.perHour).toBeCloseTo(4500, 3);
    expect(lv60.dropTags).toEqual(['halved']);
    expect(rankMaps(data18, { ...nobody, level: 60 }, 'zeny', at50).ranked[0].avgPerKill).toBeCloseTo(2.5, 5);

    const data20 = world([mob(1, { level: 20 })], [place('a', [[1, 20]])]);
    const lv45 = rankMaps(data20, caster({ level: 45 }), 'zeny', at50).ranked[0];
    expect(lv45.perHour).toBeCloseTo(9000, 3);
    expect(lv45.dropTags).toEqual(['unconfirmed']);
  });

  it('drops a map where anything hits the player too often', () => {
    const data = world([mob(1), mob(3, { flee95: 400, isAggressive: true, drops: [], perKill: 0 })], [place('a', [[1, 20], [3, 5]])]);
    const { ranked, blocked } = rankMaps(data, caster(), 'zeny', at50);
    expect(ranked).toEqual([]);
    expect(blocked[0].blockers).toEqual([{ id: 3, name: 'mob 3', reason: 'dodge', theirHitPct: 100 }]);
  });

  it('treats a monster with no FLEE figure as unsafe', () => {
    const data = world([mob(1), mob(4, { flee95: null, drops: [], perKill: 0 })], [place('a', [[1, 20], [4, 5]])]);
    expect(rankMaps(data, caster(), 'zeny', at50).blocked[0].blockers?.[0].reason).toBe('unknown_flee');
  });

  it('counts an MVP on the map for safety even though it never earns', () => {
    const data = world([mob(1), mob(2, { isMvp: true, flee95: 500, perKill: 1000 })], [place('a', [[1, 20], [2, 1]])]);
    expect(rankMaps(data, caster(), 'zeny', at50).ranked).toEqual([]);
  });

  it('keeps the safe channel when another copy of the map is not', () => {
    const data = world(
      [mob(1), mob(5, { flee95: null, drops: [], perKill: 0 })],
      [place('iz_d02_a', [[1, 20]]), place('iz_d02_z', [[1, 20], [5, 5]])],
    );
    const { ranked, blocked } = rankMaps(data, caster(), 'zeny', at50);
    expect(ranked.map((m) => m.code)).toEqual(['iz_d02_a']);
    expect(blocked).toEqual([]);
  });
});

describe('level mode', () => {
  const melee = { style: 'melee' as const, level: 50, damage: 500, perSecond: 2, hit: 200, flee: null };

  it('ranks by density tapered by level distance without numbers', () => {
    const data = world([mob(1, { level: 50, baseExp: 100 })], [place('a', [[1, 10]])]);
    expect(rankMaps(data, nobody, 'level', { level: 50 }).ranked[0].sortKey).toBeCloseTo(1000, 5);
    expect(rankMaps(data, nobody, 'level', { level: 60 }).ranked[0].sortKey).toBeCloseTo(1000 / 3, 5);
  });

  it('ignores a monster whose EXP is unknown', () => {
    const data = world([mob(1, { level: 50, baseExp: null })], [place('a', [[1, 10]])]);
    expect(rankMaps(data, nobody, 'level', at50).ranked).toEqual([]);
  });

  it('mixes EXP per hour by population, not by species', () => {
    // 90 at 100 EXP and 10 at 1,000, each a one-second kill: 684,000 EXP/h,
    // far under the rich one's 3,600,000.
    const data = world(
      [mob(1, { level: 50, hp: 1000, hit100: 200, baseExp: 100 }), mob(2, { level: 50, hp: 1000, hit100: 200, baseExp: 1000 })],
      [place('a', [[1, 90], [2, 10]])],
    );
    expect(rankMaps(data, melee, 'level', at50).ranked[0].perHour).toBeCloseTo(684000, 0);
  });

  it('leaves out a map where every monster is outside ±15 levels', () => {
    expect(rankMaps(world([mob(1, { level: 80 })], [place('a', [[1, 20]])]), nobody, 'level', at50).ranked).toEqual([]);
  });

  it('never gates, even with FLEE entered', () => {
    const data = world([mob(1, { level: 50, flee95: 400 })], [place('a', [[1, 20]])]);
    const { ranked } = rankMaps(data, { ...melee, flee: 200 }, 'level', at50);
    expect(ranked).toHaveLength(1);
    expect(ranked[0].blockers).toBeNull();
  });
});

describe('afk mode', () => {
  it('ranks by EXP per HP times headcount without numbers', () => {
    const data = world([mob(1), mob(2, { hp: 10000, baseExp: 1000 })], [place('b', [[2, 20]]), place('a', [[1, 20]])]);
    const { ranked } = rankMaps(data, nobody, 'afk', at50);
    expect(ranked.map((m) => m.code)).toEqual(['a', 'b']);
    expect(ranked[0].avgPerKill).toBeCloseTo(100, 5);
  });

  it('turns kill time into EXP per hour', () => {
    expect(rankMaps(world([mob(1)], [place('a', [[1, 20]])]), caster(), 'afk', at50).ranked[0].perHour).toBeCloseTo(180000, 3);
  });

  it('uses the same gate as the zeny mode', () => {
    const data = world([mob(1), mob(3, { flee95: 400, isAggressive: true })], [place('a', [[1, 20], [3, 5]])]);
    expect(rankMaps(data, caster(), 'afk', at50).ranked).toEqual([]);
  });

  it('can keep only maps with no aggressive kind, or no risky skill', () => {
    const data = world(
      [mob(1), mob(2, { isAggressive: true }), mob(3, { risks: [{ skillName: 'NPC_SUMMONSLAVE', risk: 'summons' }] })],
      [place('a', [[1, 20]]), place('b', [[1, 20], [2, 5]]), place('c', [[1, 20], [3, 5]])],
    );
    expect(rankMaps(data, nobody, 'afk', { level: 50, cleanOnly: true }).ranked.map((m) => m.code).sort()).toEqual(['a', 'c']);
    expect(rankMaps(data, nobody, 'afk', { level: 50, noRiskOnly: true }).ranked.map((m) => m.code).sort()).toEqual(['a', 'b']);
  });
});
