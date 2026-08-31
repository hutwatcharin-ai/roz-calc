'use client';

// One checkbox, site-wide effect: Challenge clones (C1-C9) are hidden by
// default and revealed on demand. Two mechanisms behind the same control:
//
// - 'local' mode (map page, afk-finder): C rows are in the HTML with the
//   `cvariant` class and hidden by CSS unless <html data-show-cvariant> is
//   set. Default-hidden needs no JS, so there is no flash for the majority.
// - 'nav' mode (monster list): the list is server-filtered so the result
//   count and pagination stay exact; toggling navigates with/without ?c=1.
//
// Both write the same localStorage key so the choice follows the player
// across pages. localStorage can throw (private mode); every access is
// guarded and the default (hidden) must survive a throw.

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const KEY = 'show-cvariant';

function readShow(): boolean {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

function writeShow(show: boolean) {
  try {
    localStorage.setItem(KEY, show ? '1' : '0');
  } catch {
    /* private mode: the choice just won't persist */
  }
}

export function applyRootAttr(show: boolean) {
  document.documentElement.toggleAttribute('data-show-cvariant', show);
}

export default function CVariantToggle({
  mode,
  navHref,
  navShow,
}: {
  mode: 'local' | 'nav';
  /** nav mode: current URL rebuilt without paging, ?c=1 appended when showing */
  navHref?: (show: boolean) => string;
  /** nav mode: whether the current server render already includes C monsters */
  navShow?: boolean;
}) {
  const router = useRouter();
  // Hidden is the SSR truth for local mode; sync from storage after mount.
  const [show, setShow] = useState(mode === 'nav' ? !!navShow : false);

  useEffect(() => {
    if (mode === 'local') {
      const stored = readShow();
      setShow(stored);
      applyRootAttr(stored);
    }
  }, [mode]);

  function onChange(checkedHide: boolean) {
    const nextShow = !checkedHide;
    writeShow(nextShow);
    if (mode === 'local') {
      setShow(nextShow);
      applyRootAttr(nextShow);
    } else if (navHref) {
      router.push(navHref(nextShow));
    }
  }

  return (
    <label className="cvtoggle">
      <input
        type="checkbox"
        checked={!show}
        onChange={(e) => onChange(e.target.checked)}
      />
      ซ่อนมอน Challenge (C1–C9)
    </label>
  );
}
