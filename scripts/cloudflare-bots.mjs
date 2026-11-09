// Cloudflare side of the bot protection plan
// (docs/superpowers/specs/2026-11-09-bot-protection-design.md).
//
//   node --env-file=.env.local scripts/cloudflare-bots.mjs            # show what would change
//   node --env-file=.env.local scripts/cloudflare-bots.mjs --apply    # change it
//
// Needs CLOUDFLARE_ZONE_ID, CLOUDFLARE_BOTS_TOKEN (token claude-roz-bots) and
// ORIGIN_KEY. No secret is written in this file: the repo is public.
//
// Every rule this script owns carries a ref starting with "roz_". On apply it
// replaces only those, so a rule someone adds in the dashboard survives.

const ZONE = process.env.CLOUDFLARE_ZONE_ID;
const TOKEN = process.env.CLOUDFLARE_BOTS_TOKEN;
const ORIGIN_KEY = process.env.ORIGIN_KEY;
const APPLY = process.argv.includes('--apply');

if (!ZONE || !TOKEN) {
  console.error('Missing CLOUDFLARE_ZONE_ID or CLOUDFLARE_BOTS_TOKEN (run with node --env-file=.env.local).');
  process.exit(1);
}

const API = `https://api.cloudflare.com/client/v4/zones/${ZONE}`;
const headers = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };

/** Rules per phase. Values that are secrets are filled from env at run time. */
function desiredRules() {
  const phases = {};

  // Step 1: stamp the origin key on every proxied request (lib/origin-guard.ts).
  if (ORIGIN_KEY) {
    phases.http_request_late_transform = [
      {
        ref: 'roz_origin_key',
        description: 'roz: origin key header (lib/origin-guard.ts)',
        expression: 'true',
        action: 'rewrite',
        action_parameters: { headers: { 'x-origin-key': { operation: 'set', value: ORIGIN_KEY } } },
      },
    ];
  } else {
    console.warn('ORIGIN_KEY not set: skipping the origin key transform rule.');
  }

  return phases;
}

/** Same rule with the secret hidden, for printing. */
function redact(rule) {
  return JSON.parse(JSON.stringify(rule).split(ORIGIN_KEY || '\u0000').join('<ORIGIN_KEY>'));
}

async function cf(path, init = {}) {
  const res = await fetch(API + path, { ...init, headers });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

const ours = (r) => typeof r.ref === 'string' && r.ref.startsWith('roz_');
const comparable = ({ ref, description, expression, action, action_parameters, enabled }) =>
  JSON.stringify({ ref, description, expression, action, action_parameters: action_parameters ?? null, enabled: enabled ?? true });

let failed = false;
for (const [phase, wanted] of Object.entries(desiredRules())) {
  const current = await cf(`/rulesets/phases/${phase}/entrypoint`);
  const existing = current.status === 200 ? current.body.result.rules ?? [] : [];
  if (current.status !== 200 && current.status !== 404) {
    console.error(`${phase}: read failed ${current.status} ${JSON.stringify(current.body.errors)}`);
    failed = true;
    continue;
  }
  const foreign = existing.filter((r) => !ours(r));
  const same =
    existing.filter(ours).map(comparable).join('\n') === wanted.map((r) => comparable({ enabled: true, ...r })).join('\n');

  console.log(`\n== ${phase}: ${same ? 'up to date' : 'will change'} (${foreign.length} rule(s) not ours kept)`);
  for (const r of wanted) console.log(JSON.stringify(redact(r), null, 2));
  if (same || !APPLY) continue;

  const strip = ({ id, version, last_updated, ...rest }) => rest;
  const rules = [...foreign.map(strip), ...wanted];
  const put = await cf(`/rulesets/phases/${phase}/entrypoint`, { method: 'PUT', body: JSON.stringify({ rules }) });
  if (put.status === 200 && put.body.success) console.log(`${phase}: applied`);
  else {
    console.error(`${phase}: apply failed ${put.status} ${JSON.stringify(put.body.errors)}`);
    failed = true;
  }
}

if (!APPLY) console.log('\nDry run. Add --apply to change Cloudflare.');
process.exitCode = failed ? 1 : 0;
