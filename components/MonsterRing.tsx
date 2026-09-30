// The monster page header sprite: drawn at a whole-number scale inside a ring
// in the monster's element colour, with the element under it (owner's pick C,
// 30 Sep 2026, from public/draft/monster-hero). Replaces a fixed 64x64 box
// that squashed every sprite that was not square.

import { spriteSize } from '@/lib/sprite-scale';

const ELEMENT_COLOUR: Record<string, string> = {
  Neutral: '#C9C3E8',
  Water: '#3D9BFF',
  Earth: '#E0A64B',
  Fire: '#FF6A3D',
  Wind: '#5CFFB0',
  Poison: '#9BE34B',
  Holy: '#FFE9A3',
  Shadow: '#8A6BFF',
  Ghost: '#D7B8FF',
  Undead: '#B07CFF',
};

export default function MonsterRing({
  src,
  element,
  elementLevel,
}: {
  src: string;
  element: string | null;
  elementLevel: number | null;
}) {
  const size = spriteSize(src);
  const colour = (element && ELEMENT_COLOUR[element]) || '#8F86C4';
  return (
    <div className="monring" style={{ ['--el' as string]: colour }}>
      <img
        className="monring__sprite"
        src={src}
        alt=""
        width={size?.width ?? 96}
        height={size?.height ?? 96}
        style={size ? undefined : { objectFit: 'contain' }}
      />
      {element && (
        <span className="monring__badge">
          {element} {elementLevel ?? ''}
        </span>
      )}
    </div>
  );
}
