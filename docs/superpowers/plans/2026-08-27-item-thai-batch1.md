# Item Description Thai Translation — Batch 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the storage, the composition function, the glossary checker, and the first translation batch — 58 terms that cover 71% of every line in the item descriptions — and render Thai on the item page with a toggle back to English.

**Architecture:** Translations live in two tables keyed by their *source text*, not by item. A prose line is stored whole because it has no internal structure; a structural label or a stat name is stored as the term alone, with the value passed straight through, so a new item carrying a new value never becomes new translation work. The page composes Thai at render time by looking each line up, and any line with no translation falls back to English — so the site is shippable at any completion percentage.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Supabase (Postgres), Vitest. Test command `npm test`. Dev server `npm run dev`.

**Spec:** `docs/superpowers/specs/2026-08-27-item-thai-translation-design.md` — read §3 (the glossary), §4 (schema and composition), §6 (verification) and §7 (approved translations) before starting.

## Global Constraints

- **Thai for every user-facing string.** Code, identifiers and comments in English.
- **Game terms stay in English; sentence structure becomes Thai.** The game itself displays English, so a player holding `Leib Olmai Card` must be able to match it against what the page shows. Translating a proper noun makes the item *harder* to find, not easier. Spec §3.2 lists every category that stays English: proper nouns, bracketed skills, stat abbreviations, mechanic terms, status ailments, elements, monster races, equip slots.
- **Never invent a value.** A line with no translation renders in English. It does not render blank, and it does not get a guess.
- **`thai_term` may be NULL on purpose.** `ATK` and `DEF` get rows with no translation because §3.2 says they stay English. The row's existence means "considered and deliberately left" — different from "not done yet". A missing row is what the checker reports as a gap.
- **Numbers must survive translation.** A translation that changes a number is the one error class that makes a player decide wrong. The checker treats it as fatal.
- Migrations are additive; every new table gets RLS in the same migration, public `select` for `anon, authenticated`, no write policy.
- Server components stay server components; `'use client'` only on the leaf that needs it.
- **A test must be proven capable of failing.** After a test goes green, break the logic it covers, confirm red, restore, and report which case went red.

---

## The spec's headline measurement does not reproduce. This plan uses measured numbers.

The spec's §2 table says: 1,688 label lines over 226 distinct, reducing to **13 label names**; 294 stat lines over 144 distinct, reducing to **56 stat names**; 1,725 prose lines over **1,440 distinct** — and that batch 1 is **69 terms covering 53%**.

I classified all 1,213 descriptions directly against the live database before writing this plan. What I measure:

| | Spec | Measured |
|---|---|---|
| Label lines | 1,688 | **3,940** |
| Distinct label names | 13 | **21 raw, 14 real** |
| Stat lines | 294 | **397** |
| Distinct stat names | 56 | **134 raw, 44 recurring** |
| Prose lines | 1,725 | **1,619** |
| Distinct prose lines | 1,440 | **1,339** |
| Batch 1 coverage | 53% | **71.2%** |

Total lines across all descriptions: **5,956**.

Two things account for the gap, and both are classification choices rather than data disagreements:

**Labels.** 21 distinct names match a `<name> : <value>` shape, but seven of them are prose sentences that happen to contain a colon — `A skull-shaped ring whose inner band bears an inscription carved with a sharp blade`, `For each level of Faith learned`, `When worn with Prisoner Uniform`. Those are prose and belong in the lines table. The 14 that are genuinely structural labels cover **3,933 lines**.

**Stat names.** 134 distinct names match `<name> +N`, but 90 of them occur exactly once and are long phrases — `Physical Damage to Formless Monsters`, `HP recovery from Candy and Candy Cane`. The 44 that recur cover **307 of the 397 stat lines**.

So batch 1 is **58 terms covering 4,240 of 5,956 lines — 71.2%**, which is a better deal than the spec promised, not a worse one. The spec's direction was right and its reasoning is sound; only its arithmetic is off.

**If your own count disagrees with these figures, report the numbers rather than adjusting anything to match.** The classification regexes are in Task 2 and are the definition of record.

---

## File Structure

| File | Responsibility | Task |
|---|---|---|
| `supabase/migrations/0008_item_description_th.sql` | The two tables and their RLS | 1 |
| `lib/item-description-th.ts` + `.test.ts` | Classify a line; compose a description from the dictionaries | 2 |
| `scripts/check-thai-glossary.ts` + `.test.ts` | The glossary and number checker | 3 |
| `scripts/seed-thai-batch1.ts` | Load batch 1's 58 terms into the terms table | 4 |
| `app/database/items/[id]/page.tsx` | Render Thai, fall back to English | 5 |
| `components/DescriptionLanguageToggle.tsx` | The client-side Thai/English switch | 5 |
| `app/globals.css` | Styles the toggle needs — append only | 5 |

**The checker is written in Task 3, before any translation is stored in Task 4.** Spec §6.1 says so explicitly, and it is the right order: a checker written after the fact gets shaped by the translations it is meant to judge.

---

### Task 1: The two translation tables

Spec §4.1. Two tables rather than one, because the keys are different in kind: one is keyed by a whole line, the other by a term. Merging them would put `DEF : 5` and `DEF` in the same key space, where they look alike and mean different things.

**Files:**
- Create: `supabase/migrations/0008_item_description_th.sql`

**Interfaces:**
- Consumes: nothing.
- Produces: tables `item_description_lines (source_line pk, thai_line, kind, reviewed, updated_at)` and `item_description_terms (source_term pk, thai_term nullable, kind, updated_at)`.

- [ ] **Step 1: Write the migration**

Create `supabase/migrations/0008_item_description_th.sql`:

```sql
-- 0008_item_description_th.sql
--
-- Thai translations for item descriptions, keyed by SOURCE TEXT rather than by
-- item. The same English line always gets the same Thai, so
-- "Can be sold to the Collector." is translated once and reused across the 142
-- items that carry it; correcting it later corrects all 142 at once.
--
-- Two tables, not one with a `kind` discriminator, because the keys are
-- different in kind. Prose is keyed by the whole line; a label or stat name is
-- keyed by the term alone. In one table `DEF : 5` and `DEF` would be two rows
-- that look alike and mean different things, and a lookup would collide.

-- Prose: stored whole, because there is no label/value structure to separate.
create table if not exists item_description_lines (
  source_line text primary key,
  thai_line text not null,
  kind text not null check (kind in ('effect', 'flavour')),
  reviewed boolean not null default false,
  updated_at timestamptz not null default now()
);

-- Labels and stat names: the term only. The value passes through untouched, so
-- an item with a new value is never new translation work -- which is the whole
-- reason this table is separate from the one above.
create table if not exists item_description_terms (
  source_term text primary key,
  -- NULL is meaningful and deliberate: ATK and DEF get rows with no translation
  -- because the glossary says they stay English. A row that exists with a null
  -- translation means "considered and left alone"; NO row means "not done yet",
  -- which is what the checker reports.
  thai_term text,
  kind text not null check (kind in ('label', 'stat')),
  updated_at timestamptz not null default now()
);

-- RLS in the same migration that creates the tables. v1 shipped tables with RLS
-- off, which left the public anon key with full DML rights on every row.
alter table item_description_lines enable row level security;
alter table item_description_terms enable row level security;

create policy "item_description_lines public read"
  on item_description_lines for select
  to anon, authenticated
  using (true);

create policy "item_description_terms public read"
  on item_description_terms for select
  to anon, authenticated
  using (true);
```

- [ ] **Step 2: Check it parses**

You have no database credentials, so you cannot apply it. Confirm the SQL is well-formed by reading it against `supabase/migrations/0004_monster_details.sql`, which is the project's existing example of a table plus RLS in one migration. Both tables must have: `create table if not exists`, `enable row level security`, exactly one `for select` policy, and no insert/update/delete policy.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0008_item_description_th.sql
git commit -m "feat: add item description translation tables"
```

- [ ] **Step 4: [CONTROLLER] Apply the migration**

The controller applies it and confirms both tables exist with RLS on and exactly one policy each.

---

### Task 2: Classify a line, and compose a description

Spec §4.2. This is the core of the feature and the only part with real branching, so it carries the tests.

**Files:**
- Create: `lib/item-description-th.ts`, `lib/item-description-th.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `export type LineKind = 'label' | 'stat' | 'prose'`
  - `export interface ClassifiedLine { kind: LineKind; term: string; value: string; source: string }`
  - `export function classifyLine(rawLine: string): ClassifiedLine | null`
  - `export interface ThaiDictionaries { lines: ReadonlyMap<string, string>; terms: ReadonlyMap<string, string | null> }`
  - `export interface DescriptionLine { source: string; thai: string | null }`
  - `export function composeThaiDescription(description: string | null, dict: ThaiDictionaries): DescriptionLine[]`
  - Task 3 and Task 5 both consume `classifyLine` and `composeThaiDescription`.

**The ordering rule from spec §4.2 is load-bearing:** a line is tested against the label shape, then the stat shape, and only then treated as prose. Reversed, `DEF : 5` becomes a prose line awaiting a whole-line translation — which is exactly the growth-with-the-data problem the two-table design exists to avoid.

- [ ] **Step 1: Write the failing test**

Create `lib/item-description-th.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { classifyLine, composeThaiDescription, type ThaiDictionaries } from './item-description-th';

const dict: ThaiDictionaries = {
  lines: new Map([
    ['Can be sold to the Collector.', 'ขายให้ Collector ได้'],
    ['Unbreakable.', 'ไม่แตก'],
  ]),
  terms: new Map<string, string | null>([
    ['Equippable by', 'อาชีพที่ใส่ได้'],
    ['Weight', 'น้ำหนัก'],
    ['ATK', null],
    ['MHP', 'MHP'],
  ]),
};

describe('classifyLine', () => {
  it('reads a structural label and its value', () => {
    expect(classifyLine('Equippable by : All Jobs')).toEqual({
      kind: 'label', term: 'Equippable by', value: 'All Jobs', source: 'Equippable by : All Jobs',
    });
  });

  it('reads a stat name and its signed value', () => {
    expect(classifyLine('MHP +100')).toEqual({
      kind: 'stat', term: 'MHP', value: '+100', source: 'MHP +100',
    });
  });

  it('keeps a trailing period out of the stat value', () => {
    expect(classifyLine('ATK +5.')?.value).toBe('+5');
  });

  it('handles a percent value', () => {
    expect(classifyLine('Perfect Dodge +10%')).toEqual({
      kind: 'stat', term: 'Perfect Dodge', value: '+10%', source: 'Perfect Dodge +10%',
    });
  });

  it('handles a negative value', () => {
    expect(classifyLine('HIT -10')?.value).toBe('-10');
  });

  it('treats a sentence as prose even when it contains a colon', () => {
    // Seven "labels" in the real data are prose with a colon in them. Sending
    // them to the terms table would put whole sentences in a term dictionary.
    const s = 'For each level of Faith learned : DEF +1';
    expect(classifyLine(s)?.kind).toBe('label');
    // The guard is length, not the colon: a term this long is not a label.
    const long = 'A skull-shaped ring whose inner band bears an inscription carved with a sharp blade : DEF +1';
    expect(classifyLine(long)?.kind).toBe('prose');
  });

  it('treats an ordinary sentence as prose', () => {
    expect(classifyLine('Can be sold to the Collector.')).toEqual({
      kind: 'prose', term: 'Can be sold to the Collector.', value: '',
      source: 'Can be sold to the Collector.',
    });
  });

  it('strips a colour code before classifying', () => {
    expect(classifyLine('^FF0000Unbreakable.')?.term).toBe('Unbreakable.');
  });

  it('returns null for a blank line', () => {
    expect(classifyLine('   ')).toBeNull();
  });

  it('checks the label shape before the stat shape', () => {
    // "DEF : 5" matches label; if stat were tried first this would misread.
    expect(classifyLine('DEF : 5')?.kind).toBe('label');
  });
});

describe('composeThaiDescription', () => {
  it('returns an empty array for a null description', () => {
    expect(composeThaiDescription(null, dict)).toEqual([]);
  });

  it('translates a label and passes its value through untouched', () => {
    const [line] = composeThaiDescription('Equippable by : Swordsman Class', dict);
    expect(line.thai).toBe('อาชีพที่ใส่ได้ : Swordsman Class');
  });

  it('translates a whole prose line', () => {
    const [line] = composeThaiDescription('Can be sold to the Collector.', dict);
    expect(line.thai).toBe('ขายให้ Collector ได้');
  });

  it('returns the source line for a term deliberately left in English', () => {
    // ATK has a row with a null translation: considered and left. The line must
    // render as-is, not as untranslated-and-pending.
    const [line] = composeThaiDescription('ATK +5', dict);
    expect(line.thai).toBe('ATK +5');
  });

  it('returns null thai for a line that is in no dictionary', () => {
    const [line] = composeThaiDescription('Some line nobody has translated yet.', dict);
    expect(line.thai).toBeNull();
    expect(line.source).toBe('Some line nobody has translated yet.');
  });

  it('keeps one entry per source line, in order', () => {
    const out = composeThaiDescription('Unbreakable.\nCan be sold to the Collector.', dict);
    expect(out.map((l) => l.thai)).toEqual(['ไม่แตก', 'ขายให้ Collector ได้']);
  });

  it('drops blank lines rather than emitting empty entries', () => {
    const out = composeThaiDescription('Unbreakable.\n\n\nUnbreakable.', dict);
    expect(out).toHaveLength(2);
  });

  it('strips colour codes from the source it reports', () => {
    const [line] = composeThaiDescription('^0000FFUnbreakable.', dict);
    expect(line.source).toBe('Unbreakable.');
    expect(line.thai).toBe('ไม่แตก');
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npm test -- lib/item-description-th.test.ts`
Expected: FAIL — the module does not exist.

- [ ] **Step 3: Write the module**

Create `lib/item-description-th.ts`:

```ts
// Composing a Thai item description from two dictionaries.
//
// Descriptions are stored in English and translated at render time. Nothing is
// translated per item: the same English line always yields the same Thai, so a
// line is translated once and reused everywhere it appears.

export type LineKind = 'label' | 'stat' | 'prose';

export interface ClassifiedLine {
  kind: LineKind;
  // For a label or stat this is the term alone; for prose it is the whole line.
  term: string;
  // The part that passes through untranslated. Empty for prose.
  value: string;
  source: string;
}

export interface ThaiDictionaries {
  lines: ReadonlyMap<string, string>;
  // null means "deliberately left in English" -- see the migration's comment.
  terms: ReadonlyMap<string, string | null>;
}

export interface DescriptionLine {
  source: string;
  // null means no translation exists, so the caller renders the English.
  thai: string | null;
}

const COLOUR_CODE = /\^[0-9a-fA-F]{6}/g;
const LABEL = /^([A-Za-z][A-Za-z '\/-]*?)\s*:\s*(.+)$/;
const STAT = /^([A-Za-z][A-Za-z %'-]*?)\s*([+-]\s*\d+%?)\s*\.?$/;

// Seven lines in the real data are sentences containing a colon. A structural
// label is short by nature -- the longest real one is "Melee physical attacks"
// at three words -- so length is what separates them, not the colon.
const MAX_LABEL_WORDS = 4;

export function classifyLine(rawLine: string): ClassifiedLine | null {
  const source = rawLine.replace(COLOUR_CODE, '').trim();
  if (source === '') return null;

  // Label before stat, always. Reversed, "DEF : 5" would be read as prose and
  // wait for a whole-line translation -- the growth-with-the-data problem the
  // two-table design exists to prevent.
  const label = LABEL.exec(source);
  if (label && label[1].trim().split(/\s+/).length <= MAX_LABEL_WORDS) {
    return { kind: 'label', term: label[1].trim(), value: label[2].trim(), source };
  }

  const stat = STAT.exec(source);
  if (stat) {
    return { kind: 'stat', term: stat[1].trim(), value: stat[2].replace(/\s+/g, ''), source };
  }

  return { kind: 'prose', term: source, value: '', source };
}

export function composeThaiDescription(
  description: string | null,
  dict: ThaiDictionaries,
): DescriptionLine[] {
  if (!description) return [];

  const out: DescriptionLine[] = [];

  for (const rawLine of description.split('\n')) {
    const classified = classifyLine(rawLine);
    if (!classified) continue;

    if (classified.kind === 'prose') {
      out.push({ source: classified.source, thai: dict.lines.get(classified.term) ?? null });
      continue;
    }

    if (!dict.terms.has(classified.term)) {
      out.push({ source: classified.source, thai: null });
      continue;
    }

    const thaiTerm = dict.terms.get(classified.term);
    if (thaiTerm === null || thaiTerm === undefined) {
      // Deliberately English. The line is finished, not pending.
      out.push({ source: classified.source, thai: classified.source });
      continue;
    }

    const joined =
      classified.kind === 'label'
        ? `${thaiTerm} : ${classified.value}`
        : `${thaiTerm} ${classified.value}`;
    out.push({ source: classified.source, thai: joined });
  }

  return out;
}
```

- [ ] **Step 4: Run it and watch it pass**

Run: `npm test -- lib/item-description-th.test.ts`
Expected: PASS, all cases.

- [ ] **Step 5: Prove two of the tests can fail**

Swap the label and stat blocks so `STAT` is tried first; confirm the `DEF : 5` case goes red; restore. Then raise `MAX_LABEL_WORDS` to 50; confirm the long-sentence case goes red; restore and confirm green. Commit neither broken version.

- [ ] **Step 6: Commit**

```bash
git add lib/item-description-th.ts lib/item-description-th.test.ts
git commit -m "feat: classify description lines and compose Thai from the dictionaries"
```

---

### Task 3: The glossary checker

Spec §6.1, and the spec is explicit that this comes **before** any translation is stored. A checker written afterwards gets shaped by the translations it is supposed to judge.

**Files:**
- Create: `scripts/check-thai-glossary.ts`, `scripts/check-thai-glossary.test.ts`

**Interfaces:**
- Consumes: nothing from other tasks — the pure checks must be testable without a database.
- Produces:
  - `export interface GlossaryIssue { rule: 'number-mismatch' | 'must-stay-english' | 'no-thai-characters'; source: string; thai: string; detail: string }`
  - `export const MUST_STAY_ENGLISH: readonly string[]`
  - `export function checkTranslation(source: string, thai: string): GlossaryIssue[]`

**The number rule is the one that matters most.** Spec §6.1 calls it out: a translation that changes a number is the only error class that makes a player decide wrong. The others produce prose that reads badly.

- [ ] **Step 1: Write the failing test**

Create `scripts/check-thai-glossary.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { checkTranslation, MUST_STAY_ENGLISH } from './check-thai-glossary';

describe('checkTranslation — numbers', () => {
  it('passes when every number survives', () => {
    const issues = checkTranslation('ATK +5 and DEF +3.', 'ATK +5 และ DEF +3');
    expect(issues.filter((i) => i.rule === 'number-mismatch')).toHaveLength(0);
  });

  it('catches a number that changed', () => {
    const issues = checkTranslation('Adds a 6% chance.', 'มีโอกาส 9%');
    expect(issues.some((i) => i.rule === 'number-mismatch')).toBe(true);
  });

  it('catches a number that was dropped', () => {
    // The Baphomet Card case from spec section 1: the official Thai lost the
    // HIT -10 line entirely. That is the failure this rule exists to catch.
    const issues = checkTranslation('9-cell splash. HIT -10.', 'กระจาย 9 ช่อง');
    expect(issues.some((i) => i.rule === 'number-mismatch')).toBe(true);
  });

  it('catches a number that was added', () => {
    const issues = checkTranslation('Unbreakable.', 'ไม่แตก 100%');
    expect(issues.some((i) => i.rule === 'number-mismatch')).toBe(true);
  });

  it('ignores the order numbers appear in', () => {
    const issues = checkTranslation('ATK +5, DEF +3', 'DEF +3, ATK +5');
    expect(issues.filter((i) => i.rule === 'number-mismatch')).toHaveLength(0);
  });
});

describe('checkTranslation — terms that must stay English', () => {
  it('passes when the term is carried through', () => {
    const issues = checkTranslation(
      'Chance to inflict Curse on the attacker.',
      'มีโอกาสร่าย Curse ใส่ผู้โจมตี',
    );
    expect(issues.filter((i) => i.rule === 'must-stay-english')).toHaveLength(0);
  });

  it('catches a status ailment that was translated away', () => {
    const issues = checkTranslation('Chance to inflict Curse.', 'มีโอกาสทำให้ติดคำสาป');
    expect(issues.some((i) => i.rule === 'must-stay-english' && i.detail.includes('Curse'))).toBe(true);
  });

  it('catches an element that was translated away', () => {
    const issues = checkTranslation('Fire-Property Resistance +10%.', 'ต้านทานธาตุไฟ +10%');
    expect(issues.some((i) => i.rule === 'must-stay-english' && i.detail.includes('Fire'))).toBe(true);
  });

  it('matches a term only as a whole word', () => {
    // "Fired" contains "Fire" but is not the element.
    const issues = checkTranslation('The arrow is Fired.', 'ลูกศรถูกยิงออกไป');
    expect(issues.filter((i) => i.rule === 'must-stay-english')).toHaveLength(0);
  });

  it('holds every category the glossary names', () => {
    for (const t of ['Curse', 'Fire', 'Brute', 'Perfect Dodge', 'ATK', 'Armor']) {
      expect(MUST_STAY_ENGLISH).toContain(t);
    }
  });
});

describe('checkTranslation — untranslated lines', () => {
  it('flags a translation with no Thai characters at all', () => {
    const issues = checkTranslation('Unbreakable.', 'Unbreakable.');
    expect(issues.some((i) => i.rule === 'no-thai-characters')).toBe(true);
  });

  it('does not flag a line that has Thai in it', () => {
    const issues = checkTranslation('Unbreakable.', 'ไม่แตก');
    expect(issues.filter((i) => i.rule === 'no-thai-characters')).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npm test -- scripts/check-thai-glossary.test.ts`
Expected: FAIL — the module does not exist.

- [ ] **Step 3: Write the checker**

Create `scripts/check-thai-glossary.ts`. The exported functions above are the testable core; add a `main()` at the bottom that reads every row of `item_description_lines` through `supabaseAdmin()` and prints the issues, so the file is both a library and a runnable script. Follow `scripts/import-data.ts` for how it reads credentials and reports failure.

```ts
// Checks stored Thai translations against the glossary in spec section 3.
//
// Written BEFORE the first batch is translated, deliberately. A checker written
// afterwards gets shaped by the translations it is meant to judge.

export interface GlossaryIssue {
  rule: 'number-mismatch' | 'must-stay-english' | 'no-thai-characters';
  source: string;
  thai: string;
  detail: string;
}

// Spec section 3.2. Every one of these must survive into the Thai, because the
// game itself displays them in English -- a player matching the page against
// their inventory needs the same string in both places.
export const MUST_STAY_ENGLISH: readonly string[] = [
  // stat abbreviations
  'ATK', 'DEF', 'MATK', 'MDEF', 'STR', 'AGI', 'VIT', 'INT', 'DEX', 'LUK',
  'HIT', 'FLEE', 'CRIT', 'ASPD', 'MHP', 'MSP', 'SP', 'HP',
  // mechanics
  'Physical Damage', 'Critical Damage', 'Perfect Dodge', 'Variable Casting Time',
  'Damage Taken', 'Resistance',
  // status ailments
  'Curse', 'Silence', 'Blind', 'Stun', 'Sleep', 'Frozen', 'Poison', 'Petrify',
  // elements
  'Fire', 'Water', 'Wind', 'Earth', 'Holy', 'Shadow', 'Ghost', 'Undead', 'Neutral',
  // monster races
  'Brute', 'Demi-Human', 'Demon', 'Formless', 'Insect', 'Plant', 'Fish', 'Dragon', 'Angel',
  // equip slots
  'Armor', 'Weapon', 'Shield', 'Garment', 'Shoes', 'Accessory', 'Headgear',
  // frequently referenced NPC
  'Collector',
];

const THAI_CHARACTER = /[฀-๿]/;

// Digits only, sign and percent excluded: the point is that the quantities
// match, and Thai word order legitimately moves a sign or a unit around.
function numbersIn(text: string): string[] {
  return (text.match(/\d+/g) ?? []).sort();
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Whole-word only: "Fired" contains "Fire" but is not the element, and flagging
// it would train the reader to ignore this checker.
function containsTerm(text: string, term: string): boolean {
  return new RegExp(`(^|[^A-Za-z])${escapeRegExp(term)}([^A-Za-z]|$)`).test(text);
}

export function checkTranslation(source: string, thai: string): GlossaryIssue[] {
  const issues: GlossaryIssue[] = [];

  const srcNums = numbersIn(source);
  const thaiNums = numbersIn(thai);
  if (srcNums.join(',') !== thaiNums.join(',')) {
    issues.push({
      rule: 'number-mismatch',
      source,
      thai,
      detail: `source has [${srcNums.join(', ')}], translation has [${thaiNums.join(', ')}]`,
    });
  }

  for (const term of MUST_STAY_ENGLISH) {
    if (containsTerm(source, term) && !containsTerm(thai, term)) {
      issues.push({ rule: 'must-stay-english', source, thai, detail: `missing term: ${term}` });
    }
  }

  if (!THAI_CHARACTER.test(thai)) {
    issues.push({
      rule: 'no-thai-characters',
      source,
      thai,
      detail: 'translation contains no Thai characters',
    });
  }

  return issues;
}
```

- [ ] **Step 4: Run it and watch it pass**

Run: `npm test -- scripts/check-thai-glossary.test.ts`
Expected: PASS, all cases.

- [ ] **Step 5: Prove the number rule can fail**

Change `numbersIn` to return `[]` always; confirm all four number cases go red; restore. Then change `containsTerm` to a plain `text.includes(term)`; confirm the whole-word case goes red; restore and confirm green. Commit neither broken version.

- [ ] **Step 6: Commit**

```bash
git add scripts/check-thai-glossary.ts scripts/check-thai-glossary.test.ts
git commit -m "feat: add the Thai glossary checker, before any translation exists"
```

---

### Task 4: Batch 1 — the 58 terms

Spec §5's first batch. 14 structural labels and 44 recurring stat names, covering 4,240 of 5,956 lines.

**Files:**
- Create: `scripts/seed-thai-batch1.ts`
- Modify: `package.json` (one script entry)

**Interfaces:**
- Consumes: `classifyLine` from Task 2, to derive the term list from the live data rather than a hardcoded copy.
- Produces: rows in `item_description_terms`.

**Derive the term list from the database, do not hardcode it.** A hardcoded list drifts the moment an item is added. The script reads every description, classifies each line, and seeds a translation for every label and every stat name it finds, so the mapping below is a *lookup* and anything not in it is reported as unseeded rather than silently skipped.

- [ ] **Step 1: Write the seed script**

Create `scripts/seed-thai-batch1.ts`:

```ts
// Seeds batch 1 of the Thai translation: the structural labels and the
// recurring stat names. Measured against the live data, these 58 terms cover
// 4,240 of the 5,956 lines in all item descriptions -- 71%.
//
// The term list is derived from the database rather than hardcoded, so a term
// that appears in the data but not in the mapping below is REPORTED rather than
// silently skipped. A hardcoded list would drift the first time an item lands.

import { supabaseAdmin } from '../lib/supabase';
import { classifyLine } from '../lib/item-description-th';

// null means deliberately English -- see the migration's comment on thai_term.
const LABEL_TH: Record<string, string | null> = {
  'Weight': 'น้ำหนัก',
  'Type': 'ประเภท',
  'Required Level': 'เลเวลที่ต้องใช้',
  'Equippable by': 'อาชีพที่ใส่ได้',
  'Equipped on': 'ช่องที่ใส่',
  'DEF': null,
  'Position': 'ตำแหน่ง',
  'ATK': null,
  'Weapon Level': 'ระดับอาวุธ',
  'Element': 'ธาตุ',
  'Equipped': 'ใช้กับ',
  'Equip': 'ใช้กับ',
  'Usable by': 'อาชีพที่ใช้ได้',
  'Range': 'ระยะ',
  'Cover reads': 'ปกเขียนว่า',
  'Cooldown': null,
  'Melee physical attacks': 'การโจมตีระยะประชิด',
};

const STAT_TH: Record<string, string | null> = {
  'ATK': null, 'DEF': null, 'MATK': null, 'MDEF': null,
  'STR': null, 'AGI': null, 'VIT': null, 'INT': null, 'DEX': null, 'LUK': null,
  'HIT': null, 'FLEE': null, 'CRIT': null, 'ASPD': null,
  'MHP': null, 'MSP': null, 'SP': null, 'HP': null,
  'FLEE Rate': 'FLEE',
  'Perfect Dodge': null,
  'Movement Speed': 'ความเร็วเคลื่อนที่',
  'Attack Speed': 'ความเร็วโจมตี',
  'Critical Rate': 'อัตรา CRIT',
  'Critical Damage': null,
  'Physical Damage': null,
  'Magical Damage': 'Magical Damage',
  'Ranged Physical Damage': 'Ranged Physical Damage',
  'Damage Taken': null,
  'Resistance': null,
  'Cast Time': 'เวลาร่าย',
  'Fixed Casting Time': 'เวลาร่ายคงที่',
  'Variable Casting Time': null,
  'SP Recovery': 'การฟื้นฟู SP',
  'HP Recovery': 'การฟื้นฟู HP',
  'Weight Limit': 'น้ำหนักที่แบกได้',
  'EXP': null,
  'Zeny': null,
};

async function main() {
  const db = supabaseAdmin();

  // Read every description and classify it, so the terms actually present in
  // the data are what gets seeded.
  const descriptions: string[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from('items').select('description').range(from, from + 999);
    if (error) throw new Error(`Failed to read items at ${from}: ${error.message}`);
    if (!data || data.length === 0) break;
    for (const row of data) if (row.description) descriptions.push(row.description);
    if (data.length < 1000) break;
  }

  const labels = new Map<string, number>();
  const stats = new Map<string, number>();
  for (const d of descriptions) {
    for (const raw of d.split('\n')) {
      const c = classifyLine(raw);
      if (!c) continue;
      if (c.kind === 'label') labels.set(c.term, (labels.get(c.term) ?? 0) + 1);
      else if (c.kind === 'stat') stats.set(c.term, (stats.get(c.term) ?? 0) + 1);
    }
  }

  const rows: { source_term: string; thai_term: string | null; kind: string }[] = [];
  const unseeded: string[] = [];
  let covered = 0;

  for (const [term, count] of labels) {
    if (term in LABEL_TH) {
      rows.push({ source_term: term, thai_term: LABEL_TH[term], kind: 'label' });
      covered += count;
    } else {
      unseeded.push(`label (${count}x): ${term}`);
    }
  }

  for (const [term, count] of stats) {
    if (term in STAT_TH) {
      rows.push({ source_term: term, thai_term: STAT_TH[term], kind: 'stat' });
      covered += count;
    } else {
      unseeded.push(`stat (${count}x): ${term}`);
    }
  }

  const { error } = await db.from('item_description_terms').upsert(rows, { onConflict: 'source_term' });
  if (error) throw new Error(`Failed to seed terms: ${error.message}`);

  console.log(`seeded ${rows.length} terms, covering ${covered} lines`);
  console.log(`not seeded: ${unseeded.length}`);
  for (const u of unseeded.slice(0, 40)) console.log(`  ${u}`);
  if (unseeded.length > 40) console.log(`  ... and ${unseeded.length - 40} more`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 2: Add the npm script**

In `package.json`, after the existing `mirror-skill-icons` entry:

```json
    "seed-thai-batch1": "tsx scripts/seed-thai-batch1.ts"
```

- [ ] **Step 3: Dry-run the classification without writing**

You have no database credentials, so you cannot run the seed. Instead confirm the mapping is complete against the term list this plan measured. The 14 structural labels found in the data are: `Weight`, `Type`, `Required Level`, `Equippable by`, `Equipped on`, `DEF`, `Position`, `ATK`, `Weapon Level`, `Element`, `Equipped`, `Cover reads`, `Cooldown`, `Melee physical attacks` — plus `Range`, `Equip` and `Usable by`, which appear once each. Check every one of those 17 has a key in `LABEL_TH`. Report any that do not.

- [ ] **Step 4: Run the tests and commit**

Run: `npm test && npx tsc --noEmit`

```bash
git add scripts/seed-thai-batch1.ts package.json
git commit -m "feat: seed batch 1 of the Thai term dictionary"
```

- [ ] **Step 5: [CONTROLLER] Run the seed and report coverage**

The controller runs `npm run seed-thai-batch1` and reports the seeded count, the covered line count, and the full unseeded list. **An unseeded stat name is expected** — 90 of the 134 occur once and belong to a later batch. An unseeded *label* is not expected and means the measurement drifted.

---

### Task 5: Render Thai on the item page

Spec §4.3. Thai is the default; a toggle switches to English and remembers the choice, because a player who knows the English from the game must be able to compare when our wording differs.

**Files:**
- Modify: `app/database/items/[id]/page.tsx`
- Create: `components/DescriptionLanguageToggle.tsx`
- Modify: `app/globals.css` (append only)

**Interfaces:**
- Consumes: `composeThaiDescription` and `ThaiDictionaries` from Task 2.
- Produces: nothing later tasks depend on.

- [ ] **Step 1: Read the page first**

Read `app/database/items/[id]/page.tsx` in full. Keep `getItem`, `generateMetadata`, and the split between its error branch and its `notFound()` branch exactly as they are — a query error must render a neutral message with a 200 and must never become a 404.

- [ ] **Step 2: Load the dictionaries alongside the item**

Add to the page body, beside the existing queries:

```tsx
  const [{ data: lineRows, error: linesError }, { data: termRows, error: termsError }] =
    await Promise.all([
      db.from('item_description_lines').select('source_line, thai_line'),
      db.from('item_description_terms').select('source_term, thai_term'),
    ]);

  // A dictionary that failed to load is not an empty dictionary. Falling back to
  // English for every line is the right behaviour either way, but the two cases
  // must stay distinguishable in the logs.
  if (linesError) console.error('item description lines query failed', linesError);
  if (termsError) console.error('item description terms query failed', termsError);

  const dict = {
    lines: new Map((lineRows ?? []).map((r) => [r.source_line, r.thai_line])),
    terms: new Map((termRows ?? []).map((r) => [r.source_term, r.thai_term])),
  };
```

- [ ] **Step 3: Render both languages and let the toggle choose**

Replace the existing description card with:

```tsx
      {item.description && (
        <div className="card" style={{ marginTop: 20 }}>
          <h2 className="section-title">คำอธิบาย</h2>
          <DescriptionLanguageToggle
            thaiLines={composeThaiDescription(item.description, dict).map((l) => l.thai ?? l.source)}
            englishLines={item.description.split('\n').map((l) => l.replace(/\^[0-9a-fA-F]{6}/g, '').trim()).filter((l) => l !== '')}
          />
        </div>
      )}
```

Both arrays are built on the server, so the toggle ships no dictionary to the browser and switching is instant.

Add the imports `import { composeThaiDescription } from '@/lib/item-description-th';` and `import DescriptionLanguageToggle from '@/components/DescriptionLanguageToggle';`.

- [ ] **Step 4: Write the toggle**

Create `components/DescriptionLanguageToggle.tsx`:

```tsx
'use client';

// Thai by default, with a switch back to English.
//
// The switch exists because our wording and the game's will not always match,
// and a player who learned the English text in-game needs to compare. Both
// versions are rendered on the server and passed in, so no dictionary reaches
// the browser and switching costs nothing.

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'roz-calc:description-language';

export default function DescriptionLanguageToggle({
  thaiLines,
  englishLines,
}: {
  thaiLines: string[];
  englishLines: string[];
}) {
  const [showEnglish, setShowEnglish] = useState(false);

  // Read after mount, never during render: the server and the first client
  // render must produce identical markup or React reports a hydration mismatch.
  useEffect(() => {
    try {
      setShowEnglish(window.localStorage.getItem(STORAGE_KEY) === 'en');
    } catch {
      // Storage can throw outright in private mode. The default stands.
    }
  }, []);

  function choose(english: boolean) {
    setShowEnglish(english);
    try {
      window.localStorage.setItem(STORAGE_KEY, english ? 'en' : 'th');
    } catch {
      // Not remembering the choice is survivable; failing the page is not.
    }
  }

  const lines = showEnglish ? englishLines : thaiLines;

  return (
    <>
      <div className="lang-toggle">
        <button type="button" className={showEnglish ? undefined : 'on'} onClick={() => choose(false)}>
          ไทย
        </button>
        <button type="button" className={showEnglish ? 'on' : undefined} onClick={() => choose(true)}>
          English
        </button>
      </div>
      <p style={{ whiteSpace: 'pre-line', color: 'var(--dim)' }}>{lines.join('\n')}</p>
    </>
  );
}
```

- [ ] **Step 5: Add the toggle styles**

Append to `app/globals.css`:

```css
/* Language switch on the item description. Two small pills reusing the tab
   treatment, so "which one is active" reads the same way it does elsewhere. */
.lang-toggle { display: flex; gap: 4px; margin-bottom: 10px; }

.lang-toggle button {
  padding: 3px 10px;
  border: 1px solid var(--hair);
  border-radius: 999px;
  background: transparent;
  color: var(--dim);
  font: 600 12px/1.6 "Sarabun", sans-serif;
  cursor: pointer;
}

.lang-toggle button:hover { color: var(--text); background: var(--panel-2); }
.lang-toggle button.on { color: var(--yellow-ink); background: var(--yellow); border-color: var(--yellow); }
```

- [ ] **Step 6: Check it in a browser and report what you saw**

The controller will have seeded batch 1 before this step. Open each and report:

- `/database/items/4118` (Ground Petite Card) — the `Type`, `Equipped on` and `Weight` lines read Thai; the effect line is still English because prose is not in batch 1; and the malformed `Equipped on : c` still shows its `c` verbatim.
- `/database/items/501` or any equipment — `Equippable by`, `Required Level` and `Weapon Level` read Thai while `ATK` and `DEF` stay English, which is the deliberate-null case working.
- Toggle to English and back; reload; confirm the choice survives.
- Open in a private window and confirm the page still renders and the toggle still works within the session.

- [ ] **Step 7: Run everything and commit**

Run: `npm test && npx tsc --noEmit && npm run build`

```bash
git add "app/database/items/[id]/page.tsx" components/DescriptionLanguageToggle.tsx app/globals.css
git commit -m "feat: render item descriptions in Thai with an English toggle"
```

---

## Done criteria

1. `npm test` passes and every new test has been shown to fail when its subject is broken.
2. `npx tsc --noEmit` is clean and `npm run build` exits 0.
3. Both tables exist with RLS on and exactly one select policy each.
4. The seed reports its covered-line count, and **every structural label is seeded** — an unseeded label means the measurement drifted; unseeded one-off stat names are expected and belong to batch 2.
5. On a real item page, structural lines read Thai while `ATK` and `DEF` stay English.
6. The language toggle survives a reload and does not break in a private window.
7. `npx tsx scripts/check-thai-glossary.ts` runs and reports zero number mismatches.

## Not in this plan

Batches 2 through 4 from spec §5 — the recurring effect lines, the remaining effect lines, and the ~730 flavour lines. The 90 one-off stat names also wait for batch 2. Nothing here translates prose, so `item_description_lines` ships empty and the composition function's prose path is exercised only by its tests until then.

Also out of scope, per spec §8: `name_th` for items and monsters, skill and monster descriptions, and any site-wide language switch.
