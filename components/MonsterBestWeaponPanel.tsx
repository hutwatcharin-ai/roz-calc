// components/MonsterBestWeaponPanel.tsx
//
// Two lines: which element, and which weapon types lose damage to size.
// Rewritten 7 Sep 2026 after the user read the old version ("the wording is
// bizarre, and there is too much of it"): it listed every element that tied
// (nine, for a Neutral 3 monster), every weapon type in each group, and
// explained in prose that the two multipliers multiply. Now each line says
// the answer and stops; when nothing is interesting it says "any". The full
// tables stay under the <details> below this card. Server rendered.

import Link from 'next/link';
import { ELEMENTS, type Element, type ElementLevel } from '@/lib/element-table';
import { SIZE_LABELS, parseSize } from '@/lib/size-table';
import { elementAdvice, sizeGroups } from '@/lib/best-weapon-summary';

function isElement(value: string | null): value is Element {
  return value !== null && (ELEMENTS as readonly string[]).includes(value);
}

function isElementLevel(value: number | null): value is ElementLevel {
  return value === 1 || value === 2 || value === 3 || value === 4;
}

// "ดาบสองมือ, กริช, ขวาน และอีก 2" -- three names is what a player can hold
// in their head; the full list is one click down.
function few(labels: string[], max = 4): string {
  // "และอีก 1" is longer than the name it hides.
  if (labels.length <= max + 1) return labels.join(', ');
  return `${labels.slice(0, max).join(', ')} และอีก ${labels.length - max}`;
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
  // All three are needed to say anything. Missing one shows nothing rather
  // than an answer computed against a default nobody chose.
  if (!isElement(element) || !isElementLevel(elementLevel) || parsedSize === null) return null;

  const el = elementAdvice(element, elementLevel);
  const groups = sizeGroups(parsedSize);
  const full = groups.find((g) => g.pct === 100);
  const reduced = groups.filter((g) => g.pct < 100);
  // Most weapon types usually keep the full hit; name the exceptions. When
  // the exceptions are the majority, name the ones that keep it instead.
  const nameFull = full !== undefined && reduced.reduce((n, g) => n + g.labels.length, 0) > full.labels.length;

  return (
    <div className="card">
      <h2 className="section-title">ตีตัวนี้ด้วยอะไรดี</h2>
      <dl className="advice">
        <dt>ธาตุ</dt>
        <dd>
          {el.best.length > 0 ? (
            <>
              <strong>{el.best.join(' / ')}</strong> <span className="mono">{el.bestPct}%</span>
            </>
          ) : (
            <>
              ไหนก็ได้ <span className="muted">— {element}{elementLevel} ไม่มีจุดอ่อน</span>
            </>
          )}
          {el.avoid.length > 0 && (
            <span className="advice__avoid">
              {' '}· เลี่ยง {few(el.avoid.map((a) => `${a.element} ${a.pct}%`), 3)}
            </span>
          )}
        </dd>
        <dt>ขนาด</dt>
        <dd>
          {SIZE_LABELS[parsedSize]}
          {reduced.length === 0 ? (
            <span className="muted"> — ทุกชนิดอาวุธตีเต็ม</span>
          ) : nameFull ? (
            <>
              <span className="muted"> — ตีเต็มเฉพาะ </span>
              {few(full!.labels)}
              {reduced.map((g) => (
                <span key={g.pct} className="advice__avoid"> · {reduced.length === 1 ? 'ที่เหลือ' : few(g.labels)} {g.pct}%</span>
              ))}
            </>
          ) : (
            <>
              <span className="muted"> — อาวุธส่วนใหญ่ตีเต็ม</span>
              {reduced.map((g) => (
                <span key={g.pct} className="advice__avoid"> · {few(g.labels)} {g.pct}%</span>
              ))}
            </>
          )}
        </dd>
      </dl>
      <p className="muted" style={{ marginTop: 8, fontSize: 12 }}>
        ตัวคูณธาตุ×ขนาดเท่านั้น ยังไม่รวม ATK/DEF/การ์ด · ลองอาวุธของคุณที่ <Link href="/tools/damage">หน้าเทียบอาวุธ</Link>
      </p>
    </div>
  );
}
