// app/tools/zeny-farm/page.tsx
//
// The zeny draft moved into /tools/leveling-spots as its fourth mode on
// 11 Sep 2026 (it used the same numbers, dodge rule and map list as that
// tool). This path only exists because the owner has the old link.
import { redirect } from 'next/navigation';

export const metadata = { robots: { index: false, follow: false } };

export default function ZenyFarmPage() {
  redirect('/tools/leveling-spots?mode=zeny');
}
