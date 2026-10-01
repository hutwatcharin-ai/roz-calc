// Where a monster's stat sits among monsters of about its level, for the
// segmented bars on the monster page (owner, 1 Oct 2026: arcade "character
// select" stat bars). Ten segments: 10 means stronger than every peer.

export const STAT_BAND = 10;

export interface StatPeer {
  id: number;
  level: number;
  value: number | null;
}

/**
 * Segments lit (0-10) for `value` among peers within STAT_BAND levels, or
 * null when the value is unknown (0 or null means not published) or there are
 * too few peers to say anything.
 */
export function statSegments(value: number | null, level: number, peers: StatPeer[], selfId: number): number | null {
  if (value == null || value <= 0) return null;
  const pool = peers.filter((p) => p.id !== selfId && Math.abs(p.level - level) <= STAT_BAND && p.value != null && p.value > 0);
  if (pool.length < 5) return null;
  const below = pool.filter((p) => (p.value as number) < value).length;
  const equal = pool.filter((p) => p.value === value).length;
  const percentile = (below + equal / 2) / pool.length;
  return Math.max(1, Math.round(percentile * 10));
}
