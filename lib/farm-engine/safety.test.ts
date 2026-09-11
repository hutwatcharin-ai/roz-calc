import { describe, expect, it } from 'vitest';
import { mapBlockers, mapTags } from './safety';
import { mob } from './fixtures';
import type { MapRow, PlayerInput } from './types';

const player = (over: Partial<PlayerInput> = {}): PlayerInput => ({
  style: 'melee',
  level: null,
  damage: 500,
  perSecond: 2,
  hit: 300,
  flee: 200,
  ...over,
});

const rows = (...list: [ReturnType<typeof mob>, number][]): MapRow[] => list.map(([m, amount]) => ({ m, amount }));

describe('mapBlockers', () => {
  it('cannot judge without FLEE', () => {
    expect(mapBlockers(rows([mob(1), 20]), player({ flee: null }))).toBeNull();
  });

  it('passes a map where nothing lands on the player', () => {
    // 5 + 100 - 200 clamps to the 5% floor.
    expect(mapBlockers(rows([mob(1), 20]), player())).toEqual([]);
  });

  it('blocks on anything that hits too often, earner or not', () => {
    const out = mapBlockers(rows([mob(1), 20], [mob(3, { flee95: 400, isAggressive: true, perKill: 0 }), 5]), player());
    expect(out).toEqual([{ id: 3, name: 'mob 3', reason: 'dodge', theirHitPct: 100 }]);
  });

  it('treats a monster with no FLEE figure as unsafe', () => {
    expect(mapBlockers(rows([mob(4, { flee95: null }), 5]), player())?.[0].reason).toBe('unknown_flee');
  });

  it('counts an MVP standing on the map', () => {
    expect(mapBlockers(rows([mob(1), 20], [mob(2, { isMvp: true, flee95: 500 }), 1]), player())).toHaveLength(1);
  });

  it('holds a caster to the strict cap', () => {
    // 5 + 212 - 200 = 17%: inside the relaxed 20% for a melee bot on a
    // passive map, over the strict 10% for a caster whose cast breaks.
    const map = rows([mob(1, { flee95: 212 }), 20]);
    expect(mapBlockers(map, player())).toEqual([]);
    expect(mapBlockers(map, player({ style: 'magic', hit: null }))).toHaveLength(1);
  });

  it('holds everything to the strict cap on a map with an aggressive kind', () => {
    const map = rows([mob(1, { flee95: 212 }), 20], [mob(2, { isAggressive: true }), 5]);
    expect(mapBlockers(map, player())?.map((b) => b.id)).toEqual([1]);
  });
});

describe('mapTags', () => {
  it('counts aggressive kinds and groups risky skills by kind', () => {
    const tags = mapTags(
      rows(
        [mob(1, { isAggressive: true, risks: [{ skillName: 'NPC_SUMMONSLAVE', risk: 'summons' }] }), 20],
        [mob(2, { risks: [{ skillName: 'NPC_STUNATTACK', risk: 'locks' }, { skillName: 'NPC_CALLSLAVE', risk: 'summons' }] }), 5],
        [mob(3), 5],
      ),
    );
    expect(tags.aggressiveKinds).toBe(1);
    expect(tags.risks).toEqual([
      { risk: 'summons', names: ['mob 1', 'mob 2'] },
      { risk: 'locks', names: ['mob 2'] },
    ]);
  });
});
