import fs from 'node:fs';
import path from 'node:path';

const ROOT = 'https://rozerodb.com';
const OUT = path.resolve('rozerodb-export', 'data');
const CONCURRENCY = 8;
const RETRIES = 3;

fs.mkdirSync(OUT, { recursive: true });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function decode(value = '') {
  const named = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
  return value
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (all, n) => named[n.toLowerCase()] ?? all);
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
    fetched_at: new Date().toISOString(),
  };
}

async function fetchRetry(url) {
  let error;
  for (let attempt = 1; attempt <= RETRIES; attempt++) {
    try {
      const response = await fetch(url, {
        headers: { 'user-agent': 'ROZeroDB-public-export/1.0 (+data export; respects robots.txt)' },
        signal: AbortSignal.timeout(30_000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return { html: await response.text(), status: response.status };
    } catch (caught) {
      error = caught;
      await sleep(500 * attempt);
    }
  }
  throw error;
}

const sitemapResponse = await fetchRetry(`${ROOT}/sitemap.xml`);
fs.writeFileSync(path.join(OUT, 'sitemap.xml'), sitemapResponse.html, 'utf8');
const urls = [...sitemapResponse.html.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => decode(m[1]));

// Ensure every public tool exposed in site navigation is included even if a future sitemap omits it.
const toolUrls = [
  '/tools/affixes', '/tools/alchemist', '/tools/arrow-crafting', '/tools/exp',
  '/tools/farm-drop-planner', '/tools/forge', '/tools/refine', '/tools/skill-tree',
].map((item) => ROOT + item);
for (const url of toolUrls) if (!urls.includes(url)) urls.push(url);

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
  fields: ['url', 'path', 'category', 'slug', 'status', 'title', 'description', 'heading', 'text', 'fetched_at'],
  requested_urls: urls.length,
  successful_urls: Object.values(counts).reduce((sum, n) => sum + n, 0),
  failed_urls: failures.length,
  counts,
  failures,
  notes: [
    'Content is extracted from publicly rendered pages listed in sitemap.xml plus the eight public tool routes.',
    'The /api/ path is intentionally not accessed because robots.txt disallows crawlers there.',
    'Images, executable downloads, and other binary assets are not mirrored.',
  ],
};
fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
process.stdout.write(`\nDone: ${manifest.successful_urls} successful, ${manifest.failed_urls} failed.\n`);
