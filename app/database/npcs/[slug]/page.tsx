// app/database/npcs/[slug]/page.tsx
//
// One NPC name: every place it stands, the quests it gives and what it sells.
// The quests are matched to our own quest table by name so the links land on
// the quest hub anchor a player can read in Thai; a quest the source names and
// our table does not have yet is still listed, in plain text, because "this
// NPC gives Critura Academy - 1" is true whether or not we have translated it.
//
// 16 Oct 2026 (owner, after AdSense turned the site down for low-value
// content): one page per name rather than per place, and none for an NPC
// that only has a place (lib/npcs NPC_PAGES). The old per-place URLs
// redirect: to the name's page, or to the NPC's row on its map page.
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import JsonLd from '@/components/JsonLd';
import { breadcrumbJsonLd } from '@/lib/jsonld';
import { naviCommand } from '@/lib/rozglobal-guides';
import { supabaseRead } from '@/lib/supabase';
import ItemIcon from '@/components/ItemIcon';
import { itemHref } from '@/lib/item-href';
import { NPC_PAGES, npcAnchor, npcBySlug, npcHref, npcPage, questKey, type Npc } from '@/lib/npcs';
import { townByCode } from '@/lib/towns';

export const revalidate = 86400;

export function generateStaticParams() {
  return NPC_PAGES.map((page) => ({ slug: page.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const page = npcPage(params.slug);
  if (!page) return { title: 'ไม่พบ NPC ตัวนี้' };
  const places = [...new Set(page.npcs.map((npc) => npc.mapName ?? npc.map).filter(Boolean))];
  const quests = new Set(page.npcs.flatMap((npc) => npc.quests.map((quest) => questKey(quest.name)))).size;
  const sells = new Set(page.npcs.flatMap((npc) => npc.sells)).size;
  const shop = page.npcs.every((npc) => npc.source === 'rathena');
  return {
    title: `${page.name} — NPC อยู่ที่ไหน ${shop ? 'ขายอะไรบ้าง' : 'ให้เควสอะไร'}`,
    description: `${page.name} NPC ใน Ragnarok Zero Global${places.length ? ` อยู่ที่ ${places.slice(0, 3).join(', ')}${places.length > 3 ? ` และอีก ${places.length - 3} ที่` : ''}` : ''}${
      quests ? ` · ให้เควส ${quests} เควส` : ''
    }${sells ? ` · ขายของ ${sells} ชนิด` : ''} พร้อมคำสั่ง /navi สำหรับเดินไปหา`,
  };
}

/** Where an old per-place URL goes now. */
async function movedTo(npc: Npc): Promise<string> {
  const page = npcHref(npc);
  if (page) return page;
  if (npc.map) {
    if (townByCode(npc.map)) return `/database/maps/${encodeURIComponent(npc.map)}#${npcAnchor(npc)}`;
    const { data } = await supabaseRead().from('map_stats').select('map_code').eq('map_code', npc.map).maybeSingle();
    if (data) return `/database/maps/${encodeURIComponent(npc.map)}#${npcAnchor(npc)}`;
  }
  return '/database/npcs';
}

export default async function NpcDetailPage({ params }: { params: { slug: string } }) {
  const page = npcPage(params.slug);
  if (!page) {
    const old = npcBySlug(params.slug);
    if (old?.hasName) permanentRedirect(await movedTo(old));
    notFound();
  }

  const db = supabaseRead();
  // Our quest rows, for the ones whose names line up. Matching is on text, so
  // it is done here rather than in SQL: the source writes curly apostrophes.
  const names = [...new Set(page.npcs.flatMap((npc) => npc.quests.map((quest) => quest.name)))];
  const { data: questRows, error } = names.length
    ? await db.from('quests').select('id, name, name_th, town_key, type').in('name', names)
    : { data: [], error: null };
  if (error) console.error('npc quest lookup failed', error);
  const ours = new Map((questRows ?? []).map((row) => [questKey(row.name), row]));

  // A map page exists for maps with monsters on them and for towns.
  const codes = [...new Set(page.npcs.map((npc) => npc.map).filter((code): code is string => Boolean(code)))];
  const { data: mapRows } = codes.length ? await db.from('map_stats').select('map_code').in('map_code', codes) : { data: [] };
  const mapPages = new Set([...(mapRows ?? []).map((row) => row.map_code), ...codes.filter((code) => townByCode(code))]);

  // What each shopkeeper sells, with the icons the item pages already use.
  const goodsIds = [...new Set(page.npcs.flatMap((npc) => npc.sells))];
  const { data: goods, error: goodsError } = goodsIds.length
    ? await db.from('items').select('id, name_en, category, icon_url').in('id', goodsIds)
    : { data: [], error: null };
  if (goodsError) console.error('npc goods lookup failed', goodsError);
  const goodsById = new Map((goods ?? []).map((row) => [row.id, row]));

  // Quests once each, however many places give them.
  const quests = [...new Map(page.npcs.flatMap((npc) => npc.quests).map((quest) => [questKey(quest.name), quest])).values()];
  // Shopkeepers of one name sell different goods per town, so goods stay
  // with their place.
  const shops = page.npcs.filter((npc) => npc.sells.length > 0);
  const sprite = page.npcs.find((npc) => npc.sprite)?.sprite ?? null;
  const descriptions = [...new Set(page.npcs.map((npc) => npc.description).filter((text): text is string => Boolean(text)))];
  const sources = new Set(page.npcs.map((npc) => npc.source));
  const placeName = (npc: Npc) => npc.mapName ?? npc.map ?? '—';
  const multi = page.npcs.length > 1;

  return (
    <main className="shell" style={{ paddingBlock: 32, maxWidth: 820 }}>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'หน้าแรก', path: '/' },
          { name: 'NPC', path: '/database/npcs' },
          { name: page.name, path: `/database/npcs/${page.slug}` },
        ])}
      />
      <nav className="crumbs" aria-label="ตำแหน่งหน้า">
        <Link href="/database/npcs">NPC</Link>
        <span className="crumbs__sep" aria-hidden="true">›</span>
        <span className="crumbs__here">{page.name}</span>
      </nav>

      <div className="equiphero">
        {sprite && (
          <span className="npcstage">
            <img className="npcportrait npcportrait--hero" src={`/images/npcs/${sprite}`} alt="" height={72} />
          </span>
        )}
        <div>
          <p className="arckicker">NPC{!multi && page.npcs[0].mapName ? ` · ${page.npcs[0].mapName}` : multi ? ` · ${page.npcs.length} ที่` : ''}</p>
          <h1 className="pagehead__title arcname">{page.name}</h1>
          <p className="equiphero__chips">
            {quests.length > 0 && <span className="tag">ให้เควส {quests.length}</span>}
            {shops.length > 0 && <span className="tag">NPC ร้านค้า</span>}
            {multi && <span className="tag">ยืนอยู่ {page.npcs.length} ที่</span>}
          </p>
        </div>
      </div>

      <section className="card" style={{ marginTop: 14 }}>
        <h2 className="section-title">อยู่ที่ไหน{multi ? ` (${page.npcs.length} ที่)` : ''}</h2>
        <ul className="shoplist">
          {page.npcs.map((npc) => {
            const navi = naviCommand(npc.map, npc.x, npc.y);
            return (
              <li key={npc.slug} className="shoprow">
                <span className="shoprow__who">
                  {npc.map && mapPages.has(npc.map) ? <Link href={`/database/maps/${encodeURIComponent(npc.map)}`}>{placeName(npc)}</Link> : placeName(npc)}
                  {npc.x !== null && npc.y !== null && <span className="muted mono"> · {npc.x}/{npc.y}</span>}
                </span>
                {navi && <code className="mono navicmd shoprow__navi">{navi}</code>}
              </li>
            );
          })}
        </ul>
        <p className="muted" style={{ marginTop: 10, marginBottom: 0, fontSize: 12.5 }}>ก๊อปคำสั่ง /navi ไปวางในแชต เกมจะขึ้นเส้นนำทางให้เดินตาม</p>
      </section>

      {quests.length > 0 && (
        <section className="card" style={{ marginTop: 14 }}>
          <h2 className="section-title">เควสที่ให้ ({quests.length})</h2>
          <table className="bptable">
            <thead>
              <tr>
                <th>เควส</th>
                <th className="bptable__qty">ประเภท</th>
              </tr>
            </thead>
            <tbody>
              {quests.map((quest) => {
                const row = ours.get(questKey(quest.name));
                return (
                  <tr key={quest.slug ?? quest.name}>
                    <td>
                      {row ? <Link href={`/database/quests/${row.town_key}#q${row.id}`}>{row.name_th ?? row.name}</Link> : <span>{quest.name}</span>}
                      {row?.name_th && <span className="muted" style={{ marginInlineStart: 8, fontSize: 12.5 }}>{row.name}</span>}
                    </td>
                    <td className="bptable__qty">{row?.type ?? quest.type ?? '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {quests.some((quest) => !ours.has(questKey(quest.name))) && (
            <p className="muted" style={{ marginTop: 10, fontSize: 12.5 }}>เควสที่ไม่มีลิงก์คือเควสที่ฐานข้อมูลเควสของเรายังไม่มี ชื่อยังใช้ค้นในเกมได้</p>
          )}
        </section>
      )}

      {shops.length > 0 && (
        <section className="card" style={{ marginTop: 14 }}>
          <h2 className="section-title">ขายอะไรบ้าง{shops.length > 1 ? ` (${shops.length} ร้าน)` : ''}</h2>
          {shops.map((npc) => {
            const sells = npc.sells
              .map((id) => goodsById.get(id))
              .filter((row): row is NonNullable<typeof row> => Boolean(row))
              .sort((a, b) => a.name_en.localeCompare(b.name_en));
            if (!sells.length) return null;
            return (
              <div key={npc.slug} className="npcgoods">
                {shops.length > 1 && <h3 className="npcgoods__where">{placeName(npc)}</h3>}
                <ul className="npcgoods__list">
                  {sells.map((item) => (
                    <li key={item.id}>
                      <ItemIcon iconUrl={item.icon_url} category={item.category} size={24} />
                      <Link href={itemHref(item.id, item.category)}>{item.name_en}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </section>
      )}

      {descriptions.length > 0 && (
        <section className="card" style={{ marginTop: 14 }}>
          <h2 className="section-title">คำอธิบาย</h2>
          {descriptions.map((text) => (
            <p key={text} style={{ marginTop: 8, maxWidth: '70ch', lineHeight: 1.6 }}>{text}</p>
          ))}
        </section>
      )}

      {/* Sources with different standing, and the page has to say which one
          it is standing on. */}
      <p className="source-note" style={{ marginTop: 16 }}>
        {sources.has('prontera') && <>ตำแหน่งและเควสจากข้อมูล NPC ฝั่ง Zero (prontera.info, 3 ก.ย. 2569) อาจเปลี่ยนได้เมื่อมีแพทช์ · </>}
        {sources.has('rathena') && <>ร้านค้ามาจากผังร้านของ RO คลาสสิก (rAthena) ยังไม่ได้ยืนยันกับเซิร์ฟนี้ ของที่ขายกรองแล้วว่ามีในเกมนี้ · </>}
        {sources.has('client') && <>NPC ประจำเมืองมาจากไฟล์ไคลเอนต์ RO ที่ไม่ใช่ Zero ลงเฉพาะเมืองที่เกมนี้มี · </>}
        ราคาของดูได้ที่หน้าไอเทม
      </p>
    </main>
  );
}
