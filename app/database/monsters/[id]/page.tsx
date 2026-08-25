// app/database/monsters/[id]/page.tsx
import { supabaseBrowser } from '@/lib/supabase';
import FeedbackButton from '@/components/FeedbackButton';

export default async function MonsterDetailPage({ params }: { params: { id: string } }) {
  const db = supabaseBrowser();
  const id = Number(params.id);

  const { data: monster } = await db.from('monsters').select('*').eq('id', id).single();
  const { data: drops } = await db
    .from('monster_drops')
    .select('rate, items(name_en, sell_price)')
    .eq('monster_id', id)
    .order('rate', { ascending: false });

  if (!monster) {
    return <main className="shell" style={{ paddingBlock: 32 }}>ไม่พบมอนสเตอร์นี้</main>;
  }

  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <h1 style={{ fontFamily: '"Chakra Petch", sans-serif', fontSize: 32 }}>{monster.name_en}</h1>
      <p style={{ color: 'var(--dim)' }}>Lv.{monster.level} · {monster.race} · {monster.element}</p>
      <div className="card" style={{ marginTop: 20 }}>
        <p>HP {monster.hp.toLocaleString()} · ATK {monster.atk_min}–{monster.atk_max} · DEF {monster.def}</p>
      </div>
      <div className="card" style={{ marginTop: 20 }}>
        <h2 style={{ fontFamily: '"Chakra Petch", sans-serif', marginBottom: 10 }}>ตารางดรอป</h2>
        {(drops ?? []).map((d: any, i: number) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
            <span>{d.items.name_en}</span>
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
