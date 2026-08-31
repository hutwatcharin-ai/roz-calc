'use client';

// The "เพิ่งดู" strip: the last few monsters and items this browser opened.
// Rendered only after mount, because the server cannot know this browser's
// history and must not claim an empty one.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { hrefFor, readRecent, type RecentEntry } from '@/lib/recent';

export default function RecentlyViewed() {
  const [entries, setEntries] = useState<RecentEntry[] | null>(null);

  useEffect(() => {
    try {
      setEntries(readRecent(window.localStorage));
    } catch {
      setEntries([]);
    }
  }, []);

  // Nothing before mount and nothing when there is no history: a first-time
  // visitor should not see an empty "เพิ่งดู" heading asking to be filled.
  if (!entries || entries.length === 0) return null;

  return (
    <nav className="jumpbar" aria-label="เพิ่งดู">
      <span className="jumpbar__label">เพิ่งดู</span>
      {entries.map((e) => (
        <Link key={`${e.kind}-${e.id}`} href={hrefFor(e)}>
          {e.name}
        </Link>
      ))}
    </nav>
  );
}
