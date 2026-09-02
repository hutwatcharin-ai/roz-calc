import Link from 'next/link';
import JsonLd from '@/components/JsonLd';
import { organizationJsonLd } from '@/lib/jsonld';

export const metadata = {
  title: 'เกี่ยวกับเว็บนี้',
  description:
    'RO Zero Thai คือฐานข้อมูลและเครื่องมือ Ragnarok Zero Global ภาษาไทย ทำโดยผู้เล่น — ที่มาของตัวเลข วิธีตรวจทาน ช่องทางแจ้งข้อมูลผิด และติดต่อธุรกิจ',
};

// Static trust page (SEO audit High #6): who runs the site, how the numbers
// are verified, and a real contact channel. No fabricated identity — the
// maintainer stays "ผู้เล่นคนไทยคนหนึ่ง" until they choose otherwise.
export default function AboutPage() {
  return (
    <main className="shell" style={{ paddingBlock: 32, maxWidth: 820 }}>
      <JsonLd data={organizationJsonLd()} />
      <h1 className="pagehead__title">เกี่ยวกับ RO Zero Thai</h1>

      <section className="card" style={{ marginTop: 20 }}>
        <h2 className="section-title">เว็บนี้คืออะไร</h2>
        <p style={{ marginTop: 8 }}>
          ฐานข้อมูลและเครื่องมือสำหรับ <strong>Ragnarok Zero Global</strong> ภาษาไทย
          ทำโดยผู้เล่นคนไทยคนหนึ่ง ไม่ใช่เว็บทางการ และไม่ได้เกี่ยวข้องกับ Gravity
          หรือผู้ให้บริการเกม — ทำเพราะอยากได้ฐานข้อมูลภาษาไทยที่เช็คได้ว่าตัวเลขมาจากไหน
        </p>
      </section>

      {/* Moved here from the footer (user, 2 Sep) -- linked as /about#sources
          from the footer's "ตัวเลขมาจากไหน". Keep the per-source lines
          honest: each names what that source actually contributed. */}
      <section className="card" id="sources" style={{ marginTop: 14, scrollMarginTop: 80 }}>
        <h2 className="section-title">ตัวเลขมาจากไหน</h2>
        <p style={{ marginTop: 8 }}>
          ข้อมูลหลักมาจากชุดข้อมูลสาธารณะของไคลเอนต์เกม แล้วตรวจทานไขว้กับแหล่งอื่นเป็นรายเรื่อง
        </p>
        <dl className="sourcelist">
          <div>
            <dt>คู่มือเกมทางการ</dt>
            <dd>ตารางธาตุ ตารางขนาด อัตราตีบวก EXP ต่อเลเวล</dd>
          </div>
          <div>
            <dt>ข้อมูลมอนสเตอร์และไอเทม</dt>
            <dd>ชุดข้อมูลสาธารณะจากไคลเอนต์เกม</dd>
          </div>
          <div>
            <dt>
              <a href="https://rozerodb.com" target="_blank" rel="noopener noreferrer">rozerodb.com</a>
            </dt>
            <dd>ไอเทมประมาณ 1,200 ชิ้นที่ชุดข้อมูลของเราไม่มี ราคาขายของสวมใส่ และใช้ตรวจทานตารางตีบวกกับตารางขนาด</dd>
          </div>
          <div>
            <dt>
              <a href="https://ragnarokzero.net" target="_blank" rel="noopener noreferrer">ragnarokzero.net</a>
            </dt>
            <dd>ใช้ตรวจทานค่าสถานะมอนสเตอร์ครบทั้ง 524 ตัว</dd>
          </div>
          <div>
            <dt>
              <a href="https://midgardhub.com" target="_blank" rel="noopener noreferrer">midgardhub.com</a>
            </dt>
            <dd>รายการดรอปชนิดไม่ทราบอัตรา 410 แถวที่ต้นทางอื่นไม่มี และค่า HIT/FLEE เป้าหมายต่อมอน</dd>
          </div>
          <div>
            <dt>
              <a href="https://github.com/rathena/rathena" target="_blank" rel="noopener noreferrer">rAthena</a>
            </dt>
            <dd>ใช้ตรวจทานตารางธาตุทั้ง 4 ระดับ</dd>
          </div>
        </dl>
      </section>

      <section className="card" style={{ marginTop: 14 }}>
        <h2 className="section-title">ที่ควรรู้ก่อนเชื่อ</h2>
        <ul className="sourcelist__caveats">
          <li>ตัวเลขไหนยังไม่ยืนยัน จะเขียนกำกับไว้ตรงจุดที่ตัวเลขโชว์เสมอ ไม่ใส่เลขมั่ว</li>
          <li>ค่าที่คิดจากตัวละครเป็นเพดานบน — ไม่รวมเวลาเดินและรอมอนเกิด</li>
        </ul>
      </section>

      <section className="card" style={{ marginTop: 14 }}>
        <h2 className="section-title">เจอข้อมูลผิด</h2>
        <p style={{ marginTop: 8 }}>
          แจ้งได้ที่{' '}
          <a href="https://github.com/hutwatcharin-ai/roz-calc/issues" target="_blank" rel="noopener noreferrer">
            GitHub Issues ของโปรเจกต์
          </a>{' '}
          — บอกชื่อมอน/ไอเทมกับเลขที่เห็นในเกมมาด้วย จะได้ตามแก้ถูกตัว
        </p>
      </section>

      <section className="card" style={{ marginTop: 14 }}>
        <h2 className="section-title">ลงโฆษณา / ติดต่อธุรกิจ</h2>
        <p style={{ marginTop: 8 }}>
          ทักมาได้ที่{' '}
          <a href="mailto:kidkrob@gmail.com?subject=สอบถามลงโฆษณา%20rozerothai.com">kidkrob@gmail.com</a>
        </p>
      </section>

      <p className="muted" style={{ marginTop: 16 }}>
        เริ่มจาก <Link href="/">หน้าแรก</Link> หรือเปิด{' '}
        <Link href="/database/monsters">ฐานข้อมูลมอนสเตอร์</Link> ได้เลย
      </p>
    </main>
  );
}
