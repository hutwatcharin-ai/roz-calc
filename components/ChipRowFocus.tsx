'use client';

// On a phone the "เอาไว้ทำอะไร" chips are one row that scrolls sideways
// (globals.css, owner 24 Oct 2026), so the chosen chip can sit off screen.
// After every navigation, scroll each such row -- the row, not the page --
// until its chosen chip shows.

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export default function ChipRowFocus() {
  const pathname = usePathname();
  const search = useSearchParams();

  useEffect(() => {
    for (const on of Array.from(document.querySelectorAll<HTMLElement>('.rolepick .chips .chip--on'))) {
      const row = on.parentElement;
      if (!row || row.scrollWidth <= row.clientWidth) continue;
      row.scrollLeft = on.offsetLeft - row.offsetLeft - 16;
    }
  }, [pathname, search]);

  return null;
}
