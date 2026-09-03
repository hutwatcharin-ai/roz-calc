// Re-fetches every skills.jsonl record that didn't come back 200 (156 were
// rate-limited 429 during the full-site crawl's 8-way concurrency) and
// patches them into the file in place. Low concurrency + a real delay this
// time since the site's rate limiter is what caused the gap.
import fs from 'node:fs';
import path from 'node:path';

const FILE = path.resolve('prontera-export', 'data', 'skills.jsonl');
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
function recordFrom(url, html, status) {
  const parsed = new URL(url);
  return {
    url,
    path: parsed.pathname,
    category: 'skills',
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

const lines = fs.readFileSync(FILE, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
const byUrl = new Map(lines.map((r) => [r.url, r]));
const toRetry = lines.filter((r) => r.status !== 200);
console.log(`${toRetry.length} to retry`);

for (const [i, rec] of toRetry.entries()) {
  let status;
  let html;
  for (let attempt = 1; attempt <= 4; attempt++) {
    const res = await fetch(rec.url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; roz-calc research)' } });
    status = res.status;
    html = await res.text();
    if (status === 200) break;
    await sleep(2000 * attempt);
  }
  byUrl.set(rec.url, recordFrom(rec.url, html, status));
  process.stdout.write(`\r${i + 1}/${toRetry.length} (last status ${status})`);
  await sleep(400);
}

fs.writeFileSync(FILE, [...byUrl.values()].map((r) => JSON.stringify(r)).join('\n') + '\n', 'utf8');
const stillBad = [...byUrl.values()].filter((r) => r.status !== 200);
console.log(`\nDone. Still non-200: ${stillBad.length}`);
if (stillBad.length) console.log(stillBad.map((r) => `${r.status} ${r.url}`).join('\n'));
