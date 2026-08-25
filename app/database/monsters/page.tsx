// app/database/monsters/page.tsx
import Link from 'next/link';
import { supabaseBrowser } from '@/lib/supabase';

// Daily ISR (spec §5). Note: this does NOT move the page off the build-time
// prerender path — Next.js still prerenders it once at build, so Supabase
// env vars must still be present as build-time variables in Coolify.
export const revalidate = 86400;

export default async function MonsterListPage() {
  const db = supabaseBrowser();
  const { data: monsters, error } = await db
    .from('monsters')
    .select('id, name_en, level, race, element, image_url')
    .order('level')
    .limit(100);

  if (error) {
    console.error('monsters list query failed', error);
  }

  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <h1 style={{ fontFamily: '"Chakra Petch", sans-serif', fontSize: 32 }}>ฐานข้อมูลมอนสเตอร์</h1>
      <div className="card" style={{ marginTop: 20 }}>
        <table>
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>ชื่อ</th>
              <th style={{ textAlign: 'right' }}>Lv</th>
              <th style={{ textAlign: 'left' }}>เผ่า</th>
              <th style={{ textAlign: 'left' }}>ธาตุ</th>
            </tr>
          </thead>
          <tbody>
            {(monsters ?? []).map((m) => (
              <tr key={m.id}>
                <td>
                  <Link href={`/database/monsters/${m.id}`} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {m.image_url && (
                      <img src={m.image_url} alt="" width={24} height={24} style={{ imageRendering: 'pixelated' }} />
                    )}
                    {m.name_en}
                  </Link>
                </td>
                <td className="mono" style={{ textAlign: 'right' }}>{m.level}</td>
                <td>{m.race}</td>
                <td>{m.element}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
