// app/tools/refine/page.tsx
//
// The calculator is a client component, but every table on this page is
// rendered on the server: the numbers are the reason to visit, and a visitor
// who arrives from search should see them without waiting for JavaScript.

import { Fragment } from 'react';
import Link from 'next/link';
import RefineCalculator from '@/components/RefineCalculator';
import {
  ARMOUR_DEF,
  GEAR_LABELS,
  GEAR_TYPES,
  MAX_REFINE,
  ORE,
  REFINE_CHANCE,
  WEAPON_ATK,
  WEAPON_ATK_BONUS,
  type WeaponType,
} from '@/lib/refine-table';

export const metadata = {
  title: 'ตีบวก — โอกาสสำเร็จและค่าใช้จ่ายจริง',
  description:
    'ตารางโอกาสตีบวกทุกขั้นของ Ragnarok Zero Global จากคู่มือเกมทางการ พร้อมคำนวณว่ากว่าจะถึง +7 +10 ต้องเตรียมของกี่ชิ้น แร่กี่ก้อน เสีย Zeny เท่าไร',
};

const LEVELS = Array.from({ length: MAX_REFINE }, (_, i) => i + 1);
const WEAPONS: WeaponType[] = ['weapon1', 'weapon2', 'weapon3', 'weapon4'];

function band(chance: number): string {
  if (chance >= 90) return 'el--strong';
  if (chance >= 50) return 'el--flat';
  if (chance >= 20) return 'el--weak';
  return 'el--immune';
}

export default function RefinePage() {
  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <h1 style={{ fontFamily: '"Chakra Petch", sans-serif', fontSize: 32 }}>ตีบวก</h1>
      <p className="muted" style={{ marginTop: 8, maxWidth: '65ch' }}>
        &ldquo;+7 โอกาส 50%&rdquo; ฟังดูเหมือนตีสองครั้งก็ได้ แต่ตีพังของหาย ต้องเริ่มใหม่ที่ +0
        ด้วยของชิ้นใหม่ ตัวเลขที่ต้องรู้จริง ๆ คือ <strong>ต้องเตรียมของกี่ชิ้น</strong> ไม่ใช่โอกาสต่อครั้ง
      </p>

      <div className="ceiling-note" style={{ marginTop: 16 }}>
        <strong>ที่มาของตัวเลข:</strong> คู่มือเกมทางการของ Ragnarok Zero (คู่มือผู้เชี่ยวชาญ &gt; การตีบวก)
        · ตาราง ATK และ DEF ตรวจแล้วว่าเป็นสูตรเลขล้วน เทสต์ในโค้ดคำนวณใหม่ทั้งตารางแล้วเทียบทีละช่อง
        · ส่วนตารางโอกาสไม่มีสูตรรองรับ ถ้าเจอค่าที่ไม่ตรงกับในเกมช่วยบอกด้วย
      </div>

      <div className="ceiling-note" style={{ marginTop: 12 }}>
        <strong>สิ่งที่เว็บนี้ยังตอบไม่ได้:</strong> ตีหนึ่งครั้ง<strong>กินแร่กี่ก้อน</strong> —
        ตารางวัตถุดิบของคู่มือไม่มีคอลัมน์จำนวน เว็บนี้จึงบอกได้แค่ว่า<strong>ตีทั้งหมดกี่ครั้ง</strong>
        แล้วปล่อยให้คูณเอง · ไม่เหมาว่า &ldquo;RO ภาคอื่นกินก้อนเดียว Zero ก็คงเหมือนกัน&rdquo;
        เพราะ Zero แก้กลไกตีบวกไปแล้วอย่างน้อยหนึ่งอย่าง (แยกตารางโอกาสตามระดับของ ซึ่งภาคอื่นไม่มี)
        · <strong>ค่าธรรมเนียมไม่กระทบ</strong> เพราะคิดต่อครั้ง ไม่ใช่ต่อก้อน
      </div>

      <RefineCalculator />

      <h2 className="section-title" style={{ marginTop: 28 }}>
        โอกาสสำเร็จทุกขั้น
      </h2>
      <p className="muted" style={{ maxWidth: '65ch' }}>
        คอลัมน์ &ldquo;เข้มข้น&rdquo; คือแร่ Concentrated · อาวุธเลเวล 1 กับ 2
        คู่มือให้แร่มาชนิดเดียว แต่ยังพิมพ์ตัวเลขคอลัมน์นี้ไว้
      </p>
      <div className="card" style={{ marginTop: 12, overflowX: 'auto' }}>
        <table className="eltable">
          <thead>
            <tr>
              <th scope="col" rowSpan={2}>
                ขั้น
              </th>
              {GEAR_TYPES.map((gear) => (
                <th key={gear} scope="col" colSpan={2}>
                  {GEAR_LABELS[gear]}
                </th>
              ))}
            </tr>
            <tr>
              {GEAR_TYPES.map((gear) => (
                <Fragment key={gear}>
                  <th scope="col">ธรรมดา</th>
                  <th scope="col">เข้มข้น</th>
                </Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {LEVELS.map((level) => (
              <tr key={level}>
                <th scope="row">+{level}</th>
                {GEAR_TYPES.map((gear) => {
                  const row = REFINE_CHANCE[gear][level - 1];
                  return (
                    <Fragment key={gear}>
                      <td className={`el ${band(row.normal)}`}>{row.normal}%</td>
                      <td className={`el ${band(row.special)}`}>{row.special}%</td>
                    </Fragment>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="section-title" style={{ marginTop: 28 }}>
        ตีบวกแล้วได้อะไร
      </h2>
      <p className="muted" style={{ maxWidth: '65ch' }}>
        อาวุธได้ ATK/MATK สองก้อน: ก้อนหลักที่ขึ้นทุกขั้น กับก้อนพิเศษที่เริ่มให้เมื่อถึงขั้นสูงพอ
        อาวุธเลเวลสูงเริ่มได้ก้อนพิเศษเร็วกว่าและได้มากกว่า · เกราะได้ DEF เท่ากับขั้นยกกำลังสอง
      </p>
      <div className="card" style={{ marginTop: 12, overflowX: 'auto' }}>
        <table className="eltable">
          <thead>
            <tr>
              <th scope="col">ขั้น</th>
              {WEAPONS.map((weapon) => (
                <th key={weapon} scope="col">
                  {GEAR_LABELS[weapon]}
                </th>
              ))}
              <th scope="col">เกราะ (DEF)</th>
            </tr>
          </thead>
          <tbody>
            {LEVELS.map((level) => (
              <tr key={level}>
                <th scope="row">+{level}</th>
                {WEAPONS.map((weapon) => {
                  const base = WEAPON_ATK[weapon][level - 1];
                  const bonus = WEAPON_ATK_BONUS[weapon][level - 1];
                  return (
                    <td key={weapon} className="num">
                      {base + bonus}
                      {bonus > 0 && (
                        <span className="muted" style={{ fontSize: 12 }}>
                          {' '}
                          ({base}+{bonus})
                        </span>
                      )}
                    </td>
                  );
                })}
                <td className="num">{ARMOUR_DEF[level - 1]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="section-title" style={{ marginTop: 28 }}>
        แร่และค่าธรรมเนียม
      </h2>
      <div className="card" style={{ marginTop: 12, overflowX: 'auto' }}>
        <table className="stat-table">
          <thead>
            <tr>
              <th scope="col">อุปกรณ์</th>
              <th scope="col">แร่</th>
              <th scope="col">ราคาแร่ที่ NPC</th>
              <th scope="col">ค่าตีบวกต่อครั้ง</th>
            </tr>
          </thead>
          <tbody>
            {GEAR_TYPES.map((gear) => {
              const { normal, special } = ORE[gear];
              return (
                <tr key={gear}>
                  <th scope="row">{GEAR_LABELS[gear]}</th>
                  <td>
                    {normal.ore}
                    {special && (
                      <span className="muted" style={{ display: 'block', fontSize: 12 }}>
                        {special.ore}
                      </span>
                    )}
                  </td>
                  <td className="num">
                    {normal.oreZeny === null ? (
                      <span className="muted">ดรอปจากมอนสเตอร์</span>
                    ) : (
                      `${normal.oreZeny.toLocaleString('en-US')} Zeny`
                    )}
                  </td>
                  <td className="num">{normal.feeZeny.toLocaleString('en-US')} Zeny</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="ceiling-note" style={{ marginTop: 16 }}>
        <strong>แร่ HD ไม่ได้อยู่ในหน้านี้:</strong> คู่มือบอกว่าแร่ HD
        ตีพังแล้วขั้นตีบวกลด 1 แทนที่จะทำของหาย (ตั้งแต่ +7 ขึ้นไป) ซึ่งเป็นการคิดคนละแบบกับตารางข้างบนทั้งหมด
        · ราคาแลก HD ที่ NPC คือ 20,000 Zeny
      </p>

      <p className="muted" style={{ marginTop: 16 }}>
        ดูต่อ: <Link href="/tools/elements">ตารางธาตุ</Link> ·{' '}
        <Link href="/tools/sizes">ตารางขนาด</Link>
      </p>
    </main>
  );
}
