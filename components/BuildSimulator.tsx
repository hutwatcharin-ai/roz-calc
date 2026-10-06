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
//
// Second pass the same day (owner: make it prettier, more pictures, check
// phones): the class sprite, stat gauges, a faint icon in every empty slot,
// food and monster pictures, a sticky score strip on narrow screens so the
// numbers stay in sight while stats change, and the item picker as a bottom
// sheet on phones instead of a dropdown that ran off the screen.

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ALL_CARDS, ALL_GEAR, ALL_STONES, BUILD_KEY, COSTUME_SLOTS, COSTUME_STONES, COSTUME_TH, EMPTY_BUILD, MAX_ENCHANTS, MAX_OPTIONS,
  OPTION_TYPES, SLOTS, SLOT_TH, calcBuild, cardById, cardKind, classFits, coveredSlots, decodeBuild, encodeBuild, fitsLeftHand, fitsSlot, gearById, slotLabel,
  isTwoHanded, maxJobLevel, optionKey, sanitizeBuild, stoneById, type Build, type CostumeSlot, type Slot, type Target,
} from '@/lib/build-calc';
import { STATS, type Stat, classStats, statCost, WEAPON_TH } from '@/lib/class-stats';
import { foodText, foodById } from '@/lib/food-buffs';
import { bonusText, refineBonusAt } from '@/lib/item-effects';
import { readPlayerNumbers, writePlayerNumbers } from '@/lib/player-numbers';
import { rankSuggestions, type SuggestEntry } from '@/lib/suggest';
import { supabaseBrowser } from '@/lib/supabase';
import { ELEMENT_TH, RACE_TH } from '@/lib/monster-th';
import foodFile from '@/data/food-buffs.json';
import classFile from '@/data/class-stats.json';

const CLASSES = Object.entries((classFile as unknown as { classes: Record<string, { name: string; tier: string }> }).classes)
  .map(([slug, c]) => ({ slug, name: c.name, tier: c.tier }))
  .sort((a, b) => (a.tier === b.tier ? a.name.localeCompare(b.name) : a.tier < b.tier ? -1 : 1));
const TIER_TH: Record<string, string> = { base: 'เริ่มต้น', first_class: 'อาชีพขั้น 1', second_job: 'อาชีพขั้น 2' };
// public/images/jobs has every class but Novice.
const HAS_SPRITE = new Set(CLASSES.map((c) => c.slug).filter((s) => s !== 'novice'));

// Foods that change something the window shows.
const FOODS = (foodFile as unknown as { foods: { id: number; name: string; b: Record<string, number> }[] }).foods
  .filter((f) => foodById(f.id))
  .sort((a, b) => a.name.localeCompare(b.name));

const STAT_TH: Record<Stat, string> = { str: 'STR', agi: 'AGI', vit: 'VIT', int: 'INT', dex: 'DEX', luk: 'LUK' };
const STAT_USE: Record<Stat, string> = {
  str: 'ATK ตีใกล้ · แบกของ', agi: 'FLEE · ASPD', vit: 'HP · DEF', int: 'MATK · SP · ร่ายไว', dex: 'HIT · ร่ายไว · ATK ไกล', luk: 'CRI · หลบสมบูรณ์',
};
// A faint picture of what goes in each empty slot.
const SLOT_ICON: Record<Slot, number> = {
  weapon: 1201, shield: 460058, head_upper: 2220, head_middle: 2276, head_lower: 2267, armor: 2301, garment: 480378,
  footgear: 470011, accessory_1: 2601, accessory_2: 2601,
};
// Gauges fill against this; totals past 99 come from gear and Job bonuses.
const STAT_GAUGE_MAX = 130;

/** Points to go from `from` to `to` (0 when not higher). */
function costBetween(from: number, to: number): number {
  return to > from ? statCost(to) - statCost(from) : 0;
}

// What the open picker fills: a gear slot's item, card or enchant stone, or a
// costume slot's stone. `at` is the gear slot or the costume slot.
type PickKind = 'item' | 'card' | 'enchant' | 'costume';
// `editor`: opened from the piece editor, so the picker shows there, not on the tile.
type Picking = { at: string; kind: PickKind; index: number; editor?: boolean } | null;
const PICK_TITLE: Record<PickKind, string> = { item: 'SELECT ITEM', card: 'SELECT CARD', enchant: 'SELECT ENCHANT', costume: 'SELECT STONE' };

/** An option line's name without a number: "HIT", "ตีเผ่าสัตว์ %". */
function optionLabel([type, target]: [string, string | null]): string {
  const text = bonusText([type, 1, target, null, null]);
  return text.replace(/\s*\+1(%?)$/, (_m, pct: string) => (pct ? ' %' : ''));
}
const OPTION_LABELS = OPTION_TYPES.map((o) => ({ key: optionKey(o), label: optionLabel(o) }));

/** A panel title: pixel icon, arcade label, and an optional count on the right. */
function PanelHead({ icon, title, meta, pink }: { icon: string; title: string; meta?: string; pink?: boolean }) {
  return (
    <h2 className={`buildsim__h${pink ? ' buildsim__h--pink' : ''}`}>
      <span className="buildsim__hicon" aria-hidden="true"><img src={icon} alt="" width={24} height={24} /></span>
      {title}
      {meta && <small>{meta}</small>}
    </h2>
  );
}


export default function BuildSimulator({ initial, sharedId }: {
  /** A shared build (/b/<id>): opened as is, and not saved over this browser's own build until edited. */
  initial?: Build;
  sharedId?: string;
} = {}) {
  const [build, setBuild] = useState<Build>(EMPTY_BUILD);
  const [ready, setReady] = useState(false);
  const [picking, setPicking] = useState<Picking>(null);
  const [eqTab, setEqTab] = useState<'gear' | 'costume'>('gear');
  // The equipped piece open in the editor under the equip window.
  const [active, setActive] = useState<Slot | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  // On a phone the editor sits under all ten tiles: bring it into view when a tile is tapped.
  function openEditor(slot: Slot) {
    setActive(slot);
    if (window.innerWidth <= 640) requestAnimationFrame(() => editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }
  const [query, setQuery] = useState('');
  const [target, setTarget] = useState<Target | null>(null);
  const [targetImg, setTargetImg] = useState<string | null>(null);
  const [mobQuery, setMobQuery] = useState('');
  const [mobs, setMobs] = useState<SuggestEntry[] | null>(null);
  // Sharing (owner, 7 Oct 2026): a short link per build, its picture, Facebook.
  const [link, setLink] = useState<{ key: string; id: string } | null>(sharedId && initial ? { key: encodeBuild(initial), id: sharedId } : null);
  const [shareMsg, setShareMsg] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  // Edited since the page opened: until then a shared build is someone else's.
  const [dirty, setDirty] = useState(false);

  // A share link wins over what this browser remembers.
  useEffect(() => {
    let start: Build | null = null;
    try {
      start = initial ?? decodeBuild(new URLSearchParams(window.location.search).get('b'));
      if (!start) start = sanitizeBuild(JSON.parse(window.localStorage.getItem(BUILD_KEY) ?? 'null'));
    } catch {
      // Blocked or broken storage: start empty.
    }
    if (start) {
      setBuild(start);
      // Open the weapon in the editor when the build has one.
      if (start.g.weapon) setActive('weapon');
    }
    const mob = Number(new URLSearchParams(window.location.search).get('monster'));
    if (mob > 0) void loadMonster(mob);
    setReady(true);
  }, []);

  const result = useMemo(() => calcBuild(build, target), [build, target]);

  useEffect(() => {
    if (!ready || (initial && !dirty)) return;
    try {
      window.localStorage.setItem(BUILD_KEY, JSON.stringify(build));
      const prev = readPlayerNumbers(window.localStorage);
      writePlayerNumbers(window.localStorage, { ...prev, level: build.lv, hit: result.hit, flee: result.flee });
    } catch {
      // Not remembering it does not stop the page working.
    }
  }, [ready, dirty, initial, build, result.hit, result.flee]);

  // The bottom sheet on phones: no page scroll behind it.
  useEffect(() => {
    if (!picking) return;
    const close = (e: KeyboardEvent) => e.key === 'Escape' && setPicking(null);
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [picking]);

  function update(patch: Partial<Build>) {
    setBuild((b) => {
      const next = { ...b, ...patch };
      next.job = Math.min(next.job, maxJobLevel(next.cls));
      return next;
    });
    setDirty(true);
    setShareMsg(null);
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
      setActive(slot);
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
  function setEnchant(slot: Slot, index: number, id: number) {
    const w = build.g[slot];
    if (!w) return;
    const e = [...(w.e ?? [])];
    if (id) e[index] = id;
    else e.splice(index, 1);
    update({ g: { ...build.g, [slot]: { ...w, e } } });
    setPicking(null);
    setQuery('');
  }
  function setOption(slot: Slot, index: number, row: [string, number] | null) {
    const w = build.g[slot];
    if (!w) return;
    const o = [...(w.o ?? [])];
    if (row) o[index] = row;
    else o.splice(index, 1);
    update({ g: { ...build.g, [slot]: { ...w, o } } });
  }
  function setCostume(cs: CostumeSlot, index: number, id: number) {
    const list = [...(build.cos?.[cs] ?? [])];
    if (id) list[index] = id;
    else list.splice(index, 1);
    update({ cos: { ...build.cos, [cs]: list } });
    setPicking(null);
    setQuery('');
  }
  function setSkill(name: string, lv: number) {
    update({ sk: { ...build.sk, [name]: Math.max(0, Math.min(10, Math.floor(lv) || 0)) } });
  }
  function openPicker(p: Picking) {
    setPicking(p);
    setQuery('');
  }

  async function loadMonster(id: number) {
    const { data, error } = await supabaseBrowser()
      .from('monsters')
      .select('id, name_en, level, vit, def, size, element, element_level, race, is_mvp, hit_100, flee_95, image_url')
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
    setTargetImg(data.image_url ?? null);
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

  /** The short link's id for the build on screen, storing it the first time. */
  async function shortId(): Promise<string | null> {
    const key = encodeBuild(build);
    if (link?.key === key) return link.id;
    setSharing(true);
    try {
      const res = await fetch('/api/build-link', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ build }) });
      const data = (await res.json()) as { id?: string; error?: string };
      if (!res.ok || !data.id) {
        setShareMsg(data.error ?? 'สร้างลิงก์ไม่สำเร็จ ลองใหม่อีกครั้ง');
        return null;
      }
      setLink({ key, id: data.id });
      return data.id;
    } catch {
      setShareMsg('สร้างลิงก์ไม่สำเร็จ เช็กอินเทอร์เน็ตแล้วลองใหม่');
      return null;
    } finally {
      setSharing(false);
    }
  }
  const shortUrl = (id: string) => `${window.location.origin}/b/${id}`;

  async function shareFacebook() {
    // Open the window inside the click, or the browser blocks it as a popup.
    const win = window.open('', '_blank');
    const id = await shortId();
    if (!id) {
      win?.close();
      return;
    }
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shortUrl(id))}`;
    if (win) win.location.href = url;
    else window.location.href = url;
  }
  async function copyLink() {
    const id = await shortId();
    if (!id) return;
    try {
      await navigator.clipboard.writeText(shortUrl(id));
      setShareMsg(`คัดลอกแล้ว: ${shortUrl(id).replace(/^https?:\/\//, '')}`);
    } catch {
      setShareMsg(shortUrl(id));
    }
  }
  async function shareNative() {
    const id = await shortId();
    if (!id) return;
    try {
      await navigator.share({ title: 'จำลองบิลด์ Ragnarok Zero', url: shortUrl(id) });
    } catch {
      // Closed the share sheet.
    }
  }
  async function saveImage() {
    const id = await shortId();
    if (!id) return;
    setSharing(true);
    try {
      const res = await fetch(`/b/${id}/card.png`);
      if (!res.ok) throw new Error(String(res.status));
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement('a');
      a.href = url;
      a.download = `rozerothai-build-${id}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      setShareMsg('บันทึกรูปแล้ว โพสต์รูปนี้พร้อมลิงก์ได้เลย');
    } catch {
      setShareMsg('บันทึกรูปไม่สำเร็จ ลองใหม่อีกครั้ง');
    } finally {
      setSharing(false);
    }
  }
  // Phones offer their own share sheet (LINE, Messenger); known only after mount.
  const [canNativeShare, setCanNativeShare] = useState(false);
  useEffect(() => setCanNativeShare(typeof navigator.share === 'function'), []);

  const cls = classStats(build.cls);
  const left = result.budget - result.used;
  const weapon = build.g.weapon ? gearById(build.g.weapon.id) : null;

  // The list a slot or card socket picks from.
  const options = useMemo(() => {
    if (!picking) return [];
    const q = query.trim().toLowerCase();
    if (picking.kind === 'enchant' || picking.kind === 'costume') {
      return Object.entries(ALL_STONES)
        .filter(([, st]) => (picking.kind === 'costume' ? st.k === picking.at : st.k === 'plain' || (st.k === 'essence' && picking.at === 'armor')))
        .filter(([, st]) => !q || st.n.toLowerCase().includes(q))
        .map(([id, st]) => ({ id: Number(id), name: st.n, icon: st.i, sub: st.k === 'essence' ? 'Essence' : '', locked: false }))
        .sort((a, b) => Number(b.sub === 'Essence') - Number(a.sub === 'Essence') || a.name.localeCompare(b.name, 'en', { numeric: true }));
    }
    const slot = picking.at as Slot;
    if (picking.kind === 'card') {
      const kind = cardKind(slot, build.g[slot] ? gearById(build.g[slot]!.id) : null);
      return Object.entries(ALL_CARDS)
        .filter(([, c]) => c.on === kind && (!q || c.n.toLowerCase().includes(q)))
        .map(([id, c]) => ({ id: Number(id), name: c.n, icon: c.i, sub: '', locked: false }))
        .sort((a, b) => a.name.localeCompare(b.name));
    }
    return Object.entries(ALL_GEAR)
      // The left hand takes shields and, for an Assassin, a second weapon.
      .filter(([, g]) => (fitsSlot(g, slot) || (slot === 'shield' && fitsLeftHand(g, build.cls))) && classFits(build.cls, g.cls) && (!q || g.n.toLowerCase().includes(q)))
      .map(([id, g]) => ({
        id: Number(id),
        name: g.sl ? `${g.n} [${g.sl}]` : g.n,
        icon: g.i,
        sub: [g.wt ? WEAPON_TH[g.wt] ?? g.wt : '', g.atk ? `ATK ${g.atk}` : '', g.matk ? `MATK ${g.matk}` : '', g.def ? `DEF ${g.def}` : '', g.lv ? `Lv ${g.lv}` : '']
          .filter(Boolean)
          .join(' · '),
        locked: (g.lv ?? 0) > build.lv,
      }))
      .sort((a, b) => Number(a.locked) - Number(b.locked) || a.name.localeCompare(b.name));
  }, [picking, query, build.cls, build.lv]);

  const mobHits = useMemo(() => (mobs && mobQuery ? rankSuggestions(mobs, mobQuery, 8) : []), [mobs, mobQuery]);

  const vs = result.vs;
  const costumeCount = COSTUME_SLOTS.reduce((n, cs) => n + (build.cos?.[cs]?.filter(Boolean).length ?? 0), 0);
  const needDex = vs?.hitShort ? build.st.dex + vs.hitShort : null;
  const needAgi = vs?.fleeShort ? build.st.agi + vs.fleeShort : null;

  function pick(id: number) {
    if (!picking) return;
    const { at, kind, index } = picking;
    if (kind === 'item') setSlot(at as Slot, id);
    else if (kind === 'card') setCard(at as Slot, index, id);
    else if (kind === 'enchant') setEnchant(at as Slot, index, id);
    else setCostume(at as CostumeSlot, index, id);
  }
  function current(): number {
    if (!picking) return 0;
    const { at, kind, index } = picking;
    if (kind === 'card') return build.g[at as Slot]?.c[index] ?? 0;
    if (kind === 'enchant') return build.g[at as Slot]?.e?.[index] ?? 0;
    if (kind === 'costume') return build.cos?.[at as CostumeSlot]?.[index] ?? 0;
    return 0;
  }
  function renderPicker(at: string) {
    if (picking?.at !== at) return null;
    const label = picking.kind === 'costume' ? COSTUME_TH[at as CostumeSlot] : slotLabel(at as Slot, build.cls);
    return (
      <>
        <button type="button" className="buildsim__backdrop" aria-label="ปิด" onClick={() => setPicking(null)} />
        <div className="buildsim__picker" role="dialog" aria-label={`เลือกสำหรับ${label}`}>
          <div className="buildsim__pickerhead">
            <b>{PICK_TITLE[picking.kind]} · {label}</b>
            <button type="button" onClick={() => setPicking(null)} aria-label="ปิด">×</button>
          </div>
          <input
            // autoFocus missed keys typed right after the click; focus on mount instead.
            ref={(el) => { if (el && document.activeElement !== el) el.focus(); }}
            type="search" placeholder="พิมพ์ชื่อ" value={query} onChange={(e) => setQuery(e.target.value)} />
          <ul>
            {picking.kind !== 'item' && current() ? (
              <li><button type="button" onClick={() => pick(0)}>— ถอดออก</button></li>
            ) : null}
            {options.slice(0, 80).map((o) => (
              <li key={o.id}>
                <button type="button" className={o.locked ? 'is-locked' : undefined} onClick={() => pick(o.id)}>
                  {o.icon && <img src={o.icon} alt="" width={24} height={24} loading="lazy" />}
                  <span>{o.name}{o.sub && <small>{o.sub}{o.locked ? ' · เลเวลยังไม่ถึง' : ''}</small>}</span>
                </button>
              </li>
            ))}
            {options.length === 0 && <li className="muted">ไม่มีของที่ใส่ช่องนี้ได้</li>}
            {options.length > 80 && <li className="muted">อีก {options.length - 80} ชิ้น พิมพ์ชื่อเพื่อหา</li>}
          </ul>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Narrow screens: the numbers that move while you build, always in sight. */}
      <div className="buildsim__hud mono" aria-hidden="true">
        <span className={left < 0 ? 'is-over' : undefined}><i>PTS</i>{left}</span>
        <span><i>HIT</i>{result.hit}</span>
        <span><i>FLEE</i>{result.flee}</span>
        <span><i>ATK</i>{result.atk.status + result.atk.equip}</span>
        <span><i>ASPD</i>{result.aspd ?? '—'}</span>
        {vs?.hitChance != null && <span className="is-target"><i>โดน</i>{vs.hitChance}%</span>}
      </div>

      <div className="buildsim">
        <div className="buildsim__main">
          {/* CHARACTER */}
          <section className="card buildsim__panel">
            <PanelHead icon={HAS_SPRITE.has(build.cls) ? `/images/jobs/${build.cls}.png` : '/images/items/2228.gif'} title="CHARACTER" meta={`${TIER_TH[CLASSES.find((c) => c.slug === build.cls)?.tier ?? ''] ?? ''}`} />
            <div className="buildsim__hero">
              <div className="buildsim__heroform">
                <label className="buildsim__field buildsim__field--wide">
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
                <label className="buildsim__field">
                  Base Lv
                  <input className="mono" type="number" inputMode="numeric" min={1} max={99} value={build.lv}
                    onChange={(e) => update({ lv: Math.max(1, Math.min(99, Number(e.target.value) || 1)) })} />
                </label>
                <label className="buildsim__field">
                  Job Lv
                  <input className="mono" type="number" inputMode="numeric" min={1} max={maxJobLevel(build.cls)} value={build.job}
                    onChange={(e) => update({ job: Math.max(1, Math.min(maxJobLevel(build.cls), Number(e.target.value) || 1)) })} />
                </label>
                <p className={`buildsim__points mono${left < 0 ? ' is-over' : ''}`}>
                  <span>POINTS LEFT</span>
                  <b>{left}</b>
                  <small>ใช้ {result.used} / {result.budget}</small>
                </p>
              </div>
            </div>

            <ul className="buildsim__stats">
              {STATS.map((s) => (
                <li key={s}>
                  <div className="buildsim__statname">
                    <b className="mono">{STAT_TH[s]}</b>
                    <small>{STAT_USE[s]}</small>
                  </div>
                  <span className="buildsim__stepper">
                    <button type="button" aria-label={`ลด ${STAT_TH[s]}`} onClick={() => setStat(s, build.st[s] - 1)}>−</button>
                    <input className="mono" type="number" inputMode="numeric" min={1} max={99} value={build.st[s]}
                      aria-label={STAT_TH[s]} onChange={(e) => setStat(s, Number(e.target.value))} />
                    <button type="button" aria-label={`เพิ่ม ${STAT_TH[s]}`} onClick={() => setStat(s, build.st[s] + 1)}>+</button>
                  </span>
                  <div className="buildsim__gauge">
                    <span className="buildsim__bar" aria-hidden="true">
                      <i style={{ width: `${Math.min(100, (build.st[s] / STAT_GAUGE_MAX) * 100)}%` }} />
                      <i className="is-bonus" style={{ width: `${Math.min(100, ((result.job[s] + Math.max(0, result.bonus[s])) / STAT_GAUGE_MAX) * 100)}%` }} />
                    </span>
                    <small className="mono">
                      {result.job[s] ? `Job +${result.job[s]}` : ''}
                      {result.bonus[s] ? ` ของ ${result.bonus[s] > 0 ? '+' : ''}${result.bonus[s]}` : ''}
                      {build.st[s] < 99 ? ` · ขั้นต่อไป ${costBetween(build.st[s], build.st[s] + 1)} แต้ม` : ' · MAX'}
                    </small>
                  </div>
                  <b className="mono buildsim__total">{result.total[s]}</b>
                </li>
              ))}
            </ul>
            {result.skills.length > 0 && (
              <div className="buildsim__skillbox">
                <h3 className="buildsim__h3">เลเวลสกิล <small>ของที่ใส่มีผลตามเลเวลสกิลเหล่านี้</small></h3>
                <ul className="buildsim__skills">
                  {result.skills.map((name) => (
                    <li key={name}>
                      <span>{name}</span>
                      <input className="mono" type="number" inputMode="numeric" min={0} max={10} aria-label={`เลเวล ${name}`}
                        value={build.sk?.[name] ?? ''} placeholder="0" onChange={(e) => setSkill(name, Number(e.target.value))} />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {/* EQUIPMENT: the equip window keeps to compact tiles; the piece you
              tap opens in the editor under it (refine, cards, enchants,
              options), so the window stays readable with everything on. */}
          <section className="card buildsim__panel">
            <PanelHead icon="/images/items/1116.gif" title="EQUIPMENT" meta={`ใส่แล้ว ${Object.keys(build.g).length}/${SLOTS.length}`} />
            <div className="buildsim__tabs" role="tablist" aria-label="ชนิดของที่ใส่">
              <button type="button" role="tab" aria-selected={eqTab === 'gear'} className={eqTab === 'gear' ? 'is-on' : undefined} onClick={() => setEqTab('gear')}>
                อุปกรณ์ <small>{Object.keys(build.g).length}/{SLOTS.length}</small>
              </button>
              <button type="button" role="tab" aria-selected={eqTab === 'costume'} className={eqTab === 'costume' ? 'is-on' : undefined} onClick={() => setEqTab('costume')}>
                คอสตูมเอนชานต์ <small>{costumeCount}</small>
              </button>
            </div>

            {eqTab === 'gear' ? (
              <>
                <ul className="buildsim__slots">
                  <li className="buildsim__doll" aria-hidden="true">
                    <span className="buildsim__dollstage">
                      {HAS_SPRITE.has(build.cls) ? <img src={`/images/jobs/${build.cls}.png`} alt="" width={107} height={107} /> : <b>?</b>}
                    </span>
                    <b>{cls?.name}</b>
                    <small className="mono">Lv {build.lv} · Job {build.job}</small>
                  </li>
                  {/* The game's own equip window: slots down both sides, the
                      character in the middle (grid areas in CSS). Phones list
                      them two to a row in SLOTS order. */}
                  {SLOTS.map((slot) => {
                    const w = build.g[slot];
                    const item = w ? gearById(w.id) : null;
                    const coveredBy = SLOTS.find((s) => {
                      const o = build.g[s];
                      const it = o ? gearById(o.id) : null;
                      return it && coveredSlots(it, s).includes(slot);
                    });
                    const blockedShield = slot === 'shield' && isTwoHanded(weapon?.wt);
                    const off = coveredBy || blockedShield;
                    return (
                      <li key={slot} className={`buildsim__slot buildsim__slot--${slot}${item ? ' is-filled' : ''}${off ? ' is-off' : ''}${active === slot && item ? ' is-active' : ''}`}>
                        {off ? (
                          <span className="buildsim__offnote">
                            <em>{slotLabel(slot, build.cls)}</em>
                            {coveredBy ? `ใช้ร่วมกับ${SLOT_TH[coveredBy]}` : `จับสองมือ: ${weapon?.n ?? ''}`}
                          </span>
                        ) : (
                          <button type="button" className="buildsim__pick" aria-pressed={item ? active === slot : undefined}
                            onClick={() => (item ? openEditor(slot) : openPicker({ at: slot, kind: 'item', index: 0 }))}>
                            <span className="buildsim__icon">
                              <img src={item?.i ?? `/images/items/${SLOT_ICON[slot]}.gif`} alt="" width={24} height={24} />
                              {item && w!.r > 0 && <b className="buildsim__refine mono">+{w!.r}</b>}
                            </span>
                            <span className="buildsim__pickname">
                              <em>{slotLabel(slot, build.cls)}</em>
                              {item ? item.n : slot === 'shield' && build.cls === 'assassin' ? '+ โล่/อาวุธมือซ้าย' : '+ เลือก'}
                              {item && (
                                <span className="buildsim__pips" aria-hidden="true">
                                  {w!.c.map((cid, i) => <i key={`c${i}`} className={cid ? 'is-card' : 'is-empty'} />)}
                                  {(w!.e ?? []).map((_, i) => <i key={`e${i}`} className="is-stone" />)}
                                  {(w!.o ?? []).some(([, v]) => v) && <b>ออป {(w!.o ?? []).filter(([, v]) => v).length}</b>}
                                </span>
                              )}
                            </span>
                          </button>
                        )}
                        {!picking?.editor && renderPicker(slot)}
                      </li>
                    );
                  })}
                </ul>

                {(() => {
                  const slot = active;
                  const w = slot ? build.g[slot] : undefined;
                  const item = w ? gearById(w.id) : null;
                  if (!slot || !w || !item) {
                    return <p className="buildsim__edithint">▶ แตะของที่ใส่แล้วเพื่อตีบวก ใส่การ์ด เอนชานต์ และออปชั่น</p>;
                  }
                  const ref = refineBonusAt(item.rs, w.r);
                  return (
                    <div ref={editorRef} className="buildsim__editor" aria-label={`แก้${slotLabel(slot, build.cls)}`}>
                      <div className="buildsim__edithead">
                        <span className="buildsim__icon buildsim__icon--big">
                          {item.i && <img src={item.i} alt="" width={24} height={24} />}
                          {w.r > 0 && <b className="buildsim__refine mono">+{w.r}</b>}
                        </span>
                        <div>
                          <em>{slotLabel(slot, build.cls)}</em>
                          <b>{item.n}{item.sl ? ` [${item.sl}]` : ''}</b>
                          <small>
                            {[item.wt ? WEAPON_TH[item.wt] ?? '' : '', item.atk ? `ATK ${item.atk}` : '', item.matk ? `MATK ${item.matk}` : '', item.def ? `DEF ${item.def}` : '', item.lv ? `Lv ${item.lv}` : '']
                              .filter(Boolean)
                              .join(' · ')}
                          </small>
                        </div>
                        <span className="buildsim__editbtns">
                          <button type="button" onClick={() => openPicker({ at: slot, kind: 'item', index: 0, editor: true })}>เปลี่ยน</button>
                          <button type="button" onClick={() => setSlot(slot, null)}>ถอด</button>
                        </span>
                      </div>

                      <div className="buildsim__editrow">
                        <span className="buildsim__editlabel">ตีบวก</span>
                        {item.rs ? (
                          <span className="buildsim__refinebar">
                            <select aria-label="ตีบวก" value={w.r} onChange={(e) => setRefine(slot, Number(e.target.value))}>
                              {Array.from({ length: 21 }, (_, r) => <option key={r} value={r}>+{r}</option>)}
                            </select>
                            {ref ? <b className="mono">{ref.stat} +{ref.value}</b> : <small className="muted">ยังไม่ได้ตีบวก</small>}
                          </span>
                        ) : (
                          <small className="muted">ของชิ้นนี้ตีบวกไม่ได้</small>
                        )}
                      </div>

                      {w.c.length > 0 && (
                        <div className="buildsim__editrow">
                          <span className="buildsim__editlabel">การ์ด</span>
                          <span className="buildsim__chips">
                            {w.c.map((cid, i) => {
                              const card = cid ? cardById(cid) : null;
                              return (
                                <button key={i} type="button" className={`buildsim__chip buildsim__chip--card${card ? '' : ' is-empty'}`}
                                  onClick={() => openPicker({ at: slot, kind: 'card', index: i, editor: true })}>
                                  {card?.i && <img src={card.i} alt="" width={18} height={18} />}
                                  {card ? card.n : '+ การ์ด'}
                                </button>
                              );
                            })}
                          </span>
                        </div>
                      )}

                      <div className="buildsim__editrow">
                        <span className="buildsim__editlabel">{slot === 'armor' ? 'เอนชานต์ / Essence' : 'เอนชานต์'}</span>
                        <span className="buildsim__chips">
                          {(w.e ?? []).map((sid, i) => {
                            const st = stoneById(sid);
                            return st ? (
                              <button key={i} type="button" className="buildsim__chip buildsim__chip--stone"
                                onClick={() => openPicker({ at: slot, kind: 'enchant', index: i, editor: true })}>
                                {st.i && <img src={st.i} alt="" width={18} height={18} />}{st.n}
                              </button>
                            ) : null;
                          })}
                          {(w.e ?? []).length < MAX_ENCHANTS && (
                            <button type="button" className="buildsim__chip is-empty"
                              onClick={() => openPicker({ at: slot, kind: 'enchant', index: (w.e ?? []).length, editor: true })}>
                              + เพิ่ม
                            </button>
                          )}
                        </span>
                      </div>

                      <div className="buildsim__editrow">
                        <span className="buildsim__editlabel">ออปชั่น</span>
                        <span className="buildsim__optlist">
                          {(w.o ?? []).map(([k, v], i) => (
                            <span key={i} className="buildsim__opt">
                              <select aria-label="ชนิดออปชั่น" value={k} onChange={(e) => setOption(slot, i, [e.target.value, v])}>
                                {OPTION_LABELS.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
                              </select>
                              <input className="mono" type="number" inputMode="numeric" aria-label="ค่าออปชั่น" value={v || ''} placeholder="0"
                                onChange={(e) => setOption(slot, i, [k, Math.max(-999, Math.min(9999, Math.floor(Number(e.target.value)) || 0))])} />
                              <button type="button" aria-label="ลบออปชั่น" onClick={() => setOption(slot, i, null)}>×</button>
                            </span>
                          ))}
                          {(w.o ?? []).length < MAX_OPTIONS && (
                            <button type="button" className="buildsim__chip is-empty" onClick={() => setOption(slot, (w.o ?? []).length, ['atk', 0])}>
                              + เพิ่มออปชั่น
                            </button>
                          )}
                        </span>
                      </div>
                      {picking?.editor && renderPicker(slot)}
                    </div>
                  );
                })()}

                <label className="buildsim__check">
                  <input type="checkbox" checked={!!build.siege} onChange={(e) => update({ siege: e.target.checked || undefined })} />
                  อยู่ในวอร์ (นับผลที่ใช้ได้เฉพาะในวอร์)
                </label>
              </>
            ) : (
              /* COSTUME: the stones costume slots take (the costume itself adds nothing). */
              <ul className="buildsim__costumes">
                {COSTUME_SLOTS.map((cs) => {
                  const list = build.cos?.[cs] ?? [];
                  return (
                    <li key={cs} className={`buildsim__slot${list.some(Boolean) ? ' is-filled' : ''}`}>
                      <span className="buildsim__pickname"><em>{COSTUME_TH[cs]}</em></span>
                      <span className="buildsim__chips">
                        {Array.from({ length: COSTUME_STONES[cs] }, (_, i) => {
                          const st = list[i] ? stoneById(list[i]) : null;
                          return (
                            <button key={i} type="button" className={`buildsim__chip buildsim__chip--stone${st ? '' : ' is-empty'}`}
                              onClick={() => openPicker({ at: cs, kind: 'costume', index: st ? i : list.filter(Boolean).length })}>
                              {st?.i && <img src={st.i} alt="" width={18} height={18} />}
                              {st ? st.n : '+ ใส่หิน'}
                            </button>
                          );
                        })}
                      </span>
                      {renderPicker(cs)}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* FOOD */}
          <section className="card buildsim__panel">
            <PanelHead icon="/images/items/12065.gif" title="FOOD & BUFF" meta={build.f.length ? `${build.f.length} อย่าง` : undefined} />
            <div className="buildsim__foods">
              {build.f.map((id) => {
                const f = foodById(id);
                return f ? (
                  <button key={id} type="button" className="buildsim__food" aria-label={`เอา ${f.name} ออก`}
                    onClick={() => update({ f: build.f.filter((x) => x !== id) })}>
                    <img src={`/images/items/${id}.gif`} alt="" width={24} height={24} />
                    <span>{f.name}<small>{foodText(f)}</small></span>
                    <i aria-hidden="true">×</i>
                  </button>
                ) : null;
              })}
            </div>
            <select className="buildsim__foodpick" value="" aria-label="เพิ่มอาหาร" onChange={(e) => e.target.value && update({ f: [...build.f, Number(e.target.value)] })}>
              <option value="">+ เพิ่มอาหาร/ยา</option>
              {FOODS.filter((f) => !build.f.includes(f.id)).map((f) => (
                <option key={f.id} value={f.id}>{f.name} — {foodText(foodById(f.id)!)}</option>
              ))}
            </select>
          </section>
        </div>

        <aside className="buildsim__side">
          {/* STATUS WINDOW */}
          <section className="card buildsim__window">
            <PanelHead icon="/images/items/2228.gif" title="STATUS" pink meta={`Lv ${build.lv} / ${build.job}`} />
            <p className="buildsim__who">{cls?.name} · Lv {build.lv} / Job {build.job} · {weapon ? WEAPON_TH[weapon.wt ?? ''] ?? weapon.n : 'มือเปล่า'}</p>
            <dl className="buildsim__grid">
              <div className="is-big"><dt>HIT</dt><dd className="mono">{result.hit}</dd></div>
              <div className="is-big"><dt>FLEE</dt><dd className="mono">{result.flee}</dd></div>
              <div><dt>ATK</dt><dd className="mono">{result.atk.status} <small>+</small> {result.atk.equip}</dd></div>
              <div><dt>MATK</dt><dd className="mono">{result.matk.status} <small>+</small> {result.matk.equip}</dd></div>
              <div><dt>CRI</dt><dd className="mono">{result.crit}</dd></div>
              <div><dt>Perfect Dodge</dt><dd className="mono">{result.pd}</dd></div>
              <div><dt>DEF</dt><dd className="mono">{result.def.hard} <small>+</small> {result.def.soft}</dd></div>
              <div><dt>MDEF</dt><dd className="mono">{result.mdef.hard} <small>+</small> {result.mdef.soft}</dd></div>
              <div className="is-est"><dt>ASPD <i>ประมาณ</i></dt><dd className="mono">{result.aspd ?? '—'}</dd></div>
              <div className="is-est"><dt>ร่ายแปรผัน <i>ประมาณ</i></dt><dd className="mono">{Math.round(result.vct * 100)}%</dd></div>
              <div className={result.hpMeasured ? undefined : 'is-est'}><dt>HP{!result.hpMeasured && <i>ประมาณ</i>}</dt><dd className="mono">{result.hp?.toLocaleString('en-US') ?? '—'}</dd></div>
              <div className={result.hpMeasured ? undefined : 'is-est'}><dt>SP{!result.hpMeasured && <i>ประมาณ</i>}</dt><dd className="mono">{result.sp?.toLocaleString('en-US') ?? '—'}</dd></div>
              <div className="is-est is-wide">
                <dt>น้ำหนักของที่ใส่ / แบกได้ <i>ประมาณ</i></dt>
                <dd className="mono">{result.weight.worn} / {result.weight.cap.toLocaleString('en-US')}</dd>
              </div>
              {result.fct !== 0 && <div className="is-wide"><dt>ร่ายคงที่</dt><dd className="mono">{result.fct > 0 ? '+' : ''}{result.fct}%</dd></div>}
            </dl>
            {result.warnings.length > 0 && (
              <ul className="buildsim__warn">
                {result.warnings.map((w) => <li key={w}>⚠ {w}</li>)}
              </ul>
            )}
            <div className="buildsim__actions">
              <button type="button" className="btn buildsim__fb" disabled={sharing} onClick={() => void shareFacebook()}>
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H7.8v3h2.6V21h3.1z"/></svg>
                แชร์ Facebook
              </button>
              <span className="buildsim__sharerow">
                <button type="button" disabled={sharing} onClick={() => void copyLink()}>คัดลอกลิงก์</button>
                <button type="button" disabled={sharing} onClick={() => void saveImage()}>บันทึกเป็นรูป</button>
                {canNativeShare && <button type="button" disabled={sharing} onClick={() => void shareNative()}>แชร์ไป LINE/แอปอื่น</button>}
              </span>
              {shareMsg && <p className="buildsim__sharemsg" role="status">{shareMsg}</p>}
              <button type="button" className="buildsim__reset" onClick={() => { update(EMPTY_BUILD); setTarget(null); setTargetImg(null); setActive(null); }}>เริ่มบิลด์ใหม่</button>
            </div>
            <p className="buildsim__legend"><i>ประมาณ</i> = สูตรที่ยังไม่มีใครวัดใน Global</p>
          </section>

          {/* TARGET */}
          <section className="card buildsim__panel">
            <PanelHead icon="/images/monsters/1002.gif" title="TARGET" />
            <div className="buildsim__mob">
              <input type="search" placeholder="ชื่อมอน เช่น Poring, หมาป่า" value={mobQuery}
                onFocus={() => void wantMobs()} onChange={(e) => setMobQuery(e.target.value)} aria-label="ค้นหามอน" />
              {mobHits.length > 0 && (
                <ul className="buildsim__moblist">
                  {mobHits.map((h) => (
                    <li key={h.entry.id}>
                      <button type="button" onClick={() => void loadMonster(h.entry.id)}>
                        {h.entry.sprite && <img src={h.entry.sprite} alt="" width={32} height={32} loading="lazy" />}
                        <span>{h.entry.label} <small>Lv {h.entry.lv} · {h.entry.sub}</small></span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {target && vs ? (
              <div className="buildsim__vs">
                <div className="buildsim__foe">
                  {targetImg && <img src={targetImg} alt="" width={64} height={64} />}
                  <div>
                    <b>{target.name}</b>
                    <small>
                      Lv {target.level} · {[target.race ? RACE_TH[target.race] ?? target.race : '', target.element ? ELEMENT_TH[target.element] ?? target.element : '', target.size].filter(Boolean).join(' · ')}
                    </small>
                  </div>
                </div>
                <div className="buildsim__meter">
                  <span>ตีโดน</span>
                  <span className="buildsim__bar buildsim__bar--hit" aria-hidden="true"><i style={{ width: `${vs.hitChance ?? 0}%` }} /></span>
                  <b className="mono">{vs.hitChance !== null ? `${vs.hitChance}%` : '?'}</b>
                </div>
                <div className="buildsim__meter">
                  <span>หลบได้</span>
                  <span className="buildsim__bar buildsim__bar--flee" aria-hidden="true"><i style={{ width: `${((vs.dodge ?? 0) / 95) * 100}%` }} /></span>
                  <b className="mono">{vs.dodge !== null ? `${vs.dodge}%` : '?'}</b>
                </div>
                <div className="buildsim__meter">
                  <span>ดาเมจ <i>ประมาณ</i></span>
                  <b className="mono buildsim__dmg">{vs.damage ?? 'ไม่ทราบ'}</b>
                </div>
                {vs.hands && (
                  <p className="buildsim__hands mono">
                    ขวา {vs.hands.right} <small>({vs.hands.rightPct}%)</small> + ซ้าย {vs.hands.left} <small>({vs.hands.leftPct}%)</small>
                  </p>
                )}
                <ul className="buildsim__need">
                  {vs.hitShort === 0 && <li className="is-ok">✔ ตีโดน 100% แล้ว</li>}
                  {vs.hitShort ? (
                    <li>
                      ขาด HIT อีก <b>{vs.hitShort}</b>
                      {needDex !== null && needDex <= 99
                        ? ` — DEX ${build.st.dex} → ${needDex} ใช้ ${costBetween(build.st.dex, needDex)} แต้ม`
                        : ' — อัป DEX อย่างเดียวไม่พอ ต้องใช้ของ/อาหารช่วย'}
                    </li>
                  ) : null}
                  {vs.fleeShort === 0 && <li className="is-ok">✔ หลบได้ตัน 95% แล้ว</li>}
                  {vs.fleeShort ? (
                    <li>
                      หลบตัน 95% ขาด FLEE อีก <b>{vs.fleeShort}</b>
                      {needAgi !== null && needAgi <= 99
                        ? ` — AGI ${build.st.agi} → ${needAgi} ใช้ ${costBetween(build.st.agi, needAgi)} แต้ม`
                        : ' — อัป AGI อย่างเดียวไม่พอ'}
                    </li>
                  ) : null}
                </ul>
                <p className="buildsim__legend">ดาเมจตีธรรมดา ไม่คริ ไม่รวมสกิล{vs.multiplier !== 1 && ` · ตีเผ่า/ธาตุ/ขนาด ×${vs.multiplier.toFixed(2)}`}</p>
              </div>
            ) : (
              <p className="buildsim__empty">
                <img src="/images/monsters/1002.gif" alt="" width={41} height={39} />
                เลือกมอน ดูว่าบิลด์นี้ตีโดนกี่ % หลบได้กี่ % และต้องอัปอะไรอีก
              </p>
            )}
          </section>

          {/* EFFECTS */}
          <section className="card buildsim__panel">
            <PanelHead icon="/images/items/4001.gif" title="EFFECTS" meta={result.skipped.length ? `ยังไม่นับ ${result.skipped.length}` : undefined} />
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
        </aside>
      </div>
    </>
  );
}
