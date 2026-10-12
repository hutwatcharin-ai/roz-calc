// GET /api/monster/<id>: the target stats the build simulator needs when a
// monster is picked (components/BuildSimulator), read on the server so the
// browser holds no database key (owner, 12 Oct 2026). Every field here is
// already printed on /database/monsters/<id>.
import { NextResponse } from 'next/server';
import { supabaseRead } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const COLUMNS = 'id, name_en, level, vit, def, mdef, int_, luk, hp, size, element, element_level, race, is_mvp, hit_100, flee_95, image_url';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: 'bad id' }, { status: 400 });
  const { data, error } = await supabaseRead().from('monsters').select(COLUMNS).eq('id', id).maybeSingle();
  if (error) {
    console.error('api/monster: lookup failed', error);
    return NextResponse.json({ error: 'lookup failed' }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json(data, { headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=86400' } });
}
