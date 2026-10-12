'use client';

// "แบกได้เท่าไหร่" (owner, 12 Oct 2026). Pick a class, STR and the weight
// skills, put things in the bag, and see the load against the two lines the
// game draws: 70% (natural HP/SP regen stops) and 90% (no attacks or skills).
//
// The everyday things are buttons; anything else comes from a search over
// every item the client gives a weight (data/item-weights.json, loaded only
// when the search is first used so the page stays light).

import { useEffect, useMemo, useState } from 'react';
import { useToolUse } from '@/lib/use-tool-use';
import { ATTACK_LINE, EWL_CLASSES, REGEN_LINE, load, roomUnder, weightCap } from '@/lib/weight-calc';

export interface WeightItem {
  id: number;
  name: string;
  weight: number;
}
interface Row extends WeightItem {
  qty: number;
}

const KEY = 'roz-calc:weight';

function num(v: number): string {
  return v.toLocaleString('en-US', { maximumFractionDigits: 1 });
}

interface Group {
  title: string;
  items: WeightItem[];
}

export default function WeightCalculator({ classes, groups, classItems }: {
  classes: { slug: string; name: string }[];
  groups: Group[];
  classItems: Record<string, WeightItem[]>;
}) {
  const [cls, setCls] = useState('merchant');
  const [str, setStr] = useState(1);
  const [ewl, setEwl] = useState(0);
  const [gym, setGym] = useState(0);
  // Read off the game's Weight line ("1247 / 2230"): what the character
  // already carries (gear and all), and the game's own cap when known.
  const [held, setHeld] = useState(0);
  const [gameCap, setGameCap] = useState(0);
  const [rows, setRows] = useState<Row[]>([]);
  const [ready, setReady] = useState(false);
  const [all, setAll] = useState<WeightItem[] | null>(null);
  const [query, setQuery] = useState('');

  // Remembered between visits in this browser only; the page works without it.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (classes.some((c) => c.slug === s.cls)) setCls(s.cls);
        if (Number.isFinite(s.str)) setStr(s.str);
        if (Number.isFinite(s.ewl)) setEwl(s.ewl);
        if (Number.isFinite(s.gym)) setGym(s.gym);
        if (Number.isFinite(s.held)) setHeld(s.held);
        if (Number.isFinite(s.gameCap)) setGameCap(s.gameCap);
        if (Array.isArray(s.rows)) setRows(s.rows.filter((r: Row) => Number.isFinite(r?.id) && Number.isFinite(r?.weight)).slice(0, 40));
      }
    } catch {
      // Private window or blocked storage: start empty.
    }
    setReady(true);
  }, [classes]);
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify({ cls, str, ewl, gym, held, gameCap, rows }));
    } catch {
      // Nothing to do: the numbers on screen are still right.
    }
  }, [ready, cls, str, ewl, gym, held, gameCap, rows]);

  useToolUse('weight', { cls, str, ewl, gym, items: rows.length }, ready);

  const cap = gameCap > 0 ? gameCap : weightCap({ cls, str, ewl, gym });
  const l = load(cap, held > 0 ? [{ weight: held, qty: 1 }, ...rows] : rows);
  const hasEwl = EWL_CLASSES.has(cls);

  function addItem(it: WeightItem, qty = 1) {
    setRows((prev) => {
      const at = prev.findIndex((r) => r.id === it.id);
      if (at >= 0) return prev.map((r, i) => (i === at ? { ...r, qty: r.qty + qty } : r));
      return [...prev, { ...it, qty }];
    });
    setQuery('');
  }
  const mine = classItems[cls] ?? [];
  const className = classes.find((c) => c.slug === cls)?.name ?? '';
  function setQty(id: number, qty: number) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, qty: Math.max(0, Math.min(99999, Math.floor(qty) || 0)) } : r)));
  }
  // Arrows and gemstones come by the hundred; everything else by ten.
  const big = (it: WeightItem) => (it.weight < 1 ? 100 : 10);
  function remove(id: number) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }
  async function wantAll() {
    if (all) return;
    const mod = await import('@/data/item-weights.json');
    const list = (mod.default as unknown as { items: [number, string, number][] }).items;
    setAll(list.map(([id, name, weight]) => ({ id, name, weight })));
  }

  const hits = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!all || q.length < 2) return [];
    const byId = /^\d+$/.test(q) ? Number(q) : null;
    // "Oridecon" should put Oridecon before Oridecon Hammer: exact, then
    // starts-with, then anywhere in the name.
    const rank = (n: string) => (n === q ? 0 : n.startsWith(q) ? 1 : 2);
    return all
      .filter((it) => (byId !== null ? it.id === byId : it.name.toLowerCase().includes(q)))
      .sort((a, b) => rank(a.name.toLowerCase()) - rank(b.name.toLowerCase()) || a.name.length - b.name.length)
      .slice(0, 12);
  }, [all, query]);

  const zone = !l.attack ? 'is-stop' : !l.regen ? 'is-heavy' : 'is-ok';
  const fill = Math.min(100, l.pct);

  return (
    <div className="wcalc">
      <section className="card wcalc__who" aria-labelledby="wcalc-who">
        <h2 id="wcalc-who" className="section-title">1 · แบกได้สูงสุด</h2>
        <div className="wcalc__fields">
          <label>
            <span>อาชีพ</span>
            <select value={cls} onChange={(e) => setCls(e.target.value)}>
              {classes.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            </select>
          </label>
          <label>
            <span>STR ที่ลงเอง</span>
            <input className="mono" type="number" inputMode="numeric" min={1} max={99} value={str}
              onChange={(e) => setStr(Math.max(1, Math.min(99, Math.floor(Number(e.target.value)) || 1)))} />
          </label>
          {hasEwl && (
            <label>
              <span>Enlarge Weight Limit</span>
              <select value={ewl} onChange={(e) => setEwl(Number(e.target.value))}>
                {Array.from({ length: 11 }, (_, i) => <option key={i} value={i}>{i === 0 ? 'ไม่ได้อัพ' : `Lv ${i} (+${i * 200})`}</option>)}
              </select>
            </label>
          )}
          <label>
            <span>Gym Membership Card</span>
            <select value={gym} onChange={(e) => setGym(Number(e.target.value))}>
              {Array.from({ length: 11 }, (_, i) => <option key={i} value={i}>{i === 0 ? 'ไม่ได้ใช้' : `${i} ใบ (+${i * 200})`}</option>)}
            </select>
          </label>
        </div>
        <div className="wcalc__game">
          <p className="wcalc__gtitle">ตัวเลขจากเกม (ไม่บังคับ) · ดูบรรทัด Weight ในหน้าต่างข้อมูลตัวละคร เช่น 1247 / 2230</p>
          <div className="wcalc__fields">
            <label>
              <span>ถืออยู่แล้ว (เลขหน้า /)</span>
              <input className="mono" type="number" inputMode="numeric" min={0} placeholder="0" value={held || ''}
                onChange={(e) => setHeld(Math.max(0, Math.min(99999, Math.floor(Number(e.target.value)) || 0)))} />
            </label>
            <label>
              <span>แบกได้ (เลขหลัง /)</span>
              <input className="mono" type="number" inputMode="numeric" min={0} placeholder="คิดจากข้างบน" value={gameCap || ''}
                onChange={(e) => setGameCap(Math.max(0, Math.min(99999, Math.floor(Number(e.target.value)) || 0)))} />
            </label>
          </div>
        </div>
        <p className="wcalc__cap">แบกได้ <b className="mono">{num(cap)}</b>{gameCap > 0 && <small className="muted"> (ตามเกม)</small>}</p>
        <p className="muted wcalc__note">STR จากอาชีพและจากของที่ใส่ไม่ช่วยเพิ่มน้ำหนัก นับเฉพาะที่ลงเอง · ยังไม่รวมรถเข็นของ Merchant ซึ่งแยกน้ำหนักต่างหาก</p>
      </section>

      <section className="card wcalc__bag" aria-labelledby="wcalc-bag">
        <h2 id="wcalc-bag" className="section-title">2 · ของที่ถือ</h2>
        {[...groups, ...(mine.length ? [{ title: `ของใช้ ${className}`, items: mine }] : [])].map((g) => (
          <div key={g.title} className="wcalc__group" role="group" aria-label={g.title}>
            <h3 className="wcalc__gtitle">{g.title}</h3>
            <div className="wcalc__quick">
              {g.items.map((it) => (
                <button key={it.id} type="button" className="wcalc__chip" onClick={() => addItem(it, big(it))}>
                  <img src={`/images/items/${it.id}.gif`} alt="" width={24} height={24} loading="lazy" />
                  <span>{it.name}<small className="mono">{num(it.weight)}</small></span>
                </button>
              ))}
            </div>
          </div>
        ))}
        <p className="muted wcalc__note">กดหนึ่งครั้งเพิ่ม 10 ชิ้น (ลูกธนูและของเบา 100) แล้วแก้จำนวนในรายการได้</p>
        <div className="wcalc__search">
          <input type="search" placeholder="ค้นของอื่น เช่น Oridecon" value={query} aria-label="ค้นไอเทม"
            onFocus={() => void wantAll()} onChange={(e) => setQuery(e.target.value)} />
          {hits.length > 0 && (
            <ul className="wcalc__hits">
              {hits.map((it) => (
                <li key={it.id}>
                  <button type="button" onClick={() => addItem(it)}>
                    <img src={`/images/items/${it.id}.gif`} alt="" width={24} height={24} loading="lazy" />
                    <span>{it.name} <small className="muted">#{it.id}</small></span>
                    <b className="mono">{num(it.weight)}</b>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {all && query.trim().length >= 2 && hits.length === 0 && <p className="muted wcalc__note">ไม่เจอของที่มีน้ำหนักในชื่อนี้</p>}
        </div>

        {rows.length > 0 ? (
          <ul className="wcalc__rows">
            {rows.map((r) => (
              <li key={r.id}>
                <img src={`/images/items/${r.id}.gif`} alt="" width={24} height={24} loading="lazy" />
                <span className="wcalc__name">{r.name}<small className="mono">ชิ้นละ {num(r.weight)}</small></span>
                <div className="wcalc__step">
                  {[-100, -10, -1].map((d) => (
                    <button key={d} type="button" aria-label={`ลด ${r.name} ${-d}`} onClick={() => setQty(r.id, r.qty + d)}>−{-d}</button>
                  ))}
                  <input className="mono" type="number" inputMode="numeric" min={0} aria-label={`จำนวน ${r.name}`} value={r.qty || ''} placeholder="0"
                    onChange={(e) => setQty(r.id, Number(e.target.value))} />
                  {[1, 10, 100].map((d) => (
                    <button key={d} type="button" aria-label={`เพิ่ม ${r.name} ${d}`} onClick={() => setQty(r.id, r.qty + d)}>+{d}</button>
                  ))}
                </div>
                <b className="mono wcalc__sub">{num((Math.round(r.weight * 10) * r.qty) / 10)}</b>
                <button type="button" className="wcalc__x" aria-label={`เอา ${r.name} ออก`} onClick={() => remove(r.id)}>×</button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted wcalc__empty">ยังไม่มีของ กดปุ่มด้านบนหรือค้นของเพื่อเริ่ม</p>
        )}
      </section>

      <section className={`card wcalc__out ${zone}`} aria-labelledby="wcalc-out" aria-live="polite">
        <h2 id="wcalc-out" className="section-title">3 · ผล</h2>
        <p className="wcalc__big">
          <b className="mono">{num(l.total)}</b> / {num(cap)} <span className="mono">({l.pct.toFixed(1)}%)</span>
        </p>
        <p className="muted wcalc__note">
          {held > 0
            ? `รวมของที่ถืออยู่แล้ว ${num(held)} (ของสวมใส่และของในกระเป๋า) กับของที่เลือก ${num(Math.round((l.total - held) * 10) / 10)}`
            : 'นับเฉพาะของที่เลือก ยังไม่รวมของสวมใส่และของอื่นที่ตัวละครถืออยู่ ใส่เลข "ถืออยู่แล้ว" จากเกมในข้อ 1 เพื่อให้ตรง'}
        </p>
        <div className="wcalc__bar" role="img" aria-label={`ถือ ${l.pct.toFixed(1)}% ของที่แบกได้`}>
          <i style={{ width: `${fill}%` }} />
          <span className="wcalc__line" style={{ left: `${REGEN_LINE}%` }}><em>70%</em></span>
          <span className="wcalc__line wcalc__line--stop" style={{ left: `${ATTACK_LINE}%` }}><em>90%</em></span>
        </div>
        <p className="wcalc__state">
          {!l.attack ? '✖ เกิน 90% ตีและใช้สกิลไม่ได้' : !l.regen ? '▲ เกิน 70% HP/SP หยุดฟื้นเอง' : '✔ ยังฟื้น HP/SP เองได้'}
        </p>
        <dl className="wcalc__nums">
          <div><dt>เหลือที่ว่าง</dt><dd className="mono">{num(l.left)}</dd></div>
          <div><dt>ก่อนถึง 70%</dt><dd className="mono">{num(Math.max(0, Math.round((cap * 0.7 - l.total) * 10) / 10))}</dd></div>
          <div><dt>ก่อนถึง 90%</dt><dd className="mono">{num(Math.max(0, Math.round((cap * 0.9 - l.total) * 10) / 10))}</dd></div>
        </dl>
        {rows.length > 0 && (
          <>
            <h3 className="wcalc__h3">ใส่เพิ่มได้อีกกี่ชิ้น</h3>
            <ul className="wcalc__room">
              {rows.map((r) => (
                <li key={r.id}>
                  <img src={`/images/items/${r.id}.gif`} alt="" width={20} height={20} loading="lazy" />
                  <span>{r.name}</span>
                  <span className="mono"><b>{num(roomUnder(cap, l.total, r.weight, REGEN_LINE))}</b> <small>ไม่ให้เกิน 70%</small></span>
                  <span className="mono"><b>{num(roomUnder(cap, l.total, r.weight, ATTACK_LINE))}</b> <small>ไม่ให้เกิน 90%</small></span>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
