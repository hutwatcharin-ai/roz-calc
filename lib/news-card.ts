// The picture a news page shows when shared to a Facebook group or a LINE
// chat (owner, 20 Oct 2026). Every news page used og-default.jpg, so a post
// about a new patch looked the same as one about last month's: players
// scrolling past could not tell there was news. Patch days are when the site
// gets its biggest days (1 Oct: 1,164 users against ~560 usual), most of it
// from Facebook landing on the patch page.
//
// Drawn from the same NEWS row the homepage and /news use, so a new patch
// gets its card by adding its row and running scripts/build-news-cards.mts,
// which writes app/news/<slug>/opengraph-image.png (Next serves that file as
// the page's og:image).

import { C, clip, picture, text } from '@/lib/build-card';
import type { NewsItem } from '@/lib/news';

const W = 1200;
const H = 630;

const MONTH_TH = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

/** "15 ต.ค. 2569" from the row's ISO date (Thailand time). */
export function dateThFull(iso: string): string {
  const d = new Date(new Date(iso).getTime() + 7 * 3600e3);
  return `${d.getUTCDate()} ${MONTH_TH[d.getUTCMonth()]} ${d.getUTCFullYear() + 543}`;
}

/** Break a title into at most `max` lines of about `per` characters. Phrases
 *  ending in a comma or a middle dot stay whole when they fit, so "Amon Ra"
 *  is not split across lines; a phrase too long for a line falls back to words. */
export function wrap(s: string, per: number, max: number): string[] {
  const width = (t: string) => t.replace(/[ัิ-ฺ็-๎]/g, '').length;
  const words = s
    .split(/(?<=,) +|(?<= ·) +/)
    .flatMap((p) => (width(p) > per ? p.split(/\s+/) : [p]))
    .filter(Boolean);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (cur && width(next) > per) {
      lines.push(cur);
      cur = w;
    } else {
      cur = next;
    }
  }
  if (cur) lines.push(cur);
  // No orphan: "ซีซั่น" / "1" becomes "Guild Hall of Fame" / "ซีซั่น 1".
  if (lines.length > 1 && width(lines.at(-1)!) <= 3) {
    const prev = lines.at(-2)!;
    const cut = prev.lastIndexOf(' ');
    if (cut > 0) {
      lines[lines.length - 2] = prev.slice(0, cut);
      lines[lines.length - 1] = `${prev.slice(cut + 1)} ${lines.at(-1)}`;
    }
  }
  if (lines.length > max) {
    const kept = lines.slice(0, max);
    kept[max - 1] = clip(`${kept[max - 1]} ${lines.slice(max).join(' ')}`, per);
    return kept;
  }
  return lines;
}

export interface NewsCardExtra {
  /** Sprites for a row that has no `cast` of its own (patches). */
  cast?: string[];
  /** In place of a blurb that only repeats the date ("แพทช์ 17 ก.ย."). */
  blurb?: string;
}

export function newsCardSvg(item: NewsItem, extra: NewsCardExtra = {}): string {
  const parts: string[] = [];
  const isPatch = item.kind === 'patch';
  const accent = isPatch ? C.cyan : C.pink;
  const cast = (item.cast ?? extra.cast ?? []).slice(0, 3);

  parts.push(`<defs>
    <radialGradient id="glowP" cx="0.95" cy="1.1" r="0.75"><stop offset="0" stop-color="${C.pink}" stop-opacity="0.38"/><stop offset="1" stop-color="${C.pink}" stop-opacity="0"/></radialGradient>
    <radialGradient id="glowC" cx="0" cy="0" r="0.6"><stop offset="0" stop-color="${C.cyan}" stop-opacity="0.24"/><stop offset="1" stop-color="${C.cyan}" stop-opacity="0"/></radialGradient>
    <radialGradient id="stage" cx="0.5" cy="0.85" r="0.6"><stop offset="0" stop-color="${accent}" stop-opacity="0.4"/><stop offset="1" stop-color="${accent}" stop-opacity="0"/></radialGradient>
    <pattern id="scan" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="1" fill="#000" fill-opacity="0.22"/></pattern>
  </defs>`);
  parts.push(`<rect width="${W}" height="${H}" fill="${C.bg}"/><rect width="${W}" height="${H}" fill="url(#glowP)"/><rect width="${W}" height="${H}" fill="url(#glowC)"/>`);
  parts.push(`<rect x="22" y="22" width="${W - 44}" height="${H - 44}" rx="22" fill="none" stroke="${C.pink}" stroke-width="4" transform="translate(6 6)"/>`);
  parts.push(`<rect x="22" y="22" width="${W - 44}" height="${H - 44}" rx="22" fill="none" stroke="${C.cyan}" stroke-width="4"/>`);

  // Kicker: what kind of news and when.
  const kicker = isPatch ? `▶ PATCH · แพทช์ ${dateThFull(item.date)}` : `▶ EVENT · กิจกรรม ${item.dateTh}${item.endsTh ? ` – ${item.endsTh}` : ''}`;
  parts.push(`<rect x="60" y="58" width="${Math.min(620, 60 + kicker.length * 15)}" height="50" rx="10" fill="${accent}" fill-opacity="0.14" stroke="${accent}" stroke-width="2"/>`);
  parts.push(text(80, 92, kicker, 26, accent, { bold: true, spacing: 2 }));

  // Title, the part a player reads in the feed. Lines sit size + 36 apart:
  // closer, a stacked tone mark (เจี้ยน) reaches the line above.
  // Thai vowels and tone marks above or below take no width of their own;
  // the cast box or the badge glyph take the right of the card.
  const textW = cast.length ? 640 : 1000;
  const lines = wrap(item.title, cast.length ? 20 : item.badge ? 22 : 30, 3);
  const size = lines.length >= 3 ? 54 : 62;
  lines.forEach((line, i) => parts.push(text(60, 190 + i * (size + 36), line, size, C.yellow, { bold: true })));

  // Blurb under the title.
  const blurbY = 190 + lines.length * (size + 36);
  wrap(extra.blurb ?? item.blurb, cast.length ? 34 : 52, 2).forEach((line, i) => parts.push(text(60, blurbY + i * 40, line, 28, C.text)));

  // Right: the cast on a lit stage, or the badge glyph.
  if (cast.length) {
    parts.push(`<rect x="${textW + 90}" y="130" width="${W - textW - 150}" height="360" rx="18" fill="${C.panel}" stroke="${accent}" stroke-opacity="0.7" stroke-width="3"/>`);
    parts.push(`<rect x="${textW + 90}" y="130" width="${W - textW - 150}" height="360" rx="18" fill="url(#stage)"/>`);
    const boxW = W - textW - 150;
    const each = Math.min(220, (boxW - 30) / cast.length);
    cast.forEach((src, i) => {
      const x = textW + 90 + 15 + i * ((boxW - 30) / cast.length) + ((boxW - 30) / cast.length - each) / 2;
      parts.push(picture(src, x, 470 - each - (cast.length === 1 ? 60 : 30), each));
    });
  } else if (item.badge) {
    parts.push(text(W - 110, 400, item.badge, 220, accent, { bold: true, anchor: 'end' }));
  }

  // Footer: where it lives.
  parts.push(`<line x1="60" y1="530" x2="${W - 60}" y2="530" stroke="${C.cyan}" stroke-opacity="0.25" stroke-width="2"/>`);
  parts.push(text(60, 580, 'RO Zero Thai', 30, C.text, { bold: true }));
  parts.push(text(260, 580, 'สรุปภาษาไทย', 26, C.dim));
  parts.push(text(W - 60, 580, `rozerothai.com${item.href.split('#')[0]}`, 26, C.cyan, { bold: true, anchor: 'end' }));

  parts.push(`<rect width="${W}" height="${H}" fill="url(#scan)"/>`);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${parts.join('')}</svg>`;
}
