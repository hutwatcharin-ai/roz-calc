// Which picture of a Novice wearing a costume belongs to an item (owner,
// 2 Oct 2026). The pictures are drawn ahead of time by
// scripts/build-costume-fit.py; a costume with no entry has no sprite the
// client lets us draw (auras, effect-only pieces) and simply shows none.

import fit from '@/data/costume-fit.json';

export interface FitSheet {
  /** One cell at 1x. Sheet: columns front, three-quarter, back; rows male, female. */
  w: number;
  h: number;
  garment: boolean;
  /** Head close-up cell size, when there is a head sheet (headgear only). */
  head?: number;
}

const items = fit.items as Record<string, string>;
const sheets = fit.sheets as Record<string, FitSheet>;

export function costumeFit(id: number): { src: string; headSrc: string | null; sheet: FitSheet } | null {
  const key = items[String(id)];
  const sheet = key ? sheets[key] : undefined;
  if (!key || !sheet) return null;
  return {
    src: `/images/costume-fit/${key}.webp`,
    headSrc: sheet.head ? `/images/costume-fit/${key}-head.webp` : null,
    sheet,
  };
}
