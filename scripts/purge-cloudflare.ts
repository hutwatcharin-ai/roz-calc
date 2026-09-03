// Purges the Cloudflare cache for rozerothai.com.
//
// Why this exists: the zone caches HTML for 24 hours (Cache Rule `cache-html`)
// and a Coolify redeploy does not bust it, so a deploy ships code nobody sees
// until the next day. Caught on 2 Sep when /about served an 8,474-second-old
// copy after a successful deploy, and paid for by hand -- clicking Purge
// Everything in the dashboard -- after every deploy since.
//
// Run:  npx tsx scripts/purge-cloudflare.ts [path ...]
//
//   no args   purge everything (what the manual click does)
//   with args purge just those URLs, e.g.
//             npx tsx scripts/purge-cloudflare.ts /database/skills /about
//
// Needs two values in .env.local (both gitignored):
//   CLOUDFLARE_ZONE_ID    the zone's id, from the dashboard's Overview page
//   CLOUDFLARE_API_TOKEN  a token whose ONLY permission is Zone > Cache Purge,
//                         scoped to this one zone. Not the Global API Key --
//                         that one can do anything to the account.

import { SITE_URL } from '../lib/site';

async function main(): Promise<void> {
  const zone = process.env.CLOUDFLARE_ZONE_ID;
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!zone || !token) {
    throw new Error(
      'CLOUDFLARE_ZONE_ID and CLOUDFLARE_API_TOKEN must be set (see the comment at the top of this file)',
    );
  }

  const paths = process.argv.slice(2);
  const body = paths.length > 0
    ? { files: paths.map((p) => (p.startsWith('http') ? p : `${SITE_URL}${p.startsWith('/') ? p : `/${p}`}`)) }
    : { purge_everything: true };

  const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${zone}/purge_cache`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const json = (await res.json()) as { success?: boolean; errors?: { code: number; message: string }[] };

  // Cloudflare answers 200 with success:false for an unauthorised token, so
  // the status code alone is not the check -- treating it as one would report
  // a purge that never happened.
  if (!res.ok || json.success !== true) {
    const detail = (json.errors ?? []).map((e) => `${e.code} ${e.message}`).join('; ') || `HTTP ${res.status}`;
    throw new Error(`purge failed: ${detail}`);
  }

  console.log(paths.length > 0 ? `purged ${paths.length} URL(s)` : 'purged everything');
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
