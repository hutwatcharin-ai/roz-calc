import Link from 'next/link';
import { supabaseBrowser } from '@/lib/supabase';
import AggroBadge from '@/components/AggroBadge';
import JsonLd from '@/components/JsonLd';
import { breadcrumbJsonLd } from '@/lib/jsonld';
import { isCVariant } from '@/lib/c-variant';
import { fetchAllRows } from '@/lib/fetch-all-rows';

export const metadata = {
  title: 'จุดฟาร์มแนะนำตามเลเวล Ragnarok Zero',
  description:
    'จุดฟาร์ม Ragnarok Zero Global แยกตามช่วงเลเวล — มอนสเตอร์ที่ EXP ต่อ HP คุ้มสุดของแต่ละช่วง พร้อมแมพที่เจอและคำเตือนตัวที่โจมตีก่อน คิดจากข้อมูลเกมจริงทั้ง 524 ตัว',
};

export const revalidate = 86400;

// SXO audit (1 Sep): Thai SERP for "จุดฟาร์ม ragnarok zero" has no
// Zero-specific content at all — this page is the narrative layer the raw
// tool cannot rank as. All numbers come from monster_farming_stats, same
// ranking as the homepage tool; nothing here is hand-maintained.
const BRACKETS: [number, number][] = [
  [1, 15],
  [16, 30],
  [31, 45],
  [46, 60],
  [61, 75],
  [76, 90],
  [91, 127],
];

interface FarmRow {
  monster_id: number;
  name_en: string;
  level: number;
  hp: number | null;
  base_exp: number | null;
  exp_per_hp: number | null;
  image_url: string | null;
  is_aggressive: boolean | null;
}

export default async function FarmGuidePage() {
  const db = supabaseBrowser();
  const { data: rowsData, error: rowsError } = await fetchAllRows<FarmRow>((from, to) =>
    db
      .from('monster_farming_stats')
      .select('monster_id, name_en, level, hp, base_exp, exp_per_hp, image_url, is_aggressive')
      .order('monster_id')
      .range(from, to),
  );
  if (rowsError) console.error('farm guide stats query failed', rowsError);
  const rows = rowsData ?? [];
  const { data: spawnsData, error: spawnsError } = await fetchAllRows<{ monster_id: number; map_display_name: string | null }>((from, to) =>
    db.from('monster_spawns').select('monster_id, map_display_name').order('monster_id').range(from, to),
  );
  if (spawnsError) console.error('farm guide spawns query failed', spawnsError);
  const spawnByMonster = new Map<number, string>();
  for (const s of spawnsData ?? []) {
    if (!spawnByMonster.has(s.monster_id) && s.map_display_name) spawnByMonster.set(s.monster_id, s.map_display_name);
  }

  const clean = rows.filter((r) => !isCVariant(r.name_en) && (r.exp_per_hp ?? 0) > 0);
  const perBracket = BRACKETS.map(([lo, hi]) => ({
    lo,
    hi,
    top: clean
      .filter((r) => r.level >= lo && r.level <= hi)
      .sort((a, b) => (b.exp_per_hp ?? 0) - (a.exp_per_hp ?? 0))
      .slice(0, 5),
  })).filter((b) => b.top.length > 0);

  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'หน้าแรก', path: '/' },
          { name: 'จุดฟาร์มแนะนำ', path: '/tools/farm-guide' },
        ])}
      />
      <h1 className="pagehead__title">จุดฟาร์มแนะนำตามเลเวล Ragnarok Zero</h1>
      <p className="muted" style={{ marginTop: 8, maxWidth: '70ch' }}>
        มอนสเตอร์ที่ EXP ต่อ HP คุ้มสุดของแต่ละช่วงเลเวล คิดจากข้อมูลเกมจริงทั้ง 524 ตัว
        อัปเดตตามฐานข้อมูลเสมอ — อยากได้ตัวเลขเฉพาะเลเวลคุณเป๊ะๆ ใช้{' '}
        <Link href="/">ตัวค้นหน้าแรก</Link> หรือกรอกตัวละครที่แถบด้านบนแล้วทุกตารางจะคิดเป็น
        ของคุณเอง
      </p>

      {perBracket.map(({ lo, hi, top }) => (
        <section key={lo} className="card" style={{ marginTop: 16 }}>
          <h2 className="section-title">เลเวล {lo}–{hi} ตีอะไรดี</h2>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ marginTop: 10 }}>
              <thead>
                <tr>
                  <th>มอนสเตอร์</th>
                  <th className="num">Lv</th>
                  <th className="num">HP</th>
                  <th className="num">Base EXP</th>
                  <th>เจอได้ที่</th>
                </tr>
              </thead>
              <tbody>
                {top.map((r) => (
                  <tr key={r.monster_id}>
                    <td data-label="">
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        {r.image_url && (
                          <img loading="lazy" decoding="async" src={r.image_url} alt="" width={24} height={24} style={{ imageRendering: 'pixelated' }} />
                        )}
                        <Link href={`/database/monsters/${r.monster_id}`}>{r.name_en}</Link>
                        <AggroBadge monster={{ is_aggressive: r.is_aggressive, atk_max: null }} />
                      </span>
                    </td>
                    <td data-label="Lv" className="num">{r.level}</td>
                    <td data-label="HP" className="num">{r.hp && r.hp > 0 ? r.hp.toLocaleString() : '—'}</td>
                    <td data-label="Base EXP" className="num">{r.base_exp && r.base_exp > 0 ? r.base_exp.toLocaleString() : '—'}</td>
                    <td data-label="เจอได้ที่">{spawnByMonster.get(r.monster_id) ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ marginTop: 8 }}>
            <Link className="chiplink" href={`/?level=${Math.round((lo + hi) / 2)}&range=${Math.ceil((hi - lo) / 2)}#results`}>
              ดูจัดอันดับเต็มช่วง {lo}–{hi} →
            </Link>
          </p>
        </section>
      ))}

      <p className="source-note" style={{ marginTop: 16 }}>
        จัดอันดับด้วย EXP ต่อ HP (ฆ่าเร็ว-ได้เยอะ) · มอน Challenge (C1–C9) ไม่รวม ·
        ตัวที่โจมตีก่อนมีป้ายเตือน เช็คสกิลอันตรายในหน้ามอนก่อนไปจริง
      </p>
    </main>
  );
}
