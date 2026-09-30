// app/guides/faq/page.tsx
//
// The questions Thai players actually ask, collected from the Facebook groups
// and clips during the Sep 2026 research rounds (docs/GAME_MODEL.md rounds
// 13-19). Each answer is short and links to the page that has the detail.
//
// Rules for this page:
//   - Only questions that come up again and again in the groups, not ones we
//     think people should ask.
//   - An answer we do not have says so. "ยังไม่มีคำตอบที่ยืนยันได้" is an
//     answer; a guess dressed as one is not.
//   - No FAQPage schema (see lib/jsonld.ts: Google stopped showing it for
//     sites like this one).
import Link from 'next/link';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import PageHeader from '@/components/PageHeader';
import Caveat from '@/components/Caveat';
import JsonLd from '@/components/JsonLd';
import AdSlot from '@/components/AdSlot';
import { breadcrumbJsonLd } from '@/lib/jsonld';

export const revalidate = 86400;

const PATH = '/guides/faq';

export const metadata: Metadata = {
  title: 'คำถามที่ถามบ่อย Ragnarok Zero Global — ค่าเล่น บอท รีเซ็ต ขายของ ตีบวก',
  description:
    'รวมคำถามที่ผู้เล่น Ragnarok Zero Global ถามบ่อยในกลุ่ม: ต้องเติมเงินไหม ไอดีทดลองทำอะไรไม่ได้ บอทในเกมโดนแบนไหม ลงสเตตัสยังไง รีเซ็ตฟรีถึงเลเวลไหน ตั้งร้านยังไง ตีบวกแตกไหม เวลาเซิร์ฟเป็นเวลาไทยเท่าไร',
};

type QA = { q: string; a: ReactNode; unsure?: boolean };
type Group = { id: string; title: string; items: QA[] };

const GROUPS: Group[] = [
  {
    id: 'pay',
    title: 'ค่าเล่นและไอดี',
    items: [
      {
        q: 'เล่นฟรีได้ไหม ต้องเติมเงินอะไรบ้าง',
        a: <>ต้องมี <strong>Game Pass (Air Time)</strong> ถึงจะเข้าเล่นได้ ราว 300 บาทต่อเดือน (คลิปบอก 298 บ้าง 350 บ้าง) แบบ 6 เดือน 1,600 บาท · มีทดลองฟรี 3 วัน · เงินอีกแบบคือ C Point ไว้ซื้อของใน Cash Shop ซึ่งไม่จำเป็น ของสวมใส่ดี ๆ มาจากการดรอป</>,
      },
      {
        q: 'ไอดีทดลองฟรีทำอะไรไม่ได้บ้าง',
        a: <>ตั้งแต่แพตช์ 3 ก.ย. 2569: <strong>เทรดไม่ได้ ทิ้งของลงพื้นไม่ได้ สร้างหรือเข้ากิลด์ไม่ได้ ตั้งร้านไม่ได้</strong> ทีมงานทำเพื่อกันไอดีทดลองไปทำบอทขาย Zeny</>,
      },
      {
        q: 'เปิดดูร้านในตลาดไม่ได้ ขึ้นว่าใช้ได้เฉพาะคนเติมเงิน',
        a: <>น่าจะเป็นข้อจำกัดของไอดีที่ไม่มี Pass หรือไอดีทดลอง เพราะคนเริ่มบ่นวันถัดจากแพตช์ที่ใส่ข้อจำกัด ยังไม่มีประกาศยืนยัน</>,
        unsure: true,
      },
      {
        q: 'อีเมลเดียวเปิดได้กี่ไอดี',
        a: <>อีเมลหนึ่งผูกได้ไอดีเดียว อยากเปิดหลายจอต้องสมัครหลายอีเมล · ไอดีหนึ่งสร้างตัวละครฟรีได้ 6 ตัว (เพิ่มจาก 5 ในแพตช์ 17 ก.ย.)</>,
      },
    ],
  },
  {
    id: 'start',
    title: 'เริ่มเล่นและเก็บเลเวล',
    items: [
      {
        q: 'เริ่มแรกลงสเตตัสยังไง',
        a: <>ทุกคลิปไทยแนะนำตรงกันว่า <strong>ลง DEX ราว 20 ก่อน</strong> จะได้ตีโดน ที่เหลือตามสายอาชีพ · ลงผิดไม่ต้องกลัว รีเซ็ตฟรีถึงเลเวล 40 · ดูบิลด์รายอาชีพที่ <Link href="/guides/classes">ไกด์อาชีพ</Link></>,
      },
      {
        q: 'รีเซ็ตสเตตัสกับสกิลฟรีถึงเลเวลไหน',
        a: <><strong>ฟรีถึงเลเวล 40</strong> ที่ห้อง &quot;แว่นดำ&quot; ใน Payon · เกินจากนั้นใช้ Zelstar จาก Cash Shop เลเวลละ 1 อัน · รายละเอียดและราคาที่ <Link href="/guides/social">รีเซ็ตสเตตัส แคลน แต่งงาน</Link></>,
      },
      {
        q: 'ไปเก็บเลเวลที่ไหนดี',
        a: <>ใส่เลเวลแล้วดูได้ที่ <Link href="/tools/leveling-spots">ฟาร์มที่ไหนดี</Link> มีทั้งจุดเก็บเลเวล จุดทิ้งบอท และจุดหาเงิน พร้อมจุดที่ผู้เล่นใช้จริง เช่น Horn/Elder Willow ช่วง 40 และหมู่บ้าน Goblin ช่วง 40-50</>,
      },
      {
        q: 'ติดเลเวล 47-48 ขึ้นช้ามาก',
        a: <>ไปทำเควสหลักที่ค้างไว้ ให้ EXP ก้อนใหญ่ · เนื้อเรื่องหลักตอนนี้จบที่ช่วง 50-60 ตอนถัดไปเปิดที่เลเวล 61</>,
      },
      {
        q: 'เปลี่ยนอาชีพขั้น 2 ต้องทำเควสไหม',
        a: <>ไม่ต้อง เลเวลถึงแล้วคุยกับ NPC อาชีพได้เลย และได้สกิลขั้นสูงบางตัวติดมาด้วย · ดูที่ <Link href="/guides/job-change">เปลี่ยนอาชีพ 2</Link></>,
      },
      {
        q: 'แบกของหนักเกิน ทำยังไง',
        a: <>บัตร Gym ใน Cash Shop 2,000 แคช ใบละ +200 ใช้ได้ถึง 10 ใบ (+2,000) เพิ่มถาวร · ใช้ที่ห้องเดียวกับรีเซ็ตใน Payon</>,
      },
    ],
  },
  {
    id: 'bot',
    title: 'บอทในเกม (Auto-Hunt)',
    items: [
      {
        q: 'ใช้บอทในเกมโดนแบนไหม',
        a: <><strong>บอทในเกมใช้ได้ ฟรี ไม่จำกัด</strong> ตั้งแต่เลเวล 1 เปิดทิ้งไว้ 10 ชั่วโมงก็ไม่หลุด · ที่โดนแบนเป็นระลอกคือ<strong>โปรแกรมบอทจากนอกเกม</strong></>,
      },
      {
        q: 'ตั้ง "SP ต่ำกว่า 10% ใช้แค่ตีธรรมดา" แล้วไม่ทำงาน',
        a: <>ต้องเปิด &quot;ตีธรรมดา&quot; ในแท็บสกิลของบอทไว้ก่อน ค่าในแท็บต่าง ๆ โยงกัน ถ้าอีกแท็บปิดอยู่ คำสั่งนี้จะไม่ทำงาน</>,
      },
      {
        q: 'ตั้งบอทตัวเกาะปาร์ตี้ (ตัวดูด) ยังไง',
        a: <>ตั้งให้หยุดตีและเดินเองเมื่อ SP ต่ำกว่า 100% · วาร์ปเมื่อโดนดาเมจเกิน 10 · ให้ตีเฉพาะมอนหายากหรือมอนอีเวนต์ · ปิดตีธรรมดา ใส่ Teleport ในแท็บเคลื่อนที่ · ใส่ชุด FLEE กับของฟื้น SP · Max SP 380 ก็อยู่ได้ทั้งวัน</>,
      },
      {
        q: 'เปิดบอทแล้วตายบ่อย',
        a: <>หาของ FLEE 13-15 ก่อนเปิดบอท ชุดถูกคือ Hood กับ Condor Card · ดูแมพที่บอทหลบมอนได้ครบทุกตัวที่ <Link href="/tools/leveling-spots?mode=afk">ฟาร์มที่ไหนดี โหมดทิ้งบอท</Link></>,
      },
      {
        q: 'บอทชอบเดินไปเก็บของที่คนอื่นตี หรือใช้ฮีลแล้วบอทเอ๋อ',
        a: <>ถามกันเยอะในกลุ่ม แต่ยังไม่มีคำตอบที่ยืนยันได้</>,
        unsure: true,
      },
    ],
  },
  {
    id: 'trade',
    title: 'ซื้อขาย',
    items: [
      {
        q: 'ตั้งร้านขายของยังไง',
        a: <>ตั้งได้เฉพาะ Prontera Market (คาฟ่าพาไป) · ร้าน Merchant ลงของได้ 12 รายการ · ร้านออฟไลน์ใช้ใบร้าน ลงได้ 3 รายการ ขายต่อตอนออฟไลน์จนใบหมดอายุ · ใบได้จากเควสส่งของ (ฟรี รับได้ทุก 7 วัน) หรือซื้อด้วย Zeny หรือแคช · <Link href="/guides/vending">วิธีทำเควสทีละขั้น</Link></>,
      },
      {
        q: 'ค้นร้านตามออปชันได้ไหม',
        a: <>ไม่ได้ ต้องคลิกดูทีละร้าน คนส่วนใหญ่เลยไปซื้อขายของออปสวยกันในกลุ่ม Facebook</>,
      },
      {
        q: 'การ์ดถอดออกจากของได้ไหม',
        a: <>เซิร์ฟไต้หวันที่เปิดก่อนถอดไม่ได้ เซิร์ฟเรายังไม่มีหลักฐานว่าถอดได้ · ใส่การ์ดครั้งเดียวติดไปกับของชิ้นนั้น</>,
        unsure: true,
      },
    ],
  },
  {
    id: 'gear',
    title: 'ของสวมใส่',
    items: [
      {
        q: 'ตีบวกแตกไหม',
        a: <>แตกได้ตั้งแต่ +1 · ตีจริงผ่านราว 50% ช่วง +5 ถึง +7 และราว 40% ช่วง +7 ถึง +8 · HD Oridecon (จากการเติมเงิน) พลาดแค่ลดขั้นไม่แตก · Blacksmith Blessing กันแตกตอนตีขึ้น +8 ได้จาก MVP Raid หรือกาชาไข่ครบ 60 ครั้ง · คำนวณที่ <Link href="/tools/refine">คำนวณตีบวก</Link></>,
      },
      {
        q: 'สีชื่อไอเทมบอกอะไร',
        a: <>บอกจำนวนบรรทัดออปชัน ชื่อสีม่วงคือมี 3 บรรทัด</>,
      },
      {
        q: 'ของแบบไหนสุ่มออปชันได้',
        a: <>อาวุธ เสื้อ ผ้าคลุม รองเท้า หมวก และเครื่องประดับ ทั้งของดรอปและของเควส · ของจากร้าน NPC ไม่มีออป · โล่ยังไม่เคยเห็นมีออป</>,
      },
      {
        q: 'หมวก Nordfeld ที่ไกด์อาชีพแนะนำ หาจากไหน',
        a: <>แลกด้วยโทเคนสีเหลือง 300 อันจากถ้ำ Nordfeld ชั้น 2 แล้วใช้ใบสุ่มหาออป · วิธีเต็มอยู่ที่ <Link href="/guides/nordfeld-helm">หมวก Nordfeld</Link></>,
      },
      {
        q: 'ของติดดาว ★ ปลุกได้หรือยัง',
        a: <>ยัง ไอเทมเข้าไฟล์เกมแล้วแต่ระบบยังไม่เปิด ตอนนี้ให้เก็บของดรอปไว้ก่อน · ดูว่าต้องเก็บอะไร ตีมอนตัวไหนที่ <Link href="/guides/star-gear">ของติดดาว</Link></>,
      },
    ],
  },
  {
    id: 'server',
    title: 'เซิร์ฟและอัปเดต',
    items: [
      {
        q: 'เวลาในประกาศเป็นเวลาไทยเท่าไร',
        a: <>ประกาศใช้ UTC <strong>บวก 7 ชั่วโมงเป็นเวลาไทย</strong> เช่นปิดปรับปรุง 00:00-04:30 UTC คือ 07:00-11:30 น. · ส่วนใหญ่ปิดวันพฤหัสช่วงเช้า</>,
      },
      {
        q: 'เพดานเลเวลขยายเมื่อไร มีอะไรมาต่อ',
        a: <>ตามแผน ต.ค. 2569 ขยายเป็น 70 พร้อม Clock Tower · ดูทุกเดือนที่ <Link href="/news/roadmap">ไทม์ไลน์อัปเดต</Link></>,
      },
      {
        q: 'WoE วันไหน กี่โมง',
        a: <>เปิดแล้ว วอร์ครั้งแรกราว 20-21 ก.ย. 2569 · วันในสัปดาห์ ปราสาทที่เปิด และรางวัล ยังไม่มีข้อมูลที่ยืนยันได้ · ดูของที่ใช้ได้ในวอร์ที่ <Link href="/guides/woe">สงครามกิลด์</Link></>,
        unsure: true,
      },
      {
        q: 'กิลด์เก็บภาษีได้ไหม อัปเลเวลกิลด์ยังไง',
        a: <>ไม่มีภาษีแล้ว เลเวลกิลด์ขึ้นจากเควสกิลด์ประจำวันที่สมาชิกทุกคนทำได้ · ดูที่ <Link href="/guides/guild">ไอเทมกิลด์</Link></>,
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <main className="shell guildp" style={{ paddingBlock: 32 }}>
      <JsonLd data={breadcrumbJsonLd([
        { name: 'หน้าแรก', path: '/' },
        { name: 'ไกด์', path: '/guides' },
        { name: 'คำถามที่ถามบ่อย', path: PATH },
      ])} />
      <nav className="crumbs" aria-label="ตำแหน่งหน้า">
        <Link href="/">หน้าแรก</Link><span className="crumbs__sep" aria-hidden="true">›</span>
        <Link href="/guides">ไกด์</Link><span className="crumbs__sep" aria-hidden="true">›</span>
        <span className="crumbs__here">คำถามที่ถามบ่อย</span>
      </nav>

      <PageHeader
        title="คำถามที่ถามบ่อย Ragnarok Zero Global"
        lead="รวมจากคำถามที่เจอซ้ำในกลุ่มผู้เล่นไทย ตอบสั้น ๆ แล้วพาไปหน้าที่มีรายละเอียด ข้อไหนยังไม่มีคำตอบที่ยืนยันได้ จะบอกไว้ตรง ๆ"
      />

      <nav className="guildp__toc" aria-label="สารบัญ">
        {GROUPS.map((g) => <a key={g.id} href={`#${g.id}`}>{g.title}</a>)}
      </nav>

      {GROUPS.map((group, i) => (
        <div key={group.id}>
          {i === 2 && <AdSlot slot="inline" />}
          <section className="card" id={group.id} style={{ marginTop: 14 }}>
            <h2 className="section-title" style={{ marginTop: 0 }}>{group.title}</h2>
            <dl className="star__faq">
              {group.items.map((qa) => (
                <div key={qa.q}>
                  <dt>{qa.q}</dt>
                  <dd>
                    {qa.a}
                    {qa.unsure && <span className="star__unconfirmed">ยังไม่ยืนยัน</span>}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      ))}

      <Caveat label="เชื่อได้แค่ไหน">
        คำถามมาจากกลุ่ม Facebook ผู้เล่นไทยและคลิป YouTube ช่วง ส.ค.-ก.ย. 2569 · คำตอบรวมจากประกาศปิดปรับปรุง ข้อความในเกม และคลิปที่ผู้เล่นทำเอง ·
        ข้อที่ติดป้าย &quot;ยังไม่ยืนยัน&quot; คือยังไม่มีประกาศหรือหลักฐานพอ ถ้าในเกมไม่ตรง ยึดตามเกม
      </Caveat>
    </main>
  );
}
