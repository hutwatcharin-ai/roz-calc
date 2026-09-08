import { describe, it, expect } from 'vitest';
import { formerNames, formerNameIdsFor } from './former-names';


describe('former monster names', () => {
  it('finds the row a player typing the old name is looking for', () => {
    expect(formerNameIdsFor('Pecopeco')).toContain(1019);
    expect(formerNameIdsFor('wootan fighter')).toContain(1499);
    expect(formerNameIdsFor('garm baby')).toContain(1515);
  });

  it('ignores spacing and punctuation on both sides', () => {
    expect(formerNameIdsFor('peco peco egg')).toContain(1047);
    expect(formerNameIdsFor('SeeOtter')).toContain(1323);
  });

  it('does not answer a query that is merely short', () => {
    expect(formerNameIdsFor('go')).toEqual([]);
  });

  // The point of the file is completeness: a rename whose old name the live
  // search can no longer reach, and which is not recorded here, is a search
  // that silently stopped working. The search ANDs one `ilike %word%` per
  // word against name_en, so the old name still works only when every word
  // of it appears inside the new name.
  it('records every rename whose old name the search can no longer reach', async () => {
    const fs = await import('node:fs');
    const script = fs.readFileSync('scripts/fix-monster-names.mjs', 'utf-8');
    const renames = [...script.matchAll(/^\s*\[(\d+), '([^']+)', '([^']+)'\],/gm)].map((m) => ({
      id: Number(m[1]),
      from: m[2],
      to: m[3],
    }));
    expect(renames.length).toBeGreaterThan(25);
    const stillFound = (from: string, to: string) =>
      from.toLowerCase().split(/\s+/).every((w) => to.toLowerCase().includes(w));
    const lost = renames.filter((r) => !stillFound(r.from, r.to));
    expect(lost.length).toBeGreaterThan(0);
    for (const r of lost) {
      expect(formerNames(r.id).map((n) => n.name), `${r.from} -> ${r.to}`).toContain(r.from);
    }
  });
});
