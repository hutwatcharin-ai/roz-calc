// Random Options (server-rolled affixes) that equipment can carry.
//
// Source: roz.prontera.info's /random-options page, which resolves to
// https://roz.gnjoy.com.tw/Guide (confidence: "official") -- see
// docs/prontera-export/extract-random-options.mjs for how this JSON was
// pulled out of that page's own payload, and verified against the live page.
//
// Melee and Ranged lines are option-for-option identical (checked in the
// data, not just claimed by the source), so the only weapon split that
// matters is magic (MATK-scaling) vs everything else. Staff is the only
// magic weapon type this game has; Book, checked live against prontera's
// own resolver, is melee/physical like the rest.
import pools from './data/random-option-pools.json';

export type EquipScope = 'magic' | 'melee' | 'ranged' | 'armor' | 'robe' | 'shoes';

interface PoolEntry {
  option_key: string;
  label_en: string;
  value_min: number;
  value_max: number;
  needs_verification: boolean;
}
interface PoolLine {
  line_index: number;
  acquisition: 'guaranteed' | 'chance';
  equip_scope: EquipScope;
  entries: PoolEntry[];
}
interface Pool {
  pool_key: string;
  acquisition_channel: string;
  weapon_level: number | null;
  source_url: string;
  confidence: string;
  lines: PoolLine[];
}

const POOLS = (pools as { pools: Pool[] }).pools;

// Weapon types that scale off MATK. Confirmed live against prontera's own
// resolver on 3 Sep 2026 (Mighty Staff -> Magic Series); every other weapon
// type checked the same way came back Melee, including Book.
const MAGIC_WEAPON_TYPES = new Set(['One-handed Staff', 'Two-handed Staff']);

// items.weapon_type values for category="Armor", mapped to the pool's scope
// names. Headgear/Shield/Accessory have no line in pool_5 at all -- those
// slots don't roll random options in this game, not a gap in this data.
const ARMOR_SCOPE: Partial<Record<string, EquipScope>> = {
  Armor: 'armor',
  Garment: 'robe',
  Shoes: 'shoes',
};

export interface ResolvedPoolLine {
  poolKey: string;
  acquisitionChannel: string;
  lineIndex: number;
  acquisition: 'guaranteed' | 'chance';
  sourceUrl: string;
  confidence: string;
  entries: PoolEntry[];
}

/**
 * Monster-drop random options for one piece of equipment, or null if this
 * game doesn't roll options for its slot (Headgear/Shield/Accessory/Costume)
 * or the item is missing the field (weapon_level) this needs.
 */
export function randomOptionsFor(
  category: string | null,
  weaponType: string | null,
  weaponLevel: number | null,
): ResolvedPoolLine[] | null {
  let scope: EquipScope | null = null;
  let pool: Pool | undefined;

  if (category === 'Weapon') {
    if (weaponLevel === null) return null;
    scope = weaponType !== null && MAGIC_WEAPON_TYPES.has(weaponType) ? 'magic' : 'melee';
    pool = POOLS.find((p) => p.acquisition_channel === 'monster_drop' && p.weapon_level === weaponLevel);
  } else if (category === 'Armor') {
    scope = weaponType !== null ? (ARMOR_SCOPE[weaponType] ?? null) : null;
    if (!scope) return null;
    pool = POOLS.find((p) => p.acquisition_channel === 'monster_drop' && p.weapon_level === null && p.lines.some((l) => l.equip_scope === scope));
  } else {
    return null;
  }

  if (!pool || !scope) return null;

  return pool.lines
    .filter((l) => l.equip_scope === scope)
    .map((l) => ({
      poolKey: pool!.pool_key,
      acquisitionChannel: pool!.acquisition_channel,
      lineIndex: l.line_index,
      acquisition: l.acquisition,
      sourceUrl: pool!.source_url,
      confidence: pool!.confidence,
      entries: l.entries,
    }));
}
