// Full crawl of roz.prontera.info's public sitemaps.
//
// robots.txt allows everything except /api/ (checked 3 Sep 2026), same
// posture as docs/rozerodb-export/crawl-rozerodb.mjs -- so this follows that
// script's shape: one JSONL file per top-level path segment, plus a manifest.
//
// The site is a Nuxt 3 SSR app: list/detail pages ship their real data
// server-rendered inside a <script id="__NUXT_DATA__"> payload (Nuxt's
// "devalue" flattened-array format, not plain JSON), alongside the visible
// text. Parsing that format generically for every page shape here would be
// its own project; this crawl instead captures BOTH the cleaned visible text
// AND the raw __NUXT_DATA__ string per page, so a later, page-type-specific
// parser can pull structured fields out of it without re-crawling.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = 'https://roz.prontera.info';
const OUT = path.resolve('prontera-export', 'data');
const CONCURRENCY = 8;
const RETRIES = 3;
const SITEMAPS = [
  'pages', 'updates', 'content', 'news', 'guides', 'builds',
  'leveling-routes', 'leveling-by-level-classes', 'mobs', 'items', 'maps',
  'npcs', 'quests', 'jobs', 'skills',
];

fs.mkdirSync(OUT, { recursive: true });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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

function categoryOf(url) {
  return new URL(url).pathname.split('/').filter(Boolean)[0] || 'home';
}

function recordFrom(url, html, status) {
  const parsed = new URL(url);
  return {
    url,
    path: parsed.pathname,
    category: categoryOf(url),
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

async function fetchRetry(url) {
  let error;
  for (let attempt = 1; attempt <= RETRIES; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; roz-calc research)' } });
      return { html: await res.text(), status: res.status };
    } catch (err) {
      error = err;
      await sleep(500 * attempt);
    }
  }
  throw error;
}

async function collectUrls() {
  const urls = [];
  for (const name of SITEMAPS) {
    const res = await fetch(`${ROOT}/__sitemap__/${name}.xml`);
    const xml = await res.text();
    const found = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    urls.push(...found);
  }
  return [...new Set(urls)];
}

const urls = await collectUrls();
console.log(`${urls.length} URLs from ${SITEMAPS.length} sitemaps`);

const streams = new Map();
function streamFor(category) {
  if (!streams.has(category)) {
    streams.set(category, fs.createWriteStream(path.join(OUT, `${category}.jsonl`), { encoding: 'utf8' }));
  }
  return streams.get(category);
}

let next = 0;
let completed = 0;
const failures = [];
const counts = {};

async function worker() {
  while (true) {
    const index = next++;
    if (index >= urls.length) return;
    const url = urls[index];
    const category = categoryOf(url);
    try {
      const { html, status } = await fetchRetry(url);
      streamFor(category).write(JSON.stringify(recordFrom(url, html, status)) + '\n');
      counts[category] = (counts[category] || 0) + 1;
    } catch (error) {
      failures.push({ url, error: String(error) });
    }
    completed++;
    if (completed % 100 === 0 || completed === urls.length) {
      process.stdout.write(`\r${completed}/${urls.length} pages`);
    }
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, worker));
await Promise.all([...streams.values()].map((stream) => new Promise((resolve) => stream.end(resolve))));

const manifest = {
  source: ROOT,
  generated_at: new Date().toISOString(),
  format: 'JSON Lines; one public webpage per record',
  fields: ['url', 'path', 'category', 'slug', 'status', 'title', 'description', 'heading', 'text', 'nuxt_data', 'fetched_at'],
  notes: [
    'nuxt_data is the raw __NUXT_DATA__ script payload (Nuxt 3 devalue format, not plain JSON) when present -- structured fields need a page-type-specific parser, not written yet.',
    'The /api/ path is intentionally not accessed because robots.txt disallows crawlers there.',
    'Images and other binary assets are not mirrored.',
  ],
  requested_urls: urls.length,
  successful_urls: Object.values(counts).reduce((sum, n) => sum + n, 0),
  failed_urls: failures.length,
  counts,
  failures,
};
fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
process.stdout.write(`\nDone: ${manifest.successful_urls} successful, ${manifest.failed_urls} failed.\n`);
