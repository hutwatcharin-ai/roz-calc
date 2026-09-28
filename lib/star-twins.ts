// Ordinary item id -> the first-tier ★ piece made from it, so an ordinary
// item's page can say "this one can be awakened" and link to the ★ page.
// Built from data/star-droppers.json (scripts/build-star-droppers.mjs), which
// already resolved the five pieces whose ordinary twin has another name.

import file from '@/data/star-droppers.json';

export type StarTwin = { starId: number; starName: string };

const BY_PLAIN = new Map<number, StarTwin>();
for (const [starId, row] of Object.entries(file.pieces as Record<string, { star: string; plainIds: number[] }>)) {
  for (const id of row.plainIds) BY_PLAIN.set(id, { starId: Number(starId), starName: row.star });
}

export function starTwinOf(plainId: number): StarTwin | null {
  return BY_PLAIN.get(plainId) ?? null;
}
