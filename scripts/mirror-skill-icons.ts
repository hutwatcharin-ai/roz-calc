// Mirrors skill icons out of data/raw/skills.json onto our own origin.
//
// Every icon path in the raw file points at rozerodb's /assets/local/catalog/,
// which 404s when served from our domain. Monster and item images were already
// mirrored the same way -- their raw paths read /images/monsters/1001.gif.
//
// Deliberately polite: one request at a time with a delay, and a skip for files
// already on disk so a re-run costs nothing. Re-runnable and resumable.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, basename } from 'node:path';

const SOURCE_ORIGIN = 'https://rozerodb.com';
const RAW_PATH = 'data/raw/skills.json';
const OUT_DIR = join('public', 'images', 'skills');
const PUBLIC_PREFIX = '/images/skills';
const DELAY_MS = 250;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const skills: any[] = JSON.parse(readFileSync(RAW_PATH, 'utf-8'));
  mkdirSync(OUT_DIR, { recursive: true });

  let downloaded = 0;
  let skipped = 0;
  const failed: string[] = [];

  for (const skill of skills) {
    const icon: string | undefined = skill.icon;
    if (!icon) continue;

    // Already rewritten by a previous run -- nothing to do.
    if (icon.startsWith(PUBLIC_PREFIX)) {
      skipped++;
      continue;
    }

    const file = basename(icon);
    const outPath = join(OUT_DIR, file);

    if (existsSync(outPath)) {
      skill.icon = `${PUBLIC_PREFIX}/${file}`;
      skipped++;
      continue;
    }

    try {
      const res = await fetch(`${SOURCE_ORIGIN}${icon}`);
      if (!res.ok) {
        failed.push(`${skill.slug}: HTTP ${res.status}`);
        await sleep(DELAY_MS);
        continue;
      }
      const buf = Buffer.from(await res.arrayBuffer());
      // A zero-byte or near-empty response is a failure that does not throw.
      // Writing it would produce a broken image that renders as an empty frame
      // with no error anywhere -- exactly the silent-failure mode that shipped
      // 65 blank covers on another project.
      if (buf.length < 64) {
        failed.push(`${skill.slug}: ${buf.length} bytes`);
        await sleep(DELAY_MS);
        continue;
      }
      writeFileSync(outPath, buf);
      skill.icon = `${PUBLIC_PREFIX}/${file}`;
      downloaded++;
    } catch (err) {
      failed.push(`${skill.slug}: ${(err as Error).message}`);
    }

    await sleep(DELAY_MS);
  }

  writeFileSync(RAW_PATH, JSON.stringify(skills, null, 2));

  console.log(`downloaded: ${downloaded}`);
  console.log(`skipped (already present): ${skipped}`);
  console.log(`failed: ${failed.length}`);
  for (const f of failed.slice(0, 20)) console.log(`  ${f}`);
  if (failed.length > 20) console.log(`  ... and ${failed.length - 20} more`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
