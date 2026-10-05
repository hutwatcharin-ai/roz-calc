// The game's screenshot folder, for the sell-window reader on /admin/prices.
// GET            -> the newest screenshots and whether each has been read
// GET ?file=x    -> that screenshot's bytes
// POST {read: [...names]} -> remember those as read
// Local only, like the rest of /admin (lib/admin).

import fs from 'node:fs';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { adminEnabled } from '@/lib/admin';

export const dynamic = 'force-dynamic';

const DIR = process.env.RO_SCREENSHOT_DIR ?? 'D:/RagnarokZero/ScreenShot';
const READ_FILE = path.join(process.cwd(), '.shots-read.json');
const NAME = /^[\w.-]+\.(jpe?g|png|bmp)$/i;
const notFound = () => new NextResponse('Not found', { status: 404 });

function readSet(): Set<string> {
  try {
    return new Set(JSON.parse(fs.readFileSync(READ_FILE, 'utf8')) as string[]);
  } catch {
    return new Set();
  }
}

export async function GET(request: Request) {
  if (!adminEnabled()) return notFound();
  const file = new URL(request.url).searchParams.get('file');
  if (file) {
    // Only a bare file name from that folder: no paths, no climbing out.
    if (!NAME.test(file)) return notFound();
    try {
      const bytes = fs.readFileSync(path.join(DIR, file));
      const type = /\.png$/i.test(file) ? 'image/png' : /\.bmp$/i.test(file) ? 'image/bmp' : 'image/jpeg';
      return new NextResponse(bytes, { headers: { 'content-type': type, 'cache-control': 'no-store' } });
    } catch {
      return notFound();
    }
  }
  let names: string[] = [];
  try {
    names = fs.readdirSync(DIR).filter((n) => NAME.test(n));
  } catch {
    return NextResponse.json({ dir: DIR, shots: [], error: 'ไม่พบโฟลเดอร์ภาพแคป' });
  }
  const read = readSet();
  const shots = names
    .map((name) => ({ name, at: fs.statSync(path.join(DIR, name)).mtimeMs, read: read.has(name) }))
    .sort((a, b) => b.at - a.at)
    .slice(0, 40);
  return NextResponse.json({ dir: DIR, shots });
}

export async function POST(request: Request) {
  if (!adminEnabled()) return notFound();
  const body = (await request.json().catch(() => null)) as { read?: string[] } | null;
  const names = (body?.read ?? []).filter((n) => NAME.test(n));
  const read = readSet();
  for (const n of names) read.add(n);
  fs.writeFileSync(READ_FILE, JSON.stringify([...read]));
  return NextResponse.json({ ok: true, read: names.length });
}
