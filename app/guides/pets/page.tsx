// app/guides/pets/page.tsx
//
// The pet eggs: what each one gives, what tames it, and what drops it.
//
// The stat bonus is the reason the page exists. It is nowhere in the item
// description -- an egg's text says nothing about LUK +2 -- so a player
// cannot compare pets from our own database at all.
//
// The rate column was mislabelled on the first pass. It is the drop rate of
// the TAMING ITEM, not of the egg -- the guide says so in the sentence above
// its own table, and a player pointed out that pet eggs do not drop at all.
// Compared against the right item, 32 of its 33 rows match our monster_drops
// exactly with no disagreement, so the column is fully cross-checked rather
// than the single unverifiable source it was published as.
import Link from 'next/link';
import type { Metadata } from 'next';
import PageHeader from '@/components/PageHeader';
import Caveat from '@/components/Caveat';
import ItemIcon from '@/components/ItemIcon';
import JsonLd from '@/components/JsonLd';
import { breadcrumbJsonLd } from '@/lib/jsonld';
import { itemHref } from '@/lib/item-href';
import { naviCommand, rozglobalGuides } from '@/lib/rozglobal-guides';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'สัตว์เลี้ยง Ragnarok Zero — ตัวไหนให้สเตตัสอะไร จับด้วยอะไร',
  description:
    'สัตว์เลี้ยงใน Ragnarok Zero Global ทุกตัว บอกโบนัสสเตตัสตอนสนิทระดับ 1 และ 2 ใช้ของอะไรจับ ของนั้นดรอปจากมอนตัวไหนกี่เปอร์เซ็นต์ และ NPC สัตว์เลี้ยงอยู่เมืองไหนพร้อมพิกัด',
};

export default function PetsPage() {
  const { qpets, qpetTowns } = rozglobalGuides;

  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'หน้าแรก', path: '/' },
          { name: 'ไกด์', path: '/guides' },
          { name: 'สัตว์เลี้ยง', path: '/guides/pets' },
        ])}
      />
      <PageHeader title="สัตว์เลี้ยง — ตัวไหนให้อะไร" />
      <p className="muted" style={{ marginTop: -6, marginBottom: 16, maxWidth: '72ch' }}>
        สัตว์เลี้ยง {qpets.length} ตัว · โบนัสขึ้นกับความสนิท — <strong>ระดับ 2 ต้องเลี้ยงจนสนิทมากขึ้น</strong>
        โบนัสนี้ไม่ได้เขียนไว้ในคำอธิบายไข่ในเกม จึงเทียบจากฐานข้อมูลเฉยๆ ไม่ได้ ·
        <strong>ไข่ไม่ได้ดรอปจากมอน</strong> ต้องเอาของที่ใช้จับไปจับเอง — ช่องขวาสุดคือมอนที่ดรอป<em>ของที่ใช้จับ</em>
      </p>

      <div className="card">
        <div className="recipe__scroll">
          <table className="data-table recipe">
            <thead>
              <tr>
                <th>สัตว์เลี้ยง</th>
                <th>สนิทระดับ 1</th>
                <th>สนิทระดับ 2</th>
                <th>ของที่ใช้จับ</th>
                <th>ของฝึกดรอปจาก</th>
              </tr>
            </thead>
            <tbody>
              {qpets.map((pet) => (
                <tr key={pet.pet}>
                  <td data-label="สัตว์เลี้ยง">
                    {pet.eggId ? (
                      <Link className="recipe__item" href={itemHref(pet.eggId, null)}>
                        <ItemIcon iconUrl={`/images/items/${pet.eggId}.gif`} category="Other" size={20} />
                        <span>{pet.pet}</span>
                      </Link>
                    ) : (
                      <span className="recipe__item">{pet.pet}</span>
                    )}
                  </td>
                  <td data-label="สนิท 1">{pet.level1}</td>
                  <td data-label="สนิท 2">{pet.level2}</td>
                  <td data-label="ของที่ใช้จับ">
                    {pet.tamingId ? (
                      <Link className="recipe__item" href={itemHref(pet.tamingId, null)}>
                        <ItemIcon iconUrl={`/images/items/${pet.tamingId}.gif`} category="Other" size={20} />
                        <span>{pet.taming}</span>
                      </Link>
                    ) : (
                      <span className="recipe__item">{pet.taming}</span>
                    )}
                  </td>
                  <td data-label="ของฝึกดรอปจาก">
                    {pet.sources.length === 0 ? (
                      <span className="muted">ไม่ระบุ</span>
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
            </tbody>
          </table>
        </div>
      </div>

      <section style={{ marginTop: 26 }}>
        <h2 className="section-title">NPC สัตว์เลี้ยงอยู่เมืองไหน</h2>
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
              {qpetTowns.map((town) => {
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
        โบนัสสเตตัสมาจากไกด์ภาษาฝรั่งเศส roz-global.info (อ่าน 8 ก.ย. 2026) เป็นแหล่งเดียว เพราะคำอธิบายไข่ในเกมไม่ได้เขียนไว้ ·
        ส่วน<strong>อัตราดรอปของฝึกตรวจกับตารางดรอปของเราแล้ว ตรงกัน 32 จาก 33 คู่ ไม่มีคู่ไหนขัดกันเลย</strong>
        (อีกคู่เป็นมอนชื่อ Pirate Swordsman ที่ไม่มีในฐานข้อมูลเรา) ·
        <strong>ไข่ไม่ได้ดรอปจากมอน</strong> — ตัวเลข % คืออัตราดรอปของ<em>ของที่ใช้จับ</em> ไม่ใช่ของไข่
        (ตอนแรกหน้านี้เขียนผิดเป็น &quot;ไข่ดรอปจาก&quot; แก้แล้ว 9 ก.ย. 2026)
      </Caveat>

      <p className="muted" style={{ marginTop: 16 }}>
        ดูต่อ: <Link href="/database/items?q=Egg">ไข่ทั้งหมดในฐานข้อมูล</Link> ·{' '}
        <Link href="/guides/job-change">เปลี่ยนอาชีพ 2</Link>
      </p>
    </main>
  );
}
