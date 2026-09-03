import { describe, expect, it } from 'vitest';
import { isEquipmentCategory, itemHref } from './item-href';

describe('itemHref', () => {
  it('sends the three equipment categories to the equipment route', () => {
    expect(itemHref(1163, 'Weapon')).toBe('/database/equipment/1163');
    expect(itemHref(2301, 'Armor')).toBe('/database/equipment/2301');
    expect(itemHref(20000, 'Costume Equipment')).toBe('/database/equipment/20000');
  });

  it('leaves everything else on the item route', () => {
    expect(itemHref(501, 'Consumable')).toBe('/database/items/501');
    expect(itemHref(4118, 'Card')).toBe('/database/items/4118');
    expect(itemHref(909, null)).toBe('/database/items/909');
  });

  it('does not treat a near-miss category name as equipment', () => {
    // The redirect pair keys off this exact set: a category that reads like
    // gear but is not in EQUIPMENT_CATEGORIES must stay on the item route, or
    // the two routes bounce a request between each other forever.
    expect(isEquipmentCategory('Equipment')).toBe(false);
    expect(isEquipmentCategory('weapon')).toBe(false);
    expect(isEquipmentCategory(undefined)).toBe(false);
  });
});
