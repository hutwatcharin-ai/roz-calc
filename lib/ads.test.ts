import { describe, expect, it } from 'vitest';
import { AD_FILE_SIZES, AD_PRICES, AD_SIZES, INLINE_AD_PAGES, adToShow, adsFor, bookedUntil, fillsRow, introSeatsLeft, liveAd, priceFor, type Ad } from './ads';

const ad = (id: string, over: Partial<Ad> = {}): Ad => ({
  id,
  slot: 'top',
  advertiser: 'Shop ' + id,
  href: 'https://example.com/' + id,
  wide: `/images/ads/${id}-970.webp`,
  alt: 'ร้าน ' + id,
  starts: '2026-10-01',
  ends: '2026-10-30',
  ...over,
});

describe('bookedUntil', () => {
  it('is null for a free slot and for one whose booking has ended', () => {
    expect(bookedUntil('top', '2026-10-15', [])).toBeNull();
    expect(bookedUntil('top', '2026-10-31', [ad('a')])).toBeNull();
  });
  it('gives the last day of the running booking, only for its own slot', () => {
    expect(bookedUntil('top', '2026-10-15', [ad('a')])).toBe('2026-10-30');
    expect(bookedUntil('inline', '2026-10-15', [ad('a')])).toBeNull();
  });
  it('runs on through a booking that starts the next day, not across a gap', () => {
    const next = ad('b', { starts: '2026-10-31', ends: '2026-11-29' });
    const later = ad('c', { starts: '2026-11-05', ends: '2026-11-29' });
    expect(bookedUntil('top', '2026-10-15', [next, ad('a')])).toBe('2026-11-29');
    expect(bookedUntil('top', '2026-10-15', [ad('a'), later])).toBe('2026-10-30');
  });
  it('counts a booking that has been sold but not started when it starts today', () => {
    expect(bookedUntil('top', '2026-09-20', [ad('a')])).toBeNull();
    expect(bookedUntil('top', '2026-10-01', [ad('a')])).toBe('2026-10-30');
  });
});

describe('fillsRow', () => {
  it('fills the row with the top shape anywhere, and a strip only where the slot has a row to itself', () => {
    for (const slot of ['top', 'inline', 'list', 'bonus', 'detail', 'guide'] as const) expect(fillsRow(slot, 'top')).toBe(true);
    expect(fillsRow('bonus', 'bonus')).toBe(true);
    expect(fillsRow('detail', 'inline')).toBe(true);
    expect(fillsRow('guide', 'inline')).toBe(true);
    expect(fillsRow('inline', 'inline')).toBe(false);
    expect(fillsRow('list', 'list')).toBe(false);
  });
  it('keeps a square banner at its own size', () => {
    expect(fillsRow('detail', 'detail')).toBe(false);
    expect(fillsRow('guide', 'guide')).toBe(false);
  });
});

describe('ads', () => {
  it('shows a booking only inside its dates, the last day included', () => {
    const list = [ad('a')];
    expect(adsFor('top', '2026-09-30', list)).toEqual([]);
    expect(adsFor('top', '2026-10-01', list)).toHaveLength(1);
    expect(adsFor('top', '2026-10-30', list)).toHaveLength(1);
    expect(adsFor('top', '2026-10-31', list)).toEqual([]);
  });

  it('keeps the slots apart', () => {
    const list = [ad('a'), ad('b', { slot: 'inline' })];
    expect(adsFor('inline', '2026-10-05', list).map((x) => x.id)).toEqual(['b']);
  });

  it('gives nothing when nothing is sold, so the house ad takes the space', () => {
    expect(adToShow('top', '2026-10-05', [])).toBeNull();
  });

  it('rotates two bookings on one slot by the day', () => {
    const list = [ad('a'), ad('b')];
    expect(adToShow('top', '2026-10-02', list)?.id).toBe('a');
    expect(adToShow('top', '2026-10-03', list)?.id).toBe('b');
  });

  it('finds a live ad for a click in any slot, not only top and inline', () => {
    const list = [ad('a'), ad('d', { slot: 'detail' }), ad('g', { slot: 'guide' })];
    expect(liveAd('d', '2026-10-05', list)?.slot).toBe('detail');
    expect(liveAd('g', '2026-10-05', list)?.slot).toBe('guide');
    expect(liveAd('d', '2026-10-31', list)).toBeNull();
    expect(liveAd('zz', '2026-10-05', list)).toBeNull();
  });

  it('takes the biggest discount the length earns', () => {
    expect(priceFor('top', 1)).toBe(AD_PRICES.top);
    expect(priceFor('top', 3)).toBe(Math.round(AD_PRICES.top * 3 * 0.9));
    expect(priceFor('top', 6)).toBe(Math.round(AD_PRICES.top * 6 * 0.8));
    expect(priceFor('inline', 6)).toBe(Math.round(AD_PRICES.inline * 6 * 0.8));
  });

  it('never offers more launch seats than are left', () => {
    expect(introSeatsLeft({ ...AD_PRICES, introSeats: 3, introSeatsTaken: 5 })).toBe(0);
    expect(introSeatsLeft({ ...AD_PRICES, introSeats: 3, introSeatsTaken: 1 })).toBe(2);
  });

  it('states a size for every slot, which the page reserves', () => {
    expect(AD_SIZES.top.wide).toEqual([1200, 200]);
    expect(AD_SIZES.top.narrow).toEqual([600, 200]);
    expect(AD_SIZES.inline.wide).toEqual([728, 90]);
    expect(AD_SIZES.inline.narrow).toEqual([320, 100]);
  });

  // /advertise and /advertise/preview tell shops these sizes; a file made to
  // them must fill its box without bars, and be at least twice its width.
  it('asks for files the shape of each box, and at least twice its size', () => {
    for (const slot of Object.keys(AD_SIZES) as (keyof typeof AD_SIZES)[]) {
      for (const side of ['wide', 'narrow'] as const) {
        const [bw, bh] = AD_SIZES[slot][side];
        const [fw, fh] = AD_FILE_SIZES[slot][side];
        expect(Math.abs(fw / fh / (bw / bh) - 1), `${slot} ${side}`).toBeLessThan(0.01);
        expect(fw, `${slot} ${side}`).toBeGreaterThanOrEqual(bw * 2);
      }
    }
  });

  // The view count sold on /advertise adds up these pages, so a page that
  // gains or loses the slot must change the list too.
  it('lists exactly the pages that carry the inline slot', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const found: string[] = [];
    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (entry.name === 'page.tsx' && fs.readFileSync(full, 'utf8').includes('<AdSlot slot="inline"')) {
          found.push('/' + path.relative(path.join(process.cwd(), 'app'), path.dirname(full)).split(path.sep).join('/'));
        }
      }
    };
    walk(path.join(process.cwd(), 'app'));
    expect([...found].sort()).toEqual([...INLINE_AD_PAGES].sort());
  });
});

describe('data/ads.json bookings', () => {
  // A booking whose file is missing draws a broken picture in a slot someone
  // paid for, on every page.
  // Stills are drawn first and stay at 150 KB. A video loads after the page
  // and may take 500 KB: squeezed to 150 KB, a 28-second banner went soft
  // enough to notice (owner, 27 Nov 2026).
  it('every file a booking names is in public/, stills under 150 KB and videos under 500 KB', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const { default: file } = await import('@/data/ads.json');
    for (const booking of (file as unknown as { ads: Ad[] }).ads) {
      for (const src of [booking.wide, booking.narrow, booking.wideVideo, booking.narrowVideo]) {
        if (!src) continue;
        const local = path.join(process.cwd(), 'public', src);
        expect(fs.existsSync(local), src).toBe(true);
        expect(fs.statSync(local).size, src).toBeLessThanOrEqual((src.endsWith('.mp4') ? 500 : 150) * 1024);
      }
      expect(booking.starts <= booking.ends, booking.id).toBe(true);
    }
  });
});
