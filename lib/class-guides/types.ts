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
  strengths: CitedLine[];
  weaknesses: CitedLine[];
  builds: ClassBuild[];
  gaps: string[];
  sources: Record<string, GuideSource>;
}
