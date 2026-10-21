// Official announcements from the game's Discord, and player posts the owner
// forwards, kept for writing news
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
// a day. The owner gets a Telegram line per post, naming the monsters and
// maps it mentions (scripts/discord-match.mjs) and flagging maintenance and
// patch posts. <inbox>/state.json holds each channel's last message id and
// every post with whether it has been turned into site changes yet
// (scripts/discord-inbox.mts done); the 14:00 report counts the ones left.
//
// Runs hourly on GitHub Actions (.github/workflows/discord-news.yml), which
// keeps the inbox on its own branch, discord-inbox, so master never gets a
// commit it did not ask for. Read it locally with
//   git fetch origin discord-inbox && git worktree add ../roz-inbox discord-inbox
//
// Needs DISCORD_BOT_TOKEN and TELEGRAM_BOT_TOKEN; INBOX defaults to ./inbox.

import fs from 'node:fs';
import path from 'node:path';
import { findNames, isUrgent } from './discord-match.mjs';

// Two channels in ROZ ข่าว: #ข่าวทางการ gets the followed official posts;
// #ส่งต่อ gets player posts the owner forwards by hand from the official
// server's forums, which Discord does not let anyone follow. Player posts are
// claims, never confirmed facts, and are kept and labelled apart.
const CHANNELS = [
  { id: '1562409676228792371', kind: 'official' }, // #ข่าวทางการ
  { id: '1562420024122277888', kind: 'player' }, // #ส่งต่อ
];
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
const state = fs.existsSync(statePath) ? JSON.parse(fs.readFileSync(statePath, 'utf8')) : {};
// state.last was the one channel's cursor before #ส่งต่อ existed.
state.cursor ??= { [CHANNELS[0].id]: state.last ?? null };
delete state.last;
state.posts ??= []; // { id, file, title, kind, urgent, at, done }
// Posts saved before state.posts existed (the first two, 21 Oct 2026).
if (!state.posts.length && fs.existsSync(path.join(INBOX, 'posts'))) {
  for (const f of fs.readdirSync(path.join(INBOX, 'posts')).sort()) {
    const title = fs.readFileSync(path.join(INBOX, 'posts', f), 'utf8').split('\n')[0].replace(/^# /, '');
    const id = f.replace(/\.md$/, '').split('-').pop();
    state.posts.push({ id, file: `posts/${f}`, title, kind: 'official', urgent: isUrgent(title), at: f.slice(0, 10), done: false });
  }
}
const namesPath = path.join(INBOX, 'names.json');
const NAMES = fs.existsSync(namesPath) ? JSON.parse(fs.readFileSync(namesPath, 'utf8')).names : [];

fs.mkdirSync(path.join(INBOX, 'posts'), { recursive: true });
fs.mkdirSync(path.join(INBOX, 'img'), { recursive: true });

let read = 0;
let saved = 0;
for (const ch of CHANNELS) {
  const after = state.cursor[ch.id];
  // Newest first from the API; read up to 100 since the last one, oldest first.
  const batch = await discord(`/channels/${ch.id}/messages?limit=100${after ? `&after=${after}` : ''}`);
  const msgs = batch.sort((a, b) => (BigInt(a.id) < BigInt(b.id) ? -1 : 1));
  read += msgs.length;
  for (const m of msgs) {
    state.cursor[ch.id] = m.id;
    if (m.type !== 0) continue; // 12 = "followed a channel" notices
    // A forward carries the original in message_snapshots; what the owner
    // typed alongside it, if anything, stays in m.content.
    const src = m.message_snapshots?.[0]?.message ?? m;
    const source = ch.kind === 'official' ? channelOf(m) : 'ผู้เล่นส่งต่อ';
    const day = new Date(Date.parse(m.timestamp) + 7 * 3600e3).toISOString().slice(0, 10);

    const pics = [
      ...(src.attachments ?? []).filter((a) => (a.content_type ?? '').startsWith('image/')).map((a) => a.url),
      ...(src.embeds ?? []).flatMap((e) => [e.image?.url, e.thumbnail?.url]).filter(Boolean),
    ];
    const files = [];
    for (const [i, url] of pics.entries()) {
      const ext = (new URL(url).pathname.match(/\.(png|jpe?g|gif|webp)$/i)?.[1] ?? 'png').toLowerCase();
      const file = `img/${m.id}-${i + 1}.${ext}`;
      if (await download(url, path.join(INBOX, file))) files.push(file);
    }

    const embeds = src.embeds ?? [];
    const firstLine = (src.content ?? '').split('\n').find((l) => l.trim() && !/^\|*@everyone\|*$/.test(l.trim())) ?? '';
    const title = untime(embeds.find((e) => e.title)?.title ?? firstLine).slice(0, 200) || '(ไม่มีหัวข้อ)';
    const text = [
      untime(src.content),
      ...embeds.flatMap((e) => [
        e.title && untime(e.title) !== title ? `## ${untime(e.title)}` : '',
        untime(e.description),
        ...(e.fields ?? []).map((f) => `**${untime(f.name)}**\n${untime(f.value)}`),
      ]),
    ]
      .filter(Boolean)
      .join('\n\n');
    const note = m.message_snapshots && m.content ? `> หมายเหตุจากเจ้าของเว็บ: ${m.content}` : '';
    const file = `posts/${day}-${m.id}.md`;
    const body = [
      `# ${title}`,
      `- kind: ${ch.kind === 'official' ? 'official' : 'player (unconfirmed)'}\n- channel: ${source}\n- posted: ${thaiTime(Date.parse(m.timestamp) / 1000)}\n- message: ${m.id}`,
      note,
      text,
      ...files.map((f) => `![](../${f})`),
    ]
      .filter(Boolean)
      .join('\n\n');
    fs.writeFileSync(path.join(INBOX, file), body + '\n');

    const urgent = ch.kind === 'official' && isUrgent(title);
    state.posts.push({ id: m.id, file, title, kind: ch.kind, urgent, at: m.timestamp, done: false });
    saved++;

    const touched = findNames(`${title}\n${text}`, NAMES);
    const lines = [
      ch.kind === 'official'
        ? `${urgent ? '🔴 <b>ด่วน</b> ' : '📢 '}<b>ประกาศใหม่</b> (#${esc(source)})`
        : '📨 <b>โพสต์ผู้เล่นที่ส่งต่อมา</b> (ยังไม่ยืนยัน)',
      esc(title),
    ];
    if (touched.length) {
      lines.push('', 'เกี่ยวกับ: ' + touched.map((n) => `<a href="https://rozerothai.com${n.href}">${esc(n.name)}</a>`).join(' · '));
    }
    lines.push('', 'พิมพ์บอก Claude ว่า "ทำข่าว" เมื่อพร้อม');
    await telegram(lines.join('\n'));
  }
}

fs.writeFileSync(statePath, JSON.stringify(state, null, 2) + '\n');
console.log(`${read} messages read, ${saved} posts saved, ${state.posts.filter((p) => !p.done).length} not done`);
