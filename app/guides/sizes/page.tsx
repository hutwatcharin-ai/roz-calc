// app/guides/sizes/page.tsx
import Link from 'next/link';
import { SIZE_TABLE, SIZES, SIZE_LABELS } from '@/lib/size-table';

export const metadata = {
  title: 'ตารางขนาด Ragnarok Zero',
  description:
    'ตารางตัวคูณความเสียหายตามประเภทอาวุธ × ขนาดมอนสเตอร์ของ Ragnarok Zero Global — ดูว่าอาวุธชนิดไหนตีมอนขนาดเล็ก กลาง ใหญ่ ได้เต็มหรือโดนหัก',
};

function band(value: number): string {
  if (value < 75) return 'el--immune';
  if (value < 100) return 'el--weak';
  return 'el--flat';
}

export default function SizesPage() {
  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <h1 className="pagehead__title">ตารางขนาด Ragnarok Zero</h1>
      <p className="muted" style={{ marginTop: 8, maxWidth: '65ch' }}>
        ดาเมจขึ้นกับขนาดมอนด้วย ไม่ใช่แค่ธาตุ — เช่น หนังสือตีมอนใหญ่เหลือ 50%
      </p>

      <div className="ceiling-note" style={{ marginTop: 16 }}>
        <strong>ที่มาของตัวเลข:</strong> คู่มือเกมทางการของ Ragnarok Zero (ระบบพิเศษ &gt; ระบบขนาด) ·
        ตัวคูณนี้คิดก่อนตัวคูณธาตุ ดูคู่กับ <Link href="/guides/elements">ตารางธาตุ</Link> ได้
        · เทียบกับ rozerodb ที่ถอดหน้าเดียวกันแยกกันมา <strong>ตรงกัน 59 จาก 60 ช่อง</strong>{' '}
        ช่องที่ต่างคือ <strong>แส้ตีเป้าหมายขนาดใหญ่</strong> เว็บนี้อ่านได้ 75% เขาอ่านได้ 50%
        ยังไม่ตัดสิน ใครเปิดคู่มือหน้านั้นได้ช่วยดูให้ที
      </div>

      <div className="card" style={{ marginTop: 16, overflowX: 'auto' }}>
        <table className="eltable">
          <thead>
            <tr>
              <th scope="col">ประเภทอาวุธ</th>
              {SIZES.map((size) => (
                <th key={size} scope="col">
                  {SIZE_LABELS[size]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SIZE_TABLE.map((row) => (
              <tr key={row.weapon}>
                <th scope="row">
                  {row.weapon}
                  <span className="muted" style={{ fontSize: 12, marginInlineStart: 6 }}>
                    {row.label}
                  </span>
                </th>
                {SIZES.map((size) => (
                  <td key={size} className={`el ${band(row[size])}`}>
                    {row[size]}%
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="muted" style={{ marginTop: 20 }}>
        อยากรู้ว่ามอนตัวไหนขนาดอะไร เปิด <Link href="/database/monsters">หน้ารายการมอนสเตอร์</Link>{' '}
        แล้วกดเข้าไปดูรายตัว หน้ามอนจะบอกด้วยว่าอาวุธชนิดไหนตีตัวนั้นได้เต็ม
      </p>
    </main>
  );
}
