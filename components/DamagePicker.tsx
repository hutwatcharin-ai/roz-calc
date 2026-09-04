'use client';

// "Will my weapon actually hurt this thing?" -- both official tables at once.
//
// The element table and the size table have been on the site separately for a
// while, which left the reader doing the multiplication that decides the
// answer. This does it, and keeps both parts visible so the reason is legible
// rather than a single number to trust.

import Caveat from '@/components/Caveat';
import { useMemo, useState } from 'react';
import { useToolUse } from '@/lib/use-tool-use';
import { ELEMENTS, type Element, type ElementLevel } from '@/lib/element-table';
import { SIZE_LABELS, SIZE_TABLE, SIZES, type MonsterSize } from '@/lib/size-table';
import { comboFor, rankCombos, rankElements, shareOfBest } from '@/lib/damage-multiplier';

const LEVELS: ElementLevel[] = [1, 2, 3, 4];

function pct(value: number): string {
  return Number.isInteger(value) ? `${value}%` : `${value.toFixed(1)}%`;
}

function band(total: number): string {
  if (total <= 0) return 'el--immune';
  if (total < 75) return 'el--weak';
  if (total <= 100) return 'el--flat';
  return 'el--strong';
}

export default function DamagePicker({
  defence: initialDefence = 'Undead',
  defenceLevel: initialLevel = 1,
  size: initialSize = 'large',
  compact = false,
}: {
  defence?: Element;
  defenceLevel?: ElementLevel;
  size?: MonsterSize;
  compact?: boolean;
}) {
  const [defence, setDefence] = useState<Element>(initialDefence);
  const [level, setLevel] = useState<ElementLevel>(initialLevel);
  const [size, setSize] = useState<MonsterSize>(initialSize);
  const [weaponName, setWeaponName] = useState(SIZE_TABLE[1].weapon);
  const [attack, setAttack] = useState<Element>('Neutral');
  useToolUse('damage_picker', { defence, level, size, weapon: weaponName, attack, compact });

  const weapon = SIZE_TABLE.find((row) => row.weapon === weaponName) ?? SIZE_TABLE[0];

  const elements = useMemo(() => rankElements(defence, level), [defence, level]);
  const ranked = useMemo(() => rankCombos(defence, level, size), [defence, level, size]);
  const best = ranked[0];
  const mine = comboFor(weapon, attack, defence, level, size);
  const share = shareOfBest(mine, best?.total ?? 0);

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <h2 className="section-title">
        {compact ? 'ตีตัวนี้ด้วยอะไรดี' : 'อาวุธที่ถืออยู่ ตีเป้าหมายนี้ได้กี่เปอร์เซ็นต์'}
      </h2>

      <form className="controlrow" onSubmit={(e) => e.preventDefault()}>
        {!compact && (
          <>
            <label>
              ธาตุของเป้าหมาย
              <select value={defence} onChange={(e) => setDefence(e.target.value as Element)}>
                {ELEMENTS.map((el) => (
                  <option key={el} value={el}>
                    {el}
                  </option>
                ))}
              </select>
            </label>
            <label>
              ระดับธาตุ
              <select value={level} onChange={(e) => setLevel(Number(e.target.value) as ElementLevel)}>
                {LEVELS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <label>
              ขนาด
              <select value={size} onChange={(e) => setSize(e.target.value as MonsterSize)}>
                {SIZES.map((s) => (
                  <option key={s} value={s}>
                    {SIZE_LABELS[s]}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}

        <label>
          อาวุธที่ถือ
          <select value={weaponName} onChange={(e) => setWeaponName(e.target.value)}>
            {SIZE_TABLE.map((row) => (
              <option key={row.weapon} value={row.weapon}>
                {row.weapon} ({row.label})
              </option>
            ))}
          </select>
        </label>

        <label>
          ธาตุอาวุธ
          <select value={attack} onChange={(e) => setAttack(e.target.value as Element)}>
            {ELEMENTS.map((el) => (
              <option key={el} value={el}>
                {el}
              </option>
            ))}
          </select>
        </label>
      </form>

      <table className="stat-table" style={{ marginTop: 12 }}>
        <tbody>
          <tr>
            <td>ตัวคูณธาตุ</td>
            <td className="num">{pct(mine.element)}</td>
          </tr>
          <tr>
            <td>
              ตัวคูณขนาด
              <span className="muted" style={{ display: 'block', fontSize: 12 }}>
                {weapon.weapon} ตีเป้าหมายขนาด{SIZE_LABELS[size]}
              </span>
            </td>
            <td className="num">{pct(mine.size)}</td>
          </tr>
          <tr>
            <td>
              <strong>คูณกันแล้ว</strong>
              <span className="muted" style={{ display: 'block', fontSize: 12 }}>
                {mine.element} × {mine.size} ÷ 100 — คูณกัน ไม่ใช่บวกกัน
              </span>
            </td>
            <td className={`num el ${band(mine.total)}`}>
              <strong>{pct(mine.total)}</strong>
            </td>
          </tr>
          {best && (
            <tr>
              <td>
                ดีที่สุดที่เป็นไปได้กับเป้าหมายนี้
                <span className="muted" style={{ display: 'block', fontSize: 12 }}>
                  {best.weapon.weapon} ธาตุ {best.attack}
                </span>
              </td>
              <td className="num">
                {pct(best.total)}
                {share !== null && (
                  <span className="muted" style={{ display: 'block', fontSize: 12 }}>
                    ของคุณได้ {share.toFixed(0)}% ของนั้น
                  </span>
                )}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <h3 className="section-title" style={{ marginTop: 18, fontSize: 16 }}>
        ธาตุอาวุธไหนเข้าเป้าหมายนี้ดีที่สุด
      </h3>
      <p className="muted">
        ลำดับนี้ไม่ขึ้นกับชนิดอาวุธ เพราะตัวคูณขนาดคูณทุกธาตุเท่ากัน จึงสลับอันดับไม่ได้
      </p>
      <table className="stat-table">
        <tbody>
          {elements.map((row) => (
            <tr key={row.attack}>
              <th scope="row">
                {row.attack}
                {row.attack === attack && (
                  <span className="muted" style={{ fontSize: 12 }}> ← ที่ถืออยู่</span>
                )}
              </th>
              <td className={`num el ${band(row.element)}`}>{pct(row.element)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <Caveat label="ตัวเลขนี้คืออะไร">
        ตัวเลขนี้คือ<strong>เปอร์เซ็นต์ที่เข้าเป้า</strong> (ธาตุ×ขนาด จากคู่มือทางการ) —
        ไม่ใช่ดาเมจจริง เพราะยังไม่รวม ATK/DEF/การ์ด/สกิล
      </Caveat>
    </div>
  );
}
