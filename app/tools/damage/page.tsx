// app/tools/damage/page.tsx
//
// The two official multiplier tables, multiplied. The reference tables below
// the tool are server-rendered so the page is worth landing on with JavaScript
// still loading.

import Link from 'next/link';
import { Fragment } from 'react';
import DamagePicker from '@/components/DamagePicker';
import { ELEMENTS } from '@/lib/element-table';
import { SIZE_LABELS, SIZES, SIZE_TABLE } from '@/lib/size-table';

export const metadata = {
  title: 'ตีตัวนี้ด้วยอะไรดี',
  description:
    'รวมตัวคูณธาตุกับตัวคูณขนาดของ Ragnarok Zero Global เข้าด้วยกัน — บอกว่าอาวุธที่ถืออยู่ตีเป้าหมายนั้นเข้ากี่เปอร์เซ็นต์ และควรเปลี่ยนเป็นธาตุอะไร',
};

export default function DamagePage() {
  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <h1 style={{ fontFamily: '"Chakra Petch", sans-serif', fontSize: 32 }}>ตีตัวนี้ด้วยอะไรดี</h1>
      <p className="muted" style={{ marginTop: 8, maxWidth: '65ch' }}>
        ธาตุกับขนาดเป็นตัวคูณคนละตัวที่<strong>คูณกัน</strong> คนส่วนใหญ่ดูทีละตาราง —
        ธาตุ 200% ที่ดูชี้ขาด เจอขนาด 50% ก็เหลือ 100% เท่ามือเปล่า
        ส่วนขนาด 50% ที่ดูเหมือนจบเห่ ถ้าธาตุเข้าทางก็ยังชนะตัวเลือกอื่น
      </p>

      <div className="ceiling-note" style={{ marginTop: 16 }}>
        <strong>ที่มาของตัวเลข:</strong> ตารางธาตุกับตารางขนาดของ
        <strong>คู่มือเกมทางการ Ragnarok Zero</strong> ทั้งคู่ · หน้านี้ไม่ได้เพิ่มตัวเลขใหม่
        แค่คูณสองตารางที่มีอยู่แล้ว
      </div>

      <DamagePicker />

      <h2 className="section-title" style={{ marginTop: 28 }}>
        ตารางขนาด
      </h2>
      <div className="card" style={{ marginTop: 12, overflowX: 'auto' }}>
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
                  <td
                    key={size}
                    className={`el ${row[size] <= 50 ? 'el--immune' : row[size] < 100 ? 'el--weak' : 'el--flat'}`}
                  >
                    {row[size]}%
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="muted" style={{ marginTop: 16 }}>
        ตารางธาตุเต็ม 4 ระดับอยู่ที่ <Link href="/tools/elements">ตารางธาตุ</Link> ·{' '}
        ธาตุที่มีในเกม {ELEMENTS.length} ธาตุ · ประเภทอาวุธ {SIZE_TABLE.length} ชนิด
        <Fragment> · </Fragment>
        <Link href="/tools/refine">ตีบวกเพิ่ม ATK ได้เท่าไร</Link>
      </p>
    </main>
  );
}
