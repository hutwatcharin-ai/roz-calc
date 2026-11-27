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
import AdMedia from './AdMedia';
import AdsenseUnit from './AdsenseUnit';

export default function AdSlot({ slot, adsense = true }: { slot: Slot; adsense?: boolean }) {
  const today = new Date().toISOString().slice(0, 10);
  const ad = adToShow(slot, today);
  // A banner may bring another slot's shape (Ad.size); the box follows it.
  const shape = ad?.size ?? slot;
  const size = ad?.narrowSize ? { ...AD_SIZES[shape], narrow: ad.narrowSize } : AD_SIZES[shape];
  const style = {
    '--ad-w': `${size.wide[0]}px`,
    '--ad-h': `${size.wide[1]}px`,
    '--ad-narrow-w': `${size.narrow[0]}px`,
    '--ad-narrow-h': `${size.narrow[1]}px`,
    '--ad-ratio': `${size.wide[0]} / ${size.wide[1]}`,
    // A banner sold without a phone picture keeps its desktop shape on a
    // phone rather than sit letterboxed in the phone-shaped box.
    '--ad-narrow-ratio': ad && !ad.narrow ? `${size.wide[0]} / ${size.wide[1]}` : `${size.narrow[0]} / ${size.narrow[1]}`,
  } as React.CSSProperties;

  // Google does not allow its ads on pages with little of our own content
  // (Publisher Policies; the site was refused for low-value content on
  // 4 Oct 2026). Such a page still shows a banner sold directly, but takes
  // no AdSense fill.
  // An empty spot still leaves an invisible marker, so /advertise/preview can
  // show a shop's banner where the slot would be.
  if (!ad && slot !== 'top' && !adsense) return <span data-slot={slot} hidden />;

  // A bonus spot exists only for the booking that came with it.
  if (!ad && slot === 'bonus') return <span data-slot={slot} hidden />;

  if (!ad && slot !== 'top') {
    // Nothing sold here: AdSense fills it rather than the space earning
    // nothing (owner, 23 Sep 2026). The top slot keeps its house ad, which is
    // how the other slots get sold in the first place.
    return <AdsenseUnit slot={slot === 'detail' ? 'detail' : slot === 'guide' ? 'guide' : 'list'} dataSlot={slot} />;
  }

  if (!ad) {
    return (
      <aside className={`adslot adslot--${slot} adslot--house`} style={style} aria-label="พื้นที่โฆษณา" data-slot={slot}>
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
    // A banner narrower than its column (a 728x90 in a wide content area)
    // shrinks the box to the picture, so the "โฆษณา" tag sits on the picture
    // and not out at the column's edge. A phone picture of its own shape
    // (Ad.narrowSize) scales with the phone's width, as the top slot does.
    <aside
      className={`adslot adslot--${slot}${shape === 'top' ? ' adslot--fluid' : ' adslot--fit'}${shape !== 'top' && ad.narrowSize ? ' adslot--phonefluid' : ''}`}
      style={style}
      aria-label="โฆษณา"
      data-slot={slot}
    >
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
        title={ad.alt}
      >
        <AdMedia ad={ad} size={size} />
      </a>
    </aside>
  );
}
