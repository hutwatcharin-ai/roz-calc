'use client';
// Holds the look and lays out the stage beside the picker, with the backdrop
// switch under the stage (remembered in this browser).
import { useEffect, useState } from 'react';
import { DEFAULT_LOOK, type Look } from '@/lib/dress-up/look';
import DressPicker from './DressPicker';
import DressStage from './DressStage';

const SCENES = [
  { id: 'neon', th: 'นีออน' },
  { id: 'grass', th: 'ทุ่งหญ้า' },
  { id: 'prontera', th: 'พรอนเทร่า' },
  { id: 'studio', th: 'สตูดิโอ' },
] as const;
const SCENE_KEY = 'dress-up:scene';

export default function DressRoom({ names, costume, classNames, initial = DEFAULT_LOOK }: {
  names: Record<string, string>;
  costume: number[];
  classNames: Record<string, string>;
  initial?: Look;
}) {
  const [look, setLook] = useState<Look>(initial);
  const [scene, setScene] = useState<string>('neon');
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SCENE_KEY);
      if (saved && SCENES.some((x) => x.id === saved)) setScene(saved);
    } catch { /* storage blocked: keep the default */ }
  }, []);
  const pickScene = (id: string) => {
    setScene(id);
    try { localStorage.setItem(SCENE_KEY, id); } catch { /* not remembered */ }
  };
  return (
    <div className="dress">
      <div className="dress__stagewrap">
        <p className="cfit__label">▶ DRESS ROOM</p>
        <DressStage look={look} scene={scene} onTurn={(dir) => setLook((l) => ({ ...l, dir }))} />
        <p className="dress__hint">↔ ลากที่ตัวละครเพื่อหมุน · หมุนล้อเมาส์หรือถ่างสองนิ้วเพื่อซูม</p>
        <div className="dress__scenes" role="group" aria-label="ฉากหลัง">
          <span className="dress__scenelabel">ฉาก</span>
          {SCENES.map((x) => (
            <button key={x.id} type="button" className="dress__chip" aria-pressed={scene === x.id} onClick={() => pickScene(x.id)}>
              {x.th}
            </button>
          ))}
        </div>
      </div>
      <DressPicker look={look} onChange={setLook} names={names} costume={costume} classNames={classNames} />
    </div>
  );
}
