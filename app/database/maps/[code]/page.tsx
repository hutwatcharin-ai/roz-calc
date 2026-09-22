// app/database/maps/[code]/page.tsx
import Link from 'next/link';
import JsonLd from '@/components/JsonLd';
import { breadcrumbJsonLd } from '@/lib/jsonld';
import type { Metadata } from 'next';
import { cache } from 'react';
import { notFound, permanentRedirect } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase';
import MapMonsterTable from '@/components/MapMonsterTable';
import { isCVariant } from '@/lib/c-variant';
import { getMapCanonical } from '@/lib/map-canonical';
import { mapImage } from '@/lib/map-image';
import { naviCommand } from '@/lib/rozglobal-guides';
import { ALL_NPCS } from '@/lib/npcs';
import { fetchAllRows } from '@/lib/fetch-all-rows';
import { itemHref } from '@/lib/item-href';
import { notableDrops, type MapDropRow, type NotableDrop } from '@/lib/map-drops';

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
    .select('map_display_name, monsters(id, name_en, level, hp, base_exp, image_url, is_aggressive, is_mvp, atk_max, hit_100, flee_95)')
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
    notFound();
  }

  const name = spawns.find((s: any) => s.map_display_name)?.map_display_name ?? code;
  const monsters = spawns
    .map((s: any) => s.monsters)
    .filter(Boolean)
    .sort((a: any, b: any) => a.level - b.level);
  // Challenge clones stay in the static HTML (this page is ISR) but carry the
  // cvariant class, hidden by CSS until the player opts in via the toggle.
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
      <h1 className="pagehead__title">{name}</h1>
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
        {cCount > 0 && ` (+${cCount} มอน Challenge)`}
      </p>
      {/* Picture beside the table on wide screens: the map page used to
          leave its right half empty (UX critique, 6 Sep). Stacked on phones. */}
      <div className={picture ? 'maplayout' : undefined}>
      {picture && (
        <figure className={picture.kind === 'full' ? 'mapimg mapimg--full' : 'mapimg'}>
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
            {picture.kind === 'full' ? 'แผนที่ · ที่มา prontera.info' : 'แผนที่ย่อ · ที่มา ratemyserver.net'}
            {picture.fromCode && ` (ไฟล์ชื่อ ${picture.fromCode})`}
          </figcaption>
        </figure>
      )}
      <div className="maplayout__table">
        <MapMonsterTable monsters={monsters} cCount={cCount} />
      </div>
      </div>

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
          <ul className="shoplist">
            {questsHere!.map((quest) => (
              <li key={quest.id} className="shoprow">
                <span className="shoprow__who">
                  <Link href={`/database/quests/${quest.town_key}#q${quest.id}`}>{quest.name_th ?? quest.name}</Link>
                  {quest.name_th && <span className="muted" style={{ marginInlineStart: 8, fontSize: 12.5 }}>{quest.name}</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {npcsHere.length > 0 && (
        <div className="card" style={{ marginTop: 20 }}>
          <h2 className="section-title">NPC ในแมพนี้ ({npcsHere.length})</h2>
          <ul className="shoplist">
            {npcsHere.map((npc) => (
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
