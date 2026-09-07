import Link from 'next/link';
import JsonLd from '@/components/JsonLd';
import { organizationJsonLd } from '@/lib/jsonld';

// This page is the site's biggest search impression source and its worst
// converter: 458 impressions at position 3.3 for people searching
// "rozerodb", 5 clicks (Search Console, 90 days to 7 Sep 2026). They are
// looking for a RO Zero database, and the title they saw said "about this
// website". Same page, same position -- a title that answers the search.
export const metadata = {
  title: 'ฐานข้อมูล RO Zero ภาษาไทย — ตัวเลขมาจากไหน ตรวจยังไง',
  description:
    'ฐานข้อมูลและเครื่องมือ Ragnarok Zero Global ภาษาไทย ทำโดยผู้เล่น — มอนสเตอร์ ไอเทม การ์ด สกิล แมพ ครบ พร้อมบอกว่าตัวเลขแต่ละอย่างมาจากแหล่งไหนและตรวจทานยังไง',
};

// Static trust page (SEO audit High #6): who runs the site, how the numbers
// are verified, and a real contact channel. No fabricated identity — the
// maintainer stays "ผู้เล่นคนไทยคนหนึ่ง" until they choose otherwise.
export default function AboutPage() {
  return (
    <main className="shell" style={{ paddingBlock: 32, maxWidth: 820 }}>
      <JsonLd data={organizationJsonLd()} />
      <h1 className="pagehead__title">เกี่ยวกับ RO Zero Thai</h1>
      {/* Straight into the database. Most arrivals here were searching for a
          RO Zero database, not for a page about the site, and used to have
          to find the nav to get one. */}
      <p className="aboutjump">
        <Link className="btn" href="/database/monsters">เปิดฐานข้อมูลมอนสเตอร์ →</Link>
        <Link className="chiplink" href="/database/items">ไอเทม</Link>
        <Link className="chiplink" href="/database/cards">การ์ด</Link>
        <Link className="chiplink" href="/database/equipment">อุปกรณ์</Link>
        <Link className="chiplink" href="/database/skills">สกิล</Link>
        <Link className="chiplink" href="/database/maps">แมพ</Link>
      </p>

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
