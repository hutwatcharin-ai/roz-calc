'use client';
// The kind tabs are CSS :target. Arriving from an equipment page with
// #k-melee in the URL should open that tab, but Next's router rewrites the
// history entry while hydrating and Chrome drops :target with it, so the page
// fell back to the first tab. Re-applying the hash once after hydration is a
// real fragment navigation and sets :target again.
import { useEffect } from 'react';

export default function HashTab() {
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.startsWith('#k-') || document.querySelector(':target')) return;
    history.replaceState(history.state, '', window.location.pathname + window.location.search);
    window.location.hash = hash;
  }, []);
  return null;
}
