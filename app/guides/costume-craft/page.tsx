// app/guides/costume-craft/page.tsx
//
// Headgear an NPC makes for you: who, where, and what to bring.
//
// Until 2 Nov 2026 this page read roz-global.info's French guide. That day a
// rebuild from the game's own quest log went up as /guides/headgear-quests
// and the owner had it folded in here; the old URL redirects here. The
// Nordfeld helm keeps its own page (/guides/nordfeld-helm).
//
// What is from where:
//   - NPC, map, coordinates, amounts and zeny: our quests table, which is the
//     game's own quest log text. Built into data/headgear-quests.json by hand
//     from that table.
//   - The quest log calls materials by its own names (Soft Fur, Wood Piece,
//     Red Dye ...). Each was matched to the real item through the classic
//     rAthena recipe for the same hat (Fur_Hat, Fish_On_Head, Jack_A_Dandy).
//   - Hat stats: the game's Thai item text (data/game-items.json).
//   - "Drops from": our monster_drops table, the best normal (not champion)
//     monster for each material.
//   - Clock Casket and Black Witch Hat: Februs's crafting dialogue in the
//     client's NPC text (data/i18n/sc). The quest log has no entry for them
//     and his map is not in the Global client's navigation data, so they
//     carry no /navi.
//   - Hats the old guide listed that the quest log does not: still from
//     roz-global.info, shown apart and labelled.
//   Nothing here is checked in game yet, so the page says so.
import Link from 'next/link';
import type { Metadata } from 'next';
import PageHeader from '@/components/PageHeader';
import Caveat from '@/components/Caveat';
import JsonLd from '@/components/JsonLd';
import AdSlot from '@/components/AdSlot';
import NaviCopy from '@/components/NaviCopy';
import { breadcrumbJsonLd } from '@/lib/jsonld';
import { itemHref } from '@/lib/item-href';
import { naviCommand, rozglobalGuides } from '@/lib/rozglobal-guides';
import data from '@/data/headgear-quests.json';
import './page.css';

export const revalidate = 86400;

const PATH = '/guides/costume-craft';

export const metadata: Metadata = {
  title: 'คราฟต์หมวก Ragnarok Zero — เควสทำหมวกทุกเมือง NPC ทำให้ ใช้ของอะไร',
  description:
    `รวมหมวก ${data.hats.length} ชิ้นที่ NPC ทำให้ใน Ragnarok Zero Global แยกตามเมือง บอกพิกัด /navi วัตถุดิบ ค่าทำ และมอนที่ดรอปวัตถุดิบ`,
};

interface Drop { id: number; name: string; level: number; rate: number; others: number }
interface Mat { id: number; name: string; n: number; icon: string; category: string; drop: Drop | null }
interface Hat {
  town: string; id: number; name: string; icon: string; category: string; npc: string; navi: string | null;
  where?: string; mats: Mat[]; zeny: number; quest: number; start: { npc: string; navi: string } | null; note: string | null;
  bonus: string; pos: string; def: string; level: string; jobs: string; noRefine: boolean;
}

const HATS = (data as { hats: Hat[] }).hats;
const TOWNS = [...new Set(HATS.map((h) => h.town))];
const POS: Record<string, string> = { Upper: 'หมวกบน', Middle: 'หมวกกลาง', Lower: 'หมวกล่าง', 'Middle, Lower': 'หมวกกลาง+ล่าง' };
const slug = (town: string) => town.toLowerCase().replace(/\s+/g, '-');
// A group named after its NPC rather than a town says so in its heading.
const HEADING: Record<string, string> = { Februs: 'Februs (บ้านใน Prontera) — หมวกหอนาฬิกา' };

// The old guide's hats that the quest log has no recipe for.
const known = new Set(HATS.map((h) => h.name.toLowerCase()));
const OTHER = rozglobalGuides.cosmetics.filter((c) => !known.has(c.item.toLowerCase()));

function rate(r: number) {
  return r > 0 ? ` ${r}%` : '';
}

function MatChip({ m }: { m: Mat }) {
  return (
    <li className="hq__mat">
      <img src={m.icon} alt="" width={24} height={24} loading="lazy" className="hq__icon" />
      <span className="hq__n">{m.n.toLocaleString()}×</span>
      <Link href={itemHref(m.id, m.category)}>{m.name}</Link>
      {m.drop && (
        <span className="hq__drop">
          ดรอป <Link href={`/database/monsters/${m.drop.id}`}>{m.drop.name}</Link>
          {rate(m.drop.rate)}
          {m.drop.others > 0 && <> · มอนอื่นดรอปด้วยอีก {m.drop.others} ตัว</>}
        </span>
      )}
    </li>
  );
}

function HatCard({ h }: { h: Hat }) {
  const stats = [POS[h.pos] ?? h.pos, `DEF ${h.def}`, `Lv ${h.level}`, h.jobs].filter(Boolean).join(' · ');
  return (
    <article className="hq__hat" id={`hat-${h.id}`}>
      <div className="hq__head">
        <img src={h.icon} alt="" width={36} height={36} loading="lazy" className="hq__icon" />
        <div>
          <h3 className="hq__name"><Link href={itemHref(h.id, h.category)}>{h.name}</Link></h3>
          <p className="hq__stats">
            {h.bonus && <strong>{h.bonus} · </strong>}
            {stats}
            {h.noRefine && ' · ตีบวกไม่ได้'}
          </p>
        </div>
      </div>
      <p className="hq__npc">
        คุย <strong>{h.npc}</strong>{' '}
        {h.navi ? <code className="navicmd">{h.navi}</code> : <span className="muted">{h.where ?? 'ยังไม่รู้พิกัด'}</span>}
      </p>
      {h.start && (
        <p className="hq__npc">
          เริ่มเควสที่ <strong>{h.start.npc}</strong> <code className="navicmd">{h.start.navi}</code>
        </p>
      )}
      <ul className="hq__mats">
        {h.mats.map((m) => <MatChip key={m.id} m={m} />)}
        {h.zeny > 0 && <li className="hq__mat hq__zeny">ค่าทำ <strong>{h.zeny.toLocaleString()} Zeny</strong></li>}
      </ul>
      {h.note && <p className="hq__note">{h.note}</p>}
    </article>
  );
}

export default function CostumeCraftPage() {
  return (
    <main className="shell guildp" style={{ paddingBlock: 32 }}>
      <JsonLd data={breadcrumbJsonLd([
        { name: 'หน้าแรก', path: '/' },
        { name: 'ไกด์', path: '/guides' },
        { name: 'คราฟต์หมวก', path: PATH },
      ])} />
      <nav className="crumbs" aria-label="ตำแหน่งหน้า">
        <Link href="/">หน้าแรก</Link><span className="crumbs__sep" aria-hidden="true">›</span>
        <Link href="/guides">ไกด์</Link><span className="crumbs__sep" aria-hidden="true">›</span>
        <span className="crumbs__here">คราฟต์หมวก</span>
      </nav>

      <PageHeader
        title="คราฟต์หมวก — NPC ทำให้ ไปหาใคร ใช้ของอะไร"
        lead={
          <>
            หมวก {HATS.length} ชิ้นที่ NPC ทำให้ แยกตามเมือง ·
            กดคำสั่ง /navi เพื่อก๊อปไปวางในแชตเกม · อยากได้หมวกที่ดรอปจากมอนดู <Link href="/database/costumes">ฐานข้อมูลคอสตูม</Link>
          </>
        }
      />

      <nav className="guildp__toc hq__toc" aria-label="เลือกเมือง">
        {TOWNS.map((t) => (
          <a key={t} href={`#${slug(t)}`}>{t} ({HATS.filter((h) => h.town === t).length})</a>
        ))}
      </nav>

      {TOWNS.map((town, i) => (
        <div key={town}>
          <section className="card" id={slug(town)} style={{ marginTop: 14 }}>
            <h2 className="section-title" style={{ marginTop: 0 }}>{HEADING[town] ?? town}</h2>
            <div className="hq__grid">
              {HATS.filter((h) => h.town === town).map((h) => <HatCard key={h.id} h={h} />)}
            </div>
          </section>
          {i === 3 && <AdSlot slot="inline" />}
        </div>
      ))}

      {OTHER.length > 0 && (
        <section className="card" style={{ marginTop: 14 }}>
          <h2 className="section-title" style={{ marginTop: 0 }}>ไม่เจอในบันทึกเควส ({OTHER.length})</h2>
          <p className="muted" style={{ marginTop: 0 }}>
            ไกด์ roz-global.info บอกว่า NPC ทำให้ แต่บันทึกเควสในไฟล์เกมไม่มีสูตรนี้ ยังไม่รู้ว่าทำได้จริงไหม
          </p>
          <ul className="hq__mats">
            {OTHER.map((c) => {
              const navi = naviCommand(c.map, c.x, c.y);
              const mats = c.materials.map((m) => `${m.item}${m.amount > 1 ? ` ×${m.amount.toLocaleString('en-US')}` : ''}`).join(' · ');
              return (
                <li key={c.item} className="hq__mat">
                  {c.itemId ? <Link href={itemHref(c.itemId, null)}><strong>{c.item}</strong></Link> : <strong>{c.item}</strong>}
                  <span className="muted">{mats}</span>
                  {navi && <NaviCopy cmd={navi} />}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <Caveat label="เชื่อได้แค่ไหน">
        หมวกที่ NPC ทำ: NPC พิกัด จำนวนของ และค่าทำ <strong>มาจากบันทึกเควสในไฟล์เกม ยังไม่ได้เช็กในเกม</strong> ·
        บันทึกเควสเรียกของบางชิ้นด้วยชื่ออื่น (เช่น Soft Fur คือ Feather, Wood Piece คือ Trunk, Red Dye คือ Scarlet Dyestuffs)
        เราจับคู่กับไอเทมจริงด้วยสูตรเดียวกันของ RO คลาสสิก ·
        ค่าหมวกจากข้อความไอเทมในเกม · มอนที่ดรอปเลือกตัวธรรมดาที่ดรอปมากสุดในฐานข้อมูลเรา ไม่นับมอนแชมเปียน ·
        Clock Casket กับ Black Witch Hat มาจากบทพูดของ NPC Februs ในไฟล์เกม เช็กสูตรและพิกัดในเกมแล้ว 2 พ.ย. ·
        Clock Tower Gear ดรอปจากมอนหอนาฬิกา ยังไม่รู้ว่าตัวไหน ·
        หมวกที่แลกด้วยโทเคนดูหน้า <Link href="/guides/nordfeld-helm">หมวก Nordfeld</Link>
      </Caveat>

      <p className="muted" style={{ marginTop: 16 }}>
        ดูต่อ: <Link href="/guides/clock-tower-hats">หมวกหอนาฬิกา</Link> · <Link href="/guides/costume-enchant">หินเอนแชนต์คอสตูม</Link> · <Link href="/database/costumes">ฐานข้อมูลคอสตูม</Link> ·{' '}
        <Link href="/guides/classes">ไกด์อาชีพ</Link> · <Link href="/tools/refine">คำนวณตีบวก</Link>
      </p>
    </main>
  );
}
