import { describe, expect, it } from 'vitest';
import { AD_PRICES, AD_SIZES, adToShow, adsFor, introSeatsLeft, priceFor, type Ad } from './ads';

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
    expect(AD_SIZES.top.wide).toEqual([970, 250]);
    expect(AD_SIZES.top.narrow).toEqual([320, 100]);
    expect(AD_SIZES.inline.wide).toEqual([336, 280]);
  });
});
