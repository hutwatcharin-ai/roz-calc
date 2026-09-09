// The memorial-dungeon gear ladder, joined to the items table.
//
// Two halves, from two places, on purpose:
//
//   the stats  come from the game client, through our own items table. The
//              client's description carries the base stats, every per-refine
//              bonus and the set bonus -- more than any guide prints.
//   the shape  comes from data/memorial-gear.json: which piece upgrades into
//              which, what that costs, which four go together, and how
//              enchanting works. The client describes items one at a time and
//              can say none of that.
//
// Whether a rank is reachable is not an opinion either: it is the piece's own
// required_level against the server's level cap.

import file from '@/data/memorial-gear.json';
import { supabaseBrowser } from '@/lib/supabase';
import { fetchAllRows } from '@/lib/fetch-all-rows';
import { BASE_LEVEL_CAP } from '@/lib/level-cap';

/**
 * Re-exported so this page keeps its own name for the number while the number
 * itself lives in one place (lib/level-cap). Ranks III, II and I need 70, 80
 * and 90, so the cap decides what the page shows as reachable.
 */
export const LEVEL_CAP = BASE_LEVEL_CAP;

export interface GearPiece {
  id: number | null;
  name: string;
  icon: string | null;
  /** The client's own text, with its trailing DEF line dropped. */
  effect: string | null;
  level: number | null;
  slots: number | null;
}

export interface GearSet {
  rank: string;
  role: string;
  pieces: GearPiece[];
}

export interface GearRank {
  rank: string;
  name: string;
  level: number;
  from: string;
  crystal: string | null;
  crystalAmount: number;
  /** Wearable at the current cap. */
  open: boolean;
  sets: GearSet[];
}

type Meta = { _meta: Record<string, string> };
type Raw = Meta & {
  ranks: { rank: string; name: string; level: number; from: string; crystal: string | null; crystalAmount: number }[];
  sets: { rank: string; role: string; pieces: string[] }[];
  stoneFor: Record<string, { stone: string; amount: number }[]>;
  stoneFromFragment: { stone: string; fragment: string; amount: number }[];
  accessories: { name: string; side: string; materials: { item: string; amount: number }[]; dungeon: string | null }[];
  enchantRules: {
    costs: { action: string; cost: string; destroyChance: string }[];
    slotByRank: { rank: string; piece: string; slot: number | null }[];
    outcomes: EnchantOutcome[];
  };
};

export interface EnchantOutcome {
  stat: string;
  value: string;
  /** Percent, or null when the slot has no such roll at all. Never 0: a rate
   *  of zero would read as "cannot happen", which is a different claim. */
  armor: number | null;
  garment: number | null;
  shoes: number | null;
}

export const memorialGear = file as unknown as Raw;

/** The client appends "DEF : 46" to armour text; the site shows DEF from the
 *  stat line already, and the trailing fragment reads as noise mid-sentence. */
function cleanEffect(description: string | null): string | null {
  if (!description) return null;
  return description.replace(/\s*DEF\s*:\s*\d+\s*$/, '').trim() || null;
}

function key(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Every piece and every material the page names, looked up once.
 *
 * Matched on name because that is the only join the guide gives us -- it has
 * no ids. A name that finds nothing comes back with `id: null` and renders
 * without a link rather than silently disappearing, so a rename upstream is
 * visible on the page instead of quietly shrinking it.
 */
export async function loadMemorialGear(): Promise<{ ranks: GearRank[]; items: Map<string, GearPiece>; failed: boolean }> {
  const db = supabaseBrowser();
  const { data, error } = await fetchAllRows<{
    id: number;
    name_en: string;
    icon_url: string | null;
    description: string | null;
    required_level: number | null;
    slots: number | null;
  }>((from, to) =>
    db
      .from('items')
      .select('id, name_en, icon_url, description, required_level, slots')
      .order('id')
      .range(from, to),
  );
  if (error) console.error('memorial gear item lookup failed', error);

  const byName = new Map<string, GearPiece>();
  for (const row of data ?? []) {
    byName.set(key(row.name_en), {
      id: row.id,
      name: row.name_en,
      icon: row.icon_url,
      effect: cleanEffect(row.description),
      level: row.required_level,
      slots: row.slots,
    });
  }

  const piece = (name: string): GearPiece =>
    byName.get(key(name)) ?? { id: null, name, icon: null, effect: null, level: null, slots: null };

  const ranks: GearRank[] = memorialGear.ranks.map((r) => ({
    ...r,
    open: r.level <= LEVEL_CAP,
    sets: memorialGear.sets
      .filter((s) => s.rank === r.rank)
      .map((s) => ({ rank: s.rank, role: s.role, pieces: s.pieces.map(piece) })),
  }));

  return { ranks, items: byName, failed: !!error };
}

/** Look one material up by name, for the recipe tables. */
export function lookup(items: Map<string, GearPiece>, name: string): GearPiece {
  return items.get(key(name)) ?? { id: null, name, icon: null, effect: null, level: null, slots: null };
}
