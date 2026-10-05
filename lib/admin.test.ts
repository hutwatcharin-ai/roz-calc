import { describe, expect, it } from 'vitest';
import { halfOfBuy, parsePriceInput } from './admin';

describe('parsePriceInput', () => {
  it('reads a plain price with or without commas', () => {
    expect(parsePriceInput('1650')).toBe(1650);
    expect(parsePriceInput('1,650')).toBe(1650);
    expect(parsePriceInput(' 25z ')).toBe(25);
    expect(parsePriceInput('0')).toBe(0);
  });

  it('turns a stack total over its count into a unit price, rounded down', () => {
    expect(parsePriceInput('150/50')).toBe(3);
    expect(parsePriceInput('1,000/3')).toBe(333);
  });

  it('refuses what is not a whole zeny amount', () => {
    for (const bad of ['', 'abc', '-5', '1.5', '10/0', '2000000000']) {
      expect(parsePriceInput(bad), bad).toBeNull();
    }
  });
});

describe('halfOfBuy', () => {
  it('is half the buy price rounded down, or nothing without a buy price', () => {
    expect(halfOfBuy(1650)).toBe(825);
    expect(halfOfBuy(51)).toBe(25);
    expect(halfOfBuy(0)).toBeNull();
    expect(halfOfBuy(null)).toBeNull();
  });
});
