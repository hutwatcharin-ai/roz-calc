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
import { applyInternalParam, contentGroupFor, pageViewPath, track } from '@/lib/analytics';

// The last path actually reported, kept outside the component: a soft
// navigation can remount this, and a remounted ref would forget and send the
// same view twice.
let lastReportedPath: string | null = null;

function PageViews() {
  const pathname = usePathname();
  const search = useSearchParams();
  const query = search.toString();

  useEffect(() => {
    // Before the page_view, so a ?internal=1 visit is excluded from the start.
    applyInternalParam(search.get('internal'), window.localStorage);
    // Not the raw query: a tool that rewrites its own URL as you work (the
    // skill planner, on every point spent) re-runs this effect without being
    // a new page. 19 users made 771 views of it in 30 days that way.
    const path = pageViewPath(pathname, query);
    if (lastReportedPath === path) return;
    lastReportedPath = path;
    track('page_view', {
      page_path: path,
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
