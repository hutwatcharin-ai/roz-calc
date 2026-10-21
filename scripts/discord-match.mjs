// What a Discord announcement touches on the site, found by name (owner, 21
// Oct 2026: the Telegram line should say what to fix, so a post that moves a
// monster reads differently from a coupon). No AI: the names of our monsters
// and maps are matched as whole words against the post's text. The names file
// is written by `scripts/discord-inbox.mts names` onto the inbox branch.

/** Maintenance and patch posts: the days the site gets its most visitors. */
export const isUrgent = (title) => /maintenance|patch\s*notes?|update/i.test(title ?? '');

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Names from `names` that occur in `text` as whole words, longest first, and a
 * shorter name inside a longer match ("Cave" in "Northern Cave Luanda") is not
 * listed again. `names` is [{ name, href, kind }]. Names under 4 letters are
 * skipped, and so are one-word item names: the first run matched "Spawn",
 * "Apple" and "Arrow" (from "RO Lite - ARROW") in plain English. Case counts
 * for the same reason; the official posts write names as the game does.
 */
export function findNames(text, names, limit = 8) {
  const found = [];
  const taken = [];
  const sorted = [...names].filter((n) => n.name && n.name.length >= 4 && (n.kind !== 'item' || n.name.includes(' '))).sort((a, b) => b.name.length - a.name.length);
  for (const n of sorted) {
    const re = new RegExp(`(?<![\\p{L}\\p{N}])${escapeRe(n.name)}(?![\\p{L}\\p{N}])`, 'gu');
    let hit = null;
    for (const m of text.matchAll(re)) {
      const span = [m.index, m.index + m[0].length];
      if (!taken.some(([a, b]) => span[0] >= a && span[1] <= b)) {
        hit = span;
        break;
      }
    }
    if (!hit) continue;
    taken.push(hit);
    if (!found.some((f) => f.href === n.href)) found.push(n);
    if (found.length >= limit) break;
  }
  return found;
}
