import Link from 'next/link';
import JsonLd from '@/components/JsonLd';
import { breadcrumbJsonLd } from '@/lib/jsonld';

export const metadata = {
  title: 'วิธีทำอาวุธธาตุ Blacksmith Ragnarok Zero',
  description:
    'วิธีตีอาวุธธาตุ Blacksmith ใน Ragnarok Zero Global ใช้หินธาตุอะไร เตรียมสกิล ค้อน ทั่ง และวัตถุดิบอย่างไร พร้อมปัจจัยเพิ่มโอกาสสำเร็จ',
};

const ELEMENT_STONES = [
  { element: 'ไฟ', stone: 'Flame Heart', from: 'Red Blood ×10', id: 994 },
  { element: 'น้ำ', stone: 'Mystic Frozen', from: 'Crystal Blue ×10', id: 995 },
  { element: 'ลม', stone: 'Rough Wind', from: 'Wind of Verdure ×10', id: 996 },
  { element: 'ดิน', stone: 'Great Nature', from: 'Green Live ×10', id: 997 },
] as const;

export default function ElementalWeaponsGuidePage() {
  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <JsonLd data={breadcrumbJsonLd([
        { name: 'หน้าแรก', path: '/' },
        { name: 'ไกด์', path: '/guides' },
        { name: 'ทำอาวุธธาตุ', path: '/guides/elemental-weapons' },
      ])} />
      <h1 className="pagehead__title">วิธีทำอาวุธธาตุ Blacksmith</h1>
      <p className="muted" style={{ marginTop: 8, maxWidth: '68ch' }}>
        สรุปสั้นที่สุด: เลือกสูตรอาวุธที่ Blacksmith ตีได้ เตรียมวัตถุดิบกับค้อน แล้วใส่หินธาตุ 1 ก้อนตอนใช้สกิลตีอาวุธ อาวุธที่สำเร็จจะเป็นธาตุของหินก้อนนั้น
      </p>

      <section className="card card--cyan" style={{ marginTop: 18 }}>
        <h2 className="section-title">ต้องเตรียมอะไร</h2>
        <ol style={{ margin: 0, paddingInlineStart: 22 }}>
          <li>Blacksmith ที่มีสกิลตีอาวุธชนิดนั้น เช่น Smith Sword, Smith Dagger หรือ Smith Axe</li>
          <li>วัตถุดิบของอาวุธตามสูตร และหินธาตุ 1 ก้อนจากตารางด้านล่าง</li>
          <li>ค้อนตีเหล็กและทั่ง (Anvil) — ทั่งที่ดีกว่าช่วยเพิ่มโอกาสสำเร็จ</li>
          <li>ช่องเก็บของและน้ำหนักเหลือพอ เพราะถ้าสำเร็จจะได้รับอาวุธทันที</li>
        </ol>
      </section>

      <section className="card" style={{ marginTop: 16, overflowX: 'auto' }}>
        <h2 className="section-title">หินสำหรับอาวุธแต่ละธาตุ</h2>
        <table className="stat-table">
          <thead><tr><th scope="col">ธาตุอาวุธ</th><th scope="col">หินที่ใส่ตอนตี</th><th scope="col">สูตรทำหิน</th></tr></thead>
          <tbody>{ELEMENT_STONES.map((row) => (
            <tr key={row.element}>
              <th scope="row">{row.element}</th>
              <td><Link href={`/database/items/${row.id}`}>{row.stone}</Link></td>
              <td>{row.from}</td>
            </tr>
          ))}</tbody>
        </table>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <h2 className="section-title">ขั้นตอนตีอาวุธธาตุ</h2>
        <ol style={{ margin: 0, paddingInlineStart: 22 }}>
          <li>พกวัตถุดิบของอาวุธ ค้อน ทั่ง และหินธาตุที่ต้องการ</li>
          <li>ใช้สกิลตีอาวุธชนิดนั้น แล้วเลือกอาวุธจากรายการ</li>
          <li>เลือกหินธาตุ 1 ก้อนในหน้าต่าง Forge จากนั้นยืนยัน</li>
          <li>ถ้าสำเร็จ ตรวจชื่อและธาตุของอาวุธก่อนนำไปใช้หรือขาย</li>
        </ol>
        <p className="muted" style={{ marginTop: 12 }}>
          อย่าใส่ Star Crumb โดยไม่ตั้งใจ: ทุกก้อนเพิ่มความแรงคงที่ แต่ลดโอกาสสำเร็จอีก และไม่จำเป็นต่อการทำให้อาวุธมีธาตุ
        </p>
      </section>

      <section className="card card--yellow" style={{ marginTop: 16 }}>
        <h2 className="section-title">ทำอย่างไรให้โอกาสสำเร็จสูงขึ้น</h2>
        <ul style={{ margin: 0, paddingInlineStart: 22 }}>
          <li>เพิ่ม Job Level, DEX และ LUK</li>
          <li>อัปสกิลตีอาวุธชนิดนั้น, Weaponry Research และ Enchanted Stone Craft</li>
          <li>ใช้ทั่งระดับสูงขึ้น และหลีกเลี่ยง Star Crumb ถ้าไม่ได้ต้องการโบนัสของมัน</li>
          <li>อาวุธเลเวลสูงและการใส่หินธาตุทำให้สำเร็จยากขึ้น ควรเตรียมวัตถุดิบเผื่อแตก</li>
        </ul>
      </section>

      <p className="source-note" style={{ marginTop: 16 }}>
        <strong>ที่มา:</strong> สูตรวัตถุดิบจาก <a href="https://rozerodb.com/recipes" rel="noopener noreferrer">Recipes ของ RO ZERO DATABASE</a>; รายละเอียดสกิลจากข้อมูลไคลเอนต์ ROZ ในฐานข้อมูลของเว็บนี้ ส่วนปัจจัยโอกาสสำเร็จเทียบกับ Forge Simulator ที่ระบุว่าอ้างอิงสูตร TWRO จึงไม่นำเปอร์เซ็นต์ตายตัวมาอ้างเป็นค่าทางการของ RO Zero Global
      </p>
      <p className="muted" style={{ marginTop: 16 }}>
        ทำเสร็จแล้วควรใช้ตีมอนธาตุไหน ดู <Link href="/guides/elements">ตารางธาตุ</Link> หรือเทียบดาเมจที่ <Link href="/tools/damage">เครื่องคำนวณดาเมจ</Link>
      </p>
    </main>
  );
}
