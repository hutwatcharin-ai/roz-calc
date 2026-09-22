import { describe, expect, it } from 'vitest';
import { notableDrops, type MapDropMonster, type MapDropRow } from './map-drops';

const mob = (id: number, name: string, extra: Partial<MapDropMonster> = {}): MapDropMonster => ({
  id, name_en: name, is_mvp: false, largestSpawn: 30, ...extra,
});
const drop = (monster_id: number, id: number, name: string, category: string, rate: number | null): MapDropRow => ({
  monster_id, rate, items: { id, name_en: name, icon_url: null, category },
});

describe('notableDrops', () => {
  it('keeps released cards and gear, drops everything else', () => {
    const result = notableDrops([mob(1, 'Mummy')], [
      drop(1, 10, 'Mummy Card', 'Card', 0.01),
      drop(1, 11, 'Rotten Bandage', 'Etc', 90),
      drop(1, 12, 'Ring', 'Armor', 0.05),
    ]);
    expect(result.cards.map((d) => d.name)).toEqual(['Mummy Card']);
    expect(result.gear.map((d) => d.name)).toEqual(['Ring']);
  });

  it('leaves out a card the game has not released', () => {
    const result = notableDrops([mob(1, 'Joker')], [drop(1, 10, 'Joker Card', 'Card', 0.01)]);
    expect(result.cards).toEqual([]);
  });

  it('leaves out MVP and solo-spawn drops but names the boss', () => {
    const result = notableDrops(
      [mob(1, 'Mummy'), mob(2, 'Osiris', { is_mvp: true }), mob(3, 'Vocal', { largestSpawn: 1 })],
      [drop(2, 20, 'Osiris Card', 'Card', 0.01), drop(3, 21, 'Vocal Card', 'Card', 0.01), drop(2, 22, 'Crown', 'Armor', 5)],
    );
    expect(result.cards).toEqual([]);
    expect(result.gear).toEqual([]);
    expect(result.bosses.map((b) => b.name)).toEqual(['Osiris', 'Vocal']);
  });

  it('does not treat a monster with no known count as a boss', () => {
    const result = notableDrops([mob(1, 'Mummy', { largestSpawn: null })], [drop(1, 10, 'Mummy Card', 'Card', 0.01)]);
    expect(result.cards).toHaveLength(1);
    expect(result.bosses).toEqual([]);
  });

  it('names the best source once and counts the rest', () => {
    const result = notableDrops([mob(1, 'Mummy'), mob(2, 'Ancient Mummy')], [
      drop(1, 12, 'Ring', 'Armor', 0.02),
      drop(2, 12, 'Ring', 'Armor', 0.5),
    ]);
    expect(result.gear).toHaveLength(1);
    expect(result.gear[0]).toMatchObject({ monsterName: 'Ancient Mummy', rate: 0.5, sources: 2 });
  });

  it('sorts by rate with unknown rates last and caps each group at six', () => {
    const rows = [drop(1, 1, 'Unknown Rate', 'Weapon', null)];
    for (let i = 2; i <= 9; i++) rows.push(drop(1, i, `Gear ${i}`, 'Weapon', i));
    const result = notableDrops([mob(1, 'Mummy')], rows);
    expect(result.gear.map((d) => d.rate)).toEqual([9, 8, 7, 6, 5, 4]);
  });
});
