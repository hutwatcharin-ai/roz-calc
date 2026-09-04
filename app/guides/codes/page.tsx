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
    'รวมโค้ดคูปอง Ragnarok Zero: Global 22 โค้ด รวมโค้ดฝั่งไทย ROZGTH THAIROZG พร้อมวิธีใช้ — ของเข้าเมลในเกม (RODEX) ไม่ใช่กระเป๋า',
};

// Verbatim strings, because a code with a letter changed is not a code.
//
// Two sources, kept apart because they are not equally fresh: the launch batch
// below came from an English fan guide dated 31 Aug and is mostly expected to
// be dead, while these four came from the Thai community on 4 Sep and are the
// ones worth trying first.
const THAI_CODES = ['ROZGTH', 'ROZGHYPE', 'THAIROZG', 'ROZGISHERE'];

const CODES = [
  'RETURNTOZERO',
  'THAIEVENT',
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
  'MIDGARD2026',
  'ADVENTUREZERO',
  'ROZGLAUNCH',
  'ZEROSTART',
  'ROZGCREATOR',
  'ZEROTOINFINITY',
];

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
        ส่วนใหญ่เป็นโค้ดช่วงเปิดเซิร์ฟ <strong>อาจหมดอายุไปแล้ว</strong> — ลองไล่กรอกดูได้ ไม่เสียอะไร
      </p>

      <div className="card card--cyan">
        <h2 className="section-title">โค้ดฝั่งไทย (ลองอันนี้ก่อน)</h2>
        <div className="codegrid" style={{ marginTop: 10 }}>
          {THAI_CODES.map((code) => (
            <code key={code} className="codegrid__item mono">{code}</code>
          ))}
        </div>
        <p className="muted" style={{ marginTop: 12, fontSize: 13 }}>
          {THAI_CODES.length} โค้ด · ได้มาจากผู้เล่นไทย 4 ก.ย. 2026 — ใหม่กว่าชุดล่าง
        </p>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <h2 className="section-title">โค้ดช่วงเปิดเซิร์ฟ</h2>
        <div className="codegrid" style={{ marginTop: 10 }}>
          {CODES.map((code) => (
            <code key={code} className="codegrid__item mono">{code}</code>
          ))}
        </div>
        <p className="muted" style={{ marginTop: 12, fontSize: 13 }}>
          {CODES.length} โค้ด · พิมพ์ตามตัวพิมพ์ใหญ่ทั้งหมด
        </p>
      </div>

      <Caveat label="เชื่อได้แค่ไหน">
        ชุดล่างมาจากไกด์ภาษาอังกฤษของผู้เล่น (Ragnarok Zero Guide โดย Lymd, ฉบับ 1.2 · 31 ส.ค. 2026) ซึ่งเขียนเองว่าโค้ดอาจใช้ไม่ได้แล้ว ·
        ชุดบน 4 โค้ดมาจากผู้เล่นไทยส่งมาให้ 4 ก.ย. 2026 ·
        เว็บนี้ไม่ได้ทดสอบกรอกทุกโค้ดเอง จึงไม่รับประกันว่าโค้ดไหนยังใช้ได้ · ของที่ได้ต่อโค้ดไม่มีใครประกาศไว้ครบ เราจึงไม่ระบุ
        ถ้าเจอโค้ดใหม่หรือโค้ดไหนใช้ไม่ได้แล้ว บอกได้ที่ปุ่มแจ้งข้อมูลผิดท้ายหน้าอื่น ๆ
      </Caveat>

      <p className="muted" style={{ marginTop: 16 }}>
        ดูต่อ: <Link href="/guides/farm-guide">จุดฟาร์มแนะนำ</Link> ·{' '}
        <Link href="/tools/leveling-spots">ฟาร์มที่ไหนดี</Link>
      </p>
    </main>
  );
}
