// Finding the next monster to fight, for the bot and for a player at the
// keyboard alike. Both find monsters by teleporting (Creamy Card or Fly
// Wings), not by walking the map (owner, 28 Oct 2026): after each teleport
// they walk about looking, start again on finding one, and teleport once the
// idle timer -- 3 to 10 seconds as most players set it -- runs out.

import { WALK_CELLS_PER_SECOND } from './survival';

/** Seconds lost to a teleport while the map reloads. An estimate, not measured. */
export const TELEPORT_SECONDS = 1;

/**
 * The idle timer assumed for a player at the keyboard, who has no bot setting
 * to read: the bot's default, in the middle of the 3-10 seconds most use.
 */
export const PLAYER_IDLE_TELEPORT = 5;

function erf(x: number): number {
  // Abramowitz-Stegun 7.1.26, |error| < 1.5e-7.
  const t = 1 / (1 + 0.3275911 * Math.abs(x));
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return x >= 0 ? y : -y;
}

/**
 * How far the bot sees: classic RO's on-screen area (AREA_SIZE 14). The bot
 * picks targets from what the client shows; nobody has measured Zero's.
 */
export const BOT_SIGHT = 14;

/**
 * Searching from one kill to the next target, for targets at `density` a
 * cell, a bot that teleports after `idleSeconds` with nothing to fight (null:
 * never), and sees `sight` cells. Per kill: cells walked, teleports made, and
 * seconds taken (the teleports' own casting not included).
 */
export function searchModel(density: number, idleSeconds: number | null, sight: number): { cells: number; teleports: number; seconds: number } {
  if (density <= 0) return { cells: Infinity, teleports: 0, seconds: Infinity };
  const v = WALK_CELLS_PER_SECOND;
  const k = Math.sqrt(density * Math.PI);
  // A target on screen from where it stands, and the walk to it when there is one.
  const seen = 1 - Math.exp(-density * Math.PI * sight * sight);
  const toSeen = seen > 0 ? ((Math.sqrt(Math.PI) / (2 * k)) * erf(k * sight) - sight * (1 - seen)) / seen : 0;
  // Roaming sweeps 2 x sight cells of new ground for each cell walked.
  const rate = density * 2 * sight * v;
  const found = idleSeconds === null ? 1 : 1 - Math.exp(-rate * idleSeconds);
  const roam = idleSeconds === null ? 1 / rate : found / rate;
  // Once one comes into view it is about half the sight away.
  const approach = sight / 2;
  // A look from a fresh spot fails when nothing is on screen and roaming finds nothing.
  const miss = (1 - seen) * (1 - found);
  const lookCells = seen * toSeen + (1 - seen) * (roam * v + found * approach);
  const lookSeconds = lookCells / v;
  const teleports = miss / (1 - miss);
  return { cells: lookCells / (1 - miss), teleports, seconds: lookSeconds / (1 - miss) };
}
