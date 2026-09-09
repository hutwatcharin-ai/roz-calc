// The name the client's own files use for a monster.
//
// Only interesting where two monsters share a display name: the table holds
// two called Whisper, two called Poring, two called Baphomet, two called
// Petit, two called Picky and three called Thief Bug. Both of our sources
// print the same display name for each pair, so this is the game's doing, not
// a bad import -- and the internal name (WHISPER, WHISPER_) is the only thing
// that tells them apart in writing.
//
// Built by scripts/build-monster-aegis-names.mjs from the rozerodb export.

import file from '@/data/monster-aegis-names.json';

const names = file as Record<string, string>;

export function aegisName(id: number): string | null {
  return names[String(id)] ?? null;
}
