'use client';

// The one input bar for all four modes of the farm tool (decision 2 of the
// integration spec). Every field is optional.
//
// Folded by default, filled or not. Opened, the five boxes took the whole
// first screen of a 390px phone and pushed the mode tabs below it. Folded, it
// was first a sentence with a large yellow button wrapped under it, which the
// owner called ugly on a phone (11 Sep 2026). It is now one tappable row: what
// it is, what filling it in unlocks for the mode on screen, and a chevron.
// That row also replaced the separate yellow "กรอกเพิ่ม" line under the tabs,
// which said the same thing a second time.
//
// Opened, it is a summary line and tabs (owner picked the tabbed look of
// three drafts, 30 Oct 2026): the status window as the game shows it
// ("57+19"), buffs, food, the numbers typed by hand, and the overnight bot.
// A saved build from /tools/build fills everything in one tap.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ToolNumbers from '@/components/ToolNumbers';
import { writePlayerNumbers, type PlayerField, type PlayerNumbers } from '@/lib/player-numbers';
import type { BotStyle, FarmPotion } from '@/lib/farm-engine/types';
import type { BotSettings } from '@/lib/farm-engine/bot-session';
import { ALL_BUFFS } from '@/lib/build-calc';
import { classStats, STATS, WEAPON_TH, type Stat } from '@/lib/class-stats';
import { allFoods } from '@/lib/food-buffs';
import {
  buildNumbers,
  EMPTY_WINDOW,
  readSavedBuilds,
  readWindow,
  windowNumbers,
  writeWindow,
  type FarmWindow,
  type SavedBuildRef,
} from '@/lib/farm-window';
import classFile from '@/data/class-stats.json';
import BotSettingsPanel from './BotSettingsPanel';

export const BAR_FIELDS: Record<BotStyle, PlayerField[]> = {
  melee: ['level', 'damagePerHit', 'aspd', 'hit', 'flee'],
  magic: ['level', 'damagePerHit', 'castSeconds', 'flee'],
};

/** The overnight modes' second group: what decides whether the bot lives till morning. */
export const SURVIVAL_FIELDS: PlayerField[] = ['maxHp', 'maxSp', 'def', 'vit', 'potions', 'maxWeight', 'weightNow'];

function summary(style: BotStyle, numbers: PlayerNumbers): string[] {
  const parts = [style === 'magic' ? 'สายเวท' : 'สายตี'];
  if (numbers.level !== undefined) parts.push(`Lv ${numbers.level}`);
  if (numbers.damagePerHit !== undefined) parts.push(`ดาเมจ ${numbers.damagePerHit}`);
  if (style === 'melee' && numbers.aspd !== undefined) parts.push(`ASPD ${numbers.aspd}`);
  if (style === 'magic' && numbers.castSeconds !== undefined) parts.push(`${numbers.castSeconds} วิ/ร่าย`);
  if (style === 'melee' && numbers.hit !== undefined) parts.push(`HIT ${numbers.hit}`);
  if (numbers.flee !== undefined) parts.push(`FLEE ${numbers.flee}`);
  if (numbers.maxHp !== undefined) parts.push(`HP ${numbers.maxHp}`);
  if (numbers.def !== undefined) parts.push(`DEF ${numbers.def}`);
  return parts;
}

type Tab = 'stats' | 'buffs' | 'food' | 'own' | 'bot';
const TABS: { id: Tab; label: string }[] = [
  { id: 'stats', label: 'สเตตัส' },
  { id: 'buffs', label: 'สกิล · บัฟ' },
  { id: 'food', label: 'อาหาร · ยา' },
  { id: 'own', label: 'ใส่เลขเอง' },
  { id: 'bot', label: 'บอทค้างคืน' },
];

const storage = () => (typeof window === 'undefined' ? null : window.localStorage);

export default function FarmNumbersBar({
  style,
  onStyle,
  numbers,
  onNumbers,
  hints,
  potions,
  overnight,
  bot,
  onBot,
}: {
  style: BotStyle;
  onStyle: (style: BotStyle) => void;
  numbers: PlayerNumbers;
  onNumbers: (next: PlayerNumbers) => void;
  /** What filling in more would unlock in the mode on screen. */
  hints: string[];
  /** HP potions to pick from; empty until the payload loads. */
  potions: FarmPotion[];
  /** The mode on screen leaves a bot overnight: show the survival group. */
  overnight: boolean;
  bot: BotSettings;
  onBot: (next: BotSettings) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [tab, setTab] = useState<Tab>('stats');
  const [win, setWin] = useState<FarmWindow>(EMPTY_WINDOW);
  const [saved, setSaved] = useState<SavedBuildRef[] | null>(null);
  const [usedBuild, setUsedBuild] = useState<string | null>(null);
  const filled = [...BAR_FIELDS[style], ...SURVIVAL_FIELDS].some((field) => numbers[field] !== undefined);

  useEffect(() => {
    if (!expanded) return;
    const w = readWindow(storage());
    if (w) setWin(w);
    else if (numbers.level !== undefined) setWin({ ...EMPTY_WINDOW, lv: numbers.level });
  }, [expanded]); // eslint-disable-line react-hooks/exhaustive-deps

  function apply(next: PlayerNumbers) {
    onNumbers(next);
    writePlayerNumbers(storage(), next);
  }

  // A change in the window, its buffs or its food: HIT, FLEE, ASPD and HP
  // follow it; damage and the rest stay as they were.
  function changeWindow(w: FarmWindow) {
    setWin(w);
    writeWindow(storage(), w);
    setUsedBuild(null);
    apply({ ...numbers, ...windowNumbers(w) });
  }

  function pickBuild(ref: SavedBuildRef) {
    setUsedBuild(ref.name);
    setSaved(null);
    apply({ ...numbers, ...buildNumbers(ref.build) });
  }

  function pickPotion(id: number | null) {
    const next = { ...numbers };
    if (id === null) delete next.potionId;
    else next.potionId = id;
    apply(next);
  }

  if (!expanded) {
    return (
      <div className="farmbar">
        <button
          type="button"
          className={`farmbar__prompt${filled ? ' farmbar__prompt--filled' : ''}`}
          aria-expanded={false}
          onClick={() => setExpanded(true)}
        >
          {!filled && (
            <span className="farmbar__plus" aria-hidden="true">
              +
            </span>
          )}
          <span className="farmbar__text">
            {filled ? (
              <span className="farmbar__chips">
                {summary(style, numbers).map((part) => (
                  <span key={part} className="farmbar__chip">
                    {part}
                  </span>
                ))}
              </span>
            ) : (
              <strong>กรอกตัวเลขตัวละคร</strong>
            )}
            {hints.length > 0 ? (
              <small>
                {filled ? 'เพิ่มได้: ' : 'ไม่บังคับ · '}
                {hints.join(' · ')}
              </small>
            ) : (
              !filled && <small>ไม่บังคับ ไม่กรอกก็ดูได้</small>
            )}
          </span>
          <span className="farmbar__chev" aria-hidden="true">
            {filled ? 'แก้ ›' : '›'}
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="farmbar farmbar--open">
      <div className="farmbar__sum">
        <span className="farmbar__chips">
          {summary(style, numbers).map((part) => (
            <span key={part} className="farmbar__chip">
              {part}
            </span>
          ))}
        </span>
        <button type="button" className="btn farmbar__savedbtn" onClick={() => setSaved(saved ? null : readSavedBuilds(storage()))}>
          ▶ ใช้บิลด์ที่บันทึกไว้
        </button>
      </div>
      {saved && (
        <div className="farmbar__chiplist farmbar__savedlist">
          {saved.length === 0 ? (
            <p className="farmbar__group" style={{ margin: 0 }}>
              ยังไม่มีบิลด์ที่บันทึกในเครื่องนี้ · ทำได้ที่ <Link href="/tools/build">จำลองบิลด์</Link> แล้วกดบันทึก
            </p>
          ) : (
            saved.map((ref) => (
              <button key={ref.name} type="button" className="farmchip" onClick={() => pickBuild(ref)}>
                {ref.name} · Lv {ref.build.lv}
              </button>
            ))
          )}
        </div>
      )}
      {usedBuild && (
        <p className="farmbar__group">
          ใช้ตัวเลขจากบิลด์ <strong>{usedBuild}</strong> แล้ว · ดาเมจคิดกับเป้าที่ไม่มี DEF ถ้าในเกมไม่ตรง แก้ได้ที่แท็บ &quot;ใส่เลขเอง&quot;
        </p>
      )}
      <div className="filterbar farmbar__style" role="radiogroup" aria-label="สายตี หรือ สายเวท">
        <label className="cvtoggle">
          <input type="radio" name="farm-style" checked={style === 'melee'} onChange={() => onStyle('melee')} />
          สายตี (ตีธรรมดา)
        </label>
        <label className="cvtoggle">
          <input type="radio" name="farm-style" checked={style === 'magic'} onChange={() => onStyle('magic')} />
          ใช้สกิลโจมตี (สายเวท หรือสกิลในแท็บสกิลบอท)
        </label>
      </div>
      <div className="farmbar__tabs" role="tablist" aria-label="กรอกค่าตัวละคร">
        {TABS.filter((t) => t.id !== 'bot' || overnight).map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={`farmbar__tab${tab === t.id ? ' farmbar__tab--on' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="farmbar__pane" role="tabpanel">
        {tab === 'stats' && <StatsTab win={win} onWin={changeWindow} />}
        {tab === 'buffs' && <BuffsTab win={win} onWin={changeWindow} />}
        {tab === 'food' && <FoodTab win={win} onWin={changeWindow} />}
        {tab === 'own' && (
          <ToolNumbers
            fields={BAR_FIELDS[style]}
            numbers={numbers}
            onChange={onNumbers}
            labels={{
              level: { unlocks: 'ช่วงเลเวล · หักดรอป' },
              damagePerHit: style === 'magic' ? { label: 'ดาเมจต่อร่าย', hint: 'เช่น 900', unlocks: 'ต่อชั่วโมง' } : { label: 'ดาเมจต่อที', hint: 'เช่น 400', unlocks: 'ต่อชั่วโมง' },
              aspd: { unlocks: 'ต่อชั่วโมง' },
              castSeconds: { label: 'วินาทีต่อสกิล', hint: 'เช่น 0.5', unlocks: 'ดีเลย์ที่ตั้งในแท็บสกิลบอท' },
              flee: { unlocks: 'มันตีเราโดนแค่ไหน' },
            }}
            note="พิมพ์ทับเลขที่คำนวณได้ · ดาเมจดูจากเลขที่เด้งตอนตีมอนในเกม · ทุกช่องไม่บังคับ ใช้ร่วมกันทุกเครื่องมือฟาร์ม"
          />
        )}
        {tab === 'bot' && overnight && (
          <>
            <p className="farmbar__group">
              <strong>บอทรอดทั้งคืนไหม</strong> · กรอก Max HP (กับดาเมจ, {style === 'magic' ? 'วินาทีต่อร่าย' : 'ASPD'}, FLEE)
              แล้วเว็บจะคิดจากดาเมจที่โดนตีจริงแทนการหลบอย่างเดียว
            </p>
            <ToolNumbers
              fields={SURVIVAL_FIELDS}
              numbers={numbers}
              onChange={onNumbers}
              labels={{
                maxHp: { unlocks: 'รอดไหม' },
                def: { label: 'DEF', unlocks: 'ตามหน้าต่างสเตตัส' },
              }}
              note="ตัวเลขจากหน้าต่างสเตตัส · DEF ว่าง = คิดเฉพาะ DEF จากเลเวลกับ VIT · ถือยา ว่าง = ใส่เต็มถึง 70% ของน้ำหนักสูงสุด (เกิน 70% เลือดไม่ฟื้นเอง)"
            />
            <div className="farmbar__potions" role="radiogroup" aria-label="ยาที่บอทใช้">
              <span className="toolnumbers__label">ยาที่บอทกิน</span>
              <label className="cvtoggle">
                <input type="radio" name="farm-potion" checked={numbers.potionId === undefined} onChange={() => pickPotion(null)} />
                ไม่ใช้ยา
              </label>
              {potions.map((p) => (
                <label key={p.id} className="cvtoggle">
                  <input type="radio" name="farm-potion" checked={numbers.potionId === p.id} onChange={() => pickPotion(p.id)} />
                  {p.icon && <img src={p.icon} alt="" width={18} height={18} />}
                  {p.name}
                  {p.price !== null && <span className="farmbar__price">{p.price.toLocaleString('en-US')}z</span>}
                </label>
              ))}
            </div>
            <p className="farmbar__group" style={{ marginTop: 14 }}>
              <strong>ตั้งค่าบอท</strong> · ตามหน้าต่างบอทในเกม เครื่องมือเลือกมอนที่ควรติ๊กให้เอง
            </p>
            <BotSettingsPanel value={bot} onChange={onBot} />
          </>
        )}
      </div>
      <button type="button" className="btn" style={{ marginTop: 10 }} onClick={() => setExpanded(false)}>
        เสร็จ
      </button>
    </div>
  );
}

const CLASSES = Object.entries((classFile as unknown as { classes: Record<string, { name: string }> }).classes)
  .map(([slug, c]) => ({ slug, name: c.name }))
  .sort((a, b) => a.name.localeCompare(b.name));

const clampInput = (v: string, lo: number, hi: number) => Math.min(hi, Math.max(lo, Math.round(Number(v) || 0)));

/** Class, levels, weapon type and the six stats as the status window shows them. */
function StatsTab({ win, onWin }: { win: FarmWindow; onWin: (w: FarmWindow) => void }) {
  const weapons = Object.keys(classStats(win.cls)?.aspd ?? {});
  function setStat(part: 'st' | 'xb', s: Stat, v: string) {
    onWin({ ...win, [part]: { ...win[part], [s]: clampInput(v, part === 'st' ? 1 : 0, part === 'st' ? 99 : 200) } });
  }
  return (
    <div className="farmwin">
      <div className="farmwin__top">
        <label>
          <span className="toolnumbers__label">อาชีพ</span>
          <select
            value={win.cls}
            onChange={(e) => {
              const cls = e.target.value;
              const wt = classStats(cls)?.aspd[win.wt] !== undefined ? win.wt : 'bare_hand';
              onWin({ ...win, cls, wt });
            }}
          >
            {CLASSES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="toolnumbers__label">Base Lv</span>
          <input className="mono" type="number" inputMode="numeric" value={win.lv} onChange={(e) => onWin({ ...win, lv: clampInput(e.target.value, 1, 99) })} />
        </label>
        <label>
          <span className="toolnumbers__label">Job Lv</span>
          <input className="mono" type="number" inputMode="numeric" value={win.job} onChange={(e) => onWin({ ...win, job: clampInput(e.target.value, 1, 70) })} />
        </label>
        <label>
          <span className="toolnumbers__label">อาวุธ</span>
          <select value={win.wt} onChange={(e) => onWin({ ...win, wt: e.target.value })}>
            {weapons.map((w) => (
              <option key={w} value={w}>
                {WEAPON_TH[w] ?? w}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="farmwin__stats">
        {STATS.map((s) => (
          <div key={s} className="farmwin__stat">
            <b>{s.toUpperCase()}</b>
            <input className="mono" type="number" inputMode="numeric" aria-label={`${s.toUpperCase()} ที่อัปเอง`} value={win.st[s]} onChange={(e) => setStat('st', s, e.target.value)} />
            <span aria-hidden="true">+</span>
            <input className="mono" type="number" inputMode="numeric" aria-label={`${s.toUpperCase()} โบนัส`} value={win.xb[s]} onChange={(e) => setStat('xb', s, e.target.value)} />
          </div>
        ))}
      </div>
      <p className="farmbar__group" style={{ margin: '10px 0 0' }}>
        กด Alt+A ในเกม · เลขซ้าย = ที่อัปเอง · เลขขวา = โบนัส (อ่านตอนยังไม่มีบัฟ) · บัฟกับอาหารเลือกในแท็บถัดไป · HIT FLEE ASPD HP คำนวณให้เอง
      </p>
    </div>
  );
}

const BUFFS = [...ALL_BUFFS].sort((a, b) => a.n.localeCompare(b.n));

function BuffsTab({ win, onWin }: { win: FarmWindow; onWin: (w: FarmWindow) => void }) {
  function toggle(slug: string, max: number) {
    const bf = { ...win.bf };
    if (bf[slug]) delete bf[slug];
    else bf[slug] = max;
    onWin({ ...win, bf });
  }
  const chip = (b: (typeof BUFFS)[number]) => (
    <button
      key={b.s}
      type="button"
      className={`farmchip${win.bf[b.s] ? ' farmchip--on' : ''}`}
      aria-pressed={!!win.bf[b.s]}
      onClick={() => toggle(b.s, b.max)}
    >
      {b.n}
      {win.bf[b.s] ? ` ${win.bf[b.s]}` : ''}
    </button>
  );
  // The class's own skills first; the rest come from party members.
  const own = BUFFS.filter((b) => b.cls.includes(win.cls));
  const party = BUFFS.filter((b) => !b.cls.includes(win.cls));
  return (
    <>
      {own.length > 0 && (
        <>
          <p className="farmbar__group">
            <strong>สกิลของ {classStats(win.cls)?.name ?? win.cls}</strong>
          </p>
          <div className="farmbar__chiplist" style={{ marginBottom: 12 }}>{own.map(chip)}</div>
        </>
      )}
      <p className="farmbar__group">
        <strong>บัฟจากคนอื่น</strong>
      </p>
      <div className="farmbar__chiplist">{party.map(chip)}</div>
      <p className="farmbar__group" style={{ margin: '10px 0 0' }}>
        เลือกแล้วคิดที่เลเวลสูงสุดของสกิล · สกิลติดตัวของอาชีพ (เช่น Sword Mastery) เลือกได้ที่ <Link href="/tools/build">จำลองบิลด์</Link>
      </p>
    </>
  );
}

const FOODS = allFoods();
const SINGLE = Object.fromEntries(
  STATS.map((s) => [
    s,
    FOODS.filter((f) => Object.keys(f.b).length === 1 && f.b[s]).sort((a, b) => (b.b[s] ?? 0) - (a.b[s] ?? 0)),
  ]),
) as Record<Stat, typeof FOODS>;
const MIXED = FOODS.filter((f) => Object.keys(f.b).length > 1 || !STATS.some((s) => f.b[s]));

function FoodTab({ win, onWin }: { win: FarmWindow; onWin: (w: FarmWindow) => void }) {
  // One food per stat, as in game: a new STR dish replaces the last one.
  function pick(s: Stat, id: number | null) {
    const others = win.f.filter((x) => !SINGLE[s].some((f) => f.id === x));
    onWin({ ...win, f: id === null ? others : [...others, id] });
  }
  function toggle(id: number) {
    onWin({ ...win, f: win.f.includes(id) ? win.f.filter((x) => x !== id) : [...win.f, id] });
  }
  return (
    <>
      <div className="farmwin__food">
        {STATS.map((s) => {
          const on = SINGLE[s].find((f) => win.f.includes(f.id));
          return (
            <label key={s}>
              <span className="toolnumbers__label">{s.toUpperCase()}</span>
              <select value={on?.id ?? ''} onChange={(e) => pick(s, e.target.value ? Number(e.target.value) : null)}>
                <option value="">ไม่กิน</option>
                {SINGLE[s].map((f) => (
                  <option key={f.id} value={f.id}>
                    +{f.b[s]} {f.name}
                  </option>
                ))}
              </select>
            </label>
          );
        })}
      </div>
      <div className="farmbar__chiplist" style={{ marginTop: 10 }}>
        {MIXED.map((f) => (
          <button
            key={f.id}
            type="button"
            className={`farmchip${win.f.includes(f.id) ? ' farmchip--on' : ''}`}
            aria-pressed={win.f.includes(f.id)}
            onClick={() => toggle(f.id)}
          >
            {f.name}
          </button>
        ))}
      </div>
      <p className="farmbar__group" style={{ margin: '10px 0 0' }}>
        ยา ASPD (Concentration, Awakening, Berserk) ยังไม่รู้ว่าเกมนี้เพิ่มเท่าไร · ดื่มแล้วดู ASPD ในหน้าต่างสเตตัส แล้วใส่ในแท็บ &quot;ใส่เลขเอง&quot;
      </p>
    </>
  );
}
