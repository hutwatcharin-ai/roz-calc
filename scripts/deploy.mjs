// One command for the whole deploy: push check -> Coolify -> wait for the
// change to reach the origin -> purge the CDN -> tell Telegram what shipped.
//
// Every step here exists because it went wrong at least once:
//   - a failed push then a deploy that rebuilt the old commit (twice)
//   - Coolify reporting "running" long after the container had swapped, and
//     "in_progress" long after it had not, so its status is not the signal
//   - Cloudflare serving the old HTML for 24h because a redeploy does not
//     bust its cache
//   - a "deployed!" message in Telegram that said nothing about what changed,
//     which is what prompted this script
//
// Run:  node scripts/deploy.mjs --path /database/maps --expect 379
//       node scripts/deploy.mjs --path /tools/x --status 308
//       node scripts/deploy.mjs            (no check: waits, then says so)
//
// Needs in .env.local: COOLIFY_TOKEN, CLOUDFLARE_ZONE_ID, CLOUDFLARE_API_TOKEN,
// TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID. Anything missing degrades to a
// skipped step with a line saying so -- never a silent pass.

import { execFileSync, execSync } from 'node:child_process';
import fs from 'node:fs';

const COOLIFY_HOST = 'http://207.148.123.125:8000';
const APP_UUID = 'x130k1pxl928ne421jk9i5ic';
const ORIGIN_IP = '207.148.123.125';
const SITE = 'rozerothai.com';
const POLL_SECONDS = 20;
const MAX_WAIT_MINUTES = 20;

function loadEnv() {
  // .env.local is the one place these live; this script is run by hand, not by
  // Next, so nothing has loaded it yet.
  try {
    for (const line of fs.readFileSync('.env.local', 'utf8').split('\n')) {
      const match = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
      // Quotes are shell syntax, not part of the value. COOLIFY_TOKEN is
      // quoted in .env.local because it contains a pipe, and passing the
      // quotes through to the Authorization header returned 401 on the first
      // real run of this script.
      if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
    }
  } catch {
    // No file: every step below reports its own missing credential.
  }
}

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : null;
}

/**
 * Git Bash rewrites a leading slash into a Windows path, so --path
 * /database/maps arrives as C:/Program Files/Git/database/maps. Recover the
 * site path rather than requesting a URL that cannot exist.
 */
function sitePath(raw) {
  if (!raw) return null;
  const stripped = raw.replace(new RegExp('^[A-Za-z]:[\\/](?:Program Files[\\/]Git)?', 'i'), '');
  const withSlash = stripped.startsWith('/') ? stripped : '/' + stripped;
  return withSlash.split(String.fromCharCode(92)).join('/');
}

function sh(command) {
  return execSync(command, { encoding: 'utf8' }).trim();
}

/** Hits the origin directly, past Cloudflare, so a cached page cannot fake a pass. */
function fetchOrigin(path, { headOnly = false } = {}) {
  const args = [
    '-s',
    '-m',
    '25',
    '-k',
    '--resolve',
    `${SITE}:443:${ORIGIN_IP}`,
    ...(headOnly ? ['-o', '/dev/null', '-w', '%{http_code}'] : []),
    `https://${SITE}${path}`,
  ];
  try {
    return execFileSync('curl', args, { encoding: 'utf8' });
  } catch {
    return '';
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** The Telegram message. Shared by the real run and --dry-run so what you preview is what gets sent. */
function previewOnly({ shortSha, subject, filesChanged, path, verified, purged, minutes }) {
  return [
    `🚀 <b>RO Zero Thai</b> deploy`,
    `<code>${shortSha}</code> ${subject}`,
    `${filesChanged} ไฟล์ · ${minutes} นาที`,
    verified === true
      ? `✅ ขึ้น origin แล้ว${purged ? ' · purge CDN แล้ว' : ' · ⚠️ purge ไม่สำเร็จ'}`
      : verified === false
        ? `⚠️ รอ ${MAX_WAIT_MINUTES} นาทีแล้วยังไม่เห็นของใหม่ที่ origin`
        : `ℹ️ ไม่ได้ตรวจหน้าเว็บ (สั่ง deploy เฉย ๆ)`,
    path ? `🔗 https://${SITE}${path}` : `🔗 https://${SITE}`,
  ].join(String.fromCharCode(10));
}

async function main() {
  loadEnv();
  const path = sitePath(arg('path'));
  const expect = arg('expect');
  const status = arg('status');
  const started = Date.now();

  // 1. The push must have landed. A deploy on an unpushed commit builds the
  // previous one and looks like a success.
  const local = sh('git rev-parse HEAD');
  const remote = sh('git rev-parse origin/master');
  if (local !== remote) {
    console.error('local HEAD and origin/master differ -- push first, then deploy');
    process.exit(1);
  }
  const subject = sh('git log -1 --format=%s');
  const shortSha = local.slice(0, 7);
  const filesChanged = sh('git diff --name-only HEAD~1 HEAD').split('\n').filter(Boolean).length;

  // 2. Trigger -- unless asked only to show what would be sent. Added after
  // running this file to "preview" the message fired a real deploy: an
  // unrecognised flag fell straight through to the trigger.
  if (process.argv.includes('--dry-run')) {
    console.log(`would deploy ${shortSha} "${subject}" (${filesChanged} files)`);
    console.log(previewOnly({ shortSha, subject, filesChanged, path, verified: null, purged: false, minutes: 0 }));
    return;
  }
  const coolifyToken = process.env.COOLIFY_TOKEN;
  if (!coolifyToken) {
    console.error('COOLIFY_TOKEN missing from .env.local');
    process.exit(1);
  }
  const trigger = await fetch(`${COOLIFY_HOST}/api/v1/deploy?uuid=${APP_UUID}&force=true`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${coolifyToken}` },
  });
  if (!trigger.ok) {
    console.error(`deploy trigger failed: HTTP ${trigger.status}`);
    process.exit(1);
  }
  console.log(`triggered ${shortSha} "${subject}"`);

  // 3. Wait for the change itself, not for Coolify's opinion of it.
  let verified = null;
  if (path && (expect || status)) {
    const deadline = Date.now() + MAX_WAIT_MINUTES * 60_000;
    while (Date.now() < deadline) {
      const hit = status
        ? fetchOrigin(path, { headOnly: true }).trim() === status
        : fetchOrigin(path).includes(expect);
      if (hit) {
        verified = true;
        break;
      }
      process.stdout.write('.');
      await sleep(POLL_SECONDS * 1000);
    }
    if (verified === null) verified = false;
    console.log(verified ? '\norigin serves the new build' : '\ngave up waiting for the origin');
  } else {
    console.log('no --path/--expect given: not verifying, and the message will say so');
  }

  // 4. Purge, but only once the origin has it -- purging early pulls the old
  // page back into the CDN.
  let purged = false;
  if (verified === true) {
    try {
      execSync('npm run purge --silent', { stdio: 'inherit' });
      purged = true;
    } catch {
      console.error('purge failed -- the CDN may still serve the old page');
    }
  }

  // 5. Say what shipped.
  const minutes = Math.round((Date.now() - started) / 60_000);
  const text = previewOnly({ shortSha, subject, filesChanged, path, verified, purged, minutes });

  const token = process.env.TELEGRAM_BOT_TOKEN;
  // The chat is the same one Coolify's own notifications go to (set up 3 Sep,
  // bot @kidkrob_bot). A chat id is not a secret, so it has a default; the
  // token is, and lives only in .env.local.
  const chat = process.env.TELEGRAM_CHAT_ID ?? '6242848323';
  if (!token || !chat) {
    console.log('\n--- Telegram not configured, message would have been ---\n' + text);
    return;
  }
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chat, text, parse_mode: 'HTML', disable_web_page_preview: true }),
  });
  // Telegram answers 200 with ok:false for a bad chat id, so the status code
  // alone is not the check.
  const body = await res.json().catch(() => ({}));
  console.log(body?.ok ? 'told Telegram' : `Telegram refused: ${JSON.stringify(body).slice(0, 200)}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
