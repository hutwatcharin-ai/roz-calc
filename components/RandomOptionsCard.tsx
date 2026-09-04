// The full option pool for one piece of gear runs to 40+ rows across its
// lines, which pushed the drop list and the description far below the fold on
// every weapon page. prontera.info keeps the same data behind one "Show
// possible options" control, and that is the right call: a player reads the
// gear's own stats first and only opens the pool when they are deciding
// whether to roll it.
//
// A <details> rather than a useState toggle -- same interaction, no client
// bundle, and the content stays in the HTML for a crawler to read.

import type { ResolvedPoolLine } from '@/lib/random-options';

export default function RandomOptionsCard({ lines }: { lines: ResolvedPoolLine[] }) {
  if (lines.length === 0) return null;

  return (
    <details className="rndopt">
      <summary className="rndopt__summary">
        <span>ออปชั่นสุ่มที่ชิ้นนี้ทอยได้</span>
        <span className="rndopt__count mono">{lines.length} บรรทัด</span>
      </summary>
      <div className="rndopt__body">
        <p className="muted" style={{ marginTop: 0 }}>
          ดรอปจากมอนสเตอร์ทั่วไป — แต่ละบรรทัดทอยได้ตัวเลือกเดียวจากรายการของบรรทัดนั้น
          ชิ้นหนึ่งจึงติดออปชั่นได้ {lines.length} ออปชั่น
        </p>
        {/* The halo tells you how many options a piece rolled before you pick
            it up. Two of the five are marked "to be checked" by the guide this
            came from, so they say so rather than passing as known. */}
        <p className="rndopt__halo">
          <span>สีรัศมีตอนของตกพื้น = จำนวนออปชั่น:</span>
          <span className="tag" style={{ borderColor: '#5B8CFF', color: '#5B8CFF' }}>ฟ้า 1</span>
          <span className="tag" style={{ borderColor: 'var(--yellow)', color: 'var(--yellow)' }}>เหลือง 2</span>
          <span className="tag" style={{ borderColor: '#B98CFF', color: '#B98CFF' }}>ม่วง 3</span>
          <span className="tag tag--unknown">เขียว 4 · ยังไม่ยืนยัน</span>
          <span className="tag tag--unknown">แดง 5 · ยังไม่ยืนยัน</span>
        </p>
        {lines.map((line) => (
          <div key={line.lineIndex} style={{ marginTop: 12 }}>
            <p className="rndopt__line">
              บรรทัดที่ {line.lineIndex}{' '}
              <span className={`tag tag--${line.acquisition === 'guaranteed' ? 'none' : 'risk'}`}>
                {line.acquisition === 'guaranteed' ? 'ได้เสมอ' : 'อาจได้'}
              </span>
            </p>
            <table className="data-table" style={{ marginTop: 4 }}>
              <tbody>
                {line.entries.map((e) => (
                  <tr key={e.option_key}>
                    <td data-label="">{e.label_en}</td>
                    <td data-label="ค่า" className="num mono">
                      {e.value_min === e.value_max ? e.value_min : `${e.value_min}–${e.value_max}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </details>
  );
}
