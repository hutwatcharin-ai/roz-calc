'use client';

// Opens a folded <details> when a link points into it (#knight-bb from the
// build picker, or a shared URL). Without this, jumping to a folded build
// lands on its closed summary line and looks like nothing happened.

import { useEffect } from 'react';

export default function OpenOnHash() {
  useEffect(() => {
    function open() {
      const id = decodeURIComponent(location.hash.slice(1));
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;
      let node: HTMLElement | null = target;
      let opened = false;
      while (node) {
        if (node instanceof HTMLDetailsElement && !node.open) { node.open = true; opened = true; }
        node = node.parentElement;
      }
      if (opened) target.scrollIntoView();
    }
    open();
    window.addEventListener('hashchange', open);
    return () => window.removeEventListener('hashchange', open);
  }, []);
  return null;
}
