// app/database/maps/[code]/page.tsx
import '../page.css';
import Link from 'next/link';
import JsonLd from '@/components/JsonLd';
import { breadcrumbJsonLd } from '@/lib/jsonld';
import type { Metadata } from 'next';
import { cache } from 'react';
import { notFound, permanentRedirect } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase';
import MapMonsterTable from '@/components/MapMonsterTable';
import MapWarps from '@/components/MapWarps';
import { isCVariant } from '@/lib/c-variant';
import { getMapCanonical } from '@/lib/map-canonical';
import { mapImage } from '@/lib/map-image';
import { naviCommand } from '@/lib/rozglobal-guides';
import { ALL_NPCS } from '@/lib/npcs';
import { fetchAllRows } from '@/lib/fetch-all-rows';
import { itemHref } from '@/lib/item-href';
import { notableDrops, type MapDropRow, type NotableDrop } from '@/lib/map-drops';
import { townByCode, townPlaces, type Town } from '@/lib/towns';
import { mapWarps, warpMapName } from '@/lib/map-warps';
import type { Npc } from '@/lib/npcs';

export const revalidate = 86400;

// Empty on purpose: no paths are prebuilt (build stays fast), but the mere
// presence of generateStaticParams switches the route from per-request SSR to
// on-demand ISR -- first hit renders, later hits come from the page cache.
export async function generateStaticParams() {
  return [];
}


// Shared by generateMetadata and the page body so one request does one query.
// Returns the raw { data, error } so each caller keeps its own handling.
const getMapSpawns = cache(async (code: string) => {
  return await supabaseBrowser()
    .from('monster_spawns')
    .select('map_display_name, monsters(id, name_en, level, hp, base_exp, image_url, is_aggressive, is_mvp, atk_max, hit_100, flee_95, element)')
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
  if (!data || data.length === 0) {
    const town = townByCode(code);
    if (!town) return { title: 'ไม่พบแมพนี้' };
    const shown = town.nameTh ? `${town.nameTh} (${town.nameEn})` : town.nameEn;
    if (town.kind === 'passage') {
      return {
        title: `${shown} — ทางผ่าน วาร์ป /navi`,
        description: `${town.nameEn} (${code}) ใน RO Zero: แมพทางผ่านเข้าดันเจี้ยน วาร์ปไปที่ไหนบ้าง พร้อมพิกัด /navi และ NPC ในแมพ`,
      };
    }
    return {
      title: `${shown} — เมือง วาร์ป NPC ร้านค้า`,
      description: `เมือง ${town.nameEn} (${code}) ใน RO Zero: แผนที่ย่อพร้อมจุดวาร์ปออกไปแมพรอบเมือง พิกัด /navi รายชื่อ NPC ร้านค้า และเควสในเมือง`,
    };
  }

  const name = data.find((r) => r.map_display_name)?.map_display_name ?? code;
  return {
    title: `${name} — มอนสเตอร์ในแมพนี้`,
    description: `${name} (${code}) มีมอนสเตอร์ ${data.length} ชนิด ดูเลเวล HP EXP และของที่ดรอปได้ใน RO Zero Thai`,
  };
}

export default async function MapDetailPage({ params }: { params: { code: string } }) {
  const code = decodeURIComponent(params.code);

  // Channel copies (gef_f10_a and _b against gef_fild10) hold the same
  // monsters in the same numbers -- 118 pages of identical content across
  // different URLs. They send the reader to the one page instead. An event
  // channel (_z, one monster more) or a boss room (b_, different monster) is
  // not a copy and keeps its own page; the rule is in lib/map-variants.ts and
  // reads the monster set, never the code's shape.
  const canonical = await getMapCanonical();
  const owner = canonical.byCode[code];
  if (owner && owner !== code) {
    permanentRedirect(`/database/maps/${encodeURIComponent(owner)}`);
  }

  const { data: spawns, error } = await getMapSpawns(code);

  if (error) {
    console.error('map detail query failed', error);
    // Thrown, not rendered: these pages are ISR (revalidate 86400), and a
    // rendered "error, try again" is a successful render that gets cached for
    // a day. Seen 7 Sep 2026 on a transient Supabase timeout. A throw goes to
    // app/error.tsx and is never cached.
    throw new Error(`map detail query failed: ${error.message}`);
  }

  // A clean query returning nothing is a genuine 404 -- unlike the error
  // branch above, which must never become one.
  if (!spawns || spawns.length === 0) {
    // A town has no monsters and still a page (lib/towns).
    const town = townByCode(code);
    if (town) return <TownView town={town} />;
    notFound();
  }

  const name = spawns.find((s: any) => s.map_display_name)?.map_display_name ?? code;
  const monsters = spawns
    .map((s: any) => s.monsters)
    .filter(Boolean)
    .sort((a: any, b: any) => a.level - b.level);
  // Champions (Swift Poring...) spawn here one or two at a time among the
  // normal monsters; the roster shows them, marked, and counts them apart.
  const cCount = monsters.filter((m: any) => isCVariant(m.name_en)).length;
  // Not every map has a picture, so this is null on 149 of them and the block
  // below disappears rather than leaving a broken image behind.
  const picture = mapImage(code);

  // Who else is standing here, and what there is to do here. A map page listed
  // its monsters and nothing else, while 78 of them have an NPC on them and 84
  // carry a quest -- both facts this site already held and never showed.
  const npcsHere = ALL_NPCS.filter((npc) => npc.map === code && npc.hasName);
  const { data: questsHere, error: questError } = await supabaseBrowser()
    .from('quests')
    .select('id, name, name_th, town_key, type')
    .eq('map_code', code)
    .order('id');
  if (questError) console.error('map quest query failed', questError);

  // What the map is worth farming for. Two reads keyed on this map's monsters:
  // their drops, and every spawn count they have anywhere (the boss test needs
  // the largest, not just this map's). A failure hides the section rather
  // than showing a list that is quietly missing half its rows.
  const monsterIds = [...new Set(monsters.map((m: any) => m.id as number))];
  const [dropsRead, countsRead] = await Promise.all([
    fetchAllRows<any>((from, to) =>
      supabaseBrowser()
        .from('monster_drops')
        .select('id, monster_id, rate, items(id, name_en, icon_url, category)')
        .in('monster_id', monsterIds)
        .order('id')
        .range(from, to),
    ),
    fetchAllRows<{ id: number; monster_id: number; amount: number | null }>((from, to) =>
      supabaseBrowser()
        .from('monster_spawns')
        .select('id, monster_id, amount')
        .in('monster_id', monsterIds)
        .order('id')
        .range(from, to),
    ),
  ]);
  if (dropsRead.error) console.error('map drops query failed', dropsRead.error);
  if (countsRead.error) console.error('map spawn count query failed', countsRead.error);
  const largest = new Map<number, number>();
  for (const row of countsRead.data ?? []) {
    if (row.amount === null) continue;
    largest.set(row.monster_id, Math.max(largest.get(row.monster_id) ?? 0, row.amount));
  }
  const drops = dropsRead.error || countsRead.error
    ? null
    : notableDrops(
        monsters.map((m: any) => ({ id: m.id, name_en: m.name_en, is_mvp: m.is_mvp, largestSpawn: largest.get(m.id) ?? null })),
        (dropsRead.data ?? []) as MapDropRow[],
      );

  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <nav className="crumbs" aria-label="ตำแหน่งหน้า">
        <Link href="/database/maps">แมพ</Link>
        <span className="crumbs__sep" aria-hidden="true">›</span>
        <span className="crumbs__here">{name}</span>
      </nav>

      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'หน้าแรก', path: '/' },
          { name: 'แมพ', path: '/database/maps' },
          { name, path: `/database/maps/${params.code}` },
        ])}
      />
      <p className="arckicker">MAP · {code}</p>
      <h1 className="pagehead__title arcname">{name}</h1>
      <p className="mono" style={{ color: 'var(--faint)', marginTop: 6 }}>
        {code}
        {/* The channels this page stands for. Naming them keeps the fold
            honest: a player who typed gef_f10_a into the URL and landed here
            can see why. */}
        {(canonical.variantsOf.get(code) ?? []).length > 0 && (
          <span> · อีก {canonical.variantsOf.get(code)!.length} ช่อง: {canonical.variantsOf.get(code)!.join(', ')}</span>
        )}
      </p>
      <p style={{ color: 'var(--dim)', marginTop: 10 }}>
        มอนสเตอร์ {monsters.length - cCount} ชนิดในแมพนี้
        {cCount > 0 && ` + มอนแชมเปียน ${cCount} ชนิด (ตัวพิเศษ HP/EXP สูง เกิดปนทีละ 1–2 ตัว)`}
      </p>
      {/* Picture beside the table on wide screens: the map page used to
          leave its right half empty (UX critique, 6 Sep). Stacked on phones. */}
      <div className={picture ? 'maplayout' : undefined}>
      {picture && (
        <figure className={picture.kind === 'full' ? 'mapimg mapimg--full mapimg--stage' : 'mapimg mapimg--stage'}>
          <span className="mapimg__stage" aria-hidden="true">STAGE</span>
          {/* Two sources: prontera.info's ~512 px terrain render when it has
              the map, else ratemyserver's 205 px minimap (scaled up, kept
              crisp). Decorative next to the monster table, so the caption
              carries the credit and the alt text stays short. Not lazy -- it
              sits above the fold, and a lazy image there paints as an empty
              box first. */}
          <img
            src={picture.src}
            alt={`แผนที่ ${name}`}
            width={picture.width}
            height={picture.height}
            decoding="async"
          />
          <figcaption>
            {picture.credit === 'client' ? 'แผนที่ย่อ · จากไฟล์ของตัวเกม' : picture.kind === 'full' ? 'แผนที่ · ที่มา prontera.info' : 'แผนที่ย่อ · ที่มา ratemyserver.net'}
            {picture.fromCode && ` (ไฟล์ชื่อ ${picture.fromCode})`}
          </figcaption>
        </figure>
      )}
      <div className="maplayout__table">
        <MapMonsterTable monsters={monsters} cCount={cCount} />
      </div>
      </div>

      <MapWarps code={code} name={name} />

      {drops && (drops.cards.length > 0 || drops.gear.length > 0) && (
        <div className="card" style={{ marginTop: 20 }}>
          <h2 className="section-title">ไอเทมเด่นที่ดรอปในแมพนี้</h2>
          <p className="muted" style={{ marginTop: 6, fontSize: 13 }}>
            การ์ดที่หาได้ในเกมตอนนี้ และอาวุธกับเกราะ เรียงตามโอกาสดรอป · นับเฉพาะมอนธรรมดา
          </p>
          {drops.cards.length > 0 && <DropGroup title="การ์ด" rows={drops.cards} />}
          {drops.gear.length > 0 && <DropGroup title="อาวุธและเกราะ" rows={drops.gear} />}
          {drops.bosses.length > 0 && (
            <p className="muted" style={{ marginTop: 12, fontSize: 13 }}>
              ไม่นับของจากบอส ดูที่หน้าบอสแต่ละตัว:{' '}
              {drops.bosses.map((boss, i) => (
                <span key={boss.id}>
                  {i > 0 && ', '}
                  <Link href={`/database/monsters/${boss.id}`}>{boss.name}</Link>
                </span>
              ))}
            </p>
          )}
        </div>
      )}

      {(questsHere ?? []).length > 0 && (
        <div className="card" style={{ marginTop: 20 }}>
          <h2 className="section-title">เควสที่เกิดในแมพนี้ ({questsHere!.length})</h2>
          <QuestList quests={questsHere!} />
        </div>
      )}

      {npcsHere.length > 0 && (
        <div className="card" style={{ marginTop: 20 }}>
          <h2 className="section-title">NPC ในแมพนี้ ({npcsHere.length})</h2>
          <NpcList npcs={npcsHere} />
        </div>
      )}
    </main>
  );
}

function DropGroup({ title, rows }: { title: string; rows: NotableDrop[] }) {
  return (
    <>
      <h3 className="mapdrops__title">{title}</h3>
      <ul className="shoplist">
        {rows.map((row) => (
          <li key={row.itemId} className="shoprow">
            <span className="shoprow__who">
              {row.icon && <img className="mapdrops__icon" src={row.icon} alt="" width={24} height={24} loading="lazy" />}
              <Link href={itemHref(row.itemId, row.category)}>{row.name}</Link>
              <span className="muted">
                {' '}· จาก <Link href={`/database/monsters/${row.monsterId}`}>{row.monsterName}</Link>
                {row.sources > 1 && ` และอีก ${row.sources - 1} ตัว`}
              </span>
            </span>
            <span className="mono mapdrops__rate">{row.rate === null ? '?' : `${row.rate}%`}</span>
          </li>
        ))}
      </ul>
    </>
  );
}

interface QuestRow {
  id: number;
  name: string;
  name_th: string | null;
  town_key: string;
}

function QuestList({ quests }: { quests: QuestRow[] }) {
  return (
    <ul className="shoplist">
      {quests.map((quest) => (
        <li key={quest.id} className="shoprow">
          <span className="shoprow__who">
            <Link href={`/database/quests/${quest.town_key}#q${quest.id}`}>{quest.name_th ?? quest.name}</Link>
            {quest.name_th && <span className="muted" style={{ marginInlineStart: 8, fontSize: 12.5 }}>{quest.name}</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}

function NpcList({ npcs }: { npcs: Npc[] }) {
  return (
    <ul className="shoplist">
      {npcs.map((npc) => (
        <li key={npc.slug} className="shoprow">
          <span className="shoprow__who">
            {npc.sprite && <img className="npcportrait" src={`/images/npcs/${npc.sprite}`} alt="" height={24} />}
            <Link href={`/database/npcs/${npc.slug}`}>{npc.name}</Link>
            {npc.quests.length > 0 && <span className="muted"> · เควส {npc.quests.length}</span>}
            {npc.sells.length > 0 && <span className="muted"> · ขายของ {npc.sells.length} ชนิด</span>}
          </span>
          {naviCommand(npc.map, npc.x, npc.y) && (
            <code className="mono navicmd shoprow__navi">{naviCommand(npc.map, npc.x, npc.y)}</code>
          )}
        </li>
      ))}
    </ul>
  );
}

// A town's page (owner, 6 Oct 2026): no monster table, the rest of a map page
// -- warps, quests, NPCs -- plus the NPCs inside the buildings its doors lead
// to, which is where most of a town's shops and job NPCs stand.
async function TownView({ town }: { town: Town }) {
  const { code } = town;
  const name = town.nameTh ?? town.nameEn;
  const { data: quests, error } = await supabaseBrowser()
    .from('quests')
    .select('id, name, name_th, town_key')
    .eq('map_code', code)
    .order('id');
  if (error) console.error('town quest query failed', error);
  const places = townPlaces(code);
  const npcCount = places.reduce((n, p) => n + p.npcs.length, 0);
  const shops = places.reduce((n, p) => n + p.npcs.filter((npc) => npc.sells.length > 0).length, 0);
  const warps = mapWarps(code);
  const leadsTo = [...(warps?.exits ?? []), ...(warps?.doors ?? [])].filter((e, i, all) => all.findIndex((o) => o.to === e.to) === i);

  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <nav className="crumbs" aria-label="ตำแหน่งหน้า">
        <Link href="/database/maps">แมพ</Link>
        <span className="crumbs__sep" aria-hidden="true">›</span>
        <span className="crumbs__here">{name}</span>
      </nav>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'หน้าแรก', path: '/' },
          { name: 'แมพ', path: '/database/maps' },
          { name, path: `/database/maps/${code}` },
        ])}
      />
      <p className="arckicker">{town.kind === 'passage' ? 'WAY IN' : 'TOWN'} · {code}</p>
      <h1 className="pagehead__title arcname">{name}</h1>
      <p className="mono" style={{ color: 'var(--faint)', marginTop: 6 }}>
        {town.nameTh ? `${town.nameEn} · ${code}` : code}
      </p>
      {town.kind === 'passage' ? (
        // A way through: what it leads to is the point of the page.
        <p style={{ color: 'var(--dim)', marginTop: 10 }}>
          ทางผ่าน · ไม่มีมอนสเตอร์ · ต่อไปได้ที่{' '}
          {leadsTo.map((exit, i) => (
            <span key={exit.to}>
              {i > 0 && ', '}
              {exit.page ? <Link href={`/database/maps/${encodeURIComponent(exit.to)}`}>{warpMapName(exit.to)}</Link> : warpMapName(exit.to)}
            </span>
          ))}
        </p>
      ) : (
        <p style={{ color: 'var(--dim)', marginTop: 10 }}>
          เมือง · ไม่มีมอนสเตอร์{npcCount > 0 && ` · NPC ${npcCount} คน`}{shops > 0 && ` · ร้านค้า ${shops} ร้าน`}
          {(quests ?? []).length > 0 && ` · เควส ${quests!.length}`}
        </p>
      )}

      <MapWarps code={code} name={name} />

      {(quests ?? []).length > 0 && (
        <div className="card" style={{ marginTop: 20 }}>
          <h2 className="section-title">{town.kind === 'passage' ? 'เควสที่เกิดในแมพนี้' : 'เควสที่เกิดในเมืองนี้'} ({quests!.length})</h2>
          <QuestList quests={quests!} />
        </div>
      )}

      {npcCount > 0 && (
        <div className="card" style={{ marginTop: 20 }}>
          <h2 className="section-title">{town.kind === 'passage' ? 'NPC ในแมพนี้' : 'NPC ในเมือง'} ({npcCount})</h2>
          {places.map((place) =>
            place.npcs.length === 0 ? null : (
              <div key={place.code}>
                {places.length > 1 && (
                  <h3 className="mapdrops__title">
                    {place.name || (town.kind === 'passage' ? 'ในแมพนี้' : 'ในเมือง')} <span className="muted mono" style={{ fontSize: 12 }}>{place.code}</span>
                  </h3>
                )}
                <NpcList npcs={place.npcs} />
              </div>
            ),
          )}
        </div>
      )}
    </main>
  );
}
