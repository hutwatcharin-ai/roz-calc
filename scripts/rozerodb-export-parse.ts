// Parsers for the rozerodb-export JSONL files (docs/rozerodb-export/data/).
//
// The export is one JSON object per public page, with the page's visible text
// flattened to one line. These parsers turn the four detail-page shapes --
// equipment, card, item, player skill -- back into fields.
//
// Every regex here is pinned by scripts/rozerodb-export-parse.test.ts against
// verbatim text from the real export, because this is the third transcription
// layer in this project and the first two both taught the same lesson: the
// parser is wrong before the data is. (The monster sweep's first run reported
// 28 phantom mismatches -- every one was the parser.)

export interface ParsedDrop {
  /** As printed, e.g. "C2_ALLIGATOR" or "Alligator". */
  monster: string;
  level: number;
  /** Percentage, e.g. 0.05 for "0.05%". */
  rate: number;
}

export interface ParsedEquipment {
  id: number;
  name: string;
  kind: 'Weapon' | 'Armor' | 'Costume';
  /** True for gear their site stamps UPCOMING -- announced but not yet in game. */
  upcoming: boolean;
  weaponType: string | null;
  equipLocation: string | null;
  atk: number | null;
  def: number | null;
  requiredLevel: number | null;
  weaponLevel: number | null;
  slots: number | null;
  element: string | null;
  weight: number | null;
  buy: number | null;
  sell: number | null;
  description: string | null;
  /** "All Jobs" or "Swordman classes, Mage classes, ..." -- verbatim. */
  jobRestrictions: string | null;
  drops: ParsedDrop[];
}

export interface ParsedCard {
  id: number;
  name: string;
  /** Where the card sockets: "Accessory", "Armor", ... */
  location: string | null;
  effect: string | null;
  weight: number | null;
  buy: number | null;
  sell: number | null;
  drops: ParsedDrop[];
}

export interface ParsedSkill {
  name: string;
  type: 'active' | 'passive' | null;
  maxLevel: number | null;
  description: string | null;
  /** "Madogear License Lv 1" -- verbatim, without the "+ Leads to" tail. */
  requires: string | null;
}

/** "1,000" -> 1000; a dash or em dash means the page is saying "none". */
function num(raw: string | undefined | null): number | null {
  if (raw === undefined || raw === null) return null;
  const cleaned = raw.replace(/,/g, '').trim();
  if (cleaned === '' || cleaned === '—' || cleaned === '-') return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

/** A field whose printed value is a dash is "none", which is not a string either. */
function text(raw: string | undefined | null): string | null {
  const t = (raw ?? '').trim();
  return t === '' || t === '—' || t === '-' ? null : t;
}

// Section headings, in page order. A description runs until the first of these.
const STOP = /(Job restrictions|Structured source data|Dropped by \(|Where to farm|Crafting use|Z SOLD BY NPC|RO ZERO DATABASE)/;

function upTo(t: string, stop: RegExp = STOP): string {
  const m = stop.exec(t);
  return (m ? t.slice(0, m.index) : t).trim();
}

/**
 * The "Dropped by ( N )" list: repeating "<name> Lv <level> <rate>%".
 * Names may be UPPER_SNAKE (C2_ALLIGATOR) or plain (Alligator), with spaces
 * and apostrophes.
 */
export function parseDrops(t: string): ParsedDrop[] {
  const start = /Dropped by \( \d+ \)/.exec(t);
  if (!start) return [];
  const section = upTo(t.slice(start.index + start[0].length), /(Where to farm|Crafting use|RO ZERO DATABASE)/);
  const out: ParsedDrop[] = [];
  for (const m of section.matchAll(/([A-Za-z0-9_' .-]+?) Lv (\d+) ([\d.]+)%/g)) {
    out.push({ monster: m[1].trim(), level: Number(m[2]), rate: Number(m[3]) });
  }
  return out;
}

/** "C2_ALLIGATOR" -> "c2 alligator", for matching against our monsters.name_en. */
export function normalizeMonsterName(name: string): string {
  return name.replace(/_/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
}

export function parseEquipment(raw: string): ParsedEquipment | null {
  const i = raw.indexOf('← Equipment ');
  if (i === -1) return null;
  const t = raw.slice(i + '← Equipment '.length);

  // Two header shapes exist:
  //   "Advanced Guild Fist #560003 · Weapon · Knuckle Type ..."  (with subtype)
  //   "Bongun Hat #5046 · Weapon Type ..."                        (without)
  // and the kind can be Weapon, Armor, or Costume, optionally stamped
  // "UPCOMING" for unreleased gear. The subtype segment duplicates the
  // labelled Type field below, so only the kind is taken from the header.
  // ...and unreleased gear appends a release tail before the stat strip:
  //   "Battle Hook #1421 · Weapon · One-handed Spear UPCOMING · JAN 2027 Global · Glast Heim Dungeon Update Type ..."
  // so everything between the kind and " Type " is one tail, and UPCOMING is
  // detected inside it rather than at a fixed position.
  const head = /^(.+?) #(\d+) · (Weapon|Armor|Costume)(.*?) Type /.exec(t);
  if (!head) return null;

  // The stat strip prints its fields in one fixed order on every page, so one
  // anchored regex reads them all. Per-label lookaheads went wrong here once:
  // "Equip location All Head Slots" was truncated to "All Head" because the
  // lookahead saw the word "Slots" inside the value.
  const strip =
    /Type (.+?) Equip location (.+?) ATK ([\d,—-]+) DEF ([\d,—-]+) Required level ([\d,—-]+) Weapon level ([\d,—-]+) Slots ([\d,—-]+) Element (.+?) Weight ([\d,—-]+) Rating (.+?) Buy price (.+?) Sell price (.+?) Description \/ Effect /.exec(
      t,
    );
  if (!strip) return null;

  const description = (() => {
    const m = /Description \/ Effect (.+)$/.exec(t);
    return m ? text(upTo(m[1])) : null;
  })();

  const jobs = (() => {
    const m = /Job restrictions (.+)$/.exec(t);
    return m ? text(upTo(m[1], /(Structured source data|Dropped by \(|Where to farm|RO ZERO DATABASE)/)) : null;
  })();

  return {
    id: Number(head[2]),
    name: head[1].trim(),
    kind: head[3] as 'Weapon' | 'Armor' | 'Costume',
    upcoming: head[4].includes('UPCOMING'),
    weaponType: text(strip[1]),
    equipLocation: text(strip[2]),
    atk: num(strip[3]),
    def: num(strip[4]),
    requiredLevel: num(strip[5]),
    weaponLevel: num(strip[6]),
    slots: num(strip[7]),
    element: text(strip[8]),
    weight: num(strip[9]),
    buy: num(strip[11]),
    sell: num(strip[12]),
    description,
    jobRestrictions: jobs,
    drops: parseDrops(t),
  };
}

export function parseCard(raw: string): ParsedCard | null {
  const i = raw.indexOf('← Card ');
  if (i === -1) return null;
  const t = raw.slice(i + '← Card '.length);

  const head = /^(.+?) #(\d+) · (.+?) Card effect /.exec(t);
  if (!head) return null;

  const effect = (() => {
    const m = /Card effect (.+)$/.exec(t);
    return m ? text(upTo(m[1])) : null;
  })();

  const source = (label: string) => {
    const m = new RegExp(`${label} ([\\d,—-]+|Yes|No)`).exec(t);
    return m ? m[1] : null;
  };

  return {
    id: Number(head[2]),
    name: head[1].trim(),
    location: text(head[3]),
    effect,
    weight: num(source('Weight')),
    buy: num(source('Buy price')),
    sell: num(source('Sell price')),
    drops: parseDrops(t),
  };
}

export function parseSkill(raw: string): ParsedSkill | null {
  const i = raw.indexOf('← Player Skill ');
  if (i === -1) return null;
  const t = raw.slice(i + '← Player Skill '.length);

  // "Acceleration Max Lv 3 Description ..." or
  // "Acid Bomb Active Max Lv 10 Alchemist, Creator Description ..."
  const head = /^(.+?)(?: (Active|Passive))? Max Lv (\d+) /.exec(t);
  if (!head) return null;

  const description = (() => {
    const m = /Description (.+)$/.exec(t);
    if (!m) return null;
    const body = upTo(m[1], /(Levels Level Effect|Requires |Leads to |Learned by |RO ZERO DATABASE)/);
    // The site stamps unreviewed skills with this exact line instead of a
    // description; storing it would put boilerplate on 800 rows.
    if (/^Verified with ROZ in its current version\.?$/.test(body)) return null;
    return text(body.replace(/^Verified with ROZ in its current version\.\s*/, ''));
  })();

  const requires = (() => {
    const m = /Requires (.+?) (?:\+ )?(?:Leads to|Learned by|RO ZERO DATABASE)/.exec(t);
    return m ? text(m[1]) : null;
  })();

  return {
    name: head[1].trim(),
    type: head[2] ? (head[2].toLowerCase() as 'active' | 'passive') : null,
    maxLevel: num(head[3]),
    description,
    requires,
  };
}
