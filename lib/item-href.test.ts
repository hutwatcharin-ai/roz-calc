import { describe, expect, it } from 'vitest';
import { isCostumeCategory, isEquipmentCategory, isGearCategory, itemHref } from './item-href';

describe('itemHref', () => {
  it('sends weapons and armour to the gear route', () => {
    expect(itemHref(1163, 'Weapon')).toBe('/database/equipment/1163');
    expect(itemHref(2301, 'Armor')).toBe('/database/equipment/2301');
  });

  it('sends costumes to their own route, not the gear one', () => {
    // 940 of the 1,815 wearable rows are costumes; sharing the gear route is
    // what buried armour in the list this split exists to fix.
    expect(itemHref(19585, 'Costume Equipment')).toBe('/database/costumes/19585');
    expect(isGearCategory('Costume Equipment')).toBe(false);
    expect(isEquipmentCategory('Costume Equipment')).toBe(true);
  });

  it('leaves everything else on the item route', () => {
    expect(itemHref(501, 'Consumable')).toBe('/database/items/501');
    expect(itemHref(4118, 'Card')).toBe('/database/items/4118');
    expect(itemHref(909, null)).toBe('/database/items/909');
  });

  it('does not treat a near-miss category name as wearable', () => {
    // The three routes redirect to each other off these exact strings: a
    // category that reads like gear but is not one must stay on the item
    // route, or two routes bounce a request between each other forever.
    expect(isEquipmentCategory('Equipment')).toBe(false);
    expect(isGearCategory('weapon')).toBe(false);
    expect(isCostumeCategory('Costume')).toBe(false);
    expect(isEquipmentCategory(undefined)).toBe(false);
  });
});
