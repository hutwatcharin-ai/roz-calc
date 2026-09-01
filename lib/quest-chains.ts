// Groups a town page's quests into chains (spec: quest UX pass, 2 Sep).
// A quest belongs to a chain when it points at a next quest or something
// points at it. Chains are walked head-first so the page can show them as
// numbered steps with one clear "start here"; everything else stays a
// standalone card. Pure functions so tests need no database.

export interface ChainableQuest {
  id: number;
  chain_next_id: number | null;
}

export interface ChainGroups<T> {
  /** Each chain in walk order, first element = the start of the chain. */
  chains: T[][];
  /** Quests that are in no chain, in the order given. */
  singles: T[];
}

export function buildChains<T extends ChainableQuest>(quests: T[]): ChainGroups<T> {
  const byId = new Map<number, T>(quests.map((q) => [q.id, q]));
  const referenced = new Set<number>();
  for (const q of quests) {
    if (q.chain_next_id != null && byId.has(q.chain_next_id)) referenced.add(q.chain_next_id);
  }

  const inChain = (q: T) => (q.chain_next_id != null && byId.has(q.chain_next_id)) || referenced.has(q.id);

  const chains: T[][] = [];
  const seen = new Set<number>();
  // Heads: chain members nobody in this set points at. A next id that lives
  // on another town's page does NOT make this quest a head-less orphan — the
  // walk simply stops at the town boundary and the card keeps its own
  // cross-town "next" link.
  for (const q of quests) {
    if (!inChain(q) || referenced.has(q.id) || seen.has(q.id)) continue;
    const chain: T[] = [];
    let cur: T | undefined = q;
    while (cur && !seen.has(cur.id)) {
      chain.push(cur);
      seen.add(cur.id);
      cur = cur.chain_next_id != null ? byId.get(cur.chain_next_id) : undefined;
    }
    chains.push(chain);
  }

  // A cycle (a → b → a) has no head; break it at its lowest id so the data
  // still renders instead of vanishing.
  for (const q of quests) {
    if (!inChain(q) || seen.has(q.id)) continue;
    const chain: T[] = [];
    let cur: T | undefined = q;
    while (cur && !seen.has(cur.id)) {
      chain.push(cur);
      seen.add(cur.id);
      cur = cur.chain_next_id != null ? byId.get(cur.chain_next_id) : undefined;
    }
    chains.push(chain);
  }

  return { chains, singles: quests.filter((q) => !inChain(q)) };
}
