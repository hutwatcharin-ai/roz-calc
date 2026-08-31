// app/database/quests/page.tsx
//
// The quest index: one card per hub, plus a search across every quest name.
// Hubs, not 766 detail pages, on purpose -- the design folds quests into
// town-sized pages so none of them is thin (spec 2026-08-31-quests).

import Link from 'next/link';
import { supabaseBrowser } from '@/lib/supabase';
import PageHeader from '@/components/PageHeader';
import FilterState, { EmptyState } from '@/components/FilterState';
import { escapeLikePattern } from '@/lib/like-escape';
import { hubLabel } from '@/lib/quest-towns';

export const metadata = {
  title: 'เควส Ragnarok Zero',
  description:
    'เควสทั้งหมดของ Ragnarok Zero Global จัดกลุ่มตามเมือง — Louyang, Comodo, Payon, Ayothaya และอื่นๆ พร้อมจุดรับเควส พิกัด และสายเควสต่อเนื่อง',
};

export const revalidate = 86400;

const TYPE_LABELS: Record<string, string> = {
  story: 'เนื้อเรื่อง',
  kill: 'ล่ามอนสเตอร์',
  fetch: 'หาของ',
  talk: 'พูดคุย',
};

export default async function QuestIndexPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = searchParams.q ?? '';
  const db = supabaseBrowser();

  // Hub cards come from grouping the whole table; 766 rows is one query.
  const { data: quests, error } = await db
    .from('quests')
    .select('id, name, zone, type, town_key')
    .order('id');

  if (error) {
    console.error('quests query failed', error);
    return (
      <main className="shell" style={{ paddingBlock: 32 }}>
        <PageHeader title="เควส" />
        <p className="muted">โหลดข้อมูลเควสไม่สำเร็จ ลองใหม่อีกครั้ง</p>
      </main>
    );
  }

  const rows = quests ?? [];

  const hubs = new Map<string, { label: string; count: number }>();
  for (const quest of rows) {
    const existing = hubs.get(quest.town_key);
    if (existing) existing.count += 1;
    else hubs.set(quest.town_key, { label: hubLabel(quest.town_key, quest.zone), count: 1 });
  }
  const hubList = [...hubs.entries()].sort((a, b) => b[1].count - a[1].count);

  // The search is a name filter over the same rows -- no second query, and the
  // results deep-link into the hub pages by anchor.
  const needle = q.trim().toLowerCase();
  const matches =
    needle === ''
      ? []
      : rows.filter((quest) => quest.name.toLowerCase().includes(escapeLikePattern(needle).toLowerCase())).slice(0, 50);

  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <PageHeader
        title="เควส"
        lead="จัดกลุ่มตามเมือง — เปิดเมืองที่กำลังเล่นอยู่ แล้วเควสทุกตัวในเมืองนั้นอยู่หน้าเดียวกัน"
        source={
          <>
            <strong>ที่มา:</strong> ข้อความเควสจากไฟล์เกม (ผ่านชุดข้อมูลสาธารณะของ rozerodb) ·
            ภาษาอังกฤษตามต้นฉบับ คำแปลไทยจะทยอยตามมา
          </>
        }
      />

      <form className="filterbar">
        <input type="search" name="q" defaultValue={q} placeholder="ค้นชื่อเควส (ภาษาอังกฤษ)" aria-label="ค้นชื่อเควส" />
        <button type="submit" className="btn">ค้นหา</button>
      </form>

      <FilterState
        count={needle === '' ? rows.length : matches.length}
        unit="เควส"
        filters={[{ label: 'คำค้น', value: q }]}
        clearHref="/database/quests"
      />

      {needle !== '' &&
        (matches.length === 0 ? (
          <div className="card">
            <EmptyState what={q} clearHref="/database/quests" />
          </div>
        ) : (
          <div className="card" style={{ marginBottom: 20 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>เควส</th>
                  <th>ชนิด</th>
                  <th>เมือง</th>
                </tr>
              </thead>
              <tbody>
                {matches.map((quest) => (
                  <tr key={quest.id}>
                    <td data-label="">
                      <Link href={`/database/quests/${quest.town_key}#q${quest.id}`}>{quest.name}</Link>
                    </td>
                    <td data-label="ชนิด">{TYPE_LABELS[quest.type] ?? quest.type}</td>
                    <td data-label="เมือง">{hubLabel(quest.town_key, quest.zone)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

      <div className="entrycards" style={{ marginTop: 8 }}>
        {hubList.map(([key, hub]) => (
          <Link key={key} href={`/database/quests/${key}`} className="card entrycard">
            <strong>{hub.label}</strong>
            <span className="muted">{hub.count} เควส</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
