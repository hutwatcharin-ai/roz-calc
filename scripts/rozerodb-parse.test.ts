import { describe, it, expect } from 'vitest';
import { parseItemPage } from './fetch-rozerodb-items';

// Fixtures are the real text of four rozerodb pages, reduced to the stat block
// and whatever follows it. They cover the shapes that differ: an NPC-sold
// consumable, an unpriced material, a weapon with a type, and a card.

const RED_POTION =
  '← Item Red Potion # 501 Category Consumable Slot / type - ATK 0 DEF 0 Slots 0 Required level 0 Weight 7 NPC Buy 10 Sell 10 Description Recovery tonic finely ground from Red Herb. Recovers about 45 HP. Z SOLD BY NPC 10 Zeny Available from an in-game NPC shop.';

const MOLD_POWDER =
  '← Item Mold Powder # 7001 Category Other Slot / type - ATK 0 DEF 0 Slots 0 Required level 0 Weight 1 Buy — Sell — Description Soft mold powder. Can be sold to the Collector. Dropped by ( 1 ) Punk Lv 82 26.68%';

const KNIFE =
  '← Item Knife # 1201 Category Weapon Slot / type Dagger ATK 17 DEF 0 Slots 0 Required level 1 Weight 40 Buy 0 Sell 0 Description Short dagger designed so anyone can use it with ease. Dropped by ( 0 ) No monster-drop relation currently linked.';

const ORA_ORA =
  '← Item Ora Ora # 701 Category ETC Slot / type - ATK 0 DEF 0 Slots 0 Required level 0 Weight 20 Buy 55,000 Sell 10 Description Item created to lure Thief Bug by imitating their behavior. Crafting use Used in Crafting ( 1 )';

describe('parseItemPage', () => {
  it('reads the item this whole exercise is about', () => {
    // Red Potion is id 501 and is simply absent from our own source file.
    const item = parseItemPage(RED_POTION);
    expect(item).not.toBeNull();
    expect(item!.id).toBe(501);
    expect(item!.name).toBe('Red Potion');
    expect(item!.category).toBe('Consumable');
    expect(item!.buy).toBe(10);
    expect(item!.sell).toBe(10);
    expect(item!.description).toBe('Recovery tonic finely ground from Red Herb. Recovers about 45 HP.');
  });

  it('handles the NPC Buy wording as well as plain Buy', () => {
    expect(parseItemPage(RED_POTION)!.buy).toBe(10); // "NPC Buy 10"
    expect(parseItemPage(ORA_ORA)!.buy).toBe(55_000); // "Buy 55,000"
  });

  it('reads an em dash as no price rather than as zero', () => {
    // Zero is a real price on their pages -- Knife is Buy 0 -- so a dash has to
    // stay distinguishable from it or an unbuyable item looks free.
    const mold = parseItemPage(MOLD_POWDER)!;
    expect(mold.buy).toBeNull();
    expect(mold.sell).toBeNull();
    expect(parseItemPage(KNIFE)!.buy).toBe(0);
  });

  it('keeps the weapon type and drops the placeholder dash', () => {
    expect(parseItemPage(KNIFE)!.slotType).toBe('Dagger');
    expect(parseItemPage(KNIFE)!.atk).toBe(17);
    expect(parseItemPage(RED_POTION)!.slotType).toBeNull();
  });

  it('stops the description at the next section rather than at a character count', () => {
    // Each fixture is followed by a different section. A length-based cut would
    // truncate one of these and swallow part of another.
    expect(parseItemPage(MOLD_POWDER)!.description).toBe('Soft mold powder. Can be sold to the Collector.');
    expect(parseItemPage(KNIFE)!.description).toBe('Short dagger designed so anyone can use it with ease.');
    expect(parseItemPage(ORA_ORA)!.description).toBe('Item created to lure Thief Bug by imitating their behavior.');
  });

  it('returns null for a page that is not an item page', () => {
    // The crawler counts these rather than writing a row of nulls.
    expect(parseItemPage('RO ZERO DATABASE 404 not found')).toBeNull();
  });
});

import { toItemRow } from './import-rozerodb-items';

describe('toItemRow', () => {
  const knife = parseItemPage(KNIFE)!;
  const potion = parseItemPage(RED_POTION)!;
  const card = parseItemPage(
    '← Item Poring Card # 4001 Category Card Slot / type Armor ATK 0 DEF 0 Slots 0 Required level 0 Weight 1 Buy 20 Sell 10 Description LUK +2. Perfect Dodge +1. Equipped on : Armor Dropped by ( 6 )',
  )!;

  it('maps their category words onto the ones the filter already offers', () => {
    expect(toItemRow(potion).category).toBe('Consumable / Recovery');
    expect(toItemRow(knife).category).toBe('Weapon');
  });

  it('leaves an unmapped category as they wrote it rather than burying it in Other', () => {
    const odd = { ...potion, category: 'Shadow Gear' };
    expect(toItemRow(odd).category).toBe('Shadow Gear');
  });

  it('calls only a weapon slot a weapon type', () => {
    // A card's "Slot / type" is where it may be socketed. Copying it into
    // weapon_type would put Armor in the weapon filter.
    expect(toItemRow(knife).weapon_type).toBe('Dagger');
    expect(toItemRow(card).weapon_type).toBeNull();
    expect(toItemRow(potion).weapon_type).toBeNull();
  });

  it('leaves weapon level null rather than guessing it', () => {
    // weapon_level decides which refine table applies, so a guess would feed a
    // wrong ore and fee straight into the refine calculator.
    expect(toItemRow(knife).weapon_level).toBeNull();
  });

  it('takes no icon, because ours are mirrored and theirs are theirs', () => {
    expect(toItemRow(knife).icon_url).toBeNull();
  });

  it('carries prices across, including a genuine zero', () => {
    expect(toItemRow(knife).buy_price).toBe(0);
    expect(toItemRow(potion).buy_price).toBe(10);
  });
});
