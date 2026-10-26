'use client';
// Everything the character can change, all picked by tapping: headgear and
// garments as a grid of their own sprites (one tile per look, lib/dress-up/catalog.ts),
// classes as their portraits, hair as drawn heads, poses and weapons as buttons.
// Three tabs: wear, class and hair, pose and weapon. Item names come from the
// server (the game client's own item table).
import { useMemo, useState } from 'react';
import {
  INDEX, POSE_TYPE, SLOTS, baseClass, classOf, hasSprite, highClass, mountOf, plainOf, sexOf, takeOff, wear, withClass,
  withMount, withOutfit,
  type Look, type Pose, type Sex, type Slot,
} from '@/lib/dress-up/look';
import { THUMBS, pickId, randomLook, tileDrawn, tileOf, tilesFor, type Filter, type Tile } from '@/lib/dress-up/catalog';
import { assetUrl } from '@/lib/dress-up/load';

const SLOT_TH: Record<Slot, string> = { upper: 'หมวกบน', mid: 'หมวกกลาง', lower: 'หมวกล่าง', garment: 'ผ้าคลุม' };
const FILTER_TH: Record<Filter, string> = { all: 'ทั้งหมด', costume: 'คอสตูม', plain: 'หมวกธรรมดา' };

const POSE_TH: Record<Pose, string> = {
  stand: 'ยืน', walk: 'เดิน', sit: 'นั่ง', ready: 'ตั้งท่า', attack: 'โจมตี', hurt: 'โดนตี', dead: 'นอนตาย',
};

const HEAD_TH = ['หน้าตรง', 'หันซ้าย', 'หันขวา'] as const;

// docs/PLAYER_GLOSSARY.md
const WEAPON_TH: Record<string, string> = {
  dagger: 'มีด', sword: 'ดาบมือเดียว', sword2h: 'ดาบสองมือ', spear: 'หอกมือเดียว', spear2h: 'หอกสองมือ',
  axe: 'ขวานมือเดียว', axe2h: 'ขวานสองมือ', mace: 'กระบอง', rod: 'คทา', bow: 'ธนู', book: 'หนังสือ',
  katar: 'กาต้า', knuckle: 'สนับมือ', instrument: 'เครื่องดนตรี', whip: 'แส้',
};
const weaponTh = (w: string) => w.split('-').map((p) => WEAPON_TH[p] ?? p).join(' + ');

// The direction pad: game direction per cell, 0 faces the viewer, then clockwise.
const PAD: (number | null)[] = [3, 4, 5, 2, null, 6, 1, 0, 7];
const PAD_ARROW = ['↓', '↙', '←', '↖', '↑', '↗', '→', '↘'];

// Cloth palettes by position: the game's own colour, then the stylist's alternatives.
const CLOTH_TH = (i: number) => (i === 0 ? 'เดิม' : `แบบ ${i}`);

// What each class line rides (docs/PLAYER_GLOSSARY.md words), by the 2nd class or the class itself.
const MOUNT_TH: Record<string, string> = {
  novice: 'โพริง', swordsman: 'เพโค', knight: 'เพโค', crusader: 'แกรนด์เพโค',
  mage: 'จิ้งจอก', wizard: 'จิ้งจอก', sage: 'จิ้งจอก', archer: 'นกกระจอกเทศ', hunter: 'นกกระจอกเทศ',
  bard: 'นกกระจอกเทศ', dancer: 'นกกระจอกเทศ', acolyte: 'อัลปาก้า', priest: 'อัลปาก้า', monk: 'อัลปาก้า',
  merchant: 'หมูป่า', blacksmith: 'หมูป่า', alchemist: 'หมูป่า', thief: 'เคอร์เบอรัส', assassin: 'เคอร์เบอรัส',
  rogue: 'เคอร์เบอรัส',
};

// Classes with a portrait in public/images/jobs.
const NO_PORTRAIT = new Set(['novice']);

const PAGE = 60;

type Tab = 'wear' | 'job' | 'pose';
const TAB_TH: Record<Tab, string> = { wear: 'ใส่ของ', job: 'อาชีพ · ผม', pose: 'ท่า · อาวุธ' };

interface Props {
  look: Look;
  onChange: (look: Look) => void;
  /** item id -> name */
  names: Record<string, string>;
  /** item ids that are costumes */
  costume: number[];
  /** class slug -> name */
  classNames: Record<string, string>;
}

const SHEET = assetUrl(THUMBS.file);
const ROWS = Math.ceil((Math.max(-1, ...Object.values(THUMBS.at)) + 1) / THUMBS.cols);

/** One cell of the thumb sheet, scaled to fill its box. */
function Thumb({ cell }: { cell: number | undefined }) {
  if (cell === undefined || !SHEET) return <span className="dress__nopic" aria-hidden>?</span>;
  const col = cell % THUMBS.cols;
  const row = Math.floor(cell / THUMBS.cols);
  return (
    <span
      className="dress__pic"
      aria-hidden
      style={{
        backgroundImage: `url(${SHEET})`,
        backgroundSize: `${THUMBS.cols * 100}% ${ROWS * 100}%`,
        backgroundPosition: `${(col / Math.max(1, THUMBS.cols - 1)) * 100}% ${(row / Math.max(1, ROWS - 1)) * 100}%`,
      }}
    />
  );
}

function WearTab({ look, onChange, names, costume }: Omit<Props, 'classNames'>) {
  const [slot, setSlot] = useState<Slot>('upper');
  const [filter, setFilter] = useState<Filter>('all');
  const [shown, setShown] = useState(PAGE);
  const sex = sexOf(look);
  const cos = useMemo(() => new Set(costume), [costume]);
  const tiles = useMemo(() => tilesFor(slot, filter, cos), [slot, filter, cos]);
  const worn = look[slot];
  const wornTile = worn !== undefined ? tileOf(worn) : undefined;
  const label = (t: Tile) => [...new Set(t.ids.map((id) => names[id] ?? `#${id}`))].join(' / ');

  const tap = (t: Tile) => {
    if (wornTile === t) onChange(takeOff(look, slot));
    else onChange(wear(look, pickId(t, look.cls, sex, filter, cos)));
  };
  const goSlot = (s: Slot) => { setSlot(s); setShown(PAGE); };
  const goFilter = (f: Filter) => { setFilter(f); setShown(PAGE); };

  return (
    <div className="dress__tabbody">
      <button type="button" className="dress__dice" onClick={() => onChange(randomLook(look, sex))}>
        🎲 สุ่มทั้งตัว
      </button>
      <div className="dress__slots" role="tablist" aria-label="ช่องที่ใส่">
        {SLOTS.map((s) => {
          const id = look[s];
          const t = id !== undefined ? tileOf(id) : undefined;
          return (
            <button key={s} type="button" role="tab" aria-selected={slot === s} className="dress__slottab" onClick={() => goSlot(s)}>
              <span className="dress__slotpic">{t ? <Thumb cell={t.thumb} /> : <span className="dress__plus" aria-hidden>＋</span>}</span>
              {SLOT_TH[s]}
            </button>
          );
        })}
      </div>
      <div className="dress__chips" role="group" aria-label="กรอง">
        {(Object.keys(FILTER_TH) as Filter[]).map((f) => (
          <button key={f} type="button" className="dress__chip dress__chip--pill" aria-pressed={filter === f} onClick={() => goFilter(f)}>
            {FILTER_TH[f]}
          </button>
        ))}
      </div>
      <div className="dress__grid">
        {tiles.slice(0, shown).map((t) => {
          const on = wornTile === t;
          const drawn = tileDrawn(t, look.cls, sex);
          const name = label(t);
          return (
            <button
              key={t.key}
              type="button"
              className="dress__tile"
              aria-pressed={on}
              data-undrawn={drawn ? undefined : ''}
              title={drawn ? name : `${name} (อาชีพนี้ยังไม่มีภาพ)`}
              aria-label={name}
              onClick={() => tap(t)}
            >
              <Thumb cell={t.thumb} />
              {t.slots.length > 1 && <small className="dress__ms" title={t.slots.map((x) => SLOT_TH[x]).join(' + ')}>{t.slots.length} ช่อง</small>}
            </button>
          );
        })}
      </div>
      {shown < tiles.length && (
        <button type="button" className="dress__more" onClick={() => setShown((n) => n + PAGE * 2)}>
          ดูเพิ่ม (อีก {tiles.length - shown} แบบ)
        </button>
      )}
      <p className="dress__namebar" aria-live="polite">
        {worn !== undefined ? (
          <>
            <span>{SLOT_TH[slot]}: <b>{names[worn] ?? `#${worn}`}</b></span>
            {!hasSprite(worn, look.cls, sex) && <small className="dress__none">อาชีพนี้ยังไม่มีภาพ</small>}
            <button type="button" className="dress__x" onClick={() => onChange(takeOff(look, slot))}>ถอด</button>
          </>
        ) : (
          <span>{SLOT_TH[slot]}: ยังไม่ได้ใส่ · จิ้มรูปเพื่อใส่ จิ้มซ้ำเพื่อถอด</span>
        )}
      </p>
    </div>
  );
}

function JobTab({ look, onChange, classNames }: Pick<Props, 'look' | 'onChange' | 'classNames'>) {
  const cls = classOf(look.cls);
  const sex = sexOf(look);
  const set = (patch: Partial<Look>) => onChange({ ...look, ...patch });
  const base = baseClass(look.cls);
  const high = highClass(look.cls);
  const mount = mountOf(look.cls);
  const riding = !!cls?.rides;
  return (
    <div className="dress__tabbody">
      <section className="dress__sec">
        <h3 className="dress__h">อาชีพ</h3>
        <div className="dress__jobs">
          {INDEX.classes.filter((c) => !c.of && !c.rides).map((c) => (
            <button key={c.slug} type="button" className="dress__job" aria-pressed={c.slug === base} onClick={() => onChange(withClass(look, c.slug))}>
              {NO_PORTRAIT.has(c.slug)
                ? <span className="dress__jobpic dress__jobpic--none" aria-hidden>N</span>
                : <img className="dress__jobpic" src={`/images/jobs/${c.slug}.png`} alt="" loading="lazy" />}
              <span className="dress__jobname">{classNames[c.slug] ?? c.slug}</span>
            </button>
          ))}
        </div>
      </section>
      {high && (
        <section className="dress__sec">
          <h3 className="dress__h">ชุด</h3>
          <div className="dress__chips">
            <button type="button" className="dress__chip" aria-pressed={plainOf(look.cls) === base} onClick={() => onChange(withOutfit(look, false))}>
              ชุดอาชีพ
            </button>
            <button type="button" className="dress__chip" aria-pressed={plainOf(look.cls) === high} onClick={() => onChange(withOutfit(look, true))}>
              ชุดไฮคลาส · {classNames[high] ?? high}
            </button>
          </div>
        </section>
      )}
      {mount && (
        <section className="dress__sec">
          <h3 className="dress__h">สัตว์ขี่</h3>
          <div className="dress__chips">
            <button type="button" className="dress__chip" aria-pressed={!riding} onClick={() => onChange(withMount(look, false))}>
              เดินเอง
            </button>
            <button type="button" className="dress__chip" aria-pressed={riding} onClick={() => onChange(withMount(look, true))}>
              ขี่{MOUNT_TH[base] ?? 'สัตว์'}
            </button>
          </div>
        </section>
      )}
      <section className="dress__sec">
        <h3 className="dress__h">เพศ</h3>
        <div className="dress__chips">
          {(['m', 'f'] as const).map((s) => (
            <button key={s} type="button" className="dress__chip dress__chip--sex" aria-pressed={sex === s} disabled={!cls?.sexes.includes(s)} onClick={() => set({ sex: s })}>
              {s === 'm' ? 'ชาย' : 'หญิง'}
            </button>
          ))}
        </div>
      </section>
      <section className="dress__sec">
        <h3 className="dress__h">ทรงผม</h3>
        <div className="dress__grid dress__grid--hair">
          {Array.from({ length: INDEX.hair.styles }, (_, i) => i + 1).map((n) => (
            <button key={n} type="button" className="dress__tile" aria-pressed={look.hair === n} aria-label={`ทรงที่ ${n}`} onClick={() => set({ hair: n })}>
              <Thumb cell={THUMBS.at[`head/${n}-${sex as Sex}`]} />
            </button>
          ))}
        </div>
      </section>
      <section className="dress__sec">
        <h3 className="dress__h">สีผม</h3>
        <div className="dress__grid dress__grid--hair">
          {INDEX.hair.colours.map((c) => (
            <button key={c.id} type="button" className="dress__tile" aria-pressed={look.hairColour === c.id} aria-label={c.th} title={c.th} onClick={() => set({ hairColour: c.id })}>
              <Thumb cell={THUMBS.at[`colour/${c.id}-${sex}`]} />
            </button>
          ))}
        </div>
      </section>
      <section className="dress__sec">
        <h3 className="dress__h">สีชุด</h3>
        <div className="dress__chips">
          {(cls?.cloth ?? [0]).map((c, i) => (
            <button key={c} type="button" className="dress__chip" aria-pressed={look.cloth === c} onClick={() => set({ cloth: c })}>
              {CLOTH_TH(i)}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function PoseTab({ look, onChange }: Pick<Props, 'look' | 'onChange'>) {
  const cls = classOf(look.cls);
  const set = (patch: Partial<Look>) => onChange({ ...look, ...patch });
  const still = look.pose === 'stand' || look.pose === 'sit';
  return (
    <div className="dress__tabbody">
      <section className="dress__sec">
        <h3 className="dress__h">ท่า</h3>
        <div className="dress__poses">
          {(Object.keys(POSE_TYPE) as Pose[]).map((p) => (
            <button key={p} type="button" className="dress__chip" aria-pressed={look.pose === p} onClick={() => set({ pose: p })}>
              {POSE_TH[p]}
            </button>
          ))}
        </div>
      </section>
      <div className="dress__pair">
        <section className="dress__sec">
          <h3 className="dress__h">หันตัว</h3>
          <div className="dress__pad">
            {PAD.map((d, i) => (d === null
              ? <span key={i} className="dress__padmid" aria-hidden>◆</span>
              : (
                <button key={i} type="button" className="dress__padbtn" aria-pressed={look.dir === d} aria-label={`ทิศ ${PAD_ARROW[d]}`} onClick={() => set({ dir: d })}>
                  {PAD_ARROW[d]}
                </button>
              )))}
          </div>
        </section>
        {still && (
          <section className="dress__sec">
            <h3 className="dress__h">หันหัว</h3>
            <div className="dress__chips dress__chips--col">
              {HEAD_TH.map((t, i) => (
                <button key={t} type="button" className="dress__chip" aria-pressed={look.headDir === i} onClick={() => set({ headDir: i as 0 | 1 | 2 })}>
                  {t}
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
      <section className="dress__sec">
        <h3 className="dress__h">อาวุธ</h3>
        <div className="dress__chips">
          <button type="button" className="dress__chip" aria-pressed={!look.weapon} onClick={() => set({ weapon: undefined })}>ไม่ถือ</button>
          {(cls?.weapons ?? []).map((w) => (
            <button key={w} type="button" className="dress__chip" aria-pressed={look.weapon === w} onClick={() => set({ weapon: w })}>
              {weaponTh(w)}
            </button>
          ))}
        </div>
        {cls?.rides && cls.weapons.length === 0 && <p className="dress__note">ตอนขี่สัตว์ ไฟล์เกมยังไม่มีภาพอาวุธ</p>}
      </section>
      {cls?.cart && (
        <section className="dress__sec">
          <h3 className="dress__h">รถเข็น</h3>
          <div className="dress__chips">
            <button type="button" className="dress__chip" aria-pressed={look.cart === undefined} onClick={() => set({ cart: undefined })}>ไม่ใช้</button>
            {Array.from({ length: INDEX.carts }, (_, n) => (
              <button key={n} type="button" className="dress__chip" aria-pressed={look.cart === n} onClick={() => set({ cart: n })}>
                แบบ {n + 1}
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default function DressPicker({ look, onChange, names, costume, classNames }: Props) {
  const [tab, setTab] = useState<Tab>('wear');
  return (
    <div className="dress__picker">
      <div className="dress__tabs" role="tablist" aria-label="แต่งตัว">
        {(Object.keys(TAB_TH) as Tab[]).map((t) => (
          <button key={t} type="button" role="tab" aria-selected={tab === t} className="dress__tab" onClick={() => setTab(t)}>
            {TAB_TH[t]}
          </button>
        ))}
      </div>
      {tab === 'wear' && <WearTab look={look} onChange={onChange} names={names} costume={costume} />}
      {tab === 'job' && <JobTab look={look} onChange={onChange} classNames={classNames} />}
      {tab === 'pose' && <PoseTab look={look} onChange={onChange} />}
    </div>
  );
}
