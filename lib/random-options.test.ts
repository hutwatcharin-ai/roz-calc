import { describe, expect, it } from 'vitest';
import { randomOptionsFor } from './random-options';

describe('randomOptionsFor', () => {
  it('gives a Lv1 physical weapon the ATK-based melee pool', () => {
    // Dagger, weapon_level 1 -- confirmed live against prontera's own
    // resolver on 3 Sep 2026 as "Melee Series".
    const lines = randomOptionsFor('Weapon', 'Dagger', 1);
    expect(lines).not.toBeNull();
    const guaranteed = lines!.find((l) => l.acquisition === 'guaranteed');
    expect(guaranteed!.entries.map((e) => e.label_en)).toContain('ATK');
  });

  it('gives a Staff the MATK-based magic pool at the same level', () => {
    // Mighty Staff, weapon_level 3 -- confirmed live as "Magic Series".
    const lines = randomOptionsFor('Weapon', 'One-handed Staff', 3);
    expect(lines).not.toBeNull();
    const guaranteed = lines!.find((l) => l.acquisition === 'guaranteed');
    expect(guaranteed!.entries.map((e) => e.label_en)).toContain('MATK');
  });

  it('a Two-handed Staff at the same level gets the same magic pool as One-handed', () => {
    const oneHanded = randomOptionsFor('Weapon', 'One-handed Staff', 2);
    const twoHanded = randomOptionsFor('Weapon', 'Two-handed Staff', 2);
    expect(twoHanded).toEqual(oneHanded);
  });

  it('Book is physical, not magic (checked live, not assumed)', () => {
    const lines = randomOptionsFor('Weapon', 'Book', 2);
    const guaranteed = lines!.find((l) => l.acquisition === 'guaranteed');
    expect(guaranteed!.entries.map((e) => e.label_en)).toContain('ATK');
  });

  it('returns the armor slot pool for body armor', () => {
    const lines = randomOptionsFor('Armor', 'Armor', null);
    expect(lines).not.toBeNull();
    const guaranteed = lines!.find((l) => l.acquisition === 'guaranteed');
    expect(guaranteed!.entries.map((e) => e.label_en)).toContain('MaxHP');
  });

  it('returns null for slots the game does not roll options on', () => {
    expect(randomOptionsFor('Armor', 'Headgear', null)).toBeNull();
    expect(randomOptionsFor('Armor', 'Shield', null)).toBeNull();
    expect(randomOptionsFor('Armor', 'Accessory', null)).toBeNull();
  });

  it('returns null for a weapon with no known weapon_level', () => {
    expect(randomOptionsFor('Weapon', 'Dagger', null)).toBeNull();
  });

  it('returns null for costumes and other non-participating categories', () => {
    expect(randomOptionsFor('Costume Equipment', 'Upper Head', null)).toBeNull();
  });
});
