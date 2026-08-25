// components/DropSearch.tsx
interface DropRow {
  monster_id: number;
  monster_name: string;
  rate: number;
}

export default function DropSearch({ query, rows }: { query: string; rows: DropRow[] }) {
  return (
    <div className="card card--pink">
      <form>
        <input className="mono" type="text" name="q" defaultValue={query} placeholder="ชื่อไอเทม เช่น Elunium Ore" />
        <button type="submit">ค้นหา</button>
      </form>
      {query && rows.length === 0 && <p style={{ color: 'var(--faint)' }}>ไม่พบไอเทมนี้</p>}
      <div style={{ marginTop: 12 }}>
        {rows.map((row) => (
          <div
            key={row.monster_id}
            style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--hair)' }}
          >
            <span>{row.monster_name}</span>
            <span className="mono" style={{ color: 'var(--pink)' }}>{row.rate}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
