// Monster page header art (owner, 1 Oct 2026, from public/draft/monster-arcade).
//
// An ordinary monster is a collectible card framed in its element's colour
// (pick C + "frame by element"), a red AGGRO stamp when it attacks first,
// and a foil sweep. A boss (MVP or mini-boss) gets the "boss intro" stage
// instead (pick A): the sprite on a lit grid floor with a WARNING strip.
// The card repeats three headline numbers; the stat block below stays the
// reference.

import { spriteSize } from '@/lib/sprite-scale';
import { ELEMENT_COLOUR, ELEMENT_COLOUR_UNKNOWN } from '@/lib/element-colour';

const fmt = (n: number | null | undefined) => (n && n > 0 ? n.toLocaleString('en-US') : '—');

export function MonsterCard({
  name,
  level,
  src,
  element,
  elementLevel,
  typeLine,
  hp,
  atk,
  def,
  aggressive,
}: {
  name: string;
  level: number;
  src: string | null;
  element: string | null;
  elementLevel: number | null;
  typeLine: string;
  hp: number | null;
  atk: number | null;
  def: number | null;
  aggressive: boolean;
}) {
  const size = spriteSize(src, 186);
  const colour = (element && ELEMENT_COLOUR[element]) || ELEMENT_COLOUR_UNKNOWN;
  return (
    <div className="moncard2" style={{ ['--el' as string]: colour }}>
      <div className="moncard2__in">
        <div className="moncard2__top">
          <span className="moncard2__name">{name}</span>
          <b>LV {level}</b>
        </div>
        <div className="moncard2__art">
          {src && (
            <img
              src={src}
              alt=""
              width={size?.width ?? 120}
              height={size?.height ?? 120}
              style={size ? undefined : { objectFit: 'contain' }}
            />
          )}
          {element && (
            <span className="moncard2__el">
              ◆ {element} {elementLevel ?? ''}
            </span>
          )}
          {aggressive && <span className="moncard2__stamp">AGGRO</span>}
        </div>
        <p className="moncard2__type">{typeLine}</p>
        <div className="moncard2__stats">
          <div>HP<b>{fmt(hp)}</b></div>
          <div>ATK<b>{fmt(atk)}</b></div>
          <div>DEF<b>{def != null ? def : '—'}</b></div>
        </div>
      </div>
      <span className="moncard2__foil" aria-hidden="true" />
    </div>
  );
}

export function BossStage({
  src,
  element,
  elementLevel,
  aggressive,
  label,
}: {
  src: string | null;
  element: string | null;
  elementLevel: number | null;
  aggressive: boolean;
  label: string;
}) {
  const size = spriteSize(src, 230);
  const colour = (element && ELEMENT_COLOUR[element]) || ELEMENT_COLOUR_UNKNOWN;
  return (
    <div className="bossstage" style={{ ['--el' as string]: colour }}>
      <span className="bossstage__floor" aria-hidden="true" />
      <span className="bossstage__warn">{aggressive ? '⚠ WARNING · ' : ''}{label}</span>
      {src && (
        <img
          className="bossstage__sprite"
          src={src}
          alt=""
          width={size?.width ?? 150}
          height={size?.height ?? 150}
          style={size ? undefined : { objectFit: 'contain' }}
        />
      )}
      {element && (
        <span className="bossstage__el">
          ◆ {element} {elementLevel ?? ''}
        </span>
      )}
    </div>
  );
}
