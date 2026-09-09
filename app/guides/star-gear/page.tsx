// app/guides/star-gear/page.tsx
//
// The ★ weapons and armour: what they are, what it costs to make one, and
// every piece that exists.
//
// This page is almost entirely our own data, which was not obvious at first.
// The mirrored guide lists the pieces in French with no English anywhere --
// "Fouet en acier", "Bâton en chêne" -- and no id to join on, so its tables
// looked unusable. Then a search of our items table for names beginning with
// ★ returned 58 rows: 31 weapons, 10 armours and 17 crafting tokens, each
// with the client's own description and required level. The list and the
// stats come from there.
//
// What the guide contributes is the one thing the client never states: the
// price of activation, and that it costs you refine levels.
import Link from 'next/link';
import type { Metadata } from 'next';
import PageHeader from '@/components/PageHeader';
import Caveat from '@/components/Caveat';
import ItemIcon from '@/components/ItemIcon';
import JsonLd from '@/components/JsonLd';
import { breadcrumbJsonLd } from '@/lib/jsonld';
import { itemHref } from '@/lib/item-href';
import { supabaseBrowser } from '@/lib/supabase';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'อาวุธและชุดติดดาว ★ Ragnarok Zero — มีอะไรบ้าง ทำยังไง เสียอะไร',
  description:
    'ของติดดาว ★ ใน Ragnarok Zero Global ทุกชิ้น พร้อมค่าสถานะจากในเกมและโบนัสตอนตีบวก +3 +7 +9 · วิธีเปลี่ยนของธรรมดาเป็นของติดดาว ใช้อะไรบ้าง และเสียตีบวกกี่ขั้น',
};

// From the mirrored guide (roz-global.info, 8 Sep 2026). The client says
// nothing about what activation costs, only what the finished item does.
const ACTIVATION = [
  { what: 'อาวุธ ★★', refine: '−3', materials: 'โทเคน ★★ ของชิ้นนั้น 3 อัน + Goblin Coin Shard 30' },
  { what: 'อาวุธ ★', refine: '−7', materials: 'โทเคน ★ ของชิ้นนั้น 100 อัน + Goblin Coin Shard 8' },
  { what: 'ชุดธรรมดา แบบ "นิ่ง"', refine: '−3', materials: 'โทเคน ★ ของชิ้นนั้น 100 อัน + Goblin Coin Shard 30' },
  { what: 'ชุดธรรมดา แบบ "แรง"', refine: '−7', materials: 'โทเคน ★ ของชิ้นนั้น 10 อัน + Goblin Coin Shard 3' },
];

interface StarItem {
  id: number;
  name_en: string;
  icon_url: string | null;
  description: string | null;
  required_level: number | null;
  category: string | null;
}

/** The client tacks "DEF : 46" on the end; the level column already says it. */
function effect(description: string | null): string {
  if (!description) return '—';
  return description.replace(/\s*(?:DEF|ATK)\s*:\s*\d+\s*$/, '').trim() || '—';
}

function StarTable({ rows }: { rows: StarItem[] }) {
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
          {rows.map((item) => (
            <tr key={item.id}>
              <td data-label="ชิ้น">
                <Link className="recipe__item" href={itemHref(item.id, item.category)}>
                  <ItemIcon iconUrl={item.icon_url} category={item.category} size={22} />
                  <span>{item.name_en}</span>
                </Link>
              </td>
              <td data-label="เลเวล" className="num">{item.required_level ?? '—'}</td>
              <td data-label="ผล" className="effect">
                <span className="effect__text">{effect(item.description)}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function StarGearPage() {
  const db = supabaseBrowser();
  // 58 rows, well under the 1,000 cap, so one plain select is enough.
  const { data, error } = await db
    .from('items')
    .select('id, name_en, icon_url, description, required_level, category')
    .like('name_en', '★%')
    .order('name_en');
  if (error) console.error('star gear query failed', error);

  const rows = (data ?? []) as StarItem[];
  const weapons = rows.filter((r) => r.category === 'Weapon');
  const armour = rows.filter((r) => r.category === 'Armor');
  const tokens = rows.filter((r) => r.category !== 'Weapon' && r.category !== 'Armor');

  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'หน้าแรก', path: '/' },
          { name: 'ไกด์', path: '/guides' },
          { name: 'ของติดดาว', path: '/guides/star-gear' },
        ])}
      />
      <PageHeader title="ของติดดาว ★ — มีอะไรบ้าง และแลกยังไง" />
      <p className="muted" style={{ marginTop: -6, marginBottom: 16, maxWidth: '72ch' }}>
        ของติดดาวคือของธรรมดาที่<strong>ปลุกแล้ว</strong> — ค่าพื้นฐานแรงขึ้น และได้โบนัสเพิ่มอีกทอดตอนตีบวกถึง +3, +7, +9 ·
        แลกโดยเอาของชิ้นนั้นไปเปลี่ยนเป็นโทเคน แล้วใช้โทเคนปลุก
      </p>

      {error && <p className="filterstate">โหลดรายการของติดดาวไม่สำเร็จ</p>}

      <section className="card card--yellow">
        <h2 className="section-title">ปลุกแล้วเสียอะไร</h2>
        <div className="recipe__scroll">
          <table className="data-table recipe">
            <thead>
              <tr>
                <th>ปลุกอะไร</th>
                <th className="num">ตีบวกหายไป</th>
                <th>ใช้อะไร</th>
              </tr>
            </thead>
            <tbody>
              {ACTIVATION.map((row) => (
                <tr key={row.what}>
                  <td data-label="ปลุกอะไร">{row.what}</td>
                  <td data-label="ตีบวกหาย" className="num">{row.refine}</td>
                  <td data-label="ใช้อะไร">{row.materials}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="muted" style={{ marginTop: 12, fontSize: 13 }}>
          <strong>การ์ด เอนแชนต์ และความสามารถเสริมไม่หาย</strong> — ที่หายคือขั้นตีบวกเท่านั้น
          ของ +10 ที่เสีย 7 ขั้นจะเหลือ +3
        </p>
      </section>

      <section style={{ marginTop: 26 }}>
        <h2 className="section-title">
          อาวุธติดดาว <span className="muted" style={{ fontWeight: 400 }}>· {weapons.length} ชิ้น</span>
        </h2>
        <StarTable rows={weapons} />
      </section>

      <section style={{ marginTop: 26 }}>
        <h2 className="section-title">
          ชุดติดดาว <span className="muted" style={{ fontWeight: 400 }}>· {armour.length} ชิ้น</span>
        </h2>
        <StarTable rows={armour} />
      </section>

      <section style={{ marginTop: 26 }}>
        <h2 className="section-title">
          โทเคนสำหรับปลุก <span className="muted" style={{ fontWeight: 400 }}>· {tokens.length} แบบ</span>
        </h2>
        <p className="muted" style={{ marginTop: 2, marginBottom: 10, fontSize: 13 }}>
          โทเคนของชิ้นไหนใช้ปลุกได้เฉพาะชิ้นนั้น
        </p>
        <StarTable rows={tokens} />
      </section>

      <Caveat label="เชื่อได้แค่ไหน">
        รายการของติดดาวทั้ง {rows.length} ชิ้นและค่าสถานะทุกบรรทัด<strong>มาจากข้อมูลไอเทมในเกม</strong>ที่เก็บไว้ในฐานข้อมูลเว็บนี้
        ไม่ได้แปลหรือสรุปใหม่ (ปล่อยเป็นภาษาอังกฤษเพราะไคลเอนต์โกลบอลเป็นอังกฤษ จะได้ตรงกับที่เห็นตอนกดดูของ) ·
        ส่วน<strong>ตารางค่าใช้จ่ายในการปลุกมาจากไกด์ภาษาฝรั่งเศส</strong> roz-global.info (อ่าน 8 ก.ย. 2026)
        เพราะไคลเอนต์บอกแต่ผลของชิ้นที่ปลุกแล้ว ไม่บอกว่าปลุกยังไง — เป็นแหล่งเดียว ยังไม่มีที่สองให้ตรวจ
      </Caveat>

      <p className="muted" style={{ marginTop: 16 }}>
        ดูต่อ: <Link href="/tools/refine">คำนวณตีบวก</Link> ·{' '}
        <Link href="/database/equipment">ฐานข้อมูลอุปกรณ์</Link> ·{' '}
        <Link href="/guides/memorial-gear">ชุดดันเจี้ยนความทรงจำ</Link>
      </p>
    </main>
  );
}
