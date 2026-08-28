// app/tools/exp/page.tsx
//
// The guide's EXP tables, plus the running total it does not print. Entirely
// server-rendered: this page is a reference table, and a reference table that
// needs JavaScript to show its numbers is a worse reference table.

import Link from 'next/link';
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
      <h1 style={{ fontFamily: '"Chakra Petch", sans-serif', fontSize: 32 }}>EXP ต่อเลเวล</h1>
      <p className="muted" style={{ marginTop: 8, maxWidth: '65ch' }}>
        ตัวเลขที่คู่มือให้คือ EXP ของแต่ละเลเวล คอลัมน์ &ldquo;รวมสะสม&rdquo; เว็บนี้บวกให้เอง —
        เป็นตัวเลขที่บอกว่าจากเลเวล 1 ถึงเลเวลนั้นต้องใช้ทั้งหมดเท่าไร
      </p>

      <div className="ceiling-note" style={{ marginTop: 16 }}>
        <strong>ที่มาของตัวเลข:</strong> คู่มือเกมทางการของ Ragnarok Zero (คู่มือผู้เชี่ยวชาญ &gt;
        เลเวลตัวละคร) · เส้นโค้งฐานขึ้นเกือบพอดี 1.2 เท่าทุกเลเวล เทสต์ในโค้ดตรวจอัตราส่วนนี้ทุกแถว
        อ่านเลขผิดตัวเดียวอัตราส่วนจะเพี้ยนและเทสต์บอกว่าเลเวลไหน
      </div>

      <div className="ceiling-note" style={{ marginTop: 12 }}>
        <strong>สองข้อที่ตารางนี้ยังตอบไม่ได้:</strong> คู่มือหยุดที่เลเวล{' '}
        {MAX_PUBLISHED_BASE_LEVEL} ทั้งที่เกมไปไกลกว่านั้น เว็บนี้จึงไม่ต่อเส้นโค้งเอาเอง ·
        และคู่มือไม่ได้บอกว่าเลขในแถวคือ EXP ที่ใช้ <em>เพื่อขึ้นมาถึง</em> เลเวลนั้น
        หรือ <em>เพื่อออกจาก</em> เลเวลนั้น เว็บนี้อ่านแบบแรกเพราะแถวเลเวล 1 เป็น 0
        (ซึ่งมีเหตุผลเฉพาะแบบแรก) ถ้าตัวละครเลเวล 2 ของคุณแถบ EXP เต็มที่ 3,000 ไม่ใช่ 2,500
        แปลว่าอ่านผิด ช่วยบอกด้วย
      </div>

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

      <div className="detail-cols" style={{ marginTop: 28 }}>
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

      <p className="muted" style={{ marginTop: 20 }}>
        ดูต่อ: <Link href="/tools/afk-finder">หาจุด AFK</Link> ·{' '}
        <Link href="/tools/refine">ตีบวก</Link>
      </p>
    </main>
  );
}
