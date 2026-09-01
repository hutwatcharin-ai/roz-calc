import { describe, expect, it } from 'vitest';
import { buildChains } from './quest-chains';

const q = (id: number, next: number | null = null) => ({ id, chain_next_id: next });

describe('buildChains', () => {
  it('walks a linear chain head-first and leaves the rest as singles', () => {
    const rows = [q(5), q(1, 2), q(2, 3), q(3), q(9)];
    const { chains, singles } = buildChains(rows);
    expect(chains).toHaveLength(1);
    expect(chains[0].map((r) => r.id)).toEqual([1, 2, 3]);
    expect(singles.map((r) => r.id)).toEqual([5, 9]);
  });

  it('a next id outside the set stops the walk at the town boundary', () => {
    // 1 -> 2 -> 4004 where 4004 lives on another town's page.
    const rows = [q(1, 2), q(2, 4004)];
    const { chains, singles } = buildChains(rows);
    expect(chains).toHaveLength(1);
    expect(chains[0].map((r) => r.id)).toEqual([1, 2]);
    expect(singles).toHaveLength(0);
  });

  it('a quest whose only link leaves the set is still a chain, not a single', () => {
    const rows = [q(7, 9999)];
    const { chains, singles } = buildChains(rows);
    expect(chains).toHaveLength(0); // next id missing -> not in-chain within this set
    expect(singles.map((r) => r.id)).toEqual([7]);
  });

  it('two separate chains keep their own order', () => {
    const rows = [q(10, 11), q(11), q(20, 21), q(21)];
    const { chains } = buildChains(rows);
    expect(chains.map((c) => c.map((r) => r.id))).toEqual([
      [10, 11],
      [20, 21],
    ]);
  });

  it('a cycle renders instead of vanishing', () => {
    const rows = [q(1, 2), q(2, 1)];
    const { chains, singles } = buildChains(rows);
    expect(chains).toHaveLength(1);
    expect(new Set(chains[0].map((r) => r.id))).toEqual(new Set([1, 2]));
    expect(singles).toHaveLength(0);
  });
});
