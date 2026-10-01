// Monsters the Zero client names the same as a different, better-known
// monster, with the name players actually use for them.
//
// #1101 is Baphomet Jr.: client name BAPHOMET_, small, level 90, not an MVP,
// and its card is "Baphomet Jr. Card". The Zero client (and rozerodb and
// midgardhub, which read it) shows it as plain "Baphomet", the same as the
// MVP #1039, so a page that only prints the client name reads as the MVP
// (owner, 1 Oct 2026: "they are different monsters, check properly").
// The client name stays the page's name; this is the label next to it.

const KNOWN_AS: Record<number, string> = {
  1101: 'Baphomet Jr.',
};

/** The name players use, when the client's name is shared with another monster. */
export function knownAs(id: number): string | null {
  return KNOWN_AS[id] ?? null;
}

/** The client's name, with the players' name added where they differ. */
export function monsterLabel(id: number, clientName: string): string {
  const k = KNOWN_AS[id];
  return k ? k : clientName;
}
