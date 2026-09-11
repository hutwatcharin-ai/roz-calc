// app/tools/zeny-farm/page.tsx
//
// The zeny draft moved into /tools/leveling-spots as its fourth mode on
// 11 Sep 2026 (it used the same numbers, dodge rule and map list as that
// tool). This path only exists because the owner has the old link.
import { redirect } from 'next/navigation';

export const metadata = { robots: { index: false, follow: false } };

// Rendered per request. Prerendered, the redirect was cached as a bare 307
// with no Location header (seen on production 11 Sep 2026): the status
// survived the cache, the header did not, and curl -L went nowhere.
export const dynamic = 'force-dynamic';

export default function ZenyFarmPage() {
  redirect('/tools/leveling-spots?mode=zeny');
}
