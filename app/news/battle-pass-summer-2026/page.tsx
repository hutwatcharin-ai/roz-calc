// app/news/battle-pass-summer-2026/page.tsx
//
// Thai write-up of the official Battle Pass (Summer) event notice
// (roz.mygnjoy.com, event 101). The tables and the numbers are the event's own
// facts; the wording, the layout and every link into this site's database are
// ours. Nothing from the notice's artwork is rehosted -- the icons on this
// page are the item sprites this site already serves, which is also what makes
// each row clickable.
//
// The reward tracks live in lib/battle-pass-summer.ts so they can be checked
// by a test rather than proofread by eye: 120 rows transcribed from a page
// nobody can re-read later once the event is over.
import Link from 'next/link';
import JsonLd from '@/components/JsonLd';
import ItemIcon from '@/components/ItemIcon';
import { articleJsonLd, breadcrumbJsonLd } from '@/lib/jsonld';
import { supabaseBrowser } from '@/lib/supabase';
import { itemHref } from '@/lib/item-href';
import {
  BATTLE_PASS_ITEM_ID,
  COSTUMES,
  EVENT,
  FREE_TRACK,
  PAID_TRACK,
  REWARDS,
  ZELSTAR,
  ZELSTAR_PER_TICKET,
  ZELSTAR_PER_TIER,
  coinTiers,
  itemIdsIn,
  type TierRow,
} from '@/lib/battle-pass-summer';

const PATH = '/news/battle-pass-summer-2026';
const PUBLISHED = '2026-09-10T18:00:00+07:00';
const MODIFIED = '2026-09-10T18:00:00+07:00';

export const metadata = {
  title: 'Battle Pass ฤดูร้อน 2569 Ragnarok Zero — รางวัลทุก Tier และวิธีเล่น',
  description:
    'สรุปอีเวนต์ Battle Pass (Summer) Ragnarok Zero Global เป็นภาษาไทย: ตารางรางวัลครบทั้งสาย Free 50 Tier และสาย Paid 70 Tier, วิธีเปิดสายเสียเงินด้วย Zelstar 70 ดวง, เควสรายวัน และคอสตูมฤดูร้อน 7 ชิ้นที่แลกด้วย Battle Coin 2026',
};

export const revalidate = 3600;

/** Icons come from our own table, so a row still reads correctly without them. */
async function loadIcons(): Promise<Map<number, { icon_url: string | null; category: string | null }>> {
  const ids = itemIdsIn(FREE_TRACK, PAID_TRACK);
  const { data, error } = await supabaseBrowser().from('items').select('id, icon_url, category').in('id', ids);
  if (error) {
    console.error('battle pass icon query failed', error);
    return new Map();
  }
  return new Map((data ?? []).map((r) => [r.id, { icon_url: r.icon_url, category: r.category }]));
}

function TrackTable({
  rows,
  icons,
  title,
  note,
}: {
  rows: TierRow[];
  icons: Map<number, { icon_url: string | null; category: string | null }>;
  title: string;
  note: string;
}) {
  return (
    <section className="card" style={{ marginTop: 14 }}>
      <h2 className="section-title">{title}</h2>
      <p className="muted" style={{ marginTop: 0, marginBottom: 10, fontSize: 13 }}>{note}</p>
      <table className="bptable">
        <thead>
          <tr>
            <th className="bptable__tier">Tier</th>
            <th>ของที่ได้</th>
            <th className="bptable__qty">จำนวน</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const reward = REWARDS[row.key];
            const meta = reward.id === null ? undefined : icons.get(reward.id);
            return (
              <tr key={row.tier} className={row.key === 'coin' ? 'bptable--coin' : undefined}>
                <td className="bptable__tier">{row.tier}</td>
                <td>
                  <span className="bptable__what">
                    <ItemIcon iconUrl={meta?.icon_url ?? null} category={meta?.category ?? null} size={24} />
                    {reward.id === null ? (
                      reward.label
                    ) : (
                      <Link href={itemHref(reward.id, meta?.category)}>{reward.label}</Link>
                    )}
                  </span>
                </td>
                <td className="bptable__qty">×{row.qty}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

export default async function BattlePassSummerPage() {
  const icons = await loadIcons();
  const paidCoins = coinTiers(PAID_TRACK);
  const freeCoins = coinTiers(FREE_TRACK);

  return (
    <main className="shell" style={{ paddingBlock: 32, maxWidth: 820 }}>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'หน้าแรก', path: '/' },
          { name: 'อีเวนต์', path: PATH },
        ])}
      />
      <JsonLd
        data={articleJsonLd({
          path: PATH,
          headline: metadata.title,
          description: metadata.description,
          datePublished: PUBLISHED,
          dateModified: MODIFIED,
        })}
      />

      <nav className="crumbs" aria-label="ตำแหน่งหน้า">
        <Link href="/">หน้าแรก</Link>
        <span className="crumbs__sep" aria-hidden="true">›</span>
        <span className="crumbs__here">อีเวนต์</span>
      </nav>

      <h1 className="pagehead__title">Battle Pass ฤดูร้อน 2569 — รางวัลทุก Tier และวิธีเล่น</h1>
      <p className="muted" style={{ marginTop: 8, maxWidth: '65ch' }}>
        สรุปประกาศอีเวนต์ Battle Pass (Summer) ของ Ragnarok Zero: Global เป็นภาษาไทย พร้อมลิงก์ของรางวัลทุกชิ้นเข้าฐานข้อมูล
      </p>

      <section className="card card--yellow" style={{ marginTop: 14 }}>
        <h2 className="section-title">สรุปสั้น</h2>
        <table className="stat-table" style={{ marginTop: 8 }}>
          <tbody>
            <tr><td>ช่วงอีเวนต์</td><td className="num">{EVENT.startTh} – ปิดปรับปรุง {EVENT.endTh}</td></tr>
            <tr><td>สาย Free</td><td className="num">{FREE_TRACK.length} Tier · ไม่ต้องจ่าย</td></tr>
            <tr><td>สาย Paid</td><td className="num">{PAID_TRACK.length} Tier · ใช้ตั๋ว 1 ใบ</td></tr>
            <tr><td>ตั๋วราคา</td><td className="num">Zelstar {ZELSTAR_PER_TICKET} ดวง</td></tr>
            <tr><td>Battle Coin ที่ได้</td><td className="num">Paid {paidCoins.length} เหรียญ · Free {freeCoins.length} เหรียญ</td></tr>
          </tbody>
        </table>
        <p className="muted" style={{ marginTop: 8 }}>
          ประกาศระบุเวลาเป็น UTC+0 เวลาไทยเร็วกว่า 7 ชั่วโมง · วันจบคือวันปิดปรับปรุง ไม่ใช่สิ้นวัน
        </p>
      </section>

      <section className="card" style={{ marginTop: 14 }}>
        <h2 className="section-title">เล่นยังไง</h2>
        <ol style={{ marginTop: 8, paddingInlineStart: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <li>
            <strong>สาย Free เปิดฟรี</strong> — คุยกับ NPC ชื่อ <strong>Readword</strong> ไม่ต้องซื้ออะไรเลย ไต่ได้ถึง Tier {FREE_TRACK.length}
          </li>
          <li>
            <strong>สาย Paid ต้องมีตั๋ว</strong> — ซื้อ{' '}
            <Link href={itemHref(ZELSTAR.box4, icons.get(ZELSTAR.box4)?.category)}>Zelstar 4ea Box</Link> (700 KP) หรือ{' '}
            <Link href={itemHref(ZELSTAR.box40, icons.get(ZELSTAR.box40)?.category)}>Zelstar 40ea Box</Link> (7,000 KP) จาก Kafra Shop
            แล้วเอา Zelstar {ZELSTAR_PER_TICKET} ดวงไปแลกตั๋วกับ <strong>Ticketling</strong>
          </li>
          <li>
            <strong>เปิดสาย Paid</strong> — เอา{' '}
            <Link href={itemHref(BATTLE_PASS_ITEM_ID, icons.get(BATTLE_PASS_ITEM_ID)?.category)}>Battle Pass (Summer)</Link>{' '}
            ไปให้ <strong>Rideword</strong> ที่เมือง Izlude
          </li>
          <li>
            <strong>ทำเควสรายวัน</strong> — เควส 1 อันจบ = ขึ้น 1 Tier ได้รางวัลของ Tier นั้นทันที ตัวอย่างเควสที่ประกาศโชว์ไว้คือฆ่ามอนธาตุน้ำ 30 ตัว และฆ่ามอนเผ่าพืช 30 ตัว
          </li>
          <li>
            <strong>Tier 51-70 ไม่มีเควสให้ทำ</strong> — เฉพาะสาย Paid เท่านั้นที่ไปต่อได้ โดยจ่าย Zelstar {ZELSTAR_PER_TIER} ดวงต่อ 1 Tier
            (25 ดวง = 5 Tier, 50 ดวง = 10 Tier) คุยกับ Rideword หลังถึง Tier {FREE_TRACK.length}
          </li>
        </ol>
        <p className="muted" style={{ marginTop: 10, fontSize: 13 }}>
          ประกาศเรียกของชิ้นที่ใช้เปิดสาย Paid ทั้งคำว่า &ldquo;ตั๋ว&rdquo; และชื่อไอเทม Battle Pass (Summer) — หน้านี้ยกมาตามที่เขียนไว้ ไม่ได้สรุปเองว่าเป็นชิ้นเดียวกัน
        </p>
      </section>

      <section className="card card--yellow" style={{ marginTop: 14 }}>
        <h2 className="section-title">ข้อควรระวัง — สองสายนับแยกกัน</h2>
        <p style={{ marginTop: 8 }}>
          ความคืบหน้าของสาย Free กับสาย Paid <strong>ไม่โอนหากัน</strong> ถ้าดันสาย Free ไป 3 Tier แล้วค่อยซื้อตั๋วทีหลัง
          สาย Paid จะเริ่มนับที่ Tier 0 ใหม่ ไม่ได้ต่อจาก 3
        </p>
      </section>

      <section className="card" style={{ marginTop: 14 }}>
        <h2 className="section-title">Battle Coin แลกคอสตูมอะไรได้บ้าง</h2>
        <p className="muted" style={{ marginTop: 0, marginBottom: 10, fontSize: 13 }}>
          สาย Paid ได้เหรียญที่ Tier {paidCoins.join(', ')} รวม {paidCoins.length} เหรียญ · สาย Free ได้ที่ Tier {freeCoins.join(', ')} รวม {freeCoins.length} เหรียญ ·
          เอาไปโยนให้ NPC มิมิคกินเหรียญ (Battle Pass Cos Mimic)
        </p>
        <table className="bptable">
          <thead>
            <tr>
              <th>คอสตูม</th>
              <th className="bptable__qty">ราคา</th>
            </tr>
          </thead>
          <tbody>
            {COSTUMES.map((costume) => {
              const meta = icons.get(costume.id);
              return (
                <tr key={costume.id}>
                  <td>
                    <span className="bptable__what">
                      <ItemIcon iconUrl={meta?.icon_url ?? null} category={meta?.category ?? null} size={24} />
                      <Link href={itemHref(costume.id, meta?.category)}>{costume.label}</Link>
                    </span>
                  </td>
                  <td className="bptable__qty">{costume.coins}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="muted" style={{ marginTop: 10, fontSize: 12.5 }}>
          ฐานข้อมูลเรามีคอสตูมชุดนี้ทั้งแบบธรรมดาและแบบ (Bound) — ลิงก์ข้างบนชี้ไปตัวที่ชื่อตรงกับหน้าร้านในประกาศ
        </p>
      </section>

      <TrackTable
        rows={FREE_TRACK}
        icons={icons}
        title={`รางวัลสาย Free — Tier 1-${FREE_TRACK.length}`}
        note="ไม่ต้องซื้ออะไร ทำเควสรายวันอย่างเดียว"
      />

      <TrackTable
        rows={PAID_TRACK}
        icons={icons}
        title={`รางวัลสาย Paid — Tier 1-${PAID_TRACK.length}`}
        note={`ของชิ้นเดียวกับสาย Free แต่จำนวนมากกว่า และมีต่ออีก ${PAID_TRACK.length - FREE_TRACK.length} Tier ที่ต้องจ่าย Zelstar`}
      />

      <section className="card" style={{ marginTop: 14 }}>
        <h2 className="section-title">ใช้เว็บนี้ทำอะไรต่อได้</h2>
        <ul style={{ marginTop: 8, paddingInlineStart: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <li>เควสรายวันสั่งฆ่ามอนตามธาตุ — เปิด <Link href="/database/monsters">ฐานข้อมูลมอนสเตอร์</Link> กรองธาตุแล้วดูว่าตัวไหนอยู่แมพไหน</li>
          <li>อยากรู้ว่าตีมอนธาตุนั้นใช้อะไรคุ้ม — <Link href="/guides/elements">ตารางธาตุ</Link></li>
          <li>คอสตูมที่แลกมาแล้วอยากดูชิ้นอื่นในชุด — <Link href="/database/costumes">ฐานข้อมูลคอสตูม</Link></li>
        </ul>
      </section>

      <p className="source-note" style={{ marginTop: 16 }}>
        <strong>ที่มา:</strong> ประกาศทางการ Ragnarok Zero: Global หัวข้อ &ldquo;Battle Pass (Summer)&rdquo; บนเว็บ roz.mygnjoy.com ·
        หน้านี้เป็นสรุปแปลพร้อมลิงก์ฐานข้อมูล ไม่ใช่ประกาศทางการ ตัวเลขและเงื่อนไขยึดตามประกาศต้นทางเสมอ
      </p>
    </main>
  );
}
