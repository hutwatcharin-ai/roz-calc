'use client';

import Link from 'next/link';
import { useCharacterContext } from '@/components/CharacterContextProvider';

// One-click prefill for the hit-flee tool: the character bar already holds
// Lv/HIT/FLEE, so an empty form should not make the player retype them.
// A link (not auto-fill) keeps the page shareable and the choice explicit.
export default function HitFleePrefill() {
  const { character, ready } = useCharacterContext();
  if (!ready || !character || character.hit == null || character.flee == null) return null;
  return (
    <p style={{ marginTop: 10 }}>
      <Link
        className="chiplink"
        href={`/tools/hit-flee?lv=${character.level}&hit=${character.hit}&flee=${character.flee}`}
      >
        ใช้ค่าตัวละครของคุณ (Lv.{character.level} · HIT {character.hit} · FLEE {character.flee})
      </Link>
    </p>
  );
}
