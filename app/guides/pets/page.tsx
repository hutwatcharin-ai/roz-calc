// app/guides/pets/page.tsx
//
// The pet eggs: what each one gives, what tames it, and what drops it.
//
// The stat bonus is the reason the page exists. It is nowhere in the item
// description -- an egg's text says nothing about LUK +2 -- so a player
// cannot compare pets from our own database at all.
//
// The drop rates come with a finding attached: our monster_drops has no rows
// for pet eggs at all, none of the 26, so there was nothing to check them
// against. The page says so instead of implying two sources agreed.
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
    'สัตว์เลี้ยงใน Ragnarok Zero Global ทุกตัว บอกโบนัสสเตตัสตอนสนิทระดับ 1 และ 2 ของที่ใช้จับ ไข่ดรอปจากมอนตัวไหนกี่เปอร์เซ็นต์ และ NPC สัตว์เลี้ยงอยู่เมืองไหนพร้อมพิกัด',
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
        โบนัสนี้ไม่ได้เขียนไว้ในคำอธิบายไข่ในเกม จึงเทียบจากฐานข้อมูลเฉยๆ ไม่ได้
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
                <th>ไข่ดรอปจาก</th>
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
                  <td data-label="ไข่ดรอปจาก">
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
        โบนัสสเตตัส ของที่ใช้จับ และอัตราดรอปของไข่ มาจากไกด์ภาษาฝรั่งเศส roz-global.info (อ่าน 8 ก.ย. 2026) ·
        ไข่และของที่ใช้จับ<strong>ตรวจแล้วว่ามีอยู่จริงในฐานข้อมูลไอเทมของเรา</strong> และลิงก์ไปดูได้ ·
        แต่<strong>อัตราดรอปตรวจไม่ได้</strong> เพราะตาราง monster_drops ของเราไม่มีแถวของไข่สัตว์เลี้ยงเลยสักตัวจาก {qpets.length} ตัว —
        เป็นช่องว่างของข้อมูลเรา ไม่ใช่ข้อผิดของไกด์ ตัวเลขนี้จึงมาจากแหล่งเดียว
      </Caveat>

      <p className="muted" style={{ marginTop: 16 }}>
        ดูต่อ: <Link href="/database/items?q=Egg">ไข่ทั้งหมดในฐานข้อมูล</Link> ·{' '}
        <Link href="/guides/job-change">เปลี่ยนอาชีพ 2</Link>
      </p>
    </main>
  );
}
