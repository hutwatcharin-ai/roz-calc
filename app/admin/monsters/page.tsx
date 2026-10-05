// /admin/monsters -- the owner's tool for recording, from play, whether a
// monster attacks first (5 Oct 2026: "like the price tool"). 68 monsters had
// no answer, which shows as "ไม่มีข้อมูล" on every card and keeps them out of
// the AFK filter. Local only: 404 unless ENABLE_ADMIN=1 (lib/admin).

import '../prices/page.css';
import './page.css';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import AggroTool, { type AggroRow } from '@/components/AggroTool';
import { adminEnabled } from '@/lib/admin';
import { readAggroLog } from '@/lib/aggro-log';
import { fetchAllRows } from '@/lib/fetch-all-rows';
import { mapRelease } from '@/lib/map-availability';
import { mapDisplayName } from '@/lib/npcs';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export const metadata: Metadata = {
  title: 'ใส่ข้อมูลมอนตีก่อน',
  robots: { index: false, follow: false },
};

export default async function AggroAdminPage() {
  if (!adminEnabled()) notFound();

  const db = supabaseAdmin();
  const [{ data: mons, error }, { data: spawns, error: spawnError }] = await Promise.all([
    fetchAllRows<{ id: number; name_en: string; level: number | null; race: string | null; element: string | null; image_url: string | null; is_aggressive: boolean | null }>(
      (from, to) => db.from('monsters').select('id, name_en, level, race, element, image_url, is_aggressive').order('id').range(from, to),
    ),
    fetchAllRows<{ monster_id: number; map_code: string; map_display_name: string | null }>((from, to) =>
      db.from('monster_spawns').select('monster_id, map_code, map_display_name').order('monster_id').range(from, to),
    ),
  ]);
  if (error || spawnError) throw new Error(`monsters query failed: ${(error ?? spawnError)!.message}`);

  // Where to go and test it: open maps only, with the name the game shows.
  const maps = new Map<number, string[]>();
  for (const s of spawns ?? []) {
    if (mapRelease(s.map_code)) continue;
    const name = s.map_display_name ?? mapDisplayName(s.map_code) ?? s.map_code;
    const list = maps.get(s.monster_id) ?? [];
    if (!list.includes(name)) list.push(name);
    maps.set(s.monster_id, list);
  }
  const checked = new Map<number, string>();
  for (const e of readAggroLog()) checked.set(e.id, e.at);

  const rows: AggroRow[] = (mons ?? []).map((m) => ({
    id: m.id,
    name: m.name_en,
    level: m.level,
    race: m.race,
    element: m.element,
    image: m.image_url,
    aggressive: m.is_aggressive,
    maps: maps.get(m.id) ?? [],
    checkedAt: checked.get(m.id) ?? null,
  }));

  return (
    <main className="shell" style={{ paddingBlock: 24 }}>
      <p className="arckicker">ADMIN · เครื่องนี้เท่านั้น</p>
      <h1 className="pagehead__title arcname">มอนตัวไหนตีก่อน</h1>
      <p className="muted" style={{ maxWidth: '72ch' }}>
        เข้าแมพแล้วยืนใกล้ๆ ถ้ามอนเดินมาตีเองกด &ldquo;ตีก่อน&rdquo; ถ้าเดินผ่านเฉยๆ กด &ldquo;ไม่ตีก่อน&rdquo; · บันทึกทันทีที่กด ย้อนได้ทางขวา ·
        ขึ้นเว็บจริงเองภายใน 1 วัน หรือกด &ldquo;อัปเดตเว็บตอนนี้&rdquo; ในหน้า <a href="/admin/prices">ราคา</a>
      </p>
      <AggroTool rows={rows} />
    </main>
  );
}
