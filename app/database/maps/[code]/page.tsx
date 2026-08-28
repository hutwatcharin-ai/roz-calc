// app/database/maps/[code]/page.tsx
import Link from 'next/link';
import type { Metadata } from 'next';
import { cache } from 'react';
import { notFound } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase';
import AggroBadge from '@/components/AggroBadge';

export const revalidate = 86400;

// Shared by generateMetadata and the page body so one request does one query.
// Returns the raw { data, error } so each caller keeps its own handling.
const getMapSpawns = cache(async (code: string) => {
  return await supabaseBrowser()
    .from('monster_spawns')
    .select('map_display_name, monsters(id, name_en, level, hp, base_exp, image_url, is_aggressive, atk_max)')
    .eq('map_code', code);
});

export async function generateMetadata({ params }: { params: { code: string } }): Promise<Metadata> {
  const code = decodeURIComponent(params.code);
  const { data, error } = await getMapSpawns(code);

  // An error tells us nothing about the map, so make no claim either way
  // rather than tell a crawler a live page is dead.
  if (error) {
    console.error('map metadata query failed', error);
    return {};
  }
  if (!data || data.length === 0) return { title: 'ไม่พบแมพนี้' };

  const name = data.find((r) => r.map_display_name)?.map_display_name ?? code;
  return {
    title: `${name} — มอนสเตอร์ในแมพนี้`,
    description: `${name} (${code}) มีมอนสเตอร์ ${data.length} ชนิด ดูเลเวล HP EXP และของที่ดรอปได้ใน ROZ Calc`,
  };
}

export default async function MapDetailPage({ params }: { params: { code: string } }) {
  const code = decodeURIComponent(params.code);
  const { data: spawns, error } = await getMapSpawns(code);

  if (error) {
    console.error('map detail query failed', error);
    return <main className="shell" style={{ paddingBlock: 32 }}>เกิดข้อผิดพลาด ลองใหม่อีกครั้ง</main>;
  }

  // A clean query returning nothing is a genuine 404 -- unlike the error
  // branch above, which must never become one.
  if (!spawns || spawns.length === 0) {
    notFound();
  }

  const name = spawns.find((s: any) => s.map_display_name)?.map_display_name ?? code;
  const monsters = spawns
    .map((s: any) => s.monsters)
    .filter(Boolean)
    .sort((a: any, b: any) => a.level - b.level);

  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <h1 className="pagehead__title">{name}</h1>
      <p className="mono" style={{ color: 'var(--faint)', marginTop: 6 }}>{code}</p>
      <p style={{ color: 'var(--dim)', marginTop: 10 }}>มอนสเตอร์ {monsters.length} ชนิดในแมพนี้</p>

      <div className="card" style={{ marginTop: 20 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>มอนสเตอร์</th>
              <th className="num">Lv</th>
              <th className="num">HP</th>
              <th className="num">Base EXP</th>
              <th>เข้าตีเอง</th>
            </tr>
          </thead>
          <tbody>
            {monsters.map((m: any) => (
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
                {/* hp and base_exp of 0 are the unknown-value sentinels, not real zeros. */}
                <td data-label="HP" className="num">{m.hp > 0 ? m.hp.toLocaleString('en-US') : '—'}</td>
                <td data-label="Base EXP" className="num">{m.base_exp > 0 ? m.base_exp.toLocaleString('en-US') : '—'}</td>
                <td data-label="เข้าตีเอง">
                  <AggroBadge monster={{ is_aggressive: m.is_aggressive, atk_max: m.atk_max }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
