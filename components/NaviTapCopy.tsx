'use client';

// Every /navi command printed as <code class="navicmd"> on a guide copies on
// tap (owner, 8 Oct 2026). One delegated listener in the guides layout rather
// than a component per command: a dozen guides print them in prose, tables
// and lists, and the markup stays plain text without JavaScript.

import { useEffect } from 'react';

export default function NaviTapCopy() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest<HTMLElement>('.gx code.navicmd');
      if (!el || !navigator.clipboard) return;
      navigator.clipboard.writeText(el.textContent ?? '').then(
        () => {
          el.classList.add('is-copied');
          setTimeout(() => el.classList.remove('is-copied'), 1400);
        },
        () => {},
      );
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);
  return null;
}
