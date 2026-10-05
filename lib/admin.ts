// The local-only admin tools (owner, 5 Oct 2026). They write to the database
// with the service-role key that lives in .env.local on the owner's PC, so
// they exist only where ENABLE_ADMIN=1 is set: the PC and its Tailscale
// preview. Production has no such variable, and every admin route answers 404
// there -- no password to guess, nothing to find.

export function adminEnabled(): boolean {
  return process.env.ENABLE_ADMIN === '1';
}

/** NPC sell price in game: half the buy price, rounded down. */
export function halfOfBuy(buy: number | null): number | null {
  return buy && buy > 0 ? Math.floor(buy / 2) : null;
}

/**
 * What the owner typed into a price box. "1,650" and "1650" are one price;
 * "150/50" is a stack's total over its count (the in-game sell window shows
 * the total), rounded down like the game does. Returns null for anything
 * that is not a whole, non-negative zeny amount.
 */
export function parsePriceInput(text: string): number | null {
  const clean = text.replace(/[,\s]/g, '').replace(/z$/i, '');
  const stack = /^(\d+)\/(\d+)$/.exec(clean);
  if (stack) {
    const total = Number(stack[1]);
    const count = Number(stack[2]);
    return count > 0 ? Math.floor(total / count) : null;
  }
  if (!/^\d+$/.test(clean)) return null;
  const n = Number(clean);
  return n <= 1_000_000_000 ? n : null;
}
