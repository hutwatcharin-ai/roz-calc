// Loot tiers for drop tables, coloured like an RPG's item rarity (owner's
// pick, 1 Oct 2026, public/draft/monster-arcade): a card is always CARD,
// otherwise the drop rate decides.

export type DropTier = 'common' | 'uncommon' | 'rare' | 'epic' | 'card';

export const TIER_LABEL: Record<DropTier, string> = {
  common: 'COMMON',
  uncommon: 'UNCOMMON',
  rare: 'RARE',
  epic: 'EPIC',
  card: 'CARD',
};

/** null when the rate is unknown and the item is not a card. */
export function dropTier(rate: number | null | undefined, isCard: boolean): DropTier | null {
  if (isCard) return 'card';
  if (rate == null) return null;
  if (rate >= 10) return 'common';
  if (rate >= 1) return 'uncommon';
  if (rate >= 0.1) return 'rare';
  return 'epic';
}
