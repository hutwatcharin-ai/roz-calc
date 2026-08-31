// app/database/quests/[town]/page.tsx
//
// One town's quests on one page. Each quest is a block with id="q<questId>",
// so a single quest is shareable as /database/quests/louyang#q12424 without
// existing as a page of its own -- the design's answer to 766 thin pages.

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase';
import PageHeader from '@/components/PageHeader';
import { hubLabel } from '@/lib/quest-towns';

export const revalidate = 86400;

const TYPE_LABELS: Record<string, string> = {
  story: 'เนื้อเรื่อง',
  kill: 'ล่ามอนสเตอร์',
  fetch: 'หาของ',
  talk: 'พูดคุย',
};

interface QuestRow {
  id: number;
  name: string;
  name_th: string | null;
  objective_th: string | null;
  description_th: string | null;
  map_code: string | null;
  coord_x: number | null;
  coord_y: number | null;
  zone: string | null;
  type: string;
  objective: string | null;
  description: string | null;
  chain_name: string | null;
  chain_next_id: number | null;
}

export async function generateMetadata({ params }: { params: { town: string } }) {
  const label = hubLabel(params.town);
  return {
    title: `เควส ${label}`,
    description: `เควส Ragnarok Zero Global ใน ${label} — จุดรับเควส พิกัด เงื่อนไข และสายเควสต่อเนื่อง ครบทุกเควสในหน้าเดียว`,
  };
}

export default async function QuestTownPage({ params }: { params: { town: string } }) {
  const db = supabaseBrowser();
  const { data, error } = await db
    .from('quests')
    .select('id, name, name_th, map_code, coord_x, coord_y, zone, type, objective, objective_th, description, description_th, chain_name, chain_next_id')
    .eq('town_key', params.town)
    .order('id');

  if (error) {
    console.error('quest town query failed', error);
    return <main className="shell" style={{ paddingBlock: 32 }}>เกิดข้อผิดพลาด ลองใหม่อีกครั้ง</main>;
  }

  const quests = (data ?? []) as QuestRow[];
  if (quests.length === 0) notFound();

  // Anchors only link within this hub: chains can cross hubs, and a dead #q
  // anchor silently scrolls nowhere, which reads as a broken page.
  const idsHere = new Set(quests.map((q) => q.id));
  const label = hubLabel(params.town, quests.find((q) => q.zone)?.zone ?? null);

  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <nav className="crumbs" aria-label="ตำแหน่งหน้า">
        <Link href="/database/quests">เควส</Link>
        <span className="crumbs__sep" aria-hidden="true">›</span>
        <span className="crumbs__here">{label}</span>
      </nav>

      <PageHeader
        title={`เควส ${label}`}
        lead={`${quests.length} เควส · กดชื่อเควสเพื่อคัดลอกลิงก์เจาะรายเควสได้`}
        source={
          <>
            <strong>ที่มา:</strong> ข้อความเควสจากไฟล์เกม ภาษาอังกฤษตามต้นฉบับ ·
            พิกัดคือจุดที่เกมผูกไว้กับเควส ไม่ใช่ทุกเควสจะมี
          </>
        }
      />

      {quests.map((quest) => (
        <section key={quest.id} id={`q${quest.id}`} className="card" style={{ marginTop: 14 }}>
          <div className="pagehead__row">
            <h2 className="section-title" style={{ margin: 0 }}>
              <a href={`#q${quest.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                {quest.name}
                {quest.name_th && <span className="muted" style={{ fontWeight: 400, fontSize: 14 }}> · {quest.name_th}</span>}
              </a>
            </h2>
            <span className="tag">{TYPE_LABELS[quest.type] ?? quest.type}</span>
          </div>

          <p className="muted" style={{ marginTop: 6 }}>
            เควส #{quest.id}
            {quest.map_code && (
              <>
                {' · '}แมพ <span className="mono">{quest.map_code}</span>
                {quest.coord_x !== null && quest.coord_y !== null && (
                  <span className="mono"> ({quest.coord_x}, {quest.coord_y})</span>
                )}
              </>
            )}
          </p>

          {/* Thai leads once translated; the English original stays visible in
              small type because the in-game client is English -- a player has
              to match names and objects against what the game shows them. */}
          {(quest.objective_th ?? quest.objective) && (
            <p style={{ marginTop: 8 }}>
              <strong>เป้าหมาย:</strong> {quest.objective_th ?? quest.objective}
            </p>
          )}
          {quest.description_th ? (
            <>
              <p style={{ marginTop: 8, maxWidth: '70ch' }}>{quest.description_th}</p>
              {quest.description && (
                <p className="muted" style={{ marginTop: 4, maxWidth: '70ch', fontSize: 13 }}>{quest.description}</p>
              )}
            </>
          ) : (
            quest.description && <p className="muted" style={{ marginTop: 8, maxWidth: '70ch' }}>{quest.description}</p>
          )}

          {quest.chain_next_id !== null && (
            <p className="muted" style={{ marginTop: 8 }}>
              สายเควสถัดไป:{' '}
              {idsHere.has(quest.chain_next_id) ? (
                <a href={`#q${quest.chain_next_id}`}>{quest.chain_name ?? `#${quest.chain_next_id}`}</a>
              ) : (
                <span>{quest.chain_name ?? `#${quest.chain_next_id}`} (อยู่หน้าเมืองอื่น)</span>
              )}
            </p>
          )}
        </section>
      ))}
    </main>
  );
}
