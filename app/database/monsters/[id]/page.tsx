// app/database/monsters/[id]/page.tsx
import { supabaseBrowser } from '@/lib/supabase';
import FeedbackButton from '@/components/FeedbackButton';
import type { Metadata } from 'next';
import { cache } from 'react';

// Shared by generateMetadata and the page body so a request does one query for
// the row instead of two -- the two callers used to select different column
// lists, which meant Next's fetch memoisation couldn't collapse them. Returns
// the raw { data, error } so each caller keeps its own error handling; this
// helper must not swallow the error itself.
const getMonster = cache(async (id: number) => {
  return await supabaseBrowser().from('monsters').select('*').eq('id', id).maybeSingle();
});

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const { data: monster, error } = await getMonster(Number(params.id));

  // A failed query must not read as "this monster does not exist" -- only a
  // clean query returning no row may claim that. On error we know nothing
  // about the row, so we make no title/description claim either way rather
  // than tell a crawler a live page is dead.
  if (error) {
    console.error('monster detail query failed (metadata)', error);
    return {};
  }

  if (!monster) return { title: 'ไม่พบมอนสเตอร์นี้' };

  // Every value here comes from the row. Nothing is filled in when the column is
  // null -- an invented element or HP would be a factual claim we cannot make.
  const parts = [`เลเวล ${monster.level}`];
  if (monster.element) parts.push(`ธาตุ${monster.element}`);
  if (monster.race) parts.push(`เผ่า${monster.race}`);
  if (monster.hp) parts.push(`HP ${monster.hp.toLocaleString('en-US')}`);

  return {
    title: `${monster.name_en} (Lv.${monster.level}) — ดรอป จุดเกิด ค่าสถานะ`,
    description: `${monster.name_en} ${parts.join(' ')} — ดูของที่ดรอป อัตราดรอป แมพที่เจอ และค่าสถานะครบใน ROZ Calc`,
  };
}

export default async function MonsterDetailPage({ params }: { params: { id: string } }) {
  const db = supabaseBrowser();
  const id = Number(params.id);

  // maybeSingle (not single): a missing id must come back as data:null with no
  // error, so a genuine 404 stays distinguishable from a real query failure.
  const { data: monster, error } = await getMonster(id);
  const { data: drops } = await db
    .from('monster_drops')
    .select('rate, items(name_en, sell_price, icon_url)')
    .eq('monster_id', id)
    .order('rate', { ascending: false });

  // A failed query must not read as "this monster does not exist".
  if (error) {
    console.error('monster detail query failed', error);
    return <main className="shell" style={{ paddingBlock: 32 }}>เกิดข้อผิดพลาด ลองใหม่อีกครั้ง</main>;
  }

  if (!monster) {
    return <main className="shell" style={{ paddingBlock: 32 }}>ไม่พบมอนสเตอร์นี้</main>;
  }

  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {monster.image_url && (
          <img
            src={monster.image_url}
            alt=""
            width={64}
            height={64}
            style={{ imageRendering: 'pixelated' }}
          />
        )}
        <div>
          <h1 style={{ fontFamily: '"Chakra Petch", sans-serif', fontSize: 32 }}>{monster.name_en}</h1>
          <p style={{ color: 'var(--dim)' }}>Lv.{monster.level} · {monster.race} · {monster.element}</p>
        </div>
      </div>
      <div className="card" style={{ marginTop: 20 }}>
        <p>HP {monster.hp.toLocaleString()} · ATK {monster.atk_min}–{monster.atk_max} · DEF {monster.def}</p>
      </div>
      <div className="card" style={{ marginTop: 20 }}>
        <h2 style={{ fontFamily: '"Chakra Petch", sans-serif', marginBottom: 10 }}>ตารางดรอป</h2>
        {(drops ?? []).map((d: any, i: number) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {d.items.icon_url && (
                <img src={d.items.icon_url} alt="" width={20} height={20} style={{ imageRendering: 'pixelated' }} />
              )}
              {d.items.name_en}
            </span>
            <span className="mono">{d.rate}%</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 20 }}>
        <FeedbackButton pageType="monster" entityId={String(monster.id)} />
      </div>
    </main>
  );
}
