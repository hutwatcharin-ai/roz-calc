// Run after a deploy that adds/changes URLs: pulls every URL from the live
// sitemap and submits it to IndexNow in one batch (the API accepts up to
// 10,000 per call). Manual, not wired into CI -- deploys here are already a
// manual curl-and-poll step (CLAUDE.md), so this stays the same shape.
import { SITE_URL } from '../lib/site';
import { submitIndexNow } from '../lib/indexnow';

async function main() {
  const host = new URL(SITE_URL).host;
  const res = await fetch(`${SITE_URL}/sitemap.xml`);
  if (!res.ok) throw new Error(`sitemap fetch failed: ${res.status}`);
  const xml = await res.text();
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  if (urls.length === 0) throw new Error('sitemap had no <loc> entries -- refusing to submit an empty batch');

  console.log(`submitting ${urls.length} URLs to IndexNow for ${host}...`);
  const result = await submitIndexNow(host, urls);
  console.log(result.ok ? `OK (${result.status})` : `FAILED (${result.status})`);
  if (!result.ok) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
