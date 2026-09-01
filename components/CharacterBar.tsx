'use client';

// The one place the site asks who the player is. Every tool reads the answer
// from the shared context instead of asking again (spec 3.15.2), so this bar
// sits in the layout and is the only form that writes it.
//
// v2 (2026-09-01): the form asks for the numbers the game's status window
// already shows -- Max HP, HIT, FLEE -- instead of VIT/job/DEX/AGI/LUK that
// v1 pushed through formulas of our own. Direct numbers include gear and
// buffs, work for every job (the 4-job HP-factor limit is gone with the
// formula), and the danger badge now stands on a real value.

import { useEffect, useState } from 'react';
import { characterFromInput, type CharacterContext } from '@/lib/character-context';
import { usePathname } from 'next/navigation';
import { usesCharacterContext } from '@/lib/nav-links';
import { useCharacterContext } from '@/components/CharacterContextProvider';

interface Draft {
  level: string;
  maxHp: string;
  damagePerHit: string;
  attacksPerSecond: string;
  hit: string;
  flee: string;
}

const EMPTY_DRAFT: Draft = {
  level: '',
  maxHp: '',
  damagePerHit: '',
  attacksPerSecond: '',
  hit: '',
  flee: '',
};

function draftFrom(ctx: CharacterContext | null): Draft {
  if (!ctx) return EMPTY_DRAFT;
  return {
    level: String(ctx.level),
    maxHp: String(ctx.maxHp),
    damagePerHit: String(ctx.damagePerHit),
    attacksPerSecond: String(ctx.attacksPerSecond),
    hit: ctx.hit != null ? String(ctx.hit) : '',
    flee: ctx.flee != null ? String(ctx.flee) : '',
  };
}

export default function CharacterBar() {
  const pathname = usePathname();
  const { character, setCharacter, ready, persisted } = useCharacterContext();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [error, setError] = useState<string | null>(null);

  // The context loads from storage after mount, so the draft has to follow it
  // rather than being seeded once.
  useEffect(() => {
    setDraft(draftFrom(character));
  }, [character]);

  // Hooks first, then the two reasons to render nothing.
  //
  // A page that reads no character value gets no character bar: it was costing
  // 61px of a 900px phone screen on eleven pages, for a control that could not
  // change anything the reader was looking at.
  if (!usesCharacterContext(pathname ?? '/')) return null;

  // Nothing is rendered until storage has been read. Rendering "ยังไม่ได้ตั้งค่า"
  // for a moment to a player who HAS set it up would be a wrong claim, however
  // brief.
  if (!ready) return <div className="charbar charbar--placeholder" aria-hidden="true" />;

  function save(event: React.FormEvent) {
    event.preventDefault();
    const next = characterFromInput(draft);
    if (!next) {
      setError('กรอกตัวเลขให้ครบ 4 ช่องแรก และต้องมากกว่า 0');
      return;
    }
    setError(null);
    setCharacter(next);
    setOpen(false);
  }

  const summary = character
    ? `Lv.${character.level} · HP ${character.maxHp.toLocaleString()} · ` +
      `ตี ${character.damagePerHit.toLocaleString()} ต่อครั้ง · ${character.attacksPerSecond} ครั้ง/วิ` +
      (character.hit != null ? ` · HIT ${character.hit}` : '') +
      (character.flee != null ? ` · FLEE ${character.flee}` : '')
    : 'กรอกตัวละครของคุณ แล้วหน้านี้จะคิดให้เป็นตัวเลขของคุณเอง';

  return (
    <div className="charbar">
      <div className="charbar__row">
        <span className="charbar__summary">{summary}</span>
        <button type="button" className="charbar__toggle" onClick={() => setOpen((v) => !v)}>
          {open ? 'ปิด' : character ? 'แก้ไข' : 'ตั้งค่า'}
        </button>
      </div>

      {open && (
        <form className="charbar__form" onSubmit={save}>
          <label>
            เลเวล
            <input
              type="number"
              min="1"
              inputMode="numeric"
              placeholder="เช่น 50"
              value={draft.level}
              onChange={(e) => setDraft({ ...draft, level: e.target.value })}
            />
          </label>
          <label>
            Max HP
            <input
              type="number"
              min="1"
              inputMode="numeric"
              placeholder="ดูจากหน้าจอเกม"
              value={draft.maxHp}
              onChange={(e) => setDraft({ ...draft, maxHp: e.target.value })}
            />
          </label>
          <label>
            ดาเมจต่อครั้ง
            <input
              type="number"
              min="1"
              inputMode="numeric"
              placeholder="เช่น 250"
              value={draft.damagePerHit}
              onChange={(e) => setDraft({ ...draft, damagePerHit: e.target.value })}
            />
          </label>
          <label>
            โจมตีต่อวินาที
            <input
              type="number"
              min="0.1"
              step="0.1"
              inputMode="decimal"
              placeholder="เช่น 1.5"
              value={draft.attacksPerSecond}
              onChange={(e) => setDraft({ ...draft, attacksPerSecond: e.target.value })}
            />
          </label>
          {/* Optional pair, straight from the game's status window (Alt+A) --
              no formula between the player and the number. */}
          <fieldset className="charbar__group">
            <legend>
              ใส่ HIT/FLEE จากหน้าต่างสเตตัส (Alt+A) แล้วได้อีก 3 อย่าง: โอกาสตีโดน% · EXP/ชม.แบบหักตีพลาด · จุด AFK แบบ &ldquo;มอนตีเราไม่โดน&rdquo;
            </legend>
            <div className="charbar__groupfields">
              <label>
                HIT
                <input
                  type="number"
                  min="1"
                  inputMode="numeric"
                  placeholder="เช่น 290"
                  value={draft.hit}
                  onChange={(e) => setDraft({ ...draft, hit: e.target.value })}
                />
              </label>
              <label>
                FLEE
                <input
                  type="number"
                  min="1"
                  inputMode="numeric"
                  placeholder="เช่น 195"
                  value={draft.flee}
                  onChange={(e) => setDraft({ ...draft, flee: e.target.value })}
                />
              </label>
            </div>
          </fieldset>

          <div className="charbar__actions">
            <button type="submit" className="btn">
              บันทึก
            </button>
          </div>

          {error && <p className="charbar__error" role="alert">{error}</p>}

          <p className="charbar__note">
            ทุกช่องคือตัวเลขที่เกมโชว์อยู่แล้ว ไม่ต้องคำนวณอะไรเอง (อยากลองสูตรดูเอง ไปที่หน้า &ldquo;ตีโดนไหม&rdquo;) ·
            ค่าเก็บในเบราว์เซอร์เครื่องนี้เท่านั้น ไม่ได้ส่งไปไหน
          </p>
          {!persisted && (
            <p className="charbar__error" role="alert">
              เบราว์เซอร์นี้เก็บค่าไม่ได้ (เช่นโหมดส่วนตัว) — ใช้ได้ในหน้านี้ แต่พอปิดแท็บแล้วต้องกรอกใหม่
            </p>
          )}
        </form>
      )}
    </div>
  );
}
