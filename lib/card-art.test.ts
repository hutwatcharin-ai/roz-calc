// The failure to guard against is a card back passing for a card's artwork,
// so the tests are about telling those two apart -- not about the file
// existing.
import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import {
  hasCardArt,
  cardArtUrl,
  cardArtThumbUrl,
  cardArtAlt,
  CARDS_WITH_ART,
  CARDS_WITHOUT_ART,
} from '@/lib/card-art';
import file from '@/data/card-art.json';

const data = file as { withArt: number[]; withoutArt: Record<string, string> };

describe('card art', () => {
  it('serves a file that is actually on disk for every card it claims art for', () => {
    // The index and the images are produced by two separate scripts; if the
    // second one is not run, every one of these pages 404s its own picture.
    for (const id of data.withArt) {
      expect(fs.existsSync(path.join('public', 'images', 'cards', `${id}.webp`)), `full art for ${id}`).toBe(true);
      expect(fs.existsSync(path.join('public', 'images', 'cards', 'thumb', `${id}.webp`)), `thumb for ${id}`).toBe(true);
    }
    expect(fs.existsSync(path.join('public', 'images', 'cards', 'back.webp'))).toBe(true);
    expect(fs.existsSync(path.join('public', 'images', 'cards', 'thumb', 'back.webp'))).toBe(true);
  });

  it('never claims art for a card whose picture belongs to another card', () => {
    // ratemyserver answers 200 for Picky Poring with Poring's picture. Serving
    // it would be the page stating something false about the card.
    expect(hasCardArt(4545)).toBe(false);
    expect(cardArtUrl(4545)).toBe('/images/cards/back.webp');
    expect(data.withoutArt['4545']).toContain('same image as 4001');
  });

  it('falls back to the card back, and says so in the alt text', () => {
    expect(cardArtThumbUrl(300938)).toBe('/images/cards/thumb/back.webp');
    expect(cardArtAlt(300938, 'Gem Poring Card')).toBe('ยังไม่มีรูปการ์ด Gem Poring Card');
    expect(cardArtAlt(4001, 'Poring Card')).toBe('รูปการ์ด Poring Card');
  });

  it('has a card with art pointing at its own file', () => {
    expect(hasCardArt(4001)).toBe(true);
    expect(cardArtUrl(4001)).toBe('/images/cards/4001.webp');
    expect(cardArtThumbUrl(4001)).toBe('/images/cards/thumb/4001.webp');
  });

  it('counts what the page says out loud', () => {
    expect(CARDS_WITH_ART).toBe(data.withArt.length);
    expect(CARDS_WITHOUT_ART).toBe(Object.keys(data.withoutArt).length);
    expect(CARDS_WITH_ART + CARDS_WITHOUT_ART).toBe(315);
  });
});
