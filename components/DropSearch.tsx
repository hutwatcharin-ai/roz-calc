// components/DropSearch.tsx
interface DropRow {
  monster_id: number;
  monster_name: string;
  monster_image_url?: string | null;
  rate: number;
}

export default function DropSearch({
  query,
  resolvedName,
  rows,
}: {
  query: string;
  resolvedName?: string | null;
  rows: DropRow[];
}) {
  return (
    <div className="card card--pink">
      <form>
        <input className="mono" type="text" name="q" defaultValue={query} placeholder="ชื่อไอเทม เช่น Elunium Ore" />
        <button type="submit">ค้นหา</button>
      </form>
      {query && !resolvedName && <p style={{ color: 'var(--faint)' }}>ไม่พบไอเทมนี้</p>}
      {resolvedName && (
        <p style={{ marginTop: 10, fontSize: 13, color: 'var(--dim)' }}>
          ผลลัพธ์สำหรับ: <b className="mono" style={{ color: 'var(--pink)' }}>{resolvedName}</b>
        </p>
      )}
      {resolvedName && rows.length === 0 && (
        <p style={{ color: 'var(--faint)' }}>ไอเทมนี้ไม่มีมอนสเตอร์ตัวไหนดรอป</p>
      )}
      <div style={{ marginTop: 12 }}>
        {rows.map((row) => (
          <div
            key={row.monster_id}
            style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--hair)' }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {row.monster_image_url && (
                <img src={row.monster_image_url} alt="" width={20} height={20} style={{ imageRendering: 'pixelated' }} />
              )}
              {row.monster_name}
            </span>
            <span className="mono" style={{ color: 'var(--pink)' }}>{row.rate}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
