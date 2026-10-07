'use client';

// The homepage build strip's button, the only part of the strip that runs in
// the browser: it reports the click (GA4 home_build_click), which the 21 Oct
// 2026 review counts against homepage searches.

import Link from 'next/link';
import { track } from '@/lib/analytics';

export default function HomeBuildGo() {
  return (
    <Link href="/tools/build" className="homebuild__go" onClick={() => track('home_build_click', { kind: 'start' })}>
      เริ่มจำลองบิลด์ <span aria-hidden="true">▶</span>
    </Link>
  );
}
