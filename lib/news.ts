// Every news page under /news, in one list (2 Oct 2026). The homepage
// NOW PLAYING block and the /news index both read it, so a new patch or event
// is one row here instead of a chip edited into the homepage by hand -- the
// owner could not find the news chips at the bottom of the homepage, and a
// player arriving fresh had no way in at all.
//
// An event leaves NOW PLAYING by itself when `ends` passes; the newest patch
// stays there until a newer one is added.

export type NewsKind = 'event' | 'patch' | 'timeline';

export interface NewsItem {
  href: string;
  kind: NewsKind;
  /** Card heading. */
  title: string;
  blurb: string;
  /** ISO time it started (events) or shipped (patches). */
  date: string;
  /** Thai date shown on the card, as the page itself writes it. */
  dateTh: string;
  /** ISO time an event ends -- the maintenance that closes it. */
  ends?: string;
  endsTh?: string;
  /** Big glyph on a side card (the level cap for a patch). */
  badge?: string;
  /** Sprites from the game shown on the lead card. */
  cast?: string[];
}

export const NEWS: NewsItem[] = [
  {
    href: '/news/events-2026-10',
    kind: 'event',
    title: 'กิจกรรม ต.ค. · Baphomet Cult · Amon Ra · Kumamon',
    blurb: 'วิธีทำเควสครบ พิกัด /navi ของที่ต้องเตรียม มอนที่ดรอป รางวัลคอสตูม และบัฟรายวัน',
    date: '2026-10-01T16:00:00+07:00',
    dateTh: '1 ต.ค.',
    ends: '2026-10-29T10:00:00+07:00',
    endsTh: '29 ต.ค.',
    cast: [
      '/images/events/2026-10/raymond.png',
      '/images/events/2026-10/amon-ra.png',
      '/images/events/2026-10/kumamon.png',
    ],
  },
  {
    href: '/news/patch-2026-10-01',
    kind: 'patch',
    title: 'เลเวล 70, Labyrinth Forest, Sphinx, Mjolnir',
    blurb: 'ของใหม่ มอนใหม่ ดันใหม่ 3 ที่',
    date: '2026-10-01T16:00:00+07:00',
    dateTh: '1 ต.ค.',
    badge: '70',
  },
  {
    href: '/news/battle-pass-summer-2026',
    kind: 'event',
    title: 'Battle Pass ฤดูร้อน',
    blurb: 'รางวัลทุก Tier และวิธีไต่',
    date: '2026-09-10T18:00:00+07:00',
    dateTh: '10 ก.ย.',
    // lib/battle-pass-summer.ts: ends at the 24 Dec maintenance. The hour is
    // not announced; 10:00 is the usual maintenance start, used for the
    // day count only.
    ends: '2026-12-24T10:00:00+07:00',
    endsTh: '24 ธ.ค.',
    badge: 'BP',
  },
  {
    href: '/news/patch-2026-09-17',
    kind: 'patch',
    title: 'MVP ใหม่ 4 ตัว, Pyramid, Geffen Dungeon, WoE',
    blurb: 'แพทช์ 17 ก.ย.',
    date: '2026-09-17T16:00:00+07:00',
    dateTh: '17 ก.ย.',
  },
  {
    href: '/news/patch-2026-09-03',
    kind: 'patch',
    title: 'เลเวล 60, อาชีพ 2, ดันเจี้ยนใหม่',
    blurb: 'แพทช์ 3 ก.ย.',
    date: '2026-09-03T16:00:00+07:00',
    dateTh: '3 ก.ย.',
    badge: '60',
  },
];

export const TIMELINE: NewsItem = {
  href: '/news/roadmap',
  kind: 'timeline',
  title: 'ไทม์ไลน์อัปเดต',
  blurb: 'มาแล้วอะไร เดือนหน้ามีอะไร',
  date: '',
  dateTh: '',
};

const DAY = 86400000;

/** Whole days left, counting a part day as one; null once it has ended. */
export function daysLeft(item: NewsItem, now: number): number | null {
  if (!item.ends) return null;
  const left = Date.parse(item.ends) - now;
  return left > 0 ? Math.ceil(left / DAY) : null;
}

export function isLive(item: NewsItem, now: number): boolean {
  return item.kind === 'event' && daysLeft(item, now) !== null && Date.parse(item.date) <= now;
}

/** NOW PLAYING: running events (soonest to end first), then the newest
 *  patch. Everything else is the archive, newest first. */
export function splitNews(now: number): { live: NewsItem[]; archive: NewsItem[] } {
  const events = NEWS.filter((n) => isLive(n, now)).sort((a, b) => Date.parse(a.ends!) - Date.parse(b.ends!));
  const patches = NEWS.filter((n) => n.kind === 'patch' && Date.parse(n.date) <= now).sort(
    (a, b) => Date.parse(b.date) - Date.parse(a.date),
  );
  const live = [...events, ...patches.slice(0, 1)];
  const archive = NEWS.filter((n) => !live.includes(n) && Date.parse(n.date) <= now).sort(
    (a, b) => Date.parse(b.date) - Date.parse(a.date),
  );
  return { live, archive };
}
