// app/database/npcs/[slug]/page.tsx
//
// One NPC: where they stand, and what they hand out. The quests are matched to
// our own quest table by name so the links land on the quest hub anchor a
// player can read in Thai; a quest the source names and our table does not
// have yet is still listed, in plain text, because "this NPC gives Critura
// Academy - 1" is true whether or not we have translated it.
import Link from 'next/link';
import { notFound } from 'next/navigation';
import JsonLd from '@/components/JsonLd';
import PageHeader from '@/components/PageHeader';
import { breadcrumbJsonLd } from '@/lib/jsonld';
import { naviCommand } from '@/lib/rozglobal-guides';
import { supabaseBrowser } from '@/lib/supabase';
import { ALL_NPCS, npcBySlug, questKey } from '@/lib/npcs';

export const revalidate = 86400;

export function generateStaticParams() {
  // Only the ones with a real name get a page; the rest stay rows on the
  // index. Small enough to prerender the lot.
  return ALL_NPCS.filter((npc) => npc.hasName).map((npc) => ({ slug: npc.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const npc = npcBySlug(params.slug);
  if (!npc) return { title: 'ไม่พบ NPC ตัวนี้' };
  const place = npc.mapName ?? npc.map ?? '';
  return {
    title: `${npc.name} — NPC อยู่ที่ไหน ให้เควสอะไร`,
    description: `${npc.name} NPC ใน Ragnarok Zero Global${place ? ` ยืนอยู่ที่ ${place}` : ''}${
      npc.x !== null && npc.y !== null ? ` พิกัด ${npc.x}/${npc.y}` : ''
    }${npc.quests.length ? ` · ให้เควส ${npc.quests.length} เควส` : ''} พร้อมคำสั่ง /navi สำหรับเดินไปหา`,
  };
}

export default async function NpcDetailPage({ params }: { params: { slug: string } }) {
  const npc = npcBySlug(params.slug);
  if (!npc || !npc.hasName) notFound();

  // Our quest rows, for the ones whose names line up. Matching is on text, so
  // it is done here rather than in SQL: the source writes curly apostrophes.
  const names = npc.quests.map((quest) => quest.name);
  const { data: questRows, error } = names.length
    ? await supabaseBrowser().from('quests').select('id, name, name_th, town_key, type').in('name', names)
    : { data: [], error: null };
  if (error) console.error('npc quest lookup failed', error);
  const ours = new Map((questRows ?? []).map((row) => [questKey(row.name), row]));

  const navi = naviCommand(npc.map, npc.x, npc.y);

  return (
    <main className="shell" style={{ paddingBlock: 32, maxWidth: 820 }}>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'หน้าแรก', path: '/' },
          { name: 'NPC', path: '/database/npcs' },
          { name: npc.name, path: `/database/npcs/${npc.slug}` },
        ])}
      />
      <nav className="crumbs" aria-label="ตำแหน่งหน้า">
        <Link href="/database/npcs">NPC</Link>
        <span className="crumbs__sep" aria-hidden="true">›</span>
        <span className="crumbs__here">{npc.name}</span>
      </nav>

      <PageHeader title={npc.name} />

      <section className="card" style={{ marginTop: 14 }}>
        <h2 className="section-title">อยู่ที่ไหน</h2>
        <table className="stat-table" style={{ marginTop: 8 }}>
          <tbody>
            <tr><td>แมพ</td><td className="num">{npc.mapName ?? '—'}</td></tr>
            <tr><td>โค้ดแมพ</td><td className="num mono">{npc.map ?? '—'}</td></tr>
            {npc.x !== null && npc.y !== null && (
              <tr><td>พิกัด</td><td className="num mono">{npc.x}/{npc.y}</td></tr>
            )}
          </tbody>
        </table>
        {navi && (
          <p style={{ marginTop: 10 }}>
            ก๊อป <code className="mono navicmd">{navi}</code> ไปวางในแชต เกมจะขึ้นเส้นนำทางให้เดินตาม
          </p>
        )}
      </section>

      {npc.quests.length > 0 && (
        <section className="card" style={{ marginTop: 14 }}>
          <h2 className="section-title">เควสที่ให้ ({npc.quests.length})</h2>
          <table className="bptable">
            <thead>
              <tr>
                <th>เควส</th>
                <th className="bptable__qty">ประเภท</th>
              </tr>
            </thead>
            <tbody>
              {npc.quests.map((quest) => {
                const row = ours.get(questKey(quest.name));
                return (
                  <tr key={quest.slug ?? quest.name}>
                    <td>
                      {row ? (
                        <Link href={`/database/quests/${row.town_key}#q${row.id}`}>{row.name_th ?? row.name}</Link>
                      ) : (
                        <span>{quest.name}</span>
                      )}
                      {row?.name_th && <span className="muted" style={{ marginInlineStart: 8, fontSize: 12.5 }}>{row.name}</span>}
                    </td>
                    <td className="bptable__qty">{row?.type ?? quest.type ?? '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {npc.quests.some((quest) => !ours.has(questKey(quest.name))) && (
            <p className="muted" style={{ marginTop: 10, fontSize: 12.5 }}>
              เควสที่ไม่มีลิงก์คือเควสที่ฐานข้อมูลเควสของเรายังไม่มี — ชื่อยังใช้ค้นในเกมได้
            </p>
          )}
        </section>
      )}

      {npc.description && (
        <section className="card" style={{ marginTop: 14 }}>
          <h2 className="section-title">คำอธิบาย</h2>
          <p style={{ marginTop: 8, maxWidth: '70ch', lineHeight: 1.6 }}>{npc.description}</p>
        </section>
      )}

      <p className="source-note" style={{ marginTop: 16 }}>
        <strong>ที่มา:</strong> ข้อมูล NPC ฝั่ง Zero จาก prontera.info เก็บเมื่อ 3 ก.ย. 2569 ·
        ตำแหน่งอาจเปลี่ยนได้เมื่อมีแพทช์ใหม่
      </p>
    </main>
  );
}
