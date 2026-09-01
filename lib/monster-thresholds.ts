// Normalizes the two player-facing threshold columns on a monsters row.
// The DB columns are being renamed hit -> hit_100 and flee -> flee_95 (the
// old names caused a real mis-read: they look like mob stats but are the
// player HIT/FLEE targets from midgardhub). This helper accepts both
// spellings so the code works before and after the rename lands; once the
// rename is done and the selects are updated, the legacy keys can go.
export function mobThresholds(m: {
  hit_100?: number | null;
  flee_95?: number | null;
  hit?: number | null;
  flee?: number | null;
} | null | undefined): { hit100: number | null; flee95: number | null } {
  return {
    hit100: m?.hit_100 ?? m?.hit ?? null,
    flee95: m?.flee_95 ?? m?.flee ?? null,
  };
}
