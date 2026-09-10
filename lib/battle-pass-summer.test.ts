import { describe, expect, it } from 'vitest';
import { COSTUMES, FREE_TRACK, PAID_TRACK, REWARDS, coinTiers, itemIdsIn, type RewardKey } from './battle-pass-summer';

describe('the two tracks', () => {
  it('runs to the tier the notice says', () => {
    expect(FREE_TRACK).toHaveLength(50);
    expect(PAID_TRACK).toHaveLength(70);
  });

  it('numbers the tiers 1..n with no gap', () => {
    for (const track of [FREE_TRACK, PAID_TRACK]) {
      expect(track.map((r) => r.tier)).toEqual(track.map((_, i) => i + 1));
    }
  });

  it('hands out the Battle Coins the notice counts', () => {
    // The notice states this separately from the reward tables, so it is a
    // real cross-check on the transcription rather than a restatement:
    // "The Paid Battle Pass awards Battle Coin 2026 at Tiers 10, 20, 30, 50,
    // 60, and 70, for a total of 6 Battle Coins. The Free Battle Pass awards
    // Battle Coin 2026 at Tier 50, for a total of 1 Battle Coin."
    expect(coinTiers(PAID_TRACK)).toEqual([10, 20, 30, 50, 60, 70]);
    expect(coinTiers(FREE_TRACK)).toEqual([50]);
  });

  it('gives the paid track at least as much of everything through Tier 50', () => {
    // Every paid row is the free row's item in a larger quantity, except the
    // tiers where the tracks deliberately differ: 9 (7-day vs 30-day halter),
    // 10, 20, 30 (coin instead of consumables) and 24 (fly wing).
    const differs = new Set([9, 10, 20, 24, 30]);
    for (let i = 0; i < 50; i += 1) {
      const free = FREE_TRACK[i];
      const paid = PAID_TRACK[i];
      if (differs.has(free.tier)) continue;
      expect(paid.key, `tier ${free.tier}`).toBe(free.key);
      expect(paid.qty, `tier ${free.tier}`).toBeGreaterThanOrEqual(free.qty);
    }
  });

  it('never lists a quantity of zero', () => {
    for (const row of [...FREE_TRACK, ...PAID_TRACK]) expect(row.qty, `tier ${row.tier}`).toBeGreaterThan(0);
  });
});

describe('the reward table', () => {
  it('names every key both tracks use', () => {
    for (const row of [...FREE_TRACK, ...PAID_TRACK]) {
      expect(REWARDS[row.key as RewardKey], row.key).toBeTruthy();
      expect(REWARDS[row.key as RewardKey].label).toBeTruthy();
    }
  });

  it('links every reward but the one this game does not have', () => {
    // The 7-day Boarding Halter box: our items table carries the 30-day one
    // and not this. A null here is the honest answer; pointing it at the
    // 30-day box would be a wrong link on a page people read to plan.
    const unlinked = Object.entries(REWARDS).filter(([, r]) => r.id === null).map(([k]) => k);
    expect(unlinked).toEqual(['halter7']);
  });

  it('gives each costume a coin price the coins can actually reach', () => {
    // 6 coins on the paid track, 1 on the free one -- so nothing may cost
    // more than 6, and the free track's single coin must buy something.
    expect(COSTUMES).toHaveLength(7);
    for (const c of COSTUMES) expect(c.coins, c.label).toBeLessThanOrEqual(6);
    expect(COSTUMES.some((c) => c.coins === 1)).toBe(true);
  });

  it('collects the ids the page needs icons for, without duplicates or nulls', () => {
    const ids = itemIdsIn(FREE_TRACK, PAID_TRACK);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).not.toContain(null);
    // 24 linked rewards plus 7 costumes.
    expect(ids).toHaveLength(31);
  });
});
