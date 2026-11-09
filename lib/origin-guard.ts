// Direct-to-origin lock (docs/superpowers/specs/2026-11-09-bot-protection-design.md, step 1).
//
// Every Cloudflare rule (rate limit, bot blocks, honeypot) only sees traffic
// that goes through Cloudflare. The origin IP answers anyone who connects to
// it directly, and such a request can also forge cf-connecting-ip. A
// Cloudflare Transform Rule stamps `x-origin-key` on every proxied request;
// a request to the apex host without the right key did not come through
// Cloudflare.
//
// Modes:
//   ORIGIN_KEY unset          -> off (local dev, and every deploy before setup)
//   ORIGIN_GUARD unset / log  -> let it through, log it (the first day)
//   ORIGIN_GUARD=enforce      -> 403
// Switching straight to enforce while the Transform Rule is missing would 403
// the whole site, which is what the log phase is for.

export const ORIGIN_KEY_HEADER = 'x-origin-key';

export type OriginVerdict = 'off' | 'pass' | 'log' | 'reject';

/** Length-independent comparison, so the key cannot be guessed byte by byte from timing. */
function sameKey(given: string, expected: string): boolean {
  let diff = given.length ^ expected.length;
  for (let i = 0; i < expected.length; i++) {
    diff |= (given.charCodeAt(i) || 0) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}

export function originVerdict(
  givenKey: string | null,
  expectedKey: string | undefined,
  mode: string | undefined,
): OriginVerdict {
  if (!expectedKey) return 'off';
  if (givenKey !== null && sameKey(givenKey, expectedKey)) return 'pass';
  return mode === 'enforce' ? 'reject' : 'log';
}

/**
 * The visitor's address for per-IP limits. cf-connecting-ip is believed only
 * when the request carries the origin key (or the lock is not set up yet);
 * otherwise a direct caller could name any address, dodge its own limit or
 * burn someone else's.
 */
export function clientIp(headers: Headers): string {
  const verdict = originVerdict(headers.get(ORIGIN_KEY_HEADER), process.env.ORIGIN_KEY, process.env.ORIGIN_GUARD);
  const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  if (verdict === 'off' || verdict === 'pass') {
    return headers.get('cf-connecting-ip') ?? forwarded ?? 'local';
  }
  // Unkeyed: the last x-forwarded-for hop is the one our own proxy appended.
  const hops = headers.get('x-forwarded-for')?.split(',').map((h) => h.trim()).filter(Boolean) ?? [];
  return hops[hops.length - 1] ?? 'direct';
}
