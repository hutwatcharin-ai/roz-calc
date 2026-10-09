// app/guides/forging/page.tsx
//
// One page for the whole of forging, elemental weapons included.
//
// They were two pages until 7 Sep 2026 and the user asked whether that was
// confusing. It was, and the data says why: none of the 54 forging recipes
// contains an element stone, and no elemental weapon appears as a product,
// because an elemental weapon is not a separate item. You forge the ordinary
// weapon from the ordinary recipe and drop a stone in during the same craft.
//
// Redesigned 8 Oct 2026 (owner: every guide in the newer arcade look, and
// fill in what is missing): recipe cards filtered by the Smith skill and the
// weapon level, the stones as tiles, and each skill's own success bonus from
// the skill data.

import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import CraftGuide from '@/components/CraftGuide';
import ItemIcon from '@/components/ItemIcon';
import JsonLd from '@/components/JsonLd';
import { breadcrumbJsonLd } from '@/lib/jsonld';
import { recipesOfKind, type Recipe } from '@/lib/crafting';
import CraftCalc from '@/components/craft-calc/CraftCalc';
import { craftCalcConfig, oreSkillRates } from '@/lib/craft-calc-config';

export const revalidate = 86400;

export const metadata = {
  title: 'ตีอาวุธ Blacksmith Ragnarok Zero — สูตร วัตถุดิบ และอาวุธธาตุ',
  description:
    'อาวุธที่ Blacksmith ตีเองได้ใน Ragnarok Zero Global ครบทุกสูตรพร้อมวัตถุดิบ กรองตามสกิล Smith และระดับอาวุธ วิธีใส่หินธาตุให้เป็นอาวุธธาตุ หินแต่ละก้อนทำจากอะไร และอะไรทำให้ตีติดบ่อยขึ้น',
};

// Which stone makes which element. This is the one thing the recipe data
// cannot say -- the stone is chosen at the forge, so it is in no recipe.
const ELEMENT_STONES = [
  { element: 'ไฟ', stone: 'Flame Heart', id: 994, color: '#ff6b3d' },
  { element: 'น้ำ', stone: 'Mystic Frozen', id: 995, color: '#3d9bff' },
  { element: 'ลม', stone: 'Rough Wind', id: 996, color: '#4dffb8' },
  { element: 'ดิน', stone: 'Great Nature', id: 997, color: '#d9a640' },
] as const;

// rAthena skill ids on the forge rows. The names and the 5% per level (max
// 3) are the client's own skill text in data/skill-trees.json.
const SMITH: Record<number, { name: string; th: string }> = {
  98: { name: 'Smith Dagger', th: 'มีด' },
  99: { name: 'Smith Sword', th: 'ดาบมือเดียว' },
  100: { name: 'Smith Two-handed Sword', th: 'ดาบสองมือ' },
  101: { name: 'Smith Axe', th: 'ขวาน' },
  102: { name: 'Smith Mace', th: 'กระบอง' },
  103: { name: 'Smith Knuckle', th: 'สนับมือ' },
  104: { name: 'Smith Spear', th: 'หอก' },
};

const tagsOf = (r: Recipe) => [r.skillId != null ? `s${r.skillId}` : '', r.itemLevel != null ? `l${r.itemLevel}` : ''].filter(Boolean);
const badgeOf = (r: Recipe) => (r.itemLevel != null ? `อาวุธ Lv ${r.itemLevel}` : null);

export default async function ForgingPage() {
  const all = recipesOfKind('forge');
  const ore = recipesOfKind('ore');
  const calc = await craftCalcConfig({
    id: 'forge',
    recipes: [...all, ...ore],
    chain: ore.filter((r) => r.confidence === 'both'),
    expandLabel: 'หลอม Iron, Steel และหินธาตุเอง (นับเป็นแร่ดิบแทน)',
    expandDefault: false,
    skillRates: oreSkillRates(),
    unknownRateNote: 'ยังไม่รู้โอกาสตีอาวุธติดในเซิร์ฟนี้ ยอดอาวุธคิดแบบตีติดทุกครั้ง ถ้าตีไม่ติดวัตถุดิบหายด้วย ควรเผื่อไว้อีก',
  });
  const confirmed = all.filter((r) => r.confidence === 'both');
  const count = (pred: (r: Recipe) => boolean) => confirmed.filter(pred).length;

  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'หน้าแรก', path: '/' },
          { name: 'ไกด์', path: '/guides' },
          { name: 'ตีอาวุธ', path: '/guides/forging' },
        ])}
      />
      <PageHeader
        title="ตีอาวุธเอง — สูตรทั้งหมด และวิธีทำอาวุธธาตุ"
        lead={
          <>
            Blacksmith ตีอาวุธเองได้ {confirmed.length} แบบ · <strong>อาวุธธาตุไม่ใช่สูตรแยก</strong> ใช้สูตรเดียวกัน
            แล้วใส่หินธาตุ 1 ก้อนตอนกดตี
          </>
        }
      />

      <div className="gtiles">
        <div className="gtile">
          <span className="gtile__k">สูตรที่ยืนยันแล้ว</span>
          <span className="gtile__v">{confirmed.length}</span>
          <span className="gtile__s">ใช้ได้กับ 7 สกิล Smith</span>
        </div>
        <div className="gtile">
          <span className="gtile__k">วัตถุดิบหลัก</span>
          <span className="gtile__v">
            <img src="/images/items/998.gif" alt="" width={24} height={24} />
            <img src="/images/items/999.gif" alt="" width={24} height={24} />
            <img src="/images/items/984.gif" alt="" width={24} height={24} />
          </span>
          <span className="gtile__s">Iron · Steel · Oridecon</span>
        </div>
        <div className="gtile">
          <span className="gtile__k">สกิล Smith</span>
          <span className="gtile__v">+5% / Lv</span>
          <span className="gtile__s">เต็ม Lv 3 = +15% ต่อชนิดอาวุธ</span>
        </div>
        <div className="gtile">
          <span className="gtile__k">ของที่ตีได้</span>
          <span className="gtile__v">0 ช่อง</span>
          <span className="gtile__s">แต่สุ่มออปชั่นเพิ่ม 4 แถว</span>
        </div>
      </div>

      <section className="card card--cyan" style={{ marginTop: 16 }}>
        <h2 className="section-title">ตียังไง</h2>
        <ol className="gsteps">
          <li>เป็น Blacksmith ที่อัปสกิลตีอาวุธชนิดนั้นแล้ว เช่น <strong>Smith Sword</strong> สำหรับดาบมือเดียว (ทุกสาย Smith ต่อจาก Smith Dagger)</li>
          <li>เตรียมวัตถุดิบตามสูตรด้านล่าง กับค้อนตีเหล็กและทั่ง (Anvil) ไว้ในกระเป๋า</li>
          <li>ถ้าจะทำอาวุธธาตุ ใส่หินธาตุ 1 ก้อนในหน้าต่างตอนกดตี</li>
          <li>เหลือช่องและน้ำหนักในกระเป๋าไว้ด้วย ตีติดแล้วได้อาวุธทันที</li>
        </ol>
        <p className="muted" style={{ marginBottom: 0 }}>
          <strong>ของที่ตีได้ไม่ใช่ตัวเดียวกับที่ร้านขายหรือมอนดรอป</strong> ชื่อเหมือนกัน แต่ไม่มีช่องการ์ด และสุ่มออปชั่นเพิ่ม 4 แถว ·
          ลิงก์ในการ์ดพาไปหน้าแบบที่ร้านขาย
        </p>
      </section>

      <CraftCalc config={calc}>
      <CraftGuide
        kind="forge"
        calc
        title={`สูตรตีอาวุธ (${confirmed.length})`}
        placeholder="ค้นชื่ออาวุธ หรือวัตถุดิบ เช่น Oridecon"
        tagsOf={tagsOf}
        badgeOf={badgeOf}
        facets={[
          {
            label: 'สกิล',
            options: Object.entries(SMITH)
              .map(([id, s]) => ({ value: `s${id}`, label: s.th, count: count((r) => r.skillId === Number(id)) }))
              .filter((o) => o.count > 0),
          },
          {
            label: 'ระดับอาวุธ',
            options: [1, 2, 3].map((l) => ({ value: `l${l}`, label: `Lv ${l}`, count: count((r) => r.itemLevel === l) })),
          },
        ]}
        extra={
          <>
            <section className="card" style={{ marginTop: 20 }}>
              <h2 className="section-title">ทำให้เป็นอาวุธธาตุ</h2>
              <p className="muted" style={{ marginTop: 0, maxWidth: '68ch' }}>
                ใส่หินธาตุ 1 ก้อนตอนกดตี สูตรไม่เปลี่ยน วัตถุดิบเท่าเดิม สิ่งที่เปลี่ยนคือธาตุของอาวุธ กับโอกาสสำเร็จที่ลดลงราว 25%
              </p>
              <div className="fstones">
                {ELEMENT_STONES.map((row) => (
                  <Link key={row.id} className="fstone" href={`/database/items/${row.id}`} style={{ '--el': row.color } as React.CSSProperties}>
                    <span className="fstone__el">ธาตุ{row.element}</span>
                    <ItemIcon iconUrl={`/images/items/${row.id}.gif`} category="Other" size={32} />
                    <span className="fstone__name">{row.stone}</span>
                  </Link>
                ))}
              </div>
              <p className="ceiling-note" style={{ marginTop: 12 }}>
                <strong>อย่าใส่ Star Crumb โดยไม่ตั้งใจ</strong> มันเพิ่มความแรงก็จริง แต่ลดโอกาสสำเร็จอีกก้อนละ 15% และไม่ได้ทำให้อาวุธมีธาตุ
              </p>
            </section>

            <section style={{ marginTop: 20 }}>
              <CraftGuide kind="ore" title="หินธาตุกับเหล็กทำจากอะไร" calc>
                <p className="muted" style={{ margin: '0 0 -4px' }}>
                  หลอมเองได้จากของที่มอนธาตุนั้นดรอป · ละเอียดกว่านี้ที่ <Link href="/guides/ore-refining">หลอมแร่และหินธาตุ</Link>
                </p>
              </CraftGuide>
            </section>

            <section className="card card--yellow" style={{ marginTop: 20 }}>
              <h2 className="section-title">อยากให้ตีติดบ่อยขึ้น</h2>
              <div className="fodds">
                <div className="fodds__col is-up">
                  <h3>เพิ่มโอกาส</h3>
                  <ul>
                    <li><strong>Job level, DEX, LUK</strong> ฐานของอัตราสำเร็จ</li>
                    <li><strong>สกิล Smith</strong> สายนั้น +5% ต่อเลเวล (เต็ม 3)</li>
                    <li><strong>Weaponry Research</strong> +1% ต่อเลเวล</li>
                    <li><strong>ทั่ง</strong> ธรรมดา +0% · Oridecon +2.5% · ทอง +5% · Emperium +10%</li>
                    <li><strong>ระดับอาวุธ 1-3</strong> ได้โบนัส ระดับ 4 ไม่ได้</li>
                  </ul>
                </div>
                <div className="fodds__col is-down">
                  <h3>ลดโอกาส</h3>
                  <ul>
                    <li><strong>หินธาตุ</strong> −25%</li>
                    <li><strong>Star Crumb</strong> ก้อนละ −15%</li>
                  </ul>
                  <p className="muted">เซิร์ฟเวอร์สุ่มโบนัสบวกทุกครั้งที่ตี โอกาสจึงไม่คงที่ เตรียมวัตถุดิบเผื่อพลาดไว้เสมอ</p>
                </div>
              </div>
              <p className="source-note" style={{ marginTop: 12 }}>
                <strong>ที่มา:</strong> ปัจจัยโอกาสสำเร็จเทียบกับสูตรที่ prontera.info เผยแพร่ ซึ่งระบุเองว่าอ้างอิง TWRO
                จึงไม่นำเปอร์เซ็นต์ตายตัวมาอ้างเป็นค่าทางการของ RO Zero Global · สกิล Smith +5% ต่อเลเวลมาจากคำอธิบายสกิลในไคลเอนต์
              </p>
            </section>

            <p className="muted" style={{ marginTop: 16 }}>
              ตีเสร็จแล้วเอาไปใช้กับมอนธาตุไหน ดู <Link href="/guides/elements">ตารางธาตุ</Link> หรือลองอาวุธกับมอนจริงที่{' '}
              <Link href="/tools/build">จำลองบิลด์</Link>
            </p>
          </>
        }
      >
        <></>
      </CraftGuide>
      </CraftCalc>
    </main>
  );
}
