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

// "ดาบสองมือ, มีด, ขวาน และอีก 2" -- three names is what a player can hold
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

  // Arcade layout (owner, 1 Oct 2026): each answer as a lit chip, what to
  // use on a green BEST row and what to skip on a red AVOID row, instead of
  // one sentence per line. The words the tests read stay the same.
  return (
    <div className="card">
      <h2 className="section-title">ตีตัวนี้ด้วยอะไรดี</h2>
      <div className="weak">
        <div className="weak__row">
          <p className="weak__hd"><span>ELEMENT</span> ธาตุ</p>
          <div className="weak__groups">
            <p className="weak__group weak__group--best">
              <span className="weak__tag">ใช้</span>
              {el.best.length > 0 ? (
                <span className="weak__chip weak__chip--best" data-element={el.best[0]}>
                  {el.best.join(' / ')} <b>{el.bestPct}%</b>
                </span>
              ) : (
                <span className="weak__chip">
                  ไหนก็ได้ <small>{element}{elementLevel} ไม่มีจุดอ่อน</small>
                </span>
              )}
            </p>
            {el.avoid.length > 0 && (
              <p className="weak__group weak__group--avoid">
                <span className="weak__tag">เลี่ยง </span>
                {el.avoid.map((a) => (
                  <span key={a.element} className="weak__chip weak__chip--avoid">
                    {a.element} <b>{a.pct}%</b>
                  </span>
                ))}
              </p>
            )}
          </div>
        </div>
        <div className="weak__row">
          <p className="weak__hd"><span>SIZE</span> ขนาด{SIZE_LABELS[parsedSize]}</p>
          <div className="weak__groups">
            <p className="weak__group weak__group--best">
              <span className="weak__tag">ตีเต็ม 100%</span>
              {reduced.length === 0 ? (
                <span className="weak__chip weak__chip--best">ทุกชนิดอาวุธ</span>
              ) : nameFull ? (
                full!.labels.map((l) => <span key={l} className="weak__chip weak__chip--best">{l}</span>)
              ) : (
                <span className="weak__chip weak__chip--best">อาวุธส่วนใหญ่</span>
              )}
            </p>
            {reduced.map((g) => (
              <p key={g.pct} className="weak__group weak__group--avoid">
                <span className="weak__tag">เหลือ {g.pct}%</span>
                {g.labels.map((l) => <span key={l} className="weak__chip weak__chip--avoid">{l}</span>)}
              </p>
            ))}
          </div>
        </div>
      </div>
      <p className="muted" style={{ marginTop: 8, fontSize: 12 }}>
        ตัวคูณธาตุ×ขนาดเท่านั้น ยังไม่รวม ATK/DEF/การ์ด · ลองอาวุธของคุณที่ <Link href="/tools/damage">หน้าเทียบอาวุธ</Link>
      </p>
    </div>
  );
}
