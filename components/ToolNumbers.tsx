'use client';

// The input strip a calculator page owns, replacing the character bar that
// used to sit on every page.
//
// Two rules make it different from the bar: it only appears on the tool that
// needs it, and it asks only for the fields that tool reads. Nothing here is
// required -- a tool shows whatever its filled-in fields allow.

import { useEffect, useState } from 'react';
import {
  playerNumbersFromInput,
  readPlayerNumbers,
  writePlayerNumbers,
  type PlayerField,
  type PlayerNumbers,
} from '@/lib/player-numbers';

const LABELS: Record<PlayerField, { label: string; hint: string; unlocks: string }> = {
  level: { label: 'เลเวล', hint: 'เช่น 45', unlocks: 'ดรอปโดนหักช่วงเลเวล' },
  damagePerHit: { label: 'ดาเมจต่อครั้ง', hint: 'เช่น 250', unlocks: 'EXP/ชม.' },
  aspd: { label: 'ASPD', hint: 'เช่น 187', unlocks: 'EXP/ชม.' },
  hit: { label: 'HIT', hint: 'เช่น 290', unlocks: 'โอกาสตีโดน' },
  flee: { label: 'FLEE', hint: 'เช่น 195', unlocks: 'มันตีเราโดนไหม' },
  maxHp: { label: 'Max HP', hint: 'เช่น 4200', unlocks: 'มอนตีเราแรงแค่ไหน' },
};

export default function ToolNumbers({
  fields,
  numbers,
  onChange,
  note,
}: {
  fields: PlayerField[];
  numbers: PlayerNumbers;
  onChange: (next: PlayerNumbers) => void;
  note?: string;
}) {
  // Draft strings, not numbers: a half-typed "1" in a number field must not
  // become a value and re-render the results under the cursor.
  const [draft, setDraft] = useState<Partial<Record<PlayerField, string>>>({});

  useEffect(() => {
    setDraft(
      Object.fromEntries(fields.map((f) => [f, numbers[f] !== undefined ? String(numbers[f]) : ''])),
    );
    // Only on mount: after that the draft is the source of truth for the boxes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function update(field: PlayerField, value: string) {
    const next = { ...draft, [field]: value };
    setDraft(next);
    const parsed = playerNumbersFromInput(next);
    // Fields this tool does not show are carried through untouched, so filling
    // in damage on one tool does not wipe the HIT another one remembers.
    const merged = { ...numbers, ...parsed };
    for (const f of fields) {
      if (parsed[f] === undefined) delete merged[f];
    }
    onChange(merged);
    writePlayerNumbers(typeof window === 'undefined' ? null : window.localStorage, merged);
  }

  return (
    <div className="toolnumbers">
      <div className="toolnumbers__row">
        {fields.map((field) => (
          <label key={field} className="toolnumbers__field">
            <span className="toolnumbers__label">
              {LABELS[field].label}
              <span className="toolnumbers__unlocks"> · {LABELS[field].unlocks}</span>
            </span>
            <input
              className="mono"
              type="number"
              inputMode="numeric"
              placeholder={LABELS[field].hint}
              value={draft[field] ?? ''}
              onChange={(e) => update(field, e.target.value)}
            />
          </label>
        ))}
      </div>
      <p className="toolnumbers__note">
        {note ?? 'กรอกเท่าที่อยากรู้ ช่องไหนว่างก็แค่ไม่มีคอลัมน์นั้น'} · ค่าเก็บในเบราว์เซอร์เครื่องนี้เท่านั้น
      </p>
    </div>
  );
}

/** Reads the remembered numbers once the component is on the client. */
export function useRememberedNumbers(): [PlayerNumbers, (next: PlayerNumbers) => void, boolean] {
  const [numbers, setNumbers] = useState<PlayerNumbers>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setNumbers(readPlayerNumbers(window.localStorage));
    setReady(true);
  }, []);

  return [numbers, setNumbers, ready];
}
