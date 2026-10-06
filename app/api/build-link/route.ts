// POST /api/build-link: store a build and answer its short id (lib/build-share).
//
// Anyone can call it, so it only accepts what sanitizeBuild keeps (known
// classes, items, cards and stones, numbers clamped), stores at most one
// small file per distinct build, and limits each address to a burst of
// links. Same build, same id: repeating a request stores nothing.
import { NextResponse } from 'next/server';
import { saveBuild } from '@/lib/build-share';

export const dynamic = 'force-dynamic';

const WINDOW_MS = 10 * 60 * 1000;
const PER_WINDOW = 30;
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

export async function POST(req: Request) {
  const ip = req.headers.get('cf-connecting-ip') ?? req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
  if (!allowed(ip)) return NextResponse.json({ error: 'ลองใหม่อีกสักครู่' }, { status: 429 });
  const body = await req.text();
  if (body.length > 8000) return NextResponse.json({ error: 'too large' }, { status: 413 });
  let raw: unknown;
  try {
    raw = JSON.parse(body)?.build;
  } catch {
    return NextResponse.json({ error: 'bad json' }, { status: 400 });
  }
  const id = await saveBuild(raw);
  if (!id) return NextResponse.json({ error: 'บิลด์ไม่ถูกต้อง หรือบันทึกไม่สำเร็จ' }, { status: 400 });
  return NextResponse.json({ id });
}
