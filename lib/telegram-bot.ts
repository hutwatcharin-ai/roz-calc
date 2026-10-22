// The commands @rozerothaibot answers (owner, 22 Oct 2026): what the owner
// would otherwise open GA4, Search Console, Discord or the site for, asked
// from the phone. app/api/telegram/route.ts receives Telegram's webhook and
// passes the text here; everything that reaches outside comes in as `deps`,
// so the replies are tested without a network (lib/telegram-bot.test.ts).
//
// Replies are Telegram HTML. The command list is also the menu Telegram
// shows on "/" -- scripts/telegram-setup.mjs sends COMMANDS as is.

import { NEWS, daysLeft, isLive } from './news';

export const SITE = 'https://rozerothai.com';
const GUILD = '1562409530212614216';
// scripts/discord-news.mjs reads these two channels of the owner's server.
const CHANNEL = { official: '1562409676228792371', player: '1562420024122277888' } as const;

export const COMMANDS: { command: string; description: string }[] = [
  { command: 'news', description: 'ประกาศ Discord ทางการ 5 อันล่าสุด' },
  { command: 'inbox', description: 'ประกาศที่ยังไม่ได้ทำข่าวบนเว็บ' },
  { command: 'check', description: 'ดึงข่าวจาก Discord เดี๋ยวนี้' },
  { command: 'today', description: 'คนเข้าเว็บวันนี้ เมื่อวาน และตอนนี้' },
  { command: 'week', description: 'Google Search 7 วันล่าสุด' },
  { command: 'up', description: 'เช็กว่าเว็บเปิดได้' },
  { command: 'events', description: 'กิจกรรมที่ยังไม่จบ เหลือกี่วัน' },
  { command: 'find', description: 'ค้นมอน ไอเทม แมพ เช่น /find poring' },
  { command: 'help', description: 'คำสั่งทั้งหมด' },
];

export interface InboxPost {
  id: string;
  title: string;
  kind: 'official' | 'player';
  urgent: boolean;
  at: string;
  done: boolean;
}

export interface Visitors {
  /** activeUsers in the last 30 minutes. */
  live: number;
  today: { users: number; views: number };
  yesterday: { users: number; views: number };
}

export interface SearchWeek {
  start: string;
  end: string;
  clicks: number;
  impressions: number;
  position: number;
  prevClicks: number | null;
  top: { query: string; clicks: number; position: number }[];
}

export interface Found {
  kind: 'monster' | 'item' | 'map';
  name: string;
  href: string;
}

export interface BotDeps {
  now: number;
  inbox(): Promise<InboxPost[]>;
  /** Starts the discord-news workflow. */
  dispatch(): Promise<void>;
  visitors(): Promise<Visitors>;
  searchWeek(): Promise<SearchWeek>;
  status(): Promise<{ path: string; status: number | string }[]>;
  find(query: string): Promise<Found[]>;
}

export const esc = (s: unknown) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const fmt = (n: number) => Math.round(n).toLocaleString('en-US');
const MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
/** "21 ต.ค." in Thailand time; state.json holds ISO times or bare dates. */
function thaiDay(at: string): string {
  const t = Date.parse(at.length === 10 ? `${at}T12:00:00+07:00` : at);
  if (Number.isNaN(t)) return at;
  const d = new Date(t + 7 * 3600e3);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}
function pct(now: number, before: number | null | undefined): string {
  if (!before) return '';
  const p = ((now - before) / before) * 100;
  return ` (${p >= 0 ? '+' : ''}${p.toFixed(0)}%)`;
}
const postLine = (p: InboxPost) =>
  `• ${p.urgent ? '🔴 ' : ''}<a href="https://discord.com/channels/${GUILD}/${CHANNEL[p.kind]}/${p.id}">${esc(p.title)}</a> · ${thaiDay(p.at)}${p.kind === 'player' ? ' · ผู้เล่นส่งต่อ' : ''}`;

/** "/find@rozerothaibot poring" -> { cmd: 'find', arg: 'poring' }. */
export function parseCommand(text: string): { cmd: string; arg: string } | null {
  const m = /^\/([a-z]+)(?:@\w+)?(?:\s+([\s\S]*))?$/i.exec(text.trim());
  return m ? { cmd: m[1].toLowerCase(), arg: (m[2] ?? '').trim() } : null;
}

const HELP = ['<b>คำสั่งของบอท</b>', ...COMMANDS.map((c) => `/${c.command} — ${esc(c.description)}`)].join('\n');

export async function reply(text: string, deps: BotDeps): Promise<string> {
  const parsed = parseCommand(text);
  if (!parsed) return `พิมพ์ / เพื่อดูคำสั่ง หรือ /help`;
  const { cmd, arg } = parsed;
  try {
    switch (cmd) {
      case 'start':
      case 'help':
        return HELP;

      case 'news': {
        const posts = (await deps.inbox()).filter((p) => p.kind === 'official');
        const last = posts.sort((a, b) => Date.parse(b.at) - Date.parse(a.at)).slice(0, 5);
        if (!last.length) return 'ยังไม่มีประกาศ';
        return ['📢 <b>ประกาศ Discord ล่าสุด</b>', ...last.map((p) => postLine(p) + (p.done ? ' ✅' : ''))].join('\n');
      }

      case 'inbox': {
        const left = (await deps.inbox()).filter((p) => !p.done);
        if (!left.length) return '📥 ไม่มีประกาศค้าง ✅';
        const urgent = left.filter((p) => p.urgent).length;
        return [
          `📥 <b>ค้าง ${left.length} อัน</b>${urgent ? ` (🔴 ด่วน ${urgent})` : ''}`,
          ...left.map(postLine),
          'พิมพ์บอก Claude ว่า "ทำข่าว"',
        ].join('\n');
      }

      case 'check':
        await deps.dispatch();
        return '🔄 สั่งดึงข่าวจาก Discord แล้ว ผลจะเด้งมาในอีก 1-2 นาที';

      case 'today': {
        const v = await deps.visitors();
        return [
          '📊 <b>คนเข้าเว็บ</b>',
          `ตอนนี้ (30 นาทีล่าสุด): <b>${fmt(v.live)}</b> คน`,
          `วันนี้: ${fmt(v.today.users)} คน · ${fmt(v.today.views)} หน้า`,
          `เมื่อวาน: ${fmt(v.yesterday.users)} คน · ${fmt(v.yesterday.views)} หน้า`,
          '<i>ตัวเลขวันนี้ยังไม่ครบ Google ตามเก็บย้อนหลังได้ครึ่งวัน</i>',
        ].join('\n');
      }

      case 'week': {
        const w = await deps.searchWeek();
        return [
          `🔎 <b>Google Search</b> · ${w.start} ถึง ${w.end}`,
          `คลิก <b>${fmt(w.clicks)}</b>${pct(w.clicks, w.prevClicks)} · เห็นในผลค้น ${fmt(w.impressions)} · อันดับเฉลี่ย ${w.position.toFixed(1)}`,
          '<i>Search Console ช้า 2-3 วัน</i>',
          '',
          '<b>คำค้นที่ได้คลิกเยอะสุด</b>',
          ...(w.top.length ? w.top.map((r) => `• ${esc(r.query)} — ${fmt(r.clicks)} คลิก · อันดับ ${r.position.toFixed(1)}`) : ['ไม่มี']),
        ].join('\n');
      }

      case 'up': {
        const rows = await deps.status();
        const bad = rows.filter((r) => r.status !== 200);
        return bad.length
          ? ['🚨 <b>เว็บตอบไม่ปกติ</b>', ...rows.map((r) => `${esc(r.path)} → ${esc(r.status)}`), 'เช็ก Coolify'].join('\n')
          : `✅ เว็บปกติ (${rows.map((r) => esc(r.path)).join(', ')} ตอบ 200)`;
      }

      case 'events': {
        const live = NEWS.filter((n) => isLive(n, deps.now)).sort((a, b) => Date.parse(a.ends!) - Date.parse(b.ends!));
        if (!live.length) return 'ตอนนี้ไม่มีกิจกรรม';
        return [
          '🎪 <b>กิจกรรมที่ยังไม่จบ</b>',
          ...live.map((n) => `• <a href="${SITE}${n.href}">${esc(n.title)}</a> — เหลือ ${daysLeft(n, deps.now)} วัน (จบ ${esc(n.endsTh ?? '')})`),
        ].join('\n');
      }

      case 'find': {
        if (!arg) return 'พิมพ์ชื่อตามหลัง เช่น /find poring';
        const found = await deps.find(arg.slice(0, 60));
        if (!found.length) return `ไม่เจอ "${esc(arg)}"`;
        const label = { monster: '👾', item: '🎒', map: '🗺' } as const;
        return found.map((f) => `${label[f.kind]} <a href="${SITE}${f.href}">${esc(f.name)}</a>`).join('\n');
      }

      default:
        return `ไม่รู้จัก /${esc(cmd)}\n\n${HELP}`;
    }
  } catch (e) {
    return `⚠️ /${esc(cmd)} ไม่สำเร็จ: ${esc(e instanceof Error ? e.message : e).slice(0, 200)}`;
  }
}
