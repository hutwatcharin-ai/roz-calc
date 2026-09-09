// The card page's hero and drop list.
//
// Split out of the page so the two candidate layouts could be built and
// screenshotted side by side (9 Sep 2026); the cabinet layout lost and is
// gone. What is left is the one that shipped: artwork beside the answer.
import Link from 'next/link';
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

function Art({ id, name }: { id: number; name: string }) {
  const art = hasCardArt(id);
  return (
    <figure className="cardframe">
      <img
        className={art ? 'cardframe__art' : 'cardframe__art cardframe__art--none'}
        src={cardArtUrl(id)}
        alt={cardArtAlt(id, name)}
        width={150}
        height={200}
      />
      {!art && <figcaption className="cardframe__note">ยังไม่มีรูปการ์ดใบนี้ — ที่เห็นคือหลังการ์ดทั่วไป</figcaption>}
    </figure>
  );
}

function ReleaseLine({ release }: { release: CardRelease }) {
  return (
    <p className="cardsoon__line">
      <strong>ยังไม่เปิดในเซิร์ฟโกลบอล</strong> — คาดว่ามาพร้อมแพตช์ {releaseText(release)} ({release.sources.join(' + ')})
    </p>
  );
}

/** Art beside the answer; everything the page also says elsewhere is demoted. */
export function CardHero(props: CardHeroProps) {
  const { id, name, slot, effect, buyPrice, sellPrice, release } = props;
  return (
    <section className="cardhero">
      <Art id={id} name={name} />
      <div className="cardhero__body">
        <p className="cardhero__kicker">
          การ์ด{slot && <> · ใส่ช่อง {slot}</>} · <span className="mono">ID {id}</span>
        </p>
        <h1 className="cardhero__name">{name}</h1>
        {effect && <p className="cardhero__effect">{effect}</p>}
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
  // The bar is a shape for comparing rows at a glance; the number beside it is
  // the fact. Square-rooted because 0.01% and 0.2% are both "rare" and a
  // linear bar would render every card's droppers as an empty strip.
  const widest = Math.max(...rows.map((r) => Math.sqrt(r.rate ?? 0)), 0.0001);
  return (
    <section className="droplist">
      <h2 className="section-title">มอนสเตอร์ที่ดรอปการ์ดใบนี้</h2>
      {error ? (
        <p className="muted">โหลดข้อมูลมอนสเตอร์ที่ดรอปไม่สำเร็จ ลองใหม่อีกครั้ง</p>
      ) : rows.length === 0 ? (
        <p className="muted">ไม่มีข้อมูลมอนสเตอร์ที่ดรอปการ์ดใบนี้</p>
      ) : (
        <ul className="droplist__rows">
          {rows.map((row) => (
            <li key={row.id} className="droprow">
              <Link className="droprow__who" href={`/database/monsters/${row.id}`}>
                {row.image ? (
                  <img className="droprow__sprite" src={row.image} alt="" width={28} height={28} />
                ) : (
                  <span className="droprow__sprite droprow__sprite--none" aria-hidden="true" />
                )}
                <span className="droprow__name">{row.name}</span>
                {/* Two monsters share a name often enough that the level is
                    what tells the reader which row is which. */}
                <span className="droprow__level">Lv {row.level ?? '—'}</span>
              </Link>
              <span className="droprow__rate">
                <span
                  className="droprow__bar"
                  style={{ width: `${Math.max(6, (Math.sqrt(row.rate ?? 0) / widest) * 100)}%` }}
                  aria-hidden="true"
                />
                <span className="droprow__num mono">{row.rate != null ? `${row.rate}%` : '?'}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
