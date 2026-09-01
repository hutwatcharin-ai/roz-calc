import Link from 'next/link';

export const metadata = {
  title: 'เกี่ยวกับเว็บนี้',
  description:
    'RO Zero Thai คือฐานข้อมูลและเครื่องมือ Ragnarok Zero Global ภาษาไทย ทำโดยผู้เล่น — ที่มาของตัวเลข วิธีตรวจทาน และช่องทางแจ้งข้อมูลผิด',
};

// Static trust page (SEO audit High #6): who runs the site, how the numbers
// are verified, and a real contact channel. No fabricated identity — the
// maintainer stays "ผู้เล่นคนไทยคนหนึ่ง" until they choose otherwise.
export default function AboutPage() {
  return (
    <main className="shell" style={{ paddingBlock: 32, maxWidth: 820 }}>
      <h1 className="pagehead__title">เกี่ยวกับ RO Zero Thai</h1>

      <section className="card" style={{ marginTop: 20 }}>
        <h2 className="section-title">เว็บนี้คืออะไร</h2>
        <p style={{ marginTop: 8 }}>
          ฐานข้อมูลและเครื่องมือสำหรับ <strong>Ragnarok Zero Global</strong> ภาษาไทย
          ทำโดยผู้เล่นคนไทยคนหนึ่ง ไม่ใช่เว็บทางการ และไม่ได้เกี่ยวข้องกับ Gravity
          หรือผู้ให้บริการเกม — ทำเพราะอยากได้ฐานข้อมูลภาษาไทยที่เช็คได้ว่าตัวเลขมาจากไหน
        </p>
      </section>

      <section className="card" style={{ marginTop: 14 }}>
        <h2 className="section-title">ตัวเลขตรวจทานยังไง</h2>
        <p style={{ marginTop: 8 }}>
          ข้อมูลหลักมาจากชุดข้อมูลสาธารณะของไคลเอนต์เกม แล้วตรวจทานไขว้กับแหล่งอื่นเป็นรายเรื่อง:
          ค่าสถานะมอนสเตอร์ครบ 524 ตัวเทียบกับ ragnarokzero.net · ตารางธาตุทั้ง 4
          ระดับเทียบกับซอร์สโค้ด rAthena · ราคาซื้อ-ขายและตารางตีบวกเทียบกับ rozerodb.com
          — ตัวเลขไหนยังไม่ยืนยัน จะเขียนกำกับไว้ตรงจุดที่ตัวเลขโชว์เสมอ ไม่ใส่เลขมั่ว
        </p>
      </section>

      <section className="card" style={{ marginTop: 14 }}>
        <h2 className="section-title">เจอข้อมูลผิด / อยากติดต่อ</h2>
        <p style={{ marginTop: 8 }}>
          แจ้งได้ที่{' '}
          <a href="https://github.com/hutwatcharin-ai/roz-calc/issues" target="_blank" rel="noopener noreferrer">
            GitHub Issues ของโปรเจกต์
          </a>{' '}
          — บอกชื่อมอน/ไอเทมกับเลขที่เห็นในเกมมาด้วย จะได้ตามแก้ถูกตัว
        </p>
      </section>

      <p className="muted" style={{ marginTop: 16 }}>
        เริ่มจาก <Link href="/">หน้าแรก</Link> หรือเปิด{' '}
        <Link href="/database/monsters">ฐานข้อมูลมอนสเตอร์</Link> ได้เลย
      </p>
    </main>
  );
}
