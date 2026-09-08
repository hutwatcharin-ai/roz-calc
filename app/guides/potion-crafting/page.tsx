import Link from 'next/link';
import JsonLd from '@/components/JsonLd';
import CraftGuide from '@/components/CraftGuide';
import { breadcrumbJsonLd } from '@/lib/jsonld';

export const metadata = {
  title: 'วิธีทำยา Alchemist สูตร Prepare Potion Ragnarok Zero',
  description:
    'วิธีปรุงยา Alchemist ด้วย Prepare Potion ใน Ragnarok Zero Global เตรียม Mortar Bowl ตำรา และวัตถุดิบ พร้อมรวมสูตรยาฟื้น ไอเทมเคมี Slim Potion และยาต้านธาตุ',
};

export default function PotionCraftingGuidePage() {
  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <JsonLd data={breadcrumbJsonLd([
        { name: 'หน้าแรก', path: '/' },
        { name: 'ไกด์', path: '/guides' },
        { name: 'ทำยา Alchemist', path: '/guides/potion-crafting' },
      ])} />
      <h1 className="pagehead__title">วิธีทำยา Alchemist ด้วย Prepare Potion</h1>
      <p className="muted" style={{ marginTop: 8, maxWidth: '68ch' }}>
        ทุกครั้งที่ปรุงต้องมีวัตถุดิบของสูตร ตำราที่ตรงกับยา และ <strong>Mortar Bowl 1 ชิ้น</strong> ตำราไม่หาย แต่ Mortar Bowl กับวัตถุดิบถูกใช้ต่อการลอง 1 ครั้ง
      </p>

      <section className="card card--cyan" style={{ marginTop: 18 }}>
        <h2 className="section-title">เตรียมก่อนกดทำยา</h2>
        <ol style={{ margin: 0, paddingInlineStart: 22 }}>
          <li>เปลี่ยนเป็น Alchemist และเรียน Potion Research Lv.5 เพื่อปลด Prepare Potion</li>
          <li>พก <Link href="/database/items/7134">Medicine Bowl (Mortar Bowl)</Link> ตามจำนวนครั้งที่จะลอง</li>
          <li>พกตำราของสูตรนั้น ตำราเป็นกุญแจปลดสูตรและไม่ถูกใช้หมด</li>
          <li>พกวัตถุดิบและภาชนะให้ครบ แล้วใช้สกิล Prepare Potion เลือกของที่จะทำ</li>
        </ol>
      </section>

      {/* Replaced twenty hand-typed rows on 7 Sep 2026. They were a subset
          of this table, with no sprites and no links, and the grouping they
          carried -- which Creation Guide each recipe needs -- is the
          "ต้องมีติดตัว" column here. */}
      <section style={{ marginTop: 24 }}>
        <h2 className="section-title">สูตรทั้งหมด</h2>
        <p className="muted" style={{ marginTop: 6, maxWidth: '68ch' }}>
          กดชื่อของได้ทุกชิ้นเพื่อดูว่าหาจากไหน · ตำราที่ต้องพกอยู่ในคอลัมน์ &ldquo;ต้องมีติดตัว&rdquo;
        </p>
        <CraftGuide kind="brew">
          <></>
        </CraftGuide>
      </section>

      <section className="card card--yellow" style={{ marginTop: 16 }}>
        <h2 className="section-title">เพิ่มโอกาสสำเร็จ</h2>
        <ul style={{ margin: 0, paddingInlineStart: 22 }}>
          <li>เพิ่ม Job Level, INT, DEX และ LUK</li>
          <li>อัป Potion Research และ Prepare Potion (Pharmacy) ให้สูง</li>
          <li>ยาบางกลุ่มมีความยากไม่เท่ากัน: Alcohol ง่ายกว่า ส่วน Condensed White และ Glistening Coat ยากกว่า</li>
          <li>ก่อนทำล็อตใหญ่ ลองจำนวนน้อยและจดผลจริง เพราะสูตรอัตราสำเร็จที่เผยแพร่ยังอิง TWRO ไม่ใช่ประกาศทางการของ ROZ</li>
        </ul>
      </section>

      <p className="source-note" style={{ marginTop: 16 }}>
        <strong>ที่มา:</strong> เงื่อนไข Prepare Potion และ Potion Research จากข้อมูลไคลเอนต์ ROZ ในฐานข้อมูลของเว็บนี้ ชื่อ “Medicine Bowl” ในฐานข้อมูลคือไอเทมเดียวกับ “Mortar Bowl” ที่คำอธิบายสกิลเรียกใช้
      </p>
      <p className="muted" style={{ marginTop: 16 }}>
        หาไอเทมวัตถุดิบเพิ่มเติมได้ที่ <Link href="/database/items">ฐานข้อมูลไอเทม</Link> และเช็กมอนที่ดรอปจากหน้าไอเทมแต่ละชิ้น
      </p>
    </main>
  );
}
