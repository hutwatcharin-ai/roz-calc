'use client';

// Reports a search once per term. Rendered by the server list pages (through
// FilterState) and the drop finder, which already know the term and the count;
// the source is read off the URL so the pages need not say who they are.
//
// Deps are the term, not mount: paging to page 2 of the same word re-renders
// this without firing, a new word fires even though the component stayed put.

import { useEffect } from 'react';
import { track } from '@/lib/analytics';

function sourceFromPath(pathname: string): string {
  // /database/monsters -> monsters, /drop-finder -> drop-finder
  const parts = pathname.split('/').filter(Boolean);
  return parts[parts.length - 1] ?? 'unknown';
}

export default function TrackSearch({ term, count }: { term: string; count: number }) {
  const trimmed = term.trim();
  useEffect(() => {
    if (!trimmed) return;
    track('search', {
      search_term: trimmed,
      result_count: count,
      source: sourceFromPath(window.location.pathname),
    });
    // count is left out on purpose: the same term can only have one count, and
    // listing it would only add a way for the effect to run twice.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trimmed]);
  return null;
}
