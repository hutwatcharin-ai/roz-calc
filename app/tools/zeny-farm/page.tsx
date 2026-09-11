// app/tools/zeny-farm/page.tsx
//
// UNLISTED. Not in the nav, not in the sitemap, and marked noindex: this is a
// draft the site owner asked to see before it is offered to anyone else.
// Deleting the folder is the whole rollback.
//
// The question: kill things, sell what falls -- which map pays best. Same
// shape of answer as /tools/leveling-spots, which ranks by EXP: value per HP
// weighted by how many monsters stand there, with the raw numbers printed
// beside it so a reader can check the ranking rather than trust it.
//
// Layout rebuilt 11 Sep 2026 after the owner's verdict on a phone: "only data,
// no pictures". The first version was two five-column tables; at 390px the
// monster column fell to one word per line and the page ran 14,607px, with the
// formula text filling the whole first screen before any answer. Now the answer
// comes first as cards carrying the map picture and monster sprites the site
// already serves, the long tails fold away, and the method sits at the bottom.
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import Caveat from '@/components/Caveat';
import ItemIcon from '@/components/ItemIcon';
import { supabaseBrowser } from '@/lib/supabase';
import { fetchAllRows } from '@/lib/fetch-all-rows';
import { getMapCanonical } from '@/lib/map-canonical';
import { mapImage } from '@/lib/map-image';
import { isCVariant } from '@/lib/c-variant';
import { mapDisplayName } from '@/lib/npcs';
import { rankMaps, walkInReason, zenyPerKill, type MapPick, type MonsterValue } from '@/lib/zeny-farm';

export const revalidate = 86400;

export const metadata = {
  title: 'ฟาร์มเงินที่ไหนดี (ฉบับร่าง)',
  description: 'จัดอันดับแมพตามมูลค่าของที่ดรอปแล้วขายร้าน NPC — ฉบับร่าง ยังไม่เผยแพร่',
  robots: { index: false, follow: false },
};

const PODIUM = 3;
const MAPS_OPEN = 10;
const MAPS_SHOWN = 40;
const MONSTERS_OPEN = 12;
const MONSTERS_SHOWN = 60;

const whole = (n: number) => Math.round(n).toLocaleString('en-US');
/** Small amounts keep a decimal so 0.4z does not read as nothing. */
const zeny = (n: number) => (n >= 100 ? whole(n) : n.toFixed(1));

type ShownMap = { pick: MapPick; name: string; channels: number; fingerprint: string };

export default async function ZenyFarmPage() {
  const db = supabaseBrowser();

  const [drops, items, monsters, spawns, canonical] = await Promise.all([
    fetchAllRows<{ monster_id: number; item_id: number; rate: number | null }>((from, to) =>
      db.from('monster_drops').select('monster_id, item_id, rate').range(from, to),
    ),
    fetchAllRows<{ id: number; name_en: string; sell_price: number | null; icon_url: string | null; category: string | null }>(
      (from, to) => db.from('items').select('id, name_en, sell_price, icon_url, category').range(from, to),
    ),
    fetchAllRows<{ id: number; name_en: string; level: number | null; hp: number | null; image_url: string | null }>((from, to) =>
      db.from('monsters').select('id, name_en, level, hp, image_url').range(from, to),
    ),
    fetchAllRows<{ map_code: string; monster_id: number; amount: number | null }>((from, to) =>
      db.from('monster_spawns').select('map_code, monster_id, amount').range(from, to),
    ),
    getMapCanonical(),
  ]);

  const mapNames = await fetchAllRows<{ map_code: string; map_display_name: string | null }>((from, to) =>
    db.from('map_stats').select('map_code, map_display_name').range(from, to),
  );

  // A failed read used to render three empty headings and nothing else --
  // seen on 11 Sep 2026 when two of the five queries hit "fetch failed". An
  // empty ranking reads as "no map pays", so say the read failed instead.
  const failed = [drops, items, monsters, spawns, mapNames].find((result) => result.error);
  if (failed) {
    console.error('zeny farm query failed', failed.error);
    return (
      <main className="shell" style={{ paddingBlock: 32 }}>
        <PageHeader title="ฟาร์มเงินที่ไหนดี" />
        <p className="muted">ดึงข้อมูลไม่สำเร็จ ลองรีเฟรชหน้านี้อีกครั้ง</p>
      </main>
    );
  }

  const nameOf = new Map((mapNames.data ?? []).map((row) => [row.map_code, row.map_display_name]));

  const itemById = new Map((items.data ?? []).map((item) => [item.id, item]));
  const spriteOf = new Map((monsters.data ?? []).map((monster) => [monster.id, monster.image_url]));
  const dropsByMonster = new Map<number, { itemId: number; rate: number | null; sellPrice: number | null }[]>();
  for (const drop of drops.data ?? []) {
    const list = dropsByMonster.get(drop.monster_id) ?? [];
    list.push({ itemId: drop.item_id, rate: drop.rate, sellPrice: itemById.get(drop.item_id)?.sell_price ?? null });
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
  const shown: ShownMap[] = [];
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
  const ranked = shown.slice(0, MAPS_SHOWN);

  const byKill = [...values.values()].sort((a, b) => b.perKill - a.perKill).slice(0, MONSTERS_SHOWN);
  const pricedItems = (items.data ?? []).filter((item) => item.sell_price && item.sell_price > 0).length;
  const ratedDrops = (drops.data ?? []).filter((drop) => drop.rate !== null).length;

  /** The drop that earns a monster most, for the "what am I picking up" line. */
  function bestDrop(id: number) {
    const rows = (dropsByMonster.get(id) ?? []).filter((row) => row.rate !== null && row.sellPrice);
    if (rows.length === 0) return null;
    const best = rows.reduce((a, b) => ((a.rate as number) * (a.sellPrice as number) >= (b.rate as number) * (b.sellPrice as number) ? a : b));
    const item = itemById.get(best.itemId);
    return {
      name: item?.name_en ?? `#${best.itemId}`,
      icon: item?.icon_url ?? null,
      category: item?.category ?? null,
      value: ((best.rate as number) / 100) * (best.sellPrice as number),
    };
  }

  function MapCard({ row, rank, big }: { row: ShownMap; rank: number; big?: boolean }) {
    const { pick, name, channels } = row;
    const href = `/database/maps/${encodeURIComponent(pick.mapCode)}`;
    const picture = mapImage(pick.mapCode);
    return (
      <li className={`zfmap${big ? ' zfmap--big' : ''}`}>
        {/* The picture repeats the name link beside it, so it is hidden from
            the keyboard and screen readers rather than announced twice. */}
        <Link href={href} className="zfmap__pic" tabIndex={-1} aria-hidden="true">
          {picture ? (
            <img src={picture.src} alt="" loading={rank === 1 ? 'eager' : 'lazy'} decoding="async" />
          ) : (
            <span className="zfmap__nopic">ไม่มีรูปแมพ</span>
          )}
          {big && <span className="zfmap__badge">#{rank}</span>}
        </Link>
        <div className="zfmap__body">
          <div className="zfmap__head">
            {!big && <span className="zfmap__num">#{rank}</span>}
            <Link href={href} className="zfmap__name">
              {name}
            </Link>
          </div>
          <div className="zfmap__code">
            {pick.mapCode}
            {channels > 1 && ` · ${channels} ช่อง`}
          </div>
          <dl className="zfmap__stats">
            {/* No "≈" inside the number: the mono face draws it as a rupee
                sign. "ราว" says the same thing in the label's own font. */}
            <div>
              <dt>ฆ่าครบ 1 รอบได้ราว</dt>
              <dd className="zf-money">{whole(pick.roundZeny)}z</dd>
            </div>
            <div>
              <dt>มอน</dt>
              <dd>
                {pick.mobs}
                <span className="zf-unit"> ตัว</span>
              </dd>
            </div>
            <div>
              <dt>คะแนน</dt>
              <dd>{pick.score.toFixed(0)}</dd>
            </div>
          </dl>
          <ul className="zfmob" aria-label="ตัวที่ทำเงินให้มากสุดในแมพ">
            {pick.top.map((mob) => (
              <li key={mob.id}>
                <Link href={`/database/monsters/${mob.id}`}>
                  {spriteOf.get(mob.id) && <img src={spriteOf.get(mob.id) as string} alt="" loading="lazy" decoding="async" />}
                  <span className="zfmob__name">{mob.name}</span>
                  <span className="zfmob__z">
                    {zeny(mob.perKill)}z ×{mob.amount}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </li>
    );
  }

  function MonsterTile({ monster }: { monster: MonsterValue }) {
    const best = bestDrop(monster.id);
    const sprite = spriteOf.get(monster.id);
    return (
      <li className="zfmon">
        <Link href={`/database/monsters/${monster.id}`}>
          {sprite ? (
            <img className="zfmon__sprite" src={sprite} alt="" loading="lazy" decoding="async" />
          ) : (
            <span className="zfmon__sprite" aria-hidden="true" />
          )}
          <span className="zfmon__body">
            <span className="zfmon__name">
              {monster.name}
              {monster.level != null && <span className="zfmon__lv"> Lv {monster.level}</span>}
            </span>
            <span className="zfmon__zeny">
              {zeny(monster.perKill)}z<small>ต่อตัว</small>
            </span>
            {best && (
              <span className="zfmon__drop">
                <ItemIcon iconUrl={best.icon} category={best.category} size={20} />
                <span className="zfmon__dropname">
                  {best.name} ≈{zeny(best.value)}z
                </span>
              </span>
            )}
          </span>
        </Link>
      </li>
    );
  }

  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <PageHeader title="ฟาร์มเงินที่ไหนดี" lead="ตีมอนแล้วเก็บของที่ดรอปไปขายร้าน NPC — แมพไหนได้เงินมากสุด">
        <span className="zf-draft">ฉบับร่าง · ลิงก์ลับ</span>
      </PageHeader>

      <section className="zf-section" aria-labelledby="zf-podium">
        <h2 id="zf-podium" className="section-title">
          3 แมพที่คุ้มสุด
        </h2>
        <ol className="zf-podium">
          {ranked.slice(0, PODIUM).map((row, i) => (
            <MapCard key={row.pick.mapCode} row={row} rank={i + 1} big />
          ))}
        </ol>
      </section>

      <section className="zf-section" aria-labelledby="zf-maps">
        <h2 id="zf-maps" className="section-title">
          อันดับ {PODIUM + 1}–{MAPS_OPEN}
        </h2>
        <ol className="zf-maplist">
          {ranked.slice(PODIUM, MAPS_OPEN).map((row, i) => (
            <MapCard key={row.pick.mapCode} row={row} rank={PODIUM + i + 1} />
          ))}
        </ol>
        {ranked.length > MAPS_OPEN && (
          <details className="zf-more">
            <summary>
              ดูอันดับ {MAPS_OPEN + 1}–{ranked.length}
            </summary>
            <ol className="zf-maplist">
              {ranked.slice(MAPS_OPEN).map((row, i) => (
                <MapCard key={row.pick.mapCode} row={row} rank={MAPS_OPEN + i + 1} />
              ))}
            </ol>
          </details>
        )}
      </section>

      <section className="zf-section" aria-labelledby="zf-monsters">
        <h2 id="zf-monsters" className="section-title">
          ซาก 1 ตัวขายได้เท่าไร
        </h2>
        <p className="zf-section__note">ค่าเฉลี่ยระยะยาวจากอัตราดรอป × ราคาขายร้าน NPC ของทุกชิ้นที่มันดรอป</p>
        <ul className="zf-mongrid">
          {byKill.slice(0, MONSTERS_OPEN).map((monster) => (
            <MonsterTile key={monster.id} monster={monster} />
          ))}
        </ul>
        {byKill.length > MONSTERS_OPEN && (
          <details className="zf-more">
            <summary>ดูอีก {byKill.length - MONSTERS_OPEN} ตัว</summary>
            <ul className="zf-mongrid">
              {byKill.slice(MONSTERS_OPEN).map((monster) => (
                <MonsterTile key={monster.id} monster={monster} />
              ))}
            </ul>
          </details>
        )}
      </section>

      <Caveat label="คิดคะแนนยังไง และข้อจำกัดของตัวเลข">
        <p>
          คะแนน = <strong>มูลค่าของที่ดรอปต่อการฆ่า 1 ตัว ÷ HP ของมัน × จำนวนตัวในแมพ</strong> — สูตรเดียวกับหน้า{' '}
          <Link href="/tools/leveling-spots">ฟาร์มที่ไหนดี</Link> แต่เปลี่ยนจาก EXP เป็นเงิน · HP ใช้แทนเวลาที่ใช้ฆ่า
          จำนวนตัวใช้แทนว่ามีให้ตีต่อเนื่องแค่ไหน · &ldquo;ฆ่าครบ 1 รอบได้&rdquo; คือมูลค่าต่อตัว × จำนวนตัว รวมทุกตัวในแมพ
        </p>
        <p>
          ตัวเลขเป็น <strong>อย่างน้อยที่สุด</strong> ไม่ใช่ยอดจริง: ไอเทมในฐานข้อมูลมีราคาขายแค่ {pricedItems.toLocaleString('en-US')} จาก{' '}
          {(items.data ?? []).length.toLocaleString('en-US')} ชิ้น และดรอปมีอัตราตกแค่ {ratedDrops.toLocaleString('en-US')} จาก{' '}
          {(drops.data ?? []).length.toLocaleString('en-US')} แถว ของที่ไม่รู้ราคาหรืออัตราถูกนับเป็นศูนย์ · ไม่คิดเป็น zeny ต่อชั่วโมง
          เพราะต้องเดาความเร็วฆ่า · แมพ WoE ห้องสมบัติ ปราสาท และ Memorial Dungeon ตัดออกแล้ว เพราะเดินเข้าไปเฉยๆ ไม่ได้
        </p>
      </Caveat>
    </main>
  );
}
