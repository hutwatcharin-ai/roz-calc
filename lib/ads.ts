// Banners sold direct, read from data/ads.json (owner, 23 Sep 2026).
//
// Two slots: `top` under the nav on every page, `inline` inside the three
// most-read pages. A slot with nothing live shows the house ad -- an empty
// box would read as a broken page, and the house ad sells the space.
//
// Dates are plain YYYY-MM-DD and compared as strings, which is only safe
// because they are all the same shape and zero-padded; a booking runs from
// `starts` to `ends` inclusive.

import file from '@/data/ads.json';

export type AdSlot = 'top' | 'inline' | 'detail';

export interface Ad {
  id: string;
  slot: AdSlot;
  /** Who bought it, for the report and the title attribute. */
  advertiser: string;
  /** Where the click goes. Never rendered directly: clicks pass /go/ad/<id>. */
  href: string;
  /** Pictures under /public/images/ads. `wide` is the desktop one. */
  wide: string;
  narrow?: string;
  /** What a screen reader reads, supplied by the advertiser. */
  alt: string;
  starts: string;
  ends: string;
}

export interface AdPrices {
  top: number;
  inline: number;
  detail: number;
  introSeats: number;
  introSeatsTaken: number;
  discounts: { months: number; percent: number }[];
}

export interface AdStats {
  asOf: string;
  periodDays: number;
  users: number;
  sessions: number;
  pageViews: number;
  pagesPerSession: number;
  avgMinutes: number;
  desktopShare: number;
  thaiShare: number;
  topSlotViews: number;
  inlineSlotViews: number;
  detailSlotViews: number;
}

interface AdsFile {
  prices: AdPrices;
  stats: AdStats;
  ads: Ad[];
}

const data = file as unknown as AdsFile;

export const AD_PRICES: AdPrices = data.prices;
export const AD_STATS: AdStats = data.stats;

/** Pixel size of each slot, which the page reserves whether or not an ad is
 *  sold: a box that appears late shoves the article down the screen. */
export const AD_SIZES: Record<AdSlot, { wide: [number, number]; narrow: [number, number] }> = {
  top: { wide: [970, 250], narrow: [320, 100] },
  inline: { wide: [336, 280], narrow: [336, 280] },
  detail: { wide: [336, 280], narrow: [300, 250] },
};

/** The pages that carry the inline slot, the three most-read ones. */
export const INLINE_AD_PAGES = ['/database/monsters', '/database/equipment', '/tools/leveling-spots'];

export function adsFor(slot: AdSlot, today: string, ads: Ad[] = data.ads): Ad[] {
  return ads.filter((ad) => ad.slot === slot && ad.starts <= today && ad.ends >= today);
}

/** The one ad to draw. Several live bookings on a slot rotate by the day, so
 *  a slot double-booked by mistake still shows both rather than dropping one. */
export function adToShow(slot: AdSlot, today: string, ads: Ad[] = data.ads): Ad | null {
  const live = adsFor(slot, today, ads);
  if (!live.length) return null;
  const day = Number(today.slice(8, 10));
  return live[day % live.length];
}

/** Price after the length discount, rounded to the baht. */
export function priceFor(slot: AdSlot, months: number, prices: AdPrices = data.prices): number {
  const rate = prices[slot];
  const discount = [...prices.discounts].sort((a, b) => b.months - a.months).find((d) => months >= d.months);
  const total = rate * months * (1 - (discount?.percent ?? 0) / 100);
  return Math.round(total);
}

/** Seats left at the launch price. Never below zero, so the page cannot
 *  advertise "-1 seats" if the file is edited carelessly. */
export function introSeatsLeft(prices: AdPrices = data.prices): number {
  return Math.max(0, prices.introSeats - prices.introSeatsTaken);
}

/** AdSense fills the space the direct banners do not (owner, 23 Sep 2026).
 *  The publisher id is public -- it is in /ads.txt -- so it lives here rather
 *  than in an environment variable the build would have to carry. */
export const ADSENSE_CLIENT = 'ca-pub-4069644007778714';
export const ADSENSE_SLOTS = {
  /** End of a monster, gear, costume or card page. */
  detail: '5317808182',
  /** A full row inside a card grid. */
  list: '5116743616',
  /** End of a class guide. */
  guide: '4096225854',
} as const;
export type AdsenseSlot = keyof typeof ADSENSE_SLOTS;
/** Fixed sizes, the ones the slots are sold at: a responsive unit resizes
 *  itself after the script loads and shoves the page down. */
export const ADSENSE_WIDTH: Record<AdsenseSlot, { wide: number; narrow: number }> = {
  detail: { wide: 336, narrow: 300 },
  list: { wide: 728, narrow: 320 },
  guide: { wide: 336, narrow: 300 },
};
/** Height reserved before the ad arrives, so nothing moves when it does. */
export const ADSENSE_HEIGHT: Record<AdsenseSlot, { wide: number; narrow: number }> = {
  detail: { wide: 280, narrow: 250 },
  list: { wide: 90, narrow: 100 },
  guide: { wide: 280, narrow: 250 },
};
