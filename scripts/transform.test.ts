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

  // Real raw data (data/raw/monsters.json) uses "" and "???" as "unknown"
  // markers on numeric fields. Any unparseable value in a batch upsert aborts
  // the whole import, so these must be coerced, never passed through raw.
  it('coerces sentinel values in NOT NULL columns to 0 (Tao Gunka, real raw data)', () => {
    const row = transformMonster(monstersFixture.monsters[2]);
    expect(row.id).toBe(1583);
    expect(row.hp).toBe(0);
    expect(row.base_exp).toBe(0);
    expect(row.job_exp).toBe(0);
    // Fields that do hold real numbers are still passed through untouched.
    expect(row.atk_min).toBe(3757);
    expect(row.def).toBe(404);
    expect(row.flee).toBe(541);
  });

  it('coerces sentinel values in nullable columns to null (Whisper, real raw data)', () => {
    const row = transformMonster(monstersFixture.monsters[3]);
    expect(row).toEqual({
      id: 1185,
      name_en: 'Whisper',
      name_th: null,
      level: 34,
      element: 'Shadow',
      element_level: 1,
      race: 'Demon',
      size: 'Small',
      hp: 0,
      atk_min: null,
      atk_max: null,
      def: null,
      mdef: null,
      flee: null,
      hit: null,
      base_exp: 0,
      job_exp: 0,
      image_url: '/images/monsters/1185.gif',
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
      description: 'A blue-bladed sword imbued with the power of water.\nType : Sword\nATK : 100\nWeight : 60\nElement : Water\nWeapon Level : 4\nRequired Level : 40\nEquippable by : Swordsman Class, Merchant Class, Thief Class',
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

describe('transformItem description', () => {
  it('joins description lines with newlines', () => {
    const row = transformItem({
      id: 4001,
      displayName: 'Poring Card',
      description: { lines: ['ATK +20', 'Class : Card'] },
    });
    expect(row.description).toBe('ATK +20\nClass : Card');
  });

  it('returns null when the item has no description', () => {
    const row = transformItem({ id: 909, displayName: 'Jellopy' });
    expect(row.description).toBeNull();
  });

  it('returns null for an empty lines array rather than an empty string', () => {
    const row = transformItem({ id: 910, displayName: 'Fluff', description: { lines: [] } });
    expect(row.description).toBeNull();
  });
});
