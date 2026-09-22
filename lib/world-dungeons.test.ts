import { describe, expect, it } from 'vitest';
import { dungeonName, dungeonsByTile, type MapLinksFile } from './world-dungeons';

// A small world: a field next to a town, the town's ruin, a pyramid with a
// lobby between 1F and its basement, a channel copy, and a town warp NPC that
// reaches another town's dungeon.
const file: MapLinksFile = {
  links: [
    ['moc_fild19', 71, 170, 'moc_ruins', 200],
    ['moc_ruins', 54, 161, 'moc_pryd01', 200],
    ['moc_ruins', 71, 19, 'moc_fild19', 200],
    ['moc_pryd01', 10, 195, 'moc_pryd02', 200],
    ['moc_pryd01', 90, 109, 'moc_prydb1', 200],
    ['moc_prydb1', 100, 55, 'moc_pryd05', 200],
    ['moc_pryd01', 182, 18, 'pry_d01_a', 201],
    ['moc_fild19', 5, 5, 'morocc', 200],
    ['morocc', 10, 10, 'geffen', 201],
    ['geffen', 120, 114, 'gef_tower', 200],
    // A town opens onto its fields, which is what makes it a town and not a
    // dead-end lobby a warp NPC may lead into.
    ['geffen', 2, 2, 'gef_fild00', 200],
    ['gef_tower', 153, 28, 'gef_dun00', 200],
    ['alde_dun01', 302, 25, 'c_tower1', 200],
    ['alde_dun01', 1, 1, 'aldebaran', 200],
    ['aldebaran', 5, 5, 'gef_tower', 200],
  ],
  channelOf: { pry_d01_a: 'moc_pryd01' },
};
const tiles = new Set(['moc_fild19', 'alde_dun01', 'gef_fild00']);
const withMonsters = new Set(['moc_fild19', 'moc_pryd01', 'moc_pryd02', 'moc_pryd05', 'pry_d01_a', 'gef_dun00', 'c_tower1', 'alde_dun01']);

describe('dungeonsByTile', () => {
  const result = dungeonsByTile(file, tiles, withMonsters);

  it('finds a dungeon behind a town ruin, with the portal into it as the entrance', () => {
    const [pyramid] = result.get('moc_fild19')!;
    expect(pyramid.entrance).toEqual({ map: 'moc_ruins', x: 54, y: 161 });
  });

  it('lists every floor, through a lobby with no monsters, in code order', () => {
    const [pyramid] = result.get('moc_fild19')!;
    expect(pyramid.floors.map((f) => f.code)).toEqual(['moc_pryd01', 'moc_pryd02', 'moc_pryd05']);
  });

  it('folds a channel copy into its floor instead of listing it apart', () => {
    const [pyramid] = result.get('moc_fild19')!;
    expect(pyramid.floors[0].channels).toEqual(['pry_d01_a']);
  });

  it('does not ride a town warp NPC into another town\'s dungeon', () => {
    const codes = result.get('moc_fild19')!.flatMap((d) => d.floors.map((f) => f.code));
    expect(codes).not.toContain('gef_dun00');
  });

  it('gives a tile that is a dungeon floor only its direct warps, not its town', () => {
    const codes = result.get('alde_dun01')!.flatMap((d) => d.floors.map((f) => f.code));
    expect(codes).toEqual(['c_tower1']);
  });
});

describe('dungeonName', () => {
  it('drops the floor marker', () => {
    expect(dungeonName('Morroc Pyramid 1F')).toBe('Morroc Pyramid');
    expect(dungeonName('Payon Cave B1F')).toBe('Payon Cave');
    expect(dungeonName('Glast Heim')).toBe('Glast Heim');
  });
});

describe('the way in', () => {
  it('records the maps walked through before the first floor', () => {
    const [pyramid] = dungeonsByTile(file, tiles, withMonsters).get('moc_fild19')!;
    expect(pyramid.via).toEqual(['moc_ruins']);
  });
});
