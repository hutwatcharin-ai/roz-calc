// Resolves every crawled NPC page's payload. map_navi_code matches the
// rAthena-style map codes our own quests.map_code column already uses (e.g.
// "prt_in" for Inside Prontera), so this can join directly without any
// name translation.
import fs from 'node:fs';
import path from 'node:path';
import { resolvePayload } from './resolve-lib.mjs';

const SRC = path.resolve('prontera-export', 'data', 'npcs.jsonl');
const OUT = path.resolve('prontera-export', 'npcs-summary.json');

const lines = fs.readFileSync(SRC, 'utf8').trim().split('\n');
const npcs = [];
const skipped = [];

for (const line of lines) {
  const rec = JSON.parse(line);
  if (rec.slug === 'npcs') continue;
  if (rec.status !== 200) { skipped.push({ url: rec.url, reason: `status ${rec.status}` }); continue; }
  if (!rec.nuxt_data) { skipped.push({ url: rec.url, reason: 'no nuxt_data' }); continue; }
  let root;
  try {
    root = resolvePayload(rec.nuxt_data);
  } catch (e) {
    skipped.push({ url: rec.url, reason: `resolve failed: ${e.message}` });
    continue;
  }
  const key = Object.keys(root.data ?? {}).find((k) => k.startsWith('npc-'));
  const n = key ? root.data[key]?.npc : null;
  if (!n) { skipped.push({ url: rec.url, reason: 'no npc object in payload' }); continue; }

  npcs.push({
    slug: n.slug,
    name: n.name,
    map_slug: n.map?.slug ?? null,
    map_name: n.map?.name ?? null,
    map_navi_code: n.map_navi_code ?? null,
    x: n.x ?? null,
    y: n.y ?? null,
    quests_given: (n.quests_given ?? []).map((q) => q.slug),
  });
}

fs.writeFileSync(OUT, JSON.stringify({
  source: 'https://roz.prontera.info',
  extracted_at: new Date().toISOString(),
  count: npcs.length,
  with_coords: npcs.filter((n) => n.map_navi_code && n.x != null && n.y != null).length,
  skipped_count: skipped.length,
  npcs,
  skipped,
}, null, 2), 'utf8');

console.log(`${npcs.length} npcs (${npcs.filter((n) => n.map_navi_code && n.x != null).length} with coords), ${skipped.length} skipped -> ${OUT}`);
