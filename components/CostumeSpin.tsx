'use client';
// The fitting room on a costume page, turnable (owner, 27 Oct 2026): a Novice
// wearing the costume on the dress room's stage, dragged round through all
// eight directions. Until the stage has drawn, and wherever it cannot load,
// the pre-drawn sheet picture stands in (it is in the server HTML, so the page
// still shows the costume at once). Only for items the dress room draws;
// components/CostumeFit keeps the still version for the rest.
import { useState } from 'react';
import { DEFAULT_LOOK, wear, type Look, type Sex } from '@/lib/dress-up/look';
import DressStage from '@/components/dressup/DressStage';
import '@/app/tools/dress-up/page.css';

// Quick views: the game direction (0 faces the viewer) and the sheet column it matches.
const VIEWS = [
  { th: 'ด้านหน้า', dir: 0, col: 0 },
  { th: 'เฉียง', dir: 1, col: 1 },
  { th: 'ด้านหลัง', dir: 4, col: 2 },
] as const;
const SEXES: [Sex, string][] = [['m', 'ชาย'], ['f', 'หญิง']];
// The stage fits a whole mount or cart; a Novice on foot fills it at about this.
const ZOOM = 1.6;

export default function CostumeSpin({ id, name, sheet, garment }: {
  id: number;
  name: string;
  /** the still picture: sheet url and one cell's size */
  sheet: { src: string; w: number; h: number };
  garment: boolean;
}) {
  const [sex, setSex] = useState<Sex>('m');
  // A garment is mostly hidden behind the body from the front.
  const [dir, setDir] = useState(garment ? 4 : 0);
  const [live, setLive] = useState(false);
  const look: Look = { ...wear({ ...DEFAULT_LOOK, sex }, id), dir };
  const col = VIEWS.find((v) => v.dir === dir)?.col ?? 0;

  return (
    <div className="cspin">
      <div className="cspin__box">
        <DressStage look={look} zoomable={false} startZoom={ZOOM} onTurn={setDir} onReady={() => setLive(true)} />
        {!live && (
          <span
            className="cspin__still"
            role="img"
            aria-label={`ตัวละคร Novice ใส่ ${name}`}
            style={{
              // The stage draws 200 game pixels across its width; match that.
              width: `${(sheet.w / 200) * 100 * ZOOM}%`,
              aspectRatio: `${sheet.w} / ${sheet.h}`,
              backgroundImage: `url(${sheet.src})`,
              backgroundSize: '300% 200%',
              backgroundPosition: `${col * 50}% ${sex === 'f' ? 100 : 0}%`,
            }}
          />
        )}
      </div>
      <p className="cspin__hint">↔ ลากที่ตัวละครเพื่อหมุนดูรอบตัว</p>
      <div className="cfit__ctrl">
        {VIEWS.map((v) => (
          <button key={v.dir} type="button" className="cfit__btn" aria-pressed={dir === v.dir} onClick={() => setDir(v.dir)}>
            {v.th}
          </button>
        ))}
        <span className="cfit__gap" aria-hidden="true" />
        {SEXES.map(([v, t]) => (
          <button key={v} type="button" className="cfit__btn cfit__btn--sex" aria-pressed={sex === v} onClick={() => setSex(v)}>
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}
