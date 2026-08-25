// app/database/monsters/page.tsx
import Link from 'next/link';
import { supabaseBrowser } from '@/lib/supabase';

// Daily ISR (spec §5). Also keeps the page off the build-time static path, so
// the build does not need Supabase env vars present at build time.
export const revalidate = 86400;

export default async function MonsterListPage() {
  const db = supabaseBrowser();
  const { data: monsters, error } = await db
    .from('monsters')
    .select('id, name_en, level, race, element')
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
                <td><Link href={`/database/monsters/${m.id}`}>{m.name_en}</Link></td>
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
