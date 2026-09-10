// "ซื้อได้จาก NPC" on an item page.
//
// The gap this fills is a question people type into Google and the site could
// not answer: where the cookbooks for /guides/cooking come from, where Milk is
// sold. The answer is a shop NPC, and nothing on the site knew about shop NPCs.
//
// Three things this deliberately does not do:
//
//   a price column. Every one of the 832 published rows charges the item's own
//   buy price -- not one carries a number of its own -- so the column read
//   "ราคาปกติ" on every row and said nothing the price block above it had not.
//
//   a table. Two short fields per row wrap into three lines on a phone under
//   the shared table styling; a list of lines does not.
//
//   more than five sellers at once. Aloe is sold by 24 NPCs, longer than the
//   rest of its page put together. The remainder sits in a closed <details>,
//   so the section keeps a fixed height and nothing is thrown away.
//
// The label is as important as the rows. This comes from rAthena's classic-RO
// shop scripts, and no source we hold lists Zero's shop NPCs, so the page says
// so rather than presenting a coordinate as a fact about this server.

import Link from 'next/link';
import { naviCommand } from '@/lib/rozglobal-guides';
import { shopsFor, type ShopEntry } from '@/lib/npc-shops';
import { mapDisplayName, shopNpcAt } from '@/lib/npcs';

const ALWAYS_VISIBLE = 5;

function Seller({ shop }: { shop: ShopEntry }) {
  // The same shopkeeper has a page in the NPC database, built from the same
  // scripts, so the name is a link to everything else they sell.
  const npc = shopNpcAt(shop.npc, shop.map, shop.x, shop.y);
  const place = mapDisplayName(shop.map);
  const navi = naviCommand(shop.map, shop.x, shop.y);
  return (
    <li className="shoprow">
      <span className="shoprow__who">
        {npc ? <Link href={`/database/npcs/${npc.slug}`}>{shop.npc}</Link> : shop.npc}
        {place && <span className="muted"> · {place}</span>}
      </span>
      {navi && <code className="mono navicmd shoprow__navi">{navi}</code>}
    </li>
  );
}

export default function ItemShops({ itemId }: { itemId: number }) {
  const shops = shopsFor(itemId);
  if (shops.length === 0) return null;

  const first = shops.slice(0, ALWAYS_VISIBLE);
  const rest = shops.slice(ALWAYS_VISIBLE);

  return (
    <div className="card" style={{ marginTop: 20 }}>
      <h2 className="section-title">ซื้อได้จาก NPC</h2>
      <p className="muted" style={{ marginTop: 0, marginBottom: 10, fontSize: 13 }}>
        ก๊อป <code className="mono">/navi</code> ไปวางในแชต เกมจะขึ้นเส้นนำทางให้เดินตาม
      </p>
      <ul className="shoplist">
        {first.map((shop) => (
          <Seller key={`${shop.npc}-${shop.map}-${shop.x}-${shop.y}`} shop={shop} />
        ))}
      </ul>
      {rest.length > 0 && (
        <details className="shopmore">
          <summary>ดูอีก {rest.length} ร้าน</summary>
          <ul className="shoplist">
            {rest.map((shop) => (
              <Seller key={`${shop.npc}-${shop.map}-${shop.x}-${shop.y}`} shop={shop} />
            ))}
          </ul>
        </details>
      )}
      <p className="muted" style={{ marginTop: 10, fontSize: 12.5 }}>
        <strong>ยังไม่ได้ยืนยันกับเซิร์ฟนี้</strong> — ผังร้านมาจากสคริปต์ NPC ของ rAthena ซึ่งเป็น RO คลาสสิก ·
        ฝั่ง Zero ไม่มีแหล่งไหนที่เรามีลงข้อมูลร้านค้าเลย — หน้า NPC ของทั้ง prontera และ rozerodb เป็น NPC เควสล้วน ·
        ของที่ขายกรองแล้วว่ามีอยู่จริงในฐานข้อมูลไอเทมของเกมนี้ และร้านในเมืองที่เกมนี้ยังไม่เปิดถูกตัดออกแล้ว
      </p>
    </div>
  );
}
