'use client';
// Everything the character can change: class, sex, hair, cloth colour, the
// four costume slots, weapon type, direction and pose. Item names come from
// the server (the game client's own item table); the slots, views and which
// classes have a sprite come from the slim index in lib/dress-up/look.ts.
import { useMemo, useState } from 'react';
import {
  INDEX, POSE_TYPE, SLOTS, classOf, hasSprite, sexOf, slotsOf, takeOff, wear, withClass,
  type Look, type Pose, type Slot,
} from '@/lib/dress-up/look';

const SLOT_TH: Record<Slot, string> = { upper: 'หมวกบน', mid: 'หมวกกลาง', lower: 'หมวกล่าง', garment: 'ผ้าคลุม (คอสตูม)' };
const SLOT_SHORT: Record<Slot, string> = { upper: 'บน', mid: 'กลาง', lower: 'ล่าง', garment: 'ผ้าคลุม' };

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

// 0 faces the viewer, then clockwise as the game counts.
const ARROWS = ['↓', '↙', '←', '↖', '↑', '↗', '→', '↘'];

// Cloth palettes by position: the game's own colour, then the stylist's alternatives.
const CLOTH_TH = (i: number) => (i === 0 ? 'เดิม' : `แบบ ${i}`);

interface Props {
  look: Look;
  onChange: (look: Look) => void;
  /** item id -> name */
  names: Record<string, string>;
  /** class slug -> name */
  classNames: Record<string, string>;
}

function SlotPicker({ slot, look, onChange, names }: { slot: Slot } & Omit<Props, 'classNames'>) {
  const [q, setQ] = useState('');
  const sex = sexOf(look);
  const pool = useMemo(
    () => Object.keys(INDEX.items).map(Number).filter((id) => slotsOf(id).includes(slot))
      .sort((a, b) => (names[a] ?? '').localeCompare(names[b] ?? '')),
    [slot, names],
  );
  const hits = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return [];
    return pool.filter((id) => String(id) === t || (names[id] ?? '').toLowerCase().includes(t)).slice(0, 8);
  }, [q, pool, names]);
  const worn = look[slot];
  const tag = (id: number) => {
    const s = slotsOf(id);
    return s.length > 1 ? s.map((x) => SLOT_SHORT[x]).join('+') : null;
  };

  return (
    <div className="dress__slot">
      <span className="dress__slotname">{SLOT_TH[slot]}</span>
      {worn !== undefined ? (
        <span className="dress__worn">
          <span className="dress__wornname">{names[worn] ?? `#${worn}`}</span>
          {tag(worn) && <small className="dress__tag">{tag(worn)}</small>}
          {!hasSprite(worn, look.cls, sex) && <small className="dress__none">ยังไม่มีภาพ</small>}
          <button type="button" className="dress__x" onClick={() => onChange(takeOff(look, slot))} aria-label={`ถอด${SLOT_TH[slot]}`}>✕</button>
        </span>
      ) : null}
      <input
        type="search"
        className="dress__input"
        placeholder={`ค้นหา${SLOT_TH[slot]} (ชื่อหรือไอดี)`}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        aria-label={`ค้นหา${SLOT_TH[slot]}`}
      />
      {hits.length > 0 && (
        <ul className="dress__hits">
          {hits.map((id) => (
            <li key={id}>
              <button type="button" onClick={() => { onChange(wear(look, id)); setQ(''); }}>
                <span>{names[id] ?? `#${id}`}</span>
                {tag(id) && <small className="dress__tag">{tag(id)}</small>}
                {!hasSprite(id, look.cls, sex) && <small className="dress__none">ยังไม่มีภาพ</small>}
              </button>
            </li>
          ))}
        </ul>
      )}
      {q.trim() && hits.length === 0 && <p className="dress__empty">ไม่เจอชื่อนี้ใน{SLOT_TH[slot]}</p>}
    </div>
  );
}

export default function DressPicker({ look, onChange, names, classNames }: Props) {
  const cls = classOf(look.cls);
  const sex = sexOf(look);
  const set = (patch: Partial<Look>) => onChange({ ...look, ...patch });
  const turn = (by: number) => set({ dir: (look.dir + by + 8) % 8 });
  const still = look.pose === 'stand' || look.pose === 'sit';

  return (
    <div className="dress__picker">
      <fieldset className="dress__group">
        <legend>อาชีพ</legend>
        <div className="dress__chips">
          {INDEX.classes.map((c) => (
            <button
              key={c.slug}
              type="button"
              className="dress__chip"
              aria-pressed={c.slug === look.cls}
              onClick={() => onChange(withClass(look, c.slug))}
            >
              {classNames[c.slug] ?? c.slug}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="dress__row">
        <fieldset className="dress__group">
          <legend>เพศ</legend>
          <div className="dress__chips">
            {(['m', 'f'] as const).map((s) => (
              <button
                key={s}
                type="button"
                className="dress__chip dress__chip--sex"
                aria-pressed={sex === s}
                disabled={!cls?.sexes.includes(s)}
                onClick={() => set({ sex: s })}
              >
                {s === 'm' ? 'ชาย' : 'หญิง'}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset className="dress__group">
          <legend>สีชุด</legend>
          <div className="dress__chips">
            {(cls?.cloth ?? [0]).map((c, i) => (
              <button key={c} type="button" className="dress__chip" aria-pressed={look.cloth === c} onClick={() => set({ cloth: c })}>
                {CLOTH_TH(i)}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="dress__row">
        <fieldset className="dress__group">
          <legend>ทรงผม</legend>
          <div className="dress__stepper">
            <button type="button" className="dress__chip" aria-label="ทรงก่อนหน้า"
              onClick={() => set({ hair: look.hair <= 1 ? INDEX.hair.styles : look.hair - 1 })}>‹</button>
            <output className="dress__num mono">{look.hair}</output>
            <button type="button" className="dress__chip" aria-label="ทรงถัดไป"
              onClick={() => set({ hair: look.hair >= INDEX.hair.styles ? 1 : look.hair + 1 })}>›</button>
          </div>
        </fieldset>
        <fieldset className="dress__group">
          <legend>สีผม</legend>
          <div className="dress__chips">
            {INDEX.hair.colours.map((c) => (
              <button key={c.id} type="button" className="dress__chip" aria-pressed={look.hairColour === c.id} onClick={() => set({ hairColour: c.id })}>
                {c.th}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <fieldset className="dress__group">
        <legend>ของสวม</legend>
        {SLOTS.map((s) => <SlotPicker key={s} slot={s} look={look} onChange={onChange} names={names} />)}
      </fieldset>

      <fieldset className="dress__group">
        <legend>อาวุธ</legend>
        <select
          className="dress__input"
          value={look.weapon ?? ''}
          onChange={(e) => set({ weapon: e.target.value || undefined })}
          aria-label="ประเภทอาวุธ"
        >
          <option value="">ไม่ถืออาวุธ</option>
          {(cls?.weapons ?? []).map((w) => <option key={w} value={w}>{weaponTh(w)}</option>)}
        </select>
      </fieldset>

      <div className="dress__row">
        <fieldset className="dress__group">
          <legend>ทิศ</legend>
          <div className="dress__stepper">
            <button type="button" className="dress__chip" onClick={() => turn(-1)} aria-label="หมุนทวนเข็ม">⟲</button>
            <output className="dress__arrow" aria-label={`ทิศ ${look.dir}`}>{ARROWS[look.dir]}</output>
            <button type="button" className="dress__chip" onClick={() => turn(1)} aria-label="หมุนตามเข็ม">⟳</button>
          </div>
        </fieldset>
        {still && (
          <fieldset className="dress__group">
            <legend>หัน</legend>
            <div className="dress__chips">
              {HEAD_TH.map((t, i) => (
                <button key={t} type="button" className="dress__chip" aria-pressed={look.headDir === i} onClick={() => set({ headDir: i as 0 | 1 | 2 })}>
                  {t}
                </button>
              ))}
            </div>
          </fieldset>
        )}
      </div>

      <fieldset className="dress__group">
        <legend>ท่า</legend>
        <div className="dress__chips">
          {(Object.keys(POSE_TYPE) as Pose[]).map((p) => (
            <button key={p} type="button" className="dress__chip" aria-pressed={look.pose === p} onClick={() => set({ pose: p })}>
              {POSE_TH[p]}
            </button>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
