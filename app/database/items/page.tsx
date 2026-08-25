// app/database/items/page.tsx
import Link from 'next/link';
import { supabaseBrowser } from '@/lib/supabase';

// Daily ISR (spec §5). Also keeps the page off the build-time static path, so
// the build does not need Supabase env vars present at build time.
export const revalidate = 86400;

export default async function ItemListPage() {
  const db = supabaseBrowser();
  const { data: items, error } = await db
    .from('items')
    .select('id, name_en, category, weapon_type')
    .order('id')
    .limit(100);

  if (error) {
    console.error('items list query failed', error);
  }

  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <h1 style={{ fontFamily: '"Chakra Petch", sans-serif', fontSize: 32 }}>ฐานข้อมูลไอเทม</h1>
      <div className="card" style={{ marginTop: 20 }}>
        <table>
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>ชื่อ</th>
              <th style={{ textAlign: 'left' }}>หมวด</th>
              <th style={{ textAlign: 'left' }}>ประเภทอาวุธ</th>
            </tr>
          </thead>
          <tbody>
            {(items ?? []).map((it) => (
              <tr key={it.id}>
                <td><Link href={`/database/items/${it.id}`}>{it.name_en}</Link></td>
                <td>{it.category}</td>
                <td>{it.weapon_type ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
