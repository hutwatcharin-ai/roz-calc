// app/tools/exp/page.tsx
//
// The guide's EXP tables, plus the running total it does not print. Entirely
// server-rendered: this page is a reference table, and a reference table that
// needs JavaScript to show its numbers is a worse reference table.

import Link from 'next/link';
import ExpRangeCalculator from '@/components/ExpRangeCalculator';
import {
  BASE_EXP_ROWS,
  FIRST_JOB_EXP_ROWS,
  MAX_PUBLISHED_BASE_LEVEL,
  NOVICE_JOB_EXP_ROWS,
} from '@/lib/exp-table';

export const metadata = {
  title: 'EXP ต่อเลเวล',
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
      <h1 className="pagehead__title">EXP ต่อเลเวล</h1>
      <p className="muted" style={{ marginTop: 8, maxWidth: '65ch' }}>
        ตัวเลขที่คู่มือให้คือ EXP ของแต่ละเลเวล คอลัมน์ &ldquo;รวมสะสม&rdquo; เว็บนี้บวกให้เอง —
        เป็นตัวเลขที่บอกว่าจากเลเวล 1 ถึงเลเวลนั้นต้องใช้ทั้งหมดเท่าไร
      </p>

      <p className="source-note">
        <strong>ที่มา:</strong> คู่มือเกมทางการ (คู่มือผู้เชี่ยวชาญ &gt; เลเวลตัวละคร) ·
        เส้นโค้งฐานขึ้นเกือบพอดี 1.2 เท่าทุกเลเวล เทสต์ในโค้ดตรวจอัตราส่วนนี้ทุกแถว
      </p>

      <div className="ceiling-note" style={{ marginTop: 12 }}>
        <strong>แถวหนึ่งแถวคืออะไร:</strong> แถบ EXP รีเซ็ตเป็น 0 ทุกครั้งที่ขึ้นเลเวล
        แต่ละแถวจึงเป็นแถบหนึ่งใบ ไม่ใช่ยอดสะสม · และแถวเลเวล 1 เป็น 0
        ซึ่งเป็นไปได้ทางเดียวคือ <strong>แถว N คือแถบที่เก็บเพื่อขึ้นถึงเลเวล N</strong> —
        ตัวละครเลเวล 1 กำลังเก็บแถบของแถวเลเวล 2 คือ 2,500
        <br />
        <strong>ข้อจำกัด:</strong> คู่มือหยุดที่เลเวล {MAX_PUBLISHED_BASE_LEVEL} ทั้งที่เกมไปไกลกว่านั้น
        เว็บนี้จึงไม่ต่อเส้นโค้งเอาเอง เลเวลที่สูงกว่านี้จะขึ้นว่าไม่มีข้อมูล ไม่ใช่เดาให้
      </div>

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
