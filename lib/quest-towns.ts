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

const TYPE_LABELS: Record<string, string> = {
  story: 'เควสเนื้อเรื่อง (ไม่ระบุเมือง)',
  kill: 'เควสล่ามอนสเตอร์ (ไม่ระบุเมือง)',
  fetch: 'เควสหาของ (ไม่ระบุเมือง)',
  talk: 'เควสพูดคุย (ไม่ระบุเมือง)',
};

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
  // otherwise the slug is presentable enough to not crash a title.
  return zoneName ?? townKey;
}
