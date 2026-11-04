import { describe, expect, it } from 'vitest';
import file from '@/data/costume-enchant-list.json';
import twins from '@/data/costume-twins.json';
import { enchantListId, isEnchantableCostume } from './costume-enchant';

describe('costume enchant list', () => {
  it('maps the website names that differ from the game by hand', () => {
    expect(enchantListId('Blue Pencil Bite')).toBe(31927);
    // Snake Hat is its own row on the list, so Coiled Snake Hat is the coiled one.
    expect(enchantListId('Coiled Snake Hat')).toBe(20110);
    expect(enchantListId('Snake Hat')).toBe(19730);
  });

  it('matches through the Korean name where the English names differ', () => {
    expect(enchantListId('Cone Hat')).toBe(20184); // Party Hat, 꼬깔모자
    expect(enchantListId('White Beard')).toBe(19783); // Grampa Beard, 흰수염
  });

  it('leaves names it cannot match for sure unlinked', () => {
    expect(enchantListId('Old Timey Mustache')).toBeNull();
  });

  it('never points at a Bound copy, and no id twice', () => {
    const bound = new Set(Object.keys((twins as { pairs: Record<string, number> }).pairs).map(Number));
    const ids = Object.values((file as { ids: Record<string, number | null> }).ids).filter((id): id is number => id !== null);
    expect(ids.filter((id) => bound.has(id))).toEqual([]);
    expect(new Set(ids).size).toBe(ids.length);
    expect(isEnchantableCostume(20037)).toBe(true); // Owlduke Silk Hat
    expect(isEnchantableCostume(401187)).toBe(false); // its Bound copy
  });
});
