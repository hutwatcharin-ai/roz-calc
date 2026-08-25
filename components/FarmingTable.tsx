interface FarmingRow {
  monster_id: number;
  name_en: string;
  level: number;
  hp: number;
  exp_per_hp: number;
  avg_zeny_per_kill: number;
  spawn?: string;
}

export default function FarmingTable({ rows }: { rows: FarmingRow[] }) {
  if (rows.length === 0) {
    return <p style={{ color: 'var(--faint)' }}>ไม่พบมอนสเตอร์ในช่วงเลเวลนี้</p>;
  }

  return (
    <div className="card card--yellow" style={{ overflowX: 'auto' }}>
      <table>
        <thead>
          <tr>
            <th style={{ textAlign: 'left' }}>มอนสเตอร์</th>
            <th style={{ textAlign: 'right' }}>Lv</th>
            <th style={{ textAlign: 'right' }}>HP</th>
            <th style={{ textAlign: 'right' }}>EXP/HP</th>
            <th style={{ textAlign: 'right' }}>Zeny/ตัว</th>
            <th style={{ textAlign: 'left' }}>แมพ</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.monster_id}>
              <td>{row.name_en}</td>
              <td className="mono" style={{ textAlign: 'right' }}>{row.level}</td>
              <td className="mono" style={{ textAlign: 'right' }}>{row.hp.toLocaleString()}</td>
              <td className="mono" style={{ textAlign: 'right', color: 'var(--yellow)' }}>{row.exp_per_hp}</td>
              <td className="mono" style={{ textAlign: 'right' }}>{row.avg_zeny_per_kill.toLocaleString()}</td>
              <td>{row.spawn ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
