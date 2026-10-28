// Which head layers a headgear takes -- upper, mid, lower -- for the equipment
// page's position filter (owner, 28 Oct 2026). Built by
// scripts/build-headgear-slots.mjs from the dress room's client index, with
// rAthena's Locations for hats the dress room does not draw; where both know
// a hat they agree on all 152. Zero-only hats neither source knows have no
// entry and show only under "every position".

import file from '@/data/headgear-slots.json';

export type HeadLayer = 'u' | 'm' | 'l';

export const HEAD_LAYERS: readonly HeadLayer[] = ['u', 'm', 'l'];

export const HEAD_LAYER_TH: Record<HeadLayer, string> = { u: 'หัวบน', m: 'หัวกลาง', l: 'หัวล่าง' };

const SLOTS = (file as { slots: Record<string, string> }).slots;

export function isHeadLayer(value: string | undefined): value is HeadLayer {
  return value === 'u' || value === 'm' || value === 'l';
}

/** The layers this headgear takes; empty when no source knows. A hat over two layers counts in both. */
export function headLayers(id: number): HeadLayer[] {
  return [...(SLOTS[String(id)] ?? '')].filter(isHeadLayer);
}
