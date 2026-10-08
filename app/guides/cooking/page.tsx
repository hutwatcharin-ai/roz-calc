// app/guides/cooking/page.tsx
//
// Redesigned 8 Oct 2026 (owner: every guide in the newer arcade look, and
// fill in what is missing): the strongest dish per stat on top, the steps,
// and the recipes as cards filtered by stat and by cookbook level. What a
// dish gives is lib/food-buffs; the cookbook level is the recipe's own
// itemLevel (11-20 in the production table is Lv.1-10 Cookbook).

import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import CraftGuide from '@/components/CraftGuide';
import JsonLd from '@/components/JsonLd';
import { breadcrumbJsonLd } from '@/lib/jsonld';
import { recipesOfKind, type Recipe } from '@/lib/crafting';
import { foodById } from '@/lib/food-buffs';

export const revalidate = 86400;

export const metadata = {
  title: 'ทำอาหาร Ragnarok Zero — สูตรและวัตถุดิบ',
  description:
    'อาหารเพิ่มสเตตัสใน Ragnarok Zero Global ทำจากอะไรบ้าง ต้องมีตำราเล่มไหนติดตัว อาหารตัวไหนเพิ่ม STR AGI VIT INT DEX LUK มากสุด ครบทุกสูตรที่ตรวจแล้ว',
};

const STATS = ['str', 'agi', 'vit', 'int', 'dex', 'luk'] as const;
const bookLevel = (r: Recipe) => (r.itemLevel != null && r.itemLevel > 10 ? r.itemLevel - 10 : null);
const statsOf = (r: Recipe) => {
  const b = foodById(r.product.id)?.b ?? {};
  return STATS.filter((s) => (b[s] ?? 0) > 0);
};
const tagsOf = (r: Recipe) => [...statsOf(r), bookLevel(r) != null ? `b${bookLevel(r)}` : ''].filter(Boolean);
const badgeOf = (r: Recipe) => (bookLevel(r) != null ? `ตำรา Lv ${bookLevel(r)}` : null);

export default function CookingPage() {
  const confirmed = recipesOfKind('cook').filter((r) => r.confidence === 'both');
  const books = [...new Set(confirmed.map(bookLevel).filter((l): l is number => l != null))].sort((a, b) => a - b);

  // The strongest confirmed dish for each stat.
  const best = STATS.map((s) => {
    const top = confirmed
      .map((r) => ({ r, v: foodById(r.product.id)?.b[s] ?? 0 }))
      .filter((x) => x.v > 0)
      .sort((a, b) => b.v - a.v)[0];
    return { s, top };
  });

  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'หน้าแรก', path: '/' },
          { name: 'ไกด์', path: '/guides' },
          { name: 'ทำอาหาร', path: '/guides/cooking' },
        ])}
      />
      <PageHeader
        title="ทำอาหาร — สูตรทั้งหมด"
        lead={
          <>
            อาหารเพิ่มสเตตัสชั่วคราว ทำได้ {confirmed.length} อย่างที่ยืนยันแล้ว · ทุกอาชีพทำได้ ไม่ต้องมีสกิล
            ขอแค่มี<strong>ชุดทำอาหาร</strong>กับ<strong>ตำรา</strong>ระดับที่ตรงกับสูตร
          </>
        }
      />

      <section className="card card--yellow">
        <h2 className="section-title">อาหารที่เพิ่มแต่ละสเตตัสมากสุด</h2>
        <div className="gtiles">
          {best.map(({ s, top }) =>
            top ? (
              <Link key={s} className="gtile" href={`/database/items/${top.r.product.id}`}>
                <span className="gtile__k">{s.toUpperCase()}</span>
                <span className="gtile__v">
                  <img src={top.r.product.icon ?? `/images/items/${top.r.product.id}.gif`} alt="" width={24} height={24} />+{top.v}
                </span>
                <span className="gtile__s">{top.r.product.name} · ตำรา Lv {bookLevel(top.r) ?? '?'}</span>
              </Link>
            ) : (
              <div key={s} className="gtile">
                <span className="gtile__k">{s.toUpperCase()}</span>
                <span className="gtile__v">—</span>
                <span className="gtile__s">ยังไม่มีสูตรที่ยืนยัน</span>
              </div>
            ),
          )}
        </div>
      </section>

      <section className="card card--cyan" style={{ marginTop: 16 }}>
        <h2 className="section-title">ทำยังไง</h2>
        <ol className="gsteps">
          <li>
            หา<strong>ตำรา</strong>ระดับที่ตรงกับเมนู ในเกมมี Lv.1 ถึง Lv.10 Cookbook แต่ละเล่มบันทึกสูตรระดับนั้นทั้งหมด ·
            <strong>ตำราไม่หาย</strong> ใช้ซ้ำได้เรื่อยๆ
          </li>
          <li>
            มี<strong>ชุดทำอาหาร</strong>ติดตัว ในเกมมี 3 แบบ: Outdoor, Indoor และ High end Cooking Kits
          </li>
          <li>เตรียมวัตถุดิบตามการ์ดด้านล่าง ตัวเลข ×10 คือจำนวนที่ใช้ต่อครั้ง</li>
          <li>ใช้ชุดทำอาหาร แล้วเลือกเมนูจากตำราที่ถืออยู่</li>
        </ol>
        <p className="muted" style={{ marginBottom: 0 }}>
          ยังไม่รู้: ชุดทำอาหารแต่ละแบบต่างกันยังไง โอกาสทำสำเร็จ และอาหารอยู่ได้นานแค่ไหน · ใครเช็กในเกมแล้วบอกได้
        </p>
      </section>

      <CraftGuide
        kind="cook"
        title={`สูตรอาหาร (${confirmed.length})`}
        placeholder="ค้นชื่ออาหาร หรือวัตถุดิบ เช่น Honey"
        tagsOf={tagsOf}
        badgeOf={badgeOf}
        facets={[
          {
            label: 'เพิ่ม',
            options: STATS.map((s) => ({ value: s, label: s.toUpperCase(), count: confirmed.filter((r) => statsOf(r).includes(s)).length })).filter((o) => o.count > 0),
          },
          {
            label: 'ตำรา',
            options: books.map((l) => ({ value: `b${l}`, label: `Lv ${l}`, count: confirmed.filter((r) => bookLevel(r) === l).length })),
          },
        ]}
        extra={
          <p className="muted" style={{ marginTop: 16 }}>
            อาหารตัวไหนคุ้มกับที่จะทำ ขึ้นกับว่าจะเอาไปสู้อะไร ลองที่ <Link href="/tools/build">จำลองบิลด์</Link> ใส่อาหารแล้วดูค่าที่เปลี่ยนก่อนก็ได้ ·
            วัตถุดิบมาจากมอนตัวไหน ค้นที่ <Link href="/drop-finder">ค้นของดรอป</Link>
          </p>
        }
      >
        <></>
      </CraftGuide>
    </main>
  );
}
