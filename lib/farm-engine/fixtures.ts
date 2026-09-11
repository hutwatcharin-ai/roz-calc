// Test fixtures for lib/farm-engine. Kept out of the test files so importing
// one does not run another file's tests a second time.

import type { FarmData, FarmMap, FarmMonster, PlayerInput } from './types';

/** HP 100, 100 EXP, one drop at 50% for 10z (5z a kill), dodgeable at FLEE 200. */
export const mob = (id: number, over: Partial<FarmMonster> = {}): FarmMonster => ({
  id,
  name: `mob ${id}`,
  level: 10,
  hp: 100,
  baseExp: 100,
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
  risks: [],
  ...over,
});

export const place = (code: string, spawns: [number, number | null][]): FarmMap => ({
  code,
  name: code,
  image: null,
  spawns: spawns.map(([id, amount]) => ({ id, amount })),
});

export const world = (monsters: FarmMonster[], maps: FarmMap[]): FarmData => ({
  monsters: Object.fromEntries(monsters.map((m) => [m.id, m])),
  maps,
  excluded: { mvp: 0, solo: 0 },
  coverage: { pricedItems: 0, totalItems: 0, ratedDrops: 0, totalDrops: 0 },
});

/** A caster never misses: 100 HP at 50 a cast, one cast a second, is two seconds. */
export const caster = (over: Partial<PlayerInput> = {}): PlayerInput => ({
  style: 'magic',
  level: null,
  damage: 50,
  perSecond: 1,
  hit: null,
  flee: 200,
  ...over,
});

export const nobody: PlayerInput = { style: 'melee', level: null, damage: null, perSecond: null, hit: null, flee: null };
