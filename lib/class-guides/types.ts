// Shape of one class guide page (/guides/classes/[job]).
//
// Every factual line carries its sources, because almost all of it comes from
// players' videos rather than from the game: a reader should be able to open
// the clip at the second the claim was made and judge it themselves. Skill and
// item names are the site database's exact names, so the page can link them
// and fetch their icons.

export interface GuideSource {
  /** Channel or site name, shown on the citation chip. */
  label: string;
  title: string;
  /** YouTube watch URL or web page. */
  url: string;
  kind: 'clip' | 'web';
  lang?: 'th' | 'en';
}

/** A source key plus, for a clip, the "mm:ss" where the claim starts. */
export type Cite = [source: string, at?: string];

export interface CitedLine {
  text: string;
  cites: Cite[];
}

export interface StatRow {
  who: string;
  str?: string;
  agi?: string;
  vit?: string;
  int?: string;
  dex?: string;
  luk?: string;
  note?: string;
  cites: Cite[];
}

export interface SkillStep {
  /** Exact skill name in the site database. */
  skill: string;
  level: number | string;
  why?: string;
  cites: Cite[];
}

export interface GearRow {
  slot: string;
  text: string;
  /** Item ids in the site database, linked with their icons. */
  items?: number[];
  cites: Cite[];
}

/**
 * The skills a build wants, per job slug of data/skill-trees.json. The page
 * runs these through lib/skill-plan.ts, which adds every prerequisite and
 * counts the points, so the plan is complete and its sums are checked rather
 * than typed in.
 */
export interface SkillPlan {
  picks: Record<string, Record<string, number>>;
  /** Where the picks come from. */
  basis: CitedLine;
  /** What to do with points the picks leave over, if a source says. */
  leftover?: CitedLine;
}

export interface RouteStep {
  range: string;
  text: string;
  /** Map codes, linked to their map pages. */
  maps?: string[];
  /** Monster ids, shown with their sprite. */
  monsters?: number[];
  cites: Cite[];
}

export interface ClassBuild {
  id: string;
  name: string;
  /** Short tag on the build picker, e.g. "สายหลัก". */
  tag?: string;
  idea: CitedLine;
  /** One-line "pick this if" for the build picker. */
  pickIf: string;
  stats?: StatRow[];
  statNotes?: CitedLine[];
  skills?: SkillStep[];
  skillNotes?: CitedLine[];
  plan?: SkillPlan;
  gear?: GearRow[];
  play?: CitedLine[];
  maps?: CitedLine[];
  cautions?: CitedLine[];
  /** Set when there is not enough to guide from; the section says so plainly. */
  missing?: string;
}

export interface ClassGuide {
  slug: string;
  job: string;
  jobTh: string;
  from: string;
  /** Date the material was gathered, for the page's own freshness line. */
  gathered: string;
  summary: string;
  facts: CitedLine[];
  /** Job slugs from 1st job to this one, as in data/skill-trees.json. */
  path: string[];
  /** Job name as the equipment page's job filter spells it. */
  equipJob: string;
  route?: RouteStep[];
  routeNotes?: CitedLine[];
  gearByLevel?: (GearRow & { range: string })[];
  strengths: CitedLine[];
  weaknesses: CitedLine[];
  builds: ClassBuild[];
  gaps: string[];
  sources: Record<string, GuideSource>;
}
