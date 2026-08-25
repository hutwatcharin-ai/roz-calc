// app/database/items/[id]/page.tsx
import { supabaseBrowser } from '@/lib/supabase';
import FeedbackButton from '@/components/FeedbackButton';

export default async function ItemDetailPage({ params }: { params: { id: string } }) {
  const db = supabaseBrowser();
  const id = Number(params.id);

  const { data: item } = await db.from('items').select('*').eq('id', id).single();
  const { data: droppedBy } = await db
    .from('monster_drops')
    .select('rate, monsters(id, name_en)')
    .eq('item_id', id)
    .order('rate', { ascending: false });

  if (!item) {
    return <main className="shell" style={{ paddingBlock: 32 }}>ไม่พบไอเทมนี้</main>;
  }

  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <h1 style={{ fontFamily: '"Chakra Petch", sans-serif', fontSize: 32 }}>{item.name_en}</h1>
      <p style={{ color: 'var(--dim)' }}>{item.category}{item.weapon_type ? ` · ${item.weapon_type}` : ''}</p>
      <div className="card" style={{ marginTop: 20 }}>
        {item.atk !== null && <p>ATK {item.atk} · Weapon Lv.{item.weapon_level} · Required Lv.{item.required_level}</p>}
        {item.equippable_classes.length > 0 && <p>สวมใส่ได้: {item.equippable_classes.join(', ')}</p>}
      </div>
      <div className="card" style={{ marginTop: 20 }}>
        <h2 style={{ fontFamily: '"Chakra Petch", sans-serif', marginBottom: 10 }}>มอนสเตอร์ที่ดรอปของนี้</h2>
        {(droppedBy ?? []).map((d: any, i: number) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
            <span>{d.monsters.name_en}</span>
            <span className="mono">{d.rate}%</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 20 }}>
        <FeedbackButton pageType="item" entityId={String(item.id)} />
      </div>
    </main>
  );
}
