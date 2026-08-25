// app/database/items/page.tsx
import Link from 'next/link';
import { supabaseBrowser } from '@/lib/supabase';

// Daily ISR (spec §5). Note: this does NOT move the page off the build-time
// prerender path — Next.js still prerenders it once at build, so Supabase
// env vars must still be present as build-time variables in Coolify.
export const revalidate = 86400;

export default async function ItemListPage() {
  const db = supabaseBrowser();
  const { data: items, error } = await db
    .from('items')
    .select('id, name_en, category, weapon_type, icon_url')
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
                <td>
                  <Link href={`/database/items/${it.id}`} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {it.icon_url && (
                      <img src={it.icon_url} alt="" width={24} height={24} style={{ imageRendering: 'pixelated' }} />
                    )}
                    {it.name_en}
                  </Link>
                </td>
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
