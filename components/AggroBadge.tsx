'use client';

// components/AggroBadge.tsx
import { AGGRO_LABELS, DANGER_ATK_RATIO, aggroLevel, playerMaxHpFromContext, type AggroLevel } from '@/lib/aggro-tier';
import { useCharacterContext } from '@/components/CharacterContextProvider';

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

export interface AggroMonster {
  is_aggressive: boolean | null;
  atk_max: number | null;
}

// The badge grades itself rather than taking a level, so every surface a
// monster appears on upgrades from two levels to three the moment the player
// fills in the character bar -- without each page having to remember to read
// the context. Before that, and in a browser where localStorage is unusable,
// it renders the two-level answer, which is the honest one.
export default function AggroBadge({ monster }: { monster: AggroMonster }) {
  const { character } = useCharacterContext();
  const playerMaxHp = playerMaxHpFromContext(character);
  const level = aggroLevel(monster, playerMaxHp);

  // The 20% cut-off is ours, not the game's, so the tooltip states it outright
  // and gives the two numbers it compares. A player who disagrees can see why.
  const percent = Math.round(DANGER_ATK_RATIO * 100);
  const title =
    level === 'safe'
      ? 'ไม่เข้าโจมตีก่อน'
      : playerMaxHp === null || monster.atk_max === null
        ? 'เข้าโจมตีก่อน ยังบอกไม่ได้ว่าแรงแค่ไหนสำหรับคุณ — กรอกเลเวลกับอาชีพในแถบด้านบนแล้วจะแบ่งระดับให้'
        : `ATK สูงสุด ${monster.atk_max.toLocaleString()} เทียบกับ HP ของคุณ ${playerMaxHp.toLocaleString()} ` +
          `(เกณฑ์ ${percent}% เป็นเกณฑ์ที่เว็บนี้ตั้งเอง ไม่ใช่ค่าจากเกม)`;

  return (
    <span className={`aggro aggro--${level}`} title={title}>
      <span className="aggro__glyph" aria-hidden="true">
        {GLYPHS[level]}
      </span>
      {AGGRO_LABELS[level]}
    </span>
  );
}
