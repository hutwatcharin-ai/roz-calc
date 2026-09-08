import { describe, it, expect } from 'vitest';
import { cardEffect, cardRoles, cardSlot, ROLE_ORDER, ROLE_TH, SLOT_TH } from './card-roles';

// The client's own wording, copied from rows in our items table.
const HYDRA = 'Physical Damage to Demi-Human Enemies +20%.\nType : Card\nEquipped on : Weapon\nWeight : 1';
const MUNAK = 'Resistance to Petrify +15%.\nEarth-Property Resistance +5%.\nDEF +1.\nType : Card\nEquipped on : Shield\nWeight : 1';
const SWORDFISH = 'Armor gains Water-Property property.\nDEF +1.\nType : Card\nEquipped on : Armor\nWeight : 1';
const OBEAUNE = '[Cure] Lv.1 can be used.\nType : Card\nEquipped on : Accessory\nWeight : 1';
const HAMMER_DWARF = 'LUK + 1, LUK + 1 for every 3 refine levels of the Helm.';

describe('cardSlot', () => {
  it('reads the slot the client writes into the description', () => {
    expect(cardSlot(HYDRA)).toBe('weapon');
    expect(cardSlot(MUNAK)).toBe('shield');
  });

  it('folds the client\'s two words for one place into one slot', () => {
    expect(cardSlot('x\nEquipped on : Helmet')).toBe('headgear');
    expect(cardSlot('x\nEquipped on : Footgear')).toBe('shoes');
  });

  it('is null when the description does not say, rather than guessing', () => {
    expect(cardSlot(HAMMER_DWARF)).toBeNull();
    expect(cardSlot(null)).toBeNull();
  });
});

describe('cardEffect', () => {
  it('drops the client\'s type/slot/weight block', () => {
    expect(cardEffect(HYDRA)).toBe('Physical Damage to Demi-Human Enemies +20%.');
    expect(cardEffect(MUNAK)).toBe('Resistance to Petrify +15%.\nEarth-Property Resistance +5%.\nDEF +1.');
  });
});

describe('cardRoles', () => {
  it('puts a card in every role its effect really serves', () => {
    // Munak is the case the whole design turns on: someone looking for
    // petrify protection and someone looking for earth resistance must both
    // find it, and it also gives DEF.
    expect(cardRoles(MUNAK)).toEqual(['element-resist', 'status-resist', 'defence']);
  });

  it('reads the element-change wording apart from the resistance wording', () => {
    expect(cardRoles(SWORDFISH)).toContain('armor-element');
    expect(cardRoles(SWORDFISH)).not.toContain('element-resist');
  });

  // Both of these were classed as "other" on the first run: the skill level
  // is written "Lv.1", which broke a pattern that refused to cross a dot,
  // and the stat cards are written "LUK + 1" with spaces around the sign.
  it('handles the two spellings that broke the first pass', () => {
    expect(cardRoles(OBEAUNE)).toEqual(['skill']);
    expect(cardRoles(HAMMER_DWARF)).toEqual(['stats']);
  });

  it('says other rather than forcing a card into a bucket', () => {
    expect(cardRoles('A coin filled with dreams.')).toEqual(['other']);
    expect(cardRoles('')).toEqual(['other']);
  });

  it('returns roles in display order', () => {
    const roles = cardRoles(MUNAK);
    const positions = roles.map((r) => ROLE_ORDER.indexOf(r));
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });
});

describe('the page can label everything it produces', () => {
  it('has a Thai heading for every role and slot', () => {
    for (const role of ROLE_ORDER) {
      expect(ROLE_TH[role].title, role).toBeTruthy();
      expect(ROLE_TH[role].asks, role).toBeTruthy();
    }
    expect(Object.keys(SLOT_TH)).toHaveLength(7);
  });
});
