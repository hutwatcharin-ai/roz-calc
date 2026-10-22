// POST /api/telegram: Telegram's webhook for @rozerothaibot (owner, 22 Oct
// 2026). The commands themselves are lib/telegram-bot.ts.
//
// Two locks: Telegram sends TELEGRAM_WEBHOOK_SECRET in a header (set with the
// webhook by scripts/telegram-setup.mjs), and only the owner's chat gets an
// answer -- anyone else who finds the bot is ignored without a word.
import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { reply } from '@/lib/telegram-bot';
import { liveDeps } from '@/lib/telegram-deps';

export const dynamic = 'force-dynamic';

const OWNER_CHAT = process.env.TELEGRAM_CHAT_ID || '6242848323';

function secretOk(got: string | null): boolean {
  const want = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!want || !got) return false;
  const a = Buffer.from(got);
  const b = Buffer.from(want);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  if (!secretOk(req.headers.get('x-telegram-bot-api-secret-token'))) return new NextResponse(null, { status: 401 });
  let update: { message?: { chat?: { id?: number }; text?: string } };
  try {
    update = await req.json();
  } catch {
    return NextResponse.json({ ok: true });
  }
  const msg = update.message;
  // Always 200 from here: Telegram resends anything else, over and over.
  if (!msg?.text || String(msg.chat?.id) !== OWNER_CHAT) return NextResponse.json({ ok: true });

  const text = await reply(msg.text, liveDeps());
  const res = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: OWNER_CHAT, text, parse_mode: 'HTML', disable_web_page_preview: true }),
  });
  if (!res.ok) console.error('api/telegram: sendMessage', res.status, (await res.text()).slice(0, 200));
  return NextResponse.json({ ok: true });
}
