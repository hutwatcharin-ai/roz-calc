import { describe, it, expect } from 'vitest';
import monstersFixture from './fixtures/monsters.sample.json';
import itemsFixture from './fixtures/items.sample.json';
import skillsFixture from './fixtures/skills.sample.json';
import { transformMonster, transformItem, transformDrops, transformSpawns, transformSkill, transformMonsterSkills } from './transform';

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
      is_aggressive: false,
      is_mvp: false,
      loots_items: false,
      matk_min: null,
      matk_max: null,
      str: null,
      agi: null,
      vit: null,
      int_: null,
      dex: null,
      luk: null,
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
      is_aggressive: false,
      is_mvp: false,
      loots_items: false,
      matk_min: null,
      matk_max: null,
      str: null,
      agi: null,
      vit: null,
      int_: null,
      dex: null,
      luk: null,
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

describe('transformMonster special status and stats', () => {
  const base = {
    id: 1002,
    name: 'Poring',
    ragnarokZero: { level: 1, hp: 50, baseExp: 2, jobExp: 1 },
  };

  it('reads Aggressive out of the specialStatus object array', () => {
    const row = transformMonster({
      ...base,
      ragnarokZero: {
        ...base.ragnarokZero,
        specialStatus: [{ raw: 'Can move', en: 'Can move' }, { raw: 'Aggressive', en: 'Aggressive' }],
      },
    });
    expect(row.is_aggressive).toBe(true);
    expect(row.is_mvp).toBe(false);
    expect(row.loots_items).toBe(false);
  });

  it('reads MVP and Loots items independently', () => {
    const row = transformMonster({
      ...base,
      ragnarokZero: {
        ...base.ragnarokZero,
        specialStatus: [{ raw: 'MVP', en: 'MVP' }, { raw: 'Loots items', en: 'Loots items' }],
      },
    });
    expect(row.is_mvp).toBe(true);
    expect(row.loots_items).toBe(true);
    expect(row.is_aggressive).toBe(false);
  });

  it('defaults every flag to false when specialStatus is missing', () => {
    const row = transformMonster(base);
    expect(row.is_aggressive).toBe(false);
    expect(row.is_mvp).toBe(false);
    expect(row.loots_items).toBe(false);
  });

  it('maps baseStats.int to the int_ column', () => {
    const row = transformMonster({
      ...base,
      ragnarokZero: {
        ...base.ragnarokZero,
        baseStats: { str: 12, agi: 15, vit: 10, int: 5, dex: 19, luk: 5 },
      },
    });
    expect(row.int_).toBe(5);
    expect(row.str).toBe(12);
    expect(row.dex).toBe(19);
  });

  it('leaves stats null when baseStats is absent rather than defaulting to zero', () => {
    const row = transformMonster(base);
    expect(row.str).toBeNull();
    expect(row.int_).toBeNull();
    expect(row.matk_min).toBeNull();
  });
});

describe('transformMonsterSkills', () => {
  it('parses the percent-string rate into a number', () => {
    const rows = transformMonsterSkills({
      id: 1002,
      ragnarokZero: {
        skills: [
          {
            skillId: 176,
            skillLv: 3,
            name: 'NPC_POISON',
            rate: '5.00%',
            state: 'attack',
            castTime: 800,
            delay: 5000,
            target: 'target',
          },
        ],
      },
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual({
      monster_id: 1002,
      skill_id: 176,
      skill_name: 'NPC_POISON',
      skill_lv: 3,
      rate: 5,
      cast_time: 800,
      delay: 5000,
      target: 'target',
      state: 'attack',
    });
  });

  it('returns an empty array when the monster has no skills', () => {
    expect(transformMonsterSkills({ id: 1002, ragnarokZero: {} })).toEqual([]);
  });

  it('keeps the row with a null rate rather than dropping the skill', () => {
    const rows = transformMonsterSkills({
      id: 1002,
      ragnarokZero: { skills: [{ skillId: 1, skillLv: 1, name: 'NPC_X', rate: '' }] },
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].rate).toBeNull();
  });

  it('drops a skill entry with no name, which cannot satisfy the primary key', () => {
    const rows = transformMonsterSkills({
      id: 1002,
      ragnarokZero: { skills: [{ skillId: 1, skillLv: 1, rate: '5.00%' }] },
    });
    expect(rows).toEqual([]);
  });

  it('de-duplicates entries that share the primary key', () => {
    const rows = transformMonsterSkills({
      id: 1002,
      ragnarokZero: {
        skills: [
          { skillId: 176, skillLv: 3, name: 'NPC_POISON', rate: '5.00%' },
          { skillId: 176, skillLv: 5, name: 'NPC_POISON', rate: '9.00%' },
        ],
      },
    });
    expect(rows).toHaveLength(1);
  });
});
