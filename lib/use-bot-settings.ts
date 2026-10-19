'use client';

// The built-in bot's own settings (lib/farm-engine/bot-session), remembered
// per browser. Separate from the character numbers: these are what the
// player set in the bot's window, not what their character is.

import { useEffect, useState } from 'react';
import { DEFAULT_BOT, type BotSettings } from './farm-engine/bot-session';

export const BOT_SETTINGS_KEY = 'roz-calc:bot-settings';

const num = (v: unknown, min: number, max: number): number | null =>
  typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max ? v : null;

/** Validates rather than casts: storage can hold anything an older build wrote. */
export function parseBotSettings(raw: string | null): BotSettings {
  if (!raw) return DEFAULT_BOT;
  let v: Record<string, unknown>;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return DEFAULT_BOT;
    v = parsed;
  } catch {
    return DEFAULT_BOT;
  }
  const bool = (key: keyof BotSettings) => (typeof v[key] === 'boolean' ? (v[key] as boolean) : (DEFAULT_BOT[key] as boolean));
  const opt = (key: keyof BotSettings, min: number, max: number) => (v[key] === null ? null : num(v[key], min, max) ?? (DEFAULT_BOT[key] as number | null));
  return {
    idleTeleport: opt('idleTeleport', 1, 600),
    teleportOnDamage: opt('teleportOnDamage', 1, 1e6),
    teleportOnMobs: opt('teleportOnMobs', 2, 50),
    creamy: bool('creamy'),
    loot: bool('loot'),
    stopWeightPct: num(v.stopWeightPct, 1, 90) ?? DEFAULT_BOT.stopWeightPct,
    keepHunting: bool('keepHunting'),
  };
}

export function useBotSettings(): [BotSettings, (next: BotSettings) => void] {
  const [settings, setSettings] = useState<BotSettings>(DEFAULT_BOT);

  useEffect(() => {
    try {
      setSettings(parseBotSettings(window.localStorage.getItem(BOT_SETTINGS_KEY)));
    } catch {
      // No storage: the defaults stand.
    }
  }, []);

  function set(next: BotSettings) {
    setSettings(next);
    try {
      window.localStorage.setItem(BOT_SETTINGS_KEY, JSON.stringify(next));
    } catch {
      // Remembering is a convenience.
    }
  }

  return [settings, set];
}
