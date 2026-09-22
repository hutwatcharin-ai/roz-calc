import type { ClassGuide } from './types';
import { swordsman } from './swordsman';
import { knight } from './knight';
import { crusader } from './crusader';
import { mage } from './mage';
import { wizard } from './wizard';
import { sage } from './sage';
import { archer } from './archer';
import { hunter } from './hunter';
import { bard } from './bard';
import { dancer } from './dancer';
import { acolyte } from './acolyte';
import { priest } from './priest';
import { monk } from './monk';
import { thief } from './thief';
import { assassin } from './assassin';
import { rogue } from './rogue';
import { merchant } from './merchant';
import { blacksmith } from './blacksmith';
import { alchemist } from './alchemist';

// Family order: each 1st job followed by its 2nd jobs, the order the index
// page and the "same family" links read in.
export const CLASS_GUIDES: ClassGuide[] = [
  swordsman, knight, crusader,
  mage, wizard, sage,
  archer, hunter, bard, dancer,
  acolyte, priest, monk,
  thief, assassin, rogue,
  merchant, blacksmith, alchemist,
];

export function classGuide(slug: string): ClassGuide | null {
  return CLASS_GUIDES.find((guide) => guide.slug === slug) ?? null;
}

/** YouTube link that opens at the cited second, or the plain URL. */
export function citeHref(url: string, at?: string): string {
  if (!url) return '';
  if (!at || !url.includes('youtube.com/watch')) return url;
  const [m, s] = at.split(':').map(Number);
  return `${url}&t=${m * 60 + s}s`;
}
