// The monster page header sprite: drawn at a whole-number scale inside a ring
// in the monster's element colour, with the element under it (owner's pick C,
// 30 Sep 2026, from public/draft/monster-hero). Replaces a fixed 64x64 box
// that squashed every sprite that was not square.

import { spriteSize } from '@/lib/sprite-scale';
import { ELEMENT_COLOUR, ELEMENT_COLOUR_UNKNOWN } from '@/lib/element-colour';


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
  const colour = (element && ELEMENT_COLOUR[element]) || ELEMENT_COLOUR_UNKNOWN;
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
