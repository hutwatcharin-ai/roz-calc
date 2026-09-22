import { describe, expect, it } from 'vitest';
import file from '@/data/item-former-names.json';
import game from '@/data/game-items.json';
import { itemFormerNameIdsFor, itemFormerNames, itemNamesOf } from './item-former-names';
import { cardRelease } from './card-availability';

const former = (file as unknown as { items: Record<string, { name: string }[]> }).items;
const gameItems = (game as unknown as { items: Record<string, { name: string }> }).items;

describe('item former names', () => {
  it('keeps the old name of a renamed item findable', () => {
    const [id] = Object.entries(former).find(([, names]) => names.some((n) => n.name === 'Orc Trophy'))!;
    expect(itemFormerNameIdsFor('orc trophy')).toContain(Number(id));
    expect(itemNamesOf({ id: Number(id), name_en: 'Horro of Tribe' })).toEqual(['Horro of Tribe', 'Orc Trophy']);
  });

  it('keeps every renamed card\'s release date under its game name', () => {
    // cardRelease's table was written against the old names. A renamed card
    // that was unreleased must stay unreleased after the rename.
    for (const [id, names] of Object.entries(former)) {
      const oldRelease = names.map((n) => cardRelease(n.name)).find(Boolean);
      if (!oldRelease) continue;
      const newName = gameItems[id]?.name ?? names[0].name;
      expect(cardRelease(newName, Number(id)), `${names[0].name} -> ${newName}`).toEqual(oldRelease);
    }
  });

  it('answers nothing for an item that was never renamed', () => {
    expect(itemFormerNames(4035)).toEqual([]); // Hydra Card
  });
});
