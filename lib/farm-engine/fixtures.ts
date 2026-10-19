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
  atk: 100,
  attackDelay: 1000,
  viewRange: 10,
  walkSpeed: 200,
  attackRange: 1,
  oneDamage: false,
  ...over,
});

export const place = (code: string, spawns: [number, number | null][]): FarmMap => ({
  code,
  name: code,
  image: null,
  spawns: spawns.map(([id, amount]) => ({ id, amount })),
  walkCells: null,
});

export const world = (monsters: FarmMonster[], maps: FarmMap[]): FarmData => ({
  monsters: Object.fromEntries(monsters.map((m) => [m.id, m])),
  maps,
  excluded: { mvp: 0, solo: 0, closedMaps: 0 },
  coverage: { pricedItems: 0, totalItems: 0, ratedDrops: 0, totalDrops: 0 },
  potions: [{ id: 501, name: 'Red Potion', icon: null, heal: 45, price: 10, weight: 7 }],
});

/** The survival model's inputs left blank: the fallback dodge gate applies. */
export const noSurvival = {
  maxHp: null,
  def: null,
  vit: null,
  potionId: null,
  potions: null,
  maxWeight: null,
  walkSeconds: null,
} as const;

/**
 * A caster never misses: 100 HP at 50 a cast, one cast a second, is two
 * seconds. No walking between kills unless a test asks for it, so the kill
 * time is the whole cycle.
 */
export const caster = (over: Partial<PlayerInput> = {}): PlayerInput => ({
  style: 'magic',
  level: null,
  damage: 50,
  perSecond: 1,
  hit: null,
  flee: 200,
  ...noSurvival,
  walkSeconds: 0,
  ...over,
});

export const nobody: PlayerInput = { style: 'melee', level: null, damage: null, perSecond: null, hit: null, flee: null, ...noSurvival };
