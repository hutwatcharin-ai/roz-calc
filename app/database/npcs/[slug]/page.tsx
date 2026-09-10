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
import { breadcrumbJsonLd } from '@/lib/jsonld';
import { naviCommand } from '@/lib/rozglobal-guides';
import { supabaseBrowser } from '@/lib/supabase';
import ItemIcon from '@/components/ItemIcon';
import { itemHref } from '@/lib/item-href';
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
  const shop = npc.source === 'rathena';
  return {
    title: `${npc.name} — NPC อยู่ที่ไหน ${shop ? 'ขายอะไรบ้าง' : 'ให้เควสอะไร'}`,
    description: `${npc.name} NPC ใน Ragnarok Zero Global${place ? ` ยืนอยู่ที่ ${place}` : ''}${
      npc.x !== null && npc.y !== null ? ` พิกัด ${npc.x}/${npc.y}` : ''
    }${npc.quests.length ? ` · ให้เควส ${npc.quests.length} เควส` : ''}${
      npc.sells.length ? ` · ขายของ ${npc.sells.length} ชนิด` : ''
    } พร้อมคำสั่ง /navi สำหรับเดินไปหา`,
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

  // A map page exists only for maps that have monsters on them, which is every
  // field and dungeon and no town. So the link is offered where there is one
  // and the code stays plain text where there is not.
  const { data: mapRow } = npc.map
    ? await supabaseBrowser().from('map_stats').select('map_code').eq('map_code', npc.map).maybeSingle()
    : { data: null };
  const mapHref = mapRow ? `/database/maps/${encodeURIComponent(npc.map as string)}` : null;

  // What a shopkeeper sells, with the icons the item pages already use.
  const { data: goods, error: goodsError } = npc.sells.length
    ? await supabaseBrowser().from('items').select('id, name_en, category, icon_url').in('id', npc.sells)
    : { data: [], error: null };
  if (goodsError) console.error('npc goods lookup failed', goodsError);
  const sells = (goods ?? []).sort((a, b) => a.name_en.localeCompare(b.name_en));

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

      {/* Sprite first, then the name -- the same hero shape the gear pages
          use, because the picture is how a player recognises who they are
          looking for in a crowd of townsfolk. 42 of the 624 have one matched
          to a mirrored sprite; the rest lead with the name alone rather than
          with someone else's picture. */}
      <div className="equiphero">
        {npc.sprite && <img className="npcportrait npcportrait--hero" src={`/images/npcs/${npc.sprite}`} alt="" height={72} />}
        <div>
          <h1 className="pagehead__title">{npc.name}</h1>
          <p className="equiphero__chips">
            {npc.source === 'rathena' ? <span className="tag">NPC ร้านค้า</span> : <span className="tag">NPC เควส</span>}
            {npc.mapName && <span className="tag">{npc.mapName}</span>}
          </p>
        </div>
      </div>

      <section className="card" style={{ marginTop: 14 }}>
        <h2 className="section-title">อยู่ที่ไหน</h2>
        <table className="stat-table" style={{ marginTop: 8 }}>
          <tbody>
            <tr>
              <td>แมพ</td>
              <td className="num">
                {mapHref ? <Link href={mapHref}>{npc.mapName ?? npc.map}</Link> : npc.mapName ?? '—'}
              </td>
            </tr>
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

      {sells.length > 0 && (
        <section className="card" style={{ marginTop: 14 }}>
          <h2 className="section-title">ขายอะไรบ้าง ({sells.length})</h2>
          <ul className="shoplist">
            {sells.map((item) => (
              <li key={item.id} className="shoprow">
                <span className="shoprow__who" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <ItemIcon iconUrl={item.icon_url} category={item.category} size={24} />
                  <Link href={itemHref(item.id, item.category)}>{item.name_en}</Link>
                </span>
              </li>
            ))}
          </ul>
          <p className="muted" style={{ marginTop: 10, fontSize: 12.5 }}>
            ราคาไม่ได้ลงไว้ เพราะสคริปต์ต้นทางให้ร้านคิดราคาซื้อปกติของไอเทมทุกชิ้น — ดูราคาได้ที่หน้าไอเทมนั้น
          </p>
        </section>
      )}

      {npc.description && (
        <section className="card" style={{ marginTop: 14 }}>
          <h2 className="section-title">คำอธิบาย</h2>
          <p style={{ marginTop: 8, maxWidth: '70ch', lineHeight: 1.6 }}>{npc.description}</p>
        </section>
      )}

      {/* Two sources with different standing, and the page has to say which
          one it is standing on: a quest NPC comes from Zero's own list, a
          shopkeeper from rAthena's classic scripts. */}
      <p className="source-note" style={{ marginTop: 16 }}>
        {npc.source === 'client' ? (
          <>
            <strong>ยังไม่ได้ยืนยันกับเซิร์ฟนี้:</strong> รายชื่อ NPC ประจำเมือง (Kafra, ไกด์, โรงแรม, ร้านค้า) มาจากไฟล์ไคลเอนต์ RO ซึ่งไม่ใช่ไคลเอนต์ Zero ·
            ลงเฉพาะเมืองที่เกมนี้มีจริง
          </>
        ) : npc.source === 'rathena' ? (
          <>
            <strong>ยังไม่ได้ยืนยันกับเซิร์ฟนี้:</strong> NPC ร้านค้ามาจากสคริปต์ของ rAthena ซึ่งเป็นผังร้านของ RO คลาสสิก ·
            ฝั่ง Zero ไม่มีแหล่งไหนที่เรามีลงข้อมูลร้านค้าเลย · ของที่ขายกรองแล้วว่ามีจริงในเกมนี้
          </>
        ) : (
          <>
            <strong>ที่มา:</strong> ข้อมูล NPC ฝั่ง Zero จาก prontera.info เก็บเมื่อ 3 ก.ย. 2569 ·
            ตำแหน่งอาจเปลี่ยนได้เมื่อมีแพทช์ใหม่
          </>
        )}
      </p>
    </main>
  );
}
