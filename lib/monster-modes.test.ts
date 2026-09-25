import { describe, expect, it } from 'vitest';
import file from '@/data/monster-modes.json';
import raw from '@/data/raw/monsters.json';
import rathena from '@/data/raw/rathena-modes.json';
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

  it('carries the rAthena behaviour for every id that has an rAthena row, and null for the rest', () => {
    const ra = rathena as any;
    for (const row of rows) {
      const b = monsterModes(row.id)!.behaviour;
      const src = ra.modes[String(row.id)];
      if (!src) expect(b, row.name).toBeNull();
      else expect(b, row.name).toEqual({ assist: src.assist, castSensor: src.castSensor, detector: src.detector, plant: src.plant });
    }
    // The trust argument for using kRO data: it must still match rozerodb on
    // the one flag both have. If this drops, rebuild before shipping.
    expect(ra._meta.aggressiveCheck.disagree).toBe(0);
    expect(ra._meta.aggressiveCheck.agree).toBeGreaterThan(400);
  });
});
