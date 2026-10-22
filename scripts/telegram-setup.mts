// Points @rozerothaibot at the site's webhook (app/api/telegram/route.ts) and
// sets the menu Telegram shows on "/" (COMMANDS in lib/telegram-bot.ts).
// Run once, after the site with the route is live, and again whenever
// COMMANDS changes:
//
//   npx tsx --env-file=.env.local scripts/telegram-setup.mts
//
// Needs TELEGRAM_BOT_TOKEN and TELEGRAM_WEBHOOK_SECRET in .env.local -- the
// same secret the site has in Coolify.
import { COMMANDS, SITE } from '../lib/telegram-bot';

const token = process.env.TELEGRAM_BOT_TOKEN;
const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
if (!token || !secret) throw new Error('TELEGRAM_BOT_TOKEN and TELEGRAM_WEBHOOK_SECRET must be in .env.local');

async function call(method: string, body: object) {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!json.ok) throw new Error(`${method}: ${json.description}`);
  console.log(`${method}: ok`);
}

await call('setWebhook', { url: `${SITE}/api/telegram`, secret_token: secret, allowed_updates: ['message'], drop_pending_updates: true });
await call('setMyCommands', { commands: COMMANDS });
const info = await (await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`)).json();
console.log(`webhook: ${info.result?.url} · pending ${info.result?.pending_update_count} · last error ${info.result?.last_error_message ?? 'none'}`);
