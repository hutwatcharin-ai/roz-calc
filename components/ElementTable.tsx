// components/ElementTable.tsx
import { ELEMENTS, ELEMENT_TABLE, type Element, type ElementLevel } from '@/lib/element-table';

// Colour bands, but the number is always printed as well -- the same rule the
// aggro badge follows. A reader who cannot separate the reds from the greens
// still gets the whole table.
function band(value: number): string {
  if (value === 0) return 'el--immune';
  if (value < 0) return 'el--heal';
  if (value < 100) return 'el--weak';
  if (value === 100) return 'el--flat';
  return 'el--strong';
}

// Short Thai names for a phone. The matrix is 11 columns; with the English
// names and a "%" in every cell it ran 708px in a 356px card, and the owner
// reported the guide running off the screen (11 Sep 2026). Short headers,
// bare numbers and tight cells fit it without a sideways scroll.
const SHORT: Record<string, string> = {
  Neutral: 'ไร้',
  Water: 'น้ำ',
  Earth: 'ดิน',
  Fire: 'ไฟ',
  Wind: 'ลม',
  Poison: 'พิษ',
  Holy: 'ศักดิ์',
  Shadow: 'มืด',
  Ghost: 'ผี',
  Undead: 'อันเดด',
};

function ElementName({ element }: { element: string }) {
  return (
    <>
      <span className="el-full">{element}</span>
      <abbr className="el-short" title={element}>
        {SHORT[element] ?? element}
      </abbr>
    </>
  );
}

export default function ElementTable({ level }: { level: ElementLevel }) {
  return (
    <div className="card eltable-card" style={{ marginTop: 16, overflowX: 'auto' }}>
      <h2 className="section-title">ธาตุป้องกันระดับ {level}</h2>
      <p className="eltable__phonenote">แถว = ธาตุที่ตี · คอลัมน์ = ธาตุที่รับ · ตัวเลขเป็น %</p>
      <table className="eltable">
        <thead>
          <tr>
            <th scope="col">
              <span className="el-full">โจมตี \ ป้องกัน</span>
              <span className="el-short">ตี\รับ</span>
            </th>
            {ELEMENTS.map((defence) => (
              <th key={defence} scope="col">
                <ElementName element={defence} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ELEMENTS.map((attack: Element) => (
            <tr key={attack}>
              <th scope="row">
                <ElementName element={attack} />
              </th>
              {ELEMENTS.map((defence) => {
                const value = ELEMENT_TABLE[level][attack][defence];
                return (
                  <td key={defence} className={`el ${band(value)}`}>
                    {value}
                    <span className="el-pct">%</span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
