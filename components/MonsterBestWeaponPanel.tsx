// components/MonsterBestWeaponPanel.tsx
//
// The conclusion the other two panels stop just short of.
//
// MonsterElementPanel ranks the elements and MonsterSizePanel ranks the weapon
// types, and a reader who takes either at face value gets it wrong, because the
// two multiply: a Book's 50% against Large is not fatal if the element is
// right, and a 200% element is only average once a 50% weapon has halved it.
//
// Deliberately not a third table -- those two already list every row. This is
// three lines: which element, which weapon types keep all of it, and what the
// worst choice costs. Server rendered, since the answer is the same for every
// visitor.

import Link from 'next/link';
import { ELEMENTS, type Element, type ElementLevel } from '@/lib/element-table';
import { SIZE_LABELS, parseSize } from '@/lib/size-table';
import { bestElements, rankWeapons } from '@/lib/damage-multiplier';

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

  // The element is picked first: the size multiplier scales every element by the
  // same amount, so it cannot change which element is best.
  const elements = bestElements(element, elementLevel);
  const ranked = rankWeapons(elements[0], element, elementLevel, parsedSize);
  const top = ranked[0];
  const worst = ranked[ranked.length - 1];

  // Several weapon types usually share the best size multiplier, and naming one
  // would send a player shopping past the ones already in their bag.
  const full = ranked.filter((combo) => combo.total === top.total);
  const worstGroup = ranked.filter((combo) => combo.total === worst.total);

  return (
    <div className="card">
      <h2 className="section-title">สรุป: ตีตัวนี้ด้วยอะไรดี</h2>
      <p className="muted" style={{ marginBottom: 12 }}>
        ธาตุ {element}
        {elementLevel} ขนาด{SIZE_LABELS[parsedSize]} · ตัวคูณสองตัวนี้<strong>คูณกัน</strong>{' '}
        คนที่ดูทีละตารางจึงตอบผิดได้ทั้งสองทาง
      </p>

      <table className="stat-table">
        <tbody>
          <tr>
            <td>
              ธาตุอาวุธที่ควรใช้
              {elements.length > 1 && (
                <span className="muted" style={{ display: 'block', fontSize: 12 }}>
                  {elements.length} ธาตุนี้เท่ากันหมด ใช้ตัวที่หาได้ก่อน
                </span>
              )}
            </td>
            <td className="num">
              <strong>{elements.join(' / ')}</strong>
              <span className="muted" style={{ display: 'block', fontSize: 12 }}>
                {pct(top.element)}
              </span>
            </td>
          </tr>

          <tr>
            <td>
              ชนิดอาวุธที่ไม่โดนขนาดหัก
              <span className="muted" style={{ display: 'block', fontSize: 12 }}>
                {full.map((c) => c.weapon.weapon).join(', ')}
              </span>
            </td>
            <td className="num">
              <strong>{pct(top.total)}</strong>
              <span className="muted" style={{ display: 'block', fontSize: 12 }}>
                {top.element}% × {top.size}%
              </span>
            </td>
          </tr>

          {worst.total < top.total && (
            <tr>
              <td>
                ถ้าใช้ชนิดที่หักหนักสุด
                <span className="muted" style={{ display: 'block', fontSize: 12 }}>
                  {worstGroup.map((c) => c.weapon.weapon).join(', ')} — ธาตุเดียวกันแท้ ๆ
                </span>
              </td>
              <td className="num">
                {pct(worst.total)}
                <span className="muted" style={{ display: 'block', fontSize: 12 }}>
                  หายไป {Math.round(((top.total - worst.total) / top.total) * 100)}% เพราะขนาดล้วน ๆ
                </span>
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <p className="muted" style={{ marginTop: 10 }}>
        เป็น<strong>ส่วนที่เข้าเป้า</strong> ไม่ใช่ดาเมจ — ATK, DEF, การ์ดและสกิลอยู่ระหว่างนี้กับเลขบนจอ ·
        ลองสลับเองได้ที่ <Link href="/tools/damage">หน้าเทียบอาวุธ</Link>
      </p>
    </div>
  );
}
