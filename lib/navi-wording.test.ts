// /navi draws a route line; it does not move the character. The site said it
// walked you there in four places (site owner, 10 Sep 2026). This scan keeps
// the claim from coming back the next time someone writes the sentence from
// memory.
import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';

function filesUnder(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) filesUnder(full, out);
    else if (/\.(tsx?|json)$/.test(entry.name) && !entry.name.includes('.test.')) out.push(full);
  }
  return out;
}

describe('how the site describes /navi', () => {
  it('never says the character walks there by itself', () => {
    const banned = ['เดินไปเอง', 'ตัวละครจะเดินไป', 'พาไปเอง', 'เดินให้เอง'];
    const offenders: string[] = [];
    for (const file of [...filesUnder('app'), ...filesUnder('components'), ...filesUnder('lib'), ...filesUnder('data')]) {
      const text = fs.readFileSync(file, 'utf8');
      // The pets page says what /navi does NOT do, which is the correction
      // itself and has to stay allowed.
      for (const phrase of banned) {
        if (text.includes(phrase) && !text.includes('ตัวละครไม่ได้เดินให้')) offenders.push(`${file}: ${phrase}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
