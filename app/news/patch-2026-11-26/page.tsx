// app/news/patch-2026-11-26/page.tsx
//
// The 26 Nov 2026 maintenance. Written the day before from the maintenance
// notices (roz.mygnjoy.com notice 196 and the reminder 197), then rebuilt on
// 26 Nov from the official site: Update Notice 199 (five images: the two MVP
// Raids with their /navi, A Hard Choice, Bug Extermination, KP Shop 10% round
// 2, events ending), event notices 198 (A Hard Choice: Guard Ars or Old Woman
// Enko, tokens and exchange list) and 200 (Bug Extermination: Guillon's main
// quest, Lyrias's daily), and the Cosmic Costume promo 201. Every fact here is
// from those notices. The patched client was not read yet (no GrfDiffTool
// snapshot after 12 Nov), so the new NPCs and costumes have no pictures and
// the new items no database links.
//
// Laid out like /news/patch-2026-11-12: one coloured section per thing a
// player can do, NPC with a copyable /navi, item icons, a REWARD box.
import '../patch-2026-10-01/page.css';
import '../patch-2026-10-29/page.css';
import '../events-2026-10/page.css';
import '../patch-2026-11-12/page.css';
import './page.css';
import NaviCopy from '@/components/NaviCopy';
import Link from 'next/link';
import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import JsonLd from '@/components/JsonLd';
import AdSlot from '@/components/AdSlot';
import { articleJsonLd, breadcrumbJsonLd } from '@/lib/jsonld';

const PATH = '/news/patch-2026-11-26';
const PUBLISHED = '2026-11-25T15:00:00+07:00';
const MODIFIED = '2026-11-26T10:00:00+07:00';

// The two new MVP Raids, by the game's monster id, with the /navi the Update
// Notice gives for each.
const RAIDS = [
  { id: 1147, name: 'Maya', where: 'Ant Hell ชั้น 2', navi: '/navi anthell02 175/190' },
  { id: 1159, name: 'Phreeoni', where: 'ทะเลทราย Sograt ใต้ Morocc', navi: '/navi moc_fild17 210/230' },
];

// What the 26 Nov maintenance closed, in the notice's order. A null href is
// one the site has no page for.
const ENDED: { name: string; href: string | null }[] = [
  { name: 'Lifting Curse', href: null },
  { name: 'Hunting Season – Hode & Orc Warrior', href: '/news/patch-2026-11-12#hunting' },
  { name: "Blacksmith's Blessing Event", href: '/news/patch-2026-11-12#blessing' },
  { name: 'Gatchaman Collaboration', href: '/news/events-2026-11' },
];

// A reward line, linked to the item page. Items this patch added were imported
// from the 26 Nov client with PNG icons (png: true); older ones have GIFs.
type Mat = { name: string; id?: number; png?: boolean; qty?: number; note?: string };

function Mats({ items }: { items: Mat[] }) {
  return (
    <ul className="evmats">
      {items.map((m) => {
        const body = (
          <>
            {m.id != null && <img src={`/images/items/${m.id}.${m.png ? 'png' : 'gif'}`} alt="" width={24} height={24} loading="lazy" />}
            <span>{m.name}</span>
            {m.qty != null && <b>×{m.qty}</b>}
          </>
        );
        return (
          <li key={m.name}>
            {m.id != null ? (
              <Link href={`/database/items/${m.id}`} className="evmat">{body}</Link>
            ) : (
              <span className="evmat">{body}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

// A Hard Choice exchange list, the same at both NPCs except the costume.
function ItemCell({ id, png, children }: { id: number; png?: boolean; children: ReactNode }) {
  return (
    <Link href={`/database/items/${id}`} className="evmat" style={{ display: 'inline-flex' }}>
      <img src={`/images/items/${id}.${png ? 'png' : 'gif'}`} alt="" width={24} height={24} loading="lazy" />
      <span>{children}</span>
    </Link>
  );
}

// One A Hard Choice side, top to bottom: what to hand in, what each run
// gives, then the hat 10 tokens buy and what the leftovers buy.
type Side = {
  title: string;
  fit: string;
  npc: { img: string; name: string; where: string; navi: string };
  quest: string;
  handIn: Mat[];
  daily: Mat[];
  token: string;
  hat: { id: number; name: string; option: string[] };
};

function SideCard({ side }: { side: Side }) {
  return (
    <div className="hcside">
      <div className="hcside__hd">
        <h4 className="hcside__title">{side.title}</h4>
        <span className="hcside__fit">{side.fit}</span>
      </div>
      <figure className="evnpc">
        <span className="evnpc__art"><img src={`/images/events/2026-11-26/${side.npc.img}.png`} alt={side.npc.name} loading="lazy" /></span>
        <figcaption>
          <strong>{side.npc.name} · {side.npc.where}</strong>
          <NaviCopy cmd={side.npc.navi} />
        </figcaption>
      </figure>
      <div className="hcstep">
        <span className="hcstep__n">1</span>
        <div>
          <p className="hcstep__label">{side.quest} <Tag /></p>
          <Mats items={side.handIn} />
        </div>
      </div>
      <div className="hcstep">
        <span className="hcstep__n">2</span>
        <div>
          <p className="hcstep__label">ได้ทุกรอบ (วันละครั้ง)</p>
          <Mats items={side.daily} />
        </div>
      </div>
      <div className="hcstep">
        <span className="hcstep__n">3</span>
        <div>
          <p className="hcstep__label">เก็บ {side.token} ครบ 10 อัน แลกหมวก</p>
          <Link href={`/database/items/${side.hat.id}`} className="hchat">
            <span className="hchat__icon"><img src={`/images/items/${side.hat.id}.png`} alt="" loading="lazy" /></span>
            <span>
              <span className="hchat__name">{side.hat.name}</span>
              <span className="hchat__slot">คอสตูมหมวกบน · ใช้ 10 Token</span>
              <ul>{side.hat.option.map((o) => <li key={o}>{o}</li>)}</ul>
            </span>
          </Link>
          <p className="hcstep__label" style={{ marginTop: 10 }}>Token ที่เหลือแลกได้อีก</p>
          <ul className="hcextra">
            <li><ItemCell id={108681} png>Mixed Dish Lv.10 ×10 (กล่อง)</ItemCell><span className="hccost">3 Token</span></li>
            <li><ItemCell id={108680} png>Yggdrasil Seed ×10 (กล่อง)</ItemCell><span className="hccost">1 Token</span></li>
          </ul>
        </div>
      </div>
    </div>
  );
}

const SIDES: Side[] = [
  {
    title: 'ข้างทหาร',
    fit: 'เหมาะกับสายเก็บเลเวล',
    npc: { img: 'guard-ars', name: 'Guard Ars', where: 'Comodo', navi: '/navi comodo 33/212' },
    quest: 'ล่า Medusa ใน Western Cave Karu แล้วส่ง',
    handIn: [{ name: 'Horrendous Hair', id: 1048, qty: 20 }],
    daily: [{ name: 'Token of Courage', id: 1003367, png: true }, { name: 'Panacea', id: 525 }, { name: 'Mixed Dish Lv.10', id: 100080 }],
    token: 'Token of Courage',
    hat: { id: 31555, name: '[Costume] Heavy Infantry Helm', option: ['EXP จากมอน +5%', 'ดาเมจใส่มอนทุกธาตุทุกขนาด +10%'] },
  },
  {
    title: 'ข้าง Medusa',
    fit: 'เหมาะกับสายฟาร์มของ',
    npc: { img: 'enko', name: 'Old Woman Enko', where: 'Western Cave Karu', navi: '/navi beach_dun 242/67' },
    quest: 'หาวัตถุดิบงานเลี้ยงน้ำชาของ Medusa แล้วส่ง',
    handIn: [{ name: 'Ancient Lips', id: 1054, qty: 10 }, { name: 'Earthworm Peeling', id: 1055, qty: 20 }],
    daily: [{ name: 'Token of Friendship', id: 1003368, png: true }, { name: 'Royal Jelly', id: 526 }, { name: 'Mixed Dish Lv.10', id: 100080 }],
    token: 'Token of Friendship',
    hat: { id: 20485, name: '[Costume] Carnivorous Plant Hairpin', option: ['ATK, MATK +10', 'ดรอปไอเทม +5%'] },
  },
];

// Quest steps the notices leave out, read from the 26 Nov client's
// OngoingQuestInfoList_enUS.lub. Shown with the "จากไฟล์เกม" tag.
const Tag = () => <span className="unverified">จากไฟล์เกม</span>;

// The five petrified tourists in Western Cave Karu (beach_dun).
const TOURISTS = ['109/200', '23/189', '64/92', '246/235', '182/47'];

export const metadata: Metadata = {
  title: 'แพทช์ 26 พ.ย. 2569 Ragnarok Zero — MVP Raid Maya, Phreeoni, อีเวนต์ A Hard Choice, Bug Extermination',
  description:
    'Ragnarok Zero Global แพทช์ 26 พฤศจิกายน 2569: MVP Raid ใหม่ Maya (/navi anthell02 175/190) และ Phreeoni (/navi moc_fild17 210/230), อีเวนต์ A Hard Choice ที่ Comodo เลือกช่วย Guard Ars หรือ Old Woman Enko แลกคอสตูม, Bug Extermination ที่ Ant Hell ได้คอสตูม Jasper Crest, KP Shop ลด 10% รอบ 2 ถึง 3 ธ.ค., คอสตูม Cosmic · อีเวนต์ถึง 10 ธ.ค.',
};

export default function Patch20261126() {
  return (
    <main className="shell" style={{ paddingBlock: 32, maxWidth: 1000 }}>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'หน้าแรก', path: '/' },
          { name: 'ข่าว', path: '/news' },
          { name: 'แพทช์ 26 พ.ย.', path: PATH },
        ])}
      />
      <JsonLd
        data={articleJsonLd({
          path: PATH,
          headline: String(metadata.title),
          description: String(metadata.description),
          datePublished: PUBLISHED,
          dateModified: MODIFIED,
        })}
      />
      <nav className="crumbs" aria-label="ตำแหน่งหน้า">
        <Link href="/">หน้าแรก</Link>
        <span className="crumbs__sep" aria-hidden="true">›</span>
        <Link href="/news">ข่าว</Link>
        <span className="crumbs__sep" aria-hidden="true">›</span>
        <span className="crumbs__here">แพทช์ 26 พ.ย.</span>
      </nav>

      <header className="phero">
        <p className="phero__date">พฤหัส 26 พฤศจิกายน 2569</p>
        <h1 className="phero__title">แพทช์ 26 พ.ย.: MVP Raid Maya, Phreeoni</h1>
        <p className="phero__lead">
          MVP Raid ใหม่ 2 ตัว · อีเวนต์ A Hard Choice ที่ Comodo · อีเวนต์ Bug Extermination ที่ Ant Hell ·
          KP Shop ลด 10% รอบ 2 · คอสตูม Cosmic ใน Kafra Shop
        </p>
        <ul className="evtiles">
          <li><a href="#raids"><img src="/images/monsters/1147.gif" alt="" width={36} /><span>MVP Raid ใหม่</span><small>Maya · Phreeoni</small></a></li>
          <li><a href="#hard-choice"><img src="/images/items/1003367.png" alt="" width={28} /><span>A Hard Choice</span><small>ถึง 10 ธ.ค.</small></a></li>
          <li><a href="#bug"><img src="/images/monsters/1147.gif" alt="" width={36} /><span>Bug Extermination</span><small>ถึง 10 ธ.ค.</small></a></li>
          <li><a href="#shop"><img src="/images/items/608.gif" alt="" width={28} /><span>KP Shop ลด 10%</span><small>ถึง 3 ธ.ค.</small></a></li>
        </ul>
      </header>

      <section className="pdeadline" aria-label="ของที่มีวันหมด">
        <h2 className="pdeadline__h">ทำก่อนหมดเวลา</h2>
        <ol className="pdeadline__list">
          <li><time>3 ธ.ค.</time><span><a href="#shop">KP Shop ลด 10% รอบ 2</a></span></li>
          <li><time>10 ธ.ค.</time><span><a href="#hard-choice">A Hard Choice</a> แลก Token ให้หมด Token หายตอนจบ</span></li>
          <li><time>10 ธ.ค.</time><span><a href="#bug">Bug Extermination</a> และ<a href="#cosmic">คอสตูม Cosmic</a></span></li>
        </ol>
        <p className="pdeadline__note">วันตามประกาศ (UTC) · อีเวนต์จบตอนปิดปรับปรุง 10 ธ.ค.</p>
      </section>

      <AdSlot slot="bonus" />

      {/* ---------------- MVP Raids ---------------- */}
      <section id="raids" className="evsec evsec--yellow">
        <p className="evsec__tag">MVP RAID</p>
        <h2 className="evsec__title">MVP Raid ใหม่ 2 ตัว</h2>
        <p className="evsec__lead">ประกาศให้พิกัดจุดเข้าของแต่ละตัว · เข้า Raid แบบเดียวกับตัวก่อนๆ</p>
        <div className="ct-two">
          {RAIDS.map((m) => (
            <div key={m.id} className="card">
              <ul className="pmobs" style={{ marginTop: 0 }}>
                <li>
                  <Link href={`/database/monsters/${m.id}`} className="pmob">
                    <span className="pmob__art"><img src={`/images/monsters/${m.id}.gif`} alt="" loading="lazy" /></span>
                    <span className="pmob__name">{m.name}</span>
                  </Link>
                </li>
              </ul>
              <p className="evsmall" style={{ margin: '8px 0 6px' }}>{m.where}</p>
              <NaviCopy cmd={m.navi} />
            </div>
          ))}
        </div>
        <p className="evnote">
          ขั้นตอนเข้า Raid กับของที่ได้ดูใน <Link href="/guides/mvp">ไกด์ MVP Raid</Link> · Maya อยู่ในเนื้อเรื่อง Bug Extermination ข้างล่าง
          และเป็นบอสของ <Link href="/guides/ant-hell">Ant Hell Memorial</Link>
        </p>
        <p className="evsmall" style={{ marginTop: 8 }}>
          กล่องรางวัล Subjugation Reward Box ของทั้ง 2 ตัวมี 3 เกรด รับจาก Wolhwa <NaviCopy cmd="/navi moc_para01 18/35" />
          เมื่อนำตุ๊กตาไปให้ ทุกวัน <Tag /> ·{' '}
          <Link href="/database/items/108498">Maya</Link> · <Link href="/database/items/108495">Phreeoni</Link>
        </p>
      </section>

      {/* ---------------- A Hard Choice ---------------- */}
      <section id="hard-choice" className="evsec evsec--pink">
        <p className="evsec__tag">EVENT · 26 NOV – 10 DEC</p>
        <h2 className="evsec__title">A Hard Choice: ช่วยนักท่องเที่ยว หรือช่วย Medusa</h2>
        <p className="evsec__lead">
          นักท่องเที่ยวกลายเป็นหินใน Western Cave Karu ที่ Comodo · มีเควสหลักกับเควสรายวัน
          แต่<b>เควสรายวันต้องเลือกข้างเดียว</b> รับของ NPC หนึ่งแล้วรับของอีกคนไม่ได้
        </p>

        <h3 className="evh">1. เควสหลัก</h3>
        <div className="pnpc">
          <figure className="evnpc">
            <span className="evnpc__art"><img src="/images/events/2026-11-26/guard-ars.png" alt="Guard Ars" loading="lazy" /></span>
            <figcaption>
              <strong>Guard Ars · Comodo</strong>
              <NaviCopy cmd="/navi comodo 33/212" />
            </figcaption>
          </figure>
        </div>
        <ol className="evsteps">
          <li>คุยกับ Guard Ars ที่ Comodo แล้วเข้า Western Cave Karu</li>
          <li>
            หานักท่องเที่ยวที่กลายเป็นหิน 5 จุด แก้หินแล้วพากลับ <Tag />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
              {TOURISTS.map((xy) => <NaviCopy key={xy} cmd={`/navi beach_dun ${xy}`} />)}
            </div>
          </li>
          <li>พานักท่องเที่ยวไปส่ง Guard Ars หรือ Old Woman Enko <Tag /></li>
        </ol>

        <h3 className="evh">2. เควสรายวัน: เลือก 1 ข้าง</h3>
        <p className="evsmall">ทำได้วันละครั้ง และวันนั้นทำได้แค่ข้างเดียว · หมวกแต่ละใบใช้ Token ของข้างตัวเอง 10 อัน</p>
        <div className="ct-two">
          {SIDES.map((side) => <SideCard key={side.title} side={side} />)}
        </div>
        <p className="evnote">
          Token of Courage / Friendship หายเมื่ออีเวนต์จบ แลกให้หมดก่อน 10 ธ.ค. · ออปชันบนหมวกใช้ได้ถึงอีเวนต์จบ ตัวคอสตูมยังอยู่ · ดาเมจ +10% ไม่รวมใส่ผู้เล่น · Mixed Dish Lv.10 เพิ่มทุกสเตตัส +10 และฟื้น HP/SP 10% ·
          ประกาศไม่บอกจำนวนของที่ได้ต่อรอบ · ป้าย <Tag /> = จากไคลเอนต์แพทช์ 26 พ.ย. ยังไม่ได้เช็กในเกม
        </p>
      </section>

      {/* ---------------- Bug Extermination ---------------- */}
      <section id="bug" className="evsec evsec--cyan">
        <p className="evsec__tag">EVENT · 26 NOV – 10 DEC</p>
        <h2 className="evsec__title">Bug Extermination: กำจัดแมลงใน Ant Hell</h2>
        <p className="evsec__lead">
          เนื้อเรื่องเปิดตัว MVP Maya และปูทางสู่ <Link href="/guides/ant-hell">Ant Hell Memorial</Link> · มีเควสหลักกับเควสรายวัน
        </p>

        <h3 className="evh">1. เควสหลัก: Guillon</h3>
        <div className="pnpc">
          <figure className="evnpc">
            <span className="evnpc__art"><img src="/images/events/2026-11-26/guillon.png" alt="Guillon" loading="lazy" /></span>
            <figcaption>
              <strong>Guillon · ทุ่ง Comodo</strong>
              <NaviCopy cmd="/navi cmd_fild08 326/323" />
            </figcaption>
          </figure>
        </div>
        <p className="evsmall">Guillon กลัวแมลง ขอให้ไปกำจัดแมลงที่ทะลักออกจากหลุมยักษ์กลางทะเลทราย (Ant Hell)</p>
        <ol className="evsteps">
          <li>ทำลาย Ant Egg 20 ฟอง <Tag /></li>
          <li>ไปหา Lyrias ที่ Ant Hell ชั้น 1 <Tag /></li>
          <li>
            ล่ามดใน Ant Hell เก็บ Maya&apos;s Relic สีละ 5 (4 สี) ส่ง Lyrias <Tag />
            <Mats
              items={[
                { name: "Maya's Relic (Blue)", id: 1003373, png: true, qty: 5 },
                { name: "Maya's Relic (Purple)", id: 1003374, png: true, qty: 5 },
                { name: "Maya's Relic (Green)", id: 1003375, png: true, qty: 5 },
                { name: "Maya's Relic (Red)", id: 1003376, png: true, qty: 5 },
              ]}
            />
          </li>
        </ol>
        <div className="evreward">
          <span className="evreward__tag">REWARD</span> <ItemCell id={400221} png><b>[Costume] Jasper Crest</b></ItemCell> (หมวกบน ทุกอาชีพ)
        </div>

        <h3 className="evh">2. เควสรายวัน: Lyrias</h3>
        <div className="pnpc">
          <figure className="evnpc">
            <span className="evnpc__art"><img src="/images/events/2026-11-26/lyrias.png" alt="Lyrias" loading="lazy" /></span>
            <figcaption>
              <strong>Pest Extermination Lyrias · Ant Hell ชั้น 1</strong>
              <NaviCopy cmd="/navi anthell01 53/246" />
            </figcaption>
          </figure>
        </div>
        <p className="evsmall">
          ส่ง Maya&apos;s Relic สีละ 5 อีกรอบทุกวัน แล้วกลับมาหา Lyrias วันถัดไปเพื่อเปิดพลัง Relic <Tag /> · Relic หายเมื่ออีเวนต์จบ ·
          ได้ต่อรอบ:
        </p>
        <Mats items={[{ name: 'Royal Jelly', id: 526, qty: 3 }]} />
        <div className="evreward">
          <span className="evreward__tag">BUFF 4 ชม.</span> DEF +4, MDEF +4 · รับดาเมจจากมอนเผ่าแมลงลดลง 15% · CRIT +5 ใส่มอนเผ่าแมลง
        </div>
      </section>

      {/* ---------------- Shop ---------------- */}
      <section id="shop" className="ct-ch">
        <h2 className="ct-ch__title"><span className="ct-ch__n">KP</span>KP Shop ลด 10% ทั้งร้าน รอบ 2</h2>
        <div className="card">
          <p style={{ margin: 0, lineHeight: 1.65 }}>
            ส่วนลด Black Friday รอบ 2 <b>26 พ.ย. – 3 ธ.ค.</b> (UTC) ลด 10% ทั้ง KP Shop
          </p>
          <p className="muted" style={{ marginTop: 8, fontSize: 13.5 }}>
            โบนัสเติม KP 10% (ครั้งแรกต่อแพ็กเกจ) ยังได้ถึง 3 ธ.ค. · <Link href="/news/events-2026-11#promotion">Black Friday Promotion</Link>
          </p>
        </div>
      </section>

      <section id="cosmic" className="ct-ch">
        <h2 className="ct-ch__title"><span className="ct-ch__n">★</span>คอสตูม Cosmic Collection</h2>
        <div className="card">
          <p style={{ margin: 0, lineHeight: 1.65 }}>
            ขาย <b>26 พ.ย. – 10 ธ.ค.</b> (UTC) · คอสตูม 5 ชิ้น:
          </p>
          <ul style={{ margin: '8px 0 0', paddingInlineStart: 20, lineHeight: 1.8 }}>
            <li><Link href="/database/items/18742">[Costume] Moon and Stars</Link> · หมวกกลาง</li>
            <li><Link href="/database/items/480457">[Costume] Galapago Aquarium</Link> · ผ้าคลุม</li>
            <li><Link href="/database/items/20349">[Costume] Flying Galapago</Link> · หมวกล่าง</li>
            <li><Link href="/database/items/19808">[Costume] Blazing Sun</Link> · หมวกบน</li>
            <li><Link href="/database/items/410074">[Costume] Gravekeeper Blinker</Link> · หมวกกลาง</li>
          </ul>
          <p style={{ marginTop: 10, lineHeight: 1.65 }}>
            <b>เซิร์ฟ SEA</b>: ขายเป็น <Link href="/database/items/108659"><b>Cosmic Scroll</b></Link> สุ่ม ได้คอสตูม 5 ชิ้นนี้ หรือของปลอบใจ (Giant Fly Wing 100ea Box, Special Buff Selection Box,
            Small Mana Potion ×2, Token of Siegfried, Small Healing Potion ×3, Life Insurance) ไม่การันตีชิ้นที่อยากได้ ·
            <b> เซิร์ฟ EU</b>: ขายเป็นกล่องเลือกเอง Premium (3 ชิ้นแรก) กับ Special (Blazing Sun, Gravekeeper Blinker)
          </p>
          <p className="muted" style={{ marginTop: 8, fontSize: 13.5 }}>
            ประกาศไม่บอกราคา · กล่อง Special ของ EU ประกาศเขียนว่า &ldquo;Burning Sun&rdquo; แต่รายการคอสตูมเขียน Blazing Sun
          </p>
        </div>
      </section>

      {/* ---------------- Maintenance ---------------- */}
      <section id="maint" className="ct-ch">
        <h2 className="ct-ch__title"><span className="ct-ch__n">⏱</span>ปิดปรับปรุง (เวลาไทย)</h2>
        <div className="card">
          <table className="stat-table ct-times">
            <tbody>
              <tr><td>วันที่</td><td className="num">พฤหัส 26 พ.ย. 2569</td></tr>
              <tr><td>เริ่มปิด</td><td className="num">08:00 น. (01:00 UTC)</td></tr>
              <tr><td>เปิดเซิร์ฟ</td><td className="num">—</td></tr>
            </tbody>
          </table>
          <p className="muted" style={{ marginTop: 8, fontSize: 13.5 }}>ยังไม่มีประกาศปิดปรับปรุงเสร็จ</p>
        </div>
      </section>

      <section id="ending" className="ct-ch">
        <h2 className="ct-ch__title"><span className="ct-ch__n">✓</span>จบไปตอนปิดปรับปรุงนี้</h2>
        <div className="card">
          <ul style={{ margin: 0, paddingInlineStart: 20, lineHeight: 1.9 }}>
            {ENDED.map((e) => (
              <li key={e.name}>{e.href ? <Link href={e.href}>{e.name}</Link> : e.name}</li>
            ))}
          </ul>
        </div>
      </section>

      <p className="source-note" style={{ marginTop: 20 }}>
        <strong>ที่มา:</strong> ประกาศทางการ Ragnarok Zero: Global บน roz.mygnjoy.com:
        Update Notice &ldquo;New Threats Stir Across Midgard | November 26 Update!&rdquo; (25 พ.ย. 2569),
        Event Quest &ldquo;A Hard Choice&rdquo; และ &ldquo;Bug Extermination&rdquo; (25 พ.ย.), Promo Notice &ldquo;Cosmic Costume Collection&rdquo; (26 พ.ย.),
        ประกาศปิดปรับปรุง 26 พ.ย. (24–25 พ.ย.) · รูป NPC ไอคอนไอเทม และขั้นเควสที่มีป้ายจากไฟล์เกม มาจากไคลเอนต์แพทช์ 26 พ.ย. · หน้านี้เป็นสรุปแปล ไม่ใช่ประกาศทางการ
      </p>
    </main>
  );
}
