// POST /api/feedback: the "แจ้งข้อมูลผิด" button (components/FeedbackButton),
// stored on the server so the browser holds no database key (owner, 12 Oct
// 2026). Anyone can call it, so it caps every field and limits each address
// to a burst of reports, the same way /api/build-link does.
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const WINDOW_MS = 10 * 60 * 1000;
const PER_WINDOW = 10;
const hits = new Map<string, { n: number; since: number }>();

function allowed(ip: string): boolean {
  const now = Date.now();
  const h = hits.get(ip);
  if (!h || now - h.since > WINDOW_MS) {
    hits.set(ip, { n: 1, since: now });
    if (hits.size > 5000) hits.clear();
    return true;
  }
  h.n += 1;
  return h.n <= PER_WINDOW;
}

const text = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export async function POST(req: Request) {
  const ip = req.headers.get('cf-connecting-ip') ?? req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
  if (!allowed(ip)) return NextResponse.json({ error: 'ลองใหม่อีกสักครู่' }, { status: 429 });
  const body = await req.text();
  if (body.length > 4000) return NextResponse.json({ error: 'too large' }, { status: 413 });
  let raw: Record<string, unknown>;
  try {
    raw = JSON.parse(body) ?? {};
  } catch {
    return NextResponse.json({ error: 'bad json' }, { status: 400 });
  }
  const page_type = text(raw.pageType, 40);
  const entity_id = text(raw.entityId, 120);
  const message = text(raw.message, 2000);
  if (!page_type || !message) return NextResponse.json({ error: 'missing fields' }, { status: 400 });
  const { error } = await supabaseAdmin().from('feedback_reports').insert({ page_type, entity_id, message });
  if (error) {
    console.error('api/feedback: insert failed', error);
    return NextResponse.json({ error: 'insert failed' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
