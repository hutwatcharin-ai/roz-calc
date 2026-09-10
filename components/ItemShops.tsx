// "ซื้อได้จาก NPC" on an item page.
//
// The gap this fills is a question people type into Google and the site could
// not answer: where the cookbooks for /guides/cooking come from, where Milk is
// sold. The answer is a shop NPC, and nothing on the site knew about shop NPCs.
//
// The label is as important as the rows. This comes from rAthena's classic-RO
// shop scripts, and no source we hold lists Zero's shop NPCs, so the page says
// so rather than presenting a coordinate as a fact about this server.

import { naviCommand } from '@/lib/rozglobal-guides';
import { shopsFor } from '@/lib/npc-shops';

export default function ItemShops({ itemId }: { itemId: number }) {
  const shops = shopsFor(itemId);
  if (shops.length === 0) return null;

  return (
    <div className="card" style={{ marginTop: 20 }}>
      <h2 className="section-title">ซื้อได้จาก NPC</h2>
      <p className="muted" style={{ marginTop: 0, marginBottom: 10, fontSize: 13 }}>
        ก๊อป <code className="mono">/navi</code> ไปวางในแชต เกมจะขึ้นเส้นนำทางให้เดินตาม
      </p>
      <div className="recipe__scroll">
        <table className="data-table recipe">
          <thead>
            <tr>
              <th>NPC</th>
              <th>พิมพ์ในแชต</th>
              <th className="num">ราคา</th>
            </tr>
          </thead>
          <tbody>
            {shops.map((shop) => (
              <tr key={`${shop.npc}-${shop.map}-${shop.x}-${shop.y}`}>
                <td data-label="NPC">{shop.npc}</td>
                <td data-label="พิมพ์ในแชต">
                  <code className="mono navicmd">{naviCommand(shop.map, shop.x, shop.y)}</code>
                </td>
                <td data-label="ราคา" className="num">
                  {/* Null means the shop charges the item's own buy price,
                      which the price block on this page already states. */}
                  {shop.price === null ? <span className="muted">ราคาปกติ</span> : `${shop.price.toLocaleString('en-US')}z`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted" style={{ marginTop: 10, fontSize: 12.5 }}>
        <strong>ยังไม่ได้ยืนยันกับเซิร์ฟนี้</strong> — ผังร้านมาจากสคริปต์ NPC ของ rAthena ซึ่งเป็น RO คลาสสิก ·
        ฝั่ง Zero ไม่มีแหล่งไหนที่เรามีลงข้อมูลร้านค้าเลย — หน้า NPC ของทั้ง prontera และ rozerodb เป็น NPC เควสล้วน ·
        ของที่ขายกรองแล้วว่ามีอยู่จริงในฐานข้อมูลไอเทมของเกมนี้
      </p>
    </div>
  );
}
