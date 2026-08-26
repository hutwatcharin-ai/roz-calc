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
  is_aggressive: boolean;
  is_mvp: boolean;
  loots_items: boolean;
  matk_min: number | null;
  matk_max: number | null;
  str: number | null;
  agi: number | null;
  vit: number | null;
  int_: number | null;
  dex: number | null;
  luk: number | null;
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
  description: string | null;
}

function toNumberOrNull(value: unknown): number | null {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    return Number.isNaN(n) ? null : n;
  }
  return null;
}

// specialStatus is an array of {raw, en} objects, not strings. The distinct raw
// values across all 524 monsters are: "", "Physically attackable", "Can move",
// "Loots items", "Aggressive", "MVP", "mini".
function hasSpecialStatus(raw: any, label: string): boolean {
  const list = raw?.ragnarokZero?.specialStatus;
  if (!Array.isArray(list)) return false;
  return list.some((s: any) => s?.raw === label);
}

export function transformMonster(raw: any): MonsterRow {
  const rz = raw.ragnarokZero;
  return {
    id: raw.id,
    name_en: raw.name,
    name_th: null,
    level: rz.level,
    element: rz.elementType ?? null,
    element_level: rz.elementLevel ?? null,
    race: rz.race ?? null,
    size: rz.size ?? null,
    // The raw feed uses "" and "???" as "unknown value" markers on numeric
    // fields (e.g. Tao Gunka id 1583 has hp "???", baseExp "", jobExp "").
    // Route every numeric field through toNumberOrNull so one bad row cannot
    // abort the whole batch upsert. NOT NULL columns fall back to 0.
    hp: toNumberOrNull(rz.hp) ?? 0,
    atk_min: toNumberOrNull(rz.atkMin),
    atk_max: toNumberOrNull(rz.atkMax),
    def: toNumberOrNull(rz.defense),
    mdef: toNumberOrNull(rz.magicDefense),
    flee: toNumberOrNull(rz.flee95),
    hit: toNumberOrNull(rz.hit100),
    base_exp: toNumberOrNull(rz.baseExp) ?? 0,
    job_exp: toNumberOrNull(rz.jobExp) ?? 0,
    image_url: raw.imageUrl ?? null,
    is_aggressive: hasSpecialStatus(raw, 'Aggressive'),
    is_mvp: hasSpecialStatus(raw, 'MVP'),
    loots_items: hasSpecialStatus(raw, 'Loots items'),
    matk_min: toNumberOrNull(rz.magicAtkMin),
    matk_max: toNumberOrNull(rz.magicAtkMax),
    // Absent baseStats stays null. Defaulting to 0 would render as a real stat
    // of zero on the monster page, which is a different claim than "unknown".
    str: toNumberOrNull(rz.baseStats?.str),
    agi: toNumberOrNull(rz.baseStats?.agi),
    vit: toNumberOrNull(rz.baseStats?.vit),
    int_: toNumberOrNull(rz.baseStats?.int),
    dex: toNumberOrNull(rz.baseStats?.dex),
    luk: toNumberOrNull(rz.baseStats?.luk),
  };
}

export function transformDrops(raw: any): DropRow[] {
  const drops = raw.ragnarokZero.drops ?? [];
  return drops
    .map((d: any) => ({
      monster_id: raw.id,
      item_id: d.itemId,
      rate: toNumberOrNull(d.rate),
    }))
    .filter((row: any): row is DropRow => row.rate !== null);
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
    // Stored as one string with newlines preserved; the item page renders it
    // with white-space: pre-line. An empty lines array becomes null, not "",
    // so "no description" is one value everywhere instead of two.
    description: raw.description?.lines?.length ? raw.description.lines.join('\n') : null,
  };
}

export interface SkillRow {
  slug: string;
  name: string;
  type: string | null;
  max_level: number | null;
  element: string | null;
  classes: string[];
  icon_url: string | null;
}

export function transformSkill(raw: any): SkillRow {
  return {
    slug: raw.slug,
    name: raw.name,
    type: raw.type ?? null,
    max_level: raw.max_level ?? null,
    element: raw.element ?? null,
    classes: raw.classes ?? [],
    icon_url: raw.icon ?? null,
  };
}

export interface MonsterSkillRow {
  monster_id: number;
  entry_index: number;
  skill_id: number;
  skill_name: string;
  skill_lv: number | null;
  rate: number | null;
  cast_time: number | null;
  delay: number | null;
  target: string | null;
  state: string | null;
}

// rate arrives as a percent string like "5.00%". Strip the sign and parse; an
// empty or unparseable rate becomes null rather than dropping the skill, since
// "this monster casts Poison" is useful even when the frequency is unknown.
function parsePercent(value: unknown): number | null {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return null;
  const trimmed = value.trim().replace(/%$/, '');
  if (trimmed === '') return null;
  const n = Number(trimmed);
  return Number.isNaN(n) ? null : n;
}

export function transformMonsterSkills(raw: any): MonsterSkillRow[] {
  const skills = raw?.ragnarokZero?.skills ?? [];
  const rows: MonsterSkillRow[] = [];

  for (let index = 0; index < skills.length; index++) {
    const s = skills[index];
    const skillId = toNumberOrNull(s?.skillId);
    const skillName = typeof s?.name === 'string' ? s.name.trim() : '';
    // Both skillId and skillName are required fields; a row missing either cannot be stored.
    if (skillId === null || skillName === '') continue;

    rows.push({
      monster_id: raw.id,
      entry_index: index,
      skill_id: skillId,
      skill_name: skillName,
      skill_lv: toNumberOrNull(s?.skillLv),
      rate: parsePercent(s?.rate),
      cast_time: toNumberOrNull(s?.castTime),
      delay: toNumberOrNull(s?.delay),
      target: typeof s?.target === 'string' && s.target !== '' ? s.target : null,
      state: typeof s?.state === 'string' && s.state !== '' ? s.state : null,
    });
  }

  return rows;
}
