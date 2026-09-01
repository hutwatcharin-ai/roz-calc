// app/database/quests/[town]/page.tsx
//
// One town's quests on one page. Each quest is a block with id="q<questId>",
// so a single quest is shareable as /database/quests/louyang#q12424 without
// existing as a page of its own -- the design's answer to 766 thin pages.

import { linkItemRefs } from '@/lib/quest-item-refs';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase';
import PageHeader from '@/components/PageHeader';
import JsonLd from '@/components/JsonLd';
import { breadcrumbJsonLd } from '@/lib/jsonld';
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

export default async function QuestTownPage({
  params,
  searchParams,
}: {
  params: { town: string };
  searchParams: { type?: string };
}) {
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

  const allQuests = (data ?? []) as QuestRow[];
  if (allQuests.length === 0) notFound();

  // Quest-giver NPC sprites (quest_npcs, mirrored from the public rozerodb
  // pages -- 81 quests have one). Missing rows just render no sprite.
  const { data: npcRows } = await db
    .from('quest_npcs')
    .select('quest_id, sprite_code')
    .in('quest_id', allQuests.map((q) => q.id));
  const npcByQuest = new Map((npcRows ?? []).map((n) => [n.quest_id, n.sprite_code]));

  // Type chips are derived from what this town actually has, so a filter that
  // would show nothing is never offered. The whole hub stays one page; this
  // narrows it without changing any quest's canonical anchor.
  const typesHere = [...new Set(allQuests.map((q) => q.type))].sort();
  const typeFilter = typesHere.includes(searchParams.type ?? '') ? (searchParams.type as string) : '';
  const quests = typeFilter ? allQuests.filter((q) => q.type === typeFilter) : allQuests;

  // Anchors only link within this hub: chains can cross hubs, and a dead #q
  // anchor silently scrolls nowhere, which reads as a broken page.
  const idsHere = new Set(allQuests.map((q) => q.id));
  const label = hubLabel(params.town, allQuests.find((q) => q.zone)?.zone ?? null);

  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <nav className="crumbs" aria-label="ตำแหน่งหน้า">
        <Link href="/database/quests">เควส</Link>
        <span className="crumbs__sep" aria-hidden="true">›</span>
        <span className="crumbs__here">{label}</span>
      </nav>

      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'หน้าแรก', path: '/' },
          { name: 'เควส', path: '/database/quests' },
          { name: label, path: `/database/quests/${params.town}` },
        ])}
      />
      <PageHeader
        title={`เควส ${label}`}
        lead={`${typeFilter ? `${quests.length} จาก ${allQuests.length}` : allQuests.length} เควส · กดชื่อเควสเพื่อคัดลอกลิงก์เจาะรายเควสได้`}
        source={
          <>
            <strong>ที่มา:</strong> ข้อความเควสจากไฟล์เกม ภาษาอังกฤษตามต้นฉบับ ·
            พิกัดคือจุดที่เกมผูกไว้กับเควส ไม่ใช่ทุกเควสจะมี
          </>
        }
      />

      {typesHere.length > 1 && (
        <nav className="explorerow" aria-label="กรองตามประเภทเควส" style={{ marginTop: 14 }}>
          <Link href={`/database/quests/${params.town}`} className="chiplink" aria-current={typeFilter === '' ? 'true' : undefined} style={typeFilter === '' ? { borderColor: 'var(--cyan)', color: 'var(--text)' } : undefined}>
            ทุกประเภท
          </Link>
          {typesHere.map((t) => (
            <Link
              key={t}
              href={`/database/quests/${params.town}?type=${encodeURIComponent(t)}`}
              className="chiplink"
              aria-current={typeFilter === t ? 'true' : undefined}
              style={typeFilter === t ? { borderColor: 'var(--cyan)', color: 'var(--text)' } : undefined}
            >
              {TYPE_LABELS[t] ?? t}
            </Link>
          ))}
        </nav>
      )}

      {quests.map((quest) => (
        <section key={quest.id} id={`q${quest.id}`} className="card" style={{ marginTop: 14 }}>
          <div className="pagehead__row">
            <h2 className="section-title" style={{ margin: 0 }}>
              {/* One language per heading: the bilingual concatenation made 32
                  near-identical wall-of-text H2s per page (audit M3). Thai
                  leads when translated; the EN name moves to the meta line. */}
              <a href={`#q${quest.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                {quest.name_th ?? quest.name}
              </a>
            </h2>
            <span className="tag">{TYPE_LABELS[quest.type] ?? quest.type}</span>
          </div>

          <p className="muted" style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {npcByQuest.has(quest.id) && (
              <img
                className="npcsprite"
                src={`/images/npcs/${(npcByQuest.get(quest.id) as string).toLowerCase()}.gif`}
                alt=""
                height={42}
              />
            )}
            <span>
              {quest.name_th && <span>{quest.name}</span>}
            เควส #{quest.id}
              {npcByQuest.has(quest.id) && (
                <>
                  {' · '}NPC <span className="mono">{npcByQuest.get(quest.id)}</span>
                </>
              )}
              {quest.map_code && (
                <>
                  {' · '}แมพ <span className="mono">{quest.map_code}</span>
                  {quest.coord_x !== null && quest.coord_y !== null && (
                    <span className="mono"> ({quest.coord_x}, {quest.coord_y})</span>
                  )}
                </>
              )}
            </span>
          </p>

          {/* Thai leads once translated; the English original stays visible in
              small type because the in-game client is English -- a player has
              to match names and objects against what the game shows them. */}
          {(quest.objective_th ?? quest.objective) && (
            <p style={{ marginTop: 6, lineHeight: 1.55 }}>
              <strong>เป้าหมาย:</strong> {linkItemRefs((quest.objective_th ?? quest.objective) as string)}
            </p>
          )}
          {quest.description_th ? (
            <>
              <p style={{ marginTop: 6, maxWidth: '70ch', lineHeight: 1.55 }}>{linkItemRefs(quest.description_th)}</p>
              {quest.description && (
                <p className="muted" style={{ marginTop: 3, maxWidth: '70ch', fontSize: 13, lineHeight: 1.5 }}>{quest.description}</p>
              )}
            </>
          ) : (
            quest.description && <p className="muted" style={{ marginTop: 8, maxWidth: '70ch' }}>{linkItemRefs(quest.description)}</p>
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
