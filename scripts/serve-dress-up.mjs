// Serve out/dress-up/ over HTTP with CORS *, for previewing /tools/dress-up without R2.
// Build the site with NEXT_PUBLIC_DRESSUP_BASE=http://<this host>:3302/ to point at it.
//
// Usage: node scripts/serve-dress-up.mjs [port=3302]   (binds 0.0.0.0)
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(path.dirname(fileURLToPath(import.meta.url))), 'out', 'dress-up');
const PORT = Number(process.argv[2] ?? 3302);
const TYPES = { '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png' };

createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const rel = decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname).replace(/^\/+/, '');
  const file = path.resolve(ROOT, rel);
  const type = TYPES[path.extname(file)];
  if (!file.startsWith(ROOT + path.sep) || !type) { res.writeHead(404).end(); return; }
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'public, max-age=31536000, immutable' }).end(body);
  } catch {
    res.writeHead(404).end();
  }
}).listen(PORT, '0.0.0.0', () => console.log(`out/dress-up on http://0.0.0.0:${PORT}/`));
