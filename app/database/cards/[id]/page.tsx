// app/database/cards/[id]/page.tsx
//
// Cards had a list of their own since August but no detail page: clicking one
// landed on the generic item template, which leads with prices and slots and
// buries the one line a card is read for. Split out 3 Sep 2026, the same day as
// gear and costumes; lib/item-href.ts holds the rule all four routes key off.
import Link from 'next/link';
import JsonLd from '@/components/JsonLd';
import { breadcrumbJsonLd, entityJsonLd } from '@/lib/jsonld';
import RecordVisit from '@/components/RecordVisit';
import ItemIcon from '@/components/ItemIcon';
import FeedbackButton from '@/components/FeedbackButton';
import DescriptionLanguageToggle from '@/components/DescriptionLanguageToggle';
import { composeThaiDescription } from '@/lib/item-description-th';
import { getGearItem, loadGearExtras } from '@/lib/gear-detail';
import { isCardCategory, itemHref } from '@/lib/item-href';
import { parseCardSlot } from '@/lib/card-slot';
import { isCVariant } from '@/lib/c-variant';
import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';

export const revalidate = 86400;

export async function generateStaticParams() {
  return [];
}

// Type, Equipped on and Weight are structure, not effect -- the same split the
// card list makes, so a card's effect reads the same in both places.
const BOILERPLATE = /^(Type|Equipped on|Weight)\s*:/;

function effectLines(description: string | null): string[] {
  if (!description) return [];
  return description
    .split('\n')
    .map((l) => l.replace(/\^[0-9a-fA-F]{6}/g, '').trim())
    .filter((l) => l !== '' && !BOILERPLATE.test(l));
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const { data: item, error } = await getGearItem(Number(params.id));

  if (error) {
    console.error('card detail query failed (metadata)', error);
    return {};
  }

  if (!item) return { title: 'ไม่พบการ์ดใบนี้' };

  const slot = parseCardSlot(item.description);
  const effect = item.description_th ?? effectLines(item.description).join(' ');

  return {
    title: `${item.name_en} — เอฟเฟกต์และมอนที่ดรอป`,
    description: `${item.name_en}${slot ? ` ใส่ช่อง ${slot}` : ''}${effect ? ` — ${effect}` : ''} ดูมอนสเตอร์ที่ดรอปและอัตราดรอปใน RO Zero Thai`,
  };
}

export default async function CardDetailPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  const { data: item, error } = await getGearItem(id);

  if (error) {
    console.error('card detail query failed', error);
    return <main className="shell" style={{ paddingBlock: 32 }}>เกิดข้อผิดพลาด ลองใหม่อีกครั้ง</main>;
  }

  if (!item) {
    notFound();
  }

  // Anything that is not a card has its canonical home elsewhere. Redirect
  // rather than render, so one row is never served (and indexed) at two URLs.
  if (!isCardCategory(item.category)) {
    permanentRedirect(itemHref(id, item.category));
  }

  const { droppedBy, droppedByError, dict } = await loadGearExtras(id);
  const slot = parseCardSlot(item.description);
  const english = effectLines(item.description);
  // description_th is a curated one-line translation (all 313 cards have one);
  // the generic line dictionary is the fallback for a row that ever lacks it.
  const thai = item.description_th
    ? [item.description_th]
    : composeThaiDescription(item.description ?? '', dict)
        .map((l) => l.thai ?? l.source)
        .filter((l) => l !== '' && !BOILERPLATE.test(l));
  const rows = (droppedBy ?? []).filter((d: any) => d.monsters && !isCVariant(d.monsters.name_en));
  const source = rows[0] ?? null;

  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <nav className="crumbs" aria-label="ตำแหน่งหน้า">
        <Link href="/database/cards">การ์ด</Link>
        <span className="crumbs__sep" aria-hidden="true">›</span>
        {slot ? (
          <>
            <Link href={`/database/cards?slot=${encodeURIComponent(slot)}`}>{slot}</Link>
            <span className="crumbs__sep" aria-hidden="true">›</span>
          </>
        ) : null}
        <span className="crumbs__here">{item.name_en}</span>
      </nav>
      <RecordVisit kind="card" id={item.id} name={item.name_en} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'หน้าแรก', path: '/' },
          { name: 'การ์ด', path: '/database/cards' },
          { name: item.name_en, path: `/database/cards/${item.id}` },
        ])}
      />
      <JsonLd
        data={entityJsonLd({
          path: `/database/cards/${item.id}`,
          name: item.name_en,
          description: item.description_th ?? item.description,
          properties: [
            { name: 'Category', value: 'Card' },
            ...(slot ? [{ name: 'EquippedOn', value: slot }] : []),
            ...(item.sell_price ? [{ name: 'SellPrice', value: item.sell_price, unitText: 'Zeny' }] : []),
          ],
        })}
      />

      {/* A card is read for its effect, so the effect sits in the hero rather
          than three cards down where the item template kept it. */}
      <div className="equiphero">
        <ItemIcon iconUrl={item.icon_url} category={item.category} size={64} />
        <div>
          <h1 className="pagehead__title">{item.name_en}</h1>
          <p className="equiphero__chips">
            <span className="tag">การ์ด</span>
            {slot && <span className="tag">ใส่ช่อง {slot}</span>}
            <span className="tag mono">ID {item.id}</span>
          </p>
          <p className="muted" style={{ marginTop: 6, maxWidth: '65ch' }}>
            {item.name_en}
            {slot ? ` เป็นการ์ดที่ใส่ในช่อง ${slot}` : ' เป็นการ์ด'}
            {item.description_th ? ` ให้ผล ${item.description_th}` : ''}
            {source?.monsters
              ? ` ดรอปจาก ${source.monsters.name_en} (Lv.${source.monsters.level ?? '—'}${source.rate != null ? ` อัตรา ${source.rate}%` : ''})`
              : ''}
          </p>
        </div>
      </div>

      {(thai.length > 0 || english.length > 0) && (
        <div className="card card--cyan" style={{ marginTop: 20 }}>
          <h2 className="section-title">เอฟเฟกต์</h2>
          <DescriptionLanguageToggle
            thaiLines={thai.length > 0 ? thai : english}
            englishLines={english}
          />
        </div>
      )}

      <div className="statgrid" style={{ marginTop: 20 }}>
        <div className="statgrid__cell">
          <span className="reward-label">ใส่ช่อง</span>
          <span className="reward-value">{slot ?? '—'}</span>
        </div>
        <div className="statgrid__cell">
          <span className="reward-label">ราคาซื้อ</span>
          <span className="reward-value mono">
            {item.buy_price === null ? '—' : item.buy_price.toLocaleString('en-US')}
          </span>
        </div>
        <div className="statgrid__cell">
          <span className="reward-label">ราคาขาย</span>
          <span className="reward-value mono">
            {item.sell_price === null ? '—' : item.sell_price.toLocaleString('en-US')}
          </span>
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h2 style={{ fontFamily: 'var(--font-chakra), sans-serif', marginBottom: 10 }}>มอนสเตอร์ที่ดรอปการ์ดใบนี้</h2>
        {droppedByError ? (
          <p style={{ color: 'var(--faint)' }}>โหลดข้อมูลมอนสเตอร์ที่ดรอปไม่สำเร็จ ลองใหม่อีกครั้ง</p>
        ) : (droppedBy ?? []).length === 0 ? (
          <p style={{ color: 'var(--faint)' }}>ไม่มีข้อมูลมอนสเตอร์ที่ดรอปการ์ดใบนี้</p>
        ) : (
          (droppedBy ?? []).map((d: any, i: number) => (
            <div key={i} className={isCVariant(d.monsters.name_en) ? 'cvariant' : undefined} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
              <Link href={`/database/monsters/${d.monsters.id}`} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {d.monsters.image_url && (
                  <img src={d.monsters.image_url} alt="" width={20} height={20} style={{ imageRendering: 'pixelated' }} />
                )}
                {d.monsters.name_en}
              </Link>
              <span className="mono">{d.rate != null ? `${d.rate}%` : '?'}</span>
            </div>
          ))
        )}
      </div>

      <div style={{ marginTop: 20 }}>
        <FeedbackButton pageType="card" entityId={String(item.id)} />
      </div>
    </main>
  );
}
