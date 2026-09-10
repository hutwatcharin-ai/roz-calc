// One command for the whole deploy: push check -> Coolify -> wait for the
// change to reach the origin -> purge the CDN -> tell Telegram what shipped.
//
// Every step here exists because it went wrong at least once:
//   - a failed push then a deploy that rebuilt the old commit (twice)
//   - Coolify reporting "running" long after the container had swapped, and
//     "in_progress" long after it had not, so its status is not the signal
//   - --expect strings that were already on the page before the deploy, so
//     the check passed against the OLD build and the deploy was reported as
//     live while Coolify was still building. Three times on 8 Sep 2026, once
//     with a marker that came from a database change (visible on every
//     build) and twice with a marker the previous build already had. The
//     signal is now Next's own per-build id, which cannot be present before
//     the build that made it exists; --expect is checked afterwards, and a
//     marker already on the page is refused outright rather than trusted
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
const APP_NAME = 'roz-calc';
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

/**
 * Next stamps a fresh random build id into every page of every build. It is
 * the one thing on the page that is guaranteed to differ between the build
 * that is running now and the build this deploy is about to make -- unlike
 * any string we choose ourselves, which may already be there.
 */
function buildIdAt(path) {
  const match = /buildId\\?"\s*:\s*\\?"([A-Za-z0-9_-]+)/.exec(fetchOrigin(path));
  return match ? match[1] : null;
}

/**
 * The deployment Coolify is running for this app, from its own records.
 *
 * Without this the script only knew "the build id on the page changed", and a
 * build someone else's push had already started satisfies that. On 10 Sep 2026
 * two deploys overlapped: the second reported success off the first one's
 * build, and only the --expect check caught that the change was not there.
 * The commit in this record is the thing to wait for.
 */
async function coolify(path, token) {
  try {
    const response = await fetch(`${COOLIFY_HOST}${path}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

/**
 * The deployment record, by its own uuid when the trigger gave us one and by
 * the running list otherwise. The list only carries deployments that have not
 * finished, so a finished build disappears from it -- which is why the uuid
 * path is the one to use whenever it exists.
 */
async function deploymentState(token, uuid) {
  if (uuid) {
    const row = await coolify(`/api/v1/deployments/${uuid}`, token);
    if (row && row.status) return { status: row.status, commit: row.commit, uuid };
  }
  const rows = await coolify('/api/v1/deployments', token);
  const mine = (Array.isArray(rows) ? rows : []).filter((row) => row.application_name === APP_NAME);
  const row = mine[0];
  return row ? { status: row.status, commit: row.commit, uuid: row.deployment_uuid } : null;
}

/**
 * The page as a string to search for --expect.
 *
 * React puts an HTML comment between static text and every value it
 * interpolates, so `เพดานเลเวลคือ {CAP}` reaches the browser as
 * `เพดานเลเวลคือ <!-- -->60`. A marker written the way it reads on screen then
 * fails against the raw HTML -- which is how a correct deploy on 9 Sep 2026
 * reported itself unverified and skipped the CDN purge, leaving the old page
 * being served while the new one sat on the origin. Comments are stripped
 * before the check so a marker may span an interpolation.
 */
function pageText(path) {
  return fetchOrigin(path).split('<!-- -->').join('');
}

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

  // Read the running build BEFORE triggering, so there is something to
  // compare against. A marker already on the page proves nothing about the
  // build that has not been made yet, so it is refused here rather than
  // quietly passing in twenty seconds' time.
  const buildIdBefore = path ? buildIdAt(path) : null;
  if (path && expect && pageText(path).includes(expect)) {
    console.error(
      `--expect "${expect}" is already on ${path} before this deploy.\n` +
        'It cannot tell the new build from the old one. Pick a string that only the new build has.',
    );
    process.exit(1);
  }
  if (path && !buildIdBefore) {
    console.error(`could not read the current build id from ${path} -- is the origin up?`);
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
  // Coolify answers with the deployment it queued. Holding on to that uuid is
  // what makes the wait below about THIS build rather than about whatever
  // build happens to finish next.
  let deploymentUuid = null;
  try {
    const body = await trigger.json();
    deploymentUuid = body?.deployments?.[0]?.deployment_uuid ?? null;
  } catch {
    deploymentUuid = null;
  }
  console.log(`triggered ${shortSha} "${subject}"${deploymentUuid ? ` (${deploymentUuid})` : ''}`);

  // 3a. Wait for Coolify to finish building THIS commit. A build id that
  // merely differs is not proof: another push's build finishing looks exactly
  // the same from outside.
  {
    const deadline = Date.now() + MAX_WAIT_MINUTES * 60_000;
    let seen = null;
    while (Date.now() < deadline) {
      const row = await deploymentState(coolifyToken, deploymentUuid);
      // A record for a different commit is someone else's build: keep waiting
      // rather than counting it.
      if (row && (!row.commit || row.commit === local)) {
        seen = row.status;
        if (row.status === 'finished') break;
        if (row.status === 'failed' || row.status === 'cancelled') {
          console.log(`\nCoolify reports the build ${row.status} for ${shortSha}`);
          console.log('the CDN was NOT purged.');
          process.exit(1);
        }
      }
      process.stdout.write(seen === null ? '?' : '.');
      await sleep(POLL_SECONDS * 1000);
    }
    if (seen !== 'finished') {
      console.log(`\nCoolify never reported a finished build for ${shortSha} (last status: ${seen ?? 'no record'})`);
      console.log('the CDN was NOT purged.');
      process.exit(1);
    }
    console.log(`\nCoolify built ${shortSha}`);
  }

  // 3b. Wait for a NEW build to be serving, not for Coolify's opinion of it
  // and not for a string that may predate it. Two separate questions, asked
  // in order: did a new build ship, and does it contain the change.
  let verified = null;
  if (path) {
    const deadline = Date.now() + MAX_WAIT_MINUTES * 60_000;
    let shipped = false;
    while (Date.now() < deadline) {
      const now = status ? fetchOrigin(path, { headOnly: true }).trim() : buildIdAt(path);
      // A --status check is about a redirect, which has no page and so no
      // build id; there the status code itself is the signal.
      if (status ? now === status : now && now !== buildIdBefore) {
        shipped = true;
        break;
      }
      process.stdout.write('.');
      await sleep(POLL_SECONDS * 1000);
    }
    if (!shipped) {
      verified = false;
      console.log(`\ngave up waiting: the origin is still serving build ${buildIdBefore}`);
    } else if (expect && !pageText(path).includes(expect)) {
      verified = false;
      console.log(`\na new build is live but ${path} does not contain "${expect}"`);
      // The build shipped; only the assertion failed. Say what that leaves
      // behind, because the CDN is still serving the old page and the next
      // step is a person's judgement: twice on 9 Sep 2026 the marker was the
      // thing that was wrong (one spanned an interpolation, one was text that
      // only renders for some inputs) while the deploy itself was fine.
      console.log('the CDN was NOT purged. check the marker first -- interpolated? only rendered for some inputs?');
      console.log('then run: npm run purge');
    } else {
      verified = true;
      console.log('\norigin serves the new build');
    }
  } else {
    console.log('no --path given: not verifying, and the message will say so');
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
