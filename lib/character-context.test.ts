import { describe, it, expect } from 'vitest';
import {
  CHARACTER_STORAGE_KEY,
  parseCharacterContext,
  readCharacterContext,
  writeCharacterContext,
  type CharacterContext,
} from './character-context';

const VALID: CharacterContext = { level: 50, job: 'knight', damagePerHit: 250, attacksPerSecond: 2.5 };

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
