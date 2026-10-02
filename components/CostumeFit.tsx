// "Fitting room" on a costume page (owner, 2 Oct 2026): a Novice wearing the
// costume, front / three-quarter / back, male / female. Not a simulator:
// every picture is pre-drawn into one sheet (lib/costume-fit), and the radios
// only move the sheet through CSS :has() -- no client JS.

import { costumeFit } from '@/lib/costume-fit';

const DIRS = [
  ['front', 'ด้านหน้า'],
  ['diag', 'เฉียง'],
  ['back', 'ด้านหลัง'],
] as const;
const SEXES = [
  ['m', 'ชาย'],
  ['f', 'หญิง'],
] as const;

export default function CostumeFit({ id, name }: { id: number; name: string }) {
  const fit = costumeFit(id);
  if (!fit) return null;
  const { w, h, garment, head } = fit.sheet;
  // A garment is mostly hidden behind the body from the front.
  const startDir = garment ? 'back' : 'front';
  const vars = { ['--w' as string]: w, ['--h' as string]: h, ['--hd' as string]: head ?? 0 };
  return (
    <section className="cfit" style={vars} aria-label={`ตัวอย่างตอนใส่ ${name}`}>
      {DIRS.map(([v], i) => (
        <input
          key={v}
          type="radio"
          className={`cfit__d${i}`}
          name={`cfit-d-${id}`}
          id={`cfit-d-${id}-${v}`}
          defaultChecked={v === startDir}
        />
      ))}
      {SEXES.map(([v], i) => (
        <input
          key={v}
          type="radio"
          className={`cfit__s${i}`}
          name={`cfit-s-${id}`}
          id={`cfit-s-${id}-${v}`}
          defaultChecked={v === 'm'}
        />
      ))}
      <p className="cfit__label">▶ FITTING ROOM</p>
      <div className="cfit__stage">
        <span
          className="cfit__img"
          role="img"
          aria-label={`ตัวละคร Novice ใส่ ${name}`}
          style={{ backgroundImage: `url(${fit.src})` }}
        />
        {fit.headSrc && (
          <span className="cfit__head" aria-hidden="true" style={{ backgroundImage: `url(${fit.headSrc})` }}>
            <small>ZOOM</small>
          </span>
        )}
      </div>
      <div className="cfit__ctrl">
        {DIRS.map(([v, t]) => (
          <label key={v} htmlFor={`cfit-d-${id}-${v}`} className="cfit__btn" data-v={v}>
            {t}
          </label>
        ))}
        <span className="cfit__gap" aria-hidden="true" />
        {SEXES.map(([v, t]) => (
          <label key={v} htmlFor={`cfit-s-${id}-${v}`} className="cfit__btn" data-v={v}>
            {t}
          </label>
        ))}
      </div>
      <p className="cfit__note">ภาพจากไฟล์ในเกม ใส่บนตัว Novice ทรงผมเริ่มต้น</p>
    </section>
  );
}

/** Small picture for a list tile: the head close-up for headgear, the back
 *  of the body for a garment, fitted into the tile's 48px plinth (the outer
 *  span takes the plinth styles the list gives every tile's first child). */
export function CostumeThumb({ id }: { id: number }) {
  const fit = costumeFit(id);
  if (!fit) return null;
  const { w, h, garment, head } = fit.sheet;
  const BOX = 48;
  const useHead = !garment && fit.headSrc && head;
  const cw = useHead ? head : w;
  const ch = useHead ? head : h;
  const s = Math.min(BOX / cw, BOX / ch);
  const col = useHead ? 0 : 2; // head close-up from the front, garment from behind
  return (
    <span className="cthumb" aria-hidden="true">
      <span
        style={{
          backgroundImage: `url(${useHead ? fit.headSrc : fit.src})`,
          width: Math.round(cw * s),
          height: Math.round(ch * s),
          backgroundSize: `${Math.round(cw * s * 3)}px ${Math.round(ch * s * 2)}px`,
          backgroundPosition: `${-Math.round(cw * s * col)}px 0`,
        }}
      />
    </span>
  );
}
