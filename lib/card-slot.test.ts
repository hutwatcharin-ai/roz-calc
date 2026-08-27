import { describe, it, expect } from 'vitest';
import { parseCardSlot } from './card-slot';

describe('parseCardSlot', () => {
  it('reads the slot from the Equipped on line', () => {
    const d = 'ATK +20.\nType : Card\nEquipped on : Weapon\nWeight : 1';
    expect(parseCardSlot(d)).toBe('Weapon');
  });

  it('returns null for a null description rather than throwing', () => {
    expect(parseCardSlot(null)).toBeNull();
  });

  it('returns null when there is no Equipped on line', () => {
    expect(parseCardSlot('Type : Card\nWeight : 1')).toBeNull();
  });

  it('returns the malformed upstream value verbatim rather than guessing', () => {
    const d = 'Physical Damage to Dragon Monsters +20%.\nType : Card\nEquipped on : c\nWeight : 1';
    expect(parseCardSlot(d)).toBe('c');
  });

  it('does not merge Helmet into Headgear', () => {
    expect(parseCardSlot('Equipped on : Helmet')).toBe('Helmet');
    expect(parseCardSlot('Equipped on : Headgear')).toBe('Headgear');
  });

  it('trims whitespace and stops at the end of the line', () => {
    expect(parseCardSlot('Equipped on :   Shield  \nWeight : 1')).toBe('Shield');
  });

  it('returns null for an empty slot value instead of an empty string', () => {
    expect(parseCardSlot('Equipped on : \nWeight : 1')).toBeNull();
  });
});
