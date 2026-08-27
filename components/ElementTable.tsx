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

export default function ElementTable({ level }: { level: ElementLevel }) {
  return (
    <div className="card" style={{ marginTop: 16, overflowX: 'auto' }}>
      <h2 className="section-title">ธาตุป้องกันระดับ {level}</h2>
      <table className="eltable">
        <thead>
          <tr>
            <th scope="col">โจมตี \ ป้องกัน</th>
            {ELEMENTS.map((defence) => (
              <th key={defence} scope="col">
                {defence}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ELEMENTS.map((attack: Element) => (
            <tr key={attack}>
              <th scope="row">{attack}</th>
              {ELEMENTS.map((defence) => {
                const value = ELEMENT_TABLE[level][attack][defence];
                return (
                  <td key={defence} className={`el ${band(value)}`}>
                    {value}%
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
