import Link from 'next/link';
import JsonLd from '@/components/JsonLd';
import { breadcrumbJsonLd } from '@/lib/jsonld';

export const metadata = {
  title: 'วิธีทำยา Alchemist สูตร Prepare Potion Ragnarok Zero',
  description:
    'วิธีปรุงยา Alchemist ด้วย Prepare Potion ใน Ragnarok Zero Global เตรียม Mortar Bowl ตำรา และวัตถุดิบ พร้อมรวมสูตรยาฟื้น ไอเทมเคมี Slim Potion และยาต้านธาตุ',
};

const RECIPE_GROUPS = [
  { title: 'ยาฟื้นและยาทั่วไป — Potion Creation Guide', rows: [
    ['Red Potion', 'Red Herb ×1 + Empty Potion Bottle ×1'],
    ['Yellow Potion', 'Yellow Herb ×1 + Empty Potion Bottle ×1'],
    ['White Potion', 'White Herb ×1 + Empty Potion Bottle ×1'],
    ['Blue Potion', 'Blue Herb ×1 + Scell ×1 + Empty Potion Bottle ×1'],
    ['Anodyne', 'Ment ×1 + Alcohol ×1 + Empty Bottle ×1'],
    ['Aloevera', 'Aloe ×1 + Honey ×1 + Empty Bottle ×1'],
  ] },
  { title: 'ไอเทมเคมี — ใช้ตำราของไอเทมนั้น', rows: [
    ['Alcohol', 'Stem ×5 + Poison Spore ×5 + Empty Test Tube ×1 + Empty Bottle ×1'],
    ['Acid Bottle', 'Immortal Heart ×1 + Empty Bottle ×1'],
    ['Bottle Grenade', 'Fabric ×1 + Alcohol ×1 + Empty Bottle ×1'],
    ['Plant Bottle', 'Maneater Blossom ×2 + Empty Bottle ×1'],
    ['Marine Sphere Bottle', 'Tendon ×1 + Detonator ×1 + Empty Bottle ×1'],
    ['Glistening Coat', "Mermaid's Heart ×1 + Zenorc's Fang ×1 + Alcohol ×1 + Empty Bottle ×1"],
  ] },
  { title: 'Slim Potion — Slim Potion Creation Guide', rows: [
    ['Condensed Red Potion', 'Red Potion ×1 + Cactus Needle ×1 + Empty Test Tube ×1'],
    ['Condensed Yellow Potion', 'Yellow Potion ×1 + Mole Whiskers ×1 + Empty Test Tube ×1'],
    ['Condensed White Potion', "White Potion ×1 + Witch's Starsand ×1 + Empty Test Tube ×1"],
  ] },
  { title: 'ยาต้านธาตุ — Elemental Potion Creation Guide', rows: [
    ['Fireproof Potion', 'Frill ×2 + Red Gemstone ×1 + Empty Potion Bottle ×1'],
    ['Coldproof Potion', "Mermaid's Heart ×3 + Blue Gemstone ×1 + Empty Potion Bottle ×1"],
    ['Earthproof Potion', 'Large Jellopy ×2 + Yellow Gemstone ×1 + Empty Potion Bottle ×1'],
    ['Thunderproof Potion', 'Moth Dust ×3 + Blue Gemstone ×1 + Empty Potion Bottle ×1'],
  ] },
  { title: 'Homunculus — Embryo Creation Guide', rows: [
    ['Embryo', 'Morning Dew of Yggdrasil ×1 + Seed of Life ×1 + Glass Tube ×1'],
  ] },
] as const;

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

      {RECIPE_GROUPS.map((group) => (
        <section className="card" style={{ marginTop: 16, overflowX: 'auto' }} key={group.title}>
          <h2 className="section-title">{group.title}</h2>
          <table className="stat-table">
            <thead><tr><th scope="col">ของที่ได้</th><th scope="col">วัตถุดิบต่อ 1 ครั้ง</th></tr></thead>
            <tbody>{group.rows.map(([name, materials]) => (
              <tr key={name}><th scope="row">{name}</th><td>{materials}</td></tr>
            ))}</tbody>
          </table>
        </section>
      ))}

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
        <strong>ที่มา:</strong> สูตร 20 รายการจากหมวด Alchemist Brewing ใน <a href="https://rozerodb.com/recipes" rel="noopener noreferrer">RO ZERO DATABASE</a>; เงื่อนไข Prepare Potion และ Potion Research จากข้อมูลไคลเอนต์ ROZ ในฐานข้อมูลของเว็บนี้ ชื่อ “Medicine Bowl” ในฐานข้อมูลคือไอเทมเดียวกับ “Mortar Bowl” ที่คำอธิบายสกิลเรียกใช้
      </p>
      <p className="muted" style={{ marginTop: 16 }}>
        หาไอเทมวัตถุดิบเพิ่มเติมได้ที่ <Link href="/database/items">ฐานข้อมูลไอเทม</Link> และเช็กมอนที่ดรอปจากหน้าไอเทมแต่ละชิ้น
      </p>
    </main>
  );
}
