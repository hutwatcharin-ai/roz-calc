'use client';

// components/BuildSimulator.tsx
//
// The build simulator on /tools/build (owner, 6 Oct 2026: the HIT/FLEE page
// was little used because a player who wants to hit one monster goes to that
// monster's page; what was missing was somewhere to put the whole character
// together). Everything is worked out in the browser by lib/build-calc. The
// build is kept in this browser (localStorage) and in a share link (?b=),
// and its level, HIT and FLEE go to the numbers the other tools and the
// monster pages read (lib/player-numbers).

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ALL_CARDS, ALL_GEAR, BUILD_KEY, EMPTY_BUILD, SLOTS, SLOT_TH, calcBuild, cardById, cardKind, classFits, coveredSlots, decodeBuild,
  encodeBuild, fitsSlot, gearById, isTwoHanded, maxJobLevel, sanitizeBuild, type Build, type Slot, type Target,
} from '@/lib/build-calc';
import { STATS, type Stat, classStats, statBudget, statCost, WEAPON_TH } from '@/lib/class-stats';
import { foodText, foodsFor, foodById } from '@/lib/food-buffs';
import { bonusText } from '@/lib/item-effects';
import { readPlayerNumbers, writePlayerNumbers } from '@/lib/player-numbers';
import { rankSuggestions, type SuggestEntry } from '@/lib/suggest';
import { supabaseBrowser } from '@/lib/supabase';
import foodFile from '@/data/food-buffs.json';
import classFile from '@/data/class-stats.json';

const CLASSES = Object.entries((classFile as unknown as { classes: Record<string, { name: string; tier: string }> }).classes)
  .map(([slug, c]) => ({ slug, name: c.name, tier: c.tier }))
  .sort((a, b) => (a.tier === b.tier ? a.name.localeCompare(b.name) : a.tier < b.tier ? -1 : 1));
const TIER_TH: Record<string, string> = { base: 'เริ่มต้น', first_class: 'อาชีพขั้น 1', second_job: 'อาชีพขั้น 2' };

// Foods that change something the window shows.
const FOODS = (foodFile as unknown as { foods: { id: number; name: string; b: Record<string, number> }[] }).foods
  .filter((f) => foodById(f.id))
  .sort((a, b) => a.name.localeCompare(b.name));

const STAT_TH: Record<Stat, string> = { str: 'STR', agi: 'AGI', vit: 'VIT', int: 'INT', dex: 'DEX', luk: 'LUK' };

/** Points to go from `from` to `to` (0 when not higher). */
function costBetween(from: number, to: number): number {
  return to > from ? statCost(to) - statCost(from) : 0;
}

type Picking = { slot: Slot; card?: number } | null;

export default function BuildSimulator() {
  const [build, setBuild] = useState<Build>(EMPTY_BUILD);
  const [ready, setReady] = useState(false);
  const [picking, setPicking] = useState<Picking>(null);
  const [query, setQuery] = useState('');
  const [target, setTarget] = useState<Target | null>(null);
  const [mobQuery, setMobQuery] = useState('');
  const [mobs, setMobs] = useState<SuggestEntry[] | null>(null);
  const [copied, setCopied] = useState(false);

  // A share link wins over what this browser remembers.
  useEffect(() => {
    let start: Build | null = null;
    try {
      start = decodeBuild(new URLSearchParams(window.location.search).get('b'));
      if (!start) start = sanitizeBuild(JSON.parse(window.localStorage.getItem(BUILD_KEY) ?? 'null'));
    } catch {
      // Blocked or broken storage: start empty.
    }
    if (start) setBuild(start);
    const mob = Number(new URLSearchParams(window.location.search).get('monster'));
    if (mob > 0) void loadMonster(mob);
    setReady(true);
  }, []);

  const result = useMemo(() => calcBuild(build, target), [build, target]);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(BUILD_KEY, JSON.stringify(build));
      const prev = readPlayerNumbers(window.localStorage);
      writePlayerNumbers(window.localStorage, { ...prev, level: build.lv, hit: result.hit, flee: result.flee });
    } catch {
      // Not remembering it does not stop the page working.
    }
  }, [ready, build, result.hit, result.flee]);

  function update(patch: Partial<Build>) {
    setBuild((b) => {
      const next = { ...b, ...patch };
      next.job = Math.min(next.job, maxJobLevel(next.cls));
      return next;
    });
    setCopied(false);
  }
  function setStat(s: Stat, raw: number) {
    const v = Math.max(1, Math.min(99, Math.floor(raw) || 1));
    update({ st: { ...build.st, [s]: v } });
  }
  function setSlot(slot: Slot, id: number | null) {
    const g = { ...build.g };
    if (id === null) delete g[slot];
    else {
      const item = gearById(id)!;
      g[slot] = { id, r: 0, c: Array.from({ length: item.sl }, () => 0) };
      // A hat covering more head slots empties them.
      for (const s of coveredSlots(item, slot)) delete g[s];
      if (slot === 'weapon' && isTwoHanded(item.wt)) delete g.shield;
    }
    update({ g });
    setPicking(null);
    setQuery('');
  }
  function setRefine(slot: Slot, r: number) {
    const w = build.g[slot];
    if (w) update({ g: { ...build.g, [slot]: { ...w, r } } });
  }
  function setCard(slot: Slot, index: number, id: number) {
    const w = build.g[slot];
    if (!w) return;
    const c = [...w.c];
    c[index] = id;
    update({ g: { ...build.g, [slot]: { ...w, c } } });
    setPicking(null);
    setQuery('');
  }

  async function loadMonster(id: number) {
    const { data, error } = await supabaseBrowser()
      .from('monsters')
      .select('id, name_en, level, vit, def, size, element, element_level, race, is_mvp, hit_100, flee_95')
      .eq('id', id)
      .maybeSingle();
    if (error || !data) {
      if (error) console.error('build: monster lookup failed', error);
      return;
    }
    const entry = mobs?.find((m) => m.id === id);
    setTarget({
      name: data.name_en,
      level: data.level,
      vit: data.vit,
      def: data.def,
      size: data.size,
      element: data.element,
      element_level: data.element_level,
      race: data.race,
      boss: !!data.is_mvp || entry?.tag === 'mini',
      hit_100: data.hit_100,
      flee_95: data.flee_95,
    });
    setMobQuery('');
  }
  async function wantMobs() {
    if (mobs) return;
    try {
      const res = await fetch('/suggest/monsters');
      setMobs(await res.json());
    } catch {
      setMobs([]);
    }
  }

  function share() {
    const url = `${window.location.origin}/tools/build?b=${encodeBuild(build)}`;
    void navigator.clipboard?.writeText(url).then(() => setCopied(true), () => setCopied(false));
    window.history.replaceState(null, '', url);
  }

  const cls = classStats(build.cls);
  const left = result.budget - result.used;
  const weapon = build.g.weapon ? gearById(build.g.weapon.id) : null;

  // The list a slot or card socket picks from.
  const options = useMemo(() => {
    if (!picking) return [];
    const q = query.trim().toLowerCase();
    if (picking.card !== undefined) {
      const kind = cardKind(picking.slot);
      return Object.entries(ALL_CARDS)
        .filter(([, c]) => c.on === kind && (!q || c.n.toLowerCase().includes(q)))
        .map(([id, c]) => ({ id: Number(id), name: c.n, icon: c.i, sub: '' }))
        .sort((a, b) => a.name.localeCompare(b.name));
    }
    return Object.entries(ALL_GEAR)
      .filter(([, g]) => fitsSlot(g, picking.slot) && classFits(build.cls, g.cls) && (!q || g.n.toLowerCase().includes(q)))
      .map(([id, g]) => ({
        id: Number(id),
        name: g.sl ? `${g.n} [${g.sl}]` : g.n,
        icon: g.i,
        sub: [g.wt ? WEAPON_TH[g.wt] ?? g.wt : '', g.atk ? `ATK ${g.atk}` : '', g.matk ? `MATK ${g.matk}` : '', g.def ? `DEF ${g.def}` : '', g.lv ? `Lv ${g.lv}` : '']
          .filter(Boolean)
          .join(' · '),
        tooHigh: (g.lv ?? 0) > build.lv,
      }))
      .sort((a, b) => Number(a.tooHigh ?? false) - Number(b.tooHigh ?? false) || a.name.localeCompare(b.name));
  }, [picking, query, build.cls, build.lv]);

  const mobHits = useMemo(() => (mobs && mobQuery ? rankSuggestions(mobs, mobQuery, 8) : []), [mobs, mobQuery]);

  const vs = result.vs;
  const needDex = vs?.hitShort ? Math.min(99, build.st.dex + vs.hitShort) : null;
  const needAgi = vs?.fleeShort ? Math.min(99, build.st.agi + vs.fleeShort) : null;

  return (
    <div className="buildsim">
      <div className="buildsim__main">
        {/* CHARACTER */}
        <section className="card buildsim__panel">
          <h2 className="buildsim__h">▶ CHARACTER</h2>
          <div className="buildsim__row">
            <label>
              อาชีพ
              <select value={build.cls} onChange={(e) => update({ cls: e.target.value })}>
                {['base', 'first_class', 'second_job'].map((tier) => (
                  <optgroup key={tier} label={TIER_TH[tier]}>
                    {CLASSES.filter((c) => c.tier === tier).map((c) => (
                      <option key={c.slug} value={c.slug}>{c.name}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>
            <label>
              Base Lv
              <input className="mono" type="number" inputMode="numeric" min={1} max={99} value={build.lv}
                onChange={(e) => update({ lv: Math.max(1, Math.min(99, Number(e.target.value) || 1)) })} />
            </label>
            <label>
              Job Lv
              <input className="mono" type="number" inputMode="numeric" min={1} max={maxJobLevel(build.cls)} value={build.job}
                onChange={(e) => update({ job: Math.max(1, Math.min(maxJobLevel(build.cls), Number(e.target.value) || 1)) })} />
            </label>
            <p className={`buildsim__points mono${left < 0 ? ' is-over' : ''}`}>
              <span>POINTS LEFT</span> {left}
              <small>ใช้ {result.used} จาก {result.budget}</small>
            </p>
          </div>
          <table className="buildsim__stats">
            <thead>
              <tr><th></th><th>อัป</th><th>Job</th><th>ของ</th><th>รวม</th><th>แต้มขั้นถัดไป</th></tr>
            </thead>
            <tbody>
              {STATS.map((s) => (
                <tr key={s}>
                  <th className="mono">{STAT_TH[s]}</th>
                  <td>
                    <span className="buildsim__stepper">
                      <button type="button" aria-label={`ลด ${STAT_TH[s]}`} onClick={() => setStat(s, build.st[s] - 1)}>−</button>
                      <input className="mono" type="number" inputMode="numeric" min={1} max={99} value={build.st[s]}
                        aria-label={STAT_TH[s]} onChange={(e) => setStat(s, Number(e.target.value))} />
                      <button type="button" aria-label={`เพิ่ม ${STAT_TH[s]}`} onClick={() => setStat(s, build.st[s] + 1)}>+</button>
                    </span>
                  </td>
                  <td className="mono muted">{result.job[s] ? `+${result.job[s]}` : '—'}</td>
                  <td className="mono muted">{result.bonus[s] ? `${result.bonus[s] > 0 ? '+' : ''}${result.bonus[s]}` : '—'}</td>
                  <td className="mono buildsim__total">{result.total[s]}</td>
                  <td className="mono muted">{build.st[s] < 99 ? costBetween(build.st[s], build.st[s] + 1) : 'MAX'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* EQUIPMENT */}
        <section className="card buildsim__panel">
          <h2 className="buildsim__h">▶ EQUIPMENT</h2>
          <ul className="buildsim__slots">
            {SLOTS.map((slot) => {
              const w = build.g[slot];
              const item = w ? gearById(w.id) : null;
              const coveredBy = SLOTS.find((s) => {
                const o = build.g[s];
                const it = o ? gearById(o.id) : null;
                return it && coveredSlots(it, s).includes(slot);
              });
              const blockedShield = slot === 'shield' && isTwoHanded(weapon?.wt);
              return (
                <li key={slot} className={`buildsim__slot${item ? ' is-filled' : ''}`}>
                  <span className="buildsim__slotname">{SLOT_TH[slot]}</span>
                  {coveredBy ? (
                    <span className="muted">ใช้ร่วมกับ{SLOT_TH[coveredBy]}</span>
                  ) : blockedShield ? (
                    <span className="muted">อาวุธสองมือ ใส่โล่ไม่ได้</span>
                  ) : (
                    <>
                      <button type="button" className="buildsim__pick" onClick={() => { setPicking({ slot }); setQuery(''); }}>
                        {item?.i && <img src={item.i} alt="" width={24} height={24} />}
                        <span>{item ? item.n : '+ เลือก'}</span>
                      </button>
                      {item && (
                        <span className="buildsim__slotctl">
                          {item.rs && (
                            <select aria-label="ตีบวก" value={w!.r} onChange={(e) => setRefine(slot, Number(e.target.value))}>
                              {Array.from({ length: 21 }, (_, r) => <option key={r} value={r}>+{r}</option>)}
                            </select>
                          )}
                          {w!.c.map((cid, i) => {
                            const card = cid ? cardById(cid) : null;
                            return (
                              <button key={i} type="button" className={`buildsim__socket${card ? ' is-filled' : ''}`}
                                title={card?.n ?? 'ช่องการ์ด'} onClick={() => { setPicking({ slot, card: i }); setQuery(''); }}>
                                {card?.i ? <img src={card.i} alt={card.n} width={20} height={20} /> : '◇'}
                              </button>
                            );
                          })}
                          <button type="button" className="buildsim__clear" aria-label={`ถอด${SLOT_TH[slot]}`} onClick={() => setSlot(slot, null)}>×</button>
                        </span>
                      )}
                    </>
                  )}
                  {picking?.slot === slot && (
                    <div className="buildsim__picker" role="dialog" aria-label={picking.card !== undefined ? 'เลือกการ์ด' : `เลือก${SLOT_TH[slot]}`}>
                      <div className="buildsim__pickerhead">
                        <b>{picking.card !== undefined ? 'SELECT CARD' : 'SELECT ITEM'}</b>
                        <button type="button" onClick={() => setPicking(null)} aria-label="ปิด">×</button>
                      </div>
                      <input
                        // autoFocus missed keys typed right after the click; focus on mount instead.
                        ref={(el) => { if (el && document.activeElement !== el) el.focus(); }}
                        type="search" placeholder="พิมพ์ชื่อ" value={query} onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Escape' && setPicking(null)} />
                      <ul>
                        {picking.card !== undefined && build.g[slot]?.c[picking.card] ? (
                          <li><button type="button" onClick={() => setCard(slot, picking.card!, 0)}>— ถอดการ์ด</button></li>
                        ) : null}
                        {options.slice(0, 80).map((o) => (
                          <li key={o.id}>
                            <button type="button" className={'tooHigh' in o && o.tooHigh ? 'is-locked' : undefined}
                              onClick={() => (picking.card !== undefined ? setCard(slot, picking.card, o.id) : setSlot(slot, o.id))}>
                              {o.icon && <img src={o.icon} alt="" width={24} height={24} loading="lazy" />}
                              <span>{o.name}{o.sub && <small>{o.sub}</small>}</span>
                            </button>
                          </li>
                        ))}
                        {options.length === 0 && <li className="muted">ไม่มีของที่ใส่ช่องนี้ได้</li>}
                        {options.length > 80 && <li className="muted">อีก {options.length - 80} ชิ้น พิมพ์ชื่อเพื่อหา</li>}
                      </ul>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          <label className="buildsim__check">
            <input type="checkbox" checked={!!build.siege} onChange={(e) => update({ siege: e.target.checked || undefined })} />
            อยู่ในวอร์ (นับผลที่ใช้ได้เฉพาะในวอร์)
          </label>
        </section>

        {/* FOOD */}
        <section className="card buildsim__panel">
          <h2 className="buildsim__h">▶ FOOD &amp; BUFF</h2>
          <div className="buildsim__foods">
            {build.f.map((id) => {
              const f = foodById(id);
              return f ? (
                <button key={id} type="button" className="chip" onClick={() => update({ f: build.f.filter((x) => x !== id) })}>
                  {f.name} <small>{foodText(f)}</small> ×
                </button>
              ) : null;
            })}
            <select value="" aria-label="เพิ่มอาหาร" onChange={(e) => e.target.value && update({ f: [...build.f, Number(e.target.value)] })}>
              <option value="">+ เพิ่มอาหาร/ยา</option>
              {FOODS.filter((f) => !build.f.includes(f.id)).map((f) => (
                <option key={f.id} value={f.id}>{f.name} — {foodText(foodById(f.id)!)}</option>
              ))}
            </select>
          </div>
          <p className="muted buildsim__note">
            อาหารที่เพิ่มสเตตัสเดียวกันไม่ทับกันในเกม นับแค่อันที่มากที่สุด · อยากได้ HIT เพิ่ม ลองดู{' '}
            {foodsFor('hit').slice(0, 2).map((f) => f.food.name).join(', ')}
          </p>
        </section>
      </div>

      <aside className="buildsim__side">
        {/* STATUS WINDOW */}
        <section className="card card--pink buildsim__window">
          <h2 className="buildsim__h">▶ STATUS</h2>
          <p className="buildsim__who">{cls?.name} · Lv {build.lv} / Job {build.job}{weapon ? ` · ${WEAPON_TH[weapon.wt ?? ''] ?? ''}` : ' · มือเปล่า'}</p>
          <dl className="buildsim__grid">
            <div><dt>HIT</dt><dd className="mono">{result.hit}</dd></div>
            <div><dt>FLEE</dt><dd className="mono">{result.flee}</dd></div>
            <div><dt>CRI</dt><dd className="mono">{result.crit}</dd></div>
            <div><dt>Perfect Dodge</dt><dd className="mono">{result.pd}</dd></div>
            <div><dt>ATK</dt><dd className="mono">{result.atk.status} + {result.atk.equip}</dd></div>
            <div><dt>MATK</dt><dd className="mono">{result.matk.status} + {result.matk.equip}</dd></div>
            <div><dt>DEF</dt><dd className="mono">{result.def.hard} + {result.def.soft}</dd></div>
            <div><dt>MDEF</dt><dd className="mono">{result.mdef.hard} + {result.mdef.soft}</dd></div>
            <div className="is-est"><dt>ASPD <i>ประมาณ</i></dt><dd className="mono">{result.aspd ?? '—'}</dd></div>
            <div className={result.hpMeasured ? undefined : 'is-est'}><dt>HP{!result.hpMeasured && <i>ประมาณ</i>}</dt><dd className="mono">{result.hp?.toLocaleString('en-US') ?? '—'}</dd></div>
            <div className={result.hpMeasured ? undefined : 'is-est'}><dt>SP{!result.hpMeasured && <i>ประมาณ</i>}</dt><dd className="mono">{result.sp?.toLocaleString('en-US') ?? '—'}</dd></div>
            <div className="is-est"><dt>น้ำหนัก <i>ประมาณ</i></dt><dd className="mono">{result.weight.worn} / {result.weight.cap}</dd></div>
            <div className="is-est"><dt>ร่ายแปรผัน <i>ประมาณ</i></dt><dd className="mono">{Math.round(result.vct * 100)}%</dd></div>
            {result.fct !== 0 && <div><dt>ร่ายคงที่</dt><dd className="mono">{result.fct > 0 ? '+' : ''}{result.fct}%</dd></div>}
          </dl>
          <p className="muted buildsim__note">
            HIT FLEE CRI ATK MATK DEF MDEF ใช้สูตรที่วัดในเกมแล้ว · ที่ติด &ldquo;ประมาณ&rdquo; ยังเป็นสูตรที่ไม่มีใครวัดใน Global
            {!result.hpMeasured && ' · HP/SP อาชีพนี้อาจสูงเกินจริง 20-25%'} · ร่ายแปรผัน = เหลือกี่ % ของเวลาร่ายเดิม
          </p>
          {result.warnings.length > 0 && (
            <ul className="buildsim__warn">
              {result.warnings.map((w) => <li key={w}>⚠ {w}</li>)}
            </ul>
          )}
          <div className="buildsim__actions">
            <button type="button" className="btn" onClick={share}>{copied ? 'คัดลอกลิงก์แล้ว' : 'แชร์บิลด์ (คัดลอกลิงก์)'}</button>
            <button type="button" className="btn btn--quiet" onClick={() => { setBuild(EMPTY_BUILD); setTarget(null); }}>เริ่มใหม่</button>
          </div>
        </section>

        {/* TARGET */}
        <section className="card buildsim__panel">
          <h2 className="buildsim__h">▶ TARGET</h2>
          <div className="buildsim__mob">
            <input type="search" placeholder="ชื่อมอน เช่น Poring, หมาป่า" value={mobQuery}
              onFocus={() => void wantMobs()} onChange={(e) => setMobQuery(e.target.value)} aria-label="ค้นหามอน" />
            {mobHits.length > 0 && (
              <ul className="buildsim__picker buildsim__picker--inline">
                {mobHits.map((h) => (
                  <li key={h.entry.id}>
                    <button type="button" onClick={() => void loadMonster(h.entry.id)}>
                      {h.entry.sprite && <img src={h.entry.sprite} alt="" width={28} height={28} loading="lazy" />}
                      <span>{h.entry.label} <small>Lv {h.entry.lv} · {h.entry.sub}</small></span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {target && vs ? (
            <div className="buildsim__vs">
              <p className="buildsim__who">{target.name} · Lv {target.level} · {[target.race, target.element, target.size].filter(Boolean).join(' · ')}</p>
              <dl className="buildsim__grid">
                <div><dt>ตีโดน</dt><dd className="mono">{vs.hitChance !== null ? `${vs.hitChance}%` : 'ไม่ทราบ'}</dd></div>
                <div><dt>หลบได้</dt><dd className="mono">{vs.dodge !== null ? `${vs.dodge}%` : 'ไม่ทราบ'}</dd></div>
                <div className="is-est"><dt>ดาเมจตีธรรมดา <i>ประมาณ</i></dt><dd className="mono">{vs.damage ?? 'ไม่ทราบ'}</dd></div>
              </dl>
              <ul className="buildsim__need">
                {vs.hitShort === 0 && <li>✔ ตีโดน 100% แล้ว</li>}
                {vs.hitShort ? (
                  <li>
                    ขาด HIT อีก {vs.hitShort}
                    {needDex !== null && build.st.dex + vs.hitShort <= 99
                      ? ` = DEX ${build.st.dex} → ${needDex} (ใช้ ${costBetween(build.st.dex, needDex)} แต้ม)`
                      : ' (อัป DEX อย่างเดียวไม่พอ ต้องใช้ของ/อาหาร)'}
                  </li>
                ) : null}
                {vs.fleeShort === 0 && <li>✔ หลบได้ตัน 95% แล้ว</li>}
                {vs.fleeShort ? (
                  <li>
                    หลบตัน 95% ขาด FLEE อีก {vs.fleeShort}
                    {needAgi !== null && build.st.agi + vs.fleeShort <= 99
                      ? ` = AGI ${build.st.agi} → ${needAgi} (ใช้ ${costBetween(build.st.agi, needAgi)} แต้ม)`
                      : ' (อัป AGI อย่างเดียวไม่พอ)'}
                  </li>
                ) : null}
              </ul>
              <p className="muted buildsim__note">
                ดาเมจ = ตีธรรมดา 1 ครั้งแบบไม่คริ ไม่รวมช่วงสุ่มดาเมจ สกิลติดตัว และสกิลโจมตี
                {vs.multiplier !== 1 && ` · รวมผลตีเผ่า/ธาตุ/ขนาด ×${vs.multiplier.toFixed(2)}`}
              </p>
            </div>
          ) : (
            <p className="muted">เลือกมอน ดูว่าบิลด์นี้ตีโดนกี่ % หลบได้กี่ % และต้องอัปอะไรอีก</p>
          )}
        </section>

        {/* EFFECTS */}
        <section className="card buildsim__panel">
          <h2 className="buildsim__h">▶ EFFECTS</h2>
          {result.other.length > 0 && (
            <>
              <h3 className="buildsim__h3">ผลอื่นที่ได้ (ไม่อยู่ในหน้าต่างสเตตัส)</h3>
              <ul className="buildsim__fx">
                {result.other.map((s) => <li key={`${s.type}${s.target}${s.skill}`}>{bonusText([s.type, s.value, s.target, null, s.skill])}</li>)}
              </ul>
            </>
          )}
          {result.skipped.length > 0 && (
            <details className="buildsim__details">
              <summary>ผลที่ยังไม่นับ ({result.skipped.length})</summary>
              <ul className="buildsim__fx">
                {result.skipped.map((l, i) => <li key={i}><b>{l.from}</b> {l.text} <small className="muted">— {l.why}</small></li>)}
              </ul>
            </details>
          )}
          {result.counted.length > 0 ? (
            <details className="buildsim__details">
              <summary>ที่มาของตัวเลข ({result.counted.length})</summary>
              <ul className="buildsim__fx">
                {result.counted.map((l, i) => <li key={i}><b>{l.from}</b> {l.text}</li>)}
              </ul>
            </details>
          ) : (
            <p className="muted">ยังไม่ได้ใส่ของ</p>
          )}
        </section>
        <p className="muted buildsim__note">
          ค่าที่คำนวณได้ถูกจำไว้ในเครื่องนี้ หน้ามอนแต่ละตัวจะบอก % ตีโดน/หลบ ของบิลด์นี้ให้เอง ·{' '}
          <Link href="/tools/damage">คำนวณดาเมจละเอียด</Link>
        </p>
      </aside>
    </div>
  );
}
