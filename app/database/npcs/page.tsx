// app/database/npcs/page.tsx
//
// The NPC index. It exists because two questions had no page: "who do I talk
// to for this quest" and "who is standing in this town". The quest hub knew a
// coordinate and no name; the shop table knew a map code and no town.
//
// Sprite-labelled entries ("1 M Innkeeper") are listed but not linked to a
// page of their own: a page whose whole content is a label the source invented
// from a sprite id is a page with nothing on it.
import Link from 'next/link';
import JsonLd from '@/components/JsonLd';
import PageHeader from '@/components/PageHeader';
import FilterState, { EmptyState } from '@/components/FilterState';
import Pagination from '@/components/Pagination';
import { itemListJsonLd } from '@/lib/jsonld';
import { matches } from '@/lib/smart-search';
import { naviCommand } from '@/lib/rozglobal-guides';
import { ALL_NPCS, npcMaps } from '@/lib/npcs';

export const revalidate = 86400;

const PAGE_SIZE = 60;

export const metadata = {
  title: 'ฐานข้อมูล NPC Ragnarok Zero',
  description:
    'NPC ในเกม Ragnarok Zero Global ทุกตัวที่เก็บข้อมูลได้: ชื่อ แมพ พิกัด คำสั่ง /navi และเควสที่ NPC ตัวนั้นให้ ค้นด้วยชื่อหรือกรองตามเมือง',
};

export default function NpcListPage({
  searchParams,
}: {
  searchParams: { q?: string; map?: string; has?: string; page?: string };
}) {
  const q = (searchParams.q ?? '').trim();
  const allMaps = npcMaps();
  const map = allMaps.some((m) => m.code === searchParams.map) ? (searchParams.map as string) : '';
  const questsOnly = searchParams.has === 'quest';
  const page = Math.max(1, Number(searchParams.page ?? 1) || 1);

  const needle = q.toLowerCase();
  const hit = (npc: (typeof ALL_NPCS)[number]) =>
    !needle || matches(`${npc.name} ${npc.mapName ?? ''} ${npc.quests.map((quest) => quest.name).join(' ')}`, needle);

  // Counts come from what the OTHER filter already leaves, so a chip can never
  // lead to an empty page. Not a theoretical worry: Nordfeld holds 69 NPCs and
  // not one of them gives a quest, so "ให้เควส" plus "Nordfeld" found nobody.
  const searched = ALL_NPCS.filter(hit);
  const questCount = searched.filter((npc) => (!map || npc.map === map) && npc.quests.length > 0).length;
  const mapCounts = new Map<string, number>();
  for (const npc of searched) {
    if (questsOnly && npc.quests.length === 0) continue;
    if (npc.map) mapCounts.set(npc.map, (mapCounts.get(npc.map) ?? 0) + 1);
  }
  const maps = allMaps.filter((m) => (mapCounts.get(m.code) ?? 0) > 0).map((m) => ({ ...m, count: mapCounts.get(m.code) as number }));

  const filtered = searched.filter((npc) => {
    if (map && npc.map !== map) return false;
    if (questsOnly && npc.quests.length === 0) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function href(next: { map?: string; has?: string; page?: number }) {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    const nextMap = next.map ?? map;
    if (nextMap) params.set('map', nextMap);
    const nextHas = next.has ?? (questsOnly ? 'quest' : '');
    if (nextHas) params.set('has', nextHas);
    if (next.page && next.page > 1) params.set('page', String(next.page));
    const qs = params.toString();
    return `/database/npcs${qs ? `?${qs}` : ''}`;
  }

  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      {rows.length > 0 && (
        <JsonLd
          data={itemListJsonLd({
            path: '/database/npcs',
            rows: rows.filter((npc) => npc.hasName).map((npc) => ({ id: npc.slug, name: npc.name })),
            detailPath: (slug) => `/database/npcs/${slug}`,
          })}
        />
      )}
      <PageHeader
        title="ฐานข้อมูล NPC Ragnarok Zero"
        source={
          <>
            <strong>ที่มา:</strong> รายชื่อ NPC ฝั่ง Zero จาก prontera.info เก็บข้อมูล 3 ก.ย. 2569 ·
            NPC ที่แหล่งข้อมูลไม่มีชื่อจริงจะขึ้นเป็นรหัสสไปรท์ เช่น &ldquo;1 M Innkeeper&rdquo; และไม่มีหน้าแยก
          </>
        }
      />

      <FilterState
        count={filtered.length}
        unit="ตัว"
        filters={[
          { label: 'คำค้น', value: q },
          { label: 'แมพ', value: map ? allMaps.find((m) => m.code === map)?.name ?? map : '' },
          { label: 'เฉพาะ', value: questsOnly ? 'ตัวที่ให้เควส' : '' },
        ]}
        clearHref="/database/npcs"
      />

      <section className="rolepick">
        <h2 className="rolepick__label">กรองเร็ว</h2>
        <div className="chips">
          <Link className={`chip${!questsOnly ? ' chip--on' : ''}`} href={href({ has: '' })}>ทั้งหมด</Link>
          {/* Hidden rather than shown at zero: Nordfeld has 69 NPCs and no
              quest givers, and a chip reading "ให้เควส 0" is an invitation to
              an empty page. */}
          {questCount > 0 && (
            <Link className={`chip${questsOnly ? ' chip--on' : ''}`} href={href({ has: 'quest' })}>
              ให้เควส <span className="chip__count">{questCount}</span>
            </Link>
          )}
        </div>
        <div className="chips" style={{ marginTop: 8 }}>
          <Link className={`chip${map === '' ? ' chip--on' : ''}`} href={href({ map: '' })}>ทุกแมพ</Link>
          {maps.slice(0, 12).map((m) => (
            <Link key={m.code} className={`chip${map === m.code ? ' chip--on' : ''}`} href={href({ map: m.code })}>
              {m.name} <span className="chip__count">{m.count}</span>
            </Link>
          ))}
        </div>
      </section>

      <form className="filterbar">
        <input type="search" name="q" defaultValue={q} placeholder="ชื่อ NPC, เมือง หรือชื่อเควส..." />
        {map && <input type="hidden" name="map" value={map} />}
        {questsOnly && <input type="hidden" name="has" value="quest" />}
        <button type="submit" className="btn">ค้นหา</button>
      </form>

      {rows.length === 0 ? (
        <div className="card">
          <EmptyState what={q || undefined} clearHref="/database/npcs" />
        </div>
      ) : (
        <div className="card">
          <table className="bptable">
            <thead>
              <tr>
                <th>NPC</th>
                <th>อยู่ที่</th>
                <th className="bptable__qty">เควส/ของขาย</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((npc) => (
                <tr key={npc.slug}>
                  <td>
                    {npc.sprite && <img className="npcportrait" src={`/images/npcs/${npc.sprite}.gif`} alt="" height={28} />}
                    {npc.hasName ? <Link href={`/database/npcs/${npc.slug}`}>{npc.name}</Link> : <span className="muted">{npc.name}</span>}
                    {npc.source === 'rathena' && <span className="muted" style={{ marginInlineStart: 6, fontSize: 12 }}>ร้านค้า</span>}
                  </td>
                  <td>
                    {npc.mapName ?? npc.map ?? '—'}
                    {naviCommand(npc.map, npc.x, npc.y) && (
                      <span className="mono navicmd" style={{ marginInlineStart: 8, fontSize: 12 }}>
                        {naviCommand(npc.map, npc.x, npc.y)}
                      </span>
                    )}
                  </td>
                  <td className="bptable__qty">{npc.quests.length || npc.sells.length || ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        page={safePage}
        totalPages={totalPages}
        buildHref={(target) => href({ page: target })}
        total={filtered.length}
        pageSize={PAGE_SIZE}
      />
    </main>
  );
}
