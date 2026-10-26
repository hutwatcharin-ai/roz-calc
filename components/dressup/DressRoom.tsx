'use client';
// Holds the look and lays out the stage beside the picker.
import { useState } from 'react';
import { DEFAULT_LOOK, type Look } from '@/lib/dress-up/look';
import DressPicker from './DressPicker';
import DressStage from './DressStage';

export default function DressRoom({ names, costume, classNames, initial = DEFAULT_LOOK }: {
  names: Record<string, string>;
  costume: number[];
  classNames: Record<string, string>;
  initial?: Look;
}) {
  const [look, setLook] = useState<Look>(initial);
  return (
    <div className="dress">
      <div className="dress__stagewrap">
        <p className="cfit__label">▶ DRESS ROOM</p>
        <DressStage look={look} onTurn={(dir) => setLook((l) => ({ ...l, dir }))} />
        <p className="dress__hint">↔ ลากที่ตัวละครเพื่อหมุน</p>
      </div>
      <DressPicker look={look} onChange={setLook} names={names} costume={costume} classNames={classNames} />
    </div>
  );
}
