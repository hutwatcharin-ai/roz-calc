// app/guides/costume-craft/page.tsx
//
// Headgear you have an NPC make for you: what to bring, and where to stand.
//
// /database/costumes lists cosmetic headgear and where it drops. This is the
// other half -- the ones nobody drops, that an NPC assembles out of ordinary
// materials. Neither the NPC nor the recipe is anywhere in our data; the
// materials are, so they link.
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
  title: 'คราฟต์หมวกแฟชั่น Ragnarok Zero — NPC ทำอะไรได้บ้าง ใช้ของอะไร',
  description:
    'หมวกและหน้ากากแฟชั่นใน Ragnarok Zero Global ที่ให้ NPC ทำให้ได้ บอกครบว่าต้องเอาของอะไรไปกี่ชิ้น NPC อยู่แมพไหน พร้อมพิกัด /navi ก๊อปไปวางในแชตได้เลย',
};

export default function CostumeCraftPage() {
  const { cosmetics } = rozglobalGuides;
  const linkedMaterials = cosmetics.reduce(
    (n, c) => n + c.materials.filter((m) => m.itemId !== null).length,
    0,
  );
  const totalMaterials = cosmetics.reduce((n, c) => n + c.materials.filter((m) => m.item !== 'Zeny').length, 0);

  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'หน้าแรก', path: '/' },
          { name: 'ไกด์', path: '/guides' },
          { name: 'คราฟต์หมวกแฟชั่น', path: '/guides/costume-craft' },
        ])}
      />
      <PageHeader title="คราฟต์หมวกแฟชั่น — เอาของไปให้ NPC ทำ" />
      <p className="muted" style={{ marginTop: -6, marginBottom: 16, maxWidth: '72ch' }}>
        หมวกพวกนี้<strong>ไม่มีมอนตัวไหนดรอป</strong> ต้องเก็บของไปให้ NPC ทำให้ · ก๊อป{' '}
        <code className="mono">/navi</code> ไปวางในแชตแล้วเดินไปได้เลย ·
        อยากได้หมวกที่ดรอปจากมอนดู <Link href="/database/costumes">ฐานข้อมูลคอสตูม</Link>
      </p>

      <div className="card">
        <div className="recipe__scroll">
          <table className="data-table recipe">
            <thead>
              <tr>
                <th>ได้หมวก</th>
                <th>เอาของไป</th>
                <th>NPC อยู่ที่</th>
              </tr>
            </thead>
            <tbody>
              {cosmetics.map((entry) => {
                const navi = naviCommand(entry.map, entry.x, entry.y);
                return (
                  <tr key={entry.item}>
                    <td data-label="ได้หมวก">
                      {entry.itemId ? (
                        <Link className="recipe__item" href={itemHref(entry.itemId, null)}>
                          <ItemIcon iconUrl={`/images/items/${entry.itemId}.gif`} category="Other" size={22} />
                          <span>{entry.item}</span>
                        </Link>
                      ) : (
                        <span className="recipe__item">{entry.item}</span>
                      )}
                    </td>
                    <td data-label="เอาของไป">
                      <span className="recipe__list">
                        {entry.materials.map((material, i) => (
                          <span key={`${material.item}-${i}`}>
                            {material.itemId ? (
                              <Link className="recipe__item" href={itemHref(material.itemId, null)}>
                                <ItemIcon iconUrl={`/images/items/${material.itemId}.gif`} category="Other" size={18} />
                                <span>{material.item}</span>
                              </Link>
                            ) : (
                              <span className="recipe__item">{material.item}</span>
                            )}
                            <span className="recipe__amount">×{material.amount.toLocaleString('en-US')}</span>
                          </span>
                        ))}
                      </span>
                    </td>
                    <td data-label="NPC">
                      {navi ? <code className="mono navicmd">{navi}</code> : <span className="muted">ไม่ทราบพิกัด</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Caveat label="เชื่อได้แค่ไหน">
        สูตรและพิกัด NPC มาจากไกด์ภาษาฝรั่งเศส roz-global.info (อ่าน 8 ก.ย. 2026) ·
        ของที่ใช้<strong>ตรวจกับฐานข้อมูลไอเทมของเราแล้ว {linkedMaterials} จาก {totalMaterials} ชิ้น</strong> และลิงก์ไปดูได้ —
        ที่เหลือชื่อไม่ตรงกับในตารางเรา จึงปล่อยเป็นตัวหนังสือเฉยๆ ไม่เดาว่าเป็นของชิ้นไหน ·
        พิกัด NPC ไม่มีแหล่งที่สองให้ตรวจ ถ้าเดินไปแล้วไม่เจอ บอกได้
      </Caveat>

      <p className="muted" style={{ marginTop: 16 }}>
        ดูต่อ: <Link href="/database/costumes">ฐานข้อมูลคอสตูม</Link> ·{' '}
        <Link href="/guides/pets">สัตว์เลี้ยง</Link> ·{' '}
        <Link href="/drop-finder">ค้นของดรอป</Link>
      </p>
    </main>
  );
}
