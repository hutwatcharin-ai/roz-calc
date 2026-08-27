// Formatting for kill-rate figures.
//
// Kept out of the components because the two surfaces that show these numbers
// have to agree, and because rounding is where a correct calculation turns into
// a wrong claim: Lord Of Death has 112,838,250 HP, so a 1,200-damage player
// kills 0.096 of one per hour. Rounded to a whole number that reads "0 kills
// per hour" on the same card as "943,858 EXP per hour", which is a
// contradiction the arithmetic never made.

// Below one, two decimals; below ten, one; above that, none. A kill rate of
// 0.10 is a real answer -- "0" is not.
export function formatKillsPerHour(killsPerHour: number): string {
  if (!Number.isFinite(killsPerHour)) return '—';
  if (killsPerHour < 1) return killsPerHour.toFixed(2);
  if (killsPerHour < 10) return killsPerHour.toFixed(1);
  return Math.round(killsPerHour).toLocaleString();
}

// Seconds up to a minute, minutes up to an hour, hours beyond. "37,613 วินาที"
// is technically right and useless; "10.4 ชั่วโมง" is the same fact in a unit a
// player can act on.
export function formatKillTime(secondsToKill: number): string {
  if (!Number.isFinite(secondsToKill) || secondsToKill <= 0) return '—';
  if (secondsToKill < 10) return `${secondsToKill.toFixed(1)} วินาที`;
  if (secondsToKill < 60) return `${Math.round(secondsToKill)} วินาที`;
  if (secondsToKill < 3600) return `${(secondsToKill / 60).toFixed(1)} นาที`;
  return `${(secondsToKill / 3600).toFixed(1)} ชั่วโมง`;
}

export function formatExpPerHour(expPerHour: number): string {
  if (!Number.isFinite(expPerHour)) return '—';
  if (expPerHour < 1) return expPerHour.toFixed(2);
  return Math.round(expPerHour).toLocaleString();
}
