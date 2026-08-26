// components/AggroBadge.tsx
import { AGGRO_LABELS, type AggroLevel } from '@/lib/aggro-tier';

// Glyph plus text, never colour alone. This badge is the site's clearest
// differentiator; if it cannot be read, the advantage is gone.
const GLYPHS: Record<AggroLevel, string> = {
  safe: '✓',
  aggressive: '!',
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
