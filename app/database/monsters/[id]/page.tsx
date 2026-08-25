// app/database/monsters/[id]/page.tsx
import { supabaseBrowser } from '@/lib/supabase';
import FeedbackButton from '@/components/FeedbackButton';

export default async function MonsterDetailPage({ params }: { params: { id: string } }) {
  const db = supabaseBrowser();
  const id = Number(params.id);

  // maybeSingle (not single): a missing id must come back as data:null with no
  // error, so a genuine 404 stays distinguishable from a real query failure.
  const { data: monster, error } = await db.from('monsters').select('*').eq('id', id).maybeSingle();
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
