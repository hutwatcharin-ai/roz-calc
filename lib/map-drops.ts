// What a map is worth farming for: the cards and gear its ordinary monsters drop.
//
// Two groups only, by the owner's call (22 Sep 2026). A "sells well" group was
// dropped because ranking it honestly needs how many of each monster stand on
// the map, and cards and gear read the same whatever the headcount.
//
// Bosses are left out entirely -- MVPs and solo spawns (a monster no spawn
// point anywhere holds more than one of: mini-bosses and set pieces). One MVP
// carries a whole table of good drops and would crowd out what a player
// standing on the map actually kills; its own page lists them. Same test the
// farm planner uses (farm-engine `solo`), so the two pages agree on who is a boss.
//
// Challenge clones stay out as well: they are hidden on the map page until the
// player opts in, and their drops would appear to belong to the plain map.
import { cardRelease } from '@/lib/card-availability';
import { isCVariant } from '@/lib/c-variant';
import { isAbsentFromGame } from '@/lib/game-absent';
import { CARD_CATEGORY, GEAR_CATEGORIES } from '@/lib/item-href';

export const DROPS_PER_GROUP = 6;

export interface MapDropMonster {
  id: number;
  name_en: string;
  is_mvp: boolean;
  /** Largest count at any spawn point anywhere; null when no count is known. */
  largestSpawn: number | null;
}

export interface MapDropRow {
  monster_id: number;
  rate: number | null;
  items: { id: number; name_en: string; icon_url: string | null; category: string | null } | null;
}

export interface NotableDrop {
  itemId: number;
  name: string;
  icon: string | null;
  category: string;
  /** The source with the best rate; the one worth naming. */
  monsterId: number;
  monsterName: string;
  rate: number | null;
  /** How many ordinary monsters on this map drop it, the named one included. */
  sources: number;
}

export interface NotableDrops {
  cards: NotableDrop[];
  gear: NotableDrop[];
  /** Boss monsters on the map whose drops were left out, for a link each. */
  bosses: { id: number; name: string }[];
}

export function isBoss(monster: MapDropMonster): boolean {
  return monster.is_mvp || (monster.largestSpawn !== null && monster.largestSpawn <= 1);
}

// A known rate beats an unknown one, then higher wins, then the name decides
// so the order never shuffles between builds.
function better(a: NotableDrop, b: NotableDrop): number {
  if ((a.rate === null) !== (b.rate === null)) return a.rate === null ? 1 : -1;
  if (a.rate !== b.rate) return (b.rate ?? 0) - (a.rate ?? 0);
  return a.name.localeCompare(b.name);
}

export function notableDrops(monsters: MapDropMonster[], drops: MapDropRow[]): NotableDrops {
  const ordinary = new Map<number, MapDropMonster>();
  const bosses: { id: number; name: string }[] = [];
  for (const monster of monsters) {
    if (isCVariant(monster.name_en)) continue;
    if (isBoss(monster)) bosses.push({ id: monster.id, name: monster.name_en });
    else ordinary.set(monster.id, monster);
  }

  const byItem = new Map<number, NotableDrop>();
  for (const drop of drops) {
    const monster = ordinary.get(drop.monster_id);
    const item = drop.items;
    if (!monster || !item?.category) continue;
    const isCard = item.category === CARD_CATEGORY;
    const isGear = (GEAR_CATEGORIES as readonly string[]).includes(item.category);
    if (!isCard && !isGear) continue;
    // Not in the live client, so not farmable here whatever the drop table says.
    if (isAbsentFromGame(item.id)) continue;
    // A card the game has not released yet cannot be farmed, whatever the table says.
    if (isCard && cardRelease(item.name_en, item.id) !== null) continue;

    const candidate: NotableDrop = {
      itemId: item.id,
      name: item.name_en,
      icon: item.icon_url,
      category: item.category,
      monsterId: monster.id,
      monsterName: monster.name_en,
      rate: drop.rate,
      sources: 1,
    };
    const held = byItem.get(item.id);
    if (!held) byItem.set(item.id, candidate);
    else if (better(candidate, held) < 0) byItem.set(item.id, { ...candidate, sources: held.sources + 1 });
    else held.sources += 1;
  }

  const all = [...byItem.values()].sort(better);
  return {
    cards: all.filter((d) => d.category === CARD_CATEGORY).slice(0, DROPS_PER_GROUP),
    gear: all.filter((d) => d.category !== CARD_CATEGORY).slice(0, DROPS_PER_GROUP),
    bosses: bosses.sort((a, b) => a.name.localeCompare(b.name)),
  };
}
