// app/tools/afk-finder/page.tsx
//
// "Where can I leave the bot and come back alive?" -- a different question from
// the farming finder's "what is worth killing", with a different sort order
// (safety first, EXP second) and its own URL so it can be shared into a game
// chat by name (spec 3.8).

import { supabaseBrowser } from '@/lib/supabase';
import { fetchAllRows } from '@/lib/fetch-all-rows';
import AfkFinderResults, { type AfkCandidate } from '@/components/AfkFinderResults';
import CVariantToggle from '@/components/CVariantToggle';

export const metadata = {
  title: 'หาจุด AFK ปลอดภัย',
  description:
    'หามอนสเตอร์ที่ไม่เข้าโจมตีก่อนและตายในหมัดเดียว สำหรับปล่อยบอทใน Ragnarok Zero Global — กรองด้วยดาเมจของคุณเอง พร้อมเตือนสกิลที่ทำให้บอทตาย',
};

export const revalidate = 86400;

async function getCandidates(): Promise<{ rows: AfkCandidate[]; failed: boolean }> {
  const db = supabaseBrowser();

  // Every monster that does not attack first. The one-hit filter happens in the
  // browser because the damage figure lives in the character context, and 238
  // rows is small enough to hand over whole.
  const stats = await fetchAllRows<{
    monster_id: number;
    name_en: string;
    level: number;
    hp: number | null;
    base_exp: number | null;
    exp_per_hp: number | null;
    avg_zeny_per_kill: number | null;
    image_url: string | null;
  }>((from, to) =>
    db
      .from('monster_farming_stats')
      .select('monster_id, name_en, level, hp, base_exp, exp_per_hp, avg_zeny_per_kill, image_url')
      .eq('is_aggressive', false)
      .order('monster_id')
      .range(from, to),
  );

  if (stats.error) {
    console.error('afk finder stats query failed', stats.error);
    return { rows: [], failed: true };
  }

  const ids = (stats.data ?? []).map((s) => s.monster_id);
  if (ids.length === 0) return { rows: [], failed: false };

  // Both of these are paginated rather than selected flat: 238 monsters carry
  // well over a thousand skill rows between them, and PostgREST truncates at a
  // thousand without saying so. A silently short skill list on a safety page
  // would read as "this monster has no dangerous skills".
  const skills = await fetchAllRows<{ monster_id: number; skill_name: string }>((from, to) =>
    db.from('monster_skills').select('monster_id, skill_name').in('monster_id', ids).order('monster_id').range(from, to),
  );
  const spawns = await fetchAllRows<{ monster_id: number; map_display_name: string | null }>((from, to) =>
    db
      .from('monster_spawns')
      .select('monster_id, map_display_name')
      .in('monster_id', ids)
      .order('monster_id')
      .range(from, to),
  );

  // A failed skill or spawn read must not render as "no skills, no maps" -- the
  // first would be a safety claim we did not earn.
  if (skills.error || spawns.error) {
    console.error('afk finder detail query failed', skills.error ?? spawns.error);
    return { rows: [], failed: true };
  }

  const skillsByMonster = new Map<number, string[]>();
  for (const row of skills.data ?? []) {
    const list = skillsByMonster.get(row.monster_id) ?? [];
    list.push(row.skill_name);
    skillsByMonster.set(row.monster_id, list);
  }

  const mapByMonster = new Map<number, string>();
  for (const row of spawns.data ?? []) {
    if (!mapByMonster.has(row.monster_id) && row.map_display_name) {
      mapByMonster.set(row.monster_id, row.map_display_name);
    }
  }

  return {
    rows: (stats.data ?? []).map((s) => ({
      ...s,
      skills: skillsByMonster.get(s.monster_id) ?? [],
      spawn: mapByMonster.get(s.monster_id) ?? null,
    })),
    failed: false,
  };
}

export default async function AfkFinderPage() {
  const { rows, failed } = await getCandidates();

  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <h1 className="pagehead__title">หาจุด AFK ปลอดภัย</h1>
      <p className="muted" style={{ marginTop: 8, maxWidth: '65ch' }}>
        เกมนี้มีบอทในตัวให้ใช้ฟรีไม่จำกัด คำถามจึงไม่ใช่ "ตีอะไรคุ้ม" แต่เป็น "ทิ้งบอทไว้ตรงไหนแล้วกลับมาไม่ตาย"
        หน้านี้ตัดมอนที่เข้าโจมตีก่อนออกทั้งหมด แล้วเหลือเฉพาะตัวที่ดาเมจของคุณฆ่าได้ในหมัดเดียว
      </p>

      <div className="ceiling-note" style={{ marginTop: 16, maxWidth: '65ch' }}>
        <strong>ธง &ldquo;โจมตีก่อน&rdquo; มาจากไหน:</strong> จากข้อมูลไฟล์เกม ไม่ใช่จากการไปยืนทดสอบ ·
        เทียบกับ ragnarokzero.net ซึ่งตีพิมพ์ธงเดียวกัน <strong>ครบทั้ง 524 ตัว ต่างกัน 0</strong>{' '}
        (พร้อมค่าสถานะอื่นรวมประมาณ 9,675 ค่า) แต่ทั้งสองเว็บมาจากต้นทางเดียวกัน
        จึงยืนยันได้แค่ว่าถอดข้อมูลมาตรง ไม่ได้ยืนยันว่าตรงกับเกมที่เปิดอยู่จริง
        <br />
        <strong>ตัวอย่างที่ควรลองเองก่อนเชื่อ:</strong> Scorpion กับ Hornet ติดธง
        &ldquo;ไม่โจมตีก่อน&rdquo; ทั้งคู่ ซึ่งคนที่เคยเล่น RO ภาคอื่นจะแปลกใจ ·
        ก่อนทิ้งบอทไว้นาน ๆ ยืนดูสักพักก่อนดีกว่า
      </div>

      {failed ? (
        <p className="muted" style={{ marginTop: 20 }}>ดึงข้อมูลไม่สำเร็จ ลองใหม่อีกครั้ง</p>
      ) : (
        <>
          <div style={{ marginTop: 16 }}><CVariantToggle mode="local" /></div>
          <AfkFinderResults rows={rows} />
        </>
      )}
    </main>
  );
}
