import { describe, expect, it } from 'vitest';
import { CORS_ORIGINS, checkVerdict, corsConfig, planUpload } from './upload-plan.mjs';

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

describe('corsConfig', () => {
  it('allows GET and HEAD from the site, the preview box and local dev only', () => {
    expect(CORS_ORIGINS).toEqual([
      'https://rozerothai.com',
      'https://www.rozerothai.com',
      'http://100.108.70.113:3178',
      'http://localhost:3000',
    ]);
    const rules = corsConfig().CORSRules;
    expect(rules).toHaveLength(1);
    expect(rules[0].AllowedMethods).toEqual(['GET', 'HEAD']);
    expect(rules[0].AllowedOrigins).toEqual(CORS_ORIGINS);
  });
});

describe('checkVerdict', () => {
  it('passes only on 200 with the origin allowed', () => {
    expect(checkVerdict(200, 'https://rozerothai.com')).toBe(true);
    expect(checkVerdict(200, '*')).toBe(true);
    expect(checkVerdict(200, null)).toBe(false);
    expect(checkVerdict(200, 'https://example.com')).toBe(false);
    expect(checkVerdict(403, 'https://rozerothai.com')).toBe(false);
  });
});
