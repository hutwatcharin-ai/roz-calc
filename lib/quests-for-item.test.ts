import { describe, expect, it } from 'vitest';
import { referencesItem } from './quests-for-item';

describe('referencesItem', () => {
  it('matches the reference the quest text actually writes', () => {
    expect(referencesItem('Bring me [Hard Horn]947 from the fields.', 947)).toBe(true);
    expect(referencesItem('เอา [Hard Horn]947 มาให้หน่อย', 947)).toBe(true);
  });

  it('does not let a longer id pass as a shorter one', () => {
    // The SQL prefilter is `%]947%`, which "[Something]9470" satisfies. This
    // is the check that keeps that row off item 947's page.
    expect(referencesItem('Bring me [Something]9470.', 947)).toBe(false);
    expect(referencesItem('Bring me [Something]1947.', 947)).toBe(false);
  });

  it('needs the bracketed name in front of the id', () => {
    // A bare number in prose is a quantity, not an item reference.
    expect(referencesItem('Collect 947 zeny.', 947)).toBe(false);
  });

  it('says no for text that is not there', () => {
    expect(referencesItem(null, 947)).toBe(false);
    expect(referencesItem(undefined, 947)).toBe(false);
    expect(referencesItem('', 947)).toBe(false);
  });
});
