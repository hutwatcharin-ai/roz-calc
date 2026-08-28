// components/MonsterBestWeaponPanel.tsx
//
// The element panel and the size panel each answer half of "what should I hit
// this with", and a reader who takes either at face value gets it wrong: a
// Book's 50% against Large is not fatal if the element is right, and a 200%
// element is only average once a 50% weapon has halved it.
//
// So this multiplies them for one monster. Server-rendered on purpose -- the
// answer is the same for every visitor, so there is nothing to wait for.

import Link from 'next/link';
import { ELEMENTS, type Element, type ElementLevel } from '@/lib/element-table';
import { SIZE_LABELS, parseSize } from '@/lib/size-table';
import { rankCombos } from '@/lib/damage-multiplier';

const SHOWN = 8;

function isElement(value: string | null): value is Element {
  return value !== null && (ELEMENTS as readonly string[]).includes(value);
}

function isElementLevel(value: number | null): value is ElementLevel {
  return value === 1 || value === 2 || value === 3 || value === 4;
}

function pct(value: number): string {
  return Number.isInteger(value) ? `${value}%` : `${value.toFixed(1)}%`;
}

export default function MonsterBestWeaponPanel({
  element,
  elementLevel,
  size,
}: {
  element: string | null;
  elementLevel: number | null;
  size: string | null;
}) {
  const parsedSize = parseSize(size);

  // All three are needed to multiply anything. Missing one shows nothing rather
  // than an answer computed against a default nobody chose.
  if (!isElement(element) || !isElementLevel(elementLevel) || parsedSize === null) return null;

  const ranked = rankCombos(element, elementLevel, parsedSize);
  const best = ranked.slice(0, SHOWN);
  const worst = ranked[ranked.length - 1];
  const top = ranked[0];

  return (
    <div className="card">
      <h2 className="section-title">ตีตัวนี้ด้วยอะไรดี</h2>
      <p className="muted" style={{ marginBottom: 10 }}>
        ตัวคูณธาตุ × ตัวคูณขนาด รวมกันแล้ว — ตัวนี้ธาตุ {element}
        {elementLevel} ขนาด{SIZE_LABELS[parsedSize]}
      </p>

      <table className="stat-table">
        <thead>
          <tr>
            <th scope="col">อาวุธ + ธาตุ</th>
            <th scope="col">ธาตุ × ขนาด</th>
            <th scope="col">รวม</th>
          </tr>
        </thead>
        <tbody>
          {best.map((combo) => (
            <tr key={`${combo.weapon.weapon}-${combo.attack}`}>
              <th scope="row">
                {combo.weapon.weapon}
                <span className="muted" style={{ fontSize: 12 }}> ธาตุ {combo.attack}</span>
              </th>
              <td className="num muted">
                {combo.element}% × {combo.size}%
              </td>
              <td className="num">
                <strong>{pct(combo.total)}</strong>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {worst && worst.total < top.total && (
        <p className="muted" style={{ marginTop: 10 }}>
          แย่ที่สุดที่เลือกได้: {worst.weapon.weapon} ธาตุ {worst.attack} ได้ {pct(worst.total)} —
          ต่างจากดีที่สุด {pct(top.total)} อยู่{' '}
          {top.total > 0 ? `${Math.round(top.total - worst.total)} จุด` : 'ทั้งหมด'}
        </p>
      )}

      <p className="muted">
        เป็น<strong>ส่วนที่เข้าเป้า</strong> ไม่ใช่ดาเมจ — ATK, DEF, การ์ดและสกิลอยู่ระหว่างนี้กับเลขบนจอ ·
        ลองสลับอาวุธเองได้ที่ <Link href="/tools/damage">หน้าเทียบอาวุธ</Link>
      </p>
    </div>
  );
}
