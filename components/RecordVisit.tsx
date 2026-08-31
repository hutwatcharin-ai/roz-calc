'use client';

// Writes one entry into the "เพิ่งดู" list when a detail page mounts.
// Renders nothing; the strip that shows the list is RecentlyViewed.

import { useEffect } from 'react';
import { addRecent, type RecentEntry } from '@/lib/recent';

export default function RecordVisit({ kind, id, name }: RecentEntry) {
  useEffect(() => {
    try {
      addRecent(window.localStorage, { kind, id, name });
    } catch {
      // Storage may be unavailable entirely; the visit is simply not recorded.
    }
  }, [kind, id, name]);

  return null;
}
