// Official announcements from the game's Discord, kept for writing news
// pages (owner, 21 Oct 2026). The owner's own server "ROZ ข่าว" follows the
// official announcement channels (announcement, server-news, game-event,
// kafra-shop-promotions, redeem-rewards) into one channel, #ข่าวทางการ;
// Discord's Follow copies every new post there. Our bot, ROZ Reader, sits in
// that server with View Channels and Read Message History only, and this
// script reads the channel through the REST API -- no gateway connection, no
// user account, nothing in the official server.
//
//   node scripts/discord-news.mjs [--dry]
//
// Each new post becomes <inbox>/posts/<date>-<id>.md (the text as posted,
// Discord timestamps written out in Thailand time) plus its pictures under
// <inbox>/img/, downloaded at once because Discord's CDN links expire within
// a day. The owner gets a Telegram line per post. <inbox>/state.json holds
// the last message id read.
//
// Runs every 3 hours on GitHub Actions (.github/workflows/discord-news.yml), which
// keeps the inbox on its own branch, discord-inbox, so master never gets a
// commit it did not ask for. Read it locally with
//   git fetch origin discord-inbox && git worktree add ../roz-inbox discord-inbox
//
// Needs DISCORD_BOT_TOKEN and TELEGRAM_BOT_TOKEN; INBOX defaults to ./inbox.

import fs from 'node:fs';
import path from 'node:path';

const CHANNEL = '1562409676228792371'; // ROZ ข่าว #ข่าวทางการ
const INBOX = process.env.INBOX || 'inbox';
const DRY = process.argv.includes('--dry');
const CHAT = process.env.TELEGRAM_CHAT_ID || '6242848323';
const TOKEN = process.env.DISCORD_BOT_TOKEN;
if (!TOKEN) throw new Error('DISCORD_BOT_TOKEN is not set');

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const TH_MONTH = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
/** "22 ต.ค. 2569 14:00 น." for a unix time, in Thailand time. */
function thaiTime(unix) {
  const d = new Date(unix * 1000 + 7 * 3600e3);
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  return `${d.getUTCDate()} ${TH_MONTH[d.getUTCMonth()]} ${d.getUTCFullYear() + 543} ${hh}:${mm} น.`;
}
/** Discord's <t:1792630800:D> markers, which only a Discord client renders. */
const untime = (s) => String(s ?? '').replace(/<t:(\d+)(?::\w)?>/g, (_, t) => thaiTime(Number(t)));

async function discord(p) {
  const res = await fetch(`https://discord.com/api/v10${p}`, { headers: { Authorization: `Bot ${TOKEN}` } });
  if (!res.ok) throw new Error(`Discord ${p}: ${res.status} ${await res.text()}`);
  return res.json();
}

async function telegram(text) {
  if (DRY || !process.env.TELEGRAM_BOT_TOKEN) {
    console.log(text);
    return;
  }
  const res = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: CHAT, text, parse_mode: 'HTML', disable_web_page_preview: true }),
  });
  const body = await res.json();
  if (!body.ok) throw new Error(`Telegram: ${body.description}`);
}

async function download(url, file) {
  const res = await fetch(url);
  if (!res.ok) return false;
  fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  return true;
}

// Followed posts arrive as webhook messages named "Ragnarok Zero: Global
// #📢announcement"; the part after '#' says which channel.
const channelOf = (m) => (m.author?.username ?? '').split('#').pop().replace(/^[^\p{L}\p{N}]+/u, '') || 'unknown';

const statePath = path.join(INBOX, 'state.json');
const state = fs.existsSync(statePath) ? JSON.parse(fs.readFileSync(statePath, 'utf8')) : { last: null };

// Newest first from the API; read up to 100 since the last one, oldest first.
const batch = await discord(`/channels/${CHANNEL}/messages?limit=100${state.last ? `&after=${state.last}` : ''}`);
const msgs = batch.sort((a, b) => (BigInt(a.id) < BigInt(b.id) ? -1 : 1));

fs.mkdirSync(path.join(INBOX, 'posts'), { recursive: true });
fs.mkdirSync(path.join(INBOX, 'img'), { recursive: true });

let saved = 0;
for (const m of msgs) {
  state.last = m.id;
  if (m.type !== 0) continue; // 12 = "followed a channel" notices
  const channel = channelOf(m);
  const day = new Date(Date.parse(m.timestamp) + 7 * 3600e3).toISOString().slice(0, 10);

  const pics = [
    ...m.attachments.filter((a) => (a.content_type ?? '').startsWith('image/')).map((a) => a.url),
    ...m.embeds.flatMap((e) => [e.image?.url, e.thumbnail?.url]).filter(Boolean),
  ];
  const files = [];
  for (const [i, url] of pics.entries()) {
    const ext = (new URL(url).pathname.match(/\.(png|jpe?g|gif|webp)$/i)?.[1] ?? 'png').toLowerCase();
    const file = `img/${m.id}-${i + 1}.${ext}`;
    if (await download(url, path.join(INBOX, file))) files.push(file);
  }

  const title = m.embeds.find((e) => e.title)?.title ?? m.content.split('\n')[0] ?? '';
  const body = [
    `# ${untime(title)}`,
    `- channel: ${channel}\n- posted: ${thaiTime(Date.parse(m.timestamp) / 1000)}\n- message: ${m.id}`,
    untime(m.content),
    ...m.embeds.flatMap((e) => [
      e.title && e.title !== title ? `## ${untime(e.title)}` : '',
      untime(e.description),
      ...(e.fields ?? []).map((f) => `**${untime(f.name)}**\n${untime(f.value)}`),
    ]),
    ...files.map((f) => `![](../${f})`),
  ]
    .filter((x) => x !== '')
    .join('\n\n');
  fs.writeFileSync(path.join(INBOX, 'posts', `${day}-${m.id}.md`), body + '\n');
  saved++;

  await telegram(`📢 <b>ประกาศใหม่</b> (#${esc(channel)})\n${esc(untime(title))}`);
}

fs.writeFileSync(statePath, JSON.stringify(state, null, 2) + '\n');
console.log(`${msgs.length} messages read, ${saved} posts saved`);
