import { describe, expect, it } from 'vitest';
import file from '@/data/monster-modes.json';
import raw from '@/data/raw/monsters.json';
import { monsterModes } from '@/lib/monster-modes';

const rows = ((raw as any).monsters ?? (raw as any).rows ?? raw) as any[];

describe('monster modes', () => {
  it('covers every exported monster, and unknown means the export had no flags at all', () => {
    for (const row of rows) {
      const modes = monsterModes(row.id);
      expect(modes, String(row.id)).not.toBeNull();
      const labels = (row.ragnarokZero?.specialStatus ?? []).map((s: any) => s?.raw).filter(Boolean);
      expect(modes!.known, row.name).toBe(labels.length > 0);
      if (modes!.known) {
        expect(modes!.canMove).toBe(labels.includes('Can move'));
        expect(modes!.mini).toBe(labels.includes('mini'));
      }
    }
    expect((file as any)._meta.unknownIds.length).toBe(rows.filter((r) => !(r.ragnarokZero?.specialStatus ?? []).some((s: any) => s?.raw)).length);
  });
});
