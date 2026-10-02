// "Fitting room" on a costume page (owner, 2 Oct 2026): a Novice wearing the
// costume in three mirrors -- front, three-quarter, back, all at once (the
// owner picked layout E of five) -- with a male / female switch. Not a
// simulator: every picture is pre-drawn into one sheet (lib/costume-fit), and
// the radio only moves the sheet through CSS :has() -- no client JS.

import { costumeFit } from '@/lib/costume-fit';

const DIRS = ['หน้า', 'เฉียง', 'หลัง'] as const;
const SEXES = [
  ['m', 'ชาย'],
  ['f', 'หญิง'],
] as const;

// Whole-number scales keep the pixels square. Desktop: up to 3x while three
// mirrors still fit a ~1,100px row; phone: each mirror is about 100px wide.
const scale = (w: number, room: number, max: number) => Math.max(1, Math.min(max, Math.floor(room / w)));

export default function CostumeFit({ id, name }: { id: number; name: string }) {
  const fit = costumeFit(id);
  if (!fit) return null;
  const { w, h } = fit.sheet;
  const vars = {
    ['--w' as string]: w,
    ['--h' as string]: h,
    ['--sd' as string]: scale(w, 340, 3),
    ['--sp' as string]: scale(w, 100, 2),
  };
  return (
    <section className="cfit" style={vars} aria-label={`ตัวอย่างตอนใส่ ${name}`}>
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
      <p className="cfit__label">▶ FITTING ROOM · 3 ด้าน</p>
      <div className="cfit__mirrors">
        {DIRS.map((label, c) => (
          <figure key={label} className="cfit__mirror">
            <div className="cfit__stage">
              <span
                className="cfit__img"
                role="img"
                aria-label={`ตัวละคร Novice ใส่ ${name} ด้าน${label}`}
                style={{ backgroundImage: `url(${fit.src})`, ['--c' as string]: c }}
              />
            </div>
            <figcaption>{label}</figcaption>
          </figure>
        ))}
      </div>
      <div className="cfit__ctrl">
        {SEXES.map(([v, t]) => (
          <label key={v} htmlFor={`cfit-s-${id}-${v}`} className="cfit__btn" data-v={v}>
            {t}
          </label>
        ))}
        <p className="cfit__note">ภาพจากไฟล์ในเกม ใส่บนตัว Novice ทรงผมเริ่มต้น</p>
      </div>
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
