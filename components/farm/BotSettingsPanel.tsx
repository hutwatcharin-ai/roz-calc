'use client';

// The built-in bot's settings that change how a run goes, laid out by the
// tab they sit on in the game's bot window (docs/GAME_MODEL.md 6.5), with the
// game's own wording, so a player can copy them across one to one.

import { useState } from 'react';
import type { BotSettings } from '@/lib/farm-engine/bot-session';

type NumKey = 'idleTeleport' | 'teleportOnDamage' | 'teleportOnMobs';

function Toggle({
  on,
  value,
  onChange,
  before,
  after,
  min,
  max,
  fallback,
}: {
  on: boolean;
  value: number | null;
  onChange: (next: number | null) => void;
  before: string;
  after: string;
  min: number;
  max: number;
  fallback: number;
}) {
  const [draft, setDraft] = useState(String(value ?? fallback));
  return (
    <label className="botset__row">
      <input type="checkbox" checked={on} onChange={(e) => onChange(e.target.checked ? Number(draft) || fallback : null)} />
      <span>
        {before}{' '}
        <input
          className="mono botset__num"
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            const n = Number(e.target.value);
            if (on && Number.isFinite(n) && n >= min && n <= max) onChange(n);
          }}
        />{' '}
        {after}
      </span>
    </label>
  );
}

export default function BotSettingsPanel({ value, onChange }: { value: BotSettings; onChange: (next: BotSettings) => void }) {
  const setNum = (key: NumKey) => (next: number | null) => onChange({ ...value, [key]: next });
  return (
    <div className="botset">
      <p className="botset__tab">แท็บพื้นฐาน</p>
      <Toggle
        on={value.idleTeleport !== null}
        value={value.idleTeleport}
        onChange={setNum('idleTeleport')}
        before="ใช้ Teleport หากไม่มีการต่อสู้ภายใน"
        after="วินาที"
        min={1}
        max={600}
        fallback={5}
      />
      <Toggle
        on={value.teleportOnMobs !== null}
        value={value.teleportOnMobs}
        onChange={setNum('teleportOnMobs')}
        before="ใช้ Teleport เมื่อมีมอนสเตอร์"
        after="ตัวขึ้นไปโจมตี"
        min={2}
        max={50}
        fallback={5}
      />
      <Toggle
        on={value.teleportOnDamage !== null}
        value={value.teleportOnDamage}
        onChange={setNum('teleportOnDamage')}
        before="ใช้ Teleport เมื่อได้รับ Damage มากกว่า"
        after=""
        min={1}
        max={1000000}
        fallback={100}
      />
      <div className="botset__row botset__pick" role="radiogroup" aria-label="วาร์ปด้วยอะไร">
        <span>วาร์ปด้วย</span>
        <label className="cvtoggle">
          <input type="radio" name="bot-tele" checked={value.creamy} onChange={() => onChange({ ...value, creamy: true })} />
          Creamy Card (ใช้ SP)
        </label>
        <label className="cvtoggle">
          <input type="radio" name="bot-tele" checked={!value.creamy} onChange={() => onChange({ ...value, creamy: false })} />
          Fly Wing
        </label>
      </div>

      <p className="botset__tab">แท็บเก็บไอเทม</p>
      <label className="botset__row">
        <input type="checkbox" checked={value.loot} onChange={(e) => onChange({ ...value, loot: e.target.checked })} />
        <span>เก็บไอเทม</span>
      </label>
      {value.loot && (
        <>
          <label className="botset__row">
            <span>
              หยุดเก็บเมื่อน้ำหนักถึง{' '}
              <input
                className="mono botset__num"
                type="number"
                inputMode="numeric"
                min={1}
                max={90}
                value={value.stopWeightPct}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  if (Number.isFinite(n) && n >= 1 && n <= 90) onChange({ ...value, stopWeightPct: n });
                }}
              />{' '}
              %
            </span>
          </label>
          <label className="botset__row">
            <input type="checkbox" checked={value.keepHunting} onChange={(e) => onChange({ ...value, keepHunting: e.target.checked })} />
            <span>จะล่าต่อโดยไม่เก็บไอเทมเมื่อน้ำหนักเกินค่าที่ตั้งไว้ (ไม่ติ๊ก = กลับเมือง)</span>
          </label>
        </>
      )}
    </div>
  );
}
