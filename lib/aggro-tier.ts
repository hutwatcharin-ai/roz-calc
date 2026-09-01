// Whether a monster will attack on sight, and how badly that hurts THIS player.
//
// The game ships a free unlimited auto-hunt bot, so dying while away is the
// failure players care about, and no competing site surfaces this field at all
// (spec 3.15.1). It appears on every surface a monster appears on.

import type { CharacterContext } from './character-context';

export type AggroLevel = 'safe' | 'aggressive' | 'caution' | 'danger';

// Our own threshold, not a game value: a hit costing at least this share of max
// HP is called dangerous. The UI must say so, so a player can disagree with it.
export const DANGER_ATK_RATIO = 0.2;

export const AGGRO_LABELS: Record<AggroLevel, string> = {
  safe: 'ปลอดภัย',
  aggressive: 'โจมตีก่อน',
  caution: 'ระวัง',
  danger: 'อันตราย',
};

// Two levels when the player is unknown, three when known. Grading "strong" and
// "weak" without a player to measure against would be inventing an answer,
// which is worse than showing less (spec 3.15.1).
export function aggroLevel(
  monster: { is_aggressive: boolean | null; atk_max: number | null },
  playerMaxHp: number | null,
): AggroLevel {
  if (!monster.is_aggressive) return 'safe';
  if (monster.atk_max === null) return 'aggressive';
  if (playerMaxHp === null || !Number.isFinite(playerMaxHp) || playerMaxHp <= 0) return 'aggressive';
  return monster.atk_max >= playerMaxHp * DANGER_ATK_RATIO ? 'danger' : 'caution';
}

// v2: the player types the Max HP the game shows -- gear and buffs included --
// so the danger grade stands on a real number instead of our HP formula.
export function playerMaxHpFromContext(ctx: CharacterContext | null): number | null {
  if (!ctx) return null;
  return ctx.maxHp;
}
