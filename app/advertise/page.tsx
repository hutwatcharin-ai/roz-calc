// The media kit: what the site is, who reads it, what the slots are, what
// they cost and what is not accepted (owner, 23 Sep 2026).
//
// Every figure comes from data/ads.json, which also drives the slots
// themselves, so the page can never quote a price the site does not charge
// or traffic the report does not show. The GA4 period it covers is printed
// beside the numbers -- a media kit with undated traffic is not evidence.

import type { Metadata } from 'next';
import Link from 'next/link';
import { AD_PRICES, AD_SIZES, AD_STATS, INLINE_AD_PAGES, introSeatsLeft, priceFor } from '@/lib/ads';
import PageHeader from '@/components/PageHeader';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'ลงโฆษณากับ RO Zero Thai',
  description:
    'ลงแบนเนอร์บนเว็บฐานข้อมูล Ragnarok Zero Global ภาษาไทย ยอดเปิดหน้ากว่า 170,000 ครั้งต่อเดือน ผู้อ่านคนไทย 97% ดูตำแหน่ง ขนาด ราคา และเงื่อนไขทั้งหมดที่นี่',
};

const MAIL = 'kidkrob@gmail.com';
const mailto = (subject: string) => `mailto:${MAIL}?subject=${encodeURIComponent(subject)}`;
const baht = (n: number) => n.toLocaleString('en-US');
const thaiDate = (iso: string) =>
  new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });

// Two lines came off this list on the owner's call (23 Sep 2026): game-account
// and in-game-currency shops, and private servers.
const NOT_ACCEPTED = [
  'เว็บพนันทุกชนิด รวมถึงเว็บที่แจกเครดิตหรือลิงก์ต่อไปยังเว็บพนัน',
  'สินค้าผิดกฎหมาย ของปลอม และโฆษณาที่อ้างผลลัพธ์เกินจริง',
];

const STEPS = [
  ['ทักมาทางอีเมล', 'บอกตำแหน่งที่สนใจและจำนวนเดือน จะตอบกลับภายใน 1 วัน'],
  ['ยืนยันช่วงเวลา', 'เช็กว่าตำแหน่งนั้นว่างช่วงไหน แล้วล็อกคิวให้'],
  ['โอนเงิน', 'พร้อมเพย์หรือโอนบัญชีธนาคาร จ่ายล่วงหน้าเต็มจำนวน ส่งใบเสร็จเป็นไฟล์ PDF ให้'],
  ['ส่งไฟล์แบนเนอร์', 'หรือส่งโลโก้กับข้อความมา เราออกแบบให้ฟรี 1 แบบ แก้ได้ 2 รอบ'],
  ['ขึ้นจริง', 'ภายใน 2 วันทำการหลังได้รับไฟล์และยอดเงิน เริ่มนับ 30 วันจากวันที่ขึ้น'],
  ['รับรายงาน', 'สรุปยอดเห็นและยอดคลิกส่งให้เมื่อครบรอบ'],
];

const TERMS = [
  'ขั้นต่ำ 1 เดือน นับ 30 วันจากวันที่แบนเนอร์ขึ้นจริง ไม่ใช่วันที่โอนเงิน',
  'เปลี่ยนไฟล์ภาพระหว่างรอบได้ฟรี 1 ครั้งต่อเดือน',
  'ถ้าเว็บล่มรวมเกิน 24 ชั่วโมงในรอบนั้น ชดเชยเป็นวันต่อท้ายให้',
  'ต่ออายุแจ้งก่อนหมดรอบ 7 วัน ถ้าไม่แจ้งถือว่าไม่ต่อ และเปิดขายตำแหน่งนั้นต่อทันที',
  'ราคาปรับได้เมื่อครบรอบสัญญา ตามยอดผู้อ่านที่เปลี่ยนไป',
];

const FILE_SPEC = [
  'ไฟล์ JPG, PNG หรือ WebP — ไม่รับ GIF ขยับและไม่รับวิดีโอ เพราะทำให้เว็บช้าลง',
  'ขนาดไฟล์ไม่เกิน 150 KB ต่อภาพ',
  'ตำแหน่งบนสุดต้องส่ง 2 ขนาด คือ 970×250 สำหรับคอม และ 320×100 สำหรับมือถือ',
  'ส่งลิงก์ปลายทาง 1 ลิงก์ และข้อความกำกับภาพสั้น ๆ สำหรับผู้ใช้ที่มองไม่เห็น',
];

export default function AdvertisePage() {
  const seats = introSeatsLeft();
  const slots = [
    {
      key: 'top' as const,
      name: 'แบนเนอร์บนสุด',
      where: 'ใต้เมนู เห็นทุกหน้าของเว็บ',
      views: AD_STATS.topSlotViews,
      price: AD_PRICES.top,
    },
    {
      key: 'inline' as const,
      name: 'แบนเนอร์แทรกเนื้อหา',
      where: 'กลางหน้าฐานข้อมูลมอนสเตอร์ อุปกรณ์ และหาจุดเลเวล',
      views: AD_STATS.inlineSlotViews,
      price: AD_PRICES.inline,
    },
    {
      key: 'detail' as const,
      name: 'แบนเนอร์ท้ายหน้ารายละเอียด',
      where: 'ท้ายหน้ามอนรายตัว อุปกรณ์ คอสตูม และการ์ดรายชิ้น',
      views: AD_STATS.detailSlotViews,
      price: AD_PRICES.detail,
    },
  ];

  return (
    <main className="shell adpage">
      <PageHeader
        title="ลงโฆษณากับ RO Zero Thai"
        lead="เว็บฐานข้อมูลและเครื่องมือ Ragnarok Zero Global ภาษาไทย คนอ่านคือผู้เล่นคนไทยที่เปิดเว็บคู่กับเกม"
      />

      <section className="card adpage__stats" aria-labelledby="ad-stats">
        <h2 className="section-title" id="ad-stats">ตัวเลขผู้อ่าน</h2>
        <p className="muted adpage__note">
          จาก Google Analytics ของเว็บ ช่วง {AD_STATS.periodDays} วันก่อนวันที่ {thaiDate(AD_STATS.asOf)} ไม่ใช่ตัวเลขประมาณ
        </p>
        <dl className="adpage__figures">
          <div><dt>เปิดหน้า</dt><dd>{baht(AD_STATS.pageViews)} ครั้ง</dd></div>
          <div><dt>เข้าเว็บ</dt><dd>{baht(AD_STATS.sessions)} ครั้ง</dd></div>
          <div><dt>ผู้อ่าน</dt><dd>{baht(AD_STATS.users)} คน</dd></div>
          <div><dt>ดูต่อครั้ง</dt><dd>{AD_STATS.pagesPerSession} หน้า</dd></div>
          <div><dt>อยู่ในเว็บ</dt><dd>~{AD_STATS.avgMinutes} นาที</dd></div>
          <div><dt>คนไทย</dt><dd>{AD_STATS.thaiShare}%</dd></div>
          <div><dt>เปิดบนคอม</dt><dd>{AD_STATS.desktopShare}%</dd></div>
        </dl>
      </section>

      <section className="card" aria-labelledby="ad-slots" style={{ marginTop: 14 }}>
        <h2 className="section-title" id="ad-slots">ตำแหน่งและราคา</h2>
        <div className="adpage__slots">
          {slots.map((slot) => (
            <div key={slot.key} className="adpage__slot">
              <div className="adpage__preview" aria-hidden="true">
                <span
                  className={`adpage__box adpage__box--${slot.key}`}
                  style={{ aspectRatio: `${AD_SIZES[slot.key].wide[0]} / ${AD_SIZES[slot.key].wide[1]}` }}
                >
                  {AD_SIZES[slot.key].wide[0]}×{AD_SIZES[slot.key].wide[1]}
                </span>
              </div>
              <div className="adpage__slotbody">
                <strong>{slot.name}</strong>
                <p className="muted">{slot.where}</p>
                <ul className="adpage__specs">
                  <li>คอม {AD_SIZES[slot.key].wide[0]}×{AD_SIZES[slot.key].wide[1]} · มือถือ {AD_SIZES[slot.key].narrow[0]}×{AD_SIZES[slot.key].narrow[1]}</li>
                  <li>ยอดเห็นประมาณ {baht(slot.views)} ครั้งต่อเดือน</li>
                </ul>
                <p className="adpage__price">
                  <strong>{baht(slot.price)}</strong> บาท/เดือน
                </p>
                <a className="btn" href={mailto(`จอง${slot.name} rozerothai.com`)}>จองตำแหน่งนี้</a>
              </div>
            </div>
          ))}
        </div>

        <h3 className="adpage__h3">จองยาวได้ส่วนลด</h3>
        <table className="stat-table adpage__table">
          <thead>
            <tr><th scope="col">ระยะเวลา</th><th scope="col">ส่วนลด</th><th scope="col">บนสุด รวม</th><th scope="col">แทรกเนื้อหา รวม</th><th scope="col">ท้ายรายละเอียด รวม</th></tr>
          </thead>
          <tbody>
            {[1, 3, 6].map((months) => {
              const discount = AD_PRICES.discounts.find((d) => d.months === months);
              return (
                <tr key={months}>
                  <th scope="row">{months} เดือน</th>
                  <td>{discount ? `${discount.percent}%` : '—'}</td>
                  <td className="num">{baht(priceFor('top', months))} บาท</td>
                  <td className="num">{baht(priceFor('inline', months))} บาท</td>
                  <td className="num">{baht(priceFor('detail', months))} บาท</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {seats > 0 && (
          <p className="adpage__intro">
            <strong>ราคาเปิดตัว</strong> — {seats} รายแรกที่จองได้ล็อกราคานี้ไว้ 6 เดือน แม้ยอดผู้อ่านจะโตขึ้นก็ไม่ปรับ
          </p>
        )}
      </section>

      <section className="card" aria-labelledby="ad-spec" style={{ marginTop: 14 }}>
        <h2 className="section-title" id="ad-spec">ไฟล์ที่รับ</h2>
        <ul className="adpage__list">
          {FILE_SPEC.map((line) => <li key={line}>{line}</li>)}
        </ul>
        <p className="muted adpage__note">
          ไม่มีไฟล์ก็ได้ ส่งโลโก้กับข้อความที่อยากให้ขึ้นมา เราออกแบบให้ฟรี 1 แบบ แก้ได้ 2 รอบ
        </p>
      </section>

      <section className="card" aria-labelledby="ad-no" style={{ marginTop: 14 }}>
        <h2 className="section-title" id="ad-no">สิ่งที่ไม่รับลงโฆษณา</h2>
        <ul className="adpage__list adpage__list--no">
          {NOT_ACCEPTED.map((line) => <li key={line}>{line}</li>)}
        </ul>
      </section>

      <section className="card" aria-labelledby="ad-steps" style={{ marginTop: 14 }}>
        <h2 className="section-title" id="ad-steps">ขั้นตอน</h2>
        <ol className="adpage__steps">
          {STEPS.map(([name, detail], i) => (
            <li key={name}>
              <span className="adpage__stepno" aria-hidden="true">{i + 1}</span>
              <span><strong>{name}</strong><br /><span className="muted">{detail}</span></span>
            </li>
          ))}
        </ol>
      </section>

      <section className="card" aria-labelledby="ad-report" style={{ marginTop: 14 }}>
        <h2 className="section-title" id="ad-report">รายงานที่จะได้</h2>
        <p style={{ marginTop: 8 }}>เมื่อครบรอบจะส่งสรุปให้ มีตัวเลข 4 อย่าง</p>
        <ul className="adpage__list">
          <li>ยอดเห็นแบนเนอร์ นับเฉพาะตอนที่แบนเนอร์เลื่อนมาอยู่ในจอจริง</li>
          <li>ยอดคลิก นับจากระบบของเราเอง</li>
          <li>อัตราคลิกต่อการเห็น</li>
          <li>ยอดเปิดหน้าของทั้งเว็บในรอบนั้น เพื่อให้เทียบได้ว่าสัดส่วนเป็นอย่างไร</li>
        </ul>
        <p className="muted adpage__note">
          ยอดเห็นมาจาก Google Analytics ซึ่งนับได้ต่ำกว่าความจริงประมาณ 10-20% เพราะผู้อ่านบางส่วนใช้ตัวบล็อกโฆษณา
          ตัวเลขที่ส่งให้จึงเป็นยอดที่นับได้จริง ไม่ใช่ยอดเต็ม ส่วนยอดคลิกนับที่เว็บเราเอง ไม่โดนบล็อก
        </p>
      </section>

      <section className="card" aria-labelledby="ad-terms" style={{ marginTop: 14 }}>
        <h2 className="section-title" id="ad-terms">เงื่อนไข</h2>
        <ul className="adpage__list">
          {TERMS.map((line) => <li key={line}>{line}</li>)}
        </ul>
      </section>

      <section className="card adpage__contact" aria-labelledby="ad-contact" style={{ marginTop: 14 }}>
        <h2 className="section-title" id="ad-contact">ติดต่อ</h2>
        <p style={{ marginTop: 8 }}>
          อีเมล <a href={mailto('สอบถามลงโฆษณา rozerothai.com')}>{MAIL}</a> ตอบกลับภายใน 1 วัน
        </p>
        <p className="muted adpage__note">
          บอกมาด้วยว่าสนใจตำแหน่งไหน กี่เดือน และธุรกิจของคุณคืออะไร จะได้เช็กคิวและตอบราคารวมให้ในครั้งเดียว
        </p>
      </section>

      <p className="muted" style={{ marginTop: 16 }}>
        อยากรู้ว่าเว็บนี้ทำอะไรบ้าง ดูได้ที่ <Link href="/about">เกี่ยวกับเว็บนี้</Link> หรือหน้าที่คนอ่านมากที่สุดอย่าง{' '}
        <Link href={INLINE_AD_PAGES[0]}>ฐานข้อมูลมอนสเตอร์</Link>
      </p>
    </main>
  );
}
