// The pieces every farm mode shares: who stands on a map, how long a kill
// takes, what the level gap does to drops, and how channel copies fold.

import { killRate } from '../kills-per-hour';
import { hitChanceVsMob, mobHitChance } from '../hit-flee';
import { dropPenalty } from '../drop-penalty';
import { attacksPerSecond, castsPerSecond, type PlayerNumbers } from '../player-numbers';
import {
  LEVEL_ABOVE,
  LEVEL_BELOW,
  LEVEL_FLAT_ABOVE,
  MAX_HITS_TO_KILL,
  MIN_HIT_PERCENT,
  STEADY_DROPS_PER_NIGHT, type BotStyle, type FarmMap, type FarmMonster, type MapRow, type PlayerInput } from './types';

/** Every monster standing on the map, known or not; amount 0 when uncounted. */
export function metOn(map: FarmMap, monsters: Record<number, FarmMonster>): MapRow[] {
  const rows: MapRow[] = [];
  for (const spawn of map.spawns) {
    const m = monsters[spawn.id];
    if (m) rows.push({ m, amount: spawn.amount ?? 0 });
  }
  return rows;
}

/**
 * The monsters a bot -- or a player -- can count on meeting all session.
 * An MVP or a one-at-a-time spawn is met now and then, not farmed; before this
 * rule a lone Eclipse topped the level ranking at 11,556,000 EXP/hour.
 */
export function farmedOn(map: FarmMap, monsters: Record<number, FarmMonster>): MapRow[] {
  return metOn(map, monsters).filter((row) => !row.m.isMvp && !row.m.solo && row.m.hp !== null && row.m.hp > 0 && row.amount > 0);
}

export function headcount(rows: MapRow[]): number {
  return rows.reduce((sum, row) => sum + row.amount, 0);
}

/** 1 from LEVEL_BELOW under the player to LEVEL_FLAT_ABOVE over, falling to 0 at LEVEL_ABOVE over. */
export function levelWeight(monsterLevel: number, playerLevel: number): number {
  const gap = monsterLevel - playerLevel;
  if (gap < -LEVEL_BELOW) return 0;
  if (gap <= LEVEL_FLAT_ABOVE) return 1;
  return Math.max(0, (LEVEL_ABOVE - gap) / (LEVEL_ABOVE - LEVEL_FLAT_ABOVE));
}

export function canRate(player: PlayerInput): boolean {
  return player.damage !== null && player.perSecond !== null;
}

export function canGate(player: PlayerInput): boolean {
  return player.flee !== null;
}

export function playerFromNumbers(numbers: PlayerNumbers, style: BotStyle): PlayerInput {
  const perSecond = style === 'magic' ? castsPerSecond(numbers.castSeconds) : attacksPerSecond(numbers.aspd);
  return {
    style,
    level: numbers.level ?? null,
    damage: numbers.damagePerHit ?? null,
    perSecond,
    hit: style === 'magic' ? null : numbers.hit ?? null,
    flee: numbers.flee ?? null,
    maxHp: numbers.maxHp ?? null,
    def: numbers.def ?? null,
    vit: numbers.vit ?? null,
    potionId: numbers.potionId ?? null,
    potions: numbers.potions ?? null,
    maxWeight: numbers.maxWeight ?? null,
    weightNow: numbers.weightNow ?? null,
    maxSp: numbers.maxSp ?? null,
    walkSeconds: numbers.walkSeconds ?? null,
  };
}

/** % the player's attack lands; 100 for a caster, null when either figure is missing. */
export function myHitChance(m: FarmMonster, player: PlayerInput): number | null {
  if (player.style === 'magic') return 100;
  if (player.hit === null || m.hit100 === null) return null;
  return hitChanceVsMob(player.hit, m.hit100);
}

/**
 * Whether a player at the keyboard would level on this monster: it dies in
 * MAX_HITS_TO_KILL hits and they land MIN_HIT_PERCENT of swings (HIT not
 * entered counts as landing every one, as secondsPerKill does). Needs damage.
 */
export function canFight(m: FarmMonster, player: PlayerInput): boolean {
  if (player.damage === null || player.damage <= 0 || m.hp === null) return false;
  const perHit = m.oneDamage ? 1 : player.damage;
  if (Math.ceil(m.hp / perHit) > MAX_HITS_TO_KILL) return false;
  return (myHitChance(m, player) ?? 100) >= MIN_HIT_PERCENT;
}

/** The player's first hit kills it (owner, 30 Oct 2026: then dodging matters little or not at all). */
export function killsInOneHit(m: FarmMonster, player: PlayerInput): boolean {
  if (player.damage === null || player.damage <= 0 || m.hp === null || m.hp <= 0) return false;
  return m.oneDamage ? m.hp <= 1 : player.damage >= m.hp;
}

/** % the monster lands on the player; null without FLEE or its flee95. */
export function theirHitChance(m: FarmMonster, player: PlayerInput): number | null {
  if (player.flee === null || m.flee95 === null) return null;
  return mobHitChance(m.flee95, player.flee);
}

export function secondsPerKill(m: FarmMonster, player: PlayerInput): number | null {
  if (!canRate(player) || m.hp === null) return null;
  const rate = killRate({
    monsterHp: m.hp,
    // A plant takes 1 a hit however hard the player hits (owner, 19 Oct 2026).
    damagePerHit: m.oneDamage ? 1 : (player.damage as number),
    attacksPerSecond: player.perSecond as number,
    hitChancePercent: myHitChance(m, player),
  });
  return rate ? rate.secondsToKill : null;
}

export type DropTag = 'halved' | 'unconfirmed';

/**
 * What the level gap does to drop rates, counting only what the game's own
 * guide states: up to 19 levels nothing, beyond 40 halved. The 20-40 band is
 * not stated anywhere, so it counts in full and carries a tag instead of a guess.
 */
export function dropFactor(playerLevel: number | null, monsterLevel: number | null): number {
  if (playerLevel === null || monsterLevel === null) return 1;
  return dropPenalty(playerLevel, monsterLevel) === 'halved' ? 0.5 : 1;
}

export function dropTag(playerLevel: number | null, monsterLevel: number | null): DropTag | null {
  if (playerLevel === null || monsterLevel === null) return null;
  const penalty = dropPenalty(playerLevel, monsterLevel);
  if (penalty === 'halved') return 'halved';
  if (penalty === 'unknown') return 'unconfirmed';
  return null;
}

/** Zeny per kill from the drops a night of `kills` would see at least three times. */
export function steadyPerKill(m: FarmMonster, kills: number, factor: number): number {
  let zeny = 0;
  for (const drop of m.drops) {
    const chance = (drop.rate / 100) * factor;
    if (chance * kills >= STEADY_DROPS_PER_NIGHT) zeny += chance * drop.sell;
  }
  return zeny;
}

/** Plain codes before channel copies (gef_fild10 over gef_f10_z), then the shorter. */
function codeOrder(a: string, b: string): number {
  const channel = (code: string) => (/_[abz]$/.test(code) ? 1 : 0);
  return channel(a) - channel(b) || a.length - b.length;
}

/**
 * Channel copies (iz_d02_a/_b/_z) read as one place. Equal fingerprints fold
 * into the first-ranked entry, which takes the plainest code and counts doors.
 */
export function collapseChannels<T extends { code: string; fingerprint: string; channels: number }>(list: T[]): T[] {
  const out: T[] = [];
  const byPrint = new Map<string, T>();
  for (const item of list) {
    const twin = byPrint.get(item.fingerprint);
    if (twin) {
      const channels = twin.channels + item.channels;
      if (codeOrder(item.code, twin.code) < 0) Object.assign(twin, item);
      twin.channels = channels;
      continue;
    }
    const copy = { ...item };
    byPrint.set(item.fingerprint, copy);
    out.push(copy);
  }
  return out;
}
