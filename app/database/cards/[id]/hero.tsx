// The card page's hero and drop list.
//
// Split out of the page so the two candidate layouts could be built and
// screenshotted side by side (9 Sep 2026); the cabinet layout lost and is
// gone. What is left is the one that shipped: artwork beside the answer.
import Link from 'next/link';
import CardSlab from '@/components/CardSlab';
import DropperGrid from '@/components/DropperGrid';
import SlabBody from '@/components/SlabBody';
import { cardArtAlt, cardArtUrl, hasCardArt } from '@/lib/card-art';
import type { CardRelease } from '@/lib/card-availability';
import { releaseText } from '@/lib/card-availability';

export interface CardHeroProps {
  id: number;
  name: string;
  slot: string | null;
  effect: string | null;
  buyPrice: number | null;
  sellPrice: number | null;
  release: CardRelease | null;
}

function price(value: number | null): string {
  return value === null ? '—' : value.toLocaleString('en-US');
}

function Art({ id, name, slot }: { id: number; name: string; slot: string | null }) {
  const art = hasCardArt(id);
  const figure = (
    <figure className="cardframe">
      <img
        className={art ? 'cardframe__art' : 'cardframe__art cardframe__art--none'}
        src={cardArtUrl(id)}
        alt={cardArtAlt(id, name)}
        width={150}
        height={200}
      />
      {!art && <figcaption className="cardframe__note">ยังไม่มีรูปการ์ดใบนี้ ที่เห็นคือหลังการ์ดทั่วไป</figcaption>}
    </figure>
  );
  // Only real art opens the slab; the generic card back has nothing to see.
  // Real art sits in a small slab on the page too (owner, 1 Oct 2026).
  if (!art) return figure;
  const src = cardArtUrl(id);
  const alt = cardArtAlt(id, name);
  return (
    <CardSlab id={id} name={name} src={src} alt={alt} slot={slot}>
      <SlabBody id={id} name={name} slot={slot} src={src} alt={alt} mini />
    </CardSlab>
  );
}

function ReleaseLine({ release }: { release: CardRelease }) {
  return (
    <p className="cardsoon__line">
      <strong>ยังไม่เปิดในเซิร์ฟโกลบอล</strong> คาดว่ามาพร้อมแพตช์ {releaseText(release)} ({release.sources.join(' + ')})
    </p>
  );
}

/** Art beside the answer; everything the page also says elsewhere is demoted. */
export function CardHero(props: CardHeroProps) {
  const { id, name, slot, effect, buyPrice, sellPrice, release } = props;
  return (
    <section className="cardhero">
      <Art id={id} name={name} slot={slot} />
      <div className="cardhero__body">
        <p className="cardhero__kicker">
          การ์ด{slot && <> · ใส่ช่อง {slot}</>} · <span className="mono">ID {id}</span>
        </p>
        <h1 className="cardhero__name">{name}</h1>
        {/* Labelled and boxed (owner, 1 Oct 2026): as a bare line under the
            name it did not read as "this is what the card does". */}
        {effect && (
          <div className="cardeffect">
            <p className="cardeffect__hd">
              <span className="cardeffect__tag" aria-hidden="true">EFFECT</span> คุณสมบัติการ์ด
            </p>
            <p className="cardhero__effect">{effect}</p>
          </div>
        )}
        {release && <ReleaseLine release={release} />}
        <dl className="specrow">
          <div className="specrow__cell">
            <dt>ใส่ช่อง</dt>
            <dd>{slot ?? '—'}</dd>
          </div>
          <div className="specrow__cell">
            <dt>ราคาซื้อ</dt>
            <dd className="mono">{price(buyPrice)}</dd>
          </div>
          <div className="specrow__cell">
            <dt>ราคาขาย</dt>
            <dd className="mono">{price(sellPrice)}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}

export interface DropRow {
  id: number;
  name: string;
  level: number | null;
  image: string | null;
  rate: number | null;
}

/** The drop list as rows with a rate bar. */
export function CardDroppers({ rows, error }: { rows: DropRow[]; error: boolean }) {
  return (
    <section className="droplist">
      <h2 className="section-title">มอนสเตอร์ที่ดรอปการ์ดใบนี้</h2>
      {error ? (
        <p className="muted">โหลดข้อมูลมอนสเตอร์ที่ดรอปไม่สำเร็จ ลองใหม่อีกครั้ง</p>
      ) : rows.length === 0 ? (
        <p className="muted">ไม่มีข้อมูลมอนสเตอร์ที่ดรอปการ์ดใบนี้</p>
      ) : (
        // Same sprite cards as the item and gear pages (1 Oct 2026, arcade
        // standard); every dropper of a card is CARD tier, gold.
        <DropperGrid
          isCard
          droppers={rows.map((r) => ({ rate: r.rate, monsters: { id: r.id, name_en: r.name, image_url: r.image, level: r.level } }))}
        />
      )}
    </section>
  );
}
