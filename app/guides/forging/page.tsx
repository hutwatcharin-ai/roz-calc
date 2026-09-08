// app/guides/forging/page.tsx
//
// One page for the whole of forging, elemental weapons included.
//
// They were two pages until 7 Sep 2026 and the user asked whether that was
// confusing. It was, and the data says why: none of the 54 forging recipes
// contains an element stone, and no elemental weapon appears as a product,
// because an elemental weapon is not a separate item. You forge the ordinary
// weapon from the ordinary recipe and drop a stone in during the same craft.
// Two pages described one action, and neither could be read without the
// other -- the forging page never mentioned that stones existed, and the
// elemental page never said which weapons you could forge.

import Link from 'next/link';
import CraftGuide from '@/components/CraftGuide';
import ItemIcon from '@/components/ItemIcon';
import JsonLd from '@/components/JsonLd';
import { breadcrumbJsonLd } from '@/lib/jsonld';
import { craftCounts } from '@/lib/crafting';

export const revalidate = 86400;

export const metadata = {
  title: 'ตีอาวุธ Blacksmith Ragnarok Zero — สูตร วัตถุดิบ และอาวุธธาตุ',
  description:
    'อาวุธที่ Blacksmith ตีเองได้ใน Ragnarok Zero Global ครบทุกสูตรพร้อมวัตถุดิบ วิธีใส่หินธาตุให้เป็นอาวุธธาตุ หินแต่ละก้อนทำจากอะไร และอะไรทำให้ตีติดบ่อยขึ้น',
};

// Which stone makes which element. This is the one thing the recipe data
// cannot say -- the stone is chosen at the forge, so it is in no recipe --
// and it is the whole reason the elemental guide existed.
const ELEMENT_STONES = [
  { element: 'ไฟ', stone: 'Flame Heart', id: 994 },
  { element: 'น้ำ', stone: 'Mystic Frozen', id: 995 },
  { element: 'ลม', stone: 'Rough Wind', id: 996 },
  { element: 'ดิน', stone: 'Great Nature', id: 997 },
] as const;

export default function ForgingPage() {
  const counts = craftCounts();
  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'หน้าแรก', path: '/' },
          { name: 'ไกด์', path: '/guides' },
          { name: 'ตีอาวุธ', path: '/guides/forging' },
        ])}
      />
      <h1 className="pagehead__title">ตีอาวุธเอง — สูตรทั้งหมด และวิธีทำอาวุธธาตุ</h1>
      <p className="muted" style={{ marginTop: 8, maxWidth: '68ch' }}>
        Blacksmith ตีอาวุธเองได้ {counts.forge?.total ?? 0} แบบ · <strong>อาวุธธาตุไม่ใช่สูตรแยก</strong> —
        ใช้สูตรเดียวกันนี้แหละ แล้วใส่หินธาตุ 1 ก้อนตอนกดตี อาวุธที่ออกมาจะเป็นธาตุของหินก้อนนั้น
        แลกกับโอกาสสำเร็จที่ลดลง
      </p>

      <section className="card card--cyan" style={{ marginTop: 18 }}>
        <h2 className="section-title">ต้องเตรียมอะไร</h2>
        <ol style={{ margin: 0, paddingInlineStart: 22, lineHeight: 1.9 }}>
          <li>Blacksmith ที่มีสกิลตีอาวุธชนิดนั้น เช่น Smith Sword, Smith Dagger หรือ Smith Axe</li>
          <li>วัตถุดิบตามสูตรในตารางด้านล่าง</li>
          <li>ค้อนตีเหล็กและทั่ง (Anvil) — ทั่งที่ดีกว่าเพิ่มโอกาสสำเร็จ</li>
          <li>ถ้าจะทำอาวุธธาตุ เตรียมหินธาตุ 1 ก้อนไปด้วย</li>
          <li>ช่องเก็บของและน้ำหนักเหลือพอ เพราะถ้าสำเร็จจะได้อาวุธทันที</li>
        </ol>
      </section>

      <CraftGuide
        kind="forge"
        extra={
          <>
            <section className="card" style={{ marginTop: 20 }}>
              <h2 className="section-title">ทำให้เป็นอาวุธธาตุ</h2>
              <p className="muted" style={{ marginTop: 0, maxWidth: '68ch' }}>
                ใส่หินธาตุ 1 ก้อนในหน้าต่างตอนกดตี — สูตรอาวุธไม่เปลี่ยน วัตถุดิบเท่าเดิม
                สิ่งที่เปลี่ยนคือธาตุของอาวุธที่ได้ กับโอกาสสำเร็จที่ลดลงราว 25%
              </p>
              <div className="recipe__scroll">
                <table className="data-table recipe">
                  <thead>
                    <tr>
                      <th>อยากได้อาวุธธาตุ</th>
                      <th>ใส่หินก้อนนี้</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ELEMENT_STONES.map((row) => (
                      <tr key={row.element}>
                        <td data-label="ธาตุ">{row.element}</td>
                        <td data-label="หิน">
                          <Link className="recipe__item" href={`/database/items/${row.id}`}>
                            <ItemIcon iconUrl={`/images/items/${row.id}.gif`} category="Other" size={22} />
                            <span>{row.stone}</span>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="muted" style={{ marginTop: 12 }}>
                <strong>อย่าใส่ Star Crumb โดยไม่ตั้งใจ</strong> — มันเพิ่มความแรงก็จริง แต่ลดโอกาสสำเร็จอีก
                ก้อนละ 15% และไม่เกี่ยวกับการทำให้อาวุธมีธาตุเลย
              </p>
            </section>

            <section style={{ marginTop: 24 }}>
              <h2 className="section-title">หินธาตุทำจากอะไร</h2>
              <p className="muted" style={{ marginTop: 6, maxWidth: '68ch' }}>
                หลอมเองได้จากของที่มอนธาตุนั้นดรอป · ดูครบที่{' '}
                <Link href="/guides/ore-refining">หลอมแร่และหินธาตุ</Link>
              </p>
              <CraftGuide kind="ore">
                <></>
              </CraftGuide>
            </section>

            <section className="card card--yellow" style={{ marginTop: 20 }}>
              <h2 className="section-title">อยากให้ตีติดบ่อยขึ้น</h2>
              <ul style={{ marginTop: 8, paddingInlineStart: 20, lineHeight: 1.9 }}>
                <li><strong>Job level, DEX, LUK</strong> — สามตัวนี้เป็นฐานของอัตราสำเร็จ</li>
                <li><strong>ระดับอาวุธ</strong> — อาวุธระดับ 1-3 ได้โบนัส ระดับ 4 ไม่ได้</li>
                <li><strong>สกิล</strong> — Smith สายนั้น +5% ต่อเลเวล · Weaponry Research +1% ต่อเลเวล · Enchanted Stone Craft ใช้หลอมหินธาตุ</li>
                <li><strong>ทั่ง</strong> — ทั่งธรรมดา +0% · Oridecon +2.5% · ทอง +5% · Emperium +10%</li>
                <li><strong>ของที่ทำให้ยากขึ้น</strong> — หินธาตุ −25% · Star Crumb ก้อนละ −15%</li>
              </ul>
              <p className="muted" style={{ marginTop: 10 }}>
                เซิร์ฟเวอร์สุ่มโบนัสบวกเข้าไปในอัตราสำเร็จทุกครั้งที่ตี อัตราจึงไม่ใช่ตัวเลขเดียวคงที่ —
                ตัวละครเดิม ตีรอบนี้กับรอบหน้าโอกาสไม่เท่ากัน เตรียมวัตถุดิบเผื่อแตกไว้เสมอ
              </p>
            </section>

            <p className="source-note" style={{ marginTop: 16 }}>
              <strong>ที่มา:</strong> ปัจจัยโอกาสสำเร็จเทียบกับสูตรที่ prontera.info เผยแพร่ ซึ่งระบุเองว่าอ้างอิง TWRO
              จึงไม่นำเปอร์เซ็นต์ตายตัวมาอ้างเป็นค่าทางการของ RO Zero Global · รายละเอียดสกิลจากข้อมูลไคลเอนต์ในฐานข้อมูลของเว็บนี้
            </p>
            <p className="muted" style={{ marginTop: 12 }}>
              ตีเสร็จแล้วเอาไปใช้กับมอนธาตุไหน ดู <Link href="/guides/elements">ตารางธาตุ</Link> หรือเทียบดาเมจที่{' '}
              <Link href="/tools/damage">ตีมอนด้วยอะไรดี</Link>
            </p>
          </>
        }
      >
        <></>
      </CraftGuide>
    </main>
  );
}
