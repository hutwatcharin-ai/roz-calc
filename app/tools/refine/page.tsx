// app/tools/refine/page.tsx
//
// The calculator is a client component, but every table on this page is
// rendered on the server: the numbers are the reason to visit, and a visitor
// who arrives from search should see them without waiting for JavaScript.

import { Fragment } from 'react';
import PageHeader from '@/components/PageHeader';
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
  title: 'อัตราตีบวก Ragnarok Zero',
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
      <PageHeader
        title="อัตราตีบวก Ragnarok Zero"
        lead={
          <>
            ตีพังของหาย ต้องเริ่มใหม่ที่ +0 — ตัวเลขที่ต้องรู้จริงคือ <strong>ต้องเตรียมของกี่ชิ้น</strong>
          </>
        }
        source={
          <>
            <strong>ที่มา:</strong> คู่มือเกมทางการ (คู่มือผู้เชี่ยวชาญ &gt; การตีบวก) ·
            ตารางโอกาสเทียบกับ rozerodb ที่ถอดหน้าเดียวกันแยกกันมา <strong>ตรงกันครบ 200 ช่อง</strong>
          </>
        }
      />

      <RefineCalculator />

      <details className="disclose">
        <summary>
          ตารางโอกาสสำเร็จทุกขั้น
          <span className="disclose__count">20 ขั้น × 5 ชนิดของ</span>
        </summary>
        <div className="disclose__body">
      <p className="muted" style={{ maxWidth: '65ch' }}>
        คอลัมน์ &ldquo;เข้มข้น&rdquo; คือแร่ Concentrated · อาวุธเลเวล 1 กับ 2
        คู่มือให้แร่มาชนิดเดียว แต่ยังพิมพ์ตัวเลขคอลัมน์นี้ไว้
      </p>
      <p className="tablescroll__hint">เลื่อนตารางซ้ายขวาได้ · ชื่อแถวจะค้างไว้ให้</p>
      <div className="card tablescroll" style={{ marginTop: 12 }}>
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

        </div>
      </details>

      <details className="disclose">
        <summary>
          ตีบวกแล้วได้ ATK / DEF เท่าไร
          <span className="disclose__count">20 ขั้น</span>
        </summary>
        <div className="disclose__body">
      <p className="muted" style={{ maxWidth: '65ch' }}>
        อาวุธได้ ATK/MATK สองส่วน: ส่วนหลักขึ้นทุกขั้น + ส่วนพิเศษเมื่อถึงขั้นสูง (อาวุธเลเวลสูงได้เร็วและมากกว่า) ·
        เกราะได้ DEF = ขั้น²
      </p>
      <p className="tablescroll__hint">เลื่อนตารางซ้ายขวาได้ · ชื่อแถวจะค้างไว้ให้</p>
      <div className="card tablescroll" style={{ marginTop: 12 }}>
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

        </div>
      </details>

      <details className="disclose">
        <summary>
          แร่และค่าธรรมเนียม
          <span className="disclose__count">5 ชนิดของ</span>
        </summary>
        <div className="disclose__body">
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

        </div>
      </details>

      <p className="ceiling-note" style={{ marginTop: 16 }}>
        <strong>แร่ HD ไม่ได้อยู่ในหน้านี้:</strong> ตีพังแล้วขั้นตีบวกลด 1 แทนที่จะทำของหาย
        และ<strong>ใช้ได้เฉพาะของที่อยู่ที่ +7 ถึง +9 เท่านั้น</strong> ซึ่งเป็นการคิดคนละแบบกับตารางข้างบนทั้งหมด
        · ราคาแลก HD ที่ NPC คือ 20,000 Zeny
      </p>

      <p className="muted" style={{ marginTop: 16 }}>
        ดูต่อ: <Link href="/tools/elements">ตารางธาตุ</Link> ·{' '}
        <Link href="/tools/sizes">ตารางขนาด</Link>
      </p>
    </main>
  );
}
