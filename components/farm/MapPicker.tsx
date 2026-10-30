'use client';

// The bot setup's map choice, with each map's picture beside its name (owner,
// 30 Oct 2026: "Clock Tower B2F (alde_dun02)" alone did not say which place it
// was). A native <select> cannot hold pictures, so this is a button that opens
// a list -- the listbox pattern: arrows move, Enter picks, Escape closes.

import { useEffect, useId, useRef, useState } from 'react';

export interface MapPickerOption {
  code: string;
  name: string;
  image: string | null;
}

export default function MapPicker({
  options,
  value,
  onChange,
  label,
}: {
  options: MapPickerOption[];
  value: string | null;
  onChange: (code: string | null) => void;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const id = useId();
  const selected = options.find((o) => o.code === value) ?? null;

  // Close on a tap or click anywhere else.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open]);

  // Opening puts focus on the chosen map, scrolled into view.
  useEffect(() => {
    if (!open) return;
    const start = Math.max(0, options.findIndex((o) => o.code === value));
    setActive(start);
    listRef.current?.focus();
    listRef.current?.children[start]?.scrollIntoView({ block: 'nearest' });
  }, [open, options, value]);

  const pick = (code: string) => {
    onChange(code);
    setOpen(false);
    buttonRef.current?.focus();
  };

  const onListKey = (e: React.KeyboardEvent) => {
    const move = (i: number) => {
      const next = Math.min(options.length - 1, Math.max(0, i));
      setActive(next);
      listRef.current?.children[next]?.scrollIntoView({ block: 'nearest' });
    };
    if (e.key === 'ArrowDown') { e.preventDefault(); move(active + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); move(active - 1); }
    else if (e.key === 'Home') { e.preventDefault(); move(0); }
    else if (e.key === 'End') { e.preventDefault(); move(options.length - 1); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (options[active]) pick(options[active].code); }
    else if (e.key === 'Escape' || e.key === 'Tab') { setOpen(false); if (e.key === 'Escape') buttonRef.current?.focus(); }
  };

  return (
    <div className="mappick" ref={rootRef}>
      <span className="toolnumbers__label" id={`${id}-label`}>{label}</span>
      <button
        ref={buttonRef}
        type="button"
        className="mappick__button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={`${id}-label ${id}-value`}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="mappick__thumb">{selected?.image ? <img src={selected.image} alt="" /> : null}</span>
        <span className="mappick__text" id={`${id}-value`}>
          {selected ? (
            <>
              <span className="mappick__name">{selected.name}</span>
              <span className="mappick__code mono">{selected.code}</span>
            </>
          ) : (
            <span className="mappick__name mappick__name--empty">— เลือกแมพ —</span>
          )}
        </span>
        <span className="mappick__caret" aria-hidden="true">▾</span>
      </button>
      {open && (
        <ul
          ref={listRef}
          className="mappick__list"
          role="listbox"
          tabIndex={-1}
          aria-labelledby={`${id}-label`}
          aria-activedescendant={options[active] ? `${id}-${options[active].code}` : undefined}
          onKeyDown={onListKey}
        >
          {options.map((o, i) => (
            <li
              key={o.code}
              id={`${id}-${o.code}`}
              role="option"
              aria-selected={o.code === value}
              className={['mappick__option', i === active && 'is-active', o.code === value && 'is-on'].filter(Boolean).join(' ')}
              onClick={() => pick(o.code)}
              onPointerMove={() => setActive(i)}
            >
              <span className="mappick__thumb">{o.image ? <img src={o.image} alt="" loading="lazy" decoding="async" /> : null}</span>
              <span className="mappick__text">
                <span className="mappick__name">{o.name}</span>
                <span className="mappick__code mono">{o.code}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
