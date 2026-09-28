'use client';

// Class guides cite a clip under nearly every line. Those lines stay in the
// HTML (crawlers and the curious can check every claim), but on a phone they
// were 563 lines of 11.5px text on the Knight guide alone (UX pass 28 Sep
// 2026), so they start hidden and this switch brings them back. The choice is
// remembered per browser.

import { useEffect, useState } from 'react';

const KEY = 'cguide-showsrc';
const CLASS = 'cguide-showsrc';

export default function SourceToggle() {
  const [on, setOn] = useState(false);

  useEffect(() => {
    let saved = false;
    try { saved = localStorage.getItem(KEY) === '1'; } catch {}
    setOn(saved);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle(CLASS, on);
  }, [on]);

  function flip() {
    const next = !on;
    setOn(next);
    try { localStorage.setItem(KEY, next ? '1' : '0'); } catch {}
  }

  return (
    <button type="button" className="srctoggle" aria-pressed={on} onClick={flip}>
      {on ? 'ซ่อนที่มาใต้แต่ละข้อ' : 'แสดงที่มาใต้แต่ละข้อ (คลิปและนาที)'}
    </button>
  );
}
