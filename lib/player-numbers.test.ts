import { describe, expect, it } from 'vitest';
import {
  attacksPerSecond,
  parsePlayerNumbers,
  playerNumbersFromInput,
  readPlayerNumbers,
  writePlayerNumbers,
  PLAYER_NUMBERS_KEY,
} from './player-numbers';

function storage(initial: Record<string, string> = {}) {
  const data = { ...initial };
  return {
    data,
    getItem: (k: string) => data[k] ?? null,
    setItem: (k: string, v: string) => {
      data[k] = v;
    },
  };
}

describe('parsePlayerNumbers', () => {
  it('keeps each field independently, so one number is a valid answer', () => {
    // The whole point of the 4 Sep rewrite: the old context refused to store
    // anything until level, Max HP, damage and ASPD were all present.
    expect(parsePlayerNumbers(JSON.stringify({ damagePerHit: 250 }))).toEqual({ damagePerHit: 250 });
  });

  it('drops values that are not usable numbers rather than rejecting the lot', () => {
    expect(parsePlayerNumbers(JSON.stringify({ damagePerHit: 250, aspd: 'fast', level: 0, hit: -3 }))).toEqual({
      damagePerHit: 250,
    });
  });

  it('drops an ASPD the attack-speed formula cannot take', () => {
    // 50 / (200 - aspd) divides by zero at 200 and goes negative above it.
    expect(parsePlayerNumbers(JSON.stringify({ aspd: 200 }))).toEqual({});
    expect(parsePlayerNumbers(JSON.stringify({ aspd: 199 }))).toEqual({ aspd: 199 });
  });

  it('reads junk and foreign payloads as empty instead of throwing', () => {
    expect(parsePlayerNumbers(null)).toEqual({});
    expect(parsePlayerNumbers('not json')).toEqual({});
    expect(parsePlayerNumbers('[1,2,3]')).toEqual({});
    expect(parsePlayerNumbers('"a string"')).toEqual({});
  });
});

describe('playerNumbersFromInput', () => {
  it('treats a blank box as unanswered, not as zero', () => {
    expect(playerNumbersFromInput({ damagePerHit: '250', aspd: '', level: '   ' })).toEqual({ damagePerHit: 250 });
  });

  it('ignores a box that does not hold a usable number', () => {
    expect(playerNumbersFromInput({ damagePerHit: 'abc', hit: '290' })).toEqual({ hit: 290 });
  });
});

describe('attacksPerSecond', () => {
  it('converts the status-window ASPD', () => {
    expect(attacksPerSecond(190)).toBe(5);
    expect(attacksPerSecond(150)).toBe(1);
  });

  it('has no answer without a usable ASPD', () => {
    expect(attacksPerSecond(undefined)).toBeNull();
    expect(attacksPerSecond(200)).toBeNull();
    expect(attacksPerSecond(0)).toBeNull();
  });
});

describe('storage round trip', () => {
  it('writes and reads back', () => {
    const s = storage();
    expect(writePlayerNumbers(s, { damagePerHit: 250, aspd: 187 })).toBe(true);
    expect(readPlayerNumbers(s)).toEqual({ damagePerHit: 250, aspd: 187 });
  });

  it('survives a storage that throws', () => {
    const broken = {
      getItem() {
        throw new Error('blocked');
      },
      setItem() {
        throw new Error('blocked');
      },
    };
    expect(readPlayerNumbers(broken)).toEqual({});
    expect(writePlayerNumbers(broken, { level: 50 })).toBe(false);
  });

  it('reads nothing when there is no storage at all (server render)', () => {
    expect(readPlayerNumbers(null)).toEqual({});
    expect(writePlayerNumbers(null, { level: 50 })).toBe(false);
  });

  it('stores under its own key, not the character bar’s old one', () => {
    const s = storage({ 'roz-calc:character': JSON.stringify({ level: 99, damagePerHit: 1 }) });
    writePlayerNumbers(s, { level: 50 });
    expect(s.data[PLAYER_NUMBERS_KEY]).toBeDefined();
    // The old key is left where it is: this build no longer reads it, and
    // clobbering it would destroy a value a rollback would want back.
    expect(JSON.parse(s.data['roz-calc:character']).level).toBe(99);
  });
});
