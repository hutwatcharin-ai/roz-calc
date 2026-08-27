// app/database/items/[id]/page.tsx
import { supabaseBrowser } from '@/lib/supabase';
import FeedbackButton from '@/components/FeedbackButton';
import DescriptionLanguageToggle from '@/components/DescriptionLanguageToggle';
import { composeThaiDescription } from '@/lib/item-description-th';
import type { Metadata } from 'next';
import { cache } from 'react';
import { notFound } from 'next/navigation';

// Shared by generateMetadata and the page body so a request does one query for
// the row instead of two -- the two callers used to select different column
// lists, which meant Next's fetch memoisation couldn't collapse them. Returns
// the raw { data, error } so each caller keeps its own error handling; this
// helper must not swallow the error itself.
const getItem = cache(async (id: number) => {
  return await supabaseBrowser().from('items').select('*').eq('id', id).maybeSingle();
});

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const { data: item, error } = await getItem(Number(params.id));

  // A failed query must not read as "this item does not exist" -- only a
  // clean query returning no row may claim that. On error we know nothing
  // about the row, so we make no title/description claim either way rather
  // than tell a crawler a live page is dead.
  if (error) {
    console.error('item detail query failed (metadata)', error);
    return {};
  }

  if (!item) return { title: 'ไม่พบไอเทมนี้' };

  const parts: string[] = [];
  if (item.category) parts.push(item.category);
  if (item.atk !== null) parts.push(`ATK ${item.atk}`);
  if (item.required_level !== null) parts.push(`ใช้ได้ที่เลเวล ${item.required_level}`);

  return {
    title: `${item.name_en} — ดรอปจากมอนตัวไหน`,
    description: `${item.name_en}${parts.length ? ` ${parts.join(' ')}` : ''} — ดูว่าดรอปจากมอนสเตอร์ตัวไหน อัตราดรอปเท่าไร และราคาขายใน ROZ Calc`,
  };
}

export default async function ItemDetailPage({ params }: { params: { id: string } }) {
  const db = supabaseBrowser();
  const id = Number(params.id);

  // maybeSingle (not single): a missing id must come back as data:null with no
  // error, so a genuine 404 stays distinguishable from a real query failure.
  const { data: item, error } = await getItem(id);
  // Every card and equipment row links here for exactly this section -- a
  // failed query must not read as "nothing drops this" (data: null looks
  // identical to a real empty result without its own error slot).
  const { data: droppedBy, error: droppedByError } = await db
    .from('monster_drops')
    .select('rate, monsters(id, name_en, image_url)')
    .eq('item_id', id)
    .order('rate', { ascending: false });
  if (droppedByError) console.error('item dropped-by query failed', droppedByError);

  const [{ data: lineRows, error: linesError }, { data: termRows, error: termsError }] =
    await Promise.all([
      db.from('item_description_lines').select('source_line, thai_line'),
      db.from('item_description_terms').select('source_term, thai_term'),
    ]);

  // A dictionary that failed to load is not an empty dictionary. Falling back to
  // English for every line is the right behaviour either way, but the two cases
  // must stay distinguishable in the logs.
  if (linesError) console.error('item description lines query failed', linesError);
  if (termsError) console.error('item description terms query failed', termsError);

  const dict = {
    lines: new Map((lineRows ?? []).map((r) => [r.source_line, r.thai_line])),
    terms: new Map((termRows ?? []).map((r) => [r.source_term, r.thai_term])),
  };

  // A failed query must not read as "this item does not exist".
  if (error) {
    console.error('item detail query failed', error);
    return <main className="shell" style={{ paddingBlock: 32 }}>เกิดข้อผิดพลาด ลองใหม่อีกครั้ง</main>;
  }

  // A clean query that found no row is a genuine 404 -- unlike the error
  // branch above, which must keep rendering its neutral message and never
  // become a 404 for a query we simply failed to run.
  if (!item) {
    notFound();
  }

  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {item.icon_url && (
          <img
            src={item.icon_url}
            alt=""
            width={48}
            height={48}
            style={{ imageRendering: 'pixelated' }}
          />
        )}
        <div>
          <h1 style={{ fontFamily: '"Chakra Petch", sans-serif', fontSize: 32 }}>{item.name_en}</h1>
          <p style={{ color: 'var(--dim)' }}>{item.category}{item.weapon_type ? ` · ${item.weapon_type}` : ''}</p>
        </div>
      </div>
      <div className="card" style={{ marginTop: 20 }}>
        {item.atk !== null && (
          <p>
            ATK {item.atk}
            {item.weapon_level !== null ? ` · Weapon Lv.${item.weapon_level}` : ''}
            {item.required_level !== null ? ` · ใช้ได้ที่เลเวล ${item.required_level}` : ''}
          </p>
        )}
        {item.equippable_classes.length > 0 && <p>สวมใส่ได้: {item.equippable_classes.join(', ')}</p>}
        <div className="reward-row" style={{ marginTop: 12 }}>
          <div>
            <span className="reward-label">ราคาซื้อ</span>
            <span className="reward-value mono">
              {item.buy_price === null ? '—' : item.buy_price.toLocaleString('en-US')}
            </span>
          </div>
          <div>
            <span className="reward-label">ราคาขาย</span>
            <span className="reward-value mono">
              {item.sell_price === null ? '—' : item.sell_price.toLocaleString('en-US')}
            </span>
          </div>
        </div>
      </div>

      {item.description && (
        <div className="card" style={{ marginTop: 20 }}>
          <h2 className="section-title">คำอธิบาย</h2>
          <DescriptionLanguageToggle
            thaiLines={composeThaiDescription(item.description, dict).map((l) => l.thai ?? l.source)}
            englishLines={item.description.split('\n').map((l: string) => l.replace(/\^[0-9a-fA-F]{6}/g, '').trim()).filter((l: string) => l !== '')}
          />
        </div>
      )}
      <div className="card" style={{ marginTop: 20 }}>
        <h2 style={{ fontFamily: '"Chakra Petch", sans-serif', marginBottom: 10 }}>มอนสเตอร์ที่ดรอปของนี้</h2>
        {droppedByError ? (
          <p style={{ color: 'var(--faint)' }}>โหลดข้อมูลมอนสเตอร์ที่ดรอปไม่สำเร็จ ลองใหม่อีกครั้ง</p>
        ) : (droppedBy ?? []).length === 0 ? (
          <p style={{ color: 'var(--faint)' }}>ไม่มีข้อมูลมอนสเตอร์ที่ดรอปไอเทมนี้</p>
        ) : (
          (droppedBy ?? []).map((d: any, i: number) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {d.monsters.image_url && (
                  <img src={d.monsters.image_url} alt="" width={20} height={20} style={{ imageRendering: 'pixelated' }} />
                )}
                {d.monsters.name_en}
              </span>
              <span className="mono">{d.rate}%</span>
            </div>
          ))
        )}
      </div>
      <div style={{ marginTop: 20 }}>
        <FeedbackButton pageType="item" entityId={String(item.id)} />
      </div>
    </main>
  );
}
