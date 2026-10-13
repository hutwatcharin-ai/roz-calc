'use client';

// The top slot is on every page (app/layout). Unsold, it draws the house ad
// "ลงโฆษณาตรงนี้" -- fine above a guide, but on a short item, costume or NPC
// page it is a banner over a few lines of the game's own text. AdSense
// refused the site for low-value content (4 Oct 2026) and its policy counts
// promotion against the content beside it, so the house ad stays off those
// pages. A banner someone paid for still shows everywhere, as sold.
//
// /advertise/preview draws its own sample banners; the real slot above them
// would be a second, confusing one.

import { usePathname } from 'next/navigation';

const THIN = /^\/database\/(items|costumes|npcs)\/[^/]+/;

export default function TopAdGate({ sold, children }: { sold: boolean; children: React.ReactNode }) {
  const path = usePathname() ?? '';
  if (path === '/advertise/preview') return null;
  if (!sold && THIN.test(path)) return null;
  return <>{children}</>;
}
