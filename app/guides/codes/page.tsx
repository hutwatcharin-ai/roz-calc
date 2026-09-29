// app/guides/codes/page.tsx
//
// The redeem codes, in one Thai page. They exist scattered across launch
// announcements and one English fan guide; nobody has put them in front of a
// Thai player with instructions and an honest note that most launch codes
// expire. Facts only -- the code strings and where they land -- written here
// rather than lifted, and the source is credited below.
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import Caveat from '@/components/Caveat';
import JsonLd from '@/components/JsonLd';
import { breadcrumbJsonLd } from '@/lib/jsonld';

export const metadata = {
  title: 'โค้ดรับของ Ragnarok Zero (Coupon Code)',
  description:
    'โค้ดคูปอง Ragnarok Zero Global ครบ 22 โค้ด แยกชัดว่าอันไหนยังใช้ได้ 4 โค้ด (ROZGTH THAIROZG ROZGHYPE) อันไหนปิดไปแล้ว พร้อมวิธีกรอก — ของเข้าเมลในเกม (RODEX) ไม่ใช่กระเป๋า',
};

// Verbatim strings, because a code with a letter changed is not a code.
//
// Three sources, and they agree where they overlap. The launch batch came
// from an English fan guide dated 31 Aug; the four Thai codes came from Thai
// players on 4 Sep; and on 8 Sep a French Zero guide (roz-global.info) was
// found to carry the same 22 codes with a start date, an end date and a
// status for each. It lists exactly the same four as newest, which is two
// independent sources arriving at the same answer.
//
// That third source is what lets this page stop saying "most of these are
// probably dead" and say which ones. It is still one source for the dates,
// so the page says so and says when it was read.
const EXPIRED_ON = '3 ก.ย. 2026';
const EXPIRED_LATER_ON = '5 ก.ย. 2026';

/** Reported still working, newest first. */
const LIVE_CODES = ['ROZGTH', 'ROZGHYPE', 'THAIROZG', 'ROZGISHERE'];

/** Reported closed on 3 Sep 2026. Kept on the page: a reader who finds one
 *  of these elsewhere should be able to see here that it is spent, rather
 *  than wonder whether we simply missed it. */
const EXPIRED_CODES = [
  'RETURNTOZERO',
  'ROZGERMANY',
  'WELCOME',
  'PORING777',
  'ROZERO2026',
  'DAILYGIFT',
  'OPENZERO',
  'GETREADY',
  'STARTNOW',
  'STARTINGANEW',
  'GRANDLAUNCH',
  'ADVENTUREZERO',
  'ZEROTOINFINITY',
];

/** Ended 5 Sep 2026: the French guide moved these from live to expired, and
 *  its own end dates are all in the past. Re-read 29 Sep 2026. */
const EXPIRED_LATER_CODES = ['THAIEVENT', 'ZEROSTART', 'MIDGARD2026', 'ROZGCREATOR', 'ROZGLAUNCH'];

export default function CodesPage() {
  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'หน้าแรก', path: '/' },
          { name: 'ไกด์', path: '/guides' },
          { name: 'โค้ดรับของ', path: '/guides/codes' },
        ])}
      />
      <PageHeader title="โค้ดรับของ Ragnarok Zero" />
      <p className="muted" style={{ marginTop: -6, marginBottom: 16, maxWidth: '70ch' }}>
        กรอกที่บัญชี GNJOY ของคุณ ของจะเข้า<strong>เมลในเกม (RODEX)</strong> ไม่ใช่ในกระเป๋าโดยตรง ·
        โค้ดชุดเปิดเซิร์ฟ <strong>ปิดไปแล้ว {EXPIRED_CODES.length + EXPIRED_LATER_CODES.length} โค้ด</strong> ({EXPIRED_CODES.length} โค้ดเมื่อ {EXPIRED_ON} อีก {EXPIRED_LATER_CODES.length} โค้ดเมื่อ {EXPIRED_LATER_ON}) เหลือที่มีรายงานว่ายังใช้ได้ {LIVE_CODES.length} โค้ด
      </p>

      <div className="card card--cyan">
        <h2 className="section-title">ยังใช้ได้ ลองชุดนี้ก่อน</h2>
        <div className="codegrid" style={{ marginTop: 10 }}>
          {LIVE_CODES.map((code) => (
            <code key={code} className="codegrid__item mono">{code}</code>
          ))}
        </div>
        <p className="muted" style={{ marginTop: 12, fontSize: 13 }}>
          {LIVE_CODES.length} โค้ด · พิมพ์ตัวพิมพ์ใหญ่ทั้งหมด · เป็นชุดที่ออกวันที่ 3 ก.ย. ทั้งหมด ยังไม่มีวันหมด
        </p>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <h2 className="section-title">ปิดไปแล้วเมื่อ {EXPIRED_LATER_ON}</h2>
        <div className="codegrid" style={{ marginTop: 10 }}>
          {EXPIRED_LATER_CODES.map((code) => (
            <code key={code} className="codegrid__item mono codegrid__item--dead">{code}</code>
          ))}
        </div>
        <p className="muted" style={{ marginTop: 12, fontSize: 13 }}>
          {EXPIRED_LATER_CODES.length} โค้ด · ชุดนี้เคยอยู่ในกลุ่มที่ใช้ได้ ไกด์ฝรั่งเศสลงวันจบเป็น 5 ก.ย.
        </p>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <h2 className="section-title">ปิดไปแล้วเมื่อ {EXPIRED_ON}</h2>
        <div className="codegrid" style={{ marginTop: 10 }}>
          {EXPIRED_CODES.map((code) => (
            <code key={code} className="codegrid__item mono codegrid__item--dead">{code}</code>
          ))}
        </div>
        <p className="muted" style={{ marginTop: 12, fontSize: 13 }}>
          {EXPIRED_CODES.length} โค้ด · เก็บไว้ให้ดูเฉย ๆ ถ้าไปเจอโค้ดพวกนี้ที่อื่นจะได้รู้ว่าหมดแล้ว ไม่ใช่เราตกหล่น
        </p>
      </div>

      <Caveat label="เชื่อได้แค่ไหน">
        ตัวโค้ดมาจากสามทาง และตรงกันตรงที่ทับซ้อน: ไกด์ภาษาอังกฤษของผู้เล่น (Ragnarok Zero Guide โดย Lymd ฉบับ 1.2 · 31 ส.ค. 2026),
        ผู้เล่นไทยส่งมาให้ 4 ก.ย. 2026 และไกด์ภาษาฝรั่งเศส roz-global.info ที่อ่านเมื่อ 8 ก.ย. และอ่านซ้ำ 29 ก.ย. 2026 ·
        <strong>ส่วนวันหมดอายุมาจากแหล่งเดียว</strong> คือไกด์ฝรั่งเศส ซึ่งลงวันเริ่มและวันจบไว้ทุกโค้ด เว็บนี้ไม่ได้กรอกทดสอบเอง
        ถ้าโค้ดในชุดบนใช้ไม่ได้แล้วหรือชุดล่างยังใช้ได้อยู่ บอกมาได้ · ของที่ได้ต่อโค้ดไม่มีใครประกาศไว้ครบ เราจึงไม่ระบุ
      </Caveat>

      <p className="muted" style={{ marginTop: 16 }}>
        ดูต่อ: <Link href="/guides/farm-guide">จุดฟาร์มแนะนำ</Link> ·{' '}
        <Link href="/tools/leveling-spots">ฟาร์มที่ไหนดี</Link>
      </p>
    </main>
  );
}
