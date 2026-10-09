'use client';

// The crafting calculator a recipe guide wraps its recipes in (owner, 9 Oct
// 2026). Each recipe card gets a quantity control (RecipeQty); a bar pinned to
// the bottom of the screen adds everything up with lib/craft-calc and says
// where each material comes from. The guide page decides what is special
// about its kind -- success rates per skill level, a per-try item, a chain of
// intermediates -- and passes it in as plain data.
//
// One basket for every page (owner, 9 Oct 2026): picks live under a single
// browser key, so dishes picked on /guides/cooking and Steel picked on
// /guides/ore-refining add up together on /guides/craft-basket, which renders
// this same component with `inline`. Each page's bar sums only its own
// recipes and links to the basket. Page options (the ore chain switch, skill
// levels) stay per page. Storage is a convenience; it all works without it.

import Link from 'next/link';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import './craft-calc.css';
import ItemIcon from '@/components/ItemIcon';
import QtyStepper, { QTY_PRESETS } from './QtyStepper';
import MaterialRow from './MaterialRow';
import { planCraft, type CalcMat, type CalcRecipe } from '@/lib/craft-calc';
import type { MaterialSource } from '@/lib/material-sources';

export interface SkillRates {
  skillId: number;
  name: string;
  /** Success % per skill level, index 0 = Lv 1. */
  rates: number[];
}

export interface CraftCalcConfig {
  /** localStorage key for this page's options. */
  id: string;
  recipes: CalcRecipe[];
  /** Intermediates the reader may make instead of farming (ore recipes). */
  chain?: CalcRecipe[];
  /** Offer the "make the intermediates too" switch, and its label. */
  expandLabel?: string;
  expandDefault?: boolean;
  /** Recipes whose skill has a known success rate per level. */
  skillRates?: SkillRates[];
  /** Spent once per try of each picked recipe (Mortar Bowl)... */
  perTry?: CalcMat[];
  /** ...or only of these recipes, when given. */
  perTryIds?: string[];
  /** What the panel says when a rate is unknown. */
  unknownRateNote?: string;
  /** Which guide each recipe id is on, for the basket page's links. */
  pageOf?: Record<string, { href: string; label: string }>;
  sources: Record<number, MaterialSource>;
}

export const BASKET_KEY = 'craftcalc:basket';
export const BASKET_HREF = '/guides/craft-basket';
const BASKET_EVENT = 'craftcalc:basket';

function readBasket(): Record<string, number> {
  try {
    const v = JSON.parse(localStorage.getItem(BASKET_KEY) ?? 'null');
    return v && typeof v === 'object' ? v : {};
  } catch {
    return {};
  }
}
function writeBasket(picks: Record<string, number>) {
  try {
    localStorage.setItem(BASKET_KEY, JSON.stringify(picks));
    window.dispatchEvent(new Event(BASKET_EVENT));
  } catch {}
}

interface Ctx {
  picks: Record<string, number>;
  setPick: (id: string, n: number) => void;
}

const CalcContext = createContext<Ctx | null>(null);

export function RecipeQty({ id, name }: { id: string; name: string }) {
  const ctx = useContext(CalcContext);
  if (!ctx) return null;
  const n = ctx.picks[id] ?? 0;
  return (
    <div className={'rqty' + (n ? ' is-on' : '')}>
      {n ? (
        <QtyStepper value={n} onChange={(v) => ctx.setPick(id, v)} label={name} />
      ) : (
        <button type="button" className="rqty__add" onClick={() => ctx.setPick(id, 1)}>
          + คำนวณวัตถุดิบ
        </button>
      )}
    </div>
  );
}

export default function CraftCalc({ config, children, inline = false }: { config: CraftCalcConfig; children?: React.ReactNode; inline?: boolean }) {
  const [picks, setPicks] = useState<Record<string, number>>({});
  const [expand, setExpand] = useState(config.expandDefault ?? false);
  const [levels, setLevels] = useState<Record<number, number>>(() =>
    Object.fromEntries((config.skillRates ?? []).map((s) => [s.skillId, s.rates.length])),
  );
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const key = `craftcalc:${config.id}`;

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(key) ?? 'null');
      if (saved && typeof saved === 'object') {
        if (typeof saved.expand === 'boolean') setExpand(saved.expand);
        if (saved.levels) setLevels((l) => ({ ...l, ...saved.levels }));
        // Picks saved per page before the shared basket: fold them in once.
        if (saved.picks && Object.keys(saved.picks).length) {
          writeBasket({ ...saved.picks, ...readBasket() });
          localStorage.setItem(key, JSON.stringify({ expand: saved.expand, levels: saved.levels }));
        }
      }
    } catch {}
    const sync = () => setPicks(readBasket());
    sync();
    setReady(true);
    window.addEventListener(BASKET_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(BASKET_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, [key]);

  const saveOpts = (next: { expand?: boolean; levels?: Record<number, number> }) => {
    try {
      localStorage.setItem(key, JSON.stringify({ expand, levels, ...next }));
    } catch {}
  };
  const setPick = (id: string, n: number) => {
    const next = { ...readBasket(), ...picks };
    if (n > 0) next[id] = n;
    else delete next[id];
    setPicks(next);
    writeBasket(next);
  };

  const byId = useMemo(() => new Map([...config.recipes, ...(config.chain ?? [])].map((r) => [r.id, r])), [config]);
  const rateBySkill = useMemo(() => {
    const m = new Map<number, number>();
    for (const s of config.skillRates ?? []) m.set(s.skillId, s.rates[(levels[s.skillId] ?? s.rates.length) - 1]);
    return m;
  }, [config.skillRates, levels]);
  const perTryIds = useMemo(() => (config.perTryIds ? new Set(config.perTryIds) : null), [config.perTryIds]);

  const plan = useMemo(
    () =>
      planCraft({
        picks,
        recipes: config.recipes,
        chain: config.chain,
        expand: config.chain ? expand : false,
        rateOf: (r) => (r.skillId != null ? (rateBySkill.get(r.skillId) ?? null) : null),
        perTry: (r) => (!perTryIds || perTryIds.has(r.id) ? (config.perTry ?? []) : []),
      }),
    [picks, config, expand, rateBySkill, perTryIds],
  );

  const pickedIds = Object.keys(picks).filter((id) => byId.has(id) && picks[id] > 0);
  const count = pickedIds.reduce((s, id) => s + picks[id], 0);
  const elsewhere = Object.keys(picks).filter((id) => !byId.has(id) && picks[id] > 0).length;
  // Only the skills that this plan actually uses get a level picker.
  const usedSkills = (config.skillRates ?? []).filter((s) => plan.steps.some((st) => st.recipe.skillId === s.skillId));
  const intermediates = plan.steps.filter((s) => !s.picked);

  const panel = (
    <div className={inline ? 'ccpage' : 'ccbar__panel'}>
      <section>
        <h3 className="ccbar__h">ที่จะทำ</h3>
        <ul className="ccbar__picks">
          {pickedIds.map((id) => {
            const r = byId.get(id)!;
            const page = config.pageOf?.[id];
            return (
              <li key={id}>
                <span className="ccbar__prod">
                  <ItemIcon iconUrl={r.product.icon ?? null} category={r.product.category ?? null} size={24} />
                  <span>
                    {r.product.name}
                    {page && (
                      <Link href={page.href} className="ccbar__from">
                        {page.label}
                      </Link>
                    )}
                  </span>
                </span>
                <QtyStepper value={picks[id]} onChange={(v) => setPick(id, v)} label={r.product.name} presets={QTY_PRESETS.slice(1)} />
                <button type="button" className="ccbar__x" onClick={() => setPick(id, 0)} aria-label={`เอา ${r.product.name} ออก`}>
                  ×
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {(config.chain && config.expandLabel) || usedSkills.length > 0 ? (
        <section className="ccbar__opts">
          {config.chain && config.expandLabel && (
            <label className="ccbar__switch">
              <input
                type="checkbox"
                checked={expand}
                onChange={(e) => {
                  setExpand(e.target.checked);
                  saveOpts({ expand: e.target.checked });
                }}
              />
              {config.expandLabel}
            </label>
          )}
          {usedSkills.map((s) => (
            <label key={s.skillId} className="ccbar__lv">
              {s.name}
              <select
                value={levels[s.skillId]}
                onChange={(e) => {
                  const next = { ...levels, [s.skillId]: Number(e.target.value) };
                  setLevels(next);
                  saveOpts({ levels: next });
                }}
              >
                {s.rates.map((v, i) => (
                  <option key={i} value={i + 1}>
                    Lv {i + 1} · สำเร็จ {v}%
                  </option>
                ))}
              </select>
            </label>
          ))}
        </section>
      ) : null}

      {plan.steps.some((s) => s.rate != null) && (
        <section>
          <h3 className="ccbar__h">ต้องกดทำกี่ครั้ง (เผื่อทำไม่ติด)</h3>
          <ul className="ccbar__steps">
            {plan.steps.map((s) => (
              <li key={s.recipe.id}>
                <ItemIcon iconUrl={s.recipe.product.icon ?? null} category={s.recipe.product.category ?? null} size={20} />
                {s.recipe.product.name} ×{s.want.toLocaleString('en-US')}
                <span>
                  {s.rate != null ? (
                    <>
                      สำเร็จ {s.rate}% · กดราว <b>{s.tries.toLocaleString('en-US')}</b> ครั้ง
                    </>
                  ) : (
                    'ไม่รู้โอกาสสำเร็จ'
                  )}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
      {intermediates.length > 0 && plan.steps.every((s) => s.rate == null) && (
        <p className="muted ccbar__note">
          ทำเองด้วย: {intermediates.map((s) => `${s.recipe.product.name} ×${s.want.toLocaleString('en-US')}`).join(' · ')}
        </p>
      )}

      <section>
        <h3 className="ccbar__h">วัตถุดิบที่ต้องหา ({plan.raw.length} อย่าง)</h3>
        <ul className="mrows">
          {plan.raw.map((m) => (
            <MaterialRow key={m.id} {...m} source={config.sources[m.id]} />
          ))}
        </ul>
      </section>

      {plan.held.length > 0 && (
        <section>
          <h3 className="ccbar__h">ต้องมีติดตัว (ไม่หาย ใช้ชิ้นเดียว)</h3>
          <ul className="ccbar__held">
            {plan.held.map((m) => (
              <li key={m.id}>
                <ItemIcon iconUrl={m.icon ?? null} category={m.category ?? null} size={20} />
                {m.name}
              </li>
            ))}
          </ul>
        </section>
      )}

      {plan.unknownRate && config.unknownRateNote && <p className="ccbar__note">{config.unknownRateNote}</p>}

      <button
        type="button"
        className="ccbar__clear"
        onClick={() => {
          // Clears this page's recipes only; the basket page clears everything.
          const next = Object.fromEntries(Object.entries({ ...readBasket(), ...picks }).filter(([id]) => !byId.has(id)));
          setPicks(next);
          writeBasket(next);
          setOpen(false);
        }}
      >
        {inline ? 'ล้างตะกร้าทั้งหมด' : 'ล้างของหน้านี้'}
      </button>
    </div>
  );

  if (inline) {
    return (
      <CalcContext.Provider value={{ picks, setPick }}>
        {children}
        {!ready ? null : pickedIds.length === 0 ? (
          <p className="ccpage__empty">ยังไม่มีของในตะกร้า · ค้นด้านบน หรือไปกด <strong>+ คำนวณวัตถุดิบ</strong> ที่การ์ดสูตรในหน้าทำอาหาร ทำยา ตีอาวุธ หรือหลอมแร่</p>
        ) : (
          panel
        )}
      </CalcContext.Provider>
    );
  }

  return (
    <CalcContext.Provider value={{ picks, setPick }}>
      {children}
      {pickedIds.length > 0 && <div className="ccbar-spacer" aria-hidden="true" />}
      {pickedIds.length > 0 && (
        <div className={'ccbar' + (open ? ' is-open' : '')} role="region" aria-label="ยอดวัตถุดิบ">
          {open && (
            <>
              {panel}
              <Link href={BASKET_HREF} className="ccbar__basket">
                ตะกร้ารวมทุกหน้า{elsewhere > 0 ? ` · มีของจากหน้าอื่นอีก ${elsewhere} สูตร` : ''} ›
              </Link>
            </>
          )}
          <button type="button" className="ccbar__toggle" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            <span className="ccbar__sum">
              <b>{pickedIds.length}</b> สูตร · ทำ <b>{count.toLocaleString('en-US')}</b> ชิ้น · วัตถุดิบ <b>{plan.raw.length}</b> อย่าง
              {elsewhere > 0 && <small className="ccbar__more"> +{elsewhere} สูตรจากหน้าอื่น</small>}
            </span>
            <span className="ccbar__cta">{open ? 'ย่อ ▼' : 'ดูยอดรวม ▲'}</span>
          </button>
        </div>
      )}
    </CalcContext.Provider>
  );
}

/** Search every recipe the basket knows and add one (the basket page). */
export function RecipeFinder({ recipes }: { recipes: { id: string; name: string; icon: string | null; category: string | null; where: string }[] }) {
  const [q, setQ] = useState('');
  const needle = q.trim().toLowerCase();
  const hits = needle ? recipes.filter((r) => r.name.toLowerCase().includes(needle)).slice(0, 8) : [];
  return (
    <div className="ccfind">
      <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นของที่จะทำ เช่น Steel, Red Potion, Bomber Steak" aria-label="ค้นสูตร" autoComplete="off" />
      {needle && !hits.length && <p className="muted">ไม่เจอสูตรชื่อนี้</p>}
      {hits.length > 0 && (
        <ul className="ccfind__list">
          {hits.map((r) => (
            <li key={r.id}>
              <span className="ccbar__prod">
                <ItemIcon iconUrl={r.icon} category={r.category} size={24} />
                <span>
                  {r.name}
                  <small className="ccbar__from">{r.where}</small>
                </span>
              </span>
              <RecipeQty id={r.id} name={r.name} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
