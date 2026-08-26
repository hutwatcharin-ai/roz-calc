// components/AggroBadge.tsx
import { AGGRO_LABELS, type AggroLevel } from '@/lib/aggro-tier';

// Glyph plus text, never colour alone. This badge is the site's clearest
// differentiator; if it cannot be read, the advantage is gone.
//
// "aggressive" and "caution" both mean "attacks first", but the first is
// ungraded (we don't know the player, or don't know the monster's ATK) and
// the second is graded mild -- a materially different claim that must not
// collapse to the same glyph. "?" reads as "we can't grade this one" and
// pairs with the hollow-outline style in globals.css; "!" and "!!" read as
// mild vs severe and pair with filled yellow / filled red.
const GLYPHS: Record<AggroLevel, string> = {
  safe: '✓',
  aggressive: '?',
  caution: '!',
  danger: '!!',
};

export default function AggroBadge({ level }: { level: AggroLevel }) {
  return (
    <span className={`aggro aggro--${level}`}>
      <span className="aggro__glyph" aria-hidden="true">
        {GLYPHS[level]}
      </span>
      {AGGRO_LABELS[level]}
    </span>
  );
}
