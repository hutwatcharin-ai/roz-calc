// Zero's NPCs.
//
// Built by scripts/build-npcs.mjs from the 3 Sep 2026 prontera.info crawl.
// Two things this unlocks that nothing else on the site could do:
//
//   the person a quest sends you to. The quest table carries a map and a
//   coordinate and no name, so a quest card said "go to prt_fild05 351,220"
//   and stopped. 402 quest links here put a name on 202 of our quests.
//
//   the name of a town. Our map index only holds maps that have monsters in
//   them, which is every field and dungeon and no town at all -- so the shop
//   table could print /navi prt_in and nothing more. This file names 112 map
//   codes, towns included.
//
// What it is not: complete. 74 of the 514 carry a label the source derived
// from a sprite ("1 M Innkeeper") because it has no name for them either, and
// 151 of the 402 quest links name a quest our own table does not have yet --
// Second Job Change, Critura Academy, Comodo Plague. Both gaps are visible in
// the data rather than papered over.

import file from '@/data/npcs.json';

export interface NpcQuestLink {
  slug: string | null;
  name: string;
  type: string | null;
}

export interface Npc {
  slug: string;
  name: string;
  /** False when the source only had a sprite label, not a name in the game. */
  hasName: boolean;
  types: string[];
  /**
   * Where the record comes from, and it changes what may be claimed:
   * 'prontera' is Zero's own NPC list, 'rathena' is a shopkeeper from the
   * classic scripts, placed where classic RO puts them.
   */
  source: 'prontera' | 'rathena';
  /** Map code, which is what /navi takes. */
  map: string | null;
  mapName: string | null;
  x: number | null;
  y: number | null;
  quests: NpcQuestLink[];
  /** Item ids this NPC sells, for the shopkeepers. */
  sells: number[];
  /** File name under public/images/npcs, when a sprite could be matched. */
  sprite: string | null;
  description: string | null;
}

const data = file as unknown as { _meta: Record<string, unknown>; mapNames: Record<string, string>; npcs: Npc[] };

export const ALL_NPCS: Npc[] = data.npcs;
export const NPC_MAP_NAMES: Record<string, string> = data.mapNames;

const bySlug = new Map(ALL_NPCS.map((npc) => [npc.slug, npc]));

export function npcBySlug(slug: string): Npc | null {
  return bySlug.get(slug) ?? null;
}

/** The town or field a map code belongs to, or null when nothing names it. */
export function mapDisplayName(code: string | null | undefined): string | null {
  if (!code) return null;
  return NPC_MAP_NAMES[code] ?? null;
}

/**
 * Quest names are matched on text because the source has no id for them: it
 * carries its own slug, and our quests carry the game's id. Curly and straight
 * apostrophes both occur ("Ale's Blessing" vs "Ale’s Blessing"), so the key
 * strips everything that is not a letter or a digit.
 */
export function questKey(name: string): string {
  return name.toLowerCase().replace(/[‘’']/g, "'").replace(/[^a-z0-9]+/g, ' ').trim();
}

const byQuest = new Map<string, Npc[]>();
for (const npc of ALL_NPCS) {
  for (const quest of npc.quests) {
    const key = questKey(quest.name);
    const list = byQuest.get(key);
    if (list) list.push(npc);
    else byQuest.set(key, [npc]);
  }
}

/** Who gives this quest, by the quest's English name. Empty when unknown. */
export function npcsForQuest(questName: string | null | undefined): Npc[] {
  if (!questName) return [];
  return byQuest.get(questKey(questName)) ?? [];
}

/** Every map that has at least one NPC on it, most crowded first. */
export function npcMaps(): { code: string; name: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const npc of ALL_NPCS) {
    if (!npc.map) continue;
    counts.set(npc.map, (counts.get(npc.map) ?? 0) + 1);
  }
  return [...counts]
    .map(([code, count]) => ({ code, name: NPC_MAP_NAMES[code] ?? code, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

/** The shopkeeper standing at a spot, so a shop row can link to their page. */
const byPlace = new Map(
  ALL_NPCS.filter((npc) => npc.source === 'rathena').map((npc) => [`${npc.name}|${npc.map}|${npc.x}|${npc.y}`, npc]),
);

export function shopNpcAt(name: string, map: string | null, x: number | null, y: number | null): Npc | null {
  return byPlace.get(`${name}|${map}|${x}|${y}`) ?? null;
}

export const NPCS_WITH_QUESTS = ALL_NPCS.filter((npc) => npc.quests.length > 0).length;
export const SHOP_NPCS = ALL_NPCS.filter((npc) => npc.source === 'rathena').length;
export const NPCS_WITH_SPRITE = ALL_NPCS.filter((npc) => npc.sprite).length;
export const NPC_META = data._meta;
