// app/database/monsters/page.tsx
import Link from 'next/link';
import { supabaseBrowser } from '@/lib/supabase';
import Pagination from '@/components/Pagination';

export const metadata = {
  title: 'ฐานข้อมูลมอนสเตอร์',
  description: 'มอนสเตอร์ทั้งหมดในเกม Ragnarok Zero Global พร้อมเลเวล เผ่า ธาตุ ค่าสถานะ และของที่ดรอป',
};

// Daily ISR (spec §5). Note: this does NOT move the page off the build-time
// prerender path — Next.js still prerenders it once at build, so Supabase
// env vars must still be present as build-time variables in Coolify.
export const revalidate = 86400;

const PAGE_SIZE = 50;
const RACES = ['Angel', 'Brute', 'Demi-Human', 'Demon', 'Dragon', 'Fish', 'Formless', 'Insect', 'Plant', 'Undead'];
const ELEMENTS = ['Earth', 'Fire', 'Ghost', 'Holy', 'Neutral', 'Poison', 'Shadow', 'Undead', 'Water', 'Wind'];

export default async function MonsterListPage({
  searchParams,
}: {
  searchParams: { q?: string; race?: string; element?: string; page?: string };
}) {
  const q = searchParams.q ?? '';
  const race = searchParams.race ?? '';
  const element = searchParams.element ?? '';
  const page = Math.max(1, Number(searchParams.page ?? 1) || 1);

  const db = supabaseBrowser();
  let query = db.from('monsters').select('id, name_en, level, race, element, image_url', { count: 'exact' });

  if (q) query = query.ilike('name_en', `%${q}%`);
  if (race) query = query.eq('race', race);
  if (element) query = query.eq('element', element);

  const from = (page - 1) * PAGE_SIZE;
  const { data: monsters, count, error } = await query.order('level').range(from, from + PAGE_SIZE - 1);

  if (error) {
    console.error('monsters list query failed', error);
  }

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  function buildHref(targetPage: number) {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (race) params.set('race', race);
    if (element) params.set('element', element);
    if (targetPage > 1) params.set('page', String(targetPage));
    const qs = params.toString();
    return `/database/monsters${qs ? `?${qs}` : ''}`;
  }

  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <h1 style={{ fontFamily: '"Chakra Petch", sans-serif', fontSize: 32 }}>ฐานข้อมูลมอนสเตอร์</h1>
      <p style={{ color: 'var(--faint)', marginTop: 6 }}>{count ?? 0} ตัวทั้งหมด</p>

      <form style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '20px 0' }}>
        <input className="mono" type="text" name="q" defaultValue={q} placeholder="ค้นชื่อมอนสเตอร์..." />
        <select name="race" defaultValue={race}>
          <option value="">ทุกเผ่า</option>
          {RACES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <select name="element" defaultValue={element}>
          <option value="">ทุกธาตุ</option>
          {ELEMENTS.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>
        <button type="submit">กรอง</button>
      </form>

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>ชื่อ</th>
              <th className="num">Lv</th>
              <th>เผ่า</th>
              <th>ธาตุ</th>
            </tr>
          </thead>
          <tbody>
            {(monsters ?? []).map((m) => (
              <tr key={m.id}>
                <td data-label="">
                  <Link href={`/database/monsters/${m.id}`} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {m.image_url && (
                      <img src={m.image_url} alt="" width={24} height={24} style={{ imageRendering: 'pixelated' }} />
                    )}
                    {m.name_en}
                  </Link>
                </td>
                <td data-label="Lv" className="num">{m.level}</td>
                <td data-label="เผ่า">{m.race ?? '—'}</td>
                <td data-label="ธาตุ">{m.element ?? '—'}</td>
              </tr>
            ))}
            {(monsters ?? []).length === 0 && (
              <tr>
                <td colSpan={4} style={{ color: 'var(--faint)', padding: '16px 0' }}>
                  ไม่พบมอนสเตอร์ที่ตรงเงื่อนไข
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={totalPages} buildHref={buildHref} />
    </main>
  );
}
