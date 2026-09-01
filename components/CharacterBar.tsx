'use client';

// The one place the site asks who the player is. Every tool reads the answer
// from the shared context instead of asking again (spec 3.15.2), so this bar
// sits in the layout and is the only form that writes it.

import { useEffect, useState } from 'react';
import { JOB_PROFILES, type JobKey } from '@/lib/formulas';
import { maxHp } from '@/lib/formulas';
import { characterFromInput, type CharacterContext } from '@/lib/character-context';
import { playerFlee, playerHit } from '@/lib/hit-flee';
import { usePathname } from 'next/navigation';
import { usesCharacterContext } from '@/lib/nav-links';
import { useCharacterContext } from '@/components/CharacterContextProvider';

const JOB_KEYS = Object.keys(JOB_PROFILES) as JobKey[];

interface Draft {
  level: string;
  job: JobKey;
  vit: string;
  damagePerHit: string;
  attacksPerSecond: string;
  dex: string;
  agi: string;
  luk: string;
}

const EMPTY_DRAFT: Draft = {
  level: '',
  job: JOB_KEYS[0],
  vit: '',
  damagePerHit: '',
  attacksPerSecond: '',
  dex: '',
  agi: '',
  luk: '',
};

function draftFrom(ctx: CharacterContext | null): Draft {
  if (!ctx) return EMPTY_DRAFT;
  return {
    level: String(ctx.level),
    job: ctx.job,
    vit: String(ctx.vit),
    damagePerHit: String(ctx.damagePerHit),
    attacksPerSecond: String(ctx.attacksPerSecond),
    dex: ctx.dex != null ? String(ctx.dex) : '',
    agi: ctx.agi != null ? String(ctx.agi) : '',
    luk: ctx.luk != null ? String(ctx.luk) : '',
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
      setError('กรอกตัวเลขให้ครบทุกช่อง และต้องมากกว่า 0');
      return;
    }
    setError(null);
    setCharacter(next);
    setOpen(false);
  }

  const summary = character
    ? `${JOB_PROFILES[character.job].label} Lv.${character.level} · VIT ${character.vit} · ` +
      `ตี ${character.damagePerHit.toLocaleString()} ต่อครั้ง · ${character.attacksPerSecond} ครั้ง/วิ · ` +
      `HP ${maxHp(character.level, character.vit, character.job).toLocaleString()}`
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
            อาชีพ
            <select value={draft.job} onChange={(e) => setDraft({ ...draft, job: e.target.value as JobKey })}>
              {JOB_KEYS.map((key) => (
                <option key={key} value={key}>
                  {JOB_PROFILES[key].label}
                </option>
              ))}
            </select>
          </label>
          <label>
            VIT
            <input
              type="number"
              min="1"
              inputMode="numeric"
              placeholder="เช่น 30"
              value={draft.vit}
              onChange={(e) => setDraft({ ...draft, vit: e.target.value })}
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
          {/* Optional trio in its own labeled group so "ไม่บังคับ" also says
              what filling it in buys. Live HIT/FLEE preview renders as soon
              as the numbers allow it -- the payoff is visible before saving. */}
          <fieldset className="charbar__group">
            <legend>
              ใส่เพิ่มแล้วได้อีก 3 อย่าง: โอกาสตีโดน% · EXP/ชม.แบบหักตีพลาด · จุด AFK แบบ &ldquo;มอนตีเราไม่โดน&rdquo;
            </legend>
            <div className="charbar__groupfields">
              <label>
                DEX
                <input
                  type="number"
                  min="1"
                  inputMode="numeric"
                  placeholder="เช่น 60"
                  value={draft.dex}
                  onChange={(e) => setDraft({ ...draft, dex: e.target.value })}
                />
              </label>
              <label>
                AGI
                <input
                  type="number"
                  min="1"
                  inputMode="numeric"
                  placeholder="เช่น 40"
                  value={draft.agi}
                  onChange={(e) => setDraft({ ...draft, agi: e.target.value })}
                />
              </label>
              <label>
                LUK
                <input
                  type="number"
                  min="1"
                  inputMode="numeric"
                  placeholder="เช่น 20"
                  value={draft.luk}
                  onChange={(e) => setDraft({ ...draft, luk: e.target.value })}
                />
              </label>
              {(() => {
                const lv = Number(draft.level);
                if (!(lv > 0)) return null;
                const dexN = Number(draft.dex);
                const agiN = Number(draft.agi);
                const lukN = draft.luk ? Number(draft.luk) : 0;
                if (!Number.isFinite(lukN) || lukN < 0) return null;
                const hit = dexN > 0 ? playerHit(lv, dexN, lukN) : null;
                const flee = agiN > 0 ? playerFlee(lv, agiN, lukN) : null;
                if (hit === null && flee === null) return null;
                return (
                  <p className="charbar__preview" aria-live="polite">
                    {hit !== null && <>HIT <b className="mono">{hit}</b></>}
                    {hit !== null && flee !== null && ' · '}
                    {flee !== null && <>FLEE <b className="mono">{flee}</b></>}
                  </p>
                );
              })()}
            </div>
          </fieldset>

          <div className="charbar__actions">
            <button type="submit" className="btn">
              บันทึก
            </button>
          </div>

          {error && <p className="charbar__error" role="alert">{error}</p>}

          {/* Four jobs, not nineteen: HP factors for the rest are not in the
              data yet, and picking numbers for them would put an invented game
              value behind an "อันตราย" badge. */}
          <p className="charbar__note">
            อาชีพมีให้เลือก {JOB_KEYS.length} สายที่มีตัวคูณ HP ในข้อมูลจริง (สายอื่นเดาไม่ได้ ตัวเลขอันตรายจะผิด) ·
            ทุกค่าเก็บในเบราว์เซอร์เครื่องนี้เท่านั้น ไม่ได้ส่งไปไหน
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
