// Banners sold direct, read from data/ads.json (owner, 23 Sep 2026).
//
// Three slots on sale: `top` under the nav on every page, `inline` inside
// the content of the most-read pages, `detail` at the end of a monster or
// item page. Three more are never sold on their own, only given with a
// booking (Gametopup.center, 26 Nov 2026, took every spot on the site):
// `bonus` on pages that had no advertising (the cash shop, new patch and
// event pages), and `list` and `guide`, the two places AdSense filled alone.
// Unsold, `top` shows the house ad -- an empty box would read as a broken
// page, and the house ad sells the space -- `inline`, `detail`, `list` and
// `guide` fall back to AdSense, and `bonus` draws nothing.
//
// Dates are plain YYYY-MM-DD and compared as strings, which is only safe
// because they are all the same shape and zero-padded; a booking runs from
// `starts` to `ends` inclusive.

import file from '@/data/ads.json';

export type AdSlot = 'top' | 'inline' | 'detail' | 'bonus' | 'list' | 'guide';
/** The slots with a price on /advertise. */
export type PricedSlot = 'top' | 'inline' | 'detail';

export interface Ad {
  id: string;
  slot: AdSlot;
  /** Who bought it, for the report. */
  advertiser: string;
  /** Where the click goes. Never rendered directly: clicks pass /go/ad/<id>. */
  href: string;
  /** Pictures under /public/images/ads. `wide` is the desktop one. */
  wide: string;
  narrow?: string;
  /** A moving banner, as a short silent looping MP4 made from the
   *  advertiser's GIF (owner, 23 Oct 2026: a GIF this size weighs 900 KB, the
   *  video 130 KB). `wide` and `narrow` stay as the still drawn first and for
   *  readers who ask for less motion. */
  wideVideo?: string;
  narrowVideo?: string;
  /** Draw at another slot's size. Gametopup.center sent one banner shape for
   *  every spot (1200x200 on a desktop, 2000x667 on a phone) rather than a
   *  picture per slot, so its bookings outside the top slot say "top". */
  size?: AdSlot;
  /** The phone picture's own pixel size when it is not the slot's phone shape
   *  (a phone picture sent in a shape other than the slot's own),
   *  so the box takes the picture's shape instead of letterboxing it. */
  narrowSize?: [number, number];
  /** What a screen reader reads and the hover text, supplied by the advertiser. */
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
  // The top slot spans the content column, 1200 px on a desktop, and scales
  // with the screen below that, keeping its shape (owner, 23 Oct 2026: the
  // advertiser wanted it as wide as the cards under it, and lower).
  // 3:1 on a phone (owner, 27 Nov 2026): the shape Gametopup.center sent,
  // and the one /advertise now asks for.
  top: { wide: [1200, 200], narrow: [600, 200] },
  // A strip, not a square: it sits between rows of cards, and the unsold
  // AdSense unit in the same place is 728x90 / 320x100, so a sold banner now
  // looks like what readers already see there (owner, 24 Oct 2026).
  inline: { wide: [728, 90], narrow: [320, 100] },
  detail: { wide: [336, 280], narrow: [300, 250] },
  // The given-away slots keep the shape of what was there before, so an
  // unsold one changes nothing. A banner in them brings its own `size`.
  bonus: { wide: [728, 90], narrow: [320, 100] },
  list: { wide: [728, 90], narrow: [320, 100] },
  guide: { wide: [336, 280], narrow: [300, 250] },
};

/** The picture size to ask a shop for: twice the box, so it stays sharp on
 *  the 2x and 3x screens most readers have. A 728x90 file drawn at 728x90 on
 *  such a screen looked soft next to a larger one (Gametopup.center, 27 Nov
 *  2026). The top slot's set may be sent for every slot instead. */
export const AD_FILE_SIZES: Record<AdSlot, { wide: [number, number]; narrow: [number, number] }> = {
  top: { wide: [2400, 400], narrow: [1920, 640] },
  inline: { wide: [1456, 180], narrow: [640, 200] },
  detail: { wide: [672, 560], narrow: [600, 500] },
  bonus: { wide: [1456, 180], narrow: [640, 200] },
  list: { wide: [1456, 180], narrow: [640, 200] },
  guide: { wide: [672, 560], narrow: [600, 500] },
};

/** Whether a banner fills its row instead of sitting at its box's size. The
 *  top slot always does. A long strip does too in the slots that have a
 *  whole row to themselves -- Cash Shop/patch/event, monster and item detail,
 *  the class guides -- (owner, 27 Nov 2026: Gametopup.center wanted its long
 *  banners "full width like the others" there, not centred in a 728 or a
 *  square box). In the inline slot and the card table a strip stays 728 wide,
 *  the size of the Google unit readers see in the same place. */
export function fillsRow(slot: AdSlot, shape: AdSlot): boolean {
  if (shape === 'top') return true;
  if (slot === 'inline' || slot === 'list') return false;
  const [w, h] = AD_SIZES[shape].wide;
  return w / h > 4;
}

/** Every page that carries the inline slot, for the view count on /advertise.
 *  A test keeps it in step with the pages themselves; the monster list stays
 *  first, /advertise links to it as the most-read page. */
export const INLINE_AD_PAGES = [
  '/database/monsters',
  '/database/equipment',
  '/tools/leveling-spots',
  '/tools/bot-setup',
  '/tools/enchant',
  '/tools/weight',
  '/guides/clock-tower-hats',
  '/guides/costume-craft',
  '/guides/faq',
  '/guides/guild',
  '/guides/homunculus',
  '/guides/nordfeld-helm',
  '/guides/sp-recovery',
  '/guides/star-gear',
  '/guides/woe',
  '/news/roadmap',
  '/database/cards',
  '/database/costumes',
  '/drop-finder',
  '/news/patch-2026-10-29',
  '/news/patch-2026-11-12',
];

export function adsFor(slot: AdSlot, today: string, ads: Ad[] = data.ads): Ad[] {
  return ads.filter((ad) => ad.slot === slot && ad.starts <= today && ad.ends >= today);
}

/** A live ad in any slot, for the click route. */
export function liveAd(id: string, today: string, ads: Ad[] = data.ads): Ad | null {
  return ads.find((ad) => ad.id === id && ad.starts <= today && ad.ends >= today) ?? null;
}

/** The one ad to draw. Several live bookings on a slot rotate by the day, so
 *  a slot double-booked by mistake still shows both rather than dropping one. */
export function adToShow(slot: AdSlot, today: string, ads: Ad[] = data.ads): Ad | null {
  const live = adsFor(slot, today, ads);
  if (!live.length) return null;
  const day = Number(today.slice(8, 10));
  return live[day % live.length];
}

/** The last day a slot is booked, counting bookings that have not started
 *  yet; null when it is free from today. /advertise shows it so a shop does
 *  not write in for a slot that is taken. Back-to-back bookings run together:
 *  a gap of even one day means the slot is free from that day, and that is
 *  where this stops. */
export function bookedUntil(slot: AdSlot, today: string, ads: Ad[] = data.ads): string | null {
  const ahead = ads.filter((ad) => ad.slot === slot && ad.ends >= today).sort((a, b) => a.starts.localeCompare(b.starts));
  let until: string | null = null;
  let from = today;
  for (const ad of ahead) {
    if (ad.starts > from) break;
    if (!until || ad.ends > until) until = ad.ends;
    const next = new Date(until + 'T00:00:00Z');
    next.setUTCDate(next.getUTCDate() + 1);
    from = next.toISOString().slice(0, 10);
  }
  return until;
}

/** Price after the length discount, rounded to the baht. */
export function priceFor(slot: PricedSlot, months: number, prices: AdPrices = data.prices): number {
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
