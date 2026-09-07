'use client';

// A monster name that shows its sprite while the pointer rests on it. Tables
// on the tools pages list monsters by name only; the sprite is the thing a
// player actually recognises (user, 7 Sep 2026: "hover on the name, show the
// monster"). The popup is CSS-only (.monlink in globals.css), so the sprite
// is fetched the first time it is shown and never on page load.
//
// Two monsters have no mirrored sprite (Deviling, C4 Golem); the popup hides
// itself when the image fails instead of showing a broken-image box.

import Link from 'next/link';
import { useState } from 'react';

export default function MonsterLink({ id, name }: { id: number; name: string }) {
  const [broken, setBroken] = useState(false);
  return (
    <Link href={`/database/monsters/${id}`} className="monlink">
      {name}
      {!broken && (
        <span className="monlink__pop" aria-hidden="true">
          <img
            src={`/images/monsters/${id}.gif`}
            alt=""
            loading="lazy"
            decoding="async"
            onError={() => setBroken(true)}
          />
        </span>
      )}
    </Link>
  );
}
