// data/star-droppers.json feeds the "ตัวธรรมดาดรอปจากไหน" drawer on
// /guides/star-gear. These checks fail if a rebuild loses a base item (a
// name override dropped, a table renamed) or starts inventing rates.
import { describe, expect, it } from 'vitest';
import star from '@/data/star-gear.json';
import file from '@/data/star-droppers.json';

type Row = { star: string; plainName: string; plainIds: number[]; droppers: { rate: number | null; status: string; when: string | null }[] };
const ROWS = file.pieces as unknown as Record<string, Row>;
const FIRST = (star.items as { id: number; name: string; tier: number }[]).filter((p) => p.tier === 1);

describe('star droppers', () => {
  it('has a row for every first-tier piece', () => {
    expect(Object.keys(ROWS).map(Number).sort()).toEqual(FIRST.map((p) => p.id).sort());
  });

  it('finds droppers for every piece except the Ninja wrist guard, whose job is not in the game', () => {
    const empty = Object.values(ROWS).filter((r) => r.droppers.length === 0).map((r) => r.star);
    expect(empty).toEqual(['★ Improved Wrist Guard']);
  });

  it('maps the five renamed pieces to their ordinary twin', () => {
    const byStar = Object.fromEntries(Object.values(ROWS).map((r) => [r.star, r.plainName]));
    expect(byStar['★ Crossbow']).toBe('Cross Bow');
    expect(byStar['★ Hora']).toBe('Studded Knuckles');
    expect(byStar['★ Leather Jacket']).toBe('Jacket');
    expect(byStar['★ Long Coat']).toBe('Coat');
    expect(byStar['★ Steel Chainmail']).toBe('Chain Mail');
  });

  it('keeps unknown rates null and every status one the page knows', () => {
    for (const r of Object.values(ROWS)) {
      for (const d of r.droppers) {
        expect(d.rate === null || (d.rate > 0 && d.rate <= 100)).toBe(true);
        expect(['open', 'closed', 'nospawn']).toContain(d.status);
        if (d.status === 'closed') expect(d.when).toBeTruthy();
      }
    }
  });
});
