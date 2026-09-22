// The live game client's own item table: names, Thai descriptions, slots.
//
// Built by scripts/build-game-items.py from the client's System folder (see
// its header for the source). Read from disk on first use rather than
// imported, so 2 MB of JSON never lands in a bundle; server components only.
//
// Two things hang off it:
// - the Thai description a player reads in game, shown ahead of our own
//   line-by-line translation;
// - whether an item exists in the game at all. The client cannot show an item
//   it has no entry for, so an id missing here is not in the current game --
//   typically a row our sources carried over from another server.
import fs from 'node:fs';
import path from 'node:path';

export interface GameItem {
  name: string;
  desc: string[];
  slots: number | null;
  costume: boolean;
}

interface GameItemsFile {
  _meta: { source: string; built: string; items: number };
  items: Record<string, GameItem>;
}

let cache: GameItemsFile | null | undefined;

function load(): GameItemsFile | null {
  if (cache !== undefined) return cache;
  try {
    cache = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'game-items.json'), 'utf8'));
  } catch {
    // No table on disk: say nothing rather than call every item missing.
    cache = null;
  }
  return cache ?? null;
}

export function gameItem(id: number): GameItem | null {
  return load()?.items[String(id)] ?? null;
}

/** Thai description lines as the client shows them, codes kept; null if none has Thai. */
export function gameThaiDescription(id: number): string[] | null {
  const item = gameItem(id);
  if (!item || !item.desc.some((line) => /[฀-๿]/.test(line))) return null;
  return item.desc;
}

/**
 * true / false once the table is loaded; null when there is no table, so a
 * missing file never reads as "nothing is in the game".
 */
export function isInGame(id: number): boolean | null {
  const file = load();
  if (!file) return null;
  return String(id) in file.items;
}

export function gameItemsBuilt(): string | null {
  return load()?._meta.built ?? null;
}
