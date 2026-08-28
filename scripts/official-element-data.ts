// The element damage table as Ragnarok Zero's own guide publishes it.
//
// Source: the official site's game guide, ระบบพิเศษ > ระบบธาตุ. Transcribed by
// hand from the page, then checked cell by cell against rAthena's Renewal
// table (scripts/compare-element-tables.ts): 399 of 400 cells agree, which is
// what makes a hand transcription trustworthy here -- a slip of the eye would
// have shown up as a spray of differences, not a single one.
//
// The page lays the grid out DEFENDER-major (rows = ผู้ถูกโจมตี, columns =
// ผู้โจมตี), the transpose of rAthena's. It is kept in that shape so it can be
// re-checked against the page directly; the generator transposes it.

import type { Element, ElementLevel } from '../lib/element-table';

// Column order on the official page. It prints "Ninja Aura" where every other
// source writes Ghost; that row and column match rAthena's Ghost at all four
// levels, so it is Ghost under another name. The site keeps "Ghost", which is
// what the monsters table and the game's own element field use.
export const OFFICIAL_COLUMNS: Element[] = [
  'Neutral', 'Water', 'Earth', 'Fire', 'Wind', 'Poison', 'Holy', 'Shadow', 'Ghost', 'Undead',
];

// [level][defender][index into OFFICIAL_COLUMNS] -- percentages exactly as
// printed. 100 means unchanged, 0 means the hit does nothing.
//
// KNOWN DISAGREEMENT with rAthena, kept as the official page has it: at
// attribute level 2, Undead attacking Poison reads 75 where rAthena says 50.
// rAthena runs 75 / 50 / 25 / 0 across the four levels; the official page
// prints 75 / 75 / 25 / 0, and its level-2 Poison row is identical to its
// level-1 row. That is either a real Zero value or a copy-paste slip on their
// page. This site follows the official number because it is the official
// number, and says so rather than quietly picking the tidier one.
export const OFFICIAL_ELEMENT_TABLE: Record<ElementLevel, Record<Element, number[]>> = {
  1: {
    Neutral: [100, 100, 100, 100, 100, 100, 100, 100, 90, 100],
    Water: [100, 25, 100, 90, 150, 150, 100, 100, 100, 100],
    Earth: [100, 100, 25, 150, 90, 150, 100, 100, 100, 100],
    Fire: [100, 150, 90, 25, 100, 150, 100, 100, 100, 90],
    Wind: [100, 90, 150, 100, 25, 150, 100, 100, 100, 100],
    Poison: [100, 150, 150, 150, 150, 0, 75, 75, 75, 75],
    Holy: [100, 100, 100, 100, 100, 75, 0, 125, 90, 125],
    Shadow: [100, 100, 100, 100, 100, 75, 125, 0, 90, 0],
    Ghost: [90, 100, 100, 100, 100, 75, 100, 100, 125, 100],
    Undead: [100, 100, 100, 125, 100, 75, 125, 0, 100, 0],
  },
  2: {
    Neutral: [100, 100, 100, 100, 100, 100, 100, 100, 70, 100],
    Water: [100, 0, 100, 80, 175, 150, 100, 100, 100, 100],
    Earth: [100, 100, 0, 175, 80, 150, 100, 100, 100, 100],
    Fire: [100, 175, 80, 0, 100, 150, 100, 100, 100, 80],
    Wind: [100, 80, 175, 100, 0, 150, 100, 100, 100, 100],
    Poison: [100, 150, 150, 150, 150, 0, 75, 75, 75, 75],
    Holy: [100, 100, 100, 100, 100, 75, 0, 150, 80, 150],
    Shadow: [100, 100, 100, 100, 100, 75, 150, 0, 80, 0],
    Ghost: [70, 100, 100, 100, 100, 75, 100, 100, 150, 125],
    Undead: [100, 100, 100, 150, 100, 50, 150, 0, 125, 0],
  },
  3: {
    Neutral: [100, 100, 100, 100, 100, 100, 100, 100, 50, 100],
    Water: [100, 0, 100, 70, 200, 125, 100, 100, 100, 100],
    Earth: [100, 100, 0, 200, 70, 125, 100, 100, 100, 100],
    Fire: [100, 200, 70, 0, 100, 125, 100, 100, 100, 70],
    Wind: [100, 70, 200, 100, 0, 125, 100, 100, 100, 100],
    Poison: [100, 125, 125, 125, 125, 0, 50, 50, 50, 25],
    Holy: [100, 100, 100, 100, 100, 50, 0, 175, 70, 175],
    Shadow: [100, 100, 100, 100, 100, 50, 175, 0, 70, 0],
    Ghost: [50, 100, 100, 100, 100, 50, 100, 100, 175, 150],
    Undead: [100, 100, 100, 175, 100, 25, 175, 0, 150, 0],
  },
  4: {
    Neutral: [100, 100, 100, 100, 100, 100, 100, 100, 0, 100],
    Water: [100, 0, 100, 60, 200, 125, 100, 100, 100, 100],
    Earth: [100, 100, 0, 200, 60, 125, 100, 100, 100, 100],
    Fire: [100, 200, 60, 0, 100, 125, 100, 100, 100, 60],
    Wind: [100, 60, 200, 100, 0, 125, 100, 100, 100, 100],
    Poison: [100, 125, 125, 125, 125, 0, 50, 50, 50, 0],
    Holy: [100, 100, 100, 100, 100, 50, 0, 200, 60, 200],
    Shadow: [100, 100, 100, 100, 100, 50, 200, 0, 60, 0],
    Ghost: [0, 100, 100, 100, 100, 50, 100, 100, 200, 175],
    Undead: [100, 100, 100, 200, 100, 0, 200, 0, 175, 0],
  },
};
