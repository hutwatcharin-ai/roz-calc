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
        <p className="source-note" style={{ marginTop: 10 }}>
          ที่มา:{' '}
          <a href={lines[0].sourceUrl} target="_blank" rel="noopener noreferrer">
            คู่มือทางการ gnjoy.com.tw
          </a>{' '}
          ผ่าน prontera.info
        </p>
      </div>
    </details>
  );
}
