// app/guides/exp/page.tsx
//
// The guide's EXP tables, plus the running total it does not print. Entirely
// server-rendered except the calculator: this page is a reference table, and
// a reference table that needs JavaScript to show its numbers is a worse one.
//
// Redesigned 15 Oct 2026 (owner: "make it easier to read"). The page was
// seven phone screens: three long tables one under another with the
// calculator buried in the middle. Now the calculator leads, levels 1-70 sit
// in one table cut into bands of ten that open on tap (each band shows its
// own total, so most readers never need to open one), and the two Job EXP
// tables and the party numbers fold the same way. Levels 51-70 are the second
// source (roztoday): a pink mark on every such row and band, never mixed
// silently with the guide's.

import './page.css';
import Caveat from '@/components/Caveat';
import PageHeader from '@/components/PageHeader';
import Link from 'next/link';
import ExpRangeCalculator from '@/components/ExpRangeCalculator';
import { PARTY_EXP } from '@/lib/party-exp';
import { BASE_LEVEL_CAP, BASE_LEVEL_CAP_SINCE } from '@/lib/level-cap';
import {
  FIRST_JOB_EXP_ROWS,
  MAX_PUBLISHED_BASE_LEVEL,
  NOVICE_JOB_EXP_ROWS,
  baseRowsAllSources,
  type ExpRow,
} from '@/lib/exp-table';

export const metadata = {
  title: 'ตาราง EXP ต่อเลเวล Ragnarok Zero',
  description:
    'ตาราง EXP ต่อเลเวลของ Ragnarok Zero Global เลเวล 1-70 พร้อมยอดสะสม ตัวคำนวณ EXP จากเลเวลนี้ไปเลเวลนั้นและเวลาที่ใช้ Job EXP ของ Novice และอาชีพขั้นที่ 1 และ EXP ตอนเข้าปาร์ตี้',
};

function num(value: number): string {
  return value.toLocaleString('en-US');
}

const ROWS = baseRowsAllSources();
const CUMULATIVE = ROWS.reduce<number[]>((acc, r) => [...acc, (acc.at(-1) ?? 0) + r.exp], []);
const MAX_EXP = Math.max(...ROWS.map((r) => r.exp));
const GUIDE_TOTAL = CUMULATIVE[MAX_PUBLISHED_BASE_LEVEL - 1];
const SECOND_TOTAL = CUMULATIVE[CUMULATIVE.length - 1] - GUIDE_TOTAL;
// For the curve's caption: the last ten levels against everything before.
const EARLY = CUMULATIVE[59];
const LATE = CUMULATIVE[CUMULATIVE.length - 1] - EARLY;

/** Rows cut into bands of ten: 1-10, 11-20, ... */
function bands<T>(rows: T[], size = 10): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < rows.length; i += size) out.push(rows.slice(i, i + size));
  return out;
}

/** The base curve as bars, 1 to 70; the second source's bars are striped pink. */
function ExpCurve() {
  const w = 700, h = 170, n = ROWS.length, bw = w / n;
  return (
    <figure className="expcurve">
      <svg viewBox={`0 0 ${w} ${h + 18}`} role="img" aria-label={`EXP ต่อเลเวล 1 ถึง ${n} เพิ่มขึ้นเรื่อยๆ ราว 1.2 เท่าต่อเลเวล`}>
        <defs>
          <pattern id="exp-stripe" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="6" height="6" style={{ fill: 'var(--pink)', filter: 'none' }} />
            <rect width="3" height="6" style={{ fill: 'rgba(11, 7, 36, .45)', filter: 'none' }} />
          </pattern>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1={0} x2={w} y1={h - h * f} y2={h - h * f} className="expcurve__grid" />
        ))}
        {ROWS.map((r, i) => {
          const bh = Math.max(1, (r.exp / MAX_EXP) * h);
          return <rect key={r.level} x={i * bw + 1} y={h - bh} width={bw - 2} height={bh} rx={1.5} className={r.source === 'second' ? 'is-second' : undefined} />;
        })}
        {[1, 10, 20, 30, 40, 50, 60, 70].map((l) => (
          <text key={l} x={(l - 0.5) * bw} y={h + 14} textAnchor="middle">{l}</text>
        ))}
      </svg>
      <figcaption>
        <span className="expkey expkey--guide" /> คู่มือทางการ (1-{MAX_PUBLISHED_BASE_LEVEL}) ·{' '}
        <span className="expkey expkey--second" /> แหล่งรอง ยังไม่ยืนยัน ({MAX_PUBLISHED_BASE_LEVEL + 1}-{ROWS.length}) ·
        เลเวล 61-{ROWS.length} รวมกันใช้ EXP ราว {Math.round(LATE / EARLY)} เท่าของเลเวล 1-60
      </figcaption>
    </figure>
  );
}

function BaseBand({ rows }: { rows: ExpRow[] }) {
  const first = rows[0].level;
  const last = rows[rows.length - 1].level;
  const sum = rows.reduce((t, r) => t + r.exp, 0);
  const second = rows.some((r) => r.source === 'second');
  const bandMax = Math.max(...rows.map((r) => r.exp));
  return (
    <details className={'expband' + (second ? ' expband--second' : '')} id={`lv-${first}`}>
      <summary>
        <span className="expband__lv">เลเวล {first}-{last}</span>
        <span className="expband__sum">
          <small>รวมทั้งช่วง</small> {num(sum)}
        </span>
        {second && <span className="expband__tag">แหล่งรอง</span>}
      </summary>
      <table className="exprows">
        <thead>
          <tr>
            <th scope="col">ถึงเลเวล</th>
            <th scope="col">EXP แถบนี้</th>
            <th scope="col">สะสมจากเลเวล 1</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.level} className={r.source === 'second' ? 'is-second' : undefined}>
              <th scope="row">{r.level}</th>
              <td className="num exprows__bar" style={{ '--w': `${(r.exp / bandMax) * 100}%` } as React.CSSProperties}>
                {num(r.exp)}
              </td>
              <td className="num">{num(CUMULATIVE[r.level - 1])}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}

function JobBands({ rows, label }: { rows: number[]; label: string }) {
  return (
    <>
      {bands(rows.map((exp, i) => ({ level: i + 1, exp }))).map((b) => (
        <details key={b[0].level} className="expband expband--job">
          <summary>
            <span className="expband__lv">{label} Job {b[0].level}-{b[b.length - 1].level}</span>
            <span className="expband__sum">
              <small>รวม</small> {num(b.reduce((t, r) => t + r.exp, 0))}
            </span>
          </summary>
          <table className="exprows">
            <thead>
              <tr>
                <th scope="col">Job LV</th>
                <th scope="col">EXP</th>
              </tr>
            </thead>
            <tbody>
              {b.map((r) => (
                <tr key={r.level}>
                  <th scope="row">{r.level}</th>
                  <td className="num">{num(r.exp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      ))}
    </>
  );
}

export default function ExpPage() {
  return (
    <main className="shell exppage" style={{ paddingBlock: 32 }}>
      <PageHeader
        title="ตาราง EXP ต่อเลเวล Ragnarok Zero"
        lead="ใส่เลเวลตอนนี้กับเลเวลที่อยากได้ แล้วดูว่าต้องเก็บ EXP อีกเท่าไร"
        source={<><strong>ที่มา:</strong> คู่มือเกมทางการ (เลเวล 1-{MAX_PUBLISHED_BASE_LEVEL}) · roztoday (เลเวล {MAX_PUBLISHED_BASE_LEVEL + 1}-{BASE_LEVEL_CAP} ยังไม่ยืนยัน)</>}
      />

      <ExpRangeCalculator />

      <div className="gtiles" style={{ marginTop: 14 }}>
        <div className="gtile">
          <span className="gtile__k">เพดานเลเวลตอนนี้</span>
          <span className="gtile__v">{BASE_LEVEL_CAP}</span>
          <span className="gtile__s">ตั้งแต่ {BASE_LEVEL_CAP_SINCE}</span>
        </div>
        <div className="gtile">
          <span className="gtile__k">EXP รวม 1 → {MAX_PUBLISHED_BASE_LEVEL}</span>
          <span className="gtile__v">{num(GUIDE_TOTAL)}</span>
          <span className="gtile__s">คู่มือทางการ</span>
        </div>
        <div className="gtile gtile--second">
          <span className="gtile__k">EXP รวม {MAX_PUBLISHED_BASE_LEVEL} → {ROWS.length}</span>
          <span className="gtile__v">{num(SECOND_TOTAL)}</span>
          <span className="gtile__s">แหล่งรอง ยังไม่ยืนยัน</span>
        </div>
      </div>

      <nav className="expjump" aria-label="ไปที่ส่วน">
        <a href="#exp-table">ตาราง EXP</a>
        <a href="#exp-curve">กราฟ</a>
        <a href="#exp-job">Job EXP</a>
        <a href="#exp-party">ปาร์ตี้</a>
      </nav>

      <section id="exp-table" className="expsec">
        <h2 className="section-title">ตาราง EXP เลเวลฐาน 1-{ROWS.length}</h2>
        <p className="muted expsec__lead">กดช่วงเลเวลเพื่อดูทีละเลเวล · แถว N = EXP ที่ต้องเก็บเพื่อขึ้นถึงเลเวล N</p>
        <span id="exp-60-70" aria-hidden="true" />
        <div className="expbands">
          {bands(ROWS).map((b) => <BaseBand key={b[0].level} rows={b} />)}
        </div>
        <Caveat label="เลเวล 51-70 มาจากไหน">
          คู่มือทางการมีถึงเลเวล {MAX_PUBLISHED_BASE_LEVEL} · เลเวล {MAX_PUBLISHED_BASE_LEVEL + 1}-{BASE_LEVEL_CAP} มาจาก{' '}
          <a href="https://roztoday.com/th/tools/exp/" rel="nofollow noopener" target="_blank">roztoday</a> (เว็บแฟนเกม) ซึ่งแถว 2-50 ตรงกับคู่มือทุกแถว
          แต่ทุกแถวของเขาคือแถวก่อนหน้า ×1.2 พอดี จึงยังบอกไม่ได้ว่าเป็นค่าจากเกมหรือคำนวณต่อเอง · ถ้าเลเวล 69 แถบเต็มที่ 568,722,300 แปลว่าตรง
        </Caveat>
      </section>

      <section id="exp-curve" className="card expsec">
        <h2 className="section-title">กราฟ EXP ต่อเลเวล</h2>
        <ExpCurve />
      </section>

      <section id="exp-job" className="expsec">
        <h2 className="section-title">Job EXP</h2>
        <p className="muted expsec__lead">
          Novice ตันที่ Job {NOVICE_JOB_EXP_ROWS.length} · อาชีพขั้นที่ 1 (Swordman, Mage, Archer, Merchant, Thief, Acolyte) ตันที่ Job {FIRST_JOB_EXP_ROWS.length} ·
          อาชีพขั้นที่ 2 คู่มือยังไม่มีตาราง
        </p>
        <div className="expbands">
          <JobBands rows={NOVICE_JOB_EXP_ROWS} label="Novice" />
          <JobBands rows={FIRST_JOB_EXP_ROWS} label="อาชีพ 1" />
        </div>
      </section>

      {/* This is the one number on the page that changes a decision rather
          than answering "how much left". */}
      <section id="exp-party" className="expsec">
        <h2 className="section-title">เข้าปาร์ตี้แล้ว EXP เป็นยังไง</h2>
        <p className="muted expsec__lead">
          ปาร์ตี้ได้ EXP รวมมากกว่า แต่ต้องหารกัน <strong>ต่อหัวน้อยลงตั้งแต่คนที่สอง</strong> สิ่งที่ได้คือฆ่าเร็วขึ้น ไม่ใช่ EXP ต่อหัว
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
        <details className="expband expband--job">
          <summary>
            <span className="expband__lv">ตัวเลขทุกขนาดปาร์ตี้</span>
            <span className="expband__sum"><small>1-{PARTY_EXP.at(-1)?.members} คน</small></span>
          </summary>
          <table className="exprows">
            <thead>
              <tr>
                <th scope="col">คน</th>
                <th scope="col">EXP รวมทั้งปาร์ตี้</th>
                <th scope="col">ต่อหัว</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">1</th>
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
        </details>
        <p className="source-note" style={{ marginTop: 10 }}>
          <strong>ที่มา:</strong> roz-global.info (8 ก.ย. 2026) <strong>แหล่งเดียว</strong> —
          ยอดรวม 130-132% ตั้งแต่ 4 คนขึ้นไปคือผลของการปัดเศษต่อหัว ไม่ใช่กติกาที่แกว่ง
        </p>
      </section>

      <p className="muted" style={{ marginTop: 20 }}>
        ดูต่อ: <Link href="/tools/leveling-spots?mode=afk">หาจุด AFK</Link> ·{' '}
        <Link href="/tools/leveling-spots">ฟาร์มที่ไหนดี</Link>
      </p>
    </main>
  );
}
