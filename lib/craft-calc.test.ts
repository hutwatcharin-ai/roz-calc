import { describe, expect, it } from 'vitest';
import { planCraft, type CalcRecipe } from './craft-calc';

const mat = (id: number, name: string, amount: number, held = false) => ({ id, name, amount, held });
const rec = (id: string, product: [number, string], materials: ReturnType<typeof mat>[], skillId: number | null = null): CalcRecipe => ({
  id,
  product: mat(product[0], product[1], 1),
  materials,
  skillId,
});

const BOOK = mat(9001, 'Lv.1 Cookbook', 0, true);
const stew = rec('stew', [1, 'Stew'], [BOOK, mat(10, 'Carrot', 3), mat(11, 'Meat', 2)]);
const salad = rec('salad', [2, 'Salad'], [BOOK, mat(10, 'Carrot', 5), mat(12, 'Leaf', 1)]);

const IRON_ORE = mat(1002, 'Iron Ore', 1);
const iron = rec('iron', [998, 'Iron'], [IRON_ORE], 94);
const steel = rec('steel', [999, 'Steel'], [mat(998, 'Iron', 5), mat(1003, 'Coal', 1)], 95);
const sword = rec('sword', [1101, 'Sword'], [mat(999, 'Steel', 2), mat(998, 'Iron', 1)]);

describe('planCraft', () => {
  it('merges a material two recipes share and lists a held book once', () => {
    const p = planCraft({ picks: { stew: 10, salad: 2 }, recipes: [stew, salad] });
    expect(p.raw.find((m) => m.id === 10)?.amount).toBe(40);
    expect(p.raw.find((m) => m.id === 11)?.amount).toBe(20);
    expect(p.raw.find((m) => m.id === 12)?.amount).toBe(2);
    expect(p.held).toHaveLength(1);
    expect(p.raw.some((m) => m.id === BOOK.id)).toBe(false);
    expect(p.unknownRate).toBe(true);
  });

  it('ignores zero and unknown picks', () => {
    const p = planCraft({ picks: { stew: 0, nope: 5 }, recipes: [stew] });
    expect(p.raw).toEqual([]);
    expect(p.steps).toEqual([]);
  });

  it('spends every material of a failed try: 10 Iron at 50% is 20 tries, 20 Iron Ore', () => {
    const p = planCraft({ picks: { iron: 10 }, recipes: [iron], rateOf: () => 50 });
    expect(p.steps[0].tries).toBe(20);
    expect(p.raw).toEqual([{ ...IRON_ORE, amount: 20 }]);
    expect(p.unknownRate).toBe(false);
  });

  it('walks Steel back to Iron Ore through Iron, with each step at its own rate', () => {
    const rates: Record<string, number> = { steel: 50, iron: 50 };
    const p = planCraft({ picks: { steel: 2 }, recipes: [iron, steel], chain: [iron, steel], expand: true, rateOf: (r) => rates[r.id] });
    // 2 Steel at 50% = 4 tries = 20 Iron + 4 Coal; 20 Iron at 50% = 40 tries = 40 Iron Ore.
    expect(p.raw.find((m) => m.id === 1003)?.amount).toBe(4);
    expect(p.raw.find((m) => m.id === 1002)?.amount).toBe(40);
    expect(p.raw.some((m) => m.id === 998)).toBe(false);
    expect(p.steps.map((s) => [s.recipe.id, s.want, s.tries, s.picked])).toEqual([
      ['steel', 2, 4, true],
      ['iron', 20, 40, false],
    ]);
  });

  it('adds an intermediate the reader also picked to the chain total before resolving it', () => {
    const p = planCraft({ picks: { sword: 1, iron: 3 }, recipes: [sword, iron], chain: [iron, steel], expand: true, rateOf: () => 100 });
    // Sword: 2 Steel (10 Iron + 2 Coal) + 1 Iron; plus 3 Iron picked = 14 Iron = 14 Iron Ore.
    expect(p.raw.find((m) => m.id === 1002)?.amount).toBe(14);
    expect(p.steps.find((s) => s.recipe.id === 'iron')).toMatchObject({ want: 14, picked: true });
  });

  it('leaves intermediates as materials when not expanding', () => {
    const p = planCraft({ picks: { sword: 1 }, recipes: [sword], chain: [iron, steel] });
    expect(p.raw.map((m) => [m.id, m.amount])).toEqual([
      [999, 2],
      [998, 1],
    ]);
  });

  it('charges a per-try item only for picked recipes', () => {
    const bowl = mat(7134, 'Medicine Bowl', 1);
    const p = planCraft({ picks: { stew: 3 }, recipes: [stew], rateOf: () => 50, perTry: () => [bowl] });
    expect(p.raw.find((m) => m.id === 7134)?.amount).toBe(6);
  });
});
