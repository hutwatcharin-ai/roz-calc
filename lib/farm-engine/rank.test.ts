import { describe, expect, it } from 'vitest';
import { rankMaps } from './rank';
import { caster, mob, nobody, noSurvival, place, world } from './fixtures';
import { BOT_SIGHT, PLAYER_IDLE_TELEPORT, searchModel, TELEPORT_SECONDS } from './search';

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

  it('tags an MVP on the map instead of judging the map by it', () => {
    // Met now and then, not farmed (19 Oct 2026). It used to take the map out.
    const data = world([mob(1), mob(2, { isMvp: true, flee95: 500, perKill: 1000 })], [place('a', [[1, 20], [2, 1]])]);
    const { ranked } = rankMaps(data, caster(), 'zeny', at50);
    expect(ranked).toHaveLength(1);
    expect(ranked[0].tags.bosses).toEqual(['mob 2']);
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
  const melee = { ...noSurvival, walkSeconds: 0, style: 'melee' as const, level: 50, damage: 500, perSecond: 2, hit: 200, flee: null };

  it('ranks by density, flat from 10 under to 15 over, tapering to 30 over, without numbers', () => {
    // Zero takes nothing off EXP for a level gap (docs/GAME_MODEL.md), so a
    // monster above the player is worth its full EXP; the taper only stands in
    // for "probably too strong" while the player's damage is unknown.
    const data = world([mob(1, { level: 50, baseExp: 100 })], [place('a', [[1, 10]])]);
    expect(rankMaps(data, nobody, 'level', { level: 50 }).ranked[0].sortKey).toBeCloseTo(1000, 5);
    expect(rankMaps(data, nobody, 'level', { level: 35 }).ranked[0].sortKey).toBeCloseTo(1000, 5);
    expect(rankMaps(data, nobody, 'level', { level: 60 }).ranked[0].sortKey).toBeCloseTo(1000, 5);
    expect(rankMaps(data, nobody, 'level', { level: 30 }).ranked[0].sortKey).toBeCloseTo(1000 * (2 / 3), 5);
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

  it('leaves out a map whose monsters are 30+ levels over or 10+ under without numbers', () => {
    expect(rankMaps(world([mob(1, { level: 80 })], [place('a', [[1, 20]])]), nobody, 'level', at50).ranked).toEqual([]);
    expect(rankMaps(world([mob(1, { level: 39 })], [place('a', [[1, 20]])]), nobody, 'level', at50).ranked).toEqual([]);
  });

  it('with damage filled in, fights whatever dies in 15 hits and is hit 70% of the time, at any level', () => {
    // gef_fild06 for a Lv 60 (owner, 28 Oct 2026): Petit Lv 86 at 23,611 HP
    // is 8 hits of 3,000, and players level there. A Lv-gap band hid it.
    const data = world(
      [
        mob(1, { level: 50, hp: 1000, hit100: 200 }),
        mob(2, { level: 90, hp: 7500, hit100: 200, baseExp: 1000 }),
        mob(3, { level: 90, hp: 8000, hit100: 200, baseExp: 1000 }),
        mob(4, { level: 90, hp: 1000, hit100: 231, baseExp: 1000 }),
      ],
      [place('mine', [[1, 20]]), place('high', [[2, 20]]), place('tough', [[3, 20]]), place('slippery', [[4, 20]])],
    );
    const { ranked } = rankMaps(data, melee, 'level', at50);
    // 7,500 is 15 hits of 500; 8,000 is 16. HIT 200 against hit100 231 lands 69%.
    expect(ranked.map((m) => m.code).sort()).toEqual(['high', 'mine']);
    expect(ranked[0].code).toBe('high');
  });

  it('counts the walk to the next monster in the band', () => {
    const data = world([mob(1, { level: 50, hp: 1000, hit100: 200 })], [place('a', [[1, 20]])]);
    const still = rankMaps(data, melee, 'level', at50).ranked[0].perHour!;
    const walking = rankMaps(data, { ...melee, walkSeconds: 1 }, 'level', at50).ranked[0].perHour!;
    // One second a kill at 500 x 2 a second against 1,000 HP, plus one of walking.
    expect(walking / still).toBeCloseTo(0.5, 6);
  });

  it('warns instead of gating when the player would not last', () => {
    const data = world([mob(1, { level: 50, hp: 1000, hit100: 200, atk: 5000, atkMax: 5000, flee95: 400 })], [place('a', [[1, 20]])]);
    const { ranked } = rankMaps(data, { ...melee, flee: 100, maxHp: 1000 }, 'level', at50);
    expect(ranked).toHaveLength(1);
    expect(ranked[0].warnings.length).toBeGreaterThan(0);
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

  it('adds the walk to the next monster to every kill', () => {
    // Two seconds a kill plus two of walking: half the EXP an hour.
    const walking = rankMaps(world([mob(1)], [place('a', [[1, 20]])]), caster({ walkSeconds: 2 }), 'afk', at50);
    expect(walking.ranked[0].perHour).toBeCloseTo(90000, 3);
  });

  it('works the walk out from how thinly the map spreads its monsters', () => {
    // 20 monsters on 8,000 walkable cells, found by teleporting and looking
    // round (lib/farm-engine/search), + 2 s a kill.
    const map = { ...place('a', [[1, 20]]), walkCells: 8000 };
    const { ranked } = rankMaps(world([mob(1)], [map]), caster({ walkSeconds: null }), 'afk', at50);
    const s = searchModel(20 / 8000, PLAYER_IDLE_TELEPORT, BOT_SIGHT);
    expect(ranked[0].perHour).toBeCloseTo((100 / (2 + s.seconds + s.teleports * TELEPORT_SECONDS)) * 3600, 3);
  });

  it('stops a one-hit weak map from beating a stronger one once walking counts', () => {
    // Weak: 10 EXP, dies to one cast (1 s). Strong: 60 EXP, four casts (4 s).
    // Swing time alone: 36,000 vs 54,000 -- but with 3 s of walking each,
    // 9,000 vs 30,857. The order holds; the gap is what changes.
    const data = world(
      [mob(1, { hp: 50, baseExp: 10 }), mob(2, { hp: 200, baseExp: 60 })],
      [place('weak', [[1, 20]]), place('strong', [[2, 20]])],
    );
    const fast = rankMaps(data, caster({ walkSeconds: 0 }), 'afk', at50).ranked;
    const slow = rankMaps(data, caster({ walkSeconds: 3 }), 'afk', at50).ranked;
    expect(fast.map((m) => m.code)).toEqual(['strong', 'weak']);
    expect(slow[0].perHour! / slow[1].perHour!).toBeGreaterThan(fast[0].perHour! / fast[1].perHour!);
  });

  it('hides maps far under the player when asked', () => {
    const data = world([mob(1, { level: 10 }), mob(2, { level: 45 })], [place('low', [[1, 20]]), place('mine', [[2, 20]])]);
    const out = rankMaps(data, caster({ level: 50 }), 'afk', { level: 50, hideLowMaps: true });
    expect(out.ranked.map((m) => m.code)).toEqual(['mine']);
    expect(out.hiddenLow).toBe(1);
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

describe('popular maps', () => {
  it('tags the five best of a ranking as popular, and no others', () => {
    // Owner, 28 Oct 2026: the best maps are where everyone goes, and other
    // players take the kills there; a tag is enough, the figure stays.
    const maps = Array.from({ length: 7 }, (_, i) => place(`m${i}`, [[1, 10 + i]]));
    const { ranked } = rankMaps(world([mob(1, { level: 50 })], maps), nobody, 'level', at50);
    expect(ranked.filter((m) => m.popular).map((m) => m.code)).toEqual(['m6', 'm5', 'm4', 'm3', 'm2']);
  });
});
