// "ฟาร์มที่ไหนดี" (13 Oct 2026): for an item with droppers, the open map to
// stand on for each of the best three, with the two numbers a farmer wants --
// kills for one piece, and pieces per full clear of the map (lib/farm-spots).
//
// The page already has its droppers; this adds one query for where they spawn.
// A failed query draws nothing: the dropper list below still answers "who".

import Link from 'next/link';
import { supabaseRead } from '@/lib/supabase';
import { fetchAllRows } from '@/lib/fetch-all-rows';
import { mapRelease } from '@/lib/map-availability';
import { monsterLabel } from '@/lib/monster-known-as';
import { farmSpots, type FarmDropper } from '@/lib/farm-spots';

function num(v: number): string {
  return v.toLocaleString('en-US', { maximumFractionDigits: v < 1 ? 2 : 1 });
}

export default async function FarmSpots({ droppers, what = 'ของนี้' }: { droppers: FarmDropper[]; what?: string }) {
  if (!droppers.length) return null;
  const db = supabaseRead();
  const ids = [...new Set(droppers.map((d) => d.monster_id))];
  const { data: spawns, error } = await fetchAllRows<any>((from, to) =>
    db.from('monster_spawns').select('id, monster_id, map_code, map_display_name, amount').in('monster_id', ids).order('id').range(from, to),
  );
  if (error) {
    console.error('farm spots: spawns failed', error);
    return null;
  }
  const { spots, closedOnly } = farmSpots(
    droppers,
    (spawns ?? []).map((s) => ({ monster_id: s.monster_id, map_code: s.map_code, map_name: s.map_display_name, amount: s.amount })),
    (code) => Boolean(mapRelease(code)),
  );
  if (!spots.length && !closedOnly) return null;

  return (
    <section className="card farmspots" aria-labelledby="farmspots-h">
      <h2 className="section-title" id="farmspots-h">ฟาร์ม{what}ที่ไหนดี</h2>
      {spots.length === 0 ? (
        <p className="muted farmspots__note">
          มอนที่ดรอป{what}อยู่บนแมพที่ยังไม่เปิดทั้งหมด ({closedOnly} ชนิด) ตอนนี้ยังฟาร์มจากมอนไม่ได้
        </p>
      ) : (
        <>
          <ol className="farmspots__list">
            {spots.map((s, i) => (
              <li key={`${s.monster.id}-${s.map.code}`} className={i === 0 ? 'is-best' : undefined}>
                <span className="farmspots__rank mono">{i === 0 ? 'BEST' : `#${i + 1}`}</span>
                <div className="farmspots__where">
                  <Link href={`/database/maps/${s.map.code}`}><strong>{s.map.name}</strong></Link>
                  <span className="muted">
                    ตี <Link href={`/database/monsters/${s.monster.id}`}>{monsterLabel(s.monster.id, s.monster.name)}</Link>
                    {s.monster.level != null && ` Lv ${s.monster.level}`}
                    {' · '}
                    {s.amount != null ? `บนแมพมี ${num(s.amount)} ตัว` : 'ไม่รู้จำนวนบนแมพ'}
                  </span>
                </div>
                <dl className="farmspots__nums">
                  <div><dt>อัตราดรอป</dt><dd className="mono">{s.rate != null ? `${s.rate}%` : '?'}</dd></div>
                  <div><dt>ตีเฉลี่ยต่อ 1 ชิ้น</dt><dd className="mono">{s.killsPerItem != null ? `${num(s.killsPerItem)} ตัว` : '?'}</dd></div>
                  <div><dt>ล้างแมพ 1 รอบได้</dt><dd className="mono">{s.perClear != null ? `${num(s.perClear)} ชิ้น` : '?'}</dd></div>
                </dl>
              </li>
            ))}
          </ol>
          <p className="muted farmspots__note">
            เรียงจากจำนวนชิ้นที่ได้ต่อการล้างแมพ 1 รอบ (อัตราดรอป × จำนวนมอนบนแมพ) ไม่ใช่อัตราดรอปอย่างเดียว เป็นค่าเฉลี่ย ไม่รวมบัฟเพิ่มดรอปและเวลารอมอนเกิด
            {closedOnly > 0 && ` · มีมอนอีก ${closedOnly} ชนิดที่ดรอปได้ แต่อยู่บนแมพที่ยังไม่เปิด`}
          </p>
        </>
      )}
    </section>
  );
}
