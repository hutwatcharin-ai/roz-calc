'use client';

// Melee or caster, remembered per browser. The key predates the farm tool
// integration (the AFK finder wrote it), so a player's earlier choice carries over.

import { useEffect, useState } from 'react';
import type { BotStyle } from './farm-engine/types';

export const BOT_STYLE_KEY = 'roz-calc:afk-style';

export function useBotStyle(): [BotStyle, (style: BotStyle) => void] {
  const [style, setStyle] = useState<BotStyle>('melee');

  useEffect(() => {
    try {
      if (window.localStorage.getItem(BOT_STYLE_KEY) === 'magic') setStyle('magic');
    } catch {
      // No storage: melee it is.
    }
  }, []);

  function set(next: BotStyle) {
    setStyle(next);
    try {
      window.localStorage.setItem(BOT_STYLE_KEY, next);
    } catch {
      // Remembering is a convenience, not a requirement.
    }
  }

  return [style, set];
}
