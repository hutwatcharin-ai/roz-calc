// app/guides/clock-tower-hats/page.tsx
//
// The four hats the Clock Tower patch (29 Oct 2026) added, how to make each,
// and the Clock Tower Gear that rerolls them. Written the way the Nordfeld
// helm section is: what the hat is, then step by step (owner, 2 Nov 2026).
//
// What is from where:
//   - Recipes, NPCs and drops: data/headgear-quests.json, shared with
//     /guides/costume-craft so the two pages cannot disagree. The Hat Maker's
//     two come from the game's quest log; Clock Casket and Black Witch Hat
//     from Februs's crafting dialogue in the client's NPC text.
//   - Mithril: Thor's Flame refines Mithril Ore into Mithril and Thor's
//     Dismantling Flame breaks it back down, both from their dialogue in the
//     same NPC text. Februs fills missing ore with Zelstar, same source.
//   - Which memorial dungeons give Mithril Ore: data/memorial-dungeons.json.
//   - Clock Tower Gear: its Thai item text (keeps refine and cards, the four
//     hats it works on). The owner, who plays, says it rerolls options the
//     way the Nordfeld scroll does. Where the Gear comes from is not in the
//     client.
//   - Februs's map: not in the Global client's navigation data. The owner
//     will bring the coordinates from the game; FEBRUS_NAVI waits for them.
import Link from 'next/link';
import type { Metadata } from 'next';
import PageHeader from '@/components/PageHeader';
import Caveat from '@/components/Caveat';
import JsonLd from '@/components/JsonLd';
import AdSlot from '@/components/AdSlot';
import NaviCopy from '@/components/NaviCopy';
import { breadcrumbJsonLd } from '@/lib/jsonld';
import { itemHref } from '@/lib/item-href';
import data from '@/data/headgear-quests.json';
import memorial from '@/data/memorial-dungeons.json';
import '../costume-craft/page.css';

export const revalidate = 86400;

const PATH = '/guides/clock-tower-hats';

interface Drop { id: number; name: string; level: number; rate: number; others: number }
interface Mat { id: number; name: string; n: number; icon: string; category: string; drop: Drop | null }
interface Hat {
  town: string; id: number; name: string; icon: string; category: string; npc: string; navi: string | null;
  mats: Mat[]; zeny: number; bonus: string; pos: string; def: string; level: string; jobs: string;
}

const ALL = (data as { hats: Hat[] }).hats;
const pick = (ids: number[]) => ids.map((id) => ALL.find((h) => h.id === id)!).filter(Boolean);
const HAT_MAKER = pick([19333, 19334]);
const FEBRUS = pick([19357, 19358]);
const HATS = [...FEBRUS, ...HAT_MAKER];

// Februs's spot, from the owner once it is checked in game.
const FEBRUS_NAVI: string | null = null;

const GEAR = { id: 108494, name: 'Clock Tower Gear', icon: '/images/items/108494.png' };
const ORE = { id: 25429, name: 'Mithril Ore', icon: '/images/items/25429.gif' };
const MITHRIL = { id: 25430, name: 'Mithril', icon: '/images/items/25430.gif' };
const ZELSTAR = { id: 25399, name: 'Zelstar', icon: '/images/items/25399.gif' };
const ORE_PER_MITHRIL = 10;

// The underground bosses that drop the Hat Maker's materials, by floor.
const FLOORS: Record<number, string> = { 20179: 'ใต้ดิน B1F', 20178: 'ใต้ดิน B2F', 20177: 'ใต้ดิน B3F', 20176: 'ใต้ดิน B4F', 20175: 'ใต้ดิน B4F' };

const ORE_DUNGEONS = (memorial as { dungeons: { name: string; th: string; rewards: { normal: string[]; hard: string[] } }[] }).dungeons
  .filter((d) => [...d.rewards.normal, ...d.rewards.hard].includes(ORE.name));

const POS: Record<string, string> = { Upper: 'หมวกบน', Middle: 'หมวกกลาง', Lower: 'หมวกล่าง' };

export const metadata: Metadata = {
  title: 'หมวกหอนาฬิกา Ragnarok Zero — Clock Casket, Black Witch Hat ทำยังไง',
  description:
    `วิธีทำหมวก ${HATS.length} ชิ้นจากแพตช์หอนาฬิกา Ragnarok Zero Global: Clock Casket และ Black Witch Hat จาก NPC Februs, Clock Tower Manager Headphones และ Pocket Watch Ornament จาก Hat Maker ที่ Al De Baran · วัตถุดิบ มอนที่ดรอป Mithril Ore หาจากไหน และ Clock Tower Gear สุ่มออปชัน`,
};

function Icon({ src, size = 32 }: { src: string; size?: number }) {
  return <img src={src} alt="" width={size} height={size} style={{ imageRendering: 'pixelated', verticalAlign: 'middle' }} />;
}

function Hero({ h }: { h: Hat }) {
  return (
    <div className="guildp__hero" style={{ marginTop: 10 }}>
      <Icon src={h.icon} size={40} />
      <div>
        <strong><Link href={itemHref(h.id, h.category)}>{h.name}</Link></strong>
        <p className="guildp__stats">{h.bonus}</p>
        <p className="muted">{POS[h.pos] ?? h.pos} · DEF {h.def} · Slot 1 · เลเวล {h.level} · {h.jobs}</p>
      </div>
    </div>
  );
}

function Mats({ h }: { h: Hat }) {
  return (
    <ul className="hq__mats">
      {h.mats.map((m) => (
        <li key={m.id} className="hq__mat">
          <img src={m.icon} alt="" width={24} height={24} loading="lazy" className="hq__icon" />
          <span className="hq__n">{m.n.toLocaleString()}×</span>
          <Link href={itemHref(m.id, m.category)}>{m.name}</Link>
          {m.drop && (
            <span className="hq__drop">
              ดรอป <Link href={`/database/monsters/${m.drop.id}`}>{m.drop.name}</Link>
              {m.drop.rate > 0 && ` ${m.drop.rate}%`}
              {FLOORS[m.drop.id] && ` · ${FLOORS[m.drop.id]}`}
              {m.drop.others > 0 && <> · อีก {m.drop.others} ตัว</>}
            </span>
          )}
        </li>
      ))}
      {h.zeny > 0 && <li className="hq__mat hq__zeny">ค่าทำ <strong>{h.zeny.toLocaleString()} Zeny</strong></li>}
    </ul>
  );
}

export default function ClockTowerHatsPage() {
  const februsOre = FEBRUS[0]?.mats.find((m) => m.id === ORE.id)?.n ?? 0;
  const makerMithril = HAT_MAKER[0]?.mats.find((m) => m.id === MITHRIL.id)?.n ?? 0;
  const bossMat = HAT_MAKER[0]?.mats.find((m) => m.n > 1 && m.id !== MITHRIL.id)?.n ?? 0;
  return (
    <main className="shell guildp" style={{ paddingBlock: 32 }}>
      <JsonLd data={breadcrumbJsonLd([
        { name: 'หน้าแรก', path: '/' },
        { name: 'ไกด์', path: '/guides' },
        { name: 'หมวกหอนาฬิกา', path: PATH },
      ])} />
      <nav className="crumbs" aria-label="ตำแหน่งหน้า">
        <Link href="/">หน้าแรก</Link><span className="crumbs__sep" aria-hidden="true">›</span>
        <Link href="/guides">ไกด์</Link><span className="crumbs__sep" aria-hidden="true">›</span>
        <span className="crumbs__here">หมวกหอนาฬิกา</span>
      </nav>

      <PageHeader
        title="หมวกหอนาฬิกา — Clock Casket, Black Witch Hat และหมวก Hat Maker"
        lead={`หมวกใหม่ ${HATS.length} ชิ้นจากแพตช์หอนาฬิกา ใส่ได้ทุกอาชีพ เลเวล 60 · ทำจาก NPC 2 ตัว แล้วใช้ Clock Tower Gear สุ่มออปชันได้`}
      />

      <nav className="guildp__toc hq__toc" aria-label="ในหน้านี้">
        <a href="#februs">Februs (หมวกบน)</a>
        <a href="#hatmaker">Hat Maker (หมวกกลาง)</a>
        <a href="#mithril">Mithril หาจากไหน</a>
        <a href="#gear">Clock Tower Gear</a>
      </nav>

      <section className="card card--yellow" id="februs" style={{ marginTop: 14 }}>
        <h2 className="section-title" style={{ marginTop: 0 }}>Clock Casket และ Black Witch Hat — ให้ Februs ทำ</h2>
        {FEBRUS.map((h) => <Hero key={h.id} h={h} />)}
        <p style={{ marginTop: 10 }}>
          <strong>Clock Casket สายตีกายภาพ</strong> ตีบวกยิ่งสูงยิ่งแรง · <strong>Black Witch Hat สายเวท</strong> ตี +9 แล้วร่ายเร็วขึ้น
        </p>

        <h3 style={{ margin: '16px 0 6px', fontSize: 15 }}>วิธีทำ ทีละขั้น</h3>
        <ol className="guildp__steps">
          <li><strong>เก็บวัตถุดิบตามรายการด้านล่าง</strong> ของส่วนใหญ่ดรอปจากมอนในหอนาฬิกาและใต้ดิน Al De Baran</li>
          <li>
            <strong>เตรียม <Icon src={ORE.icon} size={20} /> {ORE.name} {februsOre} ชิ้น</strong> ทุกสูตรของ Februs ต้องใช้ ·
            ถ้าไม่พอ Februs จะใช้ <Icon src={ZELSTAR.icon} size={20} /> {ZELSTAR.name} แทนส่วนที่ขาด (หัวข้อ <a href="#mithril">Mithril</a>)
          </li>
          <li><strong>เตรียมค่าทำ {(FEBRUS[0]?.zeny ?? 0).toLocaleString()} Zeny</strong></li>
          <li>
            <strong>คุย Februs</strong> เลือก &quot;Request crafting&quot; แล้วเลือกหมวก ·{' '}
            {FEBRUS_NAVI ? <NaviCopy cmd={FEBRUS_NAVI} /> : <span className="muted">พิกัดกำลังเช็กในเกม จะเติมเร็ว ๆ นี้</span>}
          </li>
          <li><strong>หมวกที่ได้ยังไม่มีออปชัน</strong> ใช้ <a href="#gear">Clock Tower Gear</a> สุ่มต่อได้</li>
        </ol>

        <div className="hq__grid" style={{ marginTop: 14 }}>
          {FEBRUS.map((h) => (
            <article key={h.id} className="hq__hat">
              <h3 className="hq__name"><Icon src={h.icon} size={28} /> {h.name}</h3>
              <Mats h={h} />
            </article>
          ))}
        </div>
        <p className="guildp__src">
          ที่มา: บทพูดของ Februs ในไฟล์เกม (แพตช์ 29 ต.ค.) · ในไฟล์มีสูตรอีก 3 ชิ้น (Wanderer&apos;s Sakkat, Khalitzburg Knight Helm, Alice Wig)
          แต่เซิร์ฟ Global เปิดให้ทำแค่ 2 ชิ้นนี้
        </p>
      </section>

      <section className="card" id="hatmaker" style={{ marginTop: 14 }}>
        <h2 className="section-title" style={{ marginTop: 0 }}>Clock Tower Manager Headphones และ Pocket Watch Ornament — ให้ Hat Maker ทำ</h2>
        {HAT_MAKER.map((h) => <Hero key={h.id} h={h} />)}
        <p style={{ marginTop: 10 }}>
          <strong>ใส่คู่การ์ดมอนหอนาฬิกาแล้วได้โบนัส</strong> · หูฟังสายเวท ใส่คู่การ์ด Clock Tower Manager ร่ายเร็วขึ้น ·
          นาฬิกาพกสายตี ใส่คู่การ์ด Clock หรือ Alarm
        </p>

        <h3 style={{ margin: '16px 0 6px', fontSize: 15 }}>วิธีทำ ทีละขั้น</h3>
        <ol className="guildp__steps">
          <li>
            <strong>ล่าบอส 5 ตัวใต้ดิน Al De Baran</strong> ชั้นละตัว เลเวล 122–126 ·
            ของจากบอสใช้หมวกละ {bossMat} ชิ้น (ยกเว้น Jokers Wild ใช้ชิ้นเดียว) · ดูบอสครบที่{' '}
            <Link href="/news/patch-2026-10-29#bosses">หน้าแพตช์หอนาฬิกา</Link>
          </li>
          <li>
            <strong>เตรียม <Icon src={MITHRIL.icon} size={20} /> {MITHRIL.name} {makerMithril} ชิ้น</strong> ·
            หลอมจาก Mithril Ore ชิ้นละ {ORE_PER_MITHRIL} (หัวข้อ <a href="#mithril">Mithril</a>)
          </li>
          <li>
            <strong>คุย Hat Maker ที่ Al De Baran</strong> <NaviCopy cmd={HAT_MAKER[0]?.navi ?? '/navi aldebaran 130/140'} /> ·
            ทั้ง 2 ใบใช้วัตถุดิบชุดเดียวกัน
          </li>
          <li><strong>สุ่มออปต่อ</strong> ด้วย <a href="#gear">Clock Tower Gear</a> ได้เหมือนกัน</li>
        </ol>

        <div className="hq__grid" style={{ marginTop: 14 }}>
          <article className="hq__hat">
            <h3 className="hq__name">วัตถุดิบต่อหมวก 1 ใบ</h3>
            {HAT_MAKER[0] && <Mats h={HAT_MAKER[0]} />}
          </article>
        </div>
        <p className="guildp__src">ที่มา: บันทึกเควสของ Hat Maker ในไฟล์เกม · โบนัสคู่การ์ดจากข้อความไอเทมในเกม</p>
      </section>

      <AdSlot slot="inline" />

      <section className="card" id="mithril" style={{ marginTop: 14 }}>
        <h2 className="section-title" style={{ marginTop: 0 }}>Mithril Ore และ Mithril หาจากไหน</h2>
        <ul className="guildp__steps" style={{ listStyle: 'disc' }}>
          <li>
            <strong><Icon src={ORE.icon} size={20} /> {ORE.name} ได้จากดันเจี้ยนความทรงจำ</strong>{' '}
            {ORE_DUNGEONS.map((d, i) => <span key={d.name}>{i > 0 && ' · '}{d.th}</span>)} ·{' '}
            <Link href="/guides/memorial-dungeons">ดูดันเจี้ยนทั้งหมด</Link>
          </li>
          <li>
            <strong>Thor&apos;s Flame หลอม Mithril Ore {ORE_PER_MITHRIL} ชิ้นเป็น <Icon src={MITHRIL.icon} size={20} /> {MITHRIL.name} 1 ชิ้น</strong> ·
            Hat Maker ใช้ Mithril
          </li>
          <li>
            <strong>Thor&apos;s Dismantling Flame แตก Mithril 1 ชิ้นกลับเป็น Mithril Ore {ORE_PER_MITHRIL} ชิ้น</strong> ·
            Februs ใช้ Mithril Ore
          </li>
          <li>
            <strong>Mithril Ore ไม่พอตอนสั่ง Februs</strong> เขาใช้ <Icon src={ZELSTAR.icon} size={20} /> {ZELSTAR.name} แทนส่วนที่ขาดให้เอง
            และถามก่อนว่าจะทำต่อไหม
          </li>
        </ul>
        <p className="muted" style={{ marginTop: 6, fontSize: 13 }}>พิกัด Thor&apos;s Flame ทั้งสองตัวกำลังเช็กในเกม</p>
        <p className="guildp__src">ที่มา: บทพูดของ Thor&apos;s Flame, Thor&apos;s Dismantling Flame และ Februs ในไฟล์เกม · รายชื่อดันเจี้ยนจากหน้าดันเจี้ยนความทรงจำ</p>
      </section>

      <section className="card" id="gear" style={{ marginTop: 14 }}>
        <h2 className="section-title" style={{ marginTop: 0 }}>Clock Tower Gear — สุ่มออปชันหมวก</h2>
        <div className="guildp__hero">
          <Icon src={GEAR.icon} size={40} />
          <div>
            <strong><Link href={itemHref(GEAR.id, 'Other')}>{GEAR.name}</Link></strong>
            <p className="guildp__stats">ใช้กับหมวก {HATS.length} ใบในหน้านี้เท่านั้น</p>
          </div>
        </div>
        <ul className="guildp__steps" style={{ listStyle: 'disc' }}>
          <li><strong>ใช้สุ่มออปชันใหม่ให้หมวก</strong> แบบเดียวกับใบสุ่มของ <Link href="/guides/costume-craft#nordfeld">หมวก Nordfeld</Link></li>
          <li><strong>ขั้นตีบวกและการ์ดที่ใส่อยู่ไม่หาย</strong> ข้อความในเกมเขียนไว้เอง</li>
          <li>
            <strong>ใช้ได้กับ</strong>{' '}
            {HATS.map((h, i) => <span key={h.id}>{i > 0 && ' · '}<Link href={itemHref(h.id, h.category)}>{h.name}</Link></span>)}
          </li>
          <li><strong>ยังไม่รู้ว่า Gear ได้จากไหน</strong> และสุ่มได้ออปอะไรบ้าง ไฟล์เกมกับแพตช์โน้ตไม่บอก</li>
        </ul>
        <p className="guildp__src">ที่มา: ข้อความไอเทม Clock Tower Gear ในเกม</p>
      </section>

      <Caveat label="เชื่อได้แค่ไหน">
        สูตร วัตถุดิบ และค่าทำ <strong>มาจากไฟล์เกม ยังไม่ได้เช็กในเกม</strong> ·
        ค่าหมวกจากข้อความไอเทมในเกม · มอนที่ดรอปเลือกตัวธรรมดาที่ดรอปมากสุดในฐานข้อมูลเรา ไม่นับมอนแชมเปียน ·
        พิกัด Februs และ Thor&apos;s Flame ยังไม่มีในไฟล์นำทางของเกม กำลังเช็กในเกม ·
        Clock Tower Gear สุ่มออปได้ตามที่ผู้เล่นเล่า ส่วนที่มาของ Gear ยังไม่รู้
      </Caveat>

      <p className="muted" style={{ marginTop: 16 }}>
        ดูต่อ: <Link href="/news/patch-2026-10-29">แพตช์หอนาฬิกา</Link> · <Link href="/guides/costume-craft">คราฟต์หมวกทั้งหมด</Link> ·{' '}
        <Link href="/guides/memorial-dungeons">ดันเจี้ยนความทรงจำ</Link> · <Link href="/tools/refine">คำนวณตีบวก</Link>
      </p>
    </main>
  );
}
