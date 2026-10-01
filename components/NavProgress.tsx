'use client';

// The site's loading signal (1 Oct 2026): an arcade "LOADING" bar across the
// top while a click on an internal link, or a filter form, waits for the next
// page. Before this a slow database page left the old page frozen with no
// sign anything had happened.
//
// Not app/loading.tsx: a route-level loading boundary starts streaming before
// the page runs, so a detail page that calls notFound() answered 200 instead
// of 404 (checked on /database/monsters/999999). This lives outside the
// routes and changes nothing about how a page is served.

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

// Under this, a page that arrives fast shows no bar at all.
const SHOW_AFTER_MS = 250;

export default function NavProgress() {
  const pathname = usePathname();
  const search = useSearchParams();
  const [pending, setPending] = useState(false);
  const [visible, setVisible] = useState(false);

  // The new page is here: stop.
  useEffect(() => {
    setPending(false);
  }, [pathname, search]);

  useEffect(() => {
    if (!pending) {
      setVisible(false);
      return;
    }
    const show = setTimeout(() => setVisible(true), SHOW_AFTER_MS);
    // Never stuck on: a navigation that fails or is cancelled clears itself.
    const giveUp = setTimeout(() => setPending(false), 15000);
    return () => {
      clearTimeout(show);
      clearTimeout(giveUp);
    };
  }, [pending]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const a = (event.target as Element | null)?.closest?.('a');
      if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      // Same page, or only a #jump: nothing to wait for.
      if (url.pathname === location.pathname && url.search === location.search) return;
      setPending(true);
    }
    function onSubmit(event: SubmitEvent) {
      const form = event.target as HTMLFormElement | null;
      if (!form || event.defaultPrevented || (form.method && form.method.toLowerCase() !== 'get')) return;
      setPending(true);
    }
    document.addEventListener('click', onClick);
    document.addEventListener('submit', onSubmit);
    return () => {
      document.removeEventListener('click', onClick);
      document.removeEventListener('submit', onSubmit);
    };
  }, []);

  if (!visible) return null;
  return (
    <div className="navprog" role="status" aria-live="polite">
      <span className="navprog__bar" aria-hidden="true" />
      <span className="navprog__word">
        LOADING<span aria-hidden="true">...</span>
        <span className="navprog__sr">กำลังโหลด</span>
      </span>
    </div>
  );
}
