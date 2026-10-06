// What a skill does at the level you have actually put points into.
//
// The planner is where someone chooses a level, so the useful thing to say
// on hover is what THAT level gives -- Bash at 3 is "ATK 190%", not a
// paragraph about what Bash is in general. The paragraph comes second and
// only when we have it in Thai.
//
// Data: skill_levels (effect, SP, range, cast time per level, 339 of the
// tree's 341 skills) and skills.description_th (259 of them), both fetched
// on the server and handed to the planner as plain maps.

/** One level's row, with the short keys the payload uses. */
export interface SkillLevelFacts {
  /** What it does at this level, as the game states it. */
  e?: string;
  sp?: number;
  /** Cells, as the game counts them. */
  r?: number;
  /** Cast time in milliseconds. */
  c?: number;
  /** From roz.prontera.info (data/skill-level-extra.json): variable and fixed cast, after-cast delay, cooldown (ms), hits. */
  cv?: number;
  cf?: number;
  acd?: number;
  cd?: number;
  h?: number;
  /** The after-cast delay follows ASPD rather than a fixed time. */
  aspd?: number;
}

export type SkillLevelMap = Record<string, Record<string, SkillLevelFacts>>;

export interface SkillTipLine {
  label: string;
  value: string;
}

/**
 * The level to describe: the one chosen, or 1 when nothing is spent yet.
 *
 * Hovering an untouched skill is the "would this be worth a point" question,
 * and level 1 is what a point buys. Returns null when the skill has no
 * per-level data at all.
 */
export function tipLevel(levels: SkillLevelMap, slug: string, chosen: number): number | null {
  const rows = levels[slug];
  if (!rows) return null;
  const want = chosen > 0 ? chosen : 1;
  if (rows[String(want)]) return want;
  // A level the source skipped: fall back to the highest one below it, so a
  // gap in the data shows the nearest real value rather than nothing.
  const below = Object.keys(rows)
    .map(Number)
    .filter((n) => n <= want)
    .sort((a, b) => b - a);
  return below[0] ?? null;
}

function ms(value: number): string {
  // Seconds throughout, so 480 ms and 1.9 s read on one scale (0.48 วิ).
  if (value >= 1000) return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)} วิ`;
  return `${Number((value / 1000).toFixed(2))} วิ`;
}

/**
 * The lines a tooltip shows, in the order they matter: what it does, then
 * what it costs, then how far it reaches. A field the source does not carry
 * is skipped rather than shown empty.
 */
export function tipFacts(levels: SkillLevelMap, slug: string, chosen: number): SkillTipLine[] {
  const level = tipLevel(levels, slug, chosen);
  if (level === null) return [];
  const row = levels[slug][String(level)];
  const out: SkillTipLine[] = [];
  if (row.e) out.push({ label: 'ผล', value: row.e });
  if (row.sp) out.push({ label: 'SP', value: String(row.sp) });
  if (row.r) out.push({ label: 'ระยะ', value: `${row.r} ช่อง` });
  // Split cast when the split is known: a fixed part DEX cannot shorten.
  if (row.cv || row.cf) {
    out.push({ label: 'ร่าย', value: [row.cv ? `แปรผัน ${ms(row.cv)}` : null, row.cf ? `คงที่ ${ms(row.cf)}` : null].filter(Boolean).join(' · ') });
  } else if (row.c) {
    out.push({ label: 'ร่าย', value: ms(row.c) });
  }
  if (row.aspd) out.push({ label: 'ดีเลย์', value: 'ตาม ASPD' });
  else if (row.acd) out.push({ label: 'ดีเลย์', value: ms(row.acd) });
  if (row.cd) out.push({ label: 'คูลดาวน์', value: ms(row.cd) });
  if (row.h && row.h > 1) out.push({ label: 'ตี', value: `${row.h} ครั้ง` });
  return out;
}
