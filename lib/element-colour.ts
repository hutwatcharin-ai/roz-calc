// One colour per element, for inline `--el` values (the monster page's sprite
// ring, the monster-name suggestions).
//
// These point at the --el-* tokens in app/neon.css rather than holding hex
// values of their own. Until 1 Oct 2026 this file had its own palette, and
// the two disagreed: Poison was purple on the chips and green on the ring,
// Earth green on one and ochre on the other. One palette, kept in neon.css.
export const ELEMENT_COLOUR: Record<string, string> = {
  Neutral: 'var(--el-neutral)',
  Water: 'var(--el-water)',
  Earth: 'var(--el-earth)',
  Fire: 'var(--el-fire)',
  Wind: 'var(--el-wind)',
  Poison: 'var(--el-poison)',
  Holy: 'var(--el-holy)',
  Shadow: 'var(--el-shadow)',
  Ghost: 'var(--el-ghost)',
  Undead: 'var(--el-undead)',
};

export const ELEMENT_COLOUR_UNKNOWN = 'var(--faint)';
