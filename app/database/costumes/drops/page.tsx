// /database/costumes/drops — every costume a monster drops on a map open on
// Global, by the easiest monster or by map (owner, 14 Oct 2026). The costume
// list already filters "dropped", but it does not say who drops it or where
// to stand, which is the question a player farming a look has.
//
// The rows come from lib/costume-drops; the rates are unknown for every one
// of them (rozerodb and midgardhub both show ???), so the page says so
// instead of printing a number.

import './page.css';
import type { Metadata } from 'next';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import ItemIcon from '@/components/ItemIcon';
import { CostumeThumb } from '@/components/CostumeFit';
import { costumeFit } from '@/lib/costume-fit';
import { POSITION_LABELS } from '@/lib/costume-position';
import { supabaseRead } from '@/lib/supabase';
import { fetchAllRows } from '@/lib/fetch-all-rows';
import { COSTUME_CATEGORY } from '@/lib/item-href';
import { isAbsentFromGame } from '@/lib/game-absent';
import { isCVariant } from '@/lib/c-variant';
import { mapRelease } from '@/lib/map-availability';
import { getMapCanonical } from '@/lib/map-canonical';
import { buildCostumeDrops, groupByMap, matchesCostumeDrop, upcomingCostumes, type CostumeDrop, type UpcomingCostume } from '@/lib/costume-drops';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'คอสตูมที่ดรอปจากมอน — ตีตัวไหน แมพไหน',
  description:
    'รวมคอสตูมทุกชิ้นใน Ragnarok Zero Global ที่ได้จากการตีมอน บอกมอนที่ดรอป เลเวลมอน และแมพที่มีมอนตัวนั้นเยอะที่สุด ค้นได้ทั้งชื่อคอสตูม ชื่อมอน และชื่อแมพ',
  alternates: { canonical: '/database/costumes/drops' },
};

const MAPS_SHOWN = 2;

async function load(): Promise<{ rows: CostumeDrop[]; upcoming: UpcomingCostume[]; icons: Map<number, string | null>; failed: boolean }> {
  const db = supabaseRead();
  const [drops, costumes, monsters, spawns, canonical] = await Promise.all([
    fetchAllRows<{ item_id: number; monster_id: number; rate: number | null }>((from, to) =>
      db.from('monster_drops').select('item_id, monster_id, rate').order('monster_id').order('item_id').range(from, to),
    ),
    fetchAllRows<{ id: number; name_en: string; weapon_type: string | null; icon_url: string | null }>((from, to) =>
      db.from('items').select('id, name_en, weapon_type, icon_url').eq('category', COSTUME_CATEGORY).order('id').range(from, to),
    ),
    fetchAllRows<{ id: number; name_en: string; level: number | null; is_mvp: boolean }>((from, to) =>
      db.from('monsters').select('id, name_en, level, is_mvp').order('id').range(from, to),
    ),
    fetchAllRows<{ monster_id: number; map_code: string; map_display_name: string | null; amount: number | null }>((from, to) =>
      db.from('monster_spawns').select('monster_id, map_code, map_display_name, amount').order('map_code').order('monster_id').range(from, to),
    ),
    getMapCanonical(),
  ]);
  const error = drops.error ?? costumes.error ?? monsters.error ?? spawns.error;
  if (error) {
    console.error('costume drops query failed', error);
    return { rows: [], upcoming: [], icons: new Map(), failed: true };
  }
  const dropped = new Set((drops.data ?? []).map((d) => d.item_id));
  const wanted = (costumes.data ?? []).filter((c) => dropped.has(c.id) && !isAbsentFromGame(c.id));
  const input = {
    costumes: wanted,
    drops: drops.data ?? [],
    monsters: monsters.data ?? [],
    spawns: (spawns.data ?? []).map((s) => ({ monster_id: s.monster_id, map_code: s.map_code, map_name: s.map_display_name, amount: s.amount })),
    isClone: isCVariant,
    // A failed canonical read keeps every channel: duplicates beat a gap.
    isCanonical: (code: string) => canonical.failed || (canonical.byCode[code] ?? code) === code,
  };
  const rows = buildCostumeDrops({ ...input, isClosed: (code) => Boolean(mapRelease(code)) });
  // The ones still waiting on a map: shown so a player can see what is coming,
  // not hidden as if they did not exist.
  const upcoming = upcomingCostumes(buildCostumeDrops({ ...input, isClosed: () => false }), rows, (code) => mapRelease(code)?.when ?? null);
  return { rows, upcoming, icons: new Map(wanted.map((c) => [c.id, c.icon_url])), failed: false };
}

const THAI_MONTHS: Record<string, string> = {
  JAN: 'ม.ค.', FEB: 'ก.พ.', MAR: 'มี.ค.', APR: 'เม.ย.', MAY: 'พ.ค.', JUN: 'มิ.ย.',
  JUL: 'ก.ค.', AUG: 'ส.ค.', SEP: 'ก.ย.', OCT: 'ต.ค.', NOV: 'พ.ย.', DEC: 'ธ.ค.',
};
const thaiWhen = (when: string | null) => {
  const m = /^([A-Z]{3}) (\d{4})$/.exec(when ?? '');
  return m ? `${THAI_MONTHS[m[1]] ?? m[1]} ${m[2]}` : 'ยังไม่ประกาศ';
};

const count = (n: number | null) => (n === null ? 'ไม่รู้จำนวน' : `${n.toLocaleString()} ตัว`);

function Thumb({ id, icon }: { id: number; icon: string | null | undefined }) {
  return costumeFit(id) ? <CostumeThumb id={id} /> : <ItemIcon iconUrl={icon ?? null} category={COSTUME_CATEGORY} size={32} />;
}

export default async function CostumeDropsPage({ searchParams }: { searchParams: { q?: string; view?: string } }) {
  const q = (searchParams.q ?? '').slice(0, 60);
  const view = searchParams.view === 'map' ? 'map' : 'level';
  const { rows, upcoming, icons, failed } = await load();
  const shown = rows.filter((r) => matchesCostumeDrop(r, q));
  const groups = view === 'map' ? groupByMap(shown) : [];
  const monsterCount = new Set(rows.flatMap((r) => r.droppers.map((d) => d.id))).size;

  const href = (next: { view?: string }) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    const v = next.view ?? view;
    if (v !== 'level') params.set('view', v);
    const qs = params.toString();
    return `/database/costumes/drops${qs ? `?${qs}` : ''}`;
  };

  return (
    <main className="shell cdrops" style={{ paddingBlock: 32 }}>
      <PageHeader
        title="คอสตูมที่ดรอปจากมอน"
        lead="ตีมอนตัวไหนได้คอสตูมอะไร และไปตีที่แมพไหน เฉพาะมอนที่อยู่บนแมพที่เปิดแล้วใน Global"
      />

      {failed ? (
        <div className="card"><p className="muted" style={{ margin: 0 }}>โหลดข้อมูลไม่สำเร็จ ลองใหม่อีกครั้ง</p></div>
      ) : (
        <>
          <dl className="cdrops__facts">
            <div><dt>คอสตูม</dt><dd>{rows.length} ชิ้น</dd></div>
            <div><dt>มอนที่ดรอป</dt><dd>{monsterCount} ตัว</dd></div>
            <div><dt>อัตราดรอป</dt><dd>ยังไม่รู้</dd></div>
          </dl>
          <ul className="cdrops__notes">
            <li>ที่ดรอปคือแบบผูกตัวละคร (Bound) เทรดหรือขายให้คนอื่นไม่ได้</li>
            <li>ไม่มีแหล่งไหนรู้อัตราดรอปจริงสักชิ้น ผู้เล่นบอกกันว่าหายากระดับการ์ด แต่ยังไม่มีตัวเลขยืนยัน</li>
            {upcoming.length > 0 && (
              <li>
                อีก {upcoming.length} ชิ้นดรอปจากมอนบนแมพที่ยังไม่เปิด อยู่ในหัวข้อ <a href="#cdrops-upcoming">รอแมพเปิด</a> ท้ายหน้า
              </li>
            )}
          </ul>

          <form className="filterbar" action="/database/costumes/drops">
            <div className="filterbar__row filterbar__row--search">
              <label className="field field--grow">
                <span className="field__label">ค้นชื่อคอสตูม มอน หรือแมพ</span>
                <input type="search" name="q" defaultValue={q} placeholder="เช่น Poring, prt_fild08, Hat" />
              </label>
              {view !== 'level' && <input type="hidden" name="view" value={view} />}
              <button type="submit" className="btn">ค้นหา</button>
            </div>
          </form>

          <div className="chips cdrops__views" role="group" aria-label="จัดเรียงแบบ">
            <Link className={`chip${view === 'level' ? ' chip--on' : ''}`} href={href({ view: 'level' })} scroll={false}>
              ตามเลเวลมอน
            </Link>
            <Link className={`chip${view === 'map' ? ' chip--on' : ''}`} href={href({ view: 'map' })} scroll={false}>
              ตามแมพ
            </Link>
          </div>

          <p className="filterstate">
            {q ? <>เจอ {shown.length} ชิ้นจากคำค้น “{q}” · <Link href={view === 'map' ? '/database/costumes/drops?view=map' : '/database/costumes/drops'}>ล้างคำค้น</Link></> : <>ทั้งหมด {shown.length} ชิ้น</>}
            {view === 'map' && <> · {groups.length} แมพ</>}
          </p>

          {shown.length === 0 ? (
            <div className="card"><p className="muted" style={{ margin: 0 }}>ไม่เจอคอสตูมที่ตรงกับคำค้นนี้</p></div>
          ) : view === 'level' ? (
            <ul className="cdrops__list">
              {shown.map((c) => (
                <li key={c.id} className="cdrops__row">
                  <Link href={`/database/costumes/${c.id}`} className="cdrops__item">
                    <Thumb id={c.id} icon={icons.get(c.id)} />
                    <span>
                      <span className="cdrops__name">{c.name.replace(/\s*[[(]Bound[\])]$/, '')}</span>
                      <span className="cdrops__pos">{c.position ? POSITION_LABELS[c.position] ?? c.position : 'ไม่ระบุตำแหน่ง'}</span>
                    </span>
                  </Link>
                  <ul className="cdrops__mobs">
                    {c.droppers.map((d) => (
                      <li key={d.id}>
                        <Link href={`/database/monsters/${d.id}`} className="cdrops__mob">
                          {d.name}
                        </Link>
                        <span className="cdrops__lv">Lv {d.level ?? '?'}{d.isMvp && ' · MVP'}</span>
                        <span className="cdrops__maps">
                          {d.maps.slice(0, MAPS_SHOWN).map((m, i) => (
                            <span key={m.code}>
                              {i > 0 && ' · '}
                              <Link href={`/database/maps/${encodeURIComponent(m.code)}`}>{m.name}</Link>{' '}
                              <span className="muted">({count(m.amount)})</span>
                            </span>
                          ))}
                          {d.maps.length > MAPS_SHOWN && <span className="muted"> +{d.maps.length - MAPS_SHOWN} แมพ</span>}
                        </span>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          ) : (
            <div className="cdrops__maplist">
              {groups.map((g) => (
                <section key={g.code} className="card cdrops__map">
                  <h2 className="cdrops__maphead">
                    <Link href={`/database/maps/${encodeURIComponent(g.code)}`}>{g.name}</Link>
                    <span className="muted"> {g.code} · {g.entries.length} ชิ้น</span>
                  </h2>
                  <ul className="cdrops__mapitems">
                    {g.entries.map((e) => (
                      <li key={`${e.costume.id}-${e.dropper.id}`}>
                        <Link href={`/database/costumes/${e.costume.id}`} className="cdrops__item">
                          <Thumb id={e.costume.id} icon={icons.get(e.costume.id)} />
                          <span>
                            <span className="cdrops__name">{e.costume.name.replace(/\s*[[(]Bound[\])]$/, '')}</span>
                            <span className="cdrops__pos">
                              {e.dropper.name} Lv {e.dropper.level ?? '?'} · {count(e.amount)}
                            </span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}

          {upcoming.length > 0 && !q && (
            <section className="card cdrops__upcoming" aria-labelledby="cdrops-upcoming">
              <h2 className="section-title" id="cdrops-upcoming">รอแมพเปิด {upcoming.length} ชิ้น</h2>
              <p className="muted" style={{ marginTop: 6 }}>
                มอนที่ดรอปยังอยู่บนแมพที่ Global ยังไม่เปิด เดือนที่เขียนไว้มาจากโรดแมปของผู้ให้บริการและป้ายของ rozerodb อาจเลื่อนได้
              </p>
              <ul className="cdrops__mapitems">
                {upcoming.map(({ costume: c, when }) => (
                  <li key={c.id}>
                    <Link href={`/database/costumes/${c.id}`} className="cdrops__item">
                      <Thumb id={c.id} icon={icons.get(c.id)} />
                      <span>
                        <span className="cdrops__name">{c.name.replace(/\s*[[(]Bound[\])]$/, '')}</span>
                        <span className="cdrops__pos">
                          {c.droppers[0].name} Lv {c.droppers[0].level ?? '?'} · <span className="cdrops__when">{thaiWhen(when)}</span>
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <p className="muted" style={{ marginTop: 16 }}>
            ดูคอสตูมทั้งหมด รวมที่ได้จาก Cash Shop ที่ <Link href="/database/costumes">ฐานข้อมูลคอสตูม</Link>
          </p>
        </>
      )}
    </main>
  );
}
