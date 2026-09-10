// app/tools/zeny-farm/page.tsx
//
// UNLISTED. Not in the nav, not in the sitemap, and marked noindex: this is a
// draft the site owner asked to see before it is offered to anyone else.
// Deleting the folder is the whole rollback.
//
// The question: kill things, sell what falls -- which map pays best. Same
// shape of answer as /tools/leveling-spots, which ranks by EXP: value per HP
// weighted by how many monsters stand there, with the two raw numbers printed
// beside it so a reader can check the ranking rather than trust it.
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import { supabaseBrowser } from '@/lib/supabase';
import { fetchAllRows } from '@/lib/fetch-all-rows';
import { getMapCanonical } from '@/lib/map-canonical';
import { isCVariant } from '@/lib/c-variant';
import { mapDisplayName } from '@/lib/npcs';
import { rankMaps, walkInReason, zenyPerKill, type MonsterValue } from '@/lib/zeny-farm';

export const revalidate = 86400;

export const metadata = {
  title: 'ฟาร์มเงินที่ไหนดี (ฉบับร่าง)',
  description: 'จัดอันดับแมพตามมูลค่าของที่ดรอปแล้วขายร้าน NPC — ฉบับร่าง ยังไม่เผยแพร่',
  robots: { index: false, follow: false },
};

const MAPS_SHOWN = 40;
const MONSTERS_SHOWN = 60;

export default async function ZenyFarmPage() {
  const db = supabaseBrowser();

  const [drops, items, monsters, spawns, canonical] = await Promise.all([
    fetchAllRows<{ monster_id: number; item_id: number; rate: number | null }>((from, to) =>
      db.from('monster_drops').select('monster_id, item_id, rate').range(from, to),
    ),
    fetchAllRows<{ id: number; name_en: string; sell_price: number | null }>((from, to) =>
      db.from('items').select('id, name_en, sell_price').range(from, to),
    ),
    fetchAllRows<{ id: number; name_en: string; level: number | null; hp: number | null }>((from, to) =>
      db.from('monsters').select('id, name_en, level, hp').range(from, to),
    ),
    fetchAllRows<{ map_code: string; monster_id: number; amount: number | null }>((from, to) =>
      db.from('monster_spawns').select('map_code, monster_id, amount').range(from, to),
    ),
    getMapCanonical(),
  ]);

  const mapNames = await fetchAllRows<{ map_code: string; map_display_name: string | null }>((from, to) =>
    db.from('map_stats').select('map_code, map_display_name').range(from, to),
  );
  const nameOf = new Map((mapNames.data ?? []).map((row) => [row.map_code, row.map_display_name]));

  const sell = new Map((items.data ?? []).map((item) => [item.id, item.sell_price]));
  const itemName = new Map((items.data ?? []).map((item) => [item.id, item.name_en]));
  const dropsByMonster = new Map<number, { itemId: number; rate: number | null; sellPrice: number | null }[]>();
  for (const drop of drops.data ?? []) {
    const list = dropsByMonster.get(drop.monster_id) ?? [];
    list.push({ itemId: drop.item_id, rate: drop.rate, sellPrice: sell.get(drop.item_id) ?? null });
    dropsByMonster.set(drop.monster_id, list);
  }

  const values = new Map<number, MonsterValue>();
  for (const monster of monsters.data ?? []) {
    // Challenge clones are opt-in everywhere else on this site, and a ranking
    // that offers "C2 Raydric" is offering a monster most readers never meet.
    if (isCVariant(monster.name_en)) continue;
    const { perKill, unpriced } = zenyPerKill(dropsByMonster.get(monster.id) ?? []);
    if (perKill <= 0) continue;
    values.set(monster.id, { id: monster.id, name: monster.name_en, level: monster.level, hp: monster.hp, perKill, unpriced });
  }

  // A monster that only exists inside WoE or a memorial dungeon is not
  // farmable, and the treasure chests top the per-kill list without this.
  const reachable = new Set(
    (spawns.data ?? []).filter((row) => !walkInReason(canonical.byCode[row.map_code] ?? row.map_code)).map((row) => row.monster_id),
  );
  for (const id of [...values.keys()]) if (!reachable.has(id)) values.delete(id);

  const picks = rankMaps(
    (spawns.data ?? []).map((row) => ({ mapCode: row.map_code, monsterId: row.monster_id, amount: row.amount })),
    values,
    { canonicalOf: (code) => canonical.byCode[code] ?? code },
  );

  // Channels the canonical rule keeps apart (an event channel holds one extra
  // monster, so it is not strictly a copy) still read as the same place. They
  // are collapsed for display, with the count named.
  const shown: { pick: (typeof picks)[number]; name: string; channels: number; fingerprint: string }[] = [];
  for (const pick of picks) {
    const name = nameOf.get(pick.mapCode) ?? mapDisplayName(pick.mapCode) ?? pick.mapCode;
    // Same monsters in the same numbers with the same score is the same place,
    // whatever our map table calls it -- iz_dun02 and iz_d02_a are one dungeon
    // under two names.
    const fingerprint = `${pick.mobs}|${pick.top.map((row) => `${row.id}x${row.amount}`).join(',')}`;
    const twin = shown.find(
      (row) => row.fingerprint === fingerprint && Math.abs(row.pick.score - pick.score) < 0.01,
    );
    if (twin) {
      twin.channels += 1;
      // Prefer the shortest code: iz_dun02 rather than iz_d02_a.
      if (pick.mapCode.length < twin.pick.mapCode.length) {
        twin.pick = pick;
        twin.name = name;
      }
      continue;
    }
    shown.push({ pick, name, channels: 1, fingerprint });
  }

  const byKill = [...values.values()].sort((a, b) => b.perKill - a.perKill).slice(0, MONSTERS_SHOWN);
  const pricedItems = (items.data ?? []).filter((item) => item.sell_price && item.sell_price > 0).length;
  const ratedDrops = (drops.data ?? []).filter((drop) => drop.rate !== null).length;

  /** The best-selling drop a monster has, for the "what am I picking up" column. */
  function bestDrop(id: number): { name: string; value: number } | null {
    const rows = (dropsByMonster.get(id) ?? []).filter((row) => row.rate !== null && row.sellPrice);
    if (rows.length === 0) return null;
    const best = rows.reduce((a, b) => ((a.rate as number) * (a.sellPrice as number) >= (b.rate as number) * (b.sellPrice as number) ? a : b));
    return { name: itemName.get(best.itemId) ?? `#${best.itemId}`, value: ((best.rate as number) / 10000) * (best.sellPrice as number) };
  }

  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <PageHeader title="ฟาร์มเงินที่ไหนดี" />
      <p className="card card--yellow" style={{ marginTop: 12 }}>
        <strong>ฉบับร่าง ยังไม่เผยแพร่</strong> — หน้านี้ไม่มีในเมนู ไม่อยู่ใน sitemap และสั่งไม่ให้ Google เก็บไว้
        เปิดดูได้จากลิงก์ตรงเท่านั้น
      </p>

      <section className="card" style={{ marginTop: 14 }}>
        <h2 className="section-title">คิดยังไง</h2>
        <p style={{ marginTop: 8, maxWidth: '70ch', lineHeight: 1.6 }}>
          คะแนน = <strong>มูลค่าของที่ดรอปต่อการฆ่า 1 ตัว ÷ HP ของมัน × จำนวนตัวในแมพ</strong> — สูตรเดียวกับหน้า{' '}
          <Link href="/tools/leveling-spots">จุดฟาร์ม</Link> แต่เปลี่ยนจาก EXP เป็นเงิน · HP ใช้แทนเวลาที่ใช้ฆ่า
          จำนวนตัวใช้แทนว่ามีให้ตีต่อเนื่องแค่ไหน
        </p>
        <p className="muted" style={{ marginTop: 8, maxWidth: '70ch' }}>
          ตัวเลขนี้เป็น <strong>อย่างน้อยที่สุด</strong> ไม่ใช่ยอดจริง: ไอเทมในฐานข้อมูลมีราคาขายแค่ {pricedItems.toLocaleString('en-US')} จาก{' '}
          {(items.data ?? []).length.toLocaleString('en-US')} ชิ้น และดรอปมีอัตราตกแค่ {ratedDrops.toLocaleString('en-US')} จาก{' '}
          {(drops.data ?? []).length.toLocaleString('en-US')} แถว ของที่ไม่รู้ราคาหรือไม่รู้อัตราถูกนับเป็นศูนย์ ·
          ไม่คิดเป็น zeny ต่อชั่วโมง เพราะต้องเดาความเร็วฆ่าซึ่งเราไม่มีข้อมูล · แมพ WoE ห้องสมบัติ ปราสาท และ Memorial Dungeon ตัดออกแล้ว
          เพราะเดินเข้าไปเฉยๆ ไม่ได้
        </p>
      </section>

      <section className="card" style={{ marginTop: 14 }}>
        <h2 className="section-title">แมพที่คุ้มที่สุด {MAPS_SHOWN} อันดับ</h2>
        <table className="bptable">
          <thead>
            <tr>
              <th className="bptable__tier">#</th>
              <th>แมพ</th>
              <th className="bptable__qty">คะแนน</th>
              <th className="bptable__qty">จำนวนมอน</th>
              <th>ตัวที่ทำเงินให้มากสุดในแมพ</th>
            </tr>
          </thead>
          <tbody>
            {shown.slice(0, MAPS_SHOWN).map(({ pick, name, channels }, i) => (
              <tr key={pick.mapCode}>
                <td className="bptable__tier">{i + 1}</td>
                <td>
                  <Link href={`/database/maps/${encodeURIComponent(pick.mapCode)}`}>{name}</Link>
                  <span className="muted mono" style={{ marginInlineStart: 6, fontSize: 12 }}>{pick.mapCode}</span>
                  {channels > 1 && <span className="muted" style={{ marginInlineStart: 6, fontSize: 12 }}>· {channels} ช่อง</span>}
                </td>
                <td className="bptable__qty">{pick.score.toFixed(2)}</td>
                <td className="bptable__qty">{pick.mobs}</td>
                <td>
                  {pick.top.map((row, index) => (
                    <span key={row.id}>
                      {index > 0 && ' · '}
                      <Link href={`/database/monsters/${row.id}`}>{row.name}</Link>
                      <span className="muted"> {row.perKill.toFixed(1)}z ×{row.amount}</span>
                    </span>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card" style={{ marginTop: 14 }}>
        <h2 className="section-title">ซาก 1 ตัวขายได้เท่าไร — {MONSTERS_SHOWN} ตัวแรก</h2>
        <p className="muted" style={{ marginTop: 0, marginBottom: 10, fontSize: 13 }}>
          คิดจากอัตราดรอปคูณราคาขายร้าน NPC ของทุกชิ้นที่มันดรอป — ไม่ได้แปลว่าฆ่าตัวเดียวได้เท่านี้ทุกครั้ง แต่เป็นค่าเฉลี่ยระยะยาว
        </p>
        <table className="bptable">
          <thead>
            <tr>
              <th className="bptable__tier">#</th>
              <th>มอนสเตอร์</th>
              <th className="bptable__qty">zeny/ตัว</th>
              <th className="bptable__qty">HP</th>
              <th>ของที่ทำเงินให้มากสุด</th>
            </tr>
          </thead>
          <tbody>
            {byKill.map((monster, i) => {
              const best = bestDrop(monster.id);
              return (
                <tr key={monster.id}>
                  <td className="bptable__tier">{i + 1}</td>
                  <td>
                    <Link href={`/database/monsters/${monster.id}`}>{monster.name}</Link>
                    {monster.level != null && <span className="muted"> Lv {monster.level}</span>}
                  </td>
                  <td className="bptable__qty">{monster.perKill.toFixed(1)}</td>
                  <td className="bptable__qty">{monster.hp?.toLocaleString('en-US') ?? '—'}</td>
                  <td>
                    {best ? (
                      <>
                        {best.name} <span className="muted">{best.value.toFixed(1)}z</span>
                      </>
                    ) : (
                      '—'
                    )}
                    {monster.unpriced > 0 && (
                      <span className="muted" style={{ marginInlineStart: 6, fontSize: 12 }}>· อีก {monster.unpriced} ชิ้นไม่รู้ราคา</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </main>
  );
}
