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
import PageHeader from '@/components/PageHeader';
import Caveat from '@/components/Caveat';
import JsonLd from '@/components/JsonLd';
import AdSlot from '@/components/AdSlot';
import { breadcrumbJsonLd } from '@/lib/jsonld';
import FaqBrowser, { type FaqGroup } from '@/components/FaqBrowser';
import './page.css';

export const revalidate = 86400;

const PATH = '/guides/faq';

export const metadata: Metadata = {
  title: 'คำถามที่ถามบ่อย Ragnarok Zero Global — ค่าเล่น บอท รีเซ็ต ขายของ ตีบวก',
  description:
    'รวมคำถามที่ผู้เล่น Ragnarok Zero Global ถามบ่อยในกลุ่ม: ต้องเติมเงินไหม ไอดีทดลองทำอะไรไม่ได้ บอทในเกมโดนแบนไหม ลงสเตตัสยังไง รีเซ็ตฟรีถึงเลเวลไหน ตั้งร้านยังไง ตีบวกแตกไหม เวลาเซิร์ฟเป็นเวลาไทยเท่าไร',
};

// Updated 8 Oct 2026 (owner: refresh, easier to read): refine answer matched
// to the official tables and HD's real rule, new questions for champion
// monsters, enchanting (live), card-by-effect and the build simulator.
const GROUPS: FaqGroup[] = [
  {
    id: 'pay',
    title: 'ค่าเล่นและไอดี',
    icon: '/images/items/12324.gif',
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
    icon: '/images/items/607.gif',
    items: [
      {
        q: 'เริ่มแรกลงสเตตัสยังไง',
        a: <>ทุกคลิปไทยแนะนำตรงกันว่า <strong>ลง DEX ราว 20 ก่อน</strong> จะได้ตีโดน ที่เหลือตามสายอาชีพ · ลงผิดไม่ต้องกลัว รีเซ็ตฟรีถึงเลเวล 40 · ดูบิลด์รายอาชีพที่ <Link href="/guides/classes">ไกด์อาชีพ</Link> แล้วลองลงแต้มก่อนได้ที่ <Link href="/tools/build">จำลองบิลด์</Link> เห็น HIT FLEE ASPD และตีมอนโดนกี่ %</>,
        k: 'สเตตัส stat แต้ม บิลด์ build',
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
        q: 'มอนชื่อ Swift / Solid / Furious / Elusive หรือ ... Ringleader คืออะไร',
        a: <>คือ<strong>มอนแชมเปียน</strong> ร่างพิเศษของมอนปกติ เกิดปนในแมพเดียวกันทีละ 1-2 ตัว · เลือดหนากว่า (เช่น Swift Poring HP ×5) แต่ให้ EXP มากกว่ามาก (×30) และดรอปดีกว่า · หน้าแมพในเว็บบอกว่าแมพไหนมีแชมเปียนอะไร เช่น <Link href="/database/maps/prt_fild08">Prontera Field 8</Link></>,
        k: 'แชมเปียน champion มอนพิเศษ ตัวใหญ่',
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
    icon: '/images/items/2228.gif',
    items: [
      {
        q: 'ใช้บอทในเกมโดนแบนไหม',
        k: 'bot auto แบน ban',
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
    icon: '/images/items/909.gif',
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
    icon: '/images/items/985.gif',
    items: [
      {
        q: 'ตีบวกแตกไหม',
        a: <>แตกได้ตั้งแต่ +1 ถ้าใช้แร่ธรรมดา (แร่เข้มข้นติดแน่นช่วงแรก ๆ) · โอกาสขึ้นกับชนิดของ เช่น อาวุธ Lv4 กับเกราะ แร่ธรรมดา +5 สำเร็จ 60% แต่ +8 เหลือ 20% · <strong>แร่ HD</strong> ใช้ได้ตอนของอยู่ +7 ถึง +9 พลาดแล้วลด 1 ขั้นแทนแตก · Blacksmith Blessing กันแตกตอนตีขึ้น +8 ได้จาก MVP Raid หรือกาชาไข่ครบ 60 ครั้ง · ดูว่าต้องเตรียมของกี่ชิ้น ลองตีดูได้ที่ <Link href="/tools/refine">ตีบวก</Link></>,
        k: 'refine แตก พัง oridecon elunium hd',
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
        q: 'เอนแชนต์ชุดดันความทรงจำทำยังไง เสี่ยงไหม',
        a: <>เปิดแล้ว · ใส่ที่ NPC ครั้งละ 100,000 Zeny <strong>ใส่ไม่มีความเสี่ยง</strong> แต่ถอดด้วยเงินมีโอกาสของหาย 30% (ถอดด้วย Zelstar ไม่หาย) · ลุ้นค่าไหนกี่ครั้ง ดูที่ <Link href="/tools/enchant">คำนวณเอนแชนต์</Link></>,
        k: 'enchant เอนชานต์ เอนแชน memorial subjugation',
      },
      {
        q: 'อยากได้การ์ดกันใบ้ กันสตัน กันธาตุไฟ ใส่ใบไหน',
        a: <>ดูแยกตามผลได้ เช่น <Link href="/database/cards/effect/guard-silence">การ์ดกันใบ้</Link> · <Link href="/database/cards/effect/guard-stun">การ์ดกันสตัน</Link> · <Link href="/database/cards/effect/guard-fire">การ์ดกันธาตุไฟ</Link> · <Link href="/database/cards/effect/slot-shield">การ์ดใส่โล่</Link> · ทุกหมวดอยู่ในกล่อง &quot;หาการ์ดตามผล&quot; ใน <Link href="/database/cards">หน้าการ์ด</Link></>,
        k: 'card การ์ด กันสถานะ silence stun',
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
    icon: '/images/items/602.gif',
    items: [
      {
        q: 'เวลาในประกาศเป็นเวลาไทยเท่าไร',
        a: <>ประกาศใช้ UTC <strong>บวก 7 ชั่วโมงเป็นเวลาไทย</strong> เช่นปิดปรับปรุง 00:00-04:30 UTC คือ 07:00-11:30 น. · ส่วนใหญ่ปิดวันพฤหัสช่วงเช้า</>,
      },
      {
        q: 'เพดานเลเวลขยายเมื่อไร มีอะไรมาต่อ',
        a: <>ขยายเป็น Base 70 / Job 70 แล้ว (แพตช์ <Link href="/news/patch-2026-10-01">1 ต.ค. 2569</Link>) · Clock Tower ที่แผนเคยบอกว่ามาพร้อมกันยังไม่อยู่ในประกาศ · รอบถัดไปดูที่ <Link href="/news/roadmap">ไทม์ไลน์อัปเดต</Link></>,
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

      <FaqBrowser groups={GROUPS} />

      <AdSlot slot="inline" />

      <Caveat label="เชื่อได้แค่ไหน">
        คำถามมาจากกลุ่ม Facebook ผู้เล่นไทยและคลิป YouTube ช่วง ส.ค.-ก.ย. 2569 · คำตอบรวมจากประกาศปิดปรับปรุง ข้อความในเกม และคลิปที่ผู้เล่นทำเอง ·
        ข้อที่ติดป้าย &quot;ยังไม่ยืนยัน&quot; คือยังไม่มีประกาศหรือหลักฐานพอ ถ้าในเกมไม่ตรง ยึดตามเกม
      </Caveat>
    </main>
  );
}
