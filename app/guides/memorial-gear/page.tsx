// app/guides/memorial-gear/page.tsx
//
// The four-rank gear ladder from the memorial dungeons.
//
// The page exists because the ladder is the part nobody can read off an item:
// the client tells you what Subjugation Team's Armor does, and never that it
// turns into Expedition's Armor for 50 crystals and two Jellostones. It also
// exists because only one of the four ranks is wearable right now -- the cap
// is 60 and the other three want 70, 80 and 90 -- and a player at 60 deciding
// what to keep needs to see where each piece leads before it is useful.
//
// Stats are the client's own words (our items table). The ladder, the
// materials and the enchant rules come from roz-global.info, credited at the
// foot of the page; all 44 piece names matched our table and its HP/SP/DEF/
// FLEE figures agree with the client on all 44.
import Link from 'next/link';
import type { Metadata } from 'next';
import PageHeader from '@/components/PageHeader';
import Caveat from '@/components/Caveat';
import ItemIcon from '@/components/ItemIcon';
import JsonLd from '@/components/JsonLd';
import { breadcrumbJsonLd } from '@/lib/jsonld';
import { itemHref } from '@/lib/item-href';
import { LEVEL_CAP, loadMemorialGear, lookup, memorialGear, type GearPiece } from '@/lib/memorial-gear';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'ชุดดันเจี้ยนความทรงจำ Ragnarok Zero — 4 แรงค์ อัปเกรด และเอนแชนต์',
  description:
    'ชุด Subjugation → Expedition → Contingent → Conqueror ใน Ragnarok Zero Global ครบทุกชิ้น บอกค่าจากในเกม ชิ้นไหนอัปเป็นชิ้นไหน ใช้คริสตัลกี่ก้อน ใส่คู่กับอะไร และเอนแชนต์เสียเท่าไร เสี่ยงของหายไหม',
};

/** A piece: sprite, name, link, and what the game says it does. */
function PieceRow({ piece, dim }: { piece: GearPiece; dim: boolean }) {
  return (
    <tr className={dim ? 'gear--locked' : undefined}>
      <td data-label="ชิ้น">
        {piece.id === null ? (
          <span className="recipe__item">{piece.name}</span>
        ) : (
          <Link className="recipe__item" href={itemHref(piece.id, 'Armor')}>
            <ItemIcon iconUrl={piece.icon} category="Armor" size={22} />
            <span>{piece.name}</span>
          </Link>
        )}
      </td>
      <td data-label="เลเวล" className="num">{piece.level ?? '—'}</td>
      <td data-label="ผล" className="effect">
        <span className="effect__text">{piece.effect ?? '—'}</span>
      </td>
    </tr>
  );
}

function SetTable({ pieces, dim }: { pieces: GearPiece[]; dim: boolean }) {
  return (
    <div className="recipe__scroll">
      <table className="data-table recipe">
        <thead>
          <tr>
            <th>ชิ้น</th>
            <th className="num">เลเวล</th>
            <th>ผลจากในเกม</th>
          </tr>
        </thead>
        <tbody>
          {pieces.map((p) => (
            <PieceRow key={p.name} piece={p} dim={dim} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function MemorialGearPage() {
  const { ranks, items, failed } = await loadMemorialGear();
  const { stoneFor, stoneFromFragment, accessories, enchantRules } = memorialGear;
  // Counted from the ladder itself. Written as "44" it would go stale the
  // moment the guide is re-extracted with another set, and the site has just
  // spent a morning on exactly that class of bug.
  const pieceCount = memorialGear.sets.reduce((n, s) => n + s.pieces.length, 0);
  const open = ranks.filter((r) => r.open);
  const locked = ranks.filter((r) => !r.open);

  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'หน้าแรก', path: '/' },
          { name: 'ไกด์', path: '/guides' },
          { name: 'ชุดดันเจี้ยนความทรงจำ', path: '/guides/memorial-gear' },
        ])}
      />
      <PageHeader title="ชุดดันเจี้ยนความทรงจำ — 4 แรงค์" />
      <p className="muted" style={{ marginTop: -6, marginBottom: 16, maxWidth: '72ch' }}>
        ชุดนี้ไม่ได้หากันทีละชิ้น แต่ <strong>อัปต่อกันเป็นทอด</strong> — เก็บของแรงค์ IV ตอนนี้แล้วอัปขึ้นไปเรื่อยๆ
        ตอนเลเวลเปิดเพิ่ม · เลเวลสูงสุดตอนนี้คือ {LEVEL_CAP} จึงใส่ได้จริงแค่แรงค์เดียว ที่เหลือแสดงไว้ให้รู้ว่าของที่เก็บอยู่จะกลายเป็นอะไร
      </p>

      {failed && <p className="filterstate">โหลดข้อมูลไอเทมไม่สำเร็จ ค่าของแต่ละชิ้นอาจไม่ขึ้น</p>}

      {/* The stat text is left in English on purpose: the Global client is in
          English, so this is the wording a player sees on the item in game.
          Translating it would make the page and the item window disagree. */}
      <p className="muted" style={{ fontSize: 13, marginTop: 0 }}>
        ช่อง &quot;ผลจากในเกม&quot; คือข้อความบนไอเทมในเกมตรงๆ ไม่ได้แปล — จะได้ตรงกับที่เห็นตอนกดดูของ
      </p>

      <section className="card card--cyan">
        <h2 className="section-title">สายอัปเกรด</h2>
        <div className="recipe__scroll">
          <table className="data-table recipe">
            <thead>
              <tr>
                <th>แรงค์</th>
                <th>ชื่อ</th>
                <th className="num">ใส่ได้ที่เลเวล</th>
                <th>ได้มาจาก</th>
                <th>สถานะตอนนี้</th>
              </tr>
            </thead>
            <tbody>
              {ranks.map((r) => (
                <tr key={r.rank}>
                  <td data-label="แรงค์">{r.rank}</td>
                  <td data-label="ชื่อ"><strong>{r.name}</strong></td>
                  <td data-label="เลเวล" className="num">{r.level}</td>
                  <td data-label="ได้มาจาก">
                    {r.from}
                    {r.crystal && (
                      <>
                        {' · '}
                        <MaterialLink piece={lookup(items, r.crystal)} /> ×{r.crystalAmount}
                      </>
                    )}
                    {!r.crystal && r.crystalAmount > 0 && ' · คริสตัลอีกชนิด ×50 (ยังไม่มีในฐานข้อมูลเรา)'}
                  </td>
                  <td data-label="สถานะ">
                    {r.open ? <span className="gearstate gearstate--open">ใส่ได้</span> : <span className="gearstate">ยังใส่ไม่ได้</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="muted" style={{ marginTop: 12, fontSize: 13 }}>
          ทุกขั้นใช้ของแรงค์ก่อนหน้า 1 ชิ้น + คริสตัล 50 ก้อน + Jellostone ตามชิ้น — ของเดิมหายไปกลายเป็นชิ้นใหม่
        </p>
      </section>

      {open.map((r) => (
        <section key={r.rank} style={{ marginTop: 26 }}>
          <h2 className="section-title">
            แรงค์ {r.rank} · {r.name} <span className="muted" style={{ fontWeight: 400 }}>· ใส่ได้ตอนนี้</span>
          </h2>
          <p className="muted" style={{ marginTop: 2, marginBottom: 10, fontSize: 13 }}>
            ได้จากหีบในดันเจี้ยนความทรงจำโหมดปกติ — <Link href="/database/maps/prt_sewb1">ท่อ Prontera</Link> และ{' '}
            <Link href="/database/maps/orcsdun01">ถ้ำออร์ค Geffen</Link>
          </p>
          {r.sets.map((s) => (
            <SetTable key={s.role} pieces={s.pieces} dim={false} />
          ))}
        </section>
      ))}

      <section style={{ marginTop: 30 }}>
        <h2 className="section-title">แรงค์ที่ยังใส่ไม่ได้</h2>
        <p className="muted" style={{ marginTop: 2, marginBottom: 12, maxWidth: '70ch', fontSize: 13 }}>
          ต้องเลเวล {locked.map((r) => r.level).join(' / ')} ซึ่งเกินเพดาน {LEVEL_CAP} ตอนนี้ · เอามาลงไว้เพราะมันคือปลายทางของชิ้นที่คุณกำลังเก็บ
          แต่ละแรงค์แยกเป็นชุดตามสายที่เล่น ใส่ครบ 4 ชิ้นในชุดเดียวกันถึงจะได้โบนัสเซ็ต
        </p>
        {locked.map((r) => (
          <div key={r.rank} style={{ marginTop: 18 }}>
            <h3 className="section-title" style={{ fontSize: 15 }}>
              แรงค์ {r.rank} · {r.name} <span className="muted" style={{ fontWeight: 400 }}>· เลเวล {r.level}</span>
            </h3>
            {r.sets.map((s) => (
              <div key={s.role} style={{ marginTop: 10 }}>
                <p className="muted" style={{ margin: '0 0 6px', fontSize: 13 }}>{s.role}</p>
                <SetTable pieces={s.pieces} dim />
              </div>
            ))}
          </div>
        ))}
      </section>

      <section style={{ marginTop: 30 }}>
        <h2 className="section-title">Jellostone ทำจากอะไร</h2>
        <p className="muted" style={{ marginTop: 2, marginBottom: 10, fontSize: 13 }}>
          หินก้อนหนึ่งใช้เศษ 5 ชิ้น — เศษดรอปจากมอนที่ชื่อตรงกับหิน
        </p>
        <div className="recipe__scroll">
          <table className="data-table recipe">
            <thead>
              <tr>
                <th>หิน</th>
                <th>ทำจาก</th>
              </tr>
            </thead>
            <tbody>
              {stoneFromFragment.map((s) => (
                <tr key={s.stone}>
                  <td data-label="หิน"><MaterialLink piece={lookup(items, s.stone)} /></td>
                  <td data-label="ทำจาก">
                    <MaterialLink piece={lookup(items, s.fragment)} /> ×{s.amount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3 className="section-title" style={{ fontSize: 15, marginTop: 20 }}>ชิ้นไหนใช้หินอะไร</h3>
        <p className="muted" style={{ marginTop: 2, marginBottom: 10, fontSize: 13 }}>
          แหล่งที่มาลงไว้ {Object.keys(stoneFor).length} ชิ้นจาก {pieceCount} ชิ้น ที่เหลือเขาไม่ได้ลงตาราง — <strong>ไม่ใช่ว่าไม่ต้องใช้</strong>
        </p>
        <div className="recipe__scroll">
          <table className="data-table recipe">
            <thead>
              <tr>
                <th>ชิ้นที่ได้</th>
                <th>ใช้หิน</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(stoneFor).map(([piece, stones]) => (
                <tr key={piece}>
                  <td data-label="ชิ้น"><MaterialLink piece={lookup(items, piece)} /></td>
                  <td data-label="หิน">
                    <span className="recipe__list">
                      {stones.map((s) => (
                        <span key={s.stone}>
                          <MaterialLink piece={lookup(items, s.stone)} /> ×{s.amount}
                        </span>
                      ))}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section style={{ marginTop: 30 }}>
        <h2 className="section-title">เครื่องประดับ 4 ชิ้น — คนละสายกับชุด</h2>
        <p className="muted" style={{ marginTop: 2, marginBottom: 10, maxWidth: '70ch', fontSize: 13 }}>
          ไม่ได้อยู่ในสายอัปเกรด ทำเองจากอัญมณีที่ดรอปในดันเจี้ยนโหมดยาก ดันเจี้ยนละชิ้น
        </p>
        <div className="recipe__scroll">
          <table className="data-table recipe">
            <thead>
              <tr>
                <th>ชิ้น</th>
                <th>ข้าง</th>
                <th>วัตถุดิบ</th>
                <th>ดันเจี้ยน (โหมดยาก)</th>
              </tr>
            </thead>
            <tbody>
              {accessories.map((a) => (
                <tr key={a.name}>
                  <td data-label="ชิ้น"><MaterialLink piece={lookup(items, a.name)} /></td>
                  <td data-label="ข้าง">{a.side}</td>
                  <td data-label="วัตถุดิบ">
                    <span className="recipe__list">
                      {a.materials.map((m) => (
                        <span key={m.item}>
                          <MaterialLink piece={lookup(items, m.item)} /> ×{m.amount}
                        </span>
                      ))}
                    </span>
                  </td>
                  <td data-label="ดันเจี้ยน">{a.dungeon ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section style={{ marginTop: 30 }}>
        <h2 className="section-title">เอนแชนต์</h2>
        <p className="muted" style={{ marginTop: 2, marginBottom: 10, maxWidth: '70ch', fontSize: 13 }}>
          ใส่ได้เฉพาะเกราะ และลงในสล็อตที่ต่างกันตามแรงค์ · <strong>ใส่ไม่มีความเสี่ยง แต่ถอดด้วยเงินมีโอกาสของหาย 30%</strong>
        </p>
        <div className="recipe__scroll">
          <table className="data-table recipe">
            <thead>
              <tr>
                <th>ทำอะไร</th>
                <th>เสีย</th>
                <th>โอกาสของหาย</th>
              </tr>
            </thead>
            <tbody>
              {enchantRules.costs.map((c, i) => (
                <tr key={`${c.action}-${i}`}>
                  <td data-label="ทำอะไร">{c.action}</td>
                  <td data-label="เสีย">{c.cost}</td>
                  <td data-label="โอกาสของหาย">{c.destroyChance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="recipe__scroll" style={{ marginTop: 14 }}>
          <table className="data-table recipe">
            <thead>
              <tr>
                <th>แรงค์</th>
                <th>ใส่ที่</th>
                <th className="num">สล็อตที่</th>
              </tr>
            </thead>
            <tbody>
              {enchantRules.slotByRank.map((s) => (
                <tr key={s.rank}>
                  <td data-label="แรงค์">{s.rank}</td>
                  <td data-label="ใส่ที่">{s.piece}</td>
                  <td data-label="สล็อต" className="num">{s.slot ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="muted" style={{ marginTop: 12, fontSize: 13 }}>
          ตัว Essence เป็นไอเทมในเกม แยกตามอาชีพและมี Lv.1 กับ Lv.2 —{' '}
          <Link href="/database/items?q=Essence+Lv">ดูรายการและผลของแต่ละอัน</Link>
        </p>

        <h3 className="section-title" style={{ fontSize: 15, marginTop: 22 }}>สุ่มได้อะไรบ้าง</h3>
        <p className="muted" style={{ marginTop: 2, marginBottom: 10, maxWidth: '70ch', fontSize: 13 }}>
          หนึ่งครั้งได้หนึ่งอย่างจากตารางนี้ · <strong>+2 ของทุกสเตตัสหายากมาก</strong> ในเกราะอยู่ที่ 0.09% ต่อสเตตัส
          แต่ในรองเท้าขึ้นไปถึง 3.57% — ถ้าจะลุ้น +2 ลุ้นที่รองเท้าคุ้มกว่าเยอะ
        </p>
        <div className="recipe__scroll">
          <table className="data-table recipe">
            <thead>
              <tr>
                <th>ได้</th>
                <th className="num">เกราะ</th>
                <th className="num">ผ้าคลุม</th>
                <th className="num">รองเท้า</th>
              </tr>
            </thead>
            <tbody>
              {enchantRules.outcomes.map((o) => (
                <tr key={`${o.stat}-${o.value}`}>
                  <td data-label="ได้">{o.stat} {o.value}</td>
                  <td data-label="เกราะ" className="num">{pct(o.armor)}</td>
                  <td data-label="ผ้าคลุม" className="num">{pct(o.garment)}</td>
                  <td data-label="รองเท้า" className="num">{pct(o.shoes)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="muted" style={{ marginTop: 10, fontSize: 13 }}>
          &quot;—&quot; คือช่องนั้นไม่มีผลแบบนี้ในตารางเลย ไม่ใช่ 0% ·
          ทั้งสามช่องรวมกันได้ 100.00% พอดี ซึ่งเป็นเหตุผลที่เชื่อว่าเป็นตัวเลขจากเกมจริง ไม่ใช่คนกะเอา
        </p>
      </section>

      <Caveat label="เชื่อได้แค่ไหน">
        ค่าของแต่ละชิ้นในตารางด้านบนเป็น<strong>ข้อความจากในเกม</strong>ที่เก็บไว้ในฐานข้อมูลเว็บนี้ ไม่ได้แปลหรือสรุปใหม่ ·
        ส่วนสายอัปเกรด วัตถุดิบ และกติกาเอนแชนต์มาจากไกด์ภาษาฝรั่งเศส roz-global.info (อ่าน 8 ก.ย. 2026)
        ซึ่งเป็นข้อมูลที่ไคลเอนต์ไม่ได้บอก — ตรวจแล้วว่าชื่อชิ้นทั้ง {pieceCount} ชิ้นตรงกับฐานข้อมูลเรา และตัวเลข HP/SP/DEF/FLEE ตรงกับในเกมทุกชิ้น ·
        <strong>แรงค์ III ขึ้นไปยังไม่มีใครในเซิร์ฟโกลบอลทดสอบได้</strong> เพราะเลเวลยังไม่ถึง ถ้าเปิดแล้วตัวเลขไม่ตรง บอกได้เลย
      </Caveat>

      <p className="muted" style={{ marginTop: 16 }}>
        ดูต่อ: <Link href="/database/equipment">ฐานข้อมูลอุปกรณ์</Link> ·{' '}
        <Link href="/tools/refine">คำนวณตีบวก</Link> ·{' '}
        <Link href="/database/cards">การ์ดใส่ช่องไหน</Link>
      </p>
    </main>
  );
}

/** A rate as the guide gives it, or a dash when that roll is not on the list.
 *  Deliberately not "0%": no chance and not listed are different claims. */
function pct(value: number | null): string {
  return value === null ? '—' : `${value.toFixed(2)}%`;
}

/** A material or piece as a linked chip, or plain text when we do not stock it. */
function MaterialLink({ piece }: { piece: GearPiece }) {
  if (piece.id === null) return <span className="recipe__item">{piece.name}</span>;
  return (
    <Link className="recipe__item" href={itemHref(piece.id, null)}>
      <ItemIcon iconUrl={piece.icon} category="Other" size={20} />
      <span>{piece.name}</span>
    </Link>
  );
}
