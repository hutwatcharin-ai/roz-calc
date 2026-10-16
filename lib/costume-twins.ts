// One page per costume look (owner, 16 Oct 2026). A (Bound) costume with a
// free twin of the same name redirects to the twin's page, and every link is
// drawn straight to the twin so no internal link goes through the redirect.
// Built by scripts/build-costume-twins.mjs from the live client.
import file from '@/data/costume-twins.json';

const pairs = (file as { pairs: Record<string, number> }).pairs;
const BOUND_TO_FREE = new Map(Object.entries(pairs).map(([bound, free]) => [Number(bound), free]));
const FREE_TO_BOUND = new Map<number, number[]>();
for (const [bound, free] of BOUND_TO_FREE) FREE_TO_BOUND.set(free, [...(FREE_TO_BOUND.get(free) ?? []), bound]);

/** The free costume this Bound id folds into, or null when it has its own page. */
export function freeTwinOf(id: number): number | null {
  return BOUND_TO_FREE.get(id) ?? null;
}

/** The id whose page shows this costume: its free twin's, or its own. */
export function costumeId(id: number | string): number | string {
  return BOUND_TO_FREE.get(Number(id)) ?? id;
}

/** The Bound ids folded into this free costume's page. */
export function boundTwinsOf(id: number): number[] {
  return FREE_TO_BOUND.get(id) ?? [];
}

export const FOLDED_BOUND_IDS: ReadonlySet<number> = new Set(BOUND_TO_FREE.keys());
