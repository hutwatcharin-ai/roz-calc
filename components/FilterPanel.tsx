'use client';

// The filter column on /database/monsters (owner's pick B, 28 Sep 2026: the
// three-box layout was too long). On a wide screen the children are a plain
// sidebar beside the results. On a phone the results come first and the
// filters live behind one "ตัวกรอง" button that slides a sheet up from the
// bottom; it stays open while chips are picked (each pick is a navigation
// that keeps this component mounted) and "ดูผล" closes it.

import { useEffect, useState, type ReactNode } from 'react';

export default function FilterPanel({ active, resultCount, children }: { active: number; resultCount: number; children: ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const before = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = before;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <>
      <button type="button" className="fpanel__open" aria-expanded={open} aria-controls="fpanel" onClick={() => setOpen(true)}>
        ตัวกรอง{active > 0 ? ` (${active})` : ''}
      </button>
      {open && <div className="fpanel__backdrop" onClick={() => setOpen(false)} aria-hidden="true" />}
      <aside id="fpanel" className={`fpanel${open ? ' is-open' : ''}`} aria-label="ตัวกรอง">
        <div className="fpanel__head">
          <strong>ตัวกรอง</strong>
          <button type="button" className="fpanel__close" onClick={() => setOpen(false)} aria-label="ปิดตัวกรอง">✕</button>
        </div>
        <div className="fpanel__body">{children}</div>
        <div className="fpanel__foot">
          <button type="button" className="btn fpanel__done" onClick={() => setOpen(false)}>
            ดูผล {resultCount.toLocaleString('en-US')} ตัว
          </button>
        </div>
      </aside>
    </>
  );
}
