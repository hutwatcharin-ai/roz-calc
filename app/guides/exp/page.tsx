// app/guides/exp/page.tsx
//
// The guide's EXP tables, plus the running total it does not print. Entirely
// server-rendered: this page is a reference table, and a reference table that
// needs JavaScript to show its numbers is a worse reference table.

import Caveat from '@/components/Caveat';
import Link from 'next/link';
import ExpRangeCalculator from '@/components/ExpRangeCalculator';
import {
  BASE_EXP_ROWS,
  FIRST_JOB_EXP_ROWS,
  MAX_PUBLISHED_BASE_LEVEL,
  NOVICE_JOB_EXP_ROWS,
} from '@/lib/exp-table';

export const metadata = {
  title: 'ตาราง EXP ต่อเลเวล Ragnarok Zero',
  description:
    'ตาราง EXP ต่อเลเวลของ Ragnarok Zero Global จากคู่มือเกมทางการ เลเวลฐาน 1-50 และ Job EXP ของ Novice กับอาชีพขั้นที่ 1 พร้อมยอดสะสม',
};

function num(value: number): string {
  return value.toLocaleString('en-US');
}

function runningTotals(rows: number[]): number[] {
  let sum = 0;
  return rows.map((value) => {
    sum += value;
    return sum;
  });
}

const BASE_TOTALS = runningTotals(BASE_EXP_ROWS);

export default function ExpPage() {
  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <h1 className="pagehead__title">ตาราง EXP ต่อเลเวล Ragnarok Zero</h1>
      <p className="muted" style={{ marginTop: 8, maxWidth: '65ch' }}>
        EXP ที่ต้องใช้ต่อเลเวล พร้อมคอลัมน์รวมสะสมตั้งแต่เลเวล 1
      </p>

      <p className="source-note">
        <strong>ที่มา:</strong> คู่มือเกมทางการ · เส้นโค้งฐานขึ้นราว 1.2 เท่าต่อเลเวล
      </p>

      <Caveat label="วิธีอ่านตาราง และข้อจำกัด">
        <strong>วิธีอ่าน:</strong> แถว N = EXP ที่ต้องเก็บเพื่อขึ้นถึงเลเวล N (แถบรีเซ็ตทุกครั้งที่ขึ้นเลเวล)
        <br />
        <strong>ข้อจำกัด:</strong> คู่มือมีถึงเลเวล {MAX_PUBLISHED_BASE_LEVEL} — เกินกว่านั้นขึ้นว่าไม่มีข้อมูล ไม่เดาให้
      </Caveat>

      <ExpRangeCalculator />

      <h2 className="section-title" style={{ marginTop: 28 }}>
        เลเวลฐาน
      </h2>
      <div className="card" style={{ marginTop: 12, overflowX: 'auto' }}>
        <table className="stat-table">
          <thead>
            <tr>
              <th scope="col">เลเวล</th>
              <th scope="col">EXP</th>
              <th scope="col">รวมสะสม</th>
            </tr>
          </thead>
          <tbody>
            {BASE_EXP_ROWS.map((exp, i) => (
              <tr key={i}>
                <th scope="row">{i + 1}</th>
                <td className="num">{num(exp)}</td>
                <td className="num">{num(BASE_TOTALS[i])}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Two more fifty-row tables. Most readers came for the base curve, and
          stacking all three made the page seven phone screens tall. */}
      <details className="disclose">
        <summary>
          ตาราง Job EXP
          <span className="disclose__count">Novice 10 · อาชีพขั้น 1 · 50 ระดับ</span>
        </summary>
        <div className="disclose__body">
      <div className="detail-cols" style={{ marginTop: 8 }}>
        <div>
          <h2 className="section-title">Job EXP — Novice</h2>
          <p className="muted">Novice ตันที่ job level {NOVICE_JOB_EXP_ROWS.length}</p>
          <div className="card" style={{ marginTop: 12, overflowX: 'auto' }}>
            <table className="stat-table">
              <thead>
                <tr>
                  <th scope="col">Job LV</th>
                  <th scope="col">EXP</th>
                </tr>
              </thead>
              <tbody>
                {NOVICE_JOB_EXP_ROWS.map((exp, i) => (
                  <tr key={i}>
                    <th scope="row">{i + 1}</th>
                    <td className="num">{num(exp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h2 className="section-title">Job EXP — อาชีพขั้นที่ 1</h2>
          <p className="muted">Swordman, Mage, Archer, Merchant, Thief, Acolyte</p>
          <div className="card" style={{ marginTop: 12, overflowX: 'auto' }}>
            <table className="stat-table">
              <thead>
                <tr>
                  <th scope="col">Job LV</th>
                  <th scope="col">EXP</th>
                </tr>
              </thead>
              <tbody>
                {FIRST_JOB_EXP_ROWS.map((exp, i) => (
                  <tr key={i}>
                    <th scope="row">{i + 1}</th>
                    <td className="num">{num(exp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

        </div>
      </details>

      <p className="muted" style={{ marginTop: 20 }}>
        ดูต่อ: <Link href="/tools/afk-finder">หาจุด AFK</Link> ·{' '}
        <Link href="/tools/refine">ตีบวก</Link>
      </p>
    </main>
  );
}
