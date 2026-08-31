import { describe, it, expect } from 'vitest';
import { aggroLevel, playerMaxHpFromContext, DANGER_ATK_RATIO, AGGRO_LABELS } from './aggro-tier';
import type { CharacterContext } from './character-context';

const PLAYER_HP = 1000;

describe('aggroLevel', () => {
  it('is safe when the monster does not attack first, regardless of its ATK', () => {
    expect(aggroLevel({ is_aggressive: false, atk_max: 9999 }, PLAYER_HP)).toBe('safe');
  });

  it('treats a null aggression flag as safe, matching the column default', () => {
    expect(aggroLevel({ is_aggressive: null, atk_max: 100 }, PLAYER_HP)).toBe('safe');
  });

  it('reports the ungraded level when the player is unknown', () => {
    expect(aggroLevel({ is_aggressive: true, atk_max: 100 }, null)).toBe('aggressive');
  });

  it('reports the ungraded level when the monster ATK is unknown', () => {
    expect(aggroLevel({ is_aggressive: true, atk_max: null }, PLAYER_HP)).toBe('aggressive');
  });

  it('is caution when one hit takes less than the danger share of player HP', () => {
    expect(aggroLevel({ is_aggressive: true, atk_max: 150 }, PLAYER_HP)).toBe('caution');
  });

  it('is danger at exactly the threshold, not one point past it', () => {
    expect(aggroLevel({ is_aggressive: true, atk_max: PLAYER_HP * DANGER_ATK_RATIO }, PLAYER_HP)).toBe('danger');
  });

  it('is danger when one hit takes more than the danger share', () => {
    expect(aggroLevel({ is_aggressive: true, atk_max: 500 }, PLAYER_HP)).toBe('danger');
  });

  it('reports the ungraded level when player HP is zero, never dividing by it', () => {
    expect(aggroLevel({ is_aggressive: true, atk_max: 100 }, 0)).toBe('aggressive');
  });

  it('reports the ungraded level when player HP is NaN, preventing invented answers', () => {
    expect(aggroLevel({ is_aggressive: true, atk_max: 100 }, NaN)).toBe('aggressive');
  });

  it('threshold scales with player HP: 150 ATK is caution at 5000 HP but danger at 100 HP', () => {
    // Same monster, different player sizes. Threshold should move with the player.
    // At 5000 HP: threshold is 1000, so 150 is caution
    expect(aggroLevel({ is_aggressive: true, atk_max: 150 }, 5000)).toBe('caution');
    // At 100 HP: threshold is 20, so 150 is danger
    expect(aggroLevel({ is_aggressive: true, atk_max: 150 }, 100)).toBe('danger');
  });
});

describe('playerMaxHpFromContext', () => {
  it('returns null with no character, so callers get the two-level badge', () => {
    expect(playerMaxHpFromContext(null)).toBeNull();
  });

  it('computes the exact HP for a real character, pinned so argument order cannot silently swap', () => {
    // maxHp(level, vit, job): 35 + 50*20*1.25 = 1285, *(1 + 20/100) = 1542.
    // Asserting only ">0" would stay green even if level and vit were swapped
    // inside maxHp -- that swap gives 803, a threshold 47% too low.
    const ctx: CharacterContext = { level: 50, job: 'knight', damagePerHit: 250, attacksPerSecond: 2.5, vit: 20 };
    expect(playerMaxHpFromContext(ctx)).toBe(1542);
  });
});

describe('AGGRO_LABELS', () => {
  it('has a Thai label for every level, so no badge is colour-only', () => {
    for (const level of ['safe', 'aggressive', 'caution', 'danger'] as const) {
      expect(AGGRO_LABELS[level].length).toBeGreaterThan(0);
    }
  });

  it('gives every level a distinct label -- the property that actually proves no badge is colour-only', () => {
    // Non-empty alone would stay green even if two levels shared a label
    // (e.g. aggressive and caution both saying "โจมตีก่อน"), which is exactly
    // the colour-only failure this constant exists to prevent.
    const labels = (['safe', 'aggressive', 'caution', 'danger'] as const).map((l) => AGGRO_LABELS[l]);
    expect(new Set(labels).size).toBe(labels.length);
  });
});
