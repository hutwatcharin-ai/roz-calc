// Scoped re-crawl of rozerodb's Guides & Info + Tools sections only (14 pages)
// -- the full crawl-rozerodb.mjs run is ~4,900 pages and overkill for a quick
// refresh of just this section. Same output shape (guides.jsonl / tools.jsonl
// under rozerodb-export/data) so nothing downstream needs to change.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = 'https://rozerodb.com';
const OUT = path.resolve('rozerodb-export', 'data');
fs.mkdirSync(OUT, { recursive: true });

const guideUrls = [
  '/guides/pets', '/guides/elements-sizes', '/guides/item-sets',
  '/guides/alchemy-lab', '/guides/refine', '/guides/roadmap-update',
].map((p) => ROOT + p);
const toolUrls = [
  '/tools/affixes', '/tools/alchemist', '/tools/arrow-crafting', '/tools/exp',
  '/tools/farm-drop-planner', '/tools/forge', '/tools/refine', '/tools/skill-tree',
].map((p) => ROOT + p);

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
async function fetchPage(url) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; roz-calc research)' } });
      return { html: await res.text(), status: res.status };
    } catch (error) {
      if (attempt === 3) throw error;
      await new Promise((r) => setTimeout(r, 500 * attempt));
    }
  }
}

const urls = [...guideUrls, ...toolUrls];
const byCategory = new Map();
for (const url of urls) {
  const { html, status } = await fetchPage(url);
  const record = recordFrom(url, html, status);
  if (!byCategory.has(record.category)) byCategory.set(record.category, []);
  byCategory.get(record.category).push(record);
  console.log(record.category, record.slug, status, record.text.length, 'chars');
}
for (const [category, records] of byCategory) {
  fs.writeFileSync(
    path.join(OUT, `${category}.jsonl`),
    records.map((r) => JSON.stringify(r)).join('\n') + '\n',
    'utf8',
  );
}
console.log('Done:', urls.length, 'pages ->', [...byCategory.keys()].join(', '));
