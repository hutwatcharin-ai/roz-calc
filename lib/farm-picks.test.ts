// The cases are the three real rows that made the old ranking wrong, with
// their real numbers, so the test fails again if the weighting is removed.
import { describe, it, expect } from 'vitest';
import { farmPicks, farmBands, busiestMaps, unplaceable, rankFarmRange, type FarmCandidate, type SpawnPlace } from '@/lib/farm-picks';

const monster = (over: Partial<FarmCandidate> & { monsterId: number; name: string; level: number; expPerHp: number }): FarmCandidate => ({
  hp: 100,
  baseExp: 100,
  isAggressive: false,
  imageUrl: null,
  ...over,
});

// Numbers as they are in the database on 9 Sep 2026.
const BLUE_PLANT = monster({ monsterId: 1079, name: 'Blue Plant', level: 1, expPerHp: 52.1, hp: 10, baseExp: 521 });
const CHONCHON = monster({ monsterId: 1011, name: 'Chonchon', level: 5, expPerHp: 6.25, hp: 48, baseExp: 300 });
const ECLIPSE = monster({ monsterId: 1093, name: 'Eclipse', level: 34, expPerHp: 4.95, hp: 1168, baseExp: 5778 });
const ELDER_WILLOW = monster({ monsterId: 1033, name: 'Elder Willow', level: 37, expPerHp: 0.97, hp: 1088, baseExp: 1054 });
const DRAGON_FLY = monster({ monsterId: 1091, name: 'Dragon Fly', level: 56, expPerHp: 5.22, hp: 3477, baseExp: 18144 });

const SPAWNS: SpawnPlace[] = [
  { monsterId: 1079, map: 'Geffen Field', amount: 8 },
  { monsterId: 1079, map: 'Comodo Papuchicha Forest', amount: 3 },
  { monsterId: 1011, map: 'Geffen Field', amount: 160 },
  { monsterId: 1093, map: 'Labyrinth Forest 3F', amount: 1 },
  { monsterId: 1033, map: 'Prontera Field', amount: 157 },
  { monsterId: 1033, map: 'Geffen Field', amount: 12 },
  // Dragon Fly has no spawn row at all, like 21 of the 35 rows the page used
  // to print.
];

describe('busiestMaps', () => {
  it('takes the map with the most of them, not the first one seen', () => {
    // The old page showed Elder Willow at Geffen Field while Prontera Field
    // holds 157 of them.
    expect(busiestMaps(SPAWNS).get(1033)).toEqual({ map: 'Prontera Field', amount: 157 });
  });

  it('ignores rows with no map name or no count', () => {
    expect(busiestMaps([{ monsterId: 9, map: null, amount: 40 }, { monsterId: 9, map: 'X', amount: 0 }]).size).toBe(0);
  });
});

describe('farmPicks', () => {
  it('puts a crowded map ahead of a better ratio with nothing on it', () => {
    // Chonchon is worth a fifth of Blue Plant per hit point and beats it on
    // 160 against 8. This is the assertion the whole module exists for:
    // ranking on expPerHp alone puts Blue Plant first.
    const picks = farmPicks([BLUE_PLANT, CHONCHON], SPAWNS, { lo: 1, hi: 15 });
    expect(picks.map((p) => p.name)).toEqual(['Chonchon', 'Blue Plant']);
  });

  it('does not recommend a map that contains one monster', () => {
    const picks = farmPicks([ECLIPSE, ELDER_WILLOW], SPAWNS, { lo: 31, hi: 45 });
    expect(picks[0].name).toBe('Elder Willow');
    expect(picks[0].amount).toBe(157);
  });

  it('leaves out a monster with no known spawn rather than listing it with a dash', () => {
    const picks = farmPicks([DRAGON_FLY, ELDER_WILLOW], SPAWNS, { lo: 31, hi: 60 });
    expect(picks.map((p) => p.name)).toEqual(['Elder Willow']);
  });

  it('keeps the band boundaries', () => {
    expect(farmPicks([CHONCHON], SPAWNS, { lo: 16, hi: 30 })).toEqual([]);
  });
});

describe('farmBands', () => {
  it('stops at the cap instead of running to level 127', () => {
    // Three of the seven bands on the old page were above the cap, so a third
    // of the page advised players who cannot exist.
    expect(farmBands(60)).toEqual([
      { lo: 1, hi: 15 },
      { lo: 16, hi: 30 },
      { lo: 31, hi: 45 },
      { lo: 46, hi: 60 },
    ]);
  });

  it('follows the cap when it moves, and never ends past it', () => {
    const bands = farmBands(70);
    expect(bands[bands.length - 1]).toEqual({ lo: 61, hi: 70 });
  });
});

describe('unplaceable', () => {
  it('counts what was dropped, so the page can say so', () => {
    expect(unplaceable([DRAGON_FLY, CHONCHON], SPAWNS, 60)).toBe(1);
  });
});

describe('rankFarmRange', () => {
  it('ranks the placed monsters by density and keeps the rest aside', () => {
    const { ranked, unplaced } = rankFarmRange([BLUE_PLANT, CHONCHON, DRAGON_FLY], SPAWNS);
    expect(ranked.map((r) => r.name)).toEqual(['Chonchon', 'Blue Plant']);
    // Dragon Fly has the second-best ratio here and no map at all: it is not
    // dropped on this surface, because the reader chose the level range and an
    // empty table would read as missing data.
    expect(unplaced.map((r) => r.name)).toEqual(['Dragon Fly']);
  });

  it('never returns more rows than asked for', () => {
    const { ranked, unplaced } = rankFarmRange([BLUE_PLANT, CHONCHON, DRAGON_FLY], SPAWNS, 2);
    expect(ranked.length + unplaced.length).toBeLessThanOrEqual(2);
  });
});
