// One advertising slot (lib/ads). Sold space draws the advertiser's picture;
// unsold space draws the house ad, which sells the slot itself -- an empty
// box reads as a broken page, and a slot nobody can see sells nothing.
//
// Every slot reserves its pixels whether or not an ad is sold, so a picture
// that arrives late never shoves the page down (the site scores 96-97 on
// PageSpeed and CLS 0; keep it that way).

import Link from 'next/link';
import { AD_SIZES, adToShow, type AdSlot as Slot } from '@/lib/ads';
import AdImpression from './AdImpression';

export default function AdSlot({ slot }: { slot: Slot }) {
  const today = new Date().toISOString().slice(0, 10);
  const ad = adToShow(slot, today);
  const size = AD_SIZES[slot];
  const style = {
    '--ad-w': `${size.wide[0]}px`,
    '--ad-h': `${size.wide[1]}px`,
    '--ad-narrow-w': `${size.narrow[0]}px`,
    '--ad-narrow-h': `${size.narrow[1]}px`,
  } as React.CSSProperties;

  if (!ad) {
    return (
      <aside className={`adslot adslot--${slot} adslot--house`} style={style} aria-label="พื้นที่โฆษณา">
        <span className="adslot__tag">พื้นที่โฆษณา</span>
        <Link href="/advertise" className="adslot__house">
          <strong>ลงโฆษณาตรงนี้</strong>
          {/* No price here on the owner's call (23 Sep 2026); the page has it. */}
          <span>ถึงคนเล่น Ragnarok Zero ไทย</span>
          <em>ดูตำแหน่งและราคา →</em>
        </Link>
      </aside>
    );
  }

  return (
    <aside className={`adslot adslot--${slot}`} style={style} aria-label="โฆษณา">
      <span className="adslot__tag">โฆษณา</span>
      <AdImpression id={ad.id} slot={slot} advertiser={ad.advertiser} />
      {/* The click goes through our own route, so the count is ours and does
          not depend on the advertiser telling us the truth. rel=sponsored
          says what the link is; nofollow keeps it out of the link graph. */}
      <a
        href={`/go/ad/${ad.id}`}
        className="adslot__link"
        rel="sponsored nofollow noopener"
        target="_blank"
        title={ad.advertiser}
      >
        <picture>
          {ad.narrow && <source media="(max-width: 700px)" srcSet={ad.narrow} width={size.narrow[0]} height={size.narrow[1]} />}
          <img
            src={ad.wide}
            alt={ad.alt}
            width={size.wide[0]}
            height={size.wide[1]}
            loading="lazy"
            decoding="async"
          />
        </picture>
      </a>
    </aside>
  );
}
