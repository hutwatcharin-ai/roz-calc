import { describe, expect, it } from 'vitest';
import { physicalDamagePerHit, sizeModifier, type DamageInput } from './damage';

const BASE: DamageInput = {
  weaponAtk: 100,
  statusAtk: 100,
  weaponType: 'Dagger',
  weaponElement: 'Neutral',
  targetSize: 'medium',
  targetElement: 'Neutral',
  targetElementLevel: 1,
  targetDef: 0,
  targetLevel: 0,
  targetVit: 0,
};

describe('sizeModifier', () => {
  it('reads the published table', () => {
    // Dagger: 100 / 75 / 50 against small / medium / large.
    expect(sizeModifier('Dagger', 'small')).toBe(1);
    expect(sizeModifier('Dagger', 'medium')).toBe(0.75);
    expect(sizeModifier('Dagger', 'large')).toBe(0.5);
  });

  it('accepts the capitalised size the database stores', () => {
    // monsters.size holds "Medium", not "medium" -- reading it raw made every
    // monster page show NaN damage.
    expect(sizeModifier('Dagger', 'Medium')).toBe(0.75);
    expect(sizeModifier('Dagger', 'LARGE')).toBe(0.5);
  });

  it('leaves damage alone when the size or the weapon is unknown', () => {
    // A missing size must not silently become "medium": that would state a
    // penalty the data does not have.
    expect(sizeModifier('Dagger', null)).toBe(1);
    expect(sizeModifier('Sonic Blaster 9000', 'large')).toBe(1);
    expect(sizeModifier('Dagger', 'gigantic')).toBe(1);
  });
});

describe('physicalDamagePerHit', () => {
  it('adds the weapon and status shares with no reductions', () => {
    // DEF 0, level 0, VIT 0, Neutral into Neutral: nothing modifies anything.
    expect(physicalDamagePerHit(BASE)!.damage).toBe(175); // 100*0.75 + 100
  });

  it('applies the size penalty to the weapon share only', () => {
    // The whole point of the split: a Dagger into a Large monster keeps its
    // full status ATK. Halving the total instead would read 100, not 150.
    const large = physicalDamagePerHit({ ...BASE, targetSize: 'large' })!;
    expect(large.damage).toBe(150); // 100*0.5 + 100
  });

  it('applies the element multiplier to the weapon share only', () => {
    // Fire into Earth 1 is 150%: the weapon share doubles up, the Neutral
    // status share stays at its own Neutral-into-Earth rate.
    const d = physicalDamagePerHit({
      ...BASE,
      weaponType: 'Bare hand',
      weaponElement: 'Fire',
      targetElement: 'Earth',
      targetElementLevel: 1,
    })!;
    expect(d.elementModifier).toBe(150);
    expect(d.neutralModifier).toBe(100);
    expect(d.damage).toBe(250); // 100*1.5 + 100*1.0
  });

  it('reduces by the DEF factor and then subtracts soft DEF', () => {
    // DEF 100: (4000+100)/(4000+1000) = 0.82. Level 60 VIT 40 -> soft DEF 50.
    const d = physicalDamagePerHit({
      ...BASE,
      weaponType: 'Bare hand',
      targetDef: 100,
      targetLevel: 60,
      targetVit: 40,
    })!;
    expect(d.defFactor).toBeCloseTo(0.82, 5);
    expect(d.softDef).toBe(50);
    expect(d.damage).toBe(114); // floor(200*0.82 - 50)
  });

  it('never reports less than 1, however tanky the monster', () => {
    const d = physicalDamagePerHit({
      ...BASE,
      weaponAtk: 1,
      statusAtk: 1,
      targetDef: 300,
      targetLevel: 99,
      targetVit: 99,
    })!;
    expect(d.damage).toBe(1);
  });

  it('says nothing rather than guessing when the monster row is short a value', () => {
    // "We do not know this monster's DEF" is not "this monster has no DEF",
    // and an unknown element is not Neutral -- Neutral is a real matchup.
    expect(physicalDamagePerHit({ ...BASE, targetDef: null })).toBeNull();
    expect(physicalDamagePerHit({ ...BASE, targetLevel: null })).toBeNull();
    expect(physicalDamagePerHit({ ...BASE, targetElement: null })).toBeNull();
    expect(physicalDamagePerHit({ ...BASE, targetElementLevel: null })).toBeNull();
  });

  it('says nothing when the player has entered no ATK at all', () => {
    expect(physicalDamagePerHit({ ...BASE, weaponAtk: 0, statusAtk: 0 })).toBeNull();
    expect(physicalDamagePerHit({ ...BASE, weaponAtk: Number.NaN, statusAtk: 100 })).toBeNull();
  });

  it('treats a monster with no VIT recorded as VIT 0, not as unknown', () => {
    // VIT is the one input the formula can proceed without: it only raises
    // soft DEF, and 0 is what the column means when a mob has none.
    const d = physicalDamagePerHit({ ...BASE, weaponType: 'Bare hand', targetLevel: 40, targetVit: null })!;
    expect(d.softDef).toBe(20);
  });
});
