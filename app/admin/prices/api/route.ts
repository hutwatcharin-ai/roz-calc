// Writes for /admin/prices: save a sell price, undo an edit, or push the
// changes to the live site. Local only -- 404 unless ENABLE_ADMIN=1 (lib/admin).

import { spawn } from 'node:child_process';
import { NextResponse } from 'next/server';
import { adminEnabled } from '@/lib/admin';
import { appendPriceLog, readPriceLog } from '@/lib/price-log';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const notFound = () => new NextResponse('Not found', { status: 404 });

// The last publish, so the page can say whether one is still running.
let publishing: { startedAt: string; done: boolean; ok: boolean | null; tail: string } | null = null;

export async function GET() {
  if (!adminEnabled()) return notFound();
  return NextResponse.json({ log: readPriceLog().slice(-200), publishing });
}

export async function POST(request: Request) {
  if (!adminEnabled()) return notFound();
  const body = (await request.json().catch(() => null)) as
    | { action: 'save'; id: number; price: number | null }
    | { action: 'undo'; at: string }
    | { action: 'publish' }
    | null;
  if (!body) return NextResponse.json({ error: 'bad request' }, { status: 400 });

  if (body.action === 'publish') {
    if (publishing && !publishing.done) return NextResponse.json({ publishing });
    // A redeploy rebuilds every page from the database, which is the only way
    // to refresh a day-cached item page without a secret on the server.
    // scripts/deploy.mjs checks the new build is live and purges the CDN.
    publishing = { startedAt: new Date().toISOString(), done: false, ok: null, tail: '' };
    const run = spawn(process.execPath, ['scripts/deploy.mjs', '--path', '/database/items'], { cwd: process.cwd() });
    const keep = (chunk: Buffer) => {
      if (publishing) publishing.tail = (publishing.tail + chunk.toString()).slice(-600);
    };
    run.stdout.on('data', keep);
    run.stderr.on('data', keep);
    run.on('close', (code) => {
      if (publishing) Object.assign(publishing, { done: true, ok: code === 0 });
    });
    return NextResponse.json({ publishing });
  }

  const db = supabaseAdmin();

  if (body.action === 'save') {
    const { id, price } = body;
    if (!Number.isInteger(id) || (price !== null && (!Number.isInteger(price) || price < 0 || price > 1_000_000_000))) {
      return NextResponse.json({ error: 'ราคาไม่ถูกต้อง' }, { status: 400 });
    }
    const { data: before, error: readError } = await db.from('items').select('id, name_en, sell_price').eq('id', id).maybeSingle();
    if (readError || !before) return NextResponse.json({ error: 'ไม่พบไอเทม' }, { status: 404 });
    const { error } = await db.from('items').update({ sell_price: price }).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const edit = { at: new Date().toISOString(), id, name: before.name_en, from: before.sell_price, to: price };
    appendPriceLog(edit);
    return NextResponse.json({ edit });
  }

  if (body.action === 'undo') {
    const target = readPriceLog().find((e) => e.at === body.at);
    if (!target) return NextResponse.json({ error: 'ไม่พบรายการที่จะย้อน' }, { status: 404 });
    const { data: now } = await db.from('items').select('sell_price').eq('id', target.id).maybeSingle();
    // Only undo when nothing has changed it since: an older edit must not
    // overwrite a newer one.
    if (now?.sell_price !== target.to) {
      return NextResponse.json({ error: 'ราคานี้ถูกแก้อีกครั้งหลังจากนั้นแล้ว ย้อนไม่ได้' }, { status: 409 });
    }
    const { error } = await db.from('items').update({ sell_price: target.from }).eq('id', target.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const edit = { at: new Date().toISOString(), id: target.id, name: target.name, from: target.to, to: target.from, undoOf: target.at };
    appendPriceLog(edit);
    return NextResponse.json({ edit });
  }

  return NextResponse.json({ error: 'bad request' }, { status: 400 });
}
