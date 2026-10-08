'use client';

// The arrow-crafting guide as a tool (owner, 8 Oct 2026: "easier to use").
//
// Making Arrow turns one item into a stack of arrows, and players come with
// one of two questions: "I want Fire Arrows -- what do I burn?" or "I have a
// bag of Tree Roots -- what do they make?". The old page was one long table
// sorted by material, which answers the second only by scrolling. This shows
// the 21 arrows as picture tiles (filterable by element), the materials for
// the chosen arrow ranked by arrows per item, and a search that works for
// either name.

import { useMemo, useState } from 'react';
import Link from 'next/link';

export interface ArrowRecipe {
  arrow: { id: number; name: string; icon: string; element: string | null };
  material: { id: number; name: string; icon: string; href: string };
  amount: number;
  confirmed: boolean;
}

const ELEMENT_TH: Record<string, string> = {
  neutral: 'ไร้ธาตุ', water: 'น้ำ', earth: 'ดิน', fire: 'ไฟ', wind: 'ลม', poison: 'พิษ', holy: 'ศักดิ์สิทธิ์', shadow: 'มืด', ghost: 'ผี', undead: 'อันเดด',
};
// Status arrows are neutral; their point is the status, so they get a word.
const STATUS_TH: Record<string, string> = {
  'Silence Arrow': 'ใบ้', 'Sleep Arrow': 'หลับ', 'Stun Arrow': 'สตัน', 'Flash Arrow': 'ตาบอด', 'Cursed Arrow': 'คำสาป', 'Frozen Arrow': 'แช่แข็ง', 'Poison Arrow': 'พิษ',
};

export default function ArrowCrafter({ recipes }: { recipes: ArrowRecipe[] }) {
  const [mode, setMode] = useState<'arrow' | 'item'>('arrow');
  const [element, setElement] = useState('');
  const [pick, setPick] = useState<number | null>(null);
  const [q, setQ] = useState('');

  const arrows = useMemo(() => {
    const m = new Map<number, { arrow: ArrowRecipe['arrow']; rows: ArrowRecipe[] }>();
    for (const r of recipes) {
      const e = m.get(r.arrow.id) ?? { arrow: r.arrow, rows: [] };
      e.rows.push(r);
      m.set(r.arrow.id, e);
    }
    return [...m.values()]
      .map((a) => ({ ...a, rows: a.rows.sort((x, y) => Number(y.confirmed) - Number(x.confirmed) || y.amount - x.amount) }))
      .sort((a, b) => a.arrow.name.localeCompare(b.arrow.name));
  }, [recipes]);
  const elements = [...new Set(arrows.map((a) => a.arrow.element ?? 'neutral'))];
  const shown = arrows.filter((a) => !element || (a.arrow.element ?? 'neutral') === element);
  const chosen = arrows.find((a) => a.arrow.id === pick) ?? null;

  // "I have this": materials matching the search, each with everything it makes.
  const needle = q.trim().toLowerCase();
  const byMaterial = useMemo(() => {
    const m = new Map<number, { material: ArrowRecipe['material']; rows: ArrowRecipe[] }>();
    for (const r of recipes) {
      const e = m.get(r.material.id) ?? { material: r.material, rows: [] };
      e.rows.push(r);
      m.set(r.material.id, e);
    }
    return [...m.values()].sort((a, b) => a.material.name.localeCompare(b.material.name));
  }, [recipes]);
  const found = needle ? byMaterial.filter((m) => m.material.name.toLowerCase().includes(needle)).slice(0, 30) : [];

  return (
    <div className="arrowtool">
      <div className="arrowtool__modes" role="tablist">
        <button type="button" role="tab" aria-selected={mode === 'arrow'} className={mode === 'arrow' ? 'is-on' : undefined} onClick={() => setMode('arrow')}>
          อยากได้ลูกศรแบบไหน
        </button>
        <button type="button" role="tab" aria-selected={mode === 'item'} className={mode === 'item' ? 'is-on' : undefined} onClick={() => setMode('item')}>
          มีของชิ้นนี้ ทำอะไรได้
        </button>
      </div>

      {mode === 'arrow' ? (
        <>
          <div className="chips arrowtool__els">
            <button type="button" className={`chip${element === '' ? ' chip--on' : ''}`} onClick={() => setElement('')}>ทุกธาตุ</button>
            {elements.map((e) => (
              <button key={e} type="button" className={`chip el-${e}${element === e ? ' chip--on' : ''}`} onClick={() => setElement(e)}>{ELEMENT_TH[e] ?? e}</button>
            ))}
          </div>
          <ul className="arrowtool__grid">
            {shown.map((a) => (
              <li key={a.arrow.id}>
                <button type="button" className={`arrowtile${pick === a.arrow.id ? ' is-on' : ''}`} onClick={() => setPick(a.arrow.id)} aria-pressed={pick === a.arrow.id}>
                  <Icon src={a.arrow.icon} size={32} />
                  <b>{a.arrow.name.replace(/ Arrow$/, '')}</b>
                  <small className={`el-${a.arrow.element ?? 'neutral'}`}>
                    {STATUS_TH[a.arrow.name] ? `ติด${STATUS_TH[a.arrow.name]}` : ELEMENT_TH[a.arrow.element ?? 'neutral']}
                  </small>
                </button>
              </li>
            ))}
          </ul>

          {chosen ? (
            <section className="arrowtool__panel" aria-live="polite">
              <h2 className="arrowtool__h">
                <Icon src={chosen.arrow.icon} size={32} />
                {chosen.arrow.name} ทำจากอะไรได้บ้าง
                <span className="muted"> · {chosen.rows.length} อย่าง เรียงจากได้ลูกศรต่อชิ้นมากสุด</span>
              </h2>
              <MaterialList rows={chosen.rows} />
            </section>
          ) : (
            <p className="arrowtool__hint">กดลูกศรที่อยากได้ แล้วจะบอกว่าใช้ของอะไรทำ และของชิ้นไหนได้ลูกศรเยอะสุด</p>
          )}
        </>
      ) : (
        <>
          <label className="arrowtool__search">
            <span>ชื่อของในกระเป๋า (ภาษาอังกฤษ)</span>
            <input type="search" value={q} placeholder="เช่น Tree Root, Iron, Feather" onChange={(e) => setQ(e.target.value)} autoFocus />
          </label>
          {needle && found.length === 0 && <p className="arrowtool__hint">ไม่มีของชื่อนี้ในสูตรทำลูกศร</p>}
          {!needle && <p className="arrowtool__hint">พิมพ์ชื่อของ แล้วจะบอกว่าของ 1 ชิ้นทำลูกศรอะไรได้กี่ดอก ({byMaterial.length} อย่างที่ใช้ได้)</p>}
          <ul className="arrowtool__found">
            {found.map((m) => (
              <li key={m.material.id} className="arrowtool__panel">
                <Link href={m.material.href} className="arrowtool__mat">
                  <Icon src={m.material.icon} size={28} />
                  {m.material.name}
                </Link>
                <span className="arrowtool__gives">1 ชิ้นได้</span>
                <ul className="arrowtool__outs">
                  {m.rows.map((r) => (
                    <li key={r.arrow.id}>
                      <Icon src={r.arrow.icon} size={24} />
                      {r.arrow.name} <b className="mono">×{r.amount}</b>
                      {!r.confirmed && <span className="arrowtool__unsure" title="มีแหล่งเดียว ยังยืนยันกับ Zero ไม่ได้">ยังไม่ยืนยัน</span>}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

/** An item icon; 22 of the 135 materials have none on the site, and a broken-image box reads as an error. */
function Icon({ src, size }: { src: string; size: number }) {
  return <img src={src} alt="" width={size} height={size} loading="lazy" onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} />;
}

function MaterialList({ rows }: { rows: ArrowRecipe[] }) {
  const top = Math.max(...rows.map((r) => r.amount));
  return (
    <ul className="arrowtool__mats">
      {rows.map((r) => (
        <li key={r.material.id}>
          <Link href={r.material.href} className="arrowtool__mat">
            <Icon src={r.material.icon} size={28} />
            {r.material.name}
          </Link>
          <span className="arrowtool__bar"><i style={{ width: `${(r.amount / top) * 100}%` }} /></span>
          <b className="mono">×{r.amount}</b>
          <a className="arrowtool__drop" href={`/drop-finder?q=${encodeURIComponent(r.material.name)}`}>หาที่ดรอป</a>
          {!r.confirmed && <span className="arrowtool__unsure" title="มีแหล่งเดียว ยังยืนยันกับ Zero ไม่ได้">ยังไม่ยืนยัน</span>}
        </li>
      ))}
    </ul>
  );
}
