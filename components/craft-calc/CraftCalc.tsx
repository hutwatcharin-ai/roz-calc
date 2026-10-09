'use client';

// The crafting calculator a recipe guide wraps its recipes in (owner, 9 Oct
// 2026). Each recipe card gets a quantity control (RecipeQty); a bar pinned to
// the bottom of the screen adds everything up with lib/craft-calc and says
// where each material comes from. The guide page decides what is special
// about its kind -- success rates per skill level, a per-try item, a chain of
// intermediates -- and passes it in as plain data.
//
// Picks are remembered in this browser per page (a convenience; it works
// without storage too).

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
  /** localStorage key; one per page. */
  id: string;
  recipes: CalcRecipe[];
  /** Intermediates the reader may make instead of farming (ore recipes). */
  chain?: CalcRecipe[];
  /** Offer the "make the intermediates too" switch, and its label. */
  expandLabel?: string;
  expandDefault?: boolean;
  /** Recipes whose skill has a known success rate per level. */
  skillRates?: SkillRates[];
  /** Spent once per try of each picked recipe (Mortar Bowl). */
  perTry?: CalcMat[];
  /** What the bar says when a rate is unknown. */
  unknownRateNote?: string;
  sources: Record<number, MaterialSource>;
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

export default function CraftCalc({ config, children }: { config: CraftCalcConfig; children: React.ReactNode }) {
  const [picks, setPicks] = useState<Record<string, number>>({});
  const [expand, setExpand] = useState(config.expandDefault ?? false);
  const [levels, setLevels] = useState<Record<number, number>>(() =>
    Object.fromEntries((config.skillRates ?? []).map((s) => [s.skillId, s.rates.length])),
  );
  const [open, setOpen] = useState(false);
  const key = `craftcalc:${config.id}`;

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(key) ?? 'null');
      if (saved && typeof saved === 'object') {
        if (saved.picks) setPicks(saved.picks);
        if (typeof saved.expand === 'boolean') setExpand(saved.expand);
        if (saved.levels) setLevels((l) => ({ ...l, ...saved.levels }));
      }
    } catch {}
  }, [key]);

  const save = (next: { picks?: Record<string, number>; expand?: boolean; levels?: Record<number, number> }) => {
    try {
      localStorage.setItem(key, JSON.stringify({ picks, expand, levels, ...next }));
    } catch {}
  };
  const setPick = (id: string, n: number) => {
    const next = { ...picks };
    if (n > 0) next[id] = n;
    else delete next[id];
    setPicks(next);
    save({ picks: next });
  };

  const byId = useMemo(() => new Map([...config.recipes, ...(config.chain ?? [])].map((r) => [r.id, r])), [config]);
  const rateBySkill = useMemo(() => {
    const m = new Map<number, number>();
    for (const s of config.skillRates ?? []) m.set(s.skillId, s.rates[(levels[s.skillId] ?? s.rates.length) - 1]);
    return m;
  }, [config.skillRates, levels]);

  const plan = useMemo(
    () =>
      planCraft({
        picks,
        recipes: config.recipes,
        chain: config.chain,
        expand: config.chain ? expand : false,
        rateOf: (r) => (r.skillId != null ? (rateBySkill.get(r.skillId) ?? null) : null),
        perTry: () => config.perTry ?? [],
      }),
    [picks, config, expand, rateBySkill],
  );

  const pickedIds = Object.keys(picks).filter((id) => byId.has(id));
  const count = pickedIds.reduce((s, id) => s + picks[id], 0);
  // Only the skills that this plan actually uses get a level picker.
  const usedSkills = (config.skillRates ?? []).filter((s) => plan.steps.some((st) => st.recipe.skillId === s.skillId));
  const intermediates = plan.steps.filter((s) => !s.picked);

  return (
    <CalcContext.Provider value={{ picks, setPick }}>
      {children}
      {pickedIds.length > 0 && <div className="ccbar-spacer" aria-hidden="true" />}
      {pickedIds.length > 0 && (
        <div className={'ccbar' + (open ? ' is-open' : '')} role="region" aria-label="ยอดวัตถุดิบ">
          {open && (
            <div className="ccbar__panel">
              <section>
                <h3 className="ccbar__h">ที่จะทำ</h3>
                <ul className="ccbar__picks">
                  {pickedIds.map((id) => {
                    const r = byId.get(id)!;
                    return (
                      <li key={id}>
                        <span className="ccbar__prod">
                          <ItemIcon iconUrl={r.product.icon ?? null} category={r.product.category ?? null} size={24} />
                          {r.product.name}
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
                          save({ expand: e.target.checked });
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
                          save({ levels: next });
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
                  setPicks({});
                  save({ picks: {} });
                  setOpen(false);
                }}
              >
                ล้างทั้งหมด
              </button>
            </div>
          )}
          <button type="button" className="ccbar__toggle" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            <span className="ccbar__sum">
              <b>{pickedIds.length}</b> สูตร · ทำ <b>{count.toLocaleString('en-US')}</b> ชิ้น · วัตถุดิบ <b>{plan.raw.length}</b> อย่าง
            </span>
            <span className="ccbar__cta">{open ? 'ย่อ ▼' : 'ดูยอดรวม ▲'}</span>
          </button>
        </div>
      )}
    </CalcContext.Provider>
  );
}
