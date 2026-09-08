// The (Bound) costumes came back from the 31 Aug backup with their old
// icon_url, but their icon FILES had been swept in the same clean-up: 655
// rows pointed at a file that no longer exists, which renders as a broken
// image on every surface at once.
//
// A Bound costume is the same art as its normal twin -- "[Costume] Poring
// Mascot (Bound)" and "[Costume] Poring Mascot" are one picture -- so 418 of
// them get a copy of the twin's file. The remaining 237 have no twin, and
// their icon_url is set to null rather than left pointing at nothing:
// ItemIcon already falls back to the name abbreviation, which is honest,
// while a broken image is not.
//
// Run:  set -a; . ./.env.local; set +a; node scripts/fix-bound-icons.mjs [--dry-run]

import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const dryRun = process.argv.includes('--dry-run');
const PUBLIC = path.join(process.cwd(), 'public');
const stripBound = (name) => name.replace(/\s*[([]Bound[)\]]\s*$/i, '').trim();

async function allItems(db) {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from('items').select('id, name_en, icon_url').order('id').range(from, from + 999);
    if (error) throw error;
    rows.push(...(data ?? []));
    if ((data ?? []).length < 1000) break;
  }
  return rows;
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('export NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first');
  const db = createClient(url, key);

  const rows = await allItems(db);
  const onDisk = (u) => Boolean(u) && fs.existsSync(path.join(PUBLIC, u));
  const byName = new Map();
  for (const r of rows) if (onDisk(r.icon_url) && !byName.has(r.name_en)) byName.set(r.name_en, r);

  const broken = rows.filter((r) => r.icon_url && !onDisk(r.icon_url));
  let copied = 0;
  let cleared = 0;
  for (const r of broken) {
    const twin = byName.get(stripBound(r.name_en));
    if (twin) {
      const ext = twin.icon_url.split('.').pop();
      const dest = `/images/items/${r.id}.${ext}`;
      if (!dryRun) {
        fs.copyFileSync(path.join(PUBLIC, twin.icon_url), path.join(PUBLIC, dest));
        const { error } = await db.from('items').update({ icon_url: dest }).eq('id', r.id);
        if (error) throw error;
      }
      copied += 1;
    } else {
      if (!dryRun) {
        const { error } = await db.from('items').update({ icon_url: null }).eq('id', r.id);
        if (error) throw error;
      }
      cleared += 1;
    }
  }
  console.log(`${broken.length} rows pointed at a missing file: ${copied} took the twin's icon, ${cleared} set to null`);
  if (dryRun) console.log('dry run: nothing written');
}

main().catch((e) => { console.error(e); process.exit(1); });
