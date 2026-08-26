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

    const file = basename(icon);

    // An entry already rewritten to a local path does not guarantee the file
    // is still on disk -- someone may have deleted a bad download to force a
    // re-fetch. Reconstruct the original source path by swapping the local
    // prefix back for rozerodb's /assets/local/catalog/ prefix, so a missing
    // file behind a rewritten path still gets fetched below instead of being
    // silently skipped and left as a dead link.
    const sourcePath = icon.startsWith(PUBLIC_PREFIX)
      ? `/assets/local/catalog/${file}`
      : icon;
    const outPath = join(OUT_DIR, file);

    if (existsSync(outPath)) {
      skill.icon = `${PUBLIC_PREFIX}/${file}`;
      skipped++;
      continue;
    }

    try {
      const res = await fetch(`${SOURCE_ORIGIN}${sourcePath}`);
      if (!res.ok) {
        failed.push(`${skill.slug}: HTTP ${res.status}`);
        skill.icon = sourcePath;
        await sleep(DELAY_MS);
        continue;
      }
      const buf = Buffer.from(await res.arrayBuffer());
      // Two independent gates on the downloaded body. A failed download here
      // does not throw and does not set a non-2xx status -- it silently
      // produces a file that looks fine until someone opens the page. Neither
      // check alone catches everything: a rate-limit notice or soft-error
      // page can be well over 512 bytes of HTML, so a size floor is not
      // enough on its own.

      // A zero-byte or near-empty response is a failure that does not throw.
      // Writing it would produce a broken image that renders as an empty frame
      // with no error anywhere -- exactly the silent-failure mode that shipped
      // 65 blank covers on another project.
      if (buf.length < 64) {
        failed.push(`${skill.slug}: ${buf.length} bytes`);
        skill.icon = sourcePath;
        await sleep(DELAY_MS);
        continue;
      }
      // A WebP file starts with the ASCII "RIFF" tag at offset 0 and "WEBP"
      // at offset 8. An HTML interstitial, a rate-limit page, or any other
      // soft-error body fails this check even when the HTTP status was 200.
      const isWebp =
        buf.length >= 12 &&
        buf.toString('ascii', 0, 4) === 'RIFF' &&
        buf.toString('ascii', 8, 12) === 'WEBP';
      if (!isWebp) {
        const preview = buf.slice(0, 16).toString('hex');
        failed.push(`${skill.slug}: not a WebP file (${buf.length} bytes, starts with ${preview})`);
        skill.icon = sourcePath;
        await sleep(DELAY_MS);
        continue;
      }
      writeFileSync(outPath, buf);
      skill.icon = `${PUBLIC_PREFIX}/${file}`;
      downloaded++;
    } catch (err) {
      failed.push(`${skill.slug}: ${(err as Error).message}`);
      skill.icon = sourcePath;
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
