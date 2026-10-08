'use client';

// A /navi command you can tap to copy (owner, 8 Oct 2026: the guides list a
// lot of these, and on a phone selecting monospace text is fiddly). Without
// JavaScript it is still the command, selectable as text.

import { useState } from 'react';

export default function NaviCopy({ cmd }: { cmd: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className={'navicopy mono' + (done ? ' is-done' : '')}
      title="กดเพื่อก๊อป แล้วไปวางในช่องแชตในเกม"
      onClick={() => {
        navigator.clipboard?.writeText(cmd).then(
          () => {
            setDone(true);
            setTimeout(() => setDone(false), 1600);
          },
          () => {},
        );
      }}
    >
      <span>{cmd}</span>
      <small aria-live="polite">{done ? 'ก๊อปแล้ว ✓' : 'ก๊อป'}</small>
    </button>
  );
}
