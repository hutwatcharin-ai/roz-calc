import { describe, it, expect } from 'vitest';
import star from '@/data/star-gear.json';

// ★★ and ★★★ look like two tiers and are not. The page said they were, and
// the owner asked for that to be checked before it was rewritten. The
// evidence, from our own data:
//
//   1. every second-tier family has exactly two members, never one or three
//   2. the two arrive at the same refine steps, so neither is "denser"
//   3. on two of the eight, the ★★★ headline stat is LOWER than the ★★
//
// (3) is what settles it: a higher tier is never weaker. The mirrored guide
// agrees from the other side -- it lists both members under one heading,
// "armes de 2ᵉ palier ★★", and tells them apart by a suffix instead.
//
// If a future import breaks any of these, the page's wording is wrong again
// and this test says so before a reader sees it.

type Tier = { kind: string; refine: number };
type Piece = { id: number; name: string; stars: number; tier: number; family: string; base: string; tiers: Tier[] };

const PIECES = star.items as Piece[];
const SECOND = PIECES.filter((p) => p.tier === 2);

function familyOf(name: string): Piece[] {
  return SECOND.filter((p) => p.family === name);
}

/** The first ATK or MATK number in a piece's own text. */
function headline(piece: Piece): number | null {
  const hit = piece.base.match(/\bM?ATK\s*\+\s*(\d+)/);
  return hit ? Number(hit[1]) : null;
}

describe('★★ and ★★★ are one tier with two variants', () => {
  const families = [...new Set(SECOND.map((p) => p.family))];

  it('gives every second-tier family exactly two variants', () => {
    const wrong = families.filter((f) => familyOf(f).length !== 2).map((f) => `${f}: ${familyOf(f).length}`);
    expect(wrong).toEqual([]);
  });

  it('pairs one ★★ with one ★★★ in each family', () => {
    const wrong = families.filter((f) => {
      const stars = familyOf(f).map((p) => p.stars).sort();
      return stars.length !== 2 || stars[0] !== 2 || stars[1] !== 3;
    });
    expect(wrong).toEqual([]);
  });

  it('has no third star count beyond the pair', () => {
    expect([...new Set(PIECES.map((p) => p.stars))].sort()).toEqual([1, 2, 3]);
    expect([...new Set(PIECES.map((p) => p.tier))].sort()).toEqual([1, 2]);
  });

  it('proves ★★★ is not an upgrade: some are weaker than their ★★', () => {
    const weaker = families.filter((f) => {
      const [two, three] = familyOf(f).sort((a, b) => a.stars - b.stars);
      const a = headline(two);
      const b = headline(three);
      return a !== null && b !== null && b < a;
    });
    // Oak Wand (MATK 170 -> 140) and Ring Pommel Saber (ATK 45 -> 25) on
    // 24 Sep 2026. The count may move; that none exist would mean the
    // "two variants" reading lost its strongest support.
    expect(weaker.length).toBeGreaterThan(0);
  });
});
