import { describe, expect, it } from 'vitest';
import { ALL_NPCS, NPCS_WITH_SPRITE, NPC_META, NPCS_WITH_QUESTS, SHOP_NPCS, mapDisplayName, npcBySlug, npcMaps, npcsForQuest, questKey, shopNpcAt } from './npcs';

describe('the NPC list', () => {
  it('holds the whole crawl', () => {
    expect(ALL_NPCS.length).toBeGreaterThan(500);
    expect(NPCS_WITH_QUESTS).toBeGreaterThan(200);
  });

  it('places nearly every one of them', () => {
    // The Nuxt payload stores every field as an index into one array, so a
    // resolver that walks one hop too far turns a coordinate into whatever
    // object sits at that index -- an earlier read of this file produced an
    // NPC whose x was a language record. A number here is the proof it
    // resolved as a number.
    const placed = ALL_NPCS.filter((npc) => npc.map && typeof npc.x === 'number' && typeof npc.y === 'number');
    expect(placed.length).toBeGreaterThan(ALL_NPCS.length * 0.95);
    for (const npc of placed) {
      expect(Number.isInteger(npc.x), `${npc.name} x`).toBe(true);
      expect(npc.x, `${npc.name} x`).toBeLessThan(500);
    }
  });

  it('knows where the second job change is given', () => {
    const smith = ALL_NPCS.find((npc) => npc.name === 'Blacksmith Guildsman');
    expect(smith).toBeTruthy();
    expect(smith).toMatchObject({ map: 'geffen_in', x: 110, y: 170 });
    expect(smith!.quests.map((q) => q.name)).toContain('Second Job Change: Blacksmith');
  });

  it('separates a real name from a label that is not one', () => {
    // Three kinds of non-name reach this data and none of them may become a
    // page or a "คุยกับ" line: sprite labels ("1 M Innkeeper", "4 Cook"),
    // fragments of quest text the source filed as a name ("the building",
    // "that way", "for me"), and a row whose name is its own map's name.
    const named = ALL_NPCS.filter((npc) => npc.hasName);
    expect(named.length).toBeGreaterThan(400);
    expect(named.length).toBeLessThan(ALL_NPCS.length);
    for (const npc of named) {
      expect(npc.name, npc.slug).toMatch(/^[A-Z]/);
      expect(npc.name, npc.slug).not.toBe(npc.mapName);
    }
    for (const junk of ['the building', 'that way', 'for me', 'upstream']) {
      const row = ALL_NPCS.find((npc) => npc.name === junk);
      if (row) expect(row.hasName, junk).toBe(false);
    }
  });

  it('lists the people before the sprite labels', () => {
    // 514 rows, and the first page of the index must not be all "1 M ...".
    const firstUnnamed = ALL_NPCS.findIndex((npc) => !npc.hasName);
    const lastNamed = ALL_NPCS.map((npc) => npc.hasName).lastIndexOf(true);
    expect(lastNamed).toBeLessThan(firstUnnamed);
  });
});

describe('npcsForQuest', () => {
  it('names the giver of a quest our table has', () => {
    const givers = npcsForQuest('Are You Strong? - 3');
    expect(givers.map((n) => n.name)).toContain('Ann');
    expect(givers[0]).toMatchObject({ map: 'prt_fild05', x: 351, y: 220 });
  });

  it('matches through the apostrophe the source writes', () => {
    // Curly vs straight is the difference that would silently halve the
    // matches; the key strips both.
    expect(questKey('Ale’s Blessing')).toBe(questKey("Ale's Blessing"));
  });

  it('says nothing for a quest nobody in the crawl gives', () => {
    expect(npcsForQuest('a quest that does not exist')).toEqual([]);
    expect(npcsForQuest(null)).toEqual([]);
  });
});

describe('map names', () => {
  it('names the towns our own map index cannot', () => {
    // map_stats holds maps that have monsters, which is every field and no
    // town -- so before this the shop table could only print a code.
    expect(mapDisplayName('prt_in')).toBe('Inside Prontera');
    expect(mapDisplayName('xmas')).toBe('Lutie, the Snow Village');
    expect(mapDisplayName('geffen_in')).toBe('Inside Geffen');
  });

  it('returns null rather than echoing an unknown code', () => {
    expect(mapDisplayName('not_a_map')).toBeNull();
    expect(mapDisplayName(null)).toBeNull();
  });

  it('ranks the maps by how many NPCs stand on them', () => {
    const maps = npcMaps();
    expect(maps[0].count).toBeGreaterThanOrEqual(maps[1].count);
    // Nordfeld is Zero's own starting area, and it is the busiest -- which is
    // also the proof this data is Zero's and not classic RO's.
    expect(maps.slice(0, 3).map((m) => m.code)).toContain('nordfeld');
  });
});

describe('npcBySlug', () => {
  it('finds a page by its slug and misses cleanly', () => {
    const first = ALL_NPCS.find((npc) => npc.hasName)!;
    expect(npcBySlug(first.slug)?.name).toBe(first.name);
    expect(npcBySlug('nobody-here')).toBeNull();
  });
});

describe('the published data', () => {
  it('records where it came from', () => {
    expect(NPC_META.source).toBe('https://roz.prontera.info/npcs');
    expect(NPC_META.crawled).toBe('2026-09-03');
  });
});

describe('the shopkeepers', () => {
  it('carries the ones a shop row needs to link to', () => {
    // The two datasets share no name and no coordinate -- rAthena's Tool
    // Dealer is not in Zero's crawled NPC list -- so before these records a
    // shop row on an item page had nobody to point at.
    expect(SHOP_NPCS).toBeGreaterThan(100);
    const dealer = shopNpcAt('Chef Assistant', 'prontera', 156, 212);
    expect(dealer).toBeTruthy();
    expect(dealer!.source).toBe('rathena');
    expect(dealer!.sells.length).toBeGreaterThan(0);
    expect(dealer!.slug.startsWith('shop-')).toBe(true);
  });

  it('misses cleanly for a spot with no shop', () => {
    expect(shopNpcAt('Chef Assistant', 'prontera', 1, 1)).toBeNull();
  });

  it('keeps the three sources apart', () => {
    // Every claim on a page depends on which list the row came from: Zero's
    // own crawl, rAthena's shop scripts, or a client's town directory. Only
    // the first is Zero's, and only the second sells anything.
    for (const npc of ALL_NPCS) {
      expect(['prontera', 'rathena', 'client'], npc.slug).toContain(npc.source);
      if (npc.source === 'prontera') expect(npc.sells, npc.slug).toEqual([]);
      else expect(npc.quests, npc.slug).toEqual([]);
      if (npc.source === 'client') expect(npc.sells, npc.slug).toEqual([]);
    }
  });

  it('puts a Kafra on the map, which nothing else here could', () => {
    // rAthena's shop scripts do not list Kafra and the Zero crawl is quest
    // NPCs only; the client's town directory is the only source that knows.
    const kafra = ALL_NPCS.filter((npc) => npc.source === 'client' && npc.name.includes('Kafra'));
    expect(kafra.length).toBeGreaterThan(15);
    for (const npc of kafra) {
      expect(npc.map, npc.slug).toBeTruthy();
      expect(Number.isInteger(npc.x), npc.slug).toBe(true);
    }
  });

  it('never places a town fixture where a shopkeeper already stands', () => {
    const shops = new Set(ALL_NPCS.filter((npc) => npc.source === 'rathena').map((npc) => `${npc.map}|${npc.x}|${npc.y}`));
    for (const npc of ALL_NPCS.filter((n) => n.source === 'client')) {
      expect(shops.has(`${npc.map}|${npc.x}|${npc.y}`), npc.slug).toBe(false);
    }
  });
});

describe('sprites', () => {
  it('comes from all three sources, each by its own join', () => {
    // A quest NPC gets a sprite when a rozerodb page describes the same NPC
    // (same coordinates or the same quest); a shopkeeper because rAthena names
    // a sprite id that a client GRF turns into a file; a town fixture because
    // its role has a standard sprite.
    const quest = ALL_NPCS.filter((npc) => npc.sprite && npc.source === 'prontera');
    const shop = ALL_NPCS.filter((npc) => npc.sprite && npc.source === 'rathena');
    const town = ALL_NPCS.filter((npc) => npc.sprite && npc.source === 'client');
    expect(quest.length).toBeGreaterThan(30);
    expect(shop.length).toBeGreaterThan(80);
    expect(town.length).toBeGreaterThan(50);
    expect(NPCS_WITH_SPRITE).toBe(quest.length + shop.length + town.length);
  });

  it('gives every Kafra a picture', () => {
    // The complaint that started this: a Kafra page with no Kafra on it.
    for (const npc of ALL_NPCS.filter((n) => n.source === 'client' && n.name.includes('Kafra'))) {
      expect(npc.sprite, npc.slug).toBeTruthy();
    }
  });

  it('names a file that exists, extension included', async () => {
    // The two sources ship different formats -- mirrored GIFs and PNGs decoded
    // out of a .spr -- so the value carries its own extension and the page
    // must not append one.
    const fs = await import('node:fs');
    const files = new Set(fs.readdirSync('public/images/npcs'));
    for (const npc of ALL_NPCS) {
      if (!npc.sprite) continue;
      expect(npc.sprite, npc.name).toMatch(/\.(gif|png)$/);
      expect(files.has(npc.sprite), `${npc.name} -> ${npc.sprite}`).toBe(true);
    }
  });
});
