import { describe, expect, it } from 'vitest';
import { parseBotSettings } from './use-bot-settings';
import { DEFAULT_BOT } from './farm-engine/bot-session';

describe('parseBotSettings', () => {
  it('falls back to the defaults on nothing or junk', () => {
    expect(parseBotSettings(null)).toEqual(DEFAULT_BOT);
    expect(parseBotSettings('not json')).toEqual(DEFAULT_BOT);
    expect(parseBotSettings('[1]')).toEqual(DEFAULT_BOT);
  });

  it('keeps valid values, an explicit null (setting off), and drops out-of-range ones', () => {
    const out = parseBotSettings(JSON.stringify({ idleTeleport: null, teleportOnDamage: 300, stopWeightPct: 95, creamy: false }));
    expect(out.idleTeleport).toBeNull();
    expect(out.teleportOnDamage).toBe(300);
    expect(out.stopWeightPct).toBe(DEFAULT_BOT.stopWeightPct);
    expect(out.creamy).toBe(false);
  });
});
