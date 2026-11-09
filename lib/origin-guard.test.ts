import { describe, expect, it } from 'vitest';
import { clientIp, originVerdict } from './origin-guard';

describe('originVerdict', () => {
  it('is off until a key is configured, whatever the mode', () => {
    expect(originVerdict(null, undefined, 'enforce')).toBe('off');
    expect(originVerdict('x', '', 'enforce')).toBe('off');
  });

  it('passes the right key', () => {
    expect(originVerdict('s3cret-key', 's3cret-key', 'enforce')).toBe('pass');
  });

  it('only logs a missing or wrong key outside enforce mode', () => {
    expect(originVerdict(null, 's3cret-key', undefined)).toBe('log');
    expect(originVerdict('wrong', 's3cret-key', 'log')).toBe('log');
  });

  it('rejects a missing, wrong, prefix or longer key in enforce mode', () => {
    for (const given of [null, '', 'wrong', 's3cret', 's3cret-key-extra']) {
      expect(originVerdict(given, 's3cret-key', 'enforce')).toBe('reject');
    }
  });
});

describe('clientIp', () => {
  const withEnv = (key: string | undefined, fn: () => void) => {
    const before = process.env.ORIGIN_KEY;
    if (key === undefined) delete process.env.ORIGIN_KEY;
    else process.env.ORIGIN_KEY = key;
    try { fn(); } finally {
      if (before === undefined) delete process.env.ORIGIN_KEY;
      else process.env.ORIGIN_KEY = before;
    }
  };

  it('believes cf-connecting-ip before the lock is set up', () => {
    withEnv(undefined, () => {
      expect(clientIp(new Headers({ 'cf-connecting-ip': '1.2.3.4' }))).toBe('1.2.3.4');
    });
  });

  it('believes cf-connecting-ip on a keyed request', () => {
    withEnv('k', () => {
      expect(clientIp(new Headers({ 'cf-connecting-ip': '1.2.3.4', 'x-origin-key': 'k' }))).toBe('1.2.3.4');
    });
  });

  it('ignores a forged cf-connecting-ip on an unkeyed request', () => {
    withEnv('k', () => {
      const h = new Headers({ 'cf-connecting-ip': '9.9.9.9', 'x-forwarded-for': '9.9.9.9, 5.6.7.8' });
      expect(clientIp(h)).toBe('5.6.7.8');
    });
  });
});
