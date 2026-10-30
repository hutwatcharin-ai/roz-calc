import { describe, expect, it } from 'vitest';
import { canSurvive, crowdedFlee, damageTaken, mapSurvival, playerDefense, survivalContext, walkSeconds } from './survival';
import { mob, noSurvival, place, world } from './fixtures';
import { rankMaps } from './rank';
import type { PlayerInput } from './types';
import { BOT_SIGHT, PLAYER_IDLE_TELEPORT, searchModel, TELEPORT_SECONDS } from './search';

// Lv 1, VIT 1, FLEE 101: AGI 0, so soft DEF floor((1 + 1)/2) = 1 and no hard DEF.
const tank = (over: Partial<PlayerInput> = {}): PlayerInput => ({
  ...noSurvival,
  style: 'melee',
  level: 1,
  damage: 50,
  perSecond: 1,
  hit: 300,
  flee: 101,
  maxHp: 1000,
  walkSeconds: 0,
  ...over,
});

// ATK 100 a hit, one attack a second, lands half the time on FLEE 101
// (5 + 146 - 101 = 50%). Its 100 HP takes two swings: a 2-second fight.
const biter = (id = 1, over = {}) => mob(id, { atk: 100, attackDelay: 1000, flee95: 146, hit100: 100, ...over });

describe('playerDefense', () => {
  it('reads AGI back from FLEE for soft DEF and leaves the rest of DEF to gear', () => {
    // Lv 50 VIT 30 FLEE 200: AGI 50, soft floor(40 + 10) = 50.
    const p = tank({ level: 50, vit: 30, flee: 200 });
    expect(playerDefense(p)).toEqual({ hard: 0, soft: 50 });
    expect(playerDefense({ ...p, def: 80 })).toEqual({ hard: 30, soft: 50 });
    expect(playerDefense({ ...p, def: 20 })).toEqual({ hard: 0, soft: 20 });
  });
});

describe('damageTaken', () => {
  it('divides by hard DEF the renewal way, then takes soft DEF off', () => {
    expect(damageTaken(mob(1, { atk: 300 }), { hard: 0, soft: 50 })).toBe(250);
    // 300 x 4100 / 5000 = 246, less 50.
    expect(damageTaken(mob(1, { atk: 300 }), { hard: 100, soft: 50 })).toBe(196);
    expect(damageTaken(mob(1, { atk: 10 }), { hard: 0, soft: 50 })).toBe(1);
    expect(damageTaken(mob(1, { atk: null }), { hard: 0, soft: 0 })).toBeNull();
  });
});

describe('crowdedFlee', () => {
  it('cuts 10% of FLEE per attacker past the second', () => {
    expect(crowdedFlee(200, 2)).toBe(200);
    expect(crowdedFlee(200, 3)).toBe(180);
    expect(crowdedFlee(200, 2.5)).toBe(190);
  });
});

describe('walkSeconds', () => {
  const ctx = { attackDelay: 1500, cellsPerMob: 900 };
  it('takes the player figure over the map', () => {
    expect(walkSeconds({ ...place('a', []), walkCells: 8000 }, 20, tank({ walkSeconds: 4 }), ctx)).toBe(4);
  });
  it('searches by teleport at the median spacing when the client has no map file', () => {
    const s = searchModel(1 / 900, PLAYER_IDLE_TELEPORT, BOT_SIGHT);
    expect(walkSeconds(place('a', []), 20, tank({ walkSeconds: null }), ctx)).toBeCloseTo(s.seconds + s.teleports * TELEPORT_SECONDS, 6);
    expect(s.teleports).toBeGreaterThan(0);
  });
});

describe('mapSurvival', () => {
  const ctx = { attackDelay: 1000, cellsPerMob: 400 };
  const data = (over = {}) => world([biter(1, over)], [place('a', [[1, 20]])]);

  it('needs kill speed, FLEE and Max HP', () => {
    expect(canSurvive(tank())).toBe(true);
    expect(canSurvive(tank({ maxHp: null }))).toBe(false);
    expect(mapSurvival(data().maps[0], data(), tank({ maxHp: null }), ctx)).toBeNull();
  });

  it('runs out of HP before morning with no potions', () => {
    // 99 a hit x 50% x 1/s = 49.5 HP/s over a 2 s fight: 99 a kill, 1,800
    // kills an hour = 178,200, less regen 5 x 600 = 3,000.
    const d = data();
    const out = mapSurvival(d.maps[0], d, tank(), ctx)!;
    expect(out.netDamagePerHour).toBeCloseTo(175200, 3);
    expect(out.hoursAlive).toBeCloseTo(1000 / 175200, 6);
    expect(out.blockers.map((b) => b.reason)).toEqual(['runs_out']);
  });

  it('takes nothing from a monster that waits and dies to the first hit', () => {
    // Owner, 30 Oct 2026. 100 damage on 100 HP: it never swings back.
    const d = data();
    const out = mapSurvival(d.maps[0], d, tank({ damage: 100 }), ctx)!;
    expect(out.netDamagePerHour).toBeLessThan(0);
    expect(out.blockers).toEqual([]);
    // One that comes to us still lands while we swing.
    const a = data({ isAggressive: true });
    expect(mapSurvival(a.maps[0], a, tank({ damage: 100 }), ctx)!.netDamagePerHour).toBeGreaterThan(0);
  });

  it('takes no hits and regains no HP while walking', () => {
    // 2 s fighting + 2 s walking: 900 kills = 89,100 taken; regen only the
    // half spent standing, 1,500.
    const d = data();
    expect(mapSurvival(d.maps[0], d, tank({ walkSeconds: 2 }), ctx)!.netDamagePerHour).toBeCloseTo(87600, 3);
  });

  it('lives on potions, and says how many an hour', () => {
    const d = data();
    // Red Potion 45 x (100 + 2)% = 45 each (floored).
    const out = mapSurvival(d.maps[0], d, tank({ potionId: 501 }), ctx)!;
    expect(out.blockers).toEqual([]);
    expect(out.potionsPerHour).toBeCloseTo(175200 / 45, 3);
    expect(out.potionCostPerHour).toBeCloseTo((175200 / 45) * 10, 3);
  });

  it('runs out when the potions carried do not last the night', () => {
    const d = data();
    const out = mapSurvival(d.maps[0], d, tank({ potionId: 501, potions: 100 }), ctx)!;
    expect(out.hoursAlive).toBeCloseTo((1000 + 100 * 45) / 175200, 6);
    expect(out.blockers[0].reason).toBe('runs_out');
  });

  it('sizes the potion stack to fill up to the 70% regen line when the count is blank', () => {
    // Red Potion weighs 7 in the fixture: (2,000 x 0.7 - 300 carried) / 7 = 157.
    const d = data();
    const out = mapSurvival(d.maps[0], d, tank({ potionId: 501, maxWeight: 2000, weightNow: 300 }), ctx)!;
    expect(out.potionsCarried).toBe(157);
    expect(out.hoursAlive).toBeCloseTo((1000 + 157 * 45) / 175200, 6);
    expect(mapSurvival(d.maps[0], d, tank({ potionId: 501, maxWeight: 2000, potions: 10 }), ctx)!.potionsCarried).toBe(10);
  });

  it('takes out a map where one fight costs more than half the HP bar', () => {
    const d = data();
    const out = mapSurvival(d.maps[0], d, tank({ maxHp: 150, potionId: 501 }), ctx)!;
    expect(out.blockers[0]).toMatchObject({ reason: 'burst', name: 'mob 1', damage: 99 });
  });

  it('never loses ground against a monster that cannot land', () => {
    const d = data({ flee95: 0 });
    // Floors at 5%: 4.95 HP/s for 2 s = 9.9 a kill, 17,820 an hour, still
    // more than regen. With FLEE far over, the floor is what is left.
    const out = mapSurvival(d.maps[0], d, tank({ maxHp: 100000 }), ctx)!;
    expect(out.blockers).toEqual([]);
    expect(out.hoursAlive).toBeGreaterThan(8);
  });

  it('counts aggressive neighbours joining the fight', () => {
    // 20 on 8,000 cells, view range 10: 20/8000 x pi x 100 = 0.785 extra.
    const d = world([biter(1, { isAggressive: true })], [{ ...place('a', [[1, 20]]), walkCells: 8000 }]);
    const out = mapSurvival(d.maps[0], d, tank({ potionId: 501 }), ctx)!;
    expect(out.extraAttackers).toBeCloseTo((20 / 8000) * Math.PI * 100, 6);
  });

  it('cannot judge a monster with no ATK figure', () => {
    const d = data({ atk: null });
    expect(mapSurvival(d.maps[0], d, tank(), ctx)!.blockers[0].reason).toBe('unknown_atk');
  });

  it('slows a caster down for every cast a hit breaks, once the monster arrives', () => {
    // It walks 9 - 1 = 8 cells at 200 ms: 1.6 s of free casting. The other
    // 0.4 s of the 2 s fight takes e^0.5 times as long (0.5 landed hits a
    // second against one cast a second).
    const d = data();
    const out = mapSurvival(d.maps[0], d, tank({ style: 'magic', hit: null, potionId: 501, maxHp: 100000 }), ctx)!;
    expect(out.fightSeconds.get(1)).toBeCloseTo(1.6 + 0.4 * Math.exp(0.5), 6);
  });

  it('lets a caster kill a slow walker before it ever lands a hit', () => {
    const d = data({ walkSpeed: 400 });
    const out = mapSurvival(d.maps[0], d, tank({ style: 'magic', hit: null, maxHp: 1000 }), ctx)!;
    expect(out.fightSeconds.get(1)).toBe(2);
    expect(out.netDamagePerHour).toBeLessThan(0);
  });

  it('takes nothing from a monster that never attacks', () => {
    // Plants: rAthena AttackDelay 1 would be a thousand hits a second.
    const d = data({ attackDelay: 0 });
    expect(mapSurvival(d.maps[0], d, tank(), ctx)!.blockers).toEqual([]);
  });

  it('gives up on a caster who is hit faster than it can cast', () => {
    const d = data({ flee95: 400, attackDelay: 400 });
    const out = mapSurvival(d.maps[0], d, tank({ style: 'magic', hit: null, potionId: 501, maxHp: 1e9 }), ctx)!;
    expect(out.blockers.map((b) => b.reason)).toContain('interrupted');
  });

  it('stands in the median attack speed and names who it was used for', () => {
    const d = data({ attackDelay: null });
    const out = mapSurvival(d.maps[0], d, tank({ potionId: 501 }), ctx)!;
    expect(out.assumedDelay).toEqual(['mob 1']);
  });
});

describe('survivalContext', () => {
  it('takes medians from the payload', () => {
    const d = world(
      [mob(1, { attackDelay: 800 }), mob(2, { attackDelay: 1200 }), mob(3, { attackDelay: null })],
      [{ ...place('a', [[1, 20]]), walkCells: 4000 }, { ...place('b', [[2, 10]]), walkCells: 9000 }],
    );
    expect(survivalContext(d)).toEqual({ attackDelay: 1200, cellsPerMob: 900 });
  });
});

describe('ranking with the survival model', () => {
  it('lets a strong tank onto a map it cannot dodge on, at a potion cost in zeny mode', () => {
    // FLEE 101 dodges nothing here: the old gate took the map out at once.
    const d = data2();
    const out = rankMaps(d, tank({ potionId: 501, maxHp: 100000 }), 'zeny', { level: 50 });
    expect(out.ranked).toHaveLength(1);
    const s = out.ranked[0].survival!;
    // 5z a kill, 1,800 kills an hour, less the potions.
    expect(out.ranked[0].perHour).toBeCloseTo(9000 - s.potionCostPerHour, 3);
  });
  function data2() {
    return world([biter(1)], [place('a', [[1, 20]])]);
  }
});
