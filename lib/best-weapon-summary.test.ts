import { describe, it, expect } from 'vitest';
import { elementAdvice, sizeGroups } from './best-weapon-summary';

describe('elementAdvice', () => {
  it('names the elements tied for best and the ones to avoid, worst first', () => {
    // Poring is Water 1: Wind and Poison both 150, Water itself 25.
    const a = elementAdvice('Water', 1);
    expect(a.best).toEqual(['Wind', 'Poison']);
    expect(a.bestPct).toBe(150);
    expect(a.avoid[0]).toEqual({ element: 'Water', pct: 25 });
    expect(a.avoid.map((x) => x.element)).toContain('Fire'); // 90
  });

  it('has no best element when nothing beats a full hit', () => {
    // Eclipse is Neutral 3: every element 100 except Ghost.
    const a = elementAdvice('Neutral', 3);
    expect(a.best).toEqual([]);
    expect(a.bestPct).toBe(100);
    expect(a.avoid).toEqual([{ element: 'Ghost', pct: 50 }]);
  });
});

describe('sizeGroups', () => {
  it('groups weapon types by multiplier, best first, folding one/two-handed pairs', () => {
    const g = sizeGroups('medium');
    expect(g[0].pct).toBe(100);
    expect(g[1].pct).toBe(75);
    expect(g[1].labels).toContain('ขวาน');
    expect(g[1].labels).not.toContain('ขวานมือเดียว');
    expect(g[1].labels).toContain('มีด');
    expect(g[0].labels).toContain('คทา');
  });

  it('keeps a pair apart when the two hands differ', () => {
    // Small: one-handed sword 75, two-handed sword 75 -> folded; dagger 100.
    const g = sizeGroups('small');
    const full = g.find((x) => x.pct === 100)!;
    expect(full.labels).toContain('มีด');
    expect(g.find((x) => x.pct === 50)!.labels).toEqual(['ขวาน']);
  });
});
