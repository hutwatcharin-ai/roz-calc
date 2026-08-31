import { describe, it, expect } from 'vitest';
import { pageWindow } from './Pagination';

describe('pageWindow', () => {
  it('lists every page when there are few', () => {
    expect(pageWindow(1, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(pageWindow(1, 1)).toEqual([1]);
  });

  it('windows around the middle with a gap on both sides', () => {
    expect(pageWindow(6, 11)).toEqual([1, null, 5, 6, 7, null, 11]);
  });

  it('opens no gap when the window touches an end', () => {
    // The off-by-one nests here: page 3's window reaches 2, which is adjacent
    // to 1, so an ellipsis would be hiding nothing.
    expect(pageWindow(3, 11)).toEqual([1, 2, 3, 4, null, 11]);
    expect(pageWindow(9, 11)).toEqual([1, null, 8, 9, 10, 11]);
  });

  it('handles the first and last page themselves', () => {
    expect(pageWindow(1, 11)).toEqual([1, 2, null, 11]);
    expect(pageWindow(11, 11)).toEqual([1, null, 10, 11]);
  });
});
