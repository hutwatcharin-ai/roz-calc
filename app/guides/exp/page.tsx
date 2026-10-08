// app/guides/exp/page.tsx
//
// The guide's EXP tables, plus the running total it does not print. Entirely
// server-rendered: this page is a reference table, and a reference table that
// needs JavaScript to show its numbers is a worse reference table.

import Caveat from '@/components/Caveat';
import PageHeader from '@/components/PageHeader';
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
const BASE_MAX = Math.max(...BASE_EXP_ROWS);

/** The base curve as bars (owner, 8 Oct 2026: graphics on every guide). */
function ExpCurve() {
  const w = 600, h = 160, n = BASE_EXP_ROWS.length, bw = w / n;
  const half = BASE_TOTALS[n - 1] / 2;
  const halfAt = BASE_TOTALS.findIndex((t) => t >= half) + 1;
  return (
    <figure className="expcurve">
      <svg viewBox={`0 0 ${w} ${h + 18}`} role="img" aria-label={`EXP ต่อเลเวล 1 ถึง ${n} เพิ่มขึ้นเรื่อยๆ เลเวลท้ายใช้มากที่สุด`}>
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1={0} x2={w} y1={h - h * f} y2={h - h * f} className="expcurve__grid" />
        ))}
        {BASE_EXP_ROWS.map((v, i) => {
          const bh = Math.max(1, (v / BASE_MAX) * h);
          return <rect key={i} x={i * bw + 1} y={h - bh} width={bw - 2} height={bh} rx={1.5} className={i + 1 >= halfAt ? 'is-late' : undefined} />;
        })}
        {[1, 10, 20, 30, 40, n].map((l) => (
          <text key={l} x={(l - 0.5) * bw} y={h + 14} textAnchor="middle">{l}</text>
        ))}
      </svg>
      <figcaption>
        แท่งสีชมพู = เลเวล {halfAt}-{n} ใช้ EXP <strong>ครึ่งหนึ่งของทั้งหมด</strong> ตั้งแต่เลเวล 1 ถึง {n}
      </figcaption>
    </figure>
  );
}

export default function ExpPage() {
  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <PageHeader
        title="ตาราง EXP ต่อเลเวล Ragnarok Zero"
        lead="EXP ที่ต้องใช้ต่อเลเวล พร้อมคอลัมน์รวมสะสมตั้งแต่เลเวล 1"
        source={<><strong>ที่มา:</strong> คู่มือเกมทางการ · เส้นโค้งฐานขึ้นราว 1.2 เท่าต่อเลเวล</>}
      />

      <div className="gtiles">
        <div className="gtile">
          <span className="gtile__k">เพดานเลเวลตอนนี้</span>
          <span className="gtile__v">{BASE_LEVEL_CAP}</span>
          <span className="gtile__s">ตั้งแต่ {BASE_LEVEL_CAP_SINCE}</span>
        </div>
        <div className="gtile">
          <span className="gtile__k">EXP รวม 1 ถึง {MAX_PUBLISHED_BASE_LEVEL}</span>
          <span className="gtile__v">{num(BASE_TOTALS[BASE_TOTALS.length - 1])}</span>
          <span className="gtile__s">ตามตารางที่เผยแพร่</span>
        </div>
        <div className="gtile">
          <span className="gtile__k">เลเวลที่ใช้ EXP มากสุด</span>
          <span className="gtile__v">{num(BASE_MAX)}</span>
          <span className="gtile__s">เลเวล {BASE_EXP_ROWS.indexOf(BASE_MAX) + 1}</span>
        </div>
      </div>

      <section className="card" style={{ marginTop: 14 }}>
        <h2 className="section-title">เส้นโค้ง EXP เลเวลฐาน</h2>
        <ExpCurve />
      </section>

      {/* The gap between the cap and the published table is the first thing a
          reader needs, not a footnote: they will hit level 50 and find the
          page silent about the ten levels above it. */}
      <p className="filterstate" style={{ marginTop: 12 }}>
        <strong>
          เพดานเลเวลตอนนี้คือ {BASE_LEVEL_CAP} (ตั้งแต่ {BASE_LEVEL_CAP_SINCE}) แต่ตารางที่เผยแพร่มีถึงเลเวล{' '}
          {MAX_PUBLISHED_BASE_LEVEL}
        </strong>{' '}
        ส่วนเลเวล {MAX_PUBLISHED_BASE_LEVEL + 1}-{BASE_LEVEL_CAP} ยังไม่มีใครลงตัวเลขไว้ ที่นี่จึงไม่เดาให้
      </p>

      <Caveat label="วิธีอ่านตาราง">
        แถว N = EXP ที่ต้องเก็บเพื่อขึ้นถึงเลเวล N แถบรีเซ็ตทุกครั้งที่ขึ้นเลเวล
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
                <td className="num expbar" style={{ '--w': `${(exp / BASE_MAX) * 100}%` } as React.CSSProperties}>{num(exp)}</td>
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
          <h2 className="section-title">Job EXP อาชีพขั้นที่ 1</h2>
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
        ปาร์ตี้ได้ EXP รวมมากกว่า แต่ต้องหารกัน <strong>ต่อหัวน้อยลงตั้งแต่คนที่สอง</strong>{' '}
        สิ่งที่ซื้อคือความเร็ว ไม่ใช่ EXP ต่อหัว
      </p>
      <div className="partyexp" aria-hidden="true">
        {[{ members: 1, total: 100, each: 100 }, ...PARTY_EXP].map((row) => (
          <div key={row.members} className="partyexp__col">
            <span className="partyexp__bars">
              <span className="partyexp__total" style={{ height: `${(row.total / 140) * 100}%` }} />
              <span className="partyexp__each" style={{ height: `${(row.each / 140) * 100}%` }} />
            </span>
            <small>{row.members} คน</small>
          </div>
        ))}
        <p className="partyexp__key"><i className="is-total" /> รวมทั้งปาร์ตี้ <i className="is-each" /> ต่อหัว</p>
      </div>
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
