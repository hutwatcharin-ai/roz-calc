import { describe, it, expect } from 'vitest';
import {
  CHARACTER_STORAGE_KEY,
  characterFromInput,
  parseCharacterContext,
  readCharacterContext,
  writeCharacterContext,
  type CharacterContext,
} from './character-context';

const VALID: CharacterContext = { level: 50, job: 'knight', damagePerHit: 250, attacksPerSecond: 2.5, vit: 20, dex: null, agi: null, luk: null };

function fakeStorage(initial: Record<string, string> = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
  };
}

function throwingStorage() {
  return {
    getItem: () => {
      throw new DOMException('The operation is insecure.', 'SecurityError');
    },
    setItem: () => {
      throw new DOMException('The operation is insecure.', 'SecurityError');
    },
  };
}

describe('parseCharacterContext', () => {
  it('parses a well-formed payload', () => {
    expect(parseCharacterContext(JSON.stringify(VALID))).toEqual(VALID);
  });

  it('returns null for null input', () => {
    expect(parseCharacterContext(null)).toBeNull();
  });

  it('returns null for malformed JSON instead of throwing', () => {
    expect(parseCharacterContext('{not json')).toBeNull();
  });

  it('returns null when a required field is missing', () => {
    expect(parseCharacterContext(JSON.stringify({ level: 50, job: 'knight' }))).toBeNull();
  });

  it('returns null for an unknown job rather than trusting it', () => {
    expect(parseCharacterContext(JSON.stringify({ ...VALID, job: 'summoner' }))).toBeNull();
  });

  it('returns null when a numeric field arrives as a string', () => {
    expect(parseCharacterContext(JSON.stringify({ ...VALID, level: '50' }))).toBeNull();
  });

  it('rejects a non-positive level', () => {
    expect(parseCharacterContext(JSON.stringify({ ...VALID, level: 0 }))).toBeNull();
  });

  it('rejects a payload missing vit -- a value stored before vit existed must not silently pass', () => {
    const { vit, ...withoutVit } = VALID as any;
    expect(parseCharacterContext(JSON.stringify(withoutVit))).toBeNull();
  });

  it('rejects a non-positive vit', () => {
    expect(parseCharacterContext(JSON.stringify({ ...VALID, vit: 0 }))).toBeNull();
  });

  it('rejects a JSON array, which parses but is not a context', () => {
    expect(parseCharacterContext('[]')).toBeNull();
  });

  it('rejects job: "constructor" (prototype property) to prevent NaN in calculations', () => {
    expect(parseCharacterContext(JSON.stringify({ ...VALID, job: 'constructor' }))).toBeNull();
  });

  it('rejects job: "__proto__" (prototype property) to prevent NaN in calculations', () => {
    expect(parseCharacterContext(JSON.stringify({ ...VALID, job: '__proto__' }))).toBeNull();
  });
});

describe('readCharacterContext', () => {
  it('reads a stored context', () => {
    const storage = fakeStorage({ [CHARACTER_STORAGE_KEY]: JSON.stringify(VALID) });
    expect(readCharacterContext(storage)).toEqual(VALID);
  });

  it('returns null when nothing is stored', () => {
    expect(readCharacterContext(fakeStorage())).toBeNull();
  });

  it('returns null when storage is unavailable', () => {
    expect(readCharacterContext(null)).toBeNull();
  });

  it('returns null instead of throwing when storage access is blocked', () => {
    expect(readCharacterContext(throwingStorage())).toBeNull();
  });
});

describe('writeCharacterContext', () => {
  it('writes and reports success', () => {
    const storage = fakeStorage();
    expect(writeCharacterContext(storage, VALID)).toBe(true);
    expect(readCharacterContext(storage)).toEqual(VALID);
  });

  it('reports failure instead of throwing when storage is blocked', () => {
    expect(writeCharacterContext(throwingStorage(), VALID)).toBe(false);
  });

  it('reports failure when storage is unavailable', () => {
    expect(writeCharacterContext(null, VALID)).toBe(false);
  });
});

describe('characterFromInput', () => {
  const good = {
    level: '99',
    job: 'knight',
    vit: '50',
    damagePerHit: '1200',
    attacksPerSecond: '2.5',
  };

  it('accepts a filled-in form', () => {
    expect(characterFromInput(good)).toEqual({
      level: 99,
      job: 'knight',
      vit: 50,
      damagePerHit: 1200,
      attacksPerSecond: 2.5,
      dex: null,
      agi: null,
      luk: null,
    });
  });

  it('carries the optional accuracy stats through and degrades junk to null', () => {
    expect(characterFromInput({ ...good, dex: '80', agi: '60', luk: '30' })).toMatchObject({ dex: 80, agi: 60, luk: 30 });
    expect(characterFromInput({ ...good, dex: 'abc', agi: '-5', luk: '' })).toMatchObject({ dex: null, agi: null, luk: null });
  });

  it('rejects a blank field', () => {
    // Not because of a blank check -- there isn't one. Number('') is 0 and zero
    // is not positive, so the rule that rejects "0" rejects "" and "   " too.
    for (const key of ['level', 'vit', 'damagePerHit', 'attacksPerSecond'] as const) {
      expect(characterFromInput({ ...good, [key]: '' })).toBeNull();
      expect(characterFromInput({ ...good, [key]: '   ' })).toBeNull();
    }
  });

  it('rejects zero, negatives and nonsense', () => {
    expect(characterFromInput({ ...good, damagePerHit: '0' })).toBeNull();
    expect(characterFromInput({ ...good, level: '-1' })).toBeNull();
    expect(characterFromInput({ ...good, attacksPerSecond: 'สอง' })).toBeNull();
  });

  it('rejects a job that is not in JOB_PROFILES', () => {
    // Including one that exists on Object.prototype: `job in JOB_PROFILES`
    // would let "constructor" through and put NaN into every HP figure.
    expect(characterFromInput({ ...good, job: 'constructor' })).toBeNull();
    expect(characterFromInput({ ...good, job: 'bard' })).toBeNull();
  });

  it('agrees with what the form will read back from storage', () => {
    // The whole point of sharing the validator: a value the form accepted must
    // survive a round trip through storage unchanged.
    const ctx = characterFromInput(good);
    expect(parseCharacterContext(JSON.stringify(ctx))).toEqual(ctx);
  });
});
