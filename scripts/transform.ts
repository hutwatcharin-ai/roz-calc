import { parseItemDescription } from '../lib/parse-item-text';

export interface MonsterRow {
  id: number;
  name_en: string;
  name_th: string | null;
  level: number;
  element: string | null;
  element_level: number | null;
  race: string | null;
  size: string | null;
  hp: number;
  atk_min: number | null;
  atk_max: number | null;
  def: number | null;
  mdef: number | null;
  flee: number | null;
  hit: number | null;
  base_exp: number;
  job_exp: number;
  image_url: string | null;
}

export interface DropRow {
  monster_id: number;
  item_id: number;
  rate: number;
}

export interface SpawnRow {
  monster_id: number;
  map_code: string;
  map_display_name: string | null;
}

export interface ItemRow {
  id: number;
  name_en: string;
  name_th: string | null;
  category: string | null;
  weapon_type: string | null;
  atk: number | null;
  required_level: number | null;
  weapon_level: number | null;
  equippable_classes: string[];
  buy_price: number | null;
  sell_price: number | null;
  icon_url: string | null;
}

function toNumberOrNull(value: unknown): number | null {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    return Number.isNaN(n) ? null : n;
  }
  return null;
}

export function transformMonster(raw: any): MonsterRow {
  const rz = raw.ragnarokZero;
  return {
    id: raw.id,
    name_en: raw.name,
    name_th: null,
    level: rz.level,
    element: rz.element ?? null,
    element_level: rz.elementLevel ?? null,
    race: rz.race ?? null,
    size: rz.size ?? null,
    hp: rz.hp,
    atk_min: rz.atkMin ?? null,
    atk_max: rz.atkMax ?? null,
    def: rz.defense ?? null,
    mdef: rz.magicDefense ?? null,
    flee: rz.flee95 ?? null,
    hit: rz.hit100 ?? null,
    base_exp: rz.baseExp ?? 0,
    job_exp: rz.jobExp ?? 0,
    image_url: raw.imageUrl ?? null,
  };
}

export function transformDrops(raw: any): DropRow[] {
  const drops = raw.ragnarokZero.drops ?? [];
  return drops.map((d: any) => ({
    monster_id: raw.id,
    item_id: d.itemId,
    rate: d.rate,
  }));
}

export function transformSpawns(raw: any): SpawnRow[] {
  const spawns = raw.ragnarokZero.spawns ?? [];
  return spawns.map((s: any) => ({
    monster_id: raw.id,
    map_code: s.mapName,
    map_display_name: s.description ?? null,
  }));
}

export function transformItem(raw: any): ItemRow {
  const parsed = parseItemDescription(raw.description?.lines ?? []);
  return {
    id: raw.id,
    name_en: raw.displayName,
    name_th: null,
    category: raw.category ?? null,
    weapon_type: parsed.weaponType,
    atk: parsed.atk,
    required_level: parsed.requiredLevel,
    weapon_level: parsed.weaponLevel,
    equippable_classes: parsed.equippableClasses,
    buy_price: toNumberOrNull(raw.attributes?.buyPrice),
    sell_price: toNumberOrNull(raw.attributes?.sellPrice),
    icon_url: raw.iconUrl ?? null,
  };
}
