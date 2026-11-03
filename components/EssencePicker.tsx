// Class essences on /tools/enchant (owner, 3 Nov 2026): tap a class, see every
// essence it can roll on its armour. Data: data/essences.json, the game's Thai
// item text split by scripts/build-essences.py.
//
// The tabs are radio inputs and CSS, not state: every class's panel is in the
// HTML, so a search engine and a phone with scripts off both get all of it.
import Link from 'next/link';
import file from '@/data/essences.json';
import { itemHref } from '@/lib/item-href';

interface Part { kind: 'base' | 'class' | 'refine'; text: string }
interface Essence { id: number; name: string; cls: string; variant: 'I' | 'II'; lv: number; icon: string | null; parts: Part[] }
interface Cls { key: string; label: string; job: number }

const { classes, essences } = file as unknown as { classes: Cls[]; essences: Essence[] };

// Job pictures in public/images/jobs; the client spells Swordman, the file Swordsman.
const JOB_IMG: Record<string, string> = { swordman: 'swordsman' };

const TAG: Record<Part['kind'], string | null> = { base: null, class: 'อาชีพสายตรง', refine: 'ตีบวกเสื้อ' };

function Card({ e }: { e: Essence }) {
  return (
    <article className="ess__card">
      <header className="ess__head">
        {e.icon && <img src={e.icon} alt="" width={24} height={24} loading="lazy" />}
        <Link href={itemHref(e.id, null)}>{e.name}</Link>
        <span className={`ess__lv ess__lv--${e.lv}`}>Lv.{e.lv}</span>
      </header>
      <ul className="ess__parts">
        {e.parts.map((p, i) => (
          <li key={i} className={`ess__part ess__part--${p.kind}`}>
            {TAG[p.kind] && <span className="ess__tag">{TAG[p.kind]}</span>}
            {p.text}
          </li>
        ))}
      </ul>
    </article>
  );
}

export default function EssencePicker() {
  const css = classes
    .map((c) => `#ess-${c.key}:checked~.ess__panels .ess__panel--${c.key}{display:block}` +
      `#ess-${c.key}:checked~.ess__chips label[for=ess-${c.key}]{border-color:var(--yellow);color:var(--yellow);background:#221a05;box-shadow:0 0 12px rgba(255,229,61,.4)}` +
      `#ess-${c.key}:focus-visible~.ess__chips label[for=ess-${c.key}]{outline:2px solid var(--cyan);outline-offset:2px}`)
    .join('');
  return (
    <div className="ess">
      <style>{css}</style>
      {classes.map((c, i) => (
        <input key={c.key} type="radio" name="ess-cls" id={`ess-${c.key}`} className="ess__radio" defaultChecked={i === 0} />
      ))}
      <div className="ess__chips">
        {[1, 2].map((job) => (
          <div key={job} className="ess__row">
            <span className="ess__rowlabel">อาชีพ {job}</span>
            {classes.filter((c) => c.job === job).map((c) => (
              <label key={c.key} htmlFor={`ess-${c.key}`} className="ess__chip">
                <img src={`/images/jobs/${JOB_IMG[c.key] ?? c.key}.png`} alt="" width={24} height={24} loading="lazy" />
                {c.label}
              </label>
            ))}
          </div>
        ))}
      </div>
      <div className="ess__panels">
        {classes.map((c) => {
          const mine = essences.filter((e) => e.cls === c.key);
          const variants = [...new Set(mine.map((e) => e.variant))];
          return (
            <section key={c.key} className={`ess__panel ess__panel--${c.key}`} aria-label={`Essence ${c.label}`}>
              <div className={variants.length > 1 ? 'ess__cols' : undefined}>
                {variants.map((v) => (
                  <div key={v} className="ess__col">
                    {variants.length > 1 && <h4 className="ess__coltitle">แบบ {v}</h4>}
                    {mine.filter((e) => e.variant === v).map((e) => <Card key={e.id} e={e} />)}
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
