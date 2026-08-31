// The "เพิ่งดู" list: the last few monsters and items this browser opened.
//
// Recognition over recall -- a player checking drop rates opens the same
// monster page many times across a session, and re-finding it through search
// costs a query each time. This is per-browser convenience state, so it lives
// in localStorage like the character context does, and follows the same rules:
// storage is passed in (testable without a DOM), and a storage that throws --
// Safari private mode -- must degrade to "no list", never to a crash.

export interface RecentEntry {
  kind: 'monster' | 'item';
  id: number;
  name: string;
}

export const RECENT_STORAGE_KEY = 'roz-calc:recent';
export const RECENT_LIMIT = 8;

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function isEntry(value: unknown): value is RecentEntry {
  if (typeof value !== 'object' || value === null) return false;
  const e = value as Record<string, unknown>;
  return (
    (e.kind === 'monster' || e.kind === 'item') &&
    typeof e.id === 'number' &&
    Number.isFinite(e.id) &&
    typeof e.name === 'string' &&
    e.name.length > 0
  );
}

/** The stored list, newest first. A missing, corrupt, or throwing store reads as empty. */
export function readRecent(storage: StorageLike): RecentEntry[] {
  try {
    const raw = storage.getItem(RECENT_STORAGE_KEY);
    if (raw === null) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isEntry).slice(0, RECENT_LIMIT);
  } catch {
    return [];
  }
}

/**
 * Records a visit. Revisiting moves the entry to the front rather than
 * duplicating it; the list never grows past RECENT_LIMIT. Returns the new list
 * so a caller that renders it does not have to read back.
 */
export function addRecent(storage: StorageLike, entry: RecentEntry): RecentEntry[] {
  const rest = readRecent(storage).filter((e) => !(e.kind === entry.kind && e.id === entry.id));
  const next = [entry, ...rest].slice(0, RECENT_LIMIT);
  try {
    storage.setItem(RECENT_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Full or forbidden storage: the visit is simply not remembered.
  }
  return next;
}

export function hrefFor(entry: RecentEntry): string {
  return entry.kind === 'monster' ? `/database/monsters/${entry.id}` : `/database/items/${entry.id}`;
}
