// What an item page knows from other items' text (lib/item-links): the ladder
// it heads, what it holds, and which boxes hold it. Each block renders only
// when there is something in it.
//
// Added 16 Oct 2026 (owner, AdSense low-value round 3): 1,214 item pages were
// a one-line description and a price. The game's own text already says what
// a box holds and which levels a buff comes in; the pages just never read it
// across items.

import Link from 'next/link';
import ItemIcon from '@/components/ItemIcon';
import { supabaseRead } from '@/lib/supabase';
import { itemHref } from '@/lib/item-href';
import { gameThaiDescription } from '@/lib/game-items';
import { boxesHolding, familyOf, itemsNaming, mentionsOf } from '@/lib/item-links';

interface Row {
  id: number;
  name_en: string;
  category: string | null;
  icon_url: string | null;
}

// The weight line closes every client description; it says nothing here.
const effectLines = (id: number) =>
  (gameThaiDescription(id) ?? []).map((line) => line.replace(/\^[0-9a-fA-F]{6}/g, '').trim()).filter((line) => line && !/^น้ำหนัก\s*:/.test(line));

function ItemList({ rows }: { rows: Row[] }) {
  return (
    <ul className="npcgoods__list">
      {rows.map((row) => (
        <li key={row.id}>
          <ItemIcon iconUrl={row.icon_url} category={row.category} size={24} />
          <Link href={itemHref(row.id, row.category)}>{row.name_en}</Link>
        </li>
      ))}
    </ul>
  );
}

export default async function ItemLinks({ itemId }: { itemId: number }) {
  const family = familyOf(itemId);
  const mentions = mentionsOf(itemId);
  const holders = boxesHolding(itemId);
  const namers = itemsNaming(itemId);
  const ids = [...new Set([...(family?.members ?? []), ...(mentions?.ids ?? []), ...holders, ...namers])];
  if (!ids.length) return null;

  const { data, error } = await supabaseRead().from('items').select('id, name_en, category, icon_url').in('id', ids);
  if (error) console.error('item links lookup failed', error);
  const byId = new Map((data ?? []).map((row: Row) => [row.id, row]));
  const rowsOf = (list: number[]) => list.map((id) => byId.get(id)).filter((row): row is Row => Boolean(row));

  return (
    <>
      {family && (
        <div className="card" style={{ marginTop: 20 }}>
          <h2 className="section-title">
            {family.name} ทุกระดับ ({family.members.length})
          </h2>
          <table className="bptable">
            <thead>
              <tr>
                <th>ระดับ</th>
                <th>ผล (ตามคำอธิบายในเกม)</th>
              </tr>
            </thead>
            <tbody>
              {family.members.map((id) => (
                <tr key={id} id={`i${id}`}>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {byId.get(id)?.name_en ?? id}
                    <span className="muted mono" style={{ marginInlineStart: 6, fontSize: 12 }}>#{id}</span>
                  </td>
                  <td>{effectLines(id).join(' · ') || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {mentions && rowsOf(mentions.ids).length > 0 && (
        <div className="card" style={{ marginTop: 20 }}>
          <h2 className="section-title">{mentions.box ? 'ข้างในมีอะไร' : 'ไอเทมที่คำอธิบายพูดถึง'}</h2>
          <ItemList rows={rowsOf(mentions.ids)} />
        </div>
      )}

      {rowsOf(holders).length > 0 && (
        <div className="card" style={{ marginTop: 20 }}>
          <h2 className="section-title">ได้จากกล่องหรือแพ็กเกจ ({rowsOf(holders).length})</h2>
          <ItemList rows={rowsOf(holders)} />
        </div>
      )}

      {rowsOf(namers).length > 0 && (
        <div className="card" style={{ marginTop: 20 }}>
          <h2 className="section-title">ไอเทมอื่นที่พูดถึงชิ้นนี้</h2>
          <ItemList rows={rowsOf(namers)} />
        </div>
      )}
    </>
  );
}
