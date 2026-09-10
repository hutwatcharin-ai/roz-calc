// app/database/pets/page.tsx
//
// The pets, as a database section rather than a guide.
//
// It was a guide page until 9 Sep 2026 and that was the wrong shelf: the
// content is one row per pet, which is what /database is for. Worse, the
// guide listed 26 pets while the items table holds 28 eggs, so two of them
// existed on the site only as an unexplained row inside /database/items.
//
// Three sources meet here, and the page says which is which:
//   the eggs and the taming items are ours, out of the items table
//   the stat bonus is the mirrored guide's -- the game writes nothing about
//     LUK +2 on an egg, so nothing here can confirm it
//   the taming item's drop rate is checked: 32 of the guide's 33 rows match
//     our own monster_drops exactly
//
// Eggs do not drop. The percentage on a row is the drop rate of the item you
// tame the monster with.
//
// A Qpet is not a pet you keep and feed. The egg is attached to a Taming Ring
// in the enchantment window, and "level 2" is a second copy of the same egg at
// 50% -- see lib/qpet-ring, written after this page shipped a sentence about
// intimacy that nothing in the source supports.
import Link from 'next/link';
import type { Metadata } from 'next';
import PageHeader from '@/components/PageHeader';
import Caveat from '@/components/Caveat';
import FilterState, { EmptyState } from '@/components/FilterState';
import ItemIcon from '@/components/ItemIcon';
import JsonLd from '@/components/JsonLd';
import { breadcrumbJsonLd } from '@/lib/jsonld';
import { itemHref } from '@/lib/item-href';
import { matches } from '@/lib/smart-search';
import { supabaseBrowser } from '@/lib/supabase';
import { naviCommand, qpetFor, rozglobalGuides } from '@/lib/rozglobal-guides';
import { LEVEL_2_SUCCESS_PERCENT, RING_TABS, TAMING_QUEST, TAMING_RING_PRICE } from '@/lib/qpet-ring';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'ฐานข้อมูลสัตว์เลี้ยง Ragnarok Zero — ตัวไหนให้สเตตัสอะไร จับด้วยอะไร',
  description:
    'สัตว์เลี้ยง (Qpet) ทุกตัวใน Ragnarok Zero Global — โบนัสสเตตัสตอนใส่ Taming Ring ระดับ 1 และ 2 ใช้ของอะไรจับ ของนั้นดรอปจากมอนตัวไหนกี่เปอร์เซ็นต์ ค้นชื่อได้ พร้อมพิกัดร้านขายแหวนทุกเมือง',
};

interface PetRow {
  id: number;
  name: string;
  icon: string | null;
  level1: string | null;
  level2: string | null;
  taming: { id: number | null; name: string } | null;
  sources: { monster: string; rate: number; monsterId: number | null }[];
}

export default async function PetsDatabasePage({ searchParams }: { searchParams: { q?: string } }) {
  const q = (searchParams.q ?? '').trim();

  const db = supabaseBrowser();
  // 54 rows in the whole Pet category, so one select covers it.
  const { data, error } = await db
    .from('items')
    .select('id, name_en, icon_url')
    .eq('category', 'Pet')
    .order('name_en');
  if (error) console.error('pet item query failed', error);

  const items = data ?? [];
  const eggs = items.filter((row) => row.name_en.endsWith(' Egg'));
  const byName = new Map(items.map((row) => [row.name_en.toLowerCase(), row]));

  const pets: PetRow[] = eggs.map((egg) => {
    // "Poring Egg" -> "Poring", which is how the guide names the pet.
    const name = egg.name_en.replace(/ Egg$/, '');
    // Not a plain name match: two eggs are filed under a name the guide does
    // not use, and qpetFor bridges them through facts already recorded.
    const entry = qpetFor(name);
    const taming = entry ? byName.get(entry.taming.toLowerCase()) : undefined;
    return {
      id: egg.id,
      name,
      icon: egg.icon_url,
      level1: entry?.level1 ?? null,
      level2: entry?.level2 ?? null,
      taming: entry ? { id: taming?.id ?? entry.tamingId ?? null, name: entry.taming } : null,
      sources: entry?.sources ?? [],
    };
  });

  const rows = q ? pets.filter((pet) => matches(`${pet.name} ${pet.level1 ?? ''} ${pet.level2 ?? ''}`, q.toLowerCase())) : pets;
  // Stated rather than hidden. After the name bridging above this is down to
  // the collab pets (Fei-Chai, Tai-zi), which the guide never covered.
  const undocumented = pets.filter((pet) => pet.level1 === null).length;

  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'หน้าแรก', path: '/' },
          { name: 'ฐานข้อมูล', path: '/database/monsters' },
          { name: 'สัตว์เลี้ยง', path: '/database/pets' },
        ])}
      />
      <PageHeader title="ฐานข้อมูลสัตว์เลี้ยง" />

      {error ? (
        <p className="filterstate">โหลดข้อมูลสัตว์เลี้ยงไม่สำเร็จ</p>
      ) : (
        <FilterState count={rows.length} unit="ตัว" filters={[{ label: 'คำค้น', value: q }]} clearHref="/database/pets" />
      )}

      <p className="muted" style={{ marginTop: 4, marginBottom: 14, maxWidth: '72ch' }}>
        <strong>ไข่ไม่ได้ดรอปจากมอน</strong> — ตัวเลข % คืออัตราดรอปของ<em>ของที่ใช้จับ</em> ·
        โบนัสมาจากการเอาไข่ใส่ <strong>Taming Ring</strong> ไม่ใช่การเลี้ยงให้สนิท
        {undocumented > 0 && ` · อีก ${undocumented} ตัวมีไข่ในเกมแต่ยังไม่มีใครลงโบนัสไว้`}
      </p>

      <form className="filterbar">
        <input type="search" name="q" defaultValue={q} placeholder="ชื่อสัตว์เลี้ยง หรือสเตตัส เช่น LUK" />
        <button type="submit" className="btn">ค้นหา</button>
      </form>

      <div className="card">
        <div className="recipe__scroll">
          <table className="data-table recipe">
            <thead>
              <tr>
                <th>สัตว์เลี้ยง</th>
                <th>ใส่แหวนระดับ 1</th>
                <th>ระดับ 2 (ไข่ซ้ำ)</th>
                <th>ของที่ใช้จับ</th>
                <th>ของฝึกดรอปจาก</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((pet) => (
                <tr key={pet.id}>
                  <td data-label="สัตว์เลี้ยง">
                    <Link className="recipe__item" href={itemHref(pet.id, null)}>
                      <ItemIcon iconUrl={pet.icon} category="Other" size={22} />
                      <span>{pet.name}</span>
                    </Link>
                  </td>
                  <td data-label="ระดับ 1">{pet.level1 ?? <span className="muted">ยังไม่มีข้อมูล</span>}</td>
                  <td data-label="ระดับ 2">{pet.level2 ?? <span className="muted">—</span>}</td>
                  <td data-label="ของที่ใช้จับ">
                    {pet.taming === null ? (
                      <span className="muted">ยังไม่มีข้อมูล</span>
                    ) : pet.taming.id ? (
                      <Link className="recipe__item" href={itemHref(pet.taming.id, null)}>
                        <ItemIcon iconUrl={`/images/items/${pet.taming.id}.gif`} category="Other" size={20} />
                        <span>{pet.taming.name}</span>
                      </Link>
                    ) : (
                      <span className="recipe__item">{pet.taming.name}</span>
                    )}
                  </td>
                  <td data-label="ของฝึกดรอปจาก">
                    {pet.sources.length === 0 ? (
                      <span className="muted">—</span>
                    ) : (
                      <span className="recipe__list">
                        {pet.sources.map((s) => (
                          <span key={s.monster}>
                            {s.monsterId ? (
                              <Link href={`/database/monsters/${s.monsterId}`}>{s.monster}</Link>
                            ) : (
                              s.monster
                            )}{' '}
                            <span className="muted">{s.rate}%</span>
                          </span>
                        ))}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} data-label="" style={{ color: 'var(--faint)', padding: '16px 0' }}>
                    ไม่พบสัตว์เลี้ยงที่ตรงเงื่อนไข
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {rows.length === 0 && q && <EmptyState kind="items" what={q} clearHref="/database/pets" />}

      {/* The bonuses above are unreachable without this, and the page shipped
          without it for a day: a Qpet is an enchantment on a ring, not a pet
          that follows you. */}
      <section style={{ marginTop: 26 }}>
        <h2 className="section-title">โบนัสพวกนี้ได้มายังไง</h2>
        <ol className="qpetsteps">
          <li>
            ซื้อ <strong>Taming Ring</strong> ราคา {TAMING_RING_PRICE.toLocaleString('en-US')} Zeny จาก Taming Merchant
            (พิกัดข้างล่าง) แล้วสวมไว้
          </li>
          <li>
            เอาไข่ไปใส่ที่<strong>หน้าต่างเอนแชนต์</strong>ของแหวน —{' '}
            {RING_TABS.map((tab, i) => (
              <span key={tab.name}>
                {i > 0 && ' · '}
                <strong>{tab.name}</strong> {tab.does}
              </span>
            ))}
          </li>
          <li>
            ระดับ 2 ต้องใช้<strong>ไข่ตัวเดิมอีกฟอง</strong> และสำเร็จ{' '}
            <strong>{LEVEL_2_SUCCESS_PERCENT}%</strong> — พลาดคือเสียไข่ฟองที่สอง
          </li>
        </ol>
        <p className="muted" style={{ marginTop: 8, fontSize: 13 }}>
          ไม่มีเงินซื้อของจับ: มีเควสจับสัตว์ที่ {TAMING_QUEST.town} คุยกับ {TAMING_QUEST.npc}{' '}
          {naviCommand(TAMING_QUEST.map, TAMING_QUEST.x, TAMING_QUEST.y) && (
            <code className="mono navicmd">{naviCommand(TAMING_QUEST.map, TAMING_QUEST.x, TAMING_QUEST.y)}</code>
          )}{' '}
          — {TAMING_QUEST.about}
        </p>
      </section>

      <section style={{ marginTop: 26 }}>
        <h2 className="section-title">ซื้อ Taming Ring ได้ที่ไหน</h2>
        <p className="muted" style={{ marginTop: 2, marginBottom: 10, fontSize: 13 }}>
          ก๊อป <code className="mono">/navi</code> ไปวางในแชต แล้วตัวละครจะเดินไปเอง
        </p>
        <div className="recipe__scroll">
          <table className="data-table recipe">
            <thead>
              <tr>
                <th>เมือง</th>
                <th>พิมพ์ในแชต</th>
              </tr>
            </thead>
            <tbody>
              {rozglobalGuides.qpetTowns.map((town) => {
                const navi = naviCommand(town.map, town.x, town.y);
                return (
                  <tr key={town.town}>
                    <td data-label="เมือง">{town.town}</td>
                    <td data-label="พิมพ์ในแชต">
                      {navi ? <code className="mono navicmd">{navi}</code> : <span className="muted">ไม่ทราบพิกัด</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <Caveat label="เชื่อได้แค่ไหน">
        ไข่และของที่ใช้จับมาจาก<strong>ฐานข้อมูลไอเทมของเว็บนี้</strong> (หมวด Pet) ·
        โบนัสสเตตัสมาจากไกด์ภาษาฝรั่งเศส roz-global.info (อ่าน 8 ก.ย. 2026) <strong>เป็นแหล่งเดียว</strong>
        เพราะคำอธิบายไข่ในเกมไม่ได้เขียนโบนัสไว้ ·
        วิธีใช้แหวนและกติกาไข่ซ้ำ 50% มาจากไกด์เดียวกัน ·
        ส่วน<strong>อัตราดรอปของฝึกตรวจกับตารางดรอปของเราแล้ว ตรงกัน 32 จาก 33 คู่ ไม่มีคู่ไหนขัดกัน</strong>
        (อีกคู่เป็นมอนชื่อ Pirate Swordsman ที่ไม่มีในฐานข้อมูลเรา) · พิกัด NPC ไม่มีแหล่งที่สองให้ตรวจ
      </Caveat>

      <p className="muted" style={{ marginTop: 16 }}>
        ดูต่อ: <Link href="/database/items?category=Pet">ไอเทมหมวดสัตว์เลี้ยงทั้งหมด</Link> ·{' '}
        <Link href="/database/monsters">ฐานข้อมูลมอนสเตอร์</Link>
      </p>
    </main>
  );
}
