// This file exists because of a specific mistake: the pets page shipped with
// "โบนัสขึ้นกับความสนิท — ระดับ 2 ต้องเลี้ยงจนสนิทมากขึ้น", a mechanic nothing
// in the source describes. The test guards the correction, including the
// wording, because the wrong version read perfectly well.
import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import { TAMING_RING_PRICE, LEVEL_2_SUCCESS_PERCENT, TAMING_QUEST, RING_TABS } from '@/lib/qpet-ring';

const pageSource = fs.readFileSync(path.join('app', 'database', 'pets', 'page.tsx'), 'utf8');
const guide = fs.readFileSync(path.join('docs', 'rozglobal-export', 'pages', 'qpets.html'), 'utf8');

describe('the Qpet ring facts', () => {
  it('matches the numbers in the mirrored guide', () => {
    expect(TAMING_RING_PRICE).toBe(50_000);
    expect(LEVEL_2_SUCCESS_PERCENT).toBe(50);
    // The guide writes the price with a space as the thousands separator.
    expect(guide).toContain('50 000 Zenys');
    expect(guide).toContain('50 %');
    expect(guide).toContain('iz_ac01 45/78');
    expect(TAMING_QUEST.map).toBe('iz_ac01');
    expect(RING_TABS.map((t) => t.name)).toEqual(['General', 'Growth', 'Reset']);
  });

  it('does not describe the bonus as intimacy anywhere on the page', () => {
    // The source has no word for feeding, hunger, intimacy or loyalty at all,
    // which is what makes the old sentence an invention rather than a
    // mistranslation.
    for (const word of ['nourri', 'faim', 'intimité', 'loyaut', 'fidél']) {
      expect(guide.toLowerCase()).not.toContain(word);
    }
    expect(pageSource).not.toContain('เลี้ยงจนสนิท');
    expect(pageSource).not.toContain('สนิทระดับ');
  });

  it('tells the reader how to get the bonus at all', () => {
    expect(pageSource).toContain('Taming Ring');
    expect(pageSource).toContain('หน้าต่างเอนแชนต์');
  });
});
