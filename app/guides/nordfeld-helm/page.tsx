// app/guides/nordfeld-helm/page.tsx
//
// Nordfeld Platinum Helm: how to get it, and the scroll players call "ใบสุ่ม".
// Ten class guides on this site tell the reader to wear this helm and none
// said where it comes from -- that gap is why the page exists (owner, 28 Sep
// 2026).
//
// What is from where:
//   - The helm's stats, the scroll's rules (random enchant, keeps refine and
//     cards, only for this helm) and the token names: the game's own Thai item
//     text in data/game-items.json.
//   - The route, the 300 / 10 token prices and cave 2's Lv 50 gate: two Thai
//     clips that show the exchange on screen (Viva-Tz, IKissz). Ryan Geldun
//     says "100 pieces" in passing; the two clips that show the NPC say 300,
//     so the page goes with 300 and says the other number exists.
//   - Which dwarves live in cave 2: an inference from level (the four Lv 64-65
//     dwarves in our data), labelled as such. Our drop table has no rows for
//     the tokens, so no rates are shown.
import Link from 'next/link';
import type { Metadata } from 'next';
import PageHeader from '@/components/PageHeader';
import Caveat from '@/components/Caveat';
import JsonLd from '@/components/JsonLd';
import AdSlot from '@/components/AdSlot';
import { breadcrumbJsonLd } from '@/lib/jsonld';
import { itemHref } from '@/lib/item-href';

export const revalidate = 86400;

const PATH = '/guides/nordfeld-helm';

export const metadata: Metadata = {
  title: 'หมวก Nordfeld Platinum Helm Ragnarok Zero — แลกยังไง ใบสุ่มออปได้จากไหน',
  description:
    'วิธีได้หมวก Nordfeld Platinum Helm ใน Ragnarok Zero Global: ไป Nordfeld จากท่าเรือ Alberta (200 Zeny, Lv 50) ฟาร์ม Advanced Boulder Dwarf Token ในถ้ำชั้น 2 แลกหมวก 300 อัน และแลกใบสุ่ม Nordfeld Helm Scroll 10 อันเพื่อสุ่มออปชันใหม่ได้เรื่อย ๆ',
};

const HELM = { id: 401510, name: 'Nordfeld Platinum Helm', icon: '/images/items/401510.png' };
const SCROLL = { id: 107871, name: 'Nordfeld Helm Scroll', icon: '/images/items/107871.png' };
const TOKEN = { id: 1002998, name: 'Advanced Boulder Dwarf Token', icon: '/images/items/1002998.png' };
const TOKEN_PLAIN = { id: 1002997, name: 'Boulder Dwarf Token', icon: '/images/items/1002997.png' };
const ONYX = { id: 401509, name: 'Nordfeld Onyx Helm', icon: '/images/items/401509.png' };

const HELM_COST = 300;
const SCROLL_COST = 10;

// The Lv 64-65 dwarves in our monster data -- cave 2 is the Lv 50 part of
// Nordfeld, so these are the likely residents. Inference, shown as one.
const CAVE2 = [
  { id: 25327, name: 'Boulder Dwarf Hammer (Armored)', level: 64 },
  { id: 25328, name: 'Boulder Dwarf Mace (Armored)', level: 65 },
  { id: 25329, name: 'Boulder Dwarf Leader', level: 64 },
  { id: 25336, name: 'Boulder Dwarf Swordmaster', level: 64 },
];

// Option lines seen on this helm, each with where it was seen.
const SEEN_OPTIONS = [
  { line: 'HIT +20 · MaxHP +164', where: 'หมวกที่ขายในกลุ่มซื้อขาย FB (ก.ย. 2569)' },
  { line: 'FLEE ราว 20 หรือ MATK ราว 20', where: 'คลิปไกด์ Rogue Autospell' },
  { line: 'INT', where: 'คลิปบิลด์ Rogue Meteor (Robb November)' },
  { line: 'STR / DEX +3 ถึง +4', where: 'Ryan Geldun: ของจาก Nordfeld ติดค่าสเตตัสได้ ต่างจากของทั่วไป' },
];

const CLIP = {
  viva: { label: 'Viva-Tz: วิธีแลกหมวก Nordfeld Platinum Helm และสุ่มหาออฟชัน', url: 'https://www.youtube.com/watch?v=jZ9SKuMr_SY' },
  ikissz: { label: 'IKissz: Advanced Boulder Dwarf Token เอาไว้ทำอะไร', url: 'https://www.youtube.com/watch?v=hELF0iasDnw' },
  ryan: { label: 'Ryan Geldun: Nordfeld Cave lvl2', url: 'https://www.youtube.com/watch?v=ITBZbgYEq2E' },
};

function Clip({ c }: { c: { label: string; url: string } }) {
  return <a href={c.url} target="_blank" rel="noopener noreferrer">{c.label}</a>;
}

function Icon({ src, size = 32 }: { src: string; size?: number }) {
  return <img src={src} alt="" width={size} height={size} style={{ imageRendering: 'pixelated', verticalAlign: 'middle' }} />;
}

export default function NordfeldHelmPage() {
  return (
    <main className="shell guildp" style={{ paddingBlock: 32 }}>
      <JsonLd data={breadcrumbJsonLd([
        { name: 'หน้าแรก', path: '/' },
        { name: 'ไกด์', path: '/guides' },
        { name: 'หมวก Nordfeld', path: PATH },
      ])} />
      <nav className="crumbs" aria-label="ตำแหน่งหน้า">
        <Link href="/">หน้าแรก</Link><span className="crumbs__sep" aria-hidden="true">›</span>
        <Link href="/guides">ไกด์</Link><span className="crumbs__sep" aria-hidden="true">›</span>
        <span className="crumbs__here">หมวก Nordfeld</span>
      </nav>

      <PageHeader
        title="หมวก Nordfeld Platinum Helm — แลกยังไง ใบสุ่มได้จากไหน"
        lead="หมวกที่ไกด์อาชีพหลายอาชีพแนะนำ แลกฟรีด้วยโทเคนจากถ้ำ Nordfeld แล้วใช้ใบสุ่มหาออปชันที่ต้องการ"
      />

      <section className="card card--yellow" style={{ marginTop: 14 }}>
        <div className="guildp__hero">
          <Icon src={HELM.icon} size={40} />
          <div>
            <strong><Link href={itemHref(HELM.id, 'Armor')}>{HELM.name}</Link></strong>
            <p className="guildp__stats">MaxHP +100 · MaxSP +50 · ตีถึง +7 ได้เพิ่ม MaxHP +100 · MaxSP +50</p>
            <p className="muted">หมวกบน · DEF 6 · Slot 1 · เลเวล 50 · ทุกอาชีพ</p>
          </div>
        </div>
        <p style={{ marginTop: 10 }}>
          <strong>ที่ทำให้มันดีคือออปชัน</strong> ตัวหมวกค่าไม่สูง แต่สุ่มออปได้ไม่จำกัดด้วยใบสุ่ม จึงปั้นให้ตรงบิลด์ได้
        </p>
        <p className="muted" style={{ marginTop: 6, fontSize: 13 }}>ค่าหมวกจากข้อความในเกม</p>
      </section>

      <section className="card" style={{ marginTop: 14 }}>
        <h2 className="section-title" style={{ marginTop: 0 }}>วิธีได้หมวก ทีละขั้น</h2>
        <ol className="guildp__steps">
          <li><strong>เปิดเควสหลักสาย Nordfeld ก่อน</strong> ยังไม่เปิดเควส ทหารที่ท่าเรือจะไม่พาไป</li>
          <li>
            <strong>ไป Alberta แล้วคุยทหาร Nordfeld แถวท่าเรือ</strong> เลือก &quot;ไปเยือน&quot; เสียค่าเดินทาง <strong>200 Zeny</strong> ·
            คลิปหนึ่งบอกต้องเลเวล 50 ถึงจะนั่งเรือได้ แต่ Ryan Geldun ไป Nordfeld ได้ตั้งแต่ก่อนเลเวล 50 ถ้าไปไม่ได้ให้ลองใหม่ตอนถึง 50
          </li>
          <li>
            <strong>ฟาร์ม <Icon src={TOKEN.icon} size={20} /> {TOKEN.name} (โทเคนสีเหลือง)</strong> ในถ้ำ Nordfeld ชั้น 2 ซึ่ง<strong>เข้าได้ตั้งแต่เลเวล 50</strong> ·
            Thief ใช้ Steal ขโมยจากมอนได้ด้วย
          </li>
          <li>
            <strong>เดินตรงเข้าปราสาท Nordfeld ไปจนสุดทาง</strong> คุย NPC แลกของ (ในปราสาทเข้าได้ทุกเลเวล) แลกหมวกด้วยโทเคนสีเหลือง <strong>{HELM_COST} อัน</strong>
          </li>
          <li>
            <strong>หมวกที่แลกมายังไม่มีออปชัน</strong> ต้องแลกใบสุ่มมาใช้ต่อ (หัวข้อถัดไป)
          </li>
        </ol>
        <p className="guildp__src">
          ที่มา: <Clip c={CLIP.viva} /> และ <Clip c={CLIP.ikissz} /> สองคลิปตรงกันเรื่องเส้นทาง ราคาหมวก {HELM_COST} อัน และถ้ำชั้น 2 เลเวล 50 ·
          Ryan Geldun พูดผ่าน ๆ ว่าใช้ &quot;100 ชิ้น&quot; แต่สองคลิปที่แลกให้ดูบนจอเป็น {HELM_COST}
        </p>
      </section>

      <section className="card" style={{ marginTop: 14 }}>
        <h2 className="section-title" style={{ marginTop: 0 }}>ใบสุ่ม (Nordfeld Helm Scroll)</h2>
        <div className="guildp__hero">
          <Icon src={SCROLL.icon} size={40} />
          <div>
            <strong><Link href={itemHref(SCROLL.id, 'Other')}>{SCROLL.name}</Link></strong>
            <p className="guildp__stats">แลกที่ NPC ตัวเดียวกัน ใช้โทเคนสีเหลือง {SCROLL_COST} อันต่อใบ</p>
          </div>
        </div>
        <ul className="guildp__steps" style={{ listStyle: 'disc' }}>
          <li><strong>ดับเบิลคลิกใบสุ่ม ลากหมวกใส่ช่อง แล้วกดสุ่ม</strong></li>
          <li><strong>ไม่พอใจก็สุ่มใหม่ได้เรื่อย ๆ</strong> ใบละครั้ง ไม่มีคลิปไหนเห็นหมวกแตก</li>
          <li><strong>ขั้นตีบวกและการ์ดที่ใส่อยู่ไม่หาย</strong> ข้อความในเกมเขียนไว้เอง จะตีบวกก่อนหรือหลังสุ่มก็ได้</li>
          <li><strong>ใช้ได้กับหมวกนี้อย่างเดียว</strong> ไม่ใช่ใบสุ่มของชิ้นอื่น</li>
        </ul>
        <h3 style={{ margin: '16px 0 6px', fontSize: 15 }}>ออปชันที่เคยเห็นบนหมวกนี้</h3>
        <ul style={{ margin: 0, paddingInlineStart: 20, lineHeight: 1.9 }}>
          {SEEN_OPTIONS.map((o) => (
            <li key={o.line}><strong>{o.line}</strong> <span className="muted">— {o.where}</span></li>
          ))}
        </ul>
        <p className="muted" style={{ marginTop: 6, fontSize: 13 }}>
          เป็นค่าที่เห็นจริง ไม่ใช่ช่วงสุ่มเต็ม ยังไม่มีใครเปิดเผยว่าออปแต่ละแบบออกบ่อยแค่ไหน
        </p>
        <p className="guildp__src">
          ที่มา: กติกาใบสุ่มจากข้อความไอเทมในเกม · วิธีกดสุ่มและราคา {SCROLL_COST} อันจาก <Clip c={CLIP.viva} />
        </p>
      </section>

      <AdSlot slot="inline" />

      <section className="card" style={{ marginTop: 14 }}>
        <h2 className="section-title" style={{ marginTop: 0 }}>ถ้ำชั้น 2 เตรียมตัวยังไง</h2>
        <ul className="guildp__steps" style={{ listStyle: 'disc' }}>
          <li><strong>คนแคระไม่โจมตีก่อน</strong> เดินผ่านได้สบาย</li>
          <li><strong>แต่ตีตัวหนึ่ง ตัวชนิดเดียวกันจะเข้ามารุม</strong> ทางในเหมืองแคบ มักโดนหลายตัวพร้อมกัน</li>
          <li><strong>เลือดหนาราว 60,000–100,000</strong> ขนาดกลาง เผ่ามนุษย์ ธาตุดิน</li>
          <li><strong>ไปเป็นทีมดีกว่า</strong> เช่นพา Mage หรือ Swordsman ที่พก Cheese ฟื้น SP ไปด้วย เล่นคนเดียวได้แต่ยาก</li>
          <li><strong>โทเคนดรอปไม่บ่อย</strong> ถ้ำชั้น 2 ไม่ได้ดรอปถี่กว่าชั้น 1 หรือทุ่งรอบ ๆ ต้องใช้เวลาพอสมควร</li>
        </ul>
        <h3 style={{ margin: '16px 0 8px', fontSize: 15 }}>คนแคระที่น่าจะอยู่ชั้น 2</h3>
        <div className="stardrop__grid">
          {CAVE2.map((m) => (
            <Link key={m.id} href={`/database/monsters/${m.id}`} className="stardrop__mon">
              <img src={`/images/monsters/${m.id}.png`} alt="" width={44} height={44} loading="lazy" className="stardrop__img" />
              <span className="stardrop__monname">{m.name}</span>
              <span className="muted stardrop__lv">Lv {m.level}</span>
            </Link>
          ))}
        </div>
        <p className="muted" style={{ marginTop: 8, fontSize: 13 }}>
          เลือกจากเลเวล: สี่ตัวนี้คือคนแคระเลเวล 64–65 ในข้อมูลเรา ส่วนตัวเลเวล 22–25 น่าจะเป็นชั้น 1 · ฐานข้อมูลยังไม่มีเปอร์เซ็นต์ดรอปของโทเคน
        </p>
        <p className="guildp__src">ที่มา: <Clip c={CLIP.ryan} /></p>
      </section>

      <section className="card" style={{ marginTop: 14 }}>
        <h2 className="section-title" style={{ marginTop: 0 }}>ของอื่นที่เกี่ยว</h2>
        <ul style={{ margin: 0, paddingInlineStart: 20, lineHeight: 1.9 }}>
          <li>
            <Icon src={TOKEN_PLAIN.icon} size={20} /> <Link href={itemHref(TOKEN_PLAIN.id, 'Other')}>{TOKEN_PLAIN.name}</Link> โทเคนธรรมดา (ไม่ใช่สีทอง) ใช้แลกหมวกไม่ได้
          </li>
          <li>
            <Icon src={ONYX.icon} size={20} /> <Link href={itemHref(ONYX.id, 'Armor')}>{ONYX.name}</Link> หมวกรุ่นเล็ก เลเวล 20 MaxHP +50 MaxSP +20 · ยังไม่รู้ว่าแลกด้วยอะไร
          </li>
          <li>ชุดอื่นจาก Nordfeld: <Link href={itemHref(450588, 'Armor')}>Nordfeld Soldier&apos;s Armor</Link> · <Link href={itemHref(450587, 'Armor')}>Nordfeld Mantle</Link></li>
        </ul>
      </section>

      <Caveat label="เชื่อได้แค่ไหน">
        ค่าหมวก กติกาใบสุ่ม และชื่อโทเคน <strong>มาจากข้อความไอเทมในเกม</strong> ·
        เส้นทาง ราคาแลก และเลเวลเข้าถ้ำ <strong>มาจากคลิปผู้เล่นไทยสองคลิปที่ตรงกัน</strong> ·
        รายชื่อคนแคระชั้น 2 เป็นการอนุมานจากเลเวล ·
        ออปชันที่เห็นมาจากคนละแหล่ง ไม่ใช่ตารางสุ่มทางการ
      </Caveat>

      <p className="muted" style={{ marginTop: 16 }}>
        ดูต่อ: <Link href="/guides/classes">ไกด์อาชีพ</Link> · <Link href="/tools/refine">คำนวณตีบวก</Link> ·{' '}
        <Link href="/guides/faq">คำถามที่ถามบ่อย</Link>
      </p>
    </main>
  );
}
