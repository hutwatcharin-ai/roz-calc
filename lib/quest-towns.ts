// Which hub page a quest belongs to.
//
// The design rule (spec 2026-08-31-quests): a quest with a Zone goes under that
// town; a quest without one goes under its quest type; and any hub that would
// end up with fewer than five quests is folded into "other" -- thin pages are
// prevented here, at the grouping, rather than patched over afterwards. The
// SEO audit's worst finding was 2,522 near-identical thin pages; quests do not
// get to repeat that.
//
// Pure functions, no fetch: the import script and the pages both call these,
// and the tests cover the fold rule's edges without a database.

export const MIN_HUB_SIZE = 5;
export const OTHER_KEY = 'other';

export interface QuestForGrouping {
  zone: string | null;
  type: string;
}

// "(ไม่ระบุเมือง)" told the reader only what we don't know — renamed to say
// what is inside (quest UX pass, 2 Sep).
const TYPE_LABELS: Record<string, string> = {
  story: 'สายเนื้อเรื่องหลัก',
  kill: 'เควสล่ามอนสเตอร์รวม',
  fetch: 'เควสหาของรวม',
  talk: 'เควสพูดคุยรวม',
};

// Hub order on the index page: the main story line first, then towns in the
// order a new player actually reaches them, then the pooled type groups, and
// the leftovers last. Unknown zone hubs slot after the known towns,
// alphabetically. This replaces sorting by quest count, which put Louyang
// (73) above the starter towns (quest UX pass, 2 Sep).
const HUB_ORDER: string[] = [
  'type-story',
  'prontera-region',
  'alberta',
  'payon',
  'geffen',
  'geffen-region',
  'morocc',
  'morocc-region',
  'mjolnir-mountains',
  'byalan-dungeon',
  'glast-heim',
  'comodo',
  'umbala',
  'niflheim',
  'ayothaya',
  'louyang',
  'gonryun',
  'amatsu',
];

export function hubOrder(townKey: string): number {
  const i = HUB_ORDER.indexOf(townKey);
  if (i >= 0) return i;
  if (townKey === 'type-kill') return 900;
  if (townKey === 'type-fetch') return 901;
  if (townKey === 'type-talk') return 902;
  if (townKey === OTHER_KEY) return 999;
  return 500; // unknown town: after known towns, callers tiebreak by label
}

/** "Alberta" -> "alberta", "Prontera Region" -> "prontera-region". */
export function slugifyZone(zone: string): string {
  return zone.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/** The hub key a quest would naturally belong to, before the fold rule. */
export function naturalKey(quest: QuestForGrouping): string {
  if (quest.zone) return slugifyZone(quest.zone);
  return `type-${quest.type}`;
}

/**
 * Final hub key per quest, applying the fold: any natural hub with fewer than
 * MIN_HUB_SIZE quests collapses into OTHER_KEY. Deterministic for a given set,
 * which is why it runs at import time and is stored, not computed per request:
 * a quest must not move between hubs because an unrelated quest was added.
 */
export function assignTownKeys<T extends QuestForGrouping>(quests: T[]): Map<T, string> {
  const counts = new Map<string, number>();
  for (const quest of quests) {
    const key = naturalKey(quest);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const out = new Map<T, string>();
  for (const quest of quests) {
    const key = naturalKey(quest);
    out.set(quest, (counts.get(key) ?? 0) >= MIN_HUB_SIZE ? key : OTHER_KEY);
  }
  return out;
}

/** The reader-facing name of a hub. */
export function hubLabel(townKey: string, zoneName?: string | null): string {
  if (townKey === OTHER_KEY) return 'เมืองอื่นๆ และเควสย่อย';
  if (townKey.startsWith('type-')) return TYPE_LABELS[townKey.slice(5)] ?? townKey;
  // A zone-based hub shows the zone's own spelling when the caller has it;
  // otherwise prettify the slug ("prontera-region" -> "Prontera Region") —
  // the raw slug was leaking into <title> tags (SEO audit, Medium #11).
  if (zoneName) return zoneName;
  return townKey
    .split('-')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}
