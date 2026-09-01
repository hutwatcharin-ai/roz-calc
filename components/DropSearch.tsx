'use client';

// components/DropSearch.tsx
import Link from 'next/link';
import AggroBadge from '@/components/AggroBadge';
import { DROP_PENALTY_LABELS, dropPenalty, dropPenaltyDetail } from '@/lib/drop-penalty';
import { useCharacterContext } from '@/components/CharacterContextProvider';

interface DropRow {
  monster_id: number;
  monster_name: string;
  monster_image_url?: string | null;
  monster_level: number | null;
  is_aggressive: boolean | null;
  atk_max: number | null;
  rate: number;
}

export default function DropSearch({
  query,
  resolvedName,
  resolvedId,
  rows,
}: {
  query: string;
  resolvedName?: string | null;
  resolvedId?: number | null;
  rows: DropRow[];
}) {
  const { character, ready } = useCharacterContext();

  return (
    <div className="card card--pink">
      <form>
        <input className="mono" type="text" name="q" defaultValue={query} placeholder="ชื่อไอเทม เช่น Elunium Ore" />
        <button type="submit">ค้นหา</button>
      </form>
      {query && !resolvedName && <p style={{ color: 'var(--faint)' }}>ไม่พบไอเทมนี้</p>}
      {resolvedName && (
        <p style={{ marginTop: 10, fontSize: 13, color: 'var(--dim)' }}>
          ผลลัพธ์สำหรับ:{' '}
          {resolvedId ? (
            <Link href={`/database/items/${resolvedId}`} className="mono" style={{ color: 'var(--pink)', fontWeight: 700 }}>
              {resolvedName}
            </Link>
          ) : (
            <b className="mono" style={{ color: 'var(--pink)' }}>{resolvedName}</b>
          )}
        </p>
      )}
      {resolvedName && rows.length === 0 && (
        <p style={{ color: 'var(--faint)' }}>ไอเทมนี้ไม่มีมอนสเตอร์ตัวไหนดรอป</p>
      )}
      {/* Capped width: on a wide screen the % sat a full viewport away from
          the name (user screenshot, 1 Sep) -- an eye has to travel the gap.
          65ch keeps name and rate in one glance. */}
      <div style={{ marginTop: 12, maxWidth: 720 }}>
        {rows.map((row) => (
          <div
            key={row.monster_id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 10,
              padding: '9px 0',
              borderBottom: '1px solid var(--hair)',
              flexWrap: 'wrap',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {row.monster_image_url && (
                <img loading="lazy" decoding="async" src={row.monster_image_url} alt="" width={20} height={20} style={{ imageRendering: 'pixelated' }} />
              )}
              <Link href={`/database/monsters/${row.monster_id}`}>{row.monster_name}</Link>
              {row.monster_level !== null && <span className="muted">Lv.{row.monster_level}</span>}
              {/* The flag belongs on every surface a monster appears on
                  (spec 3.15.1), and a drop hunt is one of the places a player
                  decides where to stand. */}
              <AggroBadge monster={{ is_aggressive: row.is_aggressive, atk_max: row.atk_max }} />
              {/* Drops are what this page is about, so the level-gap penalty
                  belongs here more than anywhere (spec 3.9). */}
              {ready && character && row.monster_level !== null && (
                <span
                  className={`tag tag--${dropPenalty(character.level, row.monster_level)}`}
                  title={dropPenaltyDetail(character.level, row.monster_level)}
                >
                  {DROP_PENALTY_LABELS[dropPenalty(character.level, row.monster_level)]}
                </span>
              )}
            </span>
            <span className="mono" style={{ color: 'var(--pink)' }}>{row.rate}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
