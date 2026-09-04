'use client';

// The ranked list on /tools/leveling-spots. The character bar is client state,
// so the ranking runs here; lib/leveling-spots.ts holds the arithmetic and is
// tested without React.

import Link from 'next/link';
import { useMemo } from 'react';
import { useCharacterContext } from '@/components/CharacterContextProvider';
import { dedupeZoneVariants, rankSpots, type Spot } from '@/lib/leveling-spots';
import { formatExpPerHour } from '@/lib/format-rate';

const SHOWN = 20;

export default function LevelingSpots({ spots, level }: { spots: Spot[]; level: number }) {
  const { character, ready } = useCharacterContext();

  // The level the page was fetched for wins over the character's own: a player
  // planning where to go at 60 is reading this page at 60.
  const ranked = useMemo(
    () =>
      rankSpots(
        dedupeZoneVariants(spots),
        level,
        character
          ? {
              level: character.level,
              damagePerHit: character.damagePerHit,
              attacksPerSecond: character.attacksPerSecond,
              hit: character.hit,
            }
          : null,
      ),
    [spots, level, character],
  );

  if (spots.length === 0) {
    return <p className="muted">ไม่มีแมพที่มีมอนช่วงเลเวลนี้ในข้อมูล</p>;
  }

  const personal = ready && character !== null;
  const top = ranked.slice(0, SHOWN);

  return (
    <>
      <form className="filterbar" style={{ marginBottom: 12 }}>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--dim)' }}>
          เลเวลของคุณ{' '}
          <input className="mono" type="number" name="level" defaultValue={level} min={1} max={200} style={{ width: 96 }} />
        </label>
        <button type="submit" className="btn">ดูแมพ</button>
      </form>

      {!personal && (
        <p className="muted" style={{ marginBottom: 12 }}>
          ตอนนี้เรียงตามปริมาณ EXP ในแมพ (จำนวนมอน × EXP ถ่วงตามความใกล้เลเวล) —
          กรอกดาเมจกับความเร็วตีในแถบตัวละคร แล้วจะเรียงตาม EXP/ชม. จริงของคุณแทน
        </p>
      )}

      <div className="card" style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>แมพ</th>
              <th className="num">มอนในแมพ</th>
              {personal && <th className="num">EXP/ชม. เฉลี่ยทั้งแมพ</th>}
              {personal && <th className="num">ตัวที่คุ้มสุด</th>}
              <th>มอนหลักในแมพ</th>
            </tr>
          </thead>
          <tbody>
            {top.map((spot, i) => {
              // Biggest populations first: what you actually walk into.
              const headline = [...spot.scored]
                .sort((a, b) => (b.amount ?? 0) - (a.amount ?? 0))
                .slice(0, 3);
              const best = [...spot.scored]
                .filter((m) => m.expPerHour !== null)
                .sort((a, b) => (b.expPerHour ?? 0) - (a.expPerHour ?? 0))[0];

              return (
                <tr key={spot.map_code}>
                  <td data-label="">
                    <span className="mono" style={{ color: 'var(--faint)' }}>#{i + 1}</span>{' '}
                    <Link href={`/database/maps/${encodeURIComponent(spot.map_code)}`}>{spot.map_name}</Link>
                    {/* Our display names are not unique -- three different
                        Geffen fields all read "Geffen Field" -- so the code
                        rides along as the thing that actually identifies the
                        map, and doubles as the name for the rows that have no
                        display name at all. */}
                    {spot.map_name !== spot.map_code && (
                      <span className="mono" style={{ color: 'var(--faint)', fontSize: 11, marginLeft: 6 }}>
                        {spot.map_code}
                      </span>
                    )}
                    {'zoneCount' in spot && (spot as { zoneCount: number }).zoneCount > 1 && (
                      <span className="mono" style={{ color: 'var(--faint)', marginLeft: 6 }}>
                        {(spot as { zoneCount: number }).zoneCount} โซน
                      </span>
                    )}
                    {spot.aggressiveCount > 0 && (
                      <span className="tag tag--risk" style={{ marginLeft: 6 }} title="ชนิดที่โจมตีก่อนในแมพนี้">
                        โจมตีก่อน {spot.aggressiveCount}
                      </span>
                    )}
                  </td>
                  <td data-label="มอนในแมพ" className="num mono">
                    {spot.spawnTotal > 0 ? spot.spawnTotal.toLocaleString() : '—'}
                  </td>
                  {personal && (
                    <td data-label="EXP/ชม. เฉลี่ยทั้งแมพ" className="num mono">
                      {spot.mixedExpPerHour !== null ? formatExpPerHour(spot.mixedExpPerHour) : '—'}
                    </td>
                  )}
                  {personal && (
                    <td data-label="ตัวที่คุ้มสุด" className="num">
                      {best ? (
                        <>
                          <Link href={`/database/monsters/${best.monster_id}`}>{best.name_en}</Link>{' '}
                          <span className="mono" style={{ color: 'var(--dim)' }}>
                            {formatExpPerHour(best.expPerHour!)}
                          </span>
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                  )}
                  <td data-label="มอนหลักในแมพ">
                    {headline.map((m, k) => (
                      <span key={m.monster_id}>
                        {k > 0 && ' · '}
                        <Link href={`/database/monsters/${m.monster_id}`}>{m.name_en}</Link>
                        <span className="mono" style={{ color: 'var(--faint)' }}>
                          {' '}Lv{m.level}
                          {m.amount ? ` ×${m.amount}` : ''}
                        </span>
                      </span>
                    ))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {ranked.length > SHOWN && (
        <p className="muted" style={{ marginTop: 10 }}>
          แสดง {SHOWN} อันดับแรกจาก {ranked.length} แมพที่มีมอนช่วงเลเวลนี้
        </p>
      )}
    </>
  );
}
