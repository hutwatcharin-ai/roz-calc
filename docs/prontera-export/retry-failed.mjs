// Re-fetches every record in a crawl file that did not come back 200, and
// patches the results into the file in place.
//
// The full-site crawl ran 8-way concurrent and the site's rate limiter cut
// 758 pages across items (323), mobs (312) and maps (118) with a 429, plus
// 203 that answered 404 (npcs, quests). retry-skills.mjs did this for one
// category on 3 Sep and recovered all 156 of its 429s; this is that script
// with the category as an argument, since the same gap exists in five files.
//
// A 404 is re-tried exactly the same way on purpose: a URL the sitemap lists
// that answers 404 twice, hours apart, is a real absence to report -- not a
// number to quietly drop from a manifest and never look at again.
//
// Usage: node prontera-export/retry-failed.mjs items maps mobs npcs quests
import fs from 'node:fs';
import path from 'node:path';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function decode(value = '') {
  const named = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
  return value
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (all, n) => named[n.toLowerCase()] ?? all);
}
function extractNuxtData(html) {
  const m = /<script[^>]*id="__NUXT_DATA__"[^>]*>([\s\S]*?)<\/script>/.exec(html);
  return m ? m[1] : null;
}
function cleanText(html) {
  return decode(html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}
function match(html, re) {
  const found = html.match(re);
  return found ? decode(found[1]).replace(/\s+/g, ' ').trim() : null;
}
function recordFrom(url, html, status, category) {
  const parsed = new URL(url);
  return {
    url,
    path: parsed.pathname,
    category,
    slug: parsed.pathname.split('/').filter(Boolean).at(-1) || 'home',
    status,
    title: match(html, /<title[^>]*>([\s\S]*?)<\/title>/i),
    description: match(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)
      ?? match(html, /<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i),
    heading: match(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i)?.replace(/<[^>]+>/g, '').trim() ?? null,
    text: cleanText(html),
    nuxt_data: extractNuxtData(html),
    fetched_at: new Date().toISOString(),
  };
}

async function retryCategory(category) {
  const file = path.resolve('prontera-export', 'data', `${category}.jsonl`);
  if (!fs.existsSync(file)) {
    console.log(`${category}: no data file, skipped`);
    return;
  }

  const lines = fs.readFileSync(file, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  const byUrl = new Map(lines.map((r) => [r.url, r]));
  const toRetry = lines.filter((r) => r.status !== 200);
  console.log(`\n${category}: ${toRetry.length} of ${lines.length} to retry`);
  if (toRetry.length === 0) return;

  for (const [i, rec] of toRetry.entries()) {
    let status;
    let html = '';
    for (let attempt = 1; attempt <= 4; attempt++) {
      try {
        const res = await fetch(rec.url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; roz-calc research)' } });
        status = res.status;
        html = await res.text();
      } catch (err) {
        // A thrown fetch is not a status. Recording it as one would make a
        // network blip indistinguishable from the site answering.
        status = 0;
        html = '';
      }
      if (status === 200) break;
      // 404 does not get the long backoff: it is an answer, not a refusal.
      if (status === 404) break;
      await sleep(2000 * attempt);
    }
    byUrl.set(rec.url, recordFrom(rec.url, html, status, category));
    process.stdout.write(`\r  ${i + 1}/${toRetry.length} (last status ${status})   `);
    await sleep(400);
  }

  fs.writeFileSync(file, [...byUrl.values()].map((r) => JSON.stringify(r)).join('\n') + '\n', 'utf8');
  const stillBad = [...byUrl.values()].filter((r) => r.status !== 200);
  const counts = stillBad.reduce((acc, r) => ({ ...acc, [r.status]: (acc[r.status] ?? 0) + 1 }), {});
  console.log(`\n  ${category}: still non-200 = ${stillBad.length} ${JSON.stringify(counts)}`);
}

const categories = process.argv.slice(2);
if (categories.length === 0) {
  console.error('usage: node prontera-export/retry-failed.mjs <category>...');
  process.exit(1);
}
for (const category of categories) await retryCategory(category);
