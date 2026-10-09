'use client';

// − [n] + with optional quick picks: the one quantity control every crafting
// calculator uses (/guides/elemental-converter first, owner liked it).

export const QTY_PRESETS = [0, 5, 10, 30, 50];

export default function QtyStepper({
  value,
  onChange,
  label,
  presets,
  max = 9999,
}: {
  value: number;
  onChange: (n: number) => void;
  /** What is being counted, for screen readers ("ใบไฟ", "Steel"). */
  label: string;
  presets?: number[];
  max?: number;
}) {
  const set = (n: number) => onChange(Math.max(0, Math.min(max, Math.round(n) || 0)));
  return (
    <span className="qty">
      <span className="qty__step">
        <button type="button" onClick={() => set(value - 1)} aria-label={`ลด ${label}`}>
          −
        </button>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          max={max}
          value={value}
          onChange={(e) => set(Number(e.target.value))}
          onFocus={(e) => e.target.select()}
          aria-label={`จำนวน ${label}`}
        />
        <button type="button" onClick={() => set(value + 1)} aria-label={`เพิ่ม ${label}`}>
          +
        </button>
      </span>
      {presets && (
        <span className="qty__presets">
          {presets.map((p) => (
            <button key={p} type="button" className={value === p ? 'is-on' : ''} aria-pressed={value === p} onClick={() => set(p)}>
              {p}
            </button>
          ))}
        </span>
      )}
    </span>
  );
}
