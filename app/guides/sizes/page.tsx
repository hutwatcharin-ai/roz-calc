// app/guides/sizes/page.tsx
import Caveat from '@/components/Caveat';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import { SIZE_TABLE, SIZES, SIZE_LABELS } from '@/lib/size-table';
import { cardLines } from '@/lib/card-topics';
import { cardArtAlt, cardArtThumbUrl } from '@/lib/card-art';

// Cards whose client text is about size (checked 8 Oct 2026 by reading
// every card's Thai text for "ขนาด"); the lines shown are the card's own.
const SIZE_CARDS = [
  { id: 4137, name: 'Drake Card' },
  { id: 4092, name: 'Skeleton Worker Card' },
  { id: 4126, name: 'Minorous Card' },
];

export const metadata = {
  title: 'ตารางขนาด Ragnarok Zero',
  description:
    'ตารางตัวคูณความเสียหายตามประเภทอาวุธ × ขนาดมอนสเตอร์ของ Ragnarok Zero Global — ดูว่าอาวุธชนิดไหนตีมอนขนาดเล็ก กลาง ใหญ่ ได้เต็มหรือโดนหัก',
};

function band(value: number): string {
  if (value < 75) return 'el--immune';
  if (value < 100) return 'el--weak';
  return 'el--flat';
}

export default function SizesPage() {
  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <PageHeader title="ตารางขนาด Ragnarok Zero" lead="ดาเมจขึ้นกับขนาดมอนด้วย ไม่ใช่แค่ธาตุ เช่น หนังสือตีมอนใหญ่เหลือ 50%" />

      {/* The question players bring: "what hits a large monster at full". */}
      <div className="szquick">
        {SIZES.map((size) => {
          const full = SIZE_TABLE.filter((r) => r[size] >= 100 && r.weapon !== 'Bare hand');
          const worst = SIZE_TABLE.filter((r) => r[size] <= 50);
          return (
            <section key={size} className={`szquick__col is-${size}`}>
              <h2>
                <span className="szquick__dot" aria-hidden="true" />
                มอน{SIZE_LABELS[size]}
              </h2>
              <p className="szquick__k">ตีเต็ม 100%</p>
              <p className="szquick__list">{full.map((r) => r.label).join(' · ') || '—'}</p>
              {worst.length > 0 && (
                <>
                  <p className="szquick__k is-bad">เหลือครึ่งเดียว</p>
                  <p className="szquick__list">{worst.map((r) => r.label).join(' · ')}</p>
                </>
              )}
            </section>
          );
        })}
      </div>

      <Caveat label="ที่มาของตัวเลข">
        <strong>ที่มาของตัวเลข:</strong> คู่มือเกมทางการของ Ragnarok Zero (ระบบพิเศษ &gt; ระบบขนาด) ·
        ตัวคูณนี้คิดก่อนตัวคูณธาตุ ดูคู่กับ <Link href="/guides/elements">ตารางธาตุ</Link> ได้
        · เทียบกับ rozerodb ที่ถอดหน้าเดียวกันแยกกันมา <strong>ตรงกัน 59 จาก 60 ช่อง</strong>{' '}
        ช่องที่ต่างคือ <strong>แส้ตีเป้าหมายขนาดใหญ่</strong> เว็บนี้อ่านได้ 75% เขาอ่านได้ 50%
        · roz.prontera.info ก็ใช้ 75% และตรงกับตารางนี้ครบทุกช่องที่มีเหมือนกัน (54 ช่อง, เช็ก 6 ต.ค. 2026)
        จึงใช้ 75% ต่อไป
      </Caveat>

      <div className="card" style={{ marginTop: 16, overflowX: 'auto' }}>
        <table className="eltable">
          <thead>
            <tr>
              <th scope="col">ประเภทอาวุธ</th>
              {SIZES.map((size) => (
                <th key={size} scope="col">
                  {SIZE_LABELS[size]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SIZE_TABLE.map((row) => (
              <tr key={row.weapon}>
                <th scope="row" className="sizerow">
                  {row.weapon}
                  <span className="muted sizerow__label" style={{ fontSize: 12, marginInlineStart: 6 }}>
                    {row.label}
                  </span>
                </th>
                {SIZES.map((size) => (
                  <td key={size} className={`el ${band(row[size])}`}>
                    {row[size]}%
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="card card--yellow" style={{ marginTop: 16 }}>
        <h2 className="section-title">การ์ดที่แก้เรื่องขนาด</h2>
        <div className="szcards">
          {SIZE_CARDS.map((c) => (
            <Link key={c.id} className="szcard" href={`/database/cards/${c.id}`}>
              <img src={cardArtThumbUrl(c.id)} alt={cardArtAlt(c.id, c.name)} width={60} height={80} loading="lazy" />
              <span>
                <strong>{c.name}</strong>
                {cardLines(c.id).map((l) => (
                  <small key={l}>{l}</small>
                ))}
              </span>
            </Link>
          ))}
        </div>
        <p className="muted" style={{ marginBottom: 0 }}>
          ใส่ Drake Card ในอาวุธแล้วตารางข้างบนไม่มีผลกับคุณ ตีเต็มทุกขนาด · การ์ดอื่นที่ใส่อาวุธดูได้ที่{' '}
          <Link href="/database/cards/effect/slot-weapon">การ์ดใส่อาวุธ</Link>
        </p>
      </section>

      <section className="rolepick" style={{ marginTop: 20 }}>
        <h2 className="rolepick__label">ดูมอนสเตอร์ตามขนาด</h2>
        <div className="chips">
          <Link className="chip" href="/database/monsters?size=Small">เล็ก</Link>
          <Link className="chip" href="/database/monsters?size=Medium">กลาง</Link>
          <Link className="chip" href="/database/monsters?size=Large">ใหญ่</Link>
        </div>
      </section>

      <p className="muted" style={{ marginTop: 16 }}>
        กดเข้าไปดูรายตัวได้จาก <Link href="/database/monsters">หน้ารายการมอนสเตอร์</Link>{' '}
        หน้ามอนจะบอกด้วยว่าอาวุธชนิดไหนตีตัวนั้นได้เต็ม
      </p>
    </main>
  );
}
