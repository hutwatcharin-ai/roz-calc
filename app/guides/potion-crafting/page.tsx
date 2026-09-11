import Link from 'next/link';
import JsonLd from '@/components/JsonLd';
import CraftGuide from '@/components/CraftGuide';
import RecipeTable from '@/components/RecipeTable';
import { breadcrumbJsonLd } from '@/lib/jsonld';
import { CREATE_DEADLY_POISON, recipesOfSkill } from '@/lib/crafting';

export const metadata = {
  title: 'วิธีทำยา Alchemist และขวดพิษ Assassin — สูตร Ragnarok Zero',
  description:
    'วิธีปรุงยา Alchemist ด้วย Prepare Potion ใน Ragnarok Zero Global เตรียม Mortar Bowl ตำรา และวัตถุดิบ พร้อมสูตรยาฟื้น ไอเทมเคมี Slim Potion ยาต้านธาตุ และสูตร Poison Bottle ของ Assassin (Create Deadly Poison)',
};

export default function PotionCraftingGuidePage() {
  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <JsonLd data={breadcrumbJsonLd([
        { name: 'หน้าแรก', path: '/' },
        { name: 'ไกด์', path: '/guides' },
        { name: 'ทำยา Alchemist และขวดพิษ Assassin', path: '/guides/potion-crafting' },
      ])} />
      <h1 className="pagehead__title">วิธีทำยา Alchemist และขวดพิษ Assassin</h1>
      <p className="muted" style={{ marginTop: 8 }}>
        เป็น Assassin? ข้ามไปที่ <a href="#assassin">สูตร Poison Bottle</a>
      </p>
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

      {/* Added 11 Sep 2026 at the owner's request. The recipe was already in
          data/crafting-recipes.json but hidden as an Assassin Cross skill;
          in Zero, Create Deadly Poison is the Assassin's (lib/crafting). */}
      <section id="assassin" className="card card--pink" style={{ marginTop: 24, scrollMarginTop: 90 }}>
        <h2 className="section-title">Assassin: ทำ Poison Bottle ด้วย Create Deadly Poison</h2>
        <p style={{ marginTop: 0, maxWidth: '68ch' }}>
          Assassin ทำขวดพิษเองได้ด้วยสกิล <strong>Create Deadly Poison</strong> (Lv 1) ใช้วัตถุดิบตามตารางอย่างละ 1 ชิ้นต่อการทำ 1 ขวด
        </p>
        <h3 className="section-title" style={{ fontSize: 14, marginTop: 12 }}>ต้องอัปสกิลเหล่านี้ก่อน</h3>
        <ul style={{ margin: 0, paddingInlineStart: 22 }}>
          <li>Envenom Lv 10</li>
          <li>Detoxify Lv 1</li>
          <li>Enchant Poison Lv 5</li>
        </ul>
        <div style={{ marginTop: 14 }}>
          <RecipeTable rows={recipesOfSkill(CREATE_DEADLY_POISON)} />
        </div>
        <ul className="muted" style={{ marginTop: 12, marginBottom: 0, paddingInlineStart: 22 }}>
          <li>
            {/* The Job 60 caveat came out on 11 Sep 2026: the owner confirmed in
                game that an Assassin can already use Enchant Deadly Poison. */}
            <Link href="/database/items/678">Poison Bottle</Link> เป็นของที่ <strong>Enchant Deadly Poison</strong> ใช้ครั้งละ 1 ขวด ·
            Assassin ในเซิร์ฟ Global ใช้สกิลนี้ได้แล้ว
          </li>
          <li>
            <Link href="/database/items/1771">Venom Knife</Link> ที่สกิล Venom Knife ใช้ ไม่ต้องทำเอง ซื้อจากร้าน NPC ได้ (ดูร้านที่หน้าไอเทม)
          </li>
          <li>ยังไม่มีข้อมูลอัตราสำเร็จของ Create Deadly Poison ในเซิร์ฟนี้ ลองทำจำนวนน้อยก่อนเตรียมวัตถุดิบล็อตใหญ่</li>
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
