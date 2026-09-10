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
import FeedbackButton from '@/components/FeedbackButton';
import DescriptionLanguageToggle from '@/components/DescriptionLanguageToggle';
import { composeThaiDescription } from '@/lib/item-description-th';
import { getGearItem, loadGearExtras } from '@/lib/gear-detail';
import { isCardCategory, itemHref } from '@/lib/item-href';
import { cardSlot, equipmentHrefForSlot, parseCardSlot } from '@/lib/card-slot';
import { isCVariant } from '@/lib/c-variant';
import { cardRelease, releaseText } from '@/lib/card-availability';
import { CardDroppers, CardHero } from './hero';
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
    // Thrown, not rendered: these pages are ISR (revalidate 86400), and a
    // rendered "error, try again" is a successful render that gets cached for
    // a day. Seen 7 Sep 2026 on a transient Supabase timeout. A throw goes to
    // app/error.tsx and is never cached.
    throw new Error(`card detail query failed: ${error.message}`);
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
  const release = cardRelease(item.name_en);
  const rows = (droppedBy ?? []).filter((d: any) => d.monsters && !isCVariant(d.monsters.name_en));
  const source = rows[0] ?? null;

  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <nav className="crumbs" aria-label="ตำแหน่งหน้า">
        <Link href="/database/cards">การ์ด</Link>
        <span className="crumbs__sep" aria-hidden="true">›</span>
        {slot ? (
          <>
            {/* The list filters on the folded value ('headgear'), not on the
                client's own wording ('Headgear'), so linking the raw string
                quietly matched nothing and showed all 315 cards. */}
            <Link href={`/database/cards?slot=${encodeURIComponent(cardSlot(item.description) ?? '')}`}>{slot}</Link>
            {cardSlot(item.description) && (
              <>
                {' · '}
                <Link href={equipmentHrefForSlot(cardSlot(item.description)!)}>ดูอุปกรณ์ที่ใส่ช่องนี้</Link>
              </>
            )}
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

      <CardHero
        id={item.id}
        name={item.name_en}
        slot={slot}
        effect={thai[0] ?? english[0] ?? null}
        buyPrice={item.buy_price}
        sellPrice={item.sell_price}
        release={release}
      />

      {english.length > 0 && (
        <div className="card card--cyan" style={{ marginTop: 20 }}>
          <h2 className="section-title">ข้อความเต็มจากในเกม</h2>
          <DescriptionLanguageToggle thaiLines={thai.length > 0 ? thai : english} englishLines={english} />
        </div>
      )}

      <CardDroppers
        error={Boolean(droppedByError)}
        rows={rows.map((d: any) => ({
          id: d.monsters.id,
          name: d.monsters.name_en,
          level: d.monsters.level ?? null,
          image: d.monsters.image_url ?? null,
          rate: d.rate ?? null,
        }))}
      />

      <div style={{ marginTop: 20 }}>
        <FeedbackButton pageType="card" entityId={String(item.id)} />
      </div>
    </main>
  );
}
