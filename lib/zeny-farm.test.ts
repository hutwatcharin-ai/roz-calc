import { describe, expect, it } from 'vitest';
import {
  rankZenyMaps,
  topEarners,
  walkInReason,
  zenyPerKill,
  type ZenyData,
  type ZenyMapData,
  type ZenyMonster,
  type ZenyPlayer,
} from './zeny-farm';

describe('zenyPerKill', () => {
  it('weighs each drop by its chance', () => {
    // 5% of a 100z item plus 50% of a 10z one. The rate column is a percent.
    const { perKill } = zenyPerKill([
      { itemId: 1, rate: 5, sellPrice: 100 },
      { itemId: 2, rate: 50, sellPrice: 10 },
    ]);
    expect(perKill).toBeCloseTo(10, 5);
  });

  it('reads the rate as the site stores it: a percent', () => {
    // The real Poring row -- Jellopy 70 at 3z, Sticky Mucus 4 at 35z, Apple
    // 10 at 7z, Fly Wing 5 at 125z, Knife 1 at 25z -- is about 10.7z a kill.
    // Read on rAthena's per-10,000 scale it is 0.1z, which is what the first
    // draft of this page published.
    const { perKill } = zenyPerKill([
      { itemId: 909, rate: 70, sellPrice: 3 },
      { itemId: 938, rate: 4, sellPrice: 35 },
      { itemId: 512, rate: 10, sellPrice: 7 },
      { itemId: 601, rate: 5, sellPrice: 125 },
      { itemId: 1201, rate: 1, sellPrice: 25 },
    ]);
    expect(perKill).toBeCloseTo(10.7, 1);
  });

  it('counts what it could not price instead of guessing', () => {
    const { perKill, unpriced } = zenyPerKill([
      { itemId: 1, rate: 5, sellPrice: 100 },
      { itemId: 2, rate: null, sellPrice: 50 },
      { itemId: 3, rate: 10, sellPrice: null },
    ]);
    expect(perKill).toBeCloseTo(5, 5);
    expect(unpriced).toBe(2);
  });

  it('is zero for a monster that drops nothing sellable', () => {
    expect(zenyPerKill([]).perKill).toBe(0);
  });
});

describe('walkInReason', () => {
  it('names the places a reader cannot simply walk into', () => {
    expect(walkInReason('treasure_n1')).toBeTruthy();
    expect(walkInReason('prt_gld')).toBeTruthy();
    expect(walkInReason('1@orcs')).toBeTruthy();
    expect(walkInReason('job_knight')).toBeTruthy();
  });

  it('lets an ordinary field through', () => {
    expect(walkInReason('prt_fild08')).toBeNull();
    expect(walkInReason('moc_fild12')).toBeNull();
    expect(walkInReason('iz_dun02')).toBeNull();
  });
});

// One drop at 50% selling for 10z: 5z a kill.
const mob = (id: number, over: Partial<ZenyMonster> = {}): ZenyMonster => ({
  id,
  name: `mob ${id}`,
  level: 10,
  hp: 100,
  sprite: null,
  isMvp: false,
  solo: false,
  isAggressive: false,
  flee95: 100,
  hit100: 100,
  drops: [{ rate: 50, sell: 10 }],
  unpriced: 0,
  perKill: 5,
  best: null,
  ...over,
});

const place = (code: string, spawns: [number, number][]): ZenyMapData => ({
  code,
  name: code,
  image: null,
  spawns: spawns.map(([id, amount]) => ({ id, amount })),
});

const world = (monsters: ZenyMonster[], maps: ZenyMapData[]): ZenyData => ({
  monsters: Object.fromEntries(monsters.map((m) => [m.id, m])),
  maps,
  excluded: { mvp: 0, solo: 0 },
  coverage: { pricedItems: 0, totalItems: 0, ratedDrops: 0, totalDrops: 0 },
});

// A caster never misses, so the kill time is plain: 100 HP / 50 a cast at one
// cast a second is two seconds. FLEE 200 against a monster's flee95 of 100
// puts its hit chance at the 5% floor, inside every cap.
const caster = (over: Partial<ZenyPlayer> = {}): ZenyPlayer => ({
  style: 'magic',
  damagePerHit: 50,
  perSecond: 1,
  hit: null,
  flee: 200,
  ...over,
});

describe('rankZenyMaps without the player numbers', () => {
  it('ranks by zeny per HP times headcount', () => {
    const { ranked } = rankZenyMaps(
      world([mob(1, { perKill: 10 }), mob(2, { perKill: 1 })], [place('b', [[2, 20]]), place('a', [[1, 20]])]),
      null,
    );
    expect(ranked.map((m) => m.code)).toEqual(['a', 'b']);
    expect(ranked[0].avgPerKill).toBeCloseTo(10, 5);
    expect(ranked[0].zenyPerHour).toBeNull();
    expect(ranked[0].blockers).toBeNull();
  });

  it('never counts an MVP or a monster that spawns one at a time', () => {
    // Before this rule Dragon Fly (one per map, a 15% Clip) and Bacsojin (MVP)
    // topped the list of what to farm.
    const { ranked } = rankZenyMaps(
      world(
        [mob(1), mob(2, { isMvp: true, perKill: 1000 }), mob(3, { solo: true, perKill: 2000 })],
        [place('a', [[1, 20], [2, 1], [3, 1]])],
      ),
      null,
    );
    expect(ranked[0].mobs).toBe(20);
    expect(ranked[0].avgPerKill).toBeCloseTo(5, 5);
    expect(ranked[0].top.map((t) => t.id)).toEqual([1]);
  });

  it('ignores a map too empty to farm', () => {
    expect(rankZenyMaps(world([mob(1)], [place('a', [[1, 3]])]), null).ranked).toEqual([]);
  });

  it('folds channels that hold the same earners', () => {
    const { ranked } = rankZenyMaps(world([mob(1)], [place('gef_f10_a', [[1, 20]]), place('gef_f10_b', [[1, 20]])]), null);
    expect(ranked).toHaveLength(1);
    expect(ranked[0].channels).toBe(2);
  });
});

describe('rankZenyMaps with the player numbers', () => {
  it('turns kill time into zeny per hour', () => {
    // 5z every 2 seconds is 9,000z an hour.
    const { ranked } = rankZenyMaps(world([mob(1)], [place('a', [[1, 20]])]), caster());
    expect(ranked[0].zenyPerHour).toBeCloseTo(9000, 3);
    expect(ranked[0].blockers).toEqual([]);
  });

  it('averages the kill time over everything the bot meets', () => {
    // Ten 2-second kills worth 5z and ten 10-second kills worth nothing: the
    // average kill is 6 seconds and 2.5z, so 1,500z an hour -- not the 9,000
    // the earner alone would claim.
    const { ranked } = rankZenyMaps(
      world([mob(1), mob(2, { hp: 500, drops: [], perKill: 0 })], [place('a', [[1, 10], [2, 10]])]),
      caster(),
    );
    expect(ranked[0].avgPerKill).toBeCloseTo(2.5, 5);
    expect(ranked[0].zenyPerHour).toBeCloseTo(1500, 3);
  });

  it('leaves out a drop a whole night would not see three times', () => {
    // 14,400 kills a night at 0.01% is 1.4 of the 1,000,000z item: luck.
    const lucky = mob(1, { drops: [{ rate: 50, sell: 10 }, { rate: 0.01, sell: 1_000_000 }], perKill: 105 });
    const data = world([lucky], [place('a', [[1, 20]])]);
    expect(rankZenyMaps(data, null).ranked[0].avgPerKill).toBeCloseTo(105, 5);
    expect(rankZenyMaps(data, caster()).ranked[0].zenyPerHour).toBeCloseTo(9000, 3);
  });

  it('drops a map where anything hits the player too often', () => {
    // mob 3 earns nothing but still stands there: 5 + 400 - 200 is a sure hit.
    const data = world([mob(1), mob(3, { flee95: 400, isAggressive: true, drops: [], perKill: 0 })], [place('a', [[1, 20], [3, 5]])]);
    const { ranked, blocked } = rankZenyMaps(data, caster());
    expect(ranked).toEqual([]);
    expect(blocked[0].blockers).toEqual([{ id: 3, name: 'mob 3', reason: 'dodge', theirHitPct: 100 }]);
  });

  it('treats a monster with no FLEE figure as unsafe', () => {
    const data = world([mob(1), mob(4, { flee95: null, drops: [], perKill: 0 })], [place('a', [[1, 20], [4, 5]])]);
    expect(rankZenyMaps(data, caster()).blocked[0].blockers?.[0].reason).toBe('unknown_flee');
  });

  it('counts an MVP on the map for safety even though it never earns', () => {
    const data = world([mob(1), mob(2, { isMvp: true, flee95: 500, perKill: 1000 })], [place('a', [[1, 20], [2, 1]])]);
    expect(rankZenyMaps(data, caster()).ranked).toEqual([]);
  });

  it('keeps the safe channel when another copy of the map is not', () => {
    // The _z channels hold one extra event monster with no FLEE figure.
    const data = world(
      [mob(1), mob(5, { flee95: null, drops: [], perKill: 0 })],
      [place('iz_d02_a', [[1, 20]]), place('iz_d02_z', [[1, 20], [5, 5]])],
    );
    const { ranked, blocked } = rankZenyMaps(data, caster());
    expect(ranked.map((m) => m.code)).toEqual(['iz_d02_a']);
    expect(blocked).toEqual([]);
  });
});

describe('topEarners', () => {
  it('lists only monsters a bot can farm, best first', () => {
    const data = world(
      [mob(1, { perKill: 5 }), mob(2, { perKill: 50 }), mob(3, { isMvp: true, perKill: 900 }), mob(4, { solo: true, perKill: 2700 })],
      [],
    );
    expect(topEarners(data, 10).map((m) => m.id)).toEqual([2, 1]);
  });
});
