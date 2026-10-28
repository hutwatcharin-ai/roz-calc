import { describe, expect, it } from 'vitest';
import { BOT_SIGHT, DEFAULT_BOT, TELEPORT_SP, bestTargets, botRun, hardestHit, searchModel, type BotSettings } from './bot-session';
import { mob, noSurvival, place, world } from './fixtures';
import { WALK_CELLS_PER_SECOND } from './survival';
import type { FarmMap, PlayerInput } from './types';

const ctx = { attackDelay: 1000, cellsPerMob: 400 };
const bot = (over: Partial<BotSettings> = {}): BotSettings => ({ ...DEFAULT_BOT, idleTeleport: null, ...over });
// Lv 1, FLEE 101, 1,000 HP, kills a 100-HP fixture monster in two swings.
const me = (over: Partial<PlayerInput> = {}): PlayerInput => ({
  ...noSurvival,
  style: 'melee',
  level: 1,
  damage: 50,
  perSecond: 1,
  hit: 300,
  flee: 101,
  maxHp: 1000,
  ...over,
});
const field = (spawns: [number, number][], walkCells = 8000): FarmMap => ({ ...place('a', spawns), walkCells });
// Harmless: never lands (flee95 0 floors at 5%... so ATK 1 keeps it to 1 a hit).
const soft = (id: number, over = {}) => mob(id, { atk: 1, atkMax: 1, flee95: 0, hit100: 100, ...over });

describe('searchModel', () => {
  const sec = (cells: number) => cells / WALK_CELLS_PER_SECOND;

  it('walks straight to a target already on screen', () => {
    // One a 4 cells: the nearest is almost always well inside 14.
    const s = searchModel(1 / 4, 5, 14);
    expect(s.teleports).toBeCloseTo(0, 6);
    expect(s.seconds).toBeCloseTo(sec(1), 1);
  });

  it('roams, then teleports, when nothing is on screen', () => {
    const s = searchModel(1 / 5000, 5, 14);
    expect(s.teleports).toBeGreaterThan(0.5);
    // Never cheaper than seeing the nearest one from anywhere, which the old model did.
    expect(s.seconds).toBeGreaterThan(sec(0.5 * Math.sqrt(5000)));
  });

  it('never teleports without an idle timer', () => {
    const s = searchModel(1 / 5000, null, 14);
    expect(s.teleports).toBe(0);
    expect(Number.isFinite(s.seconds)).toBe(true);
  });

  it('makes Mjolnir Dead Pit 1F Martins slow to find (owner, 28 Oct 2026)', () => {
    // 21 Martins over 24,129 walkable cells: the old all-seeing model found
    // one every 2.7 seconds and put the map second for a night's EXP.
    expect(searchModel(21 / 24129, 5, 14).seconds).toBeGreaterThan(2.7 * 1.4);
  });

  it('finds nothing on an empty map', () => {
    expect(searchModel(0, 5, 14).seconds).toBe(Infinity);
  });
});

describe('hardestHit', () => {
  const nuke = { kind: 3 as const, ratio: 1000, hits: 1, rate: 10000, delay: 5000, hitBonus: 0, share: 1 };

  it('reports the skill hit apart from the normal one', () => {
    // Both from the top of the ATK range: 120, and 120 x 1000% for the skill.
    const m = mob(1, { atk: 100, atkMax: 120, skills: [nuke], magicRatio: 1 });
    expect(hardestHit(m, { hard: 0, soft: 0 }, 1000)).toEqual({ normal: 120, skill: 1200 });
  });

  it('follows the DEF it is asked about, not the first one it saw', () => {
    // The parts are cached per monster: a second DEF must not get the first's numbers.
    const m = mob(1, { atk: 100, atkMax: 100 });
    expect(hardestHit(m, { hard: 0, soft: 0 }, 1000).normal).toBe(100);
    expect(hardestHit(m, { hard: 0, soft: 30 }, 1000).normal).toBe(70);
  });

  it('leaves out a monster that never attacks', () => {
    expect(hardestHit(mob(1, { atk: 100, attackDelay: 0, skills: [nuke] }), { hard: 0, soft: 0 }, 1000)).toEqual({ normal: 0, skill: 0 });
  });
});

describe('botRun', () => {
  it('kills only what is ticked, at the ticked density', () => {
    // 20 ticked on 8,000 cells, searched for at that density (the 20
    // unticked ones do not count), + 2 s fight.
    const d = world([soft(1), soft(2)], [field([[1, 20], [2, 20]])]);
    const run = botRun(d.maps[0], d, me(), bot(), [1], ctx, 8)!;
    const search = searchModel(20 / 8000, null, BOT_SIGHT).seconds;
    expect(run.searchSeconds).toBeCloseTo(search, 6);
    expect(run.killsPerHour).toBeCloseTo(3600 / (2 + search), 3);
    expect(run.followers).toEqual([]);
  });

  it('lets an unticked aggressive monster follow, and calls it fatal with nothing to shake it off', () => {
    const d = world([soft(1), mob(2, { isAggressive: true })], [field([[1, 20], [2, 20]])]);
    const run = botRun(d.maps[0], d, me(), bot(), [1], ctx, 8)!;
    expect(run.followers.map((f) => f.id)).toEqual([2]);
    expect(run.dangers.map((x) => x.kind)).toContain('followers');
  });

  it('sheds followers at each teleport', () => {
    const d = world([soft(1), mob(2, { isAggressive: true })], [field([[1, 5], [2, 20]], 20000)]);
    const run = botRun(d.maps[0], d, me({ potionId: 501 }), bot({ idleTeleport: 3 }), [1], ctx, 8)!;
    expect(run.dangers.map((x) => x.kind)).not.toContain('followers');
    expect(Number.isFinite(run.avgFollowers)).toBe(true);
    expect(run.teleportsPerHour).toBeGreaterThan(0);
  });

  it('caps followers at the crowd-teleport limit', () => {
    const d = world([soft(1), mob(2, { isAggressive: true })], [field([[1, 20], [2, 200]])]);
    const run = botRun(d.maps[0], d, me({ potionId: 501 }), bot({ teleportOnMobs: 3 }), [1], ctx, 8)!;
    expect(run.avgFollowers).toBeLessThanOrEqual(1);
    expect(run.dangers.map((x) => x.kind)).not.toContain('followers');
  });

  it('loses kills to a target that hits past the damage limit', () => {
    // It hits for 99 and lands half the time: a 100 limit lets it be, a 50
    // limit sends the bot away most fights.
    const biter = mob(1, { atk: 100, atkMax: 100, flee95: 146, hit100: 100 });
    const d = world([biter], [field([[1, 20]])]);
    const calm = botRun(d.maps[0], d, me({ potionId: 501 }), bot({ teleportOnDamage: 100 }), [1], ctx, 8)!;
    const jumpy = botRun(d.maps[0], d, me({ potionId: 501 }), bot({ teleportOnDamage: 50 }), [1], ctx, 8)!;
    expect(calm.teleportsPerHour).toBe(0);
    expect(jumpy.teleportsPerHour).toBeGreaterThan(0);
    expect(jumpy.expPerHour).toBeLessThan(calm.expPerHour);
  });

  it('costs a hard-hitting follower a teleport per meeting and no HP', () => {
    // A 999-a-hit monster past a 100 limit, 5 of them on the map. The bot
    // teleports in the moment before the damage applies, so the hit never
    // lands (owner, in game, 19 Oct 2026). Counted as a follower hitting every
    // second it cost thousands of potions an hour (Zenhai Marsh).
    const d = world([soft(1), mob(2, { isAggressive: true, atk: 1000, atkMax: 1000, flee95: 400 })], [field([[1, 50], [2, 5]], 40000)]);
    const run = botRun(d.maps[0], d, me({ maxHp: 5000, potionId: 501 }), bot({ teleportOnDamage: 100 }), [1], ctx, 8)!;
    expect(run.avgFollowers).toBe(0);
    expect(run.teleportsPerHour).toBeGreaterThan(0);
    expect(run.potionsPerHour).toBe(0);
    expect(run.dangers).toEqual([]);
    // The cautious figure lets one in five of those hits land (TRIP_MISS).
    expect(run.hurtPerHour.teleportHits).toBeGreaterThan(0);
    expect(run.potionsPerHourHigh).toBeGreaterThan(0);
  });

  it('adds skills that ignore FLEE, which a high-FLEE character still takes', () => {
    // FLEE 400 against flee95 0: normal hits floor at 5%. A FLEE-ignoring
    // skill on every attack (rate 10,000, no cooldown) always lands.
    const dodgy = { flee: 400, potionId: 501, maxHp: 100000 };
    const plain = mob(1, { atk: 100, atkMax: 100, flee95: 0, hit100: 100 });
    const caster = mob(1, { atk: 100, atkMax: 100, flee95: 0, hit100: 100, skills: [{ kind: 1, ratio: 100, hits: 1, rate: 10000, delay: 0, hitBonus: 0, share: 1 }] });
    const w = world([plain], [field([[1, 20]])]);
    const a = botRun(w.maps[0], w, me(dodgy), bot(), [1], ctx, 8)!;
    const d = world([caster], [field([[1, 20]])]);
    const b = botRun(d.maps[0], d, me(dodgy), bot(), [1], ctx, 8)!;
    expect(b.hurtPerHour.skills).toBeGreaterThan(0);
    expect(a.hurtPerHour.skills).toBe(0);
    // Every attack is the skill: 20 x as much as the 5% normal hits.
    expect(b.hurtPerHour.skills).toBeCloseTo(a.hurtPerHour.targets * 20, 0);
  });

  it('sends the bot away on a skill past the damage limit instead of counting its damage', () => {
    const nuke = { kind: 3 as const, ratio: 1000, hits: 1, rate: 10000, delay: 5000, hitBonus: 0, share: 1 };
    const d = world([mob(1, { atk: 100, atkMax: 100, flee95: 0, skills: [nuke], magicRatio: 1 })], [field([[1, 20]])]);
    const run = botRun(d.maps[0], d, me({ potionId: 501, flee: 400 }), bot({ teleportOnDamage: 500 }), [1], ctx, 8)!;
    expect(run.hurtPerHour.skills).toBe(0);
    expect(run.teleportsPerHour).toBeGreaterThan(0);
  });

  it('plans potions for a bad hour, and runs out sooner on that figure', () => {
    const biter = mob(1, { atk: 100, atkMax: 100, flee95: 146, hit100: 100 });
    const d = world([biter], [field([[1, 20]])]);
    const run = botRun(d.maps[0], d, me({ potionId: 501, potions: 200 }), bot(), [1], ctx, 8)!;
    expect(run.potionsPerHourHigh).toBeGreaterThan(run.potionsPerHour);
    expect(run.hurtPerHour.badLuck).toBeGreaterThan(0);
    const heal = Math.floor((45 * (100 + 2)) / 100);
    expect(run.hours).toBeCloseTo((1000 + 200 * heal) / (run.potionsPerHourHigh * heal), 3);
  });

  it('stops looting at the weight setting, and goes home there when told not to keep hunting', () => {
    // 1 weight a kill; 2,000 max x 85% - 700 carried = 1,000 to fill.
    const d = world([soft(1, { lootWeight: 1 })], [field([[1, 20]])]);
    const p = me({ maxWeight: 2000, weightNow: 700 });
    const on = botRun(d.maps[0], d, p, bot({ keepHunting: true }), [1], ctx, 8)!;
    const off = botRun(d.maps[0], d, p, bot({ keepHunting: false }), [1], ctx, 8)!;
    const kills = on.killsPerHour;
    expect(on.lootHours).toBeCloseTo(1000 / kills, 6);
    expect(on.stop).toBe('none');
    expect(off.stop).toBe('weight');
    expect(off.hours).toBeCloseTo(1000 / kills, 6);
  });

  it('earns zeny only while it still loots', () => {
    const d = world([soft(1, { lootWeight: 1, perKill: 10 })], [field([[1, 20]])]);
    const run = botRun(d.maps[0], d, me({ maxWeight: 2000, weightNow: 700 }), bot(), [1], ctx, 8)!;
    expect(run.zeny).toBeCloseTo(10 * run.killsPerHour * run.lootHours, 3);
    expect(run.exp).toBeCloseTo(run.expPerHour * 8, 3);
  });

  it('charges SP for Creamy teleports and zeny for Fly Wings', () => {
    const d = world([soft(1)], [field([[1, 2]], 40000)]);
    const creamy = botRun(d.maps[0], d, me({ maxSp: 100 }), bot({ idleTeleport: 2 }), [1], ctx, 8)!;
    const wings = botRun(d.maps[0], d, me({ maxSp: 100 }), bot({ idleTeleport: 2, creamy: false }), [1], ctx, 8)!;
    // SP regen: (floor(100/100) + 1) x 450 ticks = 900 an hour.
    expect(creamy.spShortPerHour).toBeCloseTo(creamy.teleportsPerHour * TELEPORT_SP - 900, 3);
    expect(wings.wingCostPerHour).toBeCloseTo(wings.teleportsPerHour * 250, 3);
    expect(creamy.wingCostPerHour).toBe(0);
  });

  it('runs out when HP and potions are gone', () => {
    const biter = mob(1, { atk: 100, atkMax: 100, flee95: 146, hit100: 100 });
    const d = world([biter], [field([[1, 20]])]);
    const run = botRun(d.maps[0], d, me({ potionId: 501, potions: 10 }), bot(), [1], ctx, 8)!;
    expect(run.stop).toBe('hp');
    expect(run.hours).toBeLessThan(1);
  });

  it('flags a monster whose one hit is the whole HP bar, unless the damage limit teleports first', () => {
    const d = world([mob(1, { atk: 2000, atkMax: 2000, flee95: 400 })], [field([[1, 20]])]);
    expect(botRun(d.maps[0], d, me(), bot(), [1], ctx, 8)!.dangers[0].kind).toBe('one_shot');
    expect(botRun(d.maps[0], d, me(), bot({ teleportOnDamage: 500 }), [1], ctx, 8)!.dangers).toEqual([]);
  });
});

describe('bestTargets', () => {
  it('leaves out the monster that would kill the bot and keeps the rest', () => {
    const d = world(
      [soft(1, { baseExp: 100 }), mob(2, { atk: 2000, atkMax: 2000, flee95: 400, baseExp: 10000 })],
      [field([[1, 20], [2, 20]])],
    );
    const { best } = bestTargets(d.maps[0], d, me(), bot(), ctx, 8, (r) => r.exp);
    expect(best!.targets).toEqual([1]);
  });

  it('ticks a weak aggressive monster rather than let it follow', () => {
    const d = world([soft(1), soft(2, { isAggressive: true, baseExp: 1 })], [field([[1, 20], [2, 20]])]);
    const { best } = bestTargets(d.maps[0], d, me(), bot(), ctx, 8, (r) => r.exp);
    expect(best!.targets.sort()).toEqual([1, 2]);
  });
});
