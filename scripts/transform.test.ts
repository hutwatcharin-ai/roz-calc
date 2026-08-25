import { describe, it, expect } from 'vitest';
import monstersFixture from './fixtures/monsters.sample.json';
import itemsFixture from './fixtures/items.sample.json';
import skillsFixture from './fixtures/skills.sample.json';
import { transformMonster, transformItem, transformDrops, transformSpawns, transformSkill } from './transform';

describe('transformMonster', () => {
  it('maps a raw monster to the monsters table shape', () => {
    const row = transformMonster(monstersFixture.monsters[0]);
    expect(row).toEqual({
      id: 1001,
      name_en: 'Scorpion',
      name_th: null,
      level: 16,
      element: 'Fire',
      element_level: 1,
      race: 'Insect',
      size: 'Small',
      hp: 136,
      atk_min: 7,
      atk_max: 7,
      def: 16,
      mdef: 5,
      flee: 206,
      hit: 232,
      base_exp: 338,
      job_exp: 75,
      image_url: '/images/monsters/1001.gif',
    });
  });
});

describe('transformDrops', () => {
  it('produces one drop row per drop entry', () => {
    const rows = transformDrops(monstersFixture.monsters[1]);
    expect(rows).toEqual([{ monster_id: 1091, item_id: 507, rate: 40 }]);
  });

  it('filters out drop entries whose rate is unparseable (e.g. "???")', () => {
    const rows = transformDrops(monstersFixture.monsters[1]);
    expect(rows.find((r) => r.item_id === 480569)).toBeUndefined();
    expect(rows.every((r) => typeof r.rate === 'number' && Number.isFinite(r.rate))).toBe(true);
  });
});

describe('transformSpawns', () => {
  it('produces one spawn row per spawn entry', () => {
    const rows = transformSpawns(monstersFixture.monsters[1]);
    expect(rows).toEqual([{ monster_id: 1091, map_code: 'moc_fild18', map_display_name: 'Sograt Desert' }]);
  });
});

describe('transformItem', () => {
  it('parses weapon fields out of the description for a weapon item', () => {
    const row = transformItem(itemsFixture.items[1]);
    expect(row).toEqual({
      id: 1131,
      name_en: 'Ice Falchion',
      name_th: null,
      category: 'Weapon',
      weapon_type: 'Sword',
      atk: 100,
      required_level: 40,
      weapon_level: 4,
      equippable_classes: ['Swordsman', 'Merchant', 'Thief'],
      buy_price: null,
      sell_price: null,
      icon_url: '/images/items/1131.gif',
    });
  });

  it('leaves weapon fields null for a non-weapon item and keeps numeric prices', () => {
    const row = transformItem(itemsFixture.items[0]);
    expect(row.weapon_type).toBeNull();
    expect(row.buy_price).toBe(1200);
    expect(row.sell_price).toBe(10);
  });
});

describe('transformSkill', () => {
  it('maps a raw skill to the skills table shape', () => {
    const row = transformSkill(skillsFixture[1]);
    expect(row).toEqual({
      slug: 'acid-terror',
      name: 'Acid Terror',
      type: 'active',
      max_level: 5,
      element: null,
      classes: ['Alchemist'],
      icon_url: '/assets/local/catalog/e5918d9576872db9caf4731eb66ad3ab.webp',
    });
  });

  it('passes through null type/classes for unverified skills', () => {
    const row = transformSkill(skillsFixture[0]);
    expect(row.type).toBeNull();
    expect(row.classes).toEqual([]);
  });
});
