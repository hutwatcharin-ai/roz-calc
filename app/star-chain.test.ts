// The tier-1 -> tier-2 links in data/star-chain.json are hand-matched (the
// client renames four of them between tiers), so every claim the mapping
// makes is checked against the client-derived data here.
import { describe, expect, it } from 'vitest';
import star from '@/data/star-gear.json';
import chain from '@/data/star-chain.json';

type Piece = { id: number; tier: number; name: string; requiredLevel: number | null; starAtk: number | null; footer: Record<string, string> };
const PIECES = star.items as Piece[];
const TOKENS = star.tokens as { name: string }[];
const byId = new Map(PIECES.map((p) => [p.id, p]));
// 'Sword' and 'One-handed Sword' are the same slot spelt two ways across tiers.
const norm = (s: string | undefined) => (s ?? '').toLowerCase().replace(/[^a-z]/g, '').replace(/^onehanded/, '');
const base = (name: string) => name.replace(/^★+ /, '').replace(/ - (Sun|Moon)$/, '');

describe('star chain', () => {
  it('covers every second-tier piece exactly once, from a first-tier piece', () => {
    const seen = chain.chains.flatMap((c) => c.second);
    const secondTier = PIECES.filter((p) => p.tier === 2).map((p) => p.id).sort();
    expect([...seen].sort()).toEqual(secondTier);
    for (const c of chain.chains) expect(byId.get(c.first)?.tier).toBe(1);
  });

  it('links pieces of the same weapon type and level, never to a weaker base', () => {
    for (const c of chain.chains) {
      const first = byId.get(c.first)!;
      for (const id of c.second) {
        const second = byId.get(id)!;
        expect(norm(second.footer.type)).toBe(norm(first.footer.type));
        expect(second.requiredLevel).toBe(first.requiredLevel);
        if (first.starAtk != null && second.starAtk != null) expect(second.starAtk).toBeGreaterThanOrEqual(first.starAtk);
      }
    }
  });

  it('marks exactly the chains whose name changes between tiers, and every weapon chain has a token', () => {
    const tokenNames = TOKENS.map((t) => t.name);
    for (const c of chain.chains) {
      const first = byId.get(c.first)!;
      const secondName = base(byId.get(c.second[0])!.name);
      expect(base(first.name) !== secondName).toBe(c.renamed);
      // Tokens carry the tier-1 name, except Hora's, which the client named
      // after the tier-2 piece -- the one place the client itself ties the
      // two names together.
      if (norm(first.footer.type) !== '') {
        expect(tokenNames.some((n) => n.includes(`★ ${base(first.name)} `) || n.includes(`★ ${secondName} `))).toBe(true);
      }
    }
  });
});
