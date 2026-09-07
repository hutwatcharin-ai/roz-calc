'use client';

import { useState, type ReactNode } from 'react';

/** Compact on phones; always expanded by CSS on wider screens. */
export default function FooterSection({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <section className={`sitefooter__col sitefooter__section${open ? ' is-open' : ''}`}>
      <h2 className="sitefooter__h">
        <button
          type="button"
          className="sitefooter__toggle"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          <span>{title}</span>
          <span className="sitefooter__chevron" aria-hidden="true">⌄</span>
        </button>
        <span className="sitefooter__desktop-title">{title}</span>
      </h2>
      <div className="sitefooter__section-body">{children}</div>
    </section>
  );
}
