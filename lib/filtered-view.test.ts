import { describe, expect, it } from 'vitest';
import { isFilteredView, LIST_FILTER_PARAMS } from './filtered-view';

describe('isFilteredView', () => {
  it('leaves the bare list indexable', () => {
    expect(isFilteredView({})).toBe(false);
    // What an untouched form submits: keys present, all empty.
    expect(isFilteredView({ q: '', race: '', element: '', size: '', sort: '' })).toBe(false);
  });

  it('marks every filter the monster list can apply', () => {
    for (const key of LIST_FILTER_PARAMS) {
      expect(isFilteredView({ [key]: '1' }), key).toBe(true);
    }
  });

  it('counts the advanced filters added on 18 Sep 2026', () => {
    // These three were the reason this check exists; if a rename drops them
    // from the list, the HP and card views start being indexed silently.
    expect(isFilteredView({ hpmin: '500' })).toBe(true);
    expect(isFilteredView({ hpmax: '5000' })).toBe(true);
    expect(isFilteredView({ card: '1' })).toBe(true);
  });

  it('ignores params that do not change which rows are shown', () => {
    // The Challenge and instance-variant switches change the row set, but
    // they are not in the list on purpose: both are one extra view of the
    // same page, and neither is worth a noindex on a link players share.
    expect(isFilteredView({ c: '1', mj: '1' })).toBe(false);
  });

  it('handles a repeated param', () => {
    expect(isFilteredView({ element: ['Fire', 'Water'] })).toBe(true);
    expect(isFilteredView({ element: ['', ''] })).toBe(false);
  });
});
