import { describe, it, expect } from 'vitest';
import { SLOT_ORDER, cardSlot, cardSlotForGearType, equipmentHrefForSlot, parseCardSlot } from './card-slot';

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

describe('the link between cards and gear', () => {
  it('sends a card to the gear it can go in', () => {
    expect(equipmentHrefForSlot('headgear')).toBe('/database/equipment?category=Armor&type=Headgear');
    expect(equipmentHrefForSlot('shield')).toBe('/database/equipment?category=Armor&type=Shield');
    // A weapon card fits any weapon, so the link stops at the category.
    expect(equipmentHrefForSlot('weapon')).toBe('/database/equipment?category=Weapon');
  });

  it('sends a piece of gear to the cards that fit it', () => {
    expect(cardSlotForGearType('Headgear')).toBe('headgear');
    expect(cardSlotForGearType('Accessory')).toBe('accessory');
    // Every weapon type takes a weapon card, so they all fold to one slot.
    expect(cardSlotForGearType('Two-handed Spear')).toBe('weapon');
    expect(cardSlotForGearType('Katar')).toBe('weapon');
  });

  it('offers nothing for a row that holds no card', () => {
    // Arrows are in the weapon category and have no socket at all.
    expect(cardSlotForGearType('Arrow')).toBeNull();
    expect(cardSlotForGearType(null)).toBeNull();
  });

  it('speaks the value the card list filters on', () => {
    // The list compares against the folded slot ('headgear'), not the
    // client's own wording ('Headgear') -- linking the latter matched nothing
    // and quietly showed all 315 cards.
    for (const slot of SLOT_ORDER) expect(slot).toBe(slot.toLowerCase());
  });
});
