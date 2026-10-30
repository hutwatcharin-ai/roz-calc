// Starts a GitHub Actions workflow of this repository now.
//
//   node scripts/dispatch-workflow.mjs ad-mail-report.yml
//
// Run by a Coolify scheduled task on the production server (30 Oct 2026):
// GitHub's own schedule ran the banner report six hours late, while a
// dispatch starts within seconds. Needs GITHUB_DISPATCH_TOKEN (fine-grained,
// this repository only, Actions read and write), already set in Coolify for
// the Telegram /check command.

const REPO = 'hutwatcharin-ai/roz-calc';
const workflow = process.argv[2];
const token = process.env.GITHUB_DISPATCH_TOKEN;

if (!workflow || !/^[\w.-]+\.ya?ml$/.test(workflow)) {
  console.error('usage: node scripts/dispatch-workflow.mjs <workflow file>');
  process.exit(2);
}
if (!token) {
  console.error('GITHUB_DISPATCH_TOKEN is not set');
  process.exit(1);
}

const res = await fetch(`https://api.github.com/repos/${REPO}/actions/workflows/${workflow}/dispatches`, {
  method: 'POST',
  headers: { authorization: `Bearer ${token}`, accept: 'application/vnd.github+json', 'content-type': 'application/json' },
  body: JSON.stringify({ ref: 'master' }),
});
if (res.status !== 204) {
  console.error(`dispatch ${workflow} failed: HTTP ${res.status} ${(await res.text()).slice(0, 300)}`);
  process.exit(1);
}
console.log(`dispatched ${workflow}`);
