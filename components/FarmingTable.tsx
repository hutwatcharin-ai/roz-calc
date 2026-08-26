interface FarmingRow {
  monster_id: number;
  name_en: string;
  level: number;
  hp: number;
  exp_per_hp: number;
  avg_zeny_per_kill: number;
  image_url: string | null;
  spawn?: string;
}

export default function FarmingTable({ rows }: { rows: FarmingRow[] }) {
  if (rows.length === 0) {
    return <p style={{ color: 'var(--faint)' }}>ไม่พบมอนสเตอร์ในช่วงเลเวลนี้</p>;
  }

  return (
    <div className="card card--yellow" style={{ overflowX: 'auto' }}>
      <table className="data-table">
        <thead>
          <tr>
            <th>มอนสเตอร์</th>
            <th className="num">Lv</th>
            <th className="num">HP</th>
            <th className="num">EXP/HP</th>
            <th className="num">Zeny/ตัว</th>
            <th>แมพ</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.monster_id}>
              <td data-label="">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {row.image_url && (
                    <img
                      src={row.image_url}
                      alt=""
                      width={24}
                      height={24}
                      style={{ imageRendering: 'pixelated', flexShrink: 0 }}
                    />
                  )}
                  {row.name_en}
                </div>
              </td>
              <td data-label="Lv" className="num">{row.level}</td>
              <td data-label="HP" className="num">{row.hp.toLocaleString()}</td>
              <td data-label="EXP/HP" className="num" style={{ color: 'var(--yellow)' }}>{row.exp_per_hp}</td>
              <td data-label="Zeny/ตัว" className="num">{row.avg_zeny_per_kill.toLocaleString()}</td>
              <td data-label="แมพ">{row.spawn ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
