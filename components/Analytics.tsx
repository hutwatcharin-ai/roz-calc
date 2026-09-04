'use client';

// GA4 page views, sent by hand.
//
// gtag's own page_view (and the enhanced-measurement one on history changes)
// fires before the new page has rendered, so anything set from the page --
// the content group -- arrives one page late. The config in the root layout
// therefore says send_page_view: false and the property has history-change
// page views switched off; this component sends every page_view itself, after
// the route has changed, with the group that belongs to it.
//
// The gtag stub and config are an inline script in the layout head, not here:
// they must exist before hydration so the first page_view is not lost.

import { Suspense, useEffect } from 'react';
import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { applyInternalParam, contentGroupFor, track } from '@/lib/analytics';

function PageViews() {
  const pathname = usePathname();
  const search = useSearchParams();
  const query = search.toString();

  useEffect(() => {
    // Before the page_view, so a ?internal=1 visit is excluded from the start.
    applyInternalParam(search.get('internal'), window.localStorage);
    track('page_view', {
      page_path: query ? `${pathname}?${query}` : pathname,
      page_location: window.location.href,
      page_title: document.title,
      content_group: contentGroupFor(pathname),
    });
    // search is derived from query; pathname + query is the whole identity of
    // a page here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, query]);

  return null;
}

export default function Analytics({ gaId }: { gaId: string }) {
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
      {/* useSearchParams needs a Suspense boundary or the whole tree bails out
          of static rendering at build time. */}
      <Suspense fallback={null}>
        <PageViews />
      </Suspense>
    </>
  );
}
