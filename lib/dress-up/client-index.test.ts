import { describe, expect, it } from 'vitest';
import full from '@/data/dress-up.json';
import slim from '@/data/dress-up-client.json';
// @ts-expect-error plain .mjs script without types
import { buildClient } from '@/scripts/build-dress-up-client.mjs';

describe('data/dress-up-client.json', () => {
  it('is what scripts/build-dress-up-client.mjs makes from data/dress-up.json (run npm run dress-up:build)', () => {
    expect(slim).toEqual(buildClient(full));
  });

  it('keeps every exception: items with no sprite are flagged', () => {
    const none = Object.entries(slim.items).filter(([, v]) => (v as unknown[])[2] === 0).map(([id]) => Number(id));
    expect(none.sort()).toEqual(full.coverage.missing.map((m) => m.id).sort());
  });
});
