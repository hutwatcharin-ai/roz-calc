import { describe, it, expect } from 'vitest';
import { cardSlot, parseCardSlot } from './card-slot';

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

// Added 8 Sep 2026 with the folded slot the card list filters on. The raw
// reading above stays exactly as it was: the card's own page still shows
// what the client wrote, and only the list folds synonyms together.
describe('cardSlot', () => {
  it('folds the client\'s two words for one place into one slot', () => {
    expect(cardSlot('Equipped on : Helmet')).toBe('headgear');
    expect(cardSlot('Equipped on : Headgear')).toBe('headgear');
    expect(cardSlot('Equipped on : Footgear')).toBe('shoes');
    expect(cardSlot('Equipped on : Shoes')).toBe('shoes');
  });

  it('is null for a value it does not recognise, rather than the nearest one', () => {
    // One card upstream carries "c" on this line. Folding it into anything
    // would put a card in a slot the game never said it goes in.
    expect(cardSlot('Equipped on : c')).toBeNull();
    expect(cardSlot('Type : Card\nWeight : 1')).toBeNull();
    expect(cardSlot(null)).toBeNull();
  });
});
