import { describe, it, expect } from 'vitest';
import {
  CHARACTER_STORAGE_KEY,
  characterFromInput,
  parseCharacterContext,
  readCharacterContext,
  writeCharacterContext,
  type CharacterContext,
} from './character-context';

const VALID: CharacterContext = {
  level: 50,
  damagePerHit: 250,
  attacksPerSecond: 2.5,
  maxHp: 1542,
  hit: null,
  flee: null,
};

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
      throw new Error('blocked');
    },
    setItem: () => {
      throw new Error('blocked');
    },
  };
}

describe('parseCharacterContext (v2)', () => {
  it('parses a well-formed payload', () => {
    expect(parseCharacterContext(JSON.stringify(VALID))).toEqual(VALID);
  });

  it('returns null for null input', () => {
    expect(parseCharacterContext(null)).toBeNull();
  });

  it('returns null for malformed JSON instead of throwing', () => {
    expect(parseCharacterContext('{oops')).toBeNull();
  });

  it('returns null when a required field is missing', () => {
    const { maxHp: _hp, ...rest } = VALID;
    expect(parseCharacterContext(JSON.stringify(rest))).toBeNull();
  });

  it('returns null when a numeric field arrives as a string', () => {
    expect(parseCharacterContext(JSON.stringify({ ...VALID, maxHp: '1542' }))).toBeNull();
  });

  it('rejects a non-positive level or maxHp', () => {
    expect(parseCharacterContext(JSON.stringify({ ...VALID, level: 0 }))).toBeNull();
    expect(parseCharacterContext(JSON.stringify({ ...VALID, maxHp: 0 }))).toBeNull();
  });

  it('degrades junk optional hit/flee to null instead of rejecting the save', () => {
    expect(parseCharacterContext(JSON.stringify({ ...VALID, hit: 'abc', flee: -4 }))).toEqual({
      ...VALID,
      hit: null,
      flee: null,
    });
  });

  it('rejects a JSON array, which parses but is not a context', () => {
    expect(parseCharacterContext(JSON.stringify([VALID]))).toBeNull();
  });
});

describe('parseCharacterContext (v1 migration)', () => {
  const V1 = { level: 50, job: 'knight', damagePerHit: 250, attacksPerSecond: 2.5, vit: 20 };

  it('derives maxHp from the old vit/job via the v1 formula, pinned', () => {
    // knight hpFactor 1.25: (35 + 50*20*1.25) * 1.20 = 1542.
    expect(parseCharacterContext(JSON.stringify(V1))).toEqual({
      level: 50,
      damagePerHit: 250,
      attacksPerSecond: 2.5,
      maxHp: 1542,
      hit: null,
      flee: null,
    });
  });

  it('derives hit/flee from old dex/agi/luk via the renewal formulas, pinned', () => {
    const parsed = parseCharacterContext(JSON.stringify({ ...V1, dex: 60, agi: 40, luk: 20 }));
    // 175+50+60+6 = 291 · 100+50+40+4 = 194.
    expect(parsed).toMatchObject({ hit: 291, flee: 194 });
  });

  it('rejects a v1 payload with an unknown or prototype-property job', () => {
    // `job in JOB_PROFILES` would let "constructor" through and put NaN into
    // the migrated maxHp.
    expect(parseCharacterContext(JSON.stringify({ ...V1, job: 'constructor' }))).toBeNull();
    expect(parseCharacterContext(JSON.stringify({ ...V1, job: '__proto__' }))).toBeNull();
    expect(parseCharacterContext(JSON.stringify({ ...V1, job: 'bard' }))).toBeNull();
  });

  it('rejects a v1 payload with non-positive vit', () => {
    expect(parseCharacterContext(JSON.stringify({ ...V1, vit: 0 }))).toBeNull();
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
    maxHp: '5000',
    damagePerHit: '1200',
    attacksPerSecond: '2.5',
  };

  it('accepts a filled-in form', () => {
    expect(characterFromInput(good)).toEqual({
      level: 99,
      maxHp: 5000,
      damagePerHit: 1200,
      attacksPerSecond: 2.5,
      hit: null,
      flee: null,
    });
  });

  it('carries the optional hit/flee through and degrades junk to null', () => {
    expect(characterFromInput({ ...good, hit: '290', flee: '195' })).toMatchObject({ hit: 290, flee: 195 });
    expect(characterFromInput({ ...good, hit: 'abc', flee: '-5' })).toMatchObject({ hit: null, flee: null });
  });

  it('rejects a blank required field', () => {
    // Not because of a blank check -- there isn't one. Number('') is 0 and zero
    // is not positive, so the rule that rejects "0" rejects "" and "   " too.
    for (const key of ['level', 'maxHp', 'damagePerHit', 'attacksPerSecond'] as const) {
      expect(characterFromInput({ ...good, [key]: '' })).toBeNull();
      expect(characterFromInput({ ...good, [key]: '   ' })).toBeNull();
    }
  });

  it('rejects zero, negatives and nonsense', () => {
    expect(characterFromInput({ ...good, damagePerHit: '0' })).toBeNull();
    expect(characterFromInput({ ...good, level: '-1' })).toBeNull();
    expect(characterFromInput({ ...good, attacksPerSecond: 'สอง' })).toBeNull();
  });

  it('agrees with what the form will read back from storage', () => {
    // The whole point of sharing the validator: a value the form accepted must
    // survive a round trip through storage unchanged.
    const ctx = characterFromInput({ ...good, hit: '290', flee: '195' });
    expect(parseCharacterContext(JSON.stringify(ctx))).toEqual(ctx);
  });
});
