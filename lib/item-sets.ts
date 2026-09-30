// Reading side of data/item-sets.json (scripts/build-item-sets.mjs).

import file from '@/data/item-sets.json';

export type SetKind = 'gear' | 'card' | 'stone' | 'pet';
export interface SetPiece { id: number; name: string; category: string; icon: string }
export interface ItemSet { name: string; kind: SetKind; pieces: SetPiece[]; bonus: string; sources: string[] }

export const ITEM_SETS = (file as unknown as { sets: ItemSet[] }).sets;

export const SET_KINDS: { kind: SetKind; label: string }[] = [
  { kind: 'gear', label: 'เซ็ตอุปกรณ์' },
  { kind: 'card', label: 'การ์ดคู่' },
  { kind: 'pet', label: 'การ์ดคู่ไข่สัตว์เลี้ยง' },
  { kind: 'stone', label: 'เซ็ตหินคอสตูม' },
];

const byPiece = new Map<number, ItemSet[]>();
for (const set of ITEM_SETS) {
  for (const p of set.pieces) byPiece.set(p.id, [...(byPiece.get(p.id) ?? []), set]);
}

/** Every set that has this item as a piece. */
export function setsOf(itemId: number): ItemSet[] {
  return byPiece.get(itemId) ?? [];
}

/** A stable anchor id for a set on /guides/item-sets. */
export function setAnchor(set: ItemSet): string {
  return 'set-' + set.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
