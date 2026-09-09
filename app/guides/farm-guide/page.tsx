import Link from 'next/link';
import MonsterLink from '@/components/MonsterLink';
import { supabaseBrowser } from '@/lib/supabase';
import AggroBadge from '@/components/AggroBadge';
import JsonLd from '@/components/JsonLd';
import { breadcrumbJsonLd } from '@/lib/jsonld';
import { isCVariant } from '@/lib/c-variant';
import { fetchAllRows } from '@/lib/fetch-all-rows';
import { countText, monsterCounts } from '@/lib/counts';
import { farmBands, farmPicks, unplaceable, type FarmCandidate, type SpawnPlace } from '@/lib/farm-picks';
import { BASE_LEVEL_CAP } from '@/lib/level-cap';
import type { Metadata } from 'next';

// The size is counted, not written: it said 524 while the table held 534
// (8 Sep 2026, lib/counts).
export async function generateMetadata(): Promise<Metadata> {
  const { total } = await monsterCounts();
  const size = total === null ? 'ข้อมูลเกมจริง' : `ข้อมูลเกมจริงทั้ง ${total.toLocaleString('en-US')} ตัว`;
  return {
    title: 'จุดฟาร์มแนะนำตามเลเวล Ragnarok Zero',
    description: `จุดฟาร์ม Ragnarok Zero Global แยกตามช่วงเลเวล — มอนสเตอร์ที่ EXP ต่อ HP คุ้มสุดของแต่ละช่วง พร้อมแมพที่เจอและคำเตือนตัวที่โจมตีก่อน คิดจาก${size}`,
  };
}

export const revalidate = 86400;

// SXO audit (1 Sep): Thai SERP for "จุดฟาร์ม ragnarok zero" has no
// Zero-specific content at all — this page is the narrative layer the raw
// tool cannot rank as. Everything is computed: the bands come from the level
// cap and the rows from monster_farming_stats and monster_spawns, so nothing
// here is hand-maintained and nothing goes stale on its own.
//
// The bands used to run to level 127, which put three of seven sections above
// the cap, and the ranking used to be EXP per HP alone, which recommended a
// plant with eight of them on its best map and a monster whose map holds one.
// lib/farm-picks holds both rules and the reasons.

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
  const counts = await monsterCounts();
  const { data: rowsData, error: rowsError } = await fetchAllRows<FarmRow>((from, to) =>
    db
      .from('monster_farming_stats')
      .select('monster_id, name_en, level, hp, base_exp, exp_per_hp, image_url, is_aggressive')
      .order('monster_id')
      .range(from, to),
  );
  if (rowsError) console.error('farm guide stats query failed', rowsError);
  const rows = rowsData ?? [];
  const { data: spawnsData, error: spawnsError } = await fetchAllRows<{
    monster_id: number;
    map_display_name: string | null;
    amount: number | null;
  }>((from, to) =>
    db.from('monster_spawns').select('monster_id, map_display_name, amount').order('monster_id').range(from, to),
  );
  if (spawnsError) console.error('farm guide spawns query failed', spawnsError);
  const spawns: SpawnPlace[] = (spawnsData ?? []).map((s) => ({
    monsterId: s.monster_id,
    map: s.map_display_name,
    amount: s.amount,
  }));

  const clean: FarmCandidate[] = rows
    .filter((r) => !isCVariant(r.name_en))
    .map((r) => ({
      monsterId: r.monster_id,
      name: r.name_en,
      level: r.level,
      hp: r.hp,
      baseExp: r.base_exp,
      expPerHp: r.exp_per_hp,
      isAggressive: r.is_aggressive,
      imageUrl: r.image_url,
    }));
  const bands = farmBands(BASE_LEVEL_CAP);
  const perBracket = bands
    .map((band) => ({ lo: band.lo, hi: band.hi, top: farmPicks(clean, spawns, band) }))
    .filter((b) => b.top.length > 0);
  const dropped = unplaceable(clean, spawns, BASE_LEVEL_CAP);

  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'หน้าแรก', path: '/' },
          { name: 'จุดฟาร์มแนะนำ', path: '/guides/farm-guide' },
        ])}
      />
      <h1 className="pagehead__title">จุดฟาร์มแนะนำตามเลเวล Ragnarok Zero</h1>
      <p className="muted" style={{ marginTop: 8, maxWidth: '70ch' }}>
        เรียงจาก <strong>EXP ต่อ HP คูณจำนวนตัวในแมพที่หนาที่สุด</strong> — ตีคุ้มอย่างเดียวไม่พอ ต้องมีตัวถัดไปให้ตีด้วย ·
        อยากได้ EXP ต่อชั่วโมงของตัวเอง กรอกดาเมจกับ ASPD ที่{' '}
        <Link href="/tools/leveling-spots">หาจุดเก็บเลเวล</Link>
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
                  {/* Both halves of the ranking are on the row, so a reader can
                      see why it sits where it does. */}
                  <th>แมพที่มีเยอะสุด</th>
                </tr>
              </thead>
              <tbody>
                {top.map((r) => (
                  <tr key={r.monsterId}>
                    <td data-label="">
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        {r.imageUrl && (
                          <img loading="lazy" decoding="async" src={r.imageUrl} alt="" width={24} height={24} style={{ imageRendering: 'pixelated' }} />
                        )}
                        <MonsterLink id={r.monsterId} name={r.name} />
                        <AggroBadge monster={{ is_aggressive: r.isAggressive, atk_max: null }} />
                      </span>
                    </td>
                    <td data-label="Lv" className="num">{r.level}</td>
                    <td data-label="HP" className="num">{r.hp && r.hp > 0 ? r.hp.toLocaleString() : '—'}</td>
                    <td data-label="Base EXP" className="num">{r.baseExp && r.baseExp > 0 ? r.baseExp.toLocaleString() : '—'}</td>
                    <td data-label="แมพที่มีเยอะสุด">
                      {r.bestMap} <span className="muted">{r.amount} ตัว</span>
                    </td>
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
        ช่วงเลเวลหยุดที่ {BASE_LEVEL_CAP} ตามเพดานปัจจุบัน · ไม่รวมมอน Challenge (C1–C9) · ตัวที่โจมตีก่อนมีป้ายเตือน ·{' '}
        <strong>{dropped} ตัวไม่ได้อยู่ในตาราง</strong>เพราะฐานข้อมูลยังไม่รู้ว่ามันเกิดที่แมพไหน — ไม่เอามาแนะนำทั้งที่บอกไม่ได้ว่าไปตีที่ไหน
      </p>
    </main>
  );
}
