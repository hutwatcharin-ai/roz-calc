import { describe, expect, it } from 'vitest';
import { planUpload } from './upload-plan.mjs';

describe('planUpload', () => {
  it('returns only the hashed paths the bucket does not have', () => {
    expect(planUpload({ 'a.1.json': '1', 'b.2.json': '2' }, new Set(['a.1.json']))).toEqual(['b.2.json']);
  });

  it('gives nothing for an empty local set', () => {
    expect(planUpload({}, new Set(['a.1.json']))).toEqual([]);
  });

  it('uploads everything to an empty bucket, in a stable order', () => {
    expect(planUpload({ 'b.2.webp': '2', 'a.1.json': '1' }, new Set())).toEqual(['a.1.json', 'b.2.webp']);
  });
});
