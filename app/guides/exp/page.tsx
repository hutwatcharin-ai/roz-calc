// app/guides/exp/page.tsx
//
// The guide's EXP tables, plus the running total it does not print. Entirely
// server-rendered: this page is a reference table, and a reference table that
// needs JavaScript to show its numbers is a worse reference table.

import Caveat from '@/components/Caveat';
import Link from 'next/link';
import ExpRangeCalculator from '@/components/ExpRangeCalculator';
import { PARTY_EXP } from '@/lib/party-exp';
import { BASE_LEVEL_CAP, BASE_LEVEL_CAP_SINCE } from '@/lib/level-cap';
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

      {/* The gap between the cap and the published table is the first thing a
          reader needs, not a footnote: they will hit level 50 and find the
          page silent about the ten levels above it. */}
      <p className="filterstate" style={{ marginTop: 12 }}>
        <strong>
          เพดานเลเวลตอนนี้คือ {BASE_LEVEL_CAP} (ตั้งแต่ {BASE_LEVEL_CAP_SINCE}) แต่ตารางที่เผยแพร่มีถึงเลเวล{' '}
          {MAX_PUBLISHED_BASE_LEVEL}
        </strong>{' '}
        — เลเวล {MAX_PUBLISHED_BASE_LEVEL + 1}-{BASE_LEVEL_CAP} ยังไม่มีใครลงตัวเลขไว้ ที่นี่จึงไม่เดาให้
      </p>

      <Caveat label="วิธีอ่านตาราง">
        แถว N = EXP ที่ต้องเก็บเพื่อขึ้นถึงเลเวล N — แถบรีเซ็ตทุกครั้งที่ขึ้นเลเวล
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

      {/* Put after the tables on purpose: this is the one number on the page
          that changes a decision rather than answering "how much left". */}
      <h2 className="section-title" style={{ marginTop: 28 }}>
        เข้าปาร์ตี้แล้ว EXP เป็นยังไง
      </h2>
      <p className="muted" style={{ marginTop: 6, marginBottom: 12, maxWidth: '68ch' }}>
        ปาร์ตี้ได้ EXP รวมมากกว่า แต่ต้องหารกัน — <strong>ต่อหัวน้อยลงตั้งแต่คนที่สอง</strong>{' '}
        สิ่งที่ซื้อคือความเร็ว ไม่ใช่ EXP ต่อหัว
      </p>
      <div className="card" style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">คนในปาร์ตี้</th>
              <th scope="col">EXP รวมทั้งปาร์ตี้</th>
              <th scope="col">ต่อหัว</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">1 (คนเดียว)</th>
              <td className="num">100%</td>
              <td className="num">100%</td>
            </tr>
            {PARTY_EXP.map((row) => (
              <tr key={row.members}>
                <th scope="row">{row.members}</th>
                <td className="num">{row.total}%</td>
                <td className="num">{row.each}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="source-note" style={{ marginTop: 10 }}>
        <strong>ที่มา:</strong> roz-global.info (8 ก.ย. 2026) <strong>แหล่งเดียว</strong> —
        คอลัมน์รวม 130-132% ตั้งแต่ 4 คนขึ้นไปคือผลของการปัดเศษต่อหัว ไม่ใช่กติกาที่แกว่ง
      </p>

      <p className="muted" style={{ marginTop: 20 }}>
        ดูต่อ: <Link href="/tools/leveling-spots?mode=afk">หาจุด AFK</Link> ·{' '}
        <Link href="/tools/refine">ตีบวก</Link>
      </p>
    </main>
  );
}
