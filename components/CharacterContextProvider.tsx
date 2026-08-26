'use client';

// Thin client-side binding over lib/character-context. Kept separate from the
// pure module so the logic stays testable without a DOM, and so only the small
// subtree that needs the character becomes a client component -- route files
// stay server components and keep their SEO (spec 4).

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  readCharacterContext,
  writeCharacterContext,
  type CharacterContext,
} from '@/lib/character-context';

interface CharacterContextValue {
  character: CharacterContext | null;
  setCharacter: (next: CharacterContext) => void;
  // False until the first client-side read completes. Server render and first
  // client render must produce identical markup or React logs a hydration
  // mismatch, so consumers render the no-character branch until this is true.
  ready: boolean;
  // False when this browser refuses to persist. The UI says so rather than
  // silently forgetting what the player typed.
  persisted: boolean;
}

const Ctx = createContext<CharacterContextValue>({
  character: null,
  setCharacter: () => {},
  ready: false,
  persisted: true,
});

function browserStorage() {
  // Touching window.localStorage can itself throw, so this is guarded too.
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function CharacterContextProvider({ children }: { children: ReactNode }) {
  const [character, setCharacterState] = useState<CharacterContext | null>(null);
  const [ready, setReady] = useState(false);
  const [persisted, setPersisted] = useState(true);

  useEffect(() => {
    setCharacterState(readCharacterContext(browserStorage()));
    setReady(true);
  }, []);

  function setCharacter(next: CharacterContext) {
    setCharacterState(next);
    setPersisted(writeCharacterContext(browserStorage(), next));
  }

  return <Ctx.Provider value={{ character, setCharacter, ready, persisted }}>{children}</Ctx.Provider>;
}

export function useCharacterContext(): CharacterContextValue {
  return useContext(Ctx);
}
