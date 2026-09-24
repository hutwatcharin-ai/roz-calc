// Reverse index from an item id to the guide pages that feature it -- the
// other direction of a link that only ran one way: /guides/star-gear,
// /guides/woe and /guides/memorial-gear already link OUT to item detail pages,
// but none of those 1,800 pages linked back. Built offline by
// scripts/build-item-guide-refs.mjs into data/item-guide-refs.json (a static
// read here, not a query, so every item page pays nothing for it).

import file from '@/data/item-guide-refs.json';

export interface GuideRef {
  href: string;
  label: string;
}

const REFS = (file as unknown as { refs: Record<string, GuideRef[]> }).refs;

export function guideRefsFor(id: number): GuideRef[] {
  return REFS[String(id)] ?? [];
}
