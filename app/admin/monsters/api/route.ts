// Writes for /admin/monsters: set whether a monster attacks first, or undo
// one such edit. Local only -- 404 unless ENABLE_ADMIN=1 (lib/admin).

import { NextResponse } from 'next/server';
import { adminEnabled } from '@/lib/admin';
import { appendAggroLog, readAggroLog, type AggroEdit } from '@/lib/aggro-log';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
// Same reason as /admin/prices: every read must be the database as it is now.
export const fetchCache = 'force-no-store';

const notFound = () => new NextResponse('Not found', { status: 404 });

export async function GET() {
  if (!adminEnabled()) return notFound();
  return NextResponse.json({ log: readAggroLog().slice(-200) });
}

export async function POST(request: Request) {
  if (!adminEnabled()) return notFound();
  const body = (await request.json().catch(() => null)) as
    | { action: 'set'; id: number; value: boolean | null }
    | { action: 'undo'; at: string }
    | null;
  if (!body) return NextResponse.json({ error: 'bad request' }, { status: 400 });
  const db = supabaseAdmin();

  if (body.action === 'set') {
    const { id, value } = body;
    if (!Number.isInteger(id) || !(value === true || value === false || value === null)) {
      return NextResponse.json({ error: 'ค่าไม่ถูกต้อง' }, { status: 400 });
    }
    const { data: before } = await db.from('monsters').select('id, name_en, is_aggressive').eq('id', id).maybeSingle();
    if (!before) return NextResponse.json({ error: 'ไม่พบมอน' }, { status: 404 });
    const { error } = await db.from('monsters').update({ is_aggressive: value }).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const edit: AggroEdit = { at: new Date().toISOString(), id, name: before.name_en, from: before.is_aggressive, to: value };
    appendAggroLog(edit);
    return NextResponse.json({ edit });
  }

  if (body.action === 'undo') {
    const target = readAggroLog().find((e) => e.at === body.at);
    if (!target) return NextResponse.json({ error: 'ไม่พบรายการที่จะย้อน' }, { status: 404 });
    const { data: now } = await db.from('monsters').select('is_aggressive').eq('id', target.id).maybeSingle();
    // An older edit must not overwrite a newer one.
    if (now?.is_aggressive !== target.to) {
      return NextResponse.json({ error: 'มอนตัวนี้ถูกแก้อีกครั้งหลังจากนั้นแล้ว ย้อนไม่ได้' }, { status: 409 });
    }
    const { error } = await db.from('monsters').update({ is_aggressive: target.from }).eq('id', target.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const edit: AggroEdit = { at: new Date().toISOString(), id: target.id, name: target.name, from: target.to, to: target.from, undoOf: target.at };
    appendAggroLog(edit);
    return NextResponse.json({ edit });
  }

  return NextResponse.json({ error: 'bad request' }, { status: 400 });
}
