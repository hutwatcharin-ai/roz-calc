import { describe, it, expect } from 'vitest';
import {
  normalizeMonsterName,
  parseCard,
  parseDrops,
  parseEquipment,
  parseSkill,
} from './rozerodb-export-parse';

// Fixtures are verbatim slices of docs/rozerodb-export/data/*.jsonl text
// fields. Each covers a shape that differs from the others; a parser change
// that breaks any shape names it here rather than importing garbage.

const GUILD_FIST =
  "← Equipment Advanced Guild Fist #560003 · Weapon · Knuckle Type Knuckle Equip location Knuckle ATK 80 DEF 0 Required level 70 Weapon level 3 Slots 1 Element — Weight 30 Rating — Buy price — Sell price — Description / Effect ※ Additional options in Siege areas Physical damage to players +25%. Ignores 5% of players' physical defense. RO ZERO DATABASE";

const GUILD_SUIT =
  '← Equipment Advanced Guild Suit #450013 · Armor · — Type — Equip location Armor ATK 0 DEF 30 Required level 70 Weapon level — Slots 1 Element — Weight 150 Rating — Buy price — Sell price — Description / Effect A suit designed for seasoned Guild Member. ※ GvG-only options RO ZERO DATABASE';

const ADVENTURER_SUIT =
  "← Equipment Adventurer's Suit #450318 · Armor · — Type — Equip location Armor ATK 0 DEF 20 Required level 1 Weapon level — Slots 0 Element — Weight 30 Rating — Buy price 1,000 Sell price 500 Description / Effect All-weather outfit crafted for travelers. DEF : 20 Job restrictions All Jobs Structured source data Def 20 Rating — Weight 30 Element — Buy Price 1,000 Tradeable Yes Card Slots 0 Sell Price 500 Weapon Type —";

const BAZERALD =
  '← Equipment Bazerald #1231 · Weapon · Dagger Type Dagger Equip location Dagger ATK 70 DEF 0 Required level 36 Weapon level 4 Slots 0 Element Fire Weight 50 Rating — Buy price — Sell price — Description / Effect Dagger adorned with very ornate patterns, often used by nobles as a ceremonial or decorative weapon. INT +5. MATK +105 Element : Fire Job restrictions Swordman classes, Mage classes, Archer classes, Merchant c RO ZERO DATABASE';

const ALLIGATOR_CARD =
  '← Card Alligator Card #4252 · Accessory Card effect Ranged Physical Damage Taken -5%. Structured source data Weight 1 Tradeable Yes Buy price 20 Sell price 10 Dropped by ( 2 ) C2_ALLIGATOR Lv 68 0.05% Alligator Lv 68 0.01% Where to farm K RO ZERO DATABASE';

const ACCELERATION =
  '← Player Skill Acceleration Max Lv 3 Description Verified with ROZ in its current version. Levels Level Effect SP Range Cast Cooldown 1 — 20 1 — — 2 — 40 1 — — 3 — 60 1 — — Requires Madogear License Lv 1 + Leads to Hover Learned by No class recorded yet. RO ZERO DATABASE';

const ACID_BOMB =
  '← Player Skill Acid Bomb Active Max Lv 10 Alchemist, Creator Description Consumes 1 Molotov Cocktail and 1 Acid Bottle to deal Ranged Physical Damage to a target. Damage increases based on the caster’s INT. Levels Level Effect SP Range Cast Cooldown RO ZERO DATABASE';

describe('parseEquipment', () => {
  it('reads a weapon with its weapon level, the field this import exists for', () => {
    const e = parseEquipment(GUILD_FIST)!;
    expect(e.id).toBe(560003);
    expect(e.name).toBe('Advanced Guild Fist');
    expect(e.kind).toBe('Weapon');
    expect(e.weaponType).toBe('Knuckle');
    expect(e.atk).toBe(80);
    expect(e.weaponLevel).toBe(3);
    expect(e.slots).toBe(1);
  });

  it('reads a dash as none, not as zero', () => {
    // An armour has no weapon level; a zero would send it to the wrong refine
    // table, which is exactly the mistake the null was protecting against.
    const e = parseEquipment(GUILD_SUIT)!;
    expect(e.weaponLevel).toBeNull();
    expect(e.element).toBeNull();
    expect(e.buy).toBeNull();
    expect(e.def).toBe(30);
  });

  it('reads prices with thousands separators, and a real zero stays zero', () => {
    const e = parseEquipment(ADVENTURER_SUIT)!;
    expect(e.buy).toBe(1_000);
    expect(e.sell).toBe(500);
    expect(e.slots).toBe(0);
  });

  it('stops the description at the next section, not at a length', () => {
    const e = parseEquipment(ADVENTURER_SUIT)!;
    expect(e.description).toBe('All-weather outfit crafted for travelers. DEF : 20');
    expect(e.jobRestrictions).toBe('All Jobs');
  });

  it('keeps element and the class list on an elemental weapon', () => {
    const e = parseEquipment(BAZERALD)!;
    expect(e.element).toBe('Fire');
    expect(e.weaponLevel).toBe(4);
    expect(e.jobRestrictions).toContain('Swordman classes');
  });

  it("survives an apostrophe in the name", () => {
    expect(parseEquipment(ADVENTURER_SUIT)!.name).toBe("Adventurer's Suit");
  });

  it('returns null for a page that is not an equipment page', () => {
    expect(parseEquipment('RO ZERO DATABASE Equipment listing')).toBeNull();
  });
});

describe('parseCard', () => {
  it('reads the effect and where the card sockets', () => {
    const c = parseCard(ALLIGATOR_CARD)!;
    expect(c.id).toBe(4252);
    expect(c.name).toBe('Alligator Card');
    expect(c.location).toBe('Accessory');
    expect(c.effect).toBe('Ranged Physical Damage Taken -5%.');
    expect(c.buy).toBe(20);
    expect(c.sell).toBe(10);
  });

  it('reads the drop list with both name spellings', () => {
    const c = parseCard(ALLIGATOR_CARD)!;
    expect(c.drops).toEqual([
      { monster: 'C2_ALLIGATOR', level: 68, rate: 0.05 },
      { monster: 'Alligator', level: 68, rate: 0.01 },
    ]);
  });
});

describe('parseSkill', () => {
  it('drops the "Verified with ROZ" stamp rather than storing boilerplate on 800 rows', () => {
    const s = parseSkill(ACCELERATION)!;
    expect(s.name).toBe('Acceleration');
    expect(s.maxLevel).toBe(3);
    expect(s.description).toBeNull();
    expect(s.requires).toBe('Madogear License Lv 1');
  });

  it('reads a real description and the skill type', () => {
    const s = parseSkill(ACID_BOMB)!;
    expect(s.name).toBe('Acid Bomb');
    expect(s.type).toBe('active');
    expect(s.maxLevel).toBe(10);
    expect(s.description).toContain('Molotov Cocktail');
    expect(s.description).not.toContain('Levels Level');
  });
});

describe('drops and monster names', () => {
  it('parses a drop section embedded in any page', () => {
    expect(parseDrops(ALLIGATOR_CARD)).toHaveLength(2);
    expect(parseDrops(GUILD_FIST)).toEqual([]);
  });

  it('normalizes their UPPER_SNAKE names to match our name_en spellings', () => {
    // Our table stores "C2 Alligator"; their pages print both spellings.
    expect(normalizeMonsterName('C2_ALLIGATOR')).toBe('c2 alligator');
    expect(normalizeMonsterName('Alligator')).toBe('alligator');
    expect(normalizeMonsterName("Am Mut")).toBe('am mut');
  });
});

describe('the second equipment header shape', () => {
  const BONGUN =
    '← Equipment Bongun Hat #5046 · Weapon Type Weapon Equip location All Head Slots ATK 0 DEF 5 Required level 1 Weapon level — Slots 0 Element — Weight 30 Rating — Buy price — Sell price — Description / Effect A hat. RO ZERO DATABASE';
  const COSTUME =
    '← Equipment [Costume] Above the Clouds #420511 · Costume Type Costume Equip location Lower Head ATK 0 DEF 0 Required level 1 Weapon level 0 Slots 0 Element — Weight 10 Rating — Buy price — Sell price — Description / Effect Fluffy. RO ZERO DATABASE';
  const RELEASE_TAIL =
    '← Equipment Battle Hook #1421 · Weapon · One-handed Spear UPCOMING · JAN 2027 Global · Glast Heim Dungeon Update Type One-handed Spear Equip location One-Handed Spear ATK 140 DEF 0 Required level 65 Weapon level 4 Slots 1 Element — Weight 90 Rating — Buy price — Sell price — Description / Effect Spear with a hook-shaped tip. RO ZERO DATABASE';

  it('reads gear whose UPCOMING stamp carries a release tail', () => {
    // 338 pages append "UPCOMING · JAN 2027 Global · <patch name>" between the
    // subtype and the stat strip; the fixed-position UPCOMING match missed all
    // of them.
    const e = parseEquipment(RELEASE_TAIL)!;
    expect(e.id).toBe(1421);
    expect(e.upcoming).toBe(true);
    expect(e.atk).toBe(140);
    expect(e.weaponLevel).toBe(4);
  });

  const UPCOMING =
    '← Equipment Future Blade #999999 · Weapon UPCOMING · Sword Type Sword Equip location Sword ATK 100 DEF 0 Required level 99 Weapon level 4 Slots 0 Element — Weight 100 Rating — Buy price — Sell price — Description / Effect Soon. RO ZERO DATABASE';

  it('parses the headerless-subtype shape, which is 72% of their equipment pages', () => {
    // The first parser required " · <subtype> · " and silently failed 1,945 of
    // 2,693 pages -- caught by scanning the whole export before importing.
    const e = parseEquipment(BONGUN)!;
    expect(e.id).toBe(5046);
    expect(e.name).toBe('Bongun Hat');
    expect(e.equipLocation).toBe('All Head Slots');
    expect(e.def).toBe(5);
    expect(e.upcoming).toBe(false);
  });

  it('parses Costume as its own kind', () => {
    const e = parseEquipment(COSTUME)!;
    expect(e.kind).toBe('Costume');
    expect(e.name).toBe('[Costume] Above the Clouds');
  });

  it('carries the UPCOMING stamp instead of dropping unreleased gear silently', () => {
    const e = parseEquipment(UPCOMING)!;
    expect(e.upcoming).toBe(true);
    expect(e.kind).toBe('Weapon');
    expect(e.weaponLevel).toBe(4);
  });
});
