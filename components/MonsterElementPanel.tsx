// components/MonsterElementPanel.tsx
//
// "What should I hit this thing with?" -- the element table read for one
// monster, which spec 3.5 asks the detail page to do rather than making a
// player cross-reference a grid by hand.

import Link from 'next/link';
import { ELEMENTS, elementModifier, type Element, type ElementLevel } from '@/lib/element-table';

function isElement(value: string | null): value is Element {
  return value !== null && (ELEMENTS as readonly string[]).includes(value);
}

function isElementLevel(value: number | null): value is ElementLevel {
  return value === 1 || value === 2 || value === 3 || value === 4;
}

export default function MonsterElementPanel({
  element,
  elementLevel,
}: {
  element: string | null;
  elementLevel: number | null;
}) {
  // Nothing is shown rather than a guessed level. 100% of monsters in the data
  // carry both fields today, but a future import that drops one must not make
  // this panel answer from a default.
  if (!isElement(element) || !isElementLevel(elementLevel)) return null;

  const ranked = ELEMENTS.map((attack) => ({
    attack,
    value: elementModifier(attack, element, elementLevel),
  })).sort((a, b) => b.value - a.value);

  const best = ranked.filter((r) => r.value > 100);
  const useless = ranked.filter((r) => r.value === 0);

  return (
    <div className="card">
      <h2 className="section-title">อาวุธธาตุไหนแรงกับตัวนี้</h2>
      <p className="muted" style={{ marginBottom: 10 }}>
        ตัวนี้เป็นธาตุ {element} ระดับ {elementLevel}
      </p>

      <table className="stat-table">
        <tbody>
          {ranked.map((row) => (
            <tr key={row.attack}>
              <td>{row.attack}</td>
              <td className="num" style={{ color: row.value > 100 ? 'var(--status-safe)' : row.value === 0 ? 'var(--status-danger)' : undefined }}>
                {row.value}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="muted" style={{ marginTop: 10 }}>
        {best.length > 0
          ? `แรงที่สุดคือธาตุ ${best.map((b) => b.attack).join(', ')}`
          : 'ไม่มีธาตุไหนแรงเป็นพิเศษกับตัวนี้'}
        {useless.length > 0 && ` · ธาตุ ${useless.map((u) => u.attack).join(', ')} ไม่เข้าเลย`}
      </p>

      <p className="muted">
        ตัวเลขมาจาก <Link href="/tools/elements">ตารางธาตุ</Link> ซึ่งถอดมาจากคู่มือเกมทางการของ Zero
      </p>
    </div>
  );
}
