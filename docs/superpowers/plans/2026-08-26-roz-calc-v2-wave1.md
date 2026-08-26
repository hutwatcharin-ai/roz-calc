# ROZ Calc v2 — Wave 1 (Foundations) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the data columns, shared libraries, and site-wide chrome that every Wave 2 page depends on — without shipping a single new page.

**Architecture:** Three layers, bottom-up. (1) Database: add the columns and one table the raw JSON already contains but v1 never imported. (2) Pure TypeScript libraries in `lib/` — character context, aggro tier, kill rate — each a plain function with no React and no browser globals, so they are unit-testable without a DOM. (3) Presentation: one shared badge component, the two-tier nav, table-to-card CSS, and per-page SEO metadata. Nothing in this wave renders a new route; Wave 2 assembles these parts into pages.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Supabase (Postgres), Vitest, `tsx` for scripts. Test command is `npm test` (`vitest run`). Import command is `npm run import-data`.

**Spec:** `docs/superpowers/specs/2026-08-26-roz-calc-v2-design.md` — read §3.0, §3.7, §3.13, §3.15, §4, §5, §6 before starting. The spec is the binding authority; this plan argues from it.

## Global Constraints

- **Thai UI copy.** Every user-facing string is Thai. Code, identifiers, comments, and commit messages are English.
- **Never invent game values.** A value that is not in `data/raw/*.json` or explicitly confirmed in the spec does not get guessed. Missing data renders as `—`, never as `0`, `N/A`, or an estimate.
- **Migrations are additive only.** `alter table ... add column`, `create table if not exists`. Never `drop`, never `truncate`, never delete rows. Re-imports are upserts over existing rows.
- **Every new table gets RLS in the same migration that creates it.** Public `select` for `anon, authenticated`; no insert/update/delete policy. v1 shipped without RLS and the public anon key had full DELETE rights — that must not recur.
- **Supabase returns at most 1,000 rows per `select()` and does not warn when it truncates.** `items` has ~1,300 rows and `monster_drops` has thousands. Any query that intends to read a whole table must page with `.range()` in a loop.
- **Design tokens only.** Colors come from the CSS custom properties already in `app/globals.css` (`--ground --panel --panel-2 --text --dim --faint --hair --yellow --pink --cyan`). The single exception is the status green/red in Task 5, which the spec authorizes explicitly.
- **Status is never encoded by color alone.** Any colored state badge also carries a text label or a shape/glyph.
- **Pure functions live in `lib/` and take their dependencies as arguments.** No `lib/` function reads `window`, `localStorage`, or `process.env` directly — callers pass those in. This is what makes them testable without jsdom.
- **A test must be proven capable of failing.** After a test goes green, invert or delete the logic it claims to check and confirm it turns red, then restore. A test that stays green either way is not a test.
- **Server components stay server components.** Only the specific subtree that reads `localStorage` becomes a client component. Never add `'use client'` to a route file — it costs the SEO that Task 9 buys.

---

## File Structure

| File | Responsibility | Task |
|---|---|---|
| `supabase/migrations/0003_item_description.sql` | Add `items.description` | 1 |
| `supabase/migrations/0004_monster_details.sql` | Add monster stat columns, create `monster_skills` + its RLS | 2 |
| `scripts/transform.ts` | Raw JSON → DB row shapes (existing file, extended) | 1, 2 |
| `scripts/transform.test.ts` | Transform unit tests (existing file, extended) | 1, 2 |
| `scripts/import-data.ts` | Import driver (existing file, extended) | 1, 2 |
| `scripts/mirror-skill-icons.ts` | Download skill icons, rewrite paths in `data/raw/skills.json` | 3 |
| `lib/character-context.ts` | Parse/read/write the shared character context | 4 |
| `lib/character-context.test.ts` | Its tests | 4 |
| `components/CharacterContextProvider.tsx` | Client-side React binding for the above | 4 |
| `lib/aggro-tier.ts` | Monster + player HP → aggro level | 5 |
| `lib/aggro-tier.test.ts` | Its tests | 5 |
| `components/AggroBadge.tsx` | Renders an aggro level | 5 |
| `lib/kills-per-hour.ts` | HP + damage + attack speed → kill rate | 6 |
| `lib/kills-per-hour.test.ts` | Its tests | 6 |
| `lib/nav-links.ts` | Route → section mapping and link lists | 7 |
| `lib/nav-links.test.ts` | Its tests | 7 |
| `components/Nav.tsx` | Two-tier nav shell (existing file, rewritten) | 7 |
| `components/NavTabs.tsx` | Client component for active-link highlighting | 7 |
| `app/globals.css` | Design tokens + table/card-row responsive rules (existing) | 5, 7, 8 |
| `lib/site.ts` | The deployed origin, shared by layout and sitemap | 9 |
| `app/sitemap.ts` | Generated sitemap | 9 |
| `public/og-default.png` | Single site-wide OG image | 9 |

**One deviation from the spec's wave split, deliberate.** Spec §3.17 lists the kill-rate work as Wave 2 item 16. This plan builds `lib/kills-per-hour.ts` in Wave 1 (Task 6) and leaves its UI in Wave 2. The library has no dependencies, several Wave 2 pages consume it, and splitting library from UI is the same shape as Tasks 4 and 5. No UI ships from it in this wave.

**Migration application is a controller step, not an implementer step.** Implementers write the `.sql` file and commit it. Applying it to the live Supabase project requires the Management API personal access token, which is not on disk. After a task that adds a migration, the controller applies it and confirms before the next task's import step runs. Any task step marked **[CONTROLLER]** is done by the session controller, not the task's implementer.

---

### Task 1: Add `items.description`

Spec §3.0. The raw feed has a description for all ~1,300 items; the `items` table has no column for it, so item pages show stats with no effect text and the Wave 2 Cards browser would have nothing to display.

**Files:**
- Create: `supabase/migrations/0003_item_description.sql`
- Modify: `scripts/transform.ts` (the `ItemRow` interface and `transformItem`)
- Modify: `scripts/transform.test.ts`
- Modify: `scripts/import-data.ts` (paged upsert)

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `ItemRow.description: string | null` — Task 2 does not use it; Wave 2's Cards browser does.

- [ ] **Step 1: Confirm the raw field shape before writing anything**

Run:
```bash
node -e "
const i=JSON.parse(require('fs').readFileSync('data/raw/items.json','utf8')).items;
const w=i.filter(x=>x.description&&Array.isArray(x.description.lines)&&x.description.lines.length);
console.log('items:',i.length,'with description.lines:',w.length);
console.log(JSON.stringify(w[0].description.lines.slice(0,4),null,1));
"
```
Expected: a count close to 1,300 and an array of strings. If `description.lines` does not exist, stop and report — the rest of this task assumes it does.

- [ ] **Step 2: Write the migration**

Create `supabase/migrations/0003_item_description.sql`:

```sql
-- 0003_item_description.sql
--
-- items.description was never created, though the raw feed carries a
-- description for every item. Without it the item detail page shows stats with
-- no effect text, and the Cards browser (spec §3.3) has nothing to list --
-- a card's entire value is its effect line.
--
-- Additive only: existing rows get NULL and the next import fills them in.

alter table items add column if not exists description text;
```

- [ ] **Step 3: Write the failing transform test**

Append to `scripts/transform.test.ts`:

```ts
describe('transformItem description', () => {
  it('joins description lines with newlines', () => {
    const row = transformItem({
      id: 4001,
      displayName: 'Poring Card',
      description: { lines: ['ATK +20', 'Class : Card'] },
    });
    expect(row.description).toBe('ATK +20\nClass : Card');
  });

  it('returns null when the item has no description', () => {
    const row = transformItem({ id: 909, displayName: 'Jellopy' });
    expect(row.description).toBeNull();
  });

  it('returns null for an empty lines array rather than an empty string', () => {
    const row = transformItem({ id: 910, displayName: 'Fluff', description: { lines: [] } });
    expect(row.description).toBeNull();
  });
});
```

- [ ] **Step 4: Run the test and watch it fail**

Run: `npm test -- scripts/transform.test.ts`
Expected: FAIL — the three new cases report `undefined` where a string or `null` is expected, because `ItemRow` has no `description` yet.

- [ ] **Step 5: Extend the row type and the transform**

In `scripts/transform.ts`, add one field to the `ItemRow` interface, immediately after `icon_url`:

```ts
  icon_url: string | null;
  description: string | null;
```

And in `transformItem`, add one property to the returned object, immediately after `icon_url`:

```ts
    icon_url: raw.iconUrl ?? null,
    // Stored as one string with newlines preserved; the item page renders it
    // with white-space: pre-line. An empty lines array becomes null, not "",
    // so "no description" is one value everywhere instead of two.
    description: raw.description?.lines?.length ? raw.description.lines.join('\n') : null,
```

- [ ] **Step 6: Run the test and watch it pass**

Run: `npm test -- scripts/transform.test.ts`
Expected: PASS, all cases.

- [ ] **Step 7: Prove the test can fail**

Temporarily change the `description` line to `description: null,`. Run `npm test -- scripts/transform.test.ts` and confirm the first case now fails. Restore the real line and confirm green again. Do not commit the broken version.

- [ ] **Step 8: Make the items upsert page-safe**

`items` is ~1,300 rows and Supabase caps a single request. In `scripts/import-data.ts`, add this helper above `importMonstersAndItems`:

```ts
// Supabase rejects or silently truncates very large single requests. Every
// import upsert goes through here so row count never becomes a hidden cap.
const UPSERT_CHUNK = 500;

async function upsertInChunks(
  db: ReturnType<typeof supabaseAdmin>,
  table: string,
  rows: any[],
  options?: { onConflict: string },
) {
  for (let i = 0; i < rows.length; i += UPSERT_CHUNK) {
    const chunk = rows.slice(i, i + UPSERT_CHUNK);
    const { error } = await db.from(table).upsert(chunk, options);
    if (error) {
      throw new Error(
        `Failed to import ${table} rows ${i}-${i + chunk.length - 1}, aborting: ${error.message}`,
      );
    }
  }
}
```

Then replace the items upsert block:

```ts
  console.log(`Importing ${itemsRaw.length} items...`);
  const itemRows = itemsRaw.map(transformItem);
  const { error: itemsError } = await db.from('items').upsert(itemRows);
  if (itemsError) {
    throw new Error(`Failed to import items, aborting (no partial overwrite): ${itemsError.message}`);
  }
```

with:

```ts
  console.log(`Importing ${itemsRaw.length} items...`);
  const itemRows = itemsRaw.map(transformItem);
  await upsertInChunks(db, 'items', itemRows);
```

And replace the monsters, drops, and spawns upsert blocks the same way:

```ts
  console.log(`Importing ${monstersRaw.length} monsters...`);
  const monsterRows = monstersRaw.map(transformMonster);
  await upsertInChunks(db, 'monsters', monsterRows);
```

```ts
  console.log(`Importing ${dropRows.length} drop rows...`);
  await upsertInChunks(db, 'monster_drops', dropRows, { onConflict: 'monster_id,item_id' });

  console.log(`Importing ${spawnRows.length} spawn rows...`);
  await upsertInChunks(db, 'monster_spawns', spawnRows, { onConflict: 'monster_id,map_code' });
```

Leave the surrounding `console.log` lines and the skipped-drop-count reporting exactly as they are.

- [ ] **Step 9: Run the whole suite**

Run: `npm test`
Expected: PASS. No previously-passing test may break.

- [ ] **Step 10: Commit**

```bash
git add supabase/migrations/0003_item_description.sql scripts/transform.ts scripts/transform.test.ts scripts/import-data.ts
git commit -m "feat: add items.description column and chunked upserts"
```

- [ ] **Step 11: [CONTROLLER] Apply the migration and run the import**

Apply `0003_item_description.sql` to the live project via the Supabase Management API, then run `npm run import-data`. Verify with a count query that `description` is non-null for roughly the number of items Step 1 reported. A count of 0 means the import wrote nothing — investigate before starting Task 2.

---

### Task 2: Import the monster fields the raw feed already has

Spec §3.7. `data/raw/monsters.json` carries aggression flags, MVP flags, base stats, MATK, and per-monster skill lists. None of it was imported in v1. `is_aggressive` is the single most valuable field in the file — it is what Tasks 5 and Wave 2's AFK finder are built on.

Confirmed raw shapes (probed 26 Aug):
- `ragnarokZero.specialStatus` is an array of `{raw, en}` objects. The distinct `raw` values across all 524 monsters are exactly: `""`, `"Physically attackable"`, `"Can move"`, `"Loots items"`, `"Aggressive"`, `"MVP"`, `"mini"`.
- `ragnarokZero.baseStats` is `{agi, dex, int, luk, str, vit}` — note `int`, which is a reserved word in some contexts and becomes column `int_`.
- `ragnarokZero.magicAtkMin` / `magicAtkMax` are numbers.
- `ragnarokZero.skills[]` entries look like `{skillId, skillLv, name, rate: "5.00%", state, castTime, delay, cancelable, target, conditionType, ...}`. Note `rate` is a **percent string**, not a number.

**Files:**
- Create: `supabase/migrations/0004_monster_details.sql`
- Modify: `scripts/transform.ts`
- Modify: `scripts/transform.test.ts`
- Modify: `scripts/import-data.ts`

**Interfaces:**
- Consumes: `upsertInChunks(db, table, rows, options?)` from Task 1.
- Produces:
  - `MonsterRow` gains `is_aggressive: boolean`, `is_mvp: boolean`, `loots_items: boolean`, `matk_min: number | null`, `matk_max: number | null`, `str/agi/vit/int_/dex/luk: number | null`.
  - `export interface MonsterSkillRow { monster_id: number; skill_id: number; skill_name: string; skill_lv: number | null; rate: number | null; cast_time: number | null; delay: number | null; target: string | null; state: string | null }`
  - `export function transformMonsterSkills(raw: any): MonsterSkillRow[]`
  - Task 5 reads `monsters.is_aggressive` and `monsters.atk_max`.

- [ ] **Step 1: Write the migration**

Create `supabase/migrations/0004_monster_details.sql`:

```sql
-- 0004_monster_details.sql
--
-- Every field below already exists in data/raw/monsters.json and was simply
-- never imported. is_aggressive is the one that matters most: the game ships a
-- free unlimited auto-hunt bot, so "will this monster walk over and kill me
-- while I am away" is the question players ask most, and no competing site
-- surfaces it (spec 3.15.1).
--
-- Additive only. Existing rows keep their values; the next import fills these.

alter table monsters add column if not exists is_aggressive boolean not null default false;
alter table monsters add column if not exists is_mvp boolean not null default false;
alter table monsters add column if not exists loots_items boolean not null default false;
alter table monsters add column if not exists matk_min integer;
alter table monsters add column if not exists matk_max integer;
alter table monsters add column if not exists str integer;
alter table monsters add column if not exists agi integer;
alter table monsters add column if not exists vit integer;
alter table monsters add column if not exists int_ integer;
alter table monsters add column if not exists dex integer;
alter table monsters add column if not exists luk integer;

-- Partial index: the AFK finder and the aggro filters always ask for the
-- non-aggressive subset, which is the minority of rows.
create index if not exists monsters_not_aggressive_idx
  on monsters (level)
  where is_aggressive = false;

-- One row per (monster, skill). skill_id is the game's numeric id; skill_name
-- is the internal constant (e.g. NPC_POISON) because the raw feed gives no
-- display name here and inventing one would be guessing.
create table if not exists monster_skills (
  monster_id integer not null references monsters (id) on delete cascade,
  skill_id integer not null,
  skill_name text not null,
  skill_lv integer,
  rate numeric,
  cast_time integer,
  delay integer,
  target text,
  state text,
  primary key (monster_id, skill_id, skill_name)
);

create index if not exists monster_skills_monster_idx on monster_skills (monster_id);

-- RLS in the same migration that creates the table. v1 shipped tables with RLS
-- off, which left the public anon key with full DML rights on every row.
alter table monster_skills enable row level security;

create policy "monster_skills public read"
  on monster_skills for select
  to anon, authenticated
  using (true);
```

- [ ] **Step 2: Write the failing tests for the monster fields**

Append to `scripts/transform.test.ts`:

```ts
describe('transformMonster special status and stats', () => {
  const base = {
    id: 1002,
    name: 'Poring',
    ragnarokZero: { level: 1, hp: 50, baseExp: 2, jobExp: 1 },
  };

  it('reads Aggressive out of the specialStatus object array', () => {
    const row = transformMonster({
      ...base,
      ragnarokZero: {
        ...base.ragnarokZero,
        specialStatus: [{ raw: 'Can move', en: 'Can move' }, { raw: 'Aggressive', en: 'Aggressive' }],
      },
    });
    expect(row.is_aggressive).toBe(true);
    expect(row.is_mvp).toBe(false);
    expect(row.loots_items).toBe(false);
  });

  it('reads MVP and Loots items independently', () => {
    const row = transformMonster({
      ...base,
      ragnarokZero: {
        ...base.ragnarokZero,
        specialStatus: [{ raw: 'MVP', en: 'MVP' }, { raw: 'Loots items', en: 'Loots items' }],
      },
    });
    expect(row.is_mvp).toBe(true);
    expect(row.loots_items).toBe(true);
    expect(row.is_aggressive).toBe(false);
  });

  it('defaults every flag to false when specialStatus is missing', () => {
    const row = transformMonster(base);
    expect(row.is_aggressive).toBe(false);
    expect(row.is_mvp).toBe(false);
    expect(row.loots_items).toBe(false);
  });

  it('maps baseStats.int to the int_ column', () => {
    const row = transformMonster({
      ...base,
      ragnarokZero: {
        ...base.ragnarokZero,
        baseStats: { str: 12, agi: 15, vit: 10, int: 5, dex: 19, luk: 5 },
      },
    });
    expect(row.int_).toBe(5);
    expect(row.str).toBe(12);
    expect(row.dex).toBe(19);
  });

  it('leaves stats null when baseStats is absent rather than defaulting to zero', () => {
    const row = transformMonster(base);
    expect(row.str).toBeNull();
    expect(row.int_).toBeNull();
    expect(row.matk_min).toBeNull();
  });
});

describe('transformMonsterSkills', () => {
  it('parses the percent-string rate into a number', () => {
    const rows = transformMonsterSkills({
      id: 1002,
      ragnarokZero: {
        skills: [
          {
            skillId: 176,
            skillLv: 3,
            name: 'NPC_POISON',
            rate: '5.00%',
            state: 'attack',
            castTime: 800,
            delay: 5000,
            target: 'target',
          },
        ],
      },
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual({
      monster_id: 1002,
      skill_id: 176,
      skill_name: 'NPC_POISON',
      skill_lv: 3,
      rate: 5,
      cast_time: 800,
      delay: 5000,
      target: 'target',
      state: 'attack',
    });
  });

  it('returns an empty array when the monster has no skills', () => {
    expect(transformMonsterSkills({ id: 1002, ragnarokZero: {} })).toEqual([]);
  });

  it('keeps the row with a null rate rather than dropping the skill', () => {
    const rows = transformMonsterSkills({
      id: 1002,
      ragnarokZero: { skills: [{ skillId: 1, skillLv: 1, name: 'NPC_X', rate: '' }] },
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].rate).toBeNull();
  });

  it('drops a skill entry with no name, which cannot satisfy the primary key', () => {
    const rows = transformMonsterSkills({
      id: 1002,
      ragnarokZero: { skills: [{ skillId: 1, skillLv: 1, rate: '5.00%' }] },
    });
    expect(rows).toEqual([]);
  });

  it('de-duplicates entries that share the primary key', () => {
    const rows = transformMonsterSkills({
      id: 1002,
      ragnarokZero: {
        skills: [
          { skillId: 176, skillLv: 3, name: 'NPC_POISON', rate: '5.00%' },
          { skillId: 176, skillLv: 5, name: 'NPC_POISON', rate: '9.00%' },
        ],
      },
    });
    expect(rows).toHaveLength(1);
  });
});
```

Also update the existing `scripts/transform.test.ts` import line so `transformMonsterSkills` is in scope — find the line that imports from `./transform` and add the name to it.

- [ ] **Step 3: Run the tests and watch them fail**

Run: `npm test -- scripts/transform.test.ts`
Expected: FAIL — `transformMonsterSkills is not a function`, and the monster cases report `undefined`.

- [ ] **Step 4: Extend `MonsterRow` and `transformMonster`**

In `scripts/transform.ts`, add to the `MonsterRow` interface after `image_url`:

```ts
  image_url: string | null;
  is_aggressive: boolean;
  is_mvp: boolean;
  loots_items: boolean;
  matk_min: number | null;
  matk_max: number | null;
  str: number | null;
  agi: number | null;
  vit: number | null;
  int_: number | null;
  dex: number | null;
  luk: number | null;
```

Add this helper next to `toNumberOrNull`:

```ts
// specialStatus is an array of {raw, en} objects, not strings. The distinct raw
// values across all 524 monsters are: "", "Physically attackable", "Can move",
// "Loots items", "Aggressive", "MVP", "mini".
function hasSpecialStatus(raw: any, label: string): boolean {
  const list = raw?.ragnarokZero?.specialStatus;
  if (!Array.isArray(list)) return false;
  return list.some((s: any) => s?.raw === label);
}
```

Then extend the object `transformMonster` returns, after `image_url`:

```ts
    image_url: raw.imageUrl ?? null,
    is_aggressive: hasSpecialStatus(raw, 'Aggressive'),
    is_mvp: hasSpecialStatus(raw, 'MVP'),
    loots_items: hasSpecialStatus(raw, 'Loots items'),
    matk_min: toNumberOrNull(rz.magicAtkMin),
    matk_max: toNumberOrNull(rz.magicAtkMax),
    // Absent baseStats stays null. Defaulting to 0 would render as a real stat
    // of zero on the monster page, which is a different claim than "unknown".
    str: toNumberOrNull(rz.baseStats?.str),
    agi: toNumberOrNull(rz.baseStats?.agi),
    vit: toNumberOrNull(rz.baseStats?.vit),
    int_: toNumberOrNull(rz.baseStats?.int),
    dex: toNumberOrNull(rz.baseStats?.dex),
    luk: toNumberOrNull(rz.baseStats?.luk),
```

- [ ] **Step 5: Add `transformMonsterSkills`**

Append to `scripts/transform.ts`:

```ts
export interface MonsterSkillRow {
  monster_id: number;
  skill_id: number;
  skill_name: string;
  skill_lv: number | null;
  rate: number | null;
  cast_time: number | null;
  delay: number | null;
  target: string | null;
  state: string | null;
}

// rate arrives as a percent string like "5.00%". Strip the sign and parse; an
// empty or unparseable rate becomes null rather than dropping the skill, since
// "this monster casts Poison" is useful even when the frequency is unknown.
function parsePercent(value: unknown): number | null {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return null;
  const trimmed = value.trim().replace(/%$/, '');
  if (trimmed === '') return null;
  const n = Number(trimmed);
  return Number.isNaN(n) ? null : n;
}

export function transformMonsterSkills(raw: any): MonsterSkillRow[] {
  const skills = raw?.ragnarokZero?.skills ?? [];
  const seen = new Set<string>();
  const rows: MonsterSkillRow[] = [];

  for (const s of skills) {
    const skillId = toNumberOrNull(s?.skillId);
    const skillName = typeof s?.name === 'string' ? s.name.trim() : '';
    // Both are primary key components; a row missing either cannot be stored.
    if (skillId === null || skillName === '') continue;

    // The feed lists some skills twice at different levels. The primary key is
    // (monster_id, skill_id, skill_name), so a batch containing both would
    // abort the whole upsert. First occurrence wins.
    const key = `${skillId}:${skillName}`;
    if (seen.has(key)) continue;
    seen.add(key);

    rows.push({
      monster_id: raw.id,
      skill_id: skillId,
      skill_name: skillName,
      skill_lv: toNumberOrNull(s?.skillLv),
      rate: parsePercent(s?.rate),
      cast_time: toNumberOrNull(s?.castTime),
      delay: toNumberOrNull(s?.delay),
      target: typeof s?.target === 'string' && s.target !== '' ? s.target : null,
      state: typeof s?.state === 'string' && s.state !== '' ? s.state : null,
    });
  }

  return rows;
}
```

- [ ] **Step 6: Run the tests and watch them pass**

Run: `npm test -- scripts/transform.test.ts`
Expected: PASS, all cases.

- [ ] **Step 7: Prove the de-duplication test can fail**

Temporarily delete the two lines `if (seen.has(key)) continue;` and `seen.add(key);`. Run `npm test -- scripts/transform.test.ts` and confirm the de-duplication case fails. Restore both lines and confirm green. Do not commit the broken version.

- [ ] **Step 8: Import the skill rows**

In `scripts/import-data.ts`, add `transformMonsterSkills` to the import from `./transform`, then insert this block right after the spawns upsert, still inside `importMonstersAndItems`:

```ts
  const monsterSkillRows = monstersRaw.flatMap(transformMonsterSkills);
  console.log(`Importing ${monsterSkillRows.length} monster skill rows...`);
  await upsertInChunks(db, 'monster_skills', monsterSkillRows, {
    onConflict: 'monster_id,skill_id,skill_name',
  });
```

- [ ] **Step 9: Sanity-check the transform against the real file before importing**

Run:
```bash
npx tsx -e "
import { transformMonster, transformMonsterSkills } from './scripts/transform';
import { readFileSync } from 'node:fs';
const raw = JSON.parse(readFileSync('data/raw/monsters.json','utf8')).monsters;
const rows = raw.map(transformMonster);
console.log('monsters:', rows.length);
console.log('aggressive:', rows.filter(r => r.is_aggressive).length);
console.log('mvp:', rows.filter(r => r.is_mvp).length);
console.log('loots:', rows.filter(r => r.loots_items).length);
console.log('with str:', rows.filter(r => r.str !== null).length);
console.log('skill rows:', raw.flatMap(transformMonsterSkills).length);
"
```
Expected, per spec §3.7: aggressive ≈ 286, mvp ≈ 24, loots ≈ 42, with str ≈ 524. **If aggressive comes back 0, the `specialStatus` shape assumption is wrong — stop and report rather than importing zeros over good data.**

- [ ] **Step 10: Run the whole suite**

Run: `npm test`
Expected: PASS.

- [ ] **Step 11: Commit**

```bash
git add supabase/migrations/0004_monster_details.sql scripts/transform.ts scripts/transform.test.ts scripts/import-data.ts
git commit -m "feat: import monster aggression flags, base stats, and skills"
```

- [ ] **Step 12: [CONTROLLER] Apply the migration and run the import**

Apply `0004_monster_details.sql`, then run `npm run import-data`. Verify against the Step 9 numbers: `select count(*) from monsters where is_aggressive` should be ≈286 and `select count(*) from monster_skills` should match the printed skill row count. A zero on either means the import silently failed.

---

### Task 3: Mirror the skill icons

Spec §3.1. All 851 rows in `data/raw/skills.json` carry `icon: "/assets/local/catalog/<hash>.webp"` — a path on rozerodb's origin. Served from our domain every one of them 404s, so the Wave 2 skills page would render 851 empty frames. Monster images (522) and item icons (1,299) were already mirrored into `public/images/` the same way and their raw paths already read `/images/monsters/1001.gif`; this task does for skills what was done twice before.

Two facts that bound this task: rozerodb's `robots.txt` is `Allow: /` with `Disallow: /api/`, so `/assets/` is not disallowed — but a burst of 851 requests is still rude, so the script rate-limits and resumes. And the local game client is not an alternative source: `D:\RagnarokZero\data.grf` is an encrypted container and is not to be reverse-engineered.

**Files:**
- Create: `scripts/mirror-skill-icons.ts`
- Modify: `data/raw/skills.json` (rewritten paths, produced by the script)
- Modify: `package.json` (one script entry)
- Creates as output: `public/images/skills/*.webp`

**Interfaces:**
- Consumes: nothing.
- Produces: `skills.json` entries whose `icon` is `/images/skills/<hash>.webp`; `transformSkill` already maps `raw.icon` to `icon_url` with no change needed.

- [ ] **Step 1: Write the mirror script**

Create `scripts/mirror-skill-icons.ts`:

```ts
// Mirrors skill icons out of data/raw/skills.json onto our own origin.
//
// Every icon path in the raw file points at rozerodb's /assets/local/catalog/,
// which 404s when served from our domain. Monster and item images were already
// mirrored the same way -- their raw paths read /images/monsters/1001.gif.
//
// Deliberately polite: one request at a time with a delay, and a skip for files
// already on disk so a re-run costs nothing. Re-runnable and resumable.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, basename } from 'node:path';

const SOURCE_ORIGIN = 'https://rozerodb.com';
const RAW_PATH = 'data/raw/skills.json';
const OUT_DIR = join('public', 'images', 'skills');
const PUBLIC_PREFIX = '/images/skills';
const DELAY_MS = 250;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const skills: any[] = JSON.parse(readFileSync(RAW_PATH, 'utf-8'));
  mkdirSync(OUT_DIR, { recursive: true });

  let downloaded = 0;
  let skipped = 0;
  const failed: string[] = [];

  for (const skill of skills) {
    const icon: string | undefined = skill.icon;
    if (!icon) continue;

    // Already rewritten by a previous run -- nothing to do.
    if (icon.startsWith(PUBLIC_PREFIX)) {
      skipped++;
      continue;
    }

    const file = basename(icon);
    const outPath = join(OUT_DIR, file);

    if (existsSync(outPath)) {
      skill.icon = `${PUBLIC_PREFIX}/${file}`;
      skipped++;
      continue;
    }

    try {
      const res = await fetch(`${SOURCE_ORIGIN}${icon}`);
      if (!res.ok) {
        failed.push(`${skill.slug}: HTTP ${res.status}`);
        await sleep(DELAY_MS);
        continue;
      }
      const buf = Buffer.from(await res.arrayBuffer());
      // A zero-byte or near-empty response is a failure that does not throw.
      // Writing it would produce a broken image that renders as an empty frame
      // with no error anywhere -- exactly the silent-failure mode that shipped
      // 65 blank covers on another project.
      if (buf.length < 64) {
        failed.push(`${skill.slug}: ${buf.length} bytes`);
        await sleep(DELAY_MS);
        continue;
      }
      writeFileSync(outPath, buf);
      skill.icon = `${PUBLIC_PREFIX}/${file}`;
      downloaded++;
    } catch (err) {
      failed.push(`${skill.slug}: ${(err as Error).message}`);
    }

    await sleep(DELAY_MS);
  }

  writeFileSync(RAW_PATH, JSON.stringify(skills, null, 2));

  console.log(`downloaded: ${downloaded}`);
  console.log(`skipped (already present): ${skipped}`);
  console.log(`failed: ${failed.length}`);
  for (const f of failed.slice(0, 20)) console.log(`  ${f}`);
  if (failed.length > 20) console.log(`  ... and ${failed.length - 20} more`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 2: Add the npm script**

In `package.json`, add one entry to `scripts`, after `import-data`:

```json
    "import-data": "tsx scripts/import-data.ts",
    "mirror-skill-icons": "tsx scripts/mirror-skill-icons.ts"
```

- [ ] **Step 3: Dry-run against three icons first**

Do not run the full 851 before proving the URL shape works. Run:

```bash
node -e "
const s=JSON.parse(require('fs').readFileSync('data/raw/skills.json','utf8'));
(async()=>{
  for (const k of s.slice(0,3)) {
    const r = await fetch('https://rozerodb.com'+k.icon);
    const b = Buffer.from(await r.arrayBuffer());
    console.log(k.slug, r.status, r.headers.get('content-type'), b.length+' bytes');
  }
})();
"
```
Expected: three lines with status 200, an image content-type, and a byte count in the thousands. **If they come back 403, 404, or a few hundred bytes of HTML, stop and report — do not run the full loop.** The fallback the spec names (element-colored blocks with the skill's initials) is then the route, and that is a Wave 2 decision, not something to improvise here.

- [ ] **Step 4: Run the full mirror**

Run: `npm run mirror-skill-icons`
Expected: `downloaded` close to 851, `failed` at or near 0. This takes roughly four minutes at the 250 ms delay — that is intended.

- [ ] **Step 5: Verify the files are real images, not empty frames**

Run:
```bash
ls public/images/skills | wc -l
node -e "
const fs=require('fs');
const d='public/images/skills';
const files=fs.readdirSync(d);
const small=files.filter(f=>fs.statSync(d+'/'+f).size<512);
console.log('files:',files.length,'suspiciously small:',small.length);
console.log(small.slice(0,10));
const s=JSON.parse(fs.readFileSync('data/raw/skills.json','utf8'));
console.log('still pointing at rozerodb:',s.filter(x=>x.icon&&x.icon.startsWith('/assets')).length);
"
```
Expected: file count close to 851, `suspiciously small` is 0, and `still pointing at rozerodb` is 0. A non-zero small count means some downloads produced placeholder bytes — delete those files and re-run the mirror, which resumes.

- [ ] **Step 6: Confirm the icons load through Next**

Run `npm run dev`, then open one icon URL directly in a browser — take a filename from `ls public/images/skills | head -1` and visit `http://localhost:3000/images/skills/<that-file>`. Expected: the icon renders. A 404 means the output directory is wrong.

- [ ] **Step 7: Run the whole suite**

Run: `npm test`
Expected: PASS. `transformSkill` is unchanged, so nothing should move.

- [ ] **Step 8: Commit**

```bash
git add scripts/mirror-skill-icons.ts package.json data/raw/skills.json public/images/skills
git commit -m "feat: mirror skill icons onto our own origin"
```

- [ ] **Step 9: [CONTROLLER] Re-import skills**

Run `npm run import-data` so `skills.icon_url` picks up the rewritten paths, then verify no row still points at `/assets/`.

---

### Task 4: Shared character context

Spec §3.15.2. Competing sites make you re-enter your level and damage on every tool. Storing it once and reading it everywhere is the structural advantage — it is a layer every later feature reads, not a feature of its own.

The design constraint that makes this testable: `lib/character-context.ts` contains no React and never touches `window`. It takes a storage object as an argument. The React binding is a separate, thin client component.

**Files:**
- Create: `lib/character-context.ts`
- Create: `lib/character-context.test.ts`
- Create: `components/CharacterContextProvider.tsx`

**Interfaces:**
- Consumes: `JobKey` and `JOB_PROFILES` from `lib/formulas.ts` (existing, tested).
- Produces:
  - `export interface CharacterContext { level: number; job: JobKey; damagePerHit: number; attacksPerSecond: number }`
  - `export const CHARACTER_STORAGE_KEY = 'roz-calc:character'`
  - `export function parseCharacterContext(raw: string | null): CharacterContext | null`
  - `export function readCharacterContext(storage: StorageLike | null): CharacterContext | null`
  - `export function writeCharacterContext(storage: StorageLike | null, ctx: CharacterContext): boolean`
  - `export function useCharacterContext(): { character: CharacterContext | null; setCharacter: (c: CharacterContext) => void; ready: boolean }` from `components/CharacterContextProvider.tsx`
  - Task 5 and Task 6 consume `CharacterContext`.

- [ ] **Step 1: Write the failing tests**

Create `lib/character-context.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  CHARACTER_STORAGE_KEY,
  parseCharacterContext,
  readCharacterContext,
  writeCharacterContext,
  type CharacterContext,
} from './character-context';

const VALID: CharacterContext = { level: 50, job: 'knight', damagePerHit: 250, attacksPerSecond: 2.5 };

function fakeStorage(initial: Record<string, string> = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
  };
}

function throwingStorage() {
  return {
    getItem: () => {
      throw new DOMException('The operation is insecure.', 'SecurityError');
    },
    setItem: () => {
      throw new DOMException('The operation is insecure.', 'SecurityError');
    },
  };
}

describe('parseCharacterContext', () => {
  it('parses a well-formed payload', () => {
    expect(parseCharacterContext(JSON.stringify(VALID))).toEqual(VALID);
  });

  it('returns null for null input', () => {
    expect(parseCharacterContext(null)).toBeNull();
  });

  it('returns null for malformed JSON instead of throwing', () => {
    expect(parseCharacterContext('{not json')).toBeNull();
  });

  it('returns null when a required field is missing', () => {
    expect(parseCharacterContext(JSON.stringify({ level: 50, job: 'knight' }))).toBeNull();
  });

  it('returns null for an unknown job rather than trusting it', () => {
    expect(parseCharacterContext(JSON.stringify({ ...VALID, job: 'summoner' }))).toBeNull();
  });

  it('returns null when a numeric field arrives as a string', () => {
    expect(parseCharacterContext(JSON.stringify({ ...VALID, level: '50' }))).toBeNull();
  });

  it('rejects a non-positive level', () => {
    expect(parseCharacterContext(JSON.stringify({ ...VALID, level: 0 }))).toBeNull();
  });

  it('rejects a JSON array, which parses but is not a context', () => {
    expect(parseCharacterContext('[]')).toBeNull();
  });
});

describe('readCharacterContext', () => {
  it('reads a stored context', () => {
    const storage = fakeStorage({ [CHARACTER_STORAGE_KEY]: JSON.stringify(VALID) });
    expect(readCharacterContext(storage)).toEqual(VALID);
  });

  it('returns null when nothing is stored', () => {
    expect(readCharacterContext(fakeStorage())).toBeNull();
  });

  it('returns null when storage is unavailable', () => {
    expect(readCharacterContext(null)).toBeNull();
  });

  it('returns null instead of throwing when storage access is blocked', () => {
    expect(readCharacterContext(throwingStorage())).toBeNull();
  });
});

describe('writeCharacterContext', () => {
  it('writes and reports success', () => {
    const storage = fakeStorage();
    expect(writeCharacterContext(storage, VALID)).toBe(true);
    expect(readCharacterContext(storage)).toEqual(VALID);
  });

  it('reports failure instead of throwing when storage is blocked', () => {
    expect(writeCharacterContext(throwingStorage(), VALID)).toBe(false);
  });

  it('reports failure when storage is unavailable', () => {
    expect(writeCharacterContext(null, VALID)).toBe(false);
  });
});
```

- [ ] **Step 2: Run the tests and watch them fail**

Run: `npm test -- lib/character-context.test.ts`
Expected: FAIL — the module does not exist.

- [ ] **Step 3: Write the module**

Create `lib/character-context.ts`:

```ts
// The character context is the one place the site remembers who the player is.
// Every tool reads it, so no tool has to ask again -- the thing competing sites
// do not do (spec 3.15.2).
//
// No React and no browser globals in this file. Callers pass storage in, which
// is what lets these run under plain vitest with no DOM.

import { JOB_PROFILES, type JobKey } from './formulas';

export interface CharacterContext {
  level: number;
  job: JobKey;
  damagePerHit: number;
  attacksPerSecond: number;
}

export const CHARACTER_STORAGE_KEY = 'roz-calc:character';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function isPositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

// Validates rather than casts. A stored payload can be stale (written by an
// older build), hand-edited, or from a different app on the same origin --
// trusting its shape would put NaN and undefined into every calculation
// downstream.
export function parseCharacterContext(raw: string | null): CharacterContext | null {
  if (raw === null) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null;

  const { level, job, damagePerHit, attacksPerSecond } = parsed as Record<string, unknown>;

  if (!isPositiveNumber(level)) return null;
  if (!isPositiveNumber(damagePerHit)) return null;
  if (!isPositiveNumber(attacksPerSecond)) return null;
  if (typeof job !== 'string' || !(job in JOB_PROFILES)) return null;

  return { level, job: job as JobKey, damagePerHit, attacksPerSecond };
}

// Storage access itself throws in some browsers (Safari private mode, blocked
// site data), not just returns null. Reading must never take a page down.
export function readCharacterContext(storage: StorageLike | null): CharacterContext | null {
  if (!storage) return null;
  try {
    return parseCharacterContext(storage.getItem(CHARACTER_STORAGE_KEY));
  } catch {
    return null;
  }
}

// Returns whether the write actually landed, so the UI can say "this browser
// will not remember your settings" instead of silently forgetting them.
export function writeCharacterContext(storage: StorageLike | null, ctx: CharacterContext): boolean {
  if (!storage) return false;
  try {
    storage.setItem(CHARACTER_STORAGE_KEY, JSON.stringify(ctx));
    return true;
  } catch {
    return false;
  }
}
```

- [ ] **Step 4: Run the tests and watch them pass**

Run: `npm test -- lib/character-context.test.ts`
Expected: PASS, all cases.

- [ ] **Step 5: Prove the validation tests can fail**

Temporarily replace the body of `parseCharacterContext` after the `JSON.parse` with `return parsed as CharacterContext;`. Run `npm test -- lib/character-context.test.ts` and confirm the malformed-field cases now fail. Restore the real body and confirm green. Do not commit the broken version.

- [ ] **Step 6: Write the React binding**

Create `components/CharacterContextProvider.tsx`:

```tsx
'use client';

// Thin client-side binding over lib/character-context. Kept separate from the
// pure module so the logic stays testable without a DOM, and so only the small
// subtree that needs the character becomes a client component -- route files
// stay server components and keep their SEO (spec 4).

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  readCharacterContext,
  writeCharacterContext,
  type CharacterContext,
} from '@/lib/character-context';

interface CharacterContextValue {
  character: CharacterContext | null;
  setCharacter: (next: CharacterContext) => void;
  // False until the first client-side read completes. Server render and first
  // client render must produce identical markup or React logs a hydration
  // mismatch, so consumers render the no-character branch until this is true.
  ready: boolean;
  // False when this browser refuses to persist. The UI says so rather than
  // silently forgetting what the player typed.
  persisted: boolean;
}

const Ctx = createContext<CharacterContextValue>({
  character: null,
  setCharacter: () => {},
  ready: false,
  persisted: true,
});

function browserStorage() {
  // Touching window.localStorage can itself throw, so this is guarded too.
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function CharacterContextProvider({ children }: { children: ReactNode }) {
  const [character, setCharacterState] = useState<CharacterContext | null>(null);
  const [ready, setReady] = useState(false);
  const [persisted, setPersisted] = useState(true);

  useEffect(() => {
    setCharacterState(readCharacterContext(browserStorage()));
    setReady(true);
  }, []);

  function setCharacter(next: CharacterContext) {
    setCharacterState(next);
    setPersisted(writeCharacterContext(browserStorage(), next));
  }

  return <Ctx.Provider value={{ character, setCharacter, ready, persisted }}>{children}</Ctx.Provider>;
}

export function useCharacterContext(): CharacterContextValue {
  return useContext(Ctx);
}
```

- [ ] **Step 7: Confirm it type-checks and builds**

Run: `npx tsc --noEmit`
Expected: no errors. If `.next/types` reports stale route errors, run `rm -rf .next` first — that is a known false alarm in this project.

- [ ] **Step 8: Run the whole suite**

Run: `npm test`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add lib/character-context.ts lib/character-context.test.ts components/CharacterContextProvider.tsx
git commit -m "feat: add shared character context with storage-failure handling"
```

---

### Task 5: Aggro tier library and badge

Spec §3.15.1. The badge answers "will this monster walk over and kill my bot" everywhere a monster appears. The number of levels it shows depends on whether we know the player: without a character context, "strong" and "weak" have nothing to be measured against, and grading anyway would be inventing an answer.

**Files:**
- Create: `lib/aggro-tier.ts`
- Create: `lib/aggro-tier.test.ts`
- Create: `components/AggroBadge.tsx`
- Modify: `app/globals.css` (status tokens and badge styles)

**Interfaces:**
- Consumes: `CharacterContext` from Task 4; `maxHp(baseLevel, vit, job)` and `JOB_PROFILES` from `lib/formulas.ts`.
- Produces:
  - `export type AggroLevel = 'safe' | 'aggressive' | 'caution' | 'danger'`
  - `export const DANGER_ATK_RATIO = 0.2`
  - `export function aggroLevel(monster: { is_aggressive: boolean | null; atk_max: number | null }, playerMaxHp: number | null): AggroLevel`
  - `export function playerMaxHpFromContext(ctx: CharacterContext | null, vit: number): number | null`
  - `export const AGGRO_LABELS: Record<AggroLevel, string>`
  - `<AggroBadge level={...} />` from `components/AggroBadge.tsx`

- [ ] **Step 1: Write the failing tests**

Create `lib/aggro-tier.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { aggroLevel, playerMaxHpFromContext, DANGER_ATK_RATIO, AGGRO_LABELS } from './aggro-tier';
import type { CharacterContext } from './character-context';

const PLAYER_HP = 1000;

describe('aggroLevel', () => {
  it('is safe when the monster does not attack first, regardless of its ATK', () => {
    expect(aggroLevel({ is_aggressive: false, atk_max: 9999 }, PLAYER_HP)).toBe('safe');
  });

  it('treats a null aggression flag as safe, matching the column default', () => {
    expect(aggroLevel({ is_aggressive: null, atk_max: 100 }, PLAYER_HP)).toBe('safe');
  });

  it('reports the ungraded level when the player is unknown', () => {
    expect(aggroLevel({ is_aggressive: true, atk_max: 100 }, null)).toBe('aggressive');
  });

  it('reports the ungraded level when the monster ATK is unknown', () => {
    expect(aggroLevel({ is_aggressive: true, atk_max: null }, PLAYER_HP)).toBe('aggressive');
  });

  it('is caution when one hit takes less than the danger share of player HP', () => {
    expect(aggroLevel({ is_aggressive: true, atk_max: 150 }, PLAYER_HP)).toBe('caution');
  });

  it('is danger at exactly the threshold, not one point past it', () => {
    expect(aggroLevel({ is_aggressive: true, atk_max: PLAYER_HP * DANGER_ATK_RATIO }, PLAYER_HP)).toBe('danger');
  });

  it('is danger when one hit takes more than the danger share', () => {
    expect(aggroLevel({ is_aggressive: true, atk_max: 500 }, PLAYER_HP)).toBe('danger');
  });

  it('reports the ungraded level when player HP is zero, never dividing by it', () => {
    expect(aggroLevel({ is_aggressive: true, atk_max: 100 }, 0)).toBe('aggressive');
  });
});

describe('playerMaxHpFromContext', () => {
  it('returns null with no character, so callers get the two-level badge', () => {
    expect(playerMaxHpFromContext(null, 20)).toBeNull();
  });

  it('returns a positive HP for a real character', () => {
    const ctx: CharacterContext = { level: 50, job: 'knight', damagePerHit: 250, attacksPerSecond: 2.5 };
    const hp = playerMaxHpFromContext(ctx, 20);
    expect(hp).not.toBeNull();
    expect(hp!).toBeGreaterThan(0);
  });
});

describe('AGGRO_LABELS', () => {
  it('has a Thai label for every level, so no badge is colour-only', () => {
    for (const level of ['safe', 'aggressive', 'caution', 'danger'] as const) {
      expect(AGGRO_LABELS[level].length).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 2: Run the tests and watch them fail**

Run: `npm test -- lib/aggro-tier.test.ts`
Expected: FAIL — the module does not exist.

- [ ] **Step 3: Write the module**

Create `lib/aggro-tier.ts`:

```ts
// Whether a monster will attack on sight, and how badly that hurts THIS player.
//
// The game ships a free unlimited auto-hunt bot, so dying while away is the
// failure players care about, and no competing site surfaces this field at all
// (spec 3.15.1). It appears on every surface a monster appears on.

import { maxHp } from './formulas';
import type { CharacterContext } from './character-context';

export type AggroLevel = 'safe' | 'aggressive' | 'caution' | 'danger';

// Our own threshold, not a game value: a hit costing at least this share of max
// HP is called dangerous. The UI must say so, so a player can disagree with it.
export const DANGER_ATK_RATIO = 0.2;

export const AGGRO_LABELS: Record<AggroLevel, string> = {
  safe: 'ปลอดภัย',
  aggressive: 'เข้าตีเอง',
  caution: 'ระวัง',
  danger: 'อันตราย',
};

// Two levels when the player is unknown, three when known. Grading "strong" and
// "weak" without a player to measure against would be inventing an answer,
// which is worse than showing less (spec 3.15.1).
export function aggroLevel(
  monster: { is_aggressive: boolean | null; atk_max: number | null },
  playerMaxHp: number | null,
): AggroLevel {
  if (!monster.is_aggressive) return 'safe';
  if (monster.atk_max === null) return 'aggressive';
  if (playerMaxHp === null || playerMaxHp <= 0) return 'aggressive';
  return monster.atk_max >= playerMaxHp * DANGER_ATK_RATIO ? 'danger' : 'caution';
}

// VIT is passed in rather than stored on the context: the character form asks
// for level, job, damage, and attack speed -- four numbers a player can read off
// their own screen -- and asking for VIT too would make it five for one badge.
// Callers pass a representative VIT; the graded levels move with it.
export function playerMaxHpFromContext(ctx: CharacterContext | null, vit: number): number | null {
  if (!ctx) return null;
  return maxHp(ctx.level, vit, ctx.job);
}
```

- [ ] **Step 4: Run the tests and watch them pass**

Run: `npm test -- lib/aggro-tier.test.ts`
Expected: PASS, all cases.

- [ ] **Step 5: Prove the two-level rule can fail**

Temporarily change the line `if (playerMaxHp === null || playerMaxHp <= 0) return 'aggressive';` to `if (playerMaxHp === null) playerMaxHp = 1000;`. Run `npm test -- lib/aggro-tier.test.ts` and confirm the unknown-player and zero-HP cases now fail. Restore the real line and confirm green. Do not commit the broken version.

- [ ] **Step 6: Add the status tokens and badge styles**

Append to `app/globals.css`:

```css
/* Status colours for the aggro badge. These are state colours, not new design
   accents -- do not use them decoratively anywhere else. --yellow is reused
   from the existing palette so the badge stays inside the Neon Arcade set. */
:root {
  --status-safe: #3DFFA6;
  --status-safe-ink: #002415;
  --status-danger: #FF5A5A;
  --status-danger-ink: #2A0000;
}

.aggro {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 999px;
  font: 600 12px/1.6 "Sarabun", sans-serif;
  white-space: nowrap;
}

/* Every variant carries a glyph as well as a colour: colour alone would make
   the site's clearest differentiator unreadable to a colour-blind player. */
.aggro__glyph { font-size: 11px; }

.aggro--safe { background: var(--status-safe); color: var(--status-safe-ink); }
.aggro--aggressive { background: var(--yellow); color: var(--yellow-ink); }
.aggro--caution { background: var(--yellow); color: var(--yellow-ink); }
.aggro--danger { background: var(--status-danger); color: var(--status-danger-ink); }
```

- [ ] **Step 7: Write the badge component**

Create `components/AggroBadge.tsx`:

```tsx
// components/AggroBadge.tsx
import { AGGRO_LABELS, type AggroLevel } from '@/lib/aggro-tier';

// Glyph plus text, never colour alone. This badge is the site's clearest
// differentiator; if it cannot be read, the advantage is gone.
const GLYPHS: Record<AggroLevel, string> = {
  safe: '✓',
  aggressive: '!',
  caution: '!',
  danger: '!!',
};

export default function AggroBadge({ level }: { level: AggroLevel }) {
  return (
    <span className={`aggro aggro--${level}`}>
      <span className="aggro__glyph" aria-hidden="true">
        {GLYPHS[level]}
      </span>
      {AGGRO_LABELS[level]}
    </span>
  );
}
```

- [ ] **Step 8: Confirm it type-checks**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 9: Run the whole suite**

Run: `npm test`
Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add lib/aggro-tier.ts lib/aggro-tier.test.ts components/AggroBadge.tsx app/globals.css
git commit -m "feat: add aggro tier library and badge component"
```

---

### Task 6: Kill rate library

Spec §3.15.3. Competing tools open by asking "how many kills per hour do you get" — a number a player who has not yet gone and stood somewhere cannot answer. We have every monster's HP, so we compute it instead.

The honesty constraint is part of the deliverable: this figure counts only time spent swinging. It excludes walking to monsters, waiting for respawns, and missing. The real number is always lower, the function must not pretend otherwise, and no fudge multiplier gets invented to paper over it.

**Files:**
- Create: `lib/kills-per-hour.ts`
- Create: `lib/kills-per-hour.test.ts`

**Interfaces:**
- Consumes: nothing (deliberately — it takes plain numbers so any caller can use it).
- Produces:
  - `export interface KillRateInput { monsterHp: number; damagePerHit: number; attacksPerSecond: number }`
  - `export interface KillRate { hitsToKill: number; secondsToKill: number; killsPerHour: number }`
  - `export function killRate(input: KillRateInput): KillRate | null`
  - `export function expPerHour(killsPerHour: number, expPerKill: number): number`
  - `export const KILL_RATE_DISCLAIMER: string`

- [ ] **Step 1: Write the failing tests**

Create `lib/kills-per-hour.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { killRate, expPerHour, KILL_RATE_DISCLAIMER } from './kills-per-hour';

describe('killRate', () => {
  it('computes a whole-number hit count, rounding a partial hit up', () => {
    // 250 HP at 100 damage is 2.5 hits, which is 3 swings, not 2.
    const r = killRate({ monsterHp: 250, damagePerHit: 100, attacksPerSecond: 2 });
    expect(r!.hitsToKill).toBe(3);
    expect(r!.secondsToKill).toBe(1.5);
    expect(r!.killsPerHour).toBe(2400);
  });

  it('needs one hit, not zero, when damage exceeds monster HP', () => {
    const r = killRate({ monsterHp: 50, damagePerHit: 9999, attacksPerSecond: 1 });
    expect(r!.hitsToKill).toBe(1);
    expect(r!.killsPerHour).toBe(3600);
  });

  it('needs one hit when damage exactly equals monster HP', () => {
    const r = killRate({ monsterHp: 100, damagePerHit: 100, attacksPerSecond: 1 });
    expect(r!.hitsToKill).toBe(1);
  });

  it('returns null for zero damage rather than dividing by zero', () => {
    expect(killRate({ monsterHp: 100, damagePerHit: 0, attacksPerSecond: 2 })).toBeNull();
  });

  it('returns null for negative damage', () => {
    expect(killRate({ monsterHp: 100, damagePerHit: -5, attacksPerSecond: 2 })).toBeNull();
  });

  it('returns null for zero attack speed rather than dividing by zero', () => {
    expect(killRate({ monsterHp: 100, damagePerHit: 50, attacksPerSecond: 0 })).toBeNull();
  });

  it('returns null when monster HP is zero, which is the unknown-HP marker', () => {
    // transformMonster stores 0 for monsters whose raw HP is "???" -- treating
    // that as a real HP of zero would report an infinite kill rate.
    expect(killRate({ monsterHp: 0, damagePerHit: 50, attacksPerSecond: 2 })).toBeNull();
  });

  it('returns null for a non-finite input instead of producing NaN', () => {
    expect(killRate({ monsterHp: 100, damagePerHit: Number.NaN, attacksPerSecond: 2 })).toBeNull();
  });
});

describe('expPerHour', () => {
  it('multiplies kills by experience per kill', () => {
    expect(expPerHour(2400, 50)).toBe(120000);
  });

  it('is zero when the monster gives no experience', () => {
    expect(expPerHour(2400, 0)).toBe(0);
  });

  it('stays in the expected range for a server-average monster', () => {
    // Spec 3.9: EXP/HP across the server averages about 0.6, so a 1,000 HP
    // monster gives roughly 600 EXP. At 100 damage and 2 attacks/sec that is
    // 10 hits, 5 seconds, 720 kills/hour, about 432,000 EXP/hour. An answer off
    // by an order of magnitude means the units are wrong somewhere.
    const r = killRate({ monsterHp: 1000, damagePerHit: 100, attacksPerSecond: 2 })!;
    const exp = expPerHour(r.killsPerHour, 600);
    expect(exp).toBeGreaterThan(100_000);
    expect(exp).toBeLessThan(1_000_000);
  });
});

describe('KILL_RATE_DISCLAIMER', () => {
  it('is non-empty, because the figure must never ship unlabelled', () => {
    expect(KILL_RATE_DISCLAIMER.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run the tests and watch them fail**

Run: `npm test -- lib/kills-per-hour.test.ts`
Expected: FAIL — the module does not exist.

- [ ] **Step 3: Write the module**

Create `lib/kills-per-hour.ts`:

```ts
// Kills per hour from monster HP and the player's own damage.
//
// Competing tools open by asking the player for this number, which a player who
// has not gone and stood somewhere cannot answer. We have every monster's HP,
// so we work it out instead (spec 3.15.3).

export interface KillRateInput {
  monsterHp: number;
  damagePerHit: number;
  attacksPerSecond: number;
}

export interface KillRate {
  hitsToKill: number;
  secondsToKill: number;
  killsPerHour: number;
}

// Must be shown wherever a kill rate or an EXP/hour figure appears. The number
// counts swinging time only -- no walking, no respawn waits, no misses -- so the
// real figure is always lower. No correction factor is applied: we have neither
// respawn rates nor monster density, and a plausible-looking 0.7 would be a
// guess dressed up as precision.
export const KILL_RATE_DISCLAIMER =
  'เพดานบน คิดเฉพาะเวลาที่ตีอยู่ ไม่รวมเวลาเดินหามอนและรอเกิดใหม่ ของจริงจะน้อยกว่านี้เสมอ';

function isUsable(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

export function killRate(input: KillRateInput): KillRate | null {
  const { monsterHp, damagePerHit, attacksPerSecond } = input;

  // monsterHp of 0 is the unknown-HP marker transformMonster writes when the
  // raw feed says "???" -- not a monster that dies to nothing.
  if (!isUsable(monsterHp) || !isUsable(damagePerHit) || !isUsable(attacksPerSecond)) {
    return null;
  }

  const hitsToKill = Math.ceil(monsterHp / damagePerHit);
  const secondsToKill = hitsToKill / attacksPerSecond;

  return {
    hitsToKill,
    secondsToKill,
    killsPerHour: 3600 / secondsToKill,
  };
}

export function expPerHour(killsPerHour: number, expPerKill: number): number {
  return killsPerHour * expPerKill;
}
```

- [ ] **Step 4: Run the tests and watch them pass**

Run: `npm test -- lib/kills-per-hour.test.ts`
Expected: PASS, all cases.

- [ ] **Step 5: Prove the rounding and guard tests can fail**

Temporarily change `Math.ceil` to `Math.floor`. Run `npm test -- lib/kills-per-hour.test.ts` and confirm the partial-hit and damage-exceeds-HP cases fail. Restore `Math.ceil`. Then temporarily change `!isUsable(monsterHp) ||` to `false ||` and confirm the zero-HP case fails. Restore it and confirm green. Do not commit either broken version.

- [ ] **Step 6: Run the whole suite**

Run: `npm test`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add lib/kills-per-hour.ts lib/kills-per-hour.test.ts
git commit -m "feat: add kill rate library with explicit combat-time-only scope"
```

---

### Task 7: Two-tier navigation with active highlighting

Spec §6.1 and §6.6. The nav grows from 4 links to 10 across Wave 2, so it becomes two rows: a fixed top row of sections, and a second row whose contents depend on which section the current route belongs to. Separately, `.topnav a.on` has existed in `globals.css` since v1 and was never applied — every page's nav has looked identical, so nobody could tell where they were.

The route-to-section mapping is a pure function so it can be tested without rendering anything.

**Files:**
- Create: `lib/nav-links.ts`
- Create: `lib/nav-links.test.ts`
- Create: `components/NavTabs.tsx`
- Modify: `components/Nav.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `export type NavSection = 'database' | 'tools' | null`
  - `export interface NavLink { href: string; label: string }`
  - `export const PRIMARY_LINKS: NavLink[]`
  - `export const SECTION_LINKS: Record<'database' | 'tools', NavLink[]>`
  - `export function sectionForPath(pathname: string): NavSection`
  - `export function isActiveLink(href: string, pathname: string): boolean`

Wave 2 pages are listed in `SECTION_LINKS` before they exist. That is intentional — the nav is built once here rather than edited on every Wave 2 task. Until a route exists its link 404s in local development, which is expected and is not a bug to chase.

- [ ] **Step 1: Write the failing tests**

Create `lib/nav-links.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { sectionForPath, isActiveLink, PRIMARY_LINKS, SECTION_LINKS } from './nav-links';

describe('sectionForPath', () => {
  it('puts database routes in the database section', () => {
    expect(sectionForPath('/database/monsters')).toBe('database');
    expect(sectionForPath('/database/items/501')).toBe('database');
  });

  it('puts tool routes in the tools section', () => {
    expect(sectionForPath('/tools/elements')).toBe('tools');
  });

  it('gives the home page no section, so no second row renders', () => {
    expect(sectionForPath('/')).toBeNull();
  });

  it('gives the drop finder no section', () => {
    expect(sectionForPath('/drop-finder')).toBeNull();
  });

  it('does not match a route that merely starts with the same letters', () => {
    expect(sectionForPath('/databases-of-doom')).toBeNull();
  });

  it('matches the bare section root as well as its children', () => {
    expect(sectionForPath('/database')).toBe('database');
  });

  it('ignores a trailing slash', () => {
    expect(sectionForPath('/database/')).toBe('database');
  });
});

describe('isActiveLink', () => {
  it('matches the home link only on the home page', () => {
    expect(isActiveLink('/', '/')).toBe(true);
    expect(isActiveLink('/', '/drop-finder')).toBe(false);
    expect(isActiveLink('/', '/database/monsters')).toBe(false);
  });

  it('matches a list link on its own detail pages', () => {
    expect(isActiveLink('/database/monsters', '/database/monsters/1002')).toBe(true);
  });

  it('does not match a sibling route', () => {
    expect(isActiveLink('/database/monsters', '/database/items')).toBe(false);
  });

  it('does not match a route sharing a name prefix', () => {
    expect(isActiveLink('/database/item', '/database/items')).toBe(false);
  });
});

describe('link tables', () => {
  it('keeps the two most-used pages in the top row, one click away', () => {
    expect(PRIMARY_LINKS.map((l) => l.href)).toContain('/');
    expect(PRIMARY_LINKS.map((l) => l.href)).toContain('/drop-finder');
  });

  it('lists the six database pages the spec names', () => {
    expect(SECTION_LINKS.database.map((l) => l.href)).toEqual([
      '/database/monsters',
      '/database/items',
      '/database/cards',
      '/database/equipment',
      '/database/skills',
      '/database/maps',
    ]);
  });

  it('gives every link a non-empty Thai label', () => {
    const all = [...PRIMARY_LINKS, ...SECTION_LINKS.database, ...SECTION_LINKS.tools];
    for (const link of all) expect(link.label.trim().length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run the tests and watch them fail**

Run: `npm test -- lib/nav-links.test.ts`
Expected: FAIL — the module does not exist.

- [ ] **Step 3: Write the module**

Create `lib/nav-links.ts`:

```ts
// Two-tier navigation (spec 6.1). Ten links do not fit one row on a phone, and
// the two pages people use most must stay one click away -- which rules out
// burying them in a dropdown.
//
// Pure data and pure functions: no React here, so the route mapping is testable
// without rendering.

export type NavSection = 'database' | 'tools' | null;

export interface NavLink {
  href: string;
  label: string;
}

export const PRIMARY_LINKS: NavLink[] = [
  { href: '/', label: 'หาจุดตี' },
  { href: '/drop-finder', label: 'ค้นของดรอป' },
  { href: '/database/monsters', label: 'ฐานข้อมูล' },
  { href: '/tools/elements', label: 'เครื่องมือ' },
];

// Some of these routes arrive in Wave 2. Listing them now means the nav is
// built once instead of edited on every later task.
export const SECTION_LINKS: Record<'database' | 'tools', NavLink[]> = {
  database: [
    { href: '/database/monsters', label: 'มอนสเตอร์' },
    { href: '/database/items', label: 'ไอเทม' },
    { href: '/database/cards', label: 'การ์ด' },
    { href: '/database/equipment', label: 'อุปกรณ์' },
    { href: '/database/skills', label: 'สกิล' },
    { href: '/database/maps', label: 'แมพ' },
  ],
  tools: [
    { href: '/tools/elements', label: 'ตารางธาตุ' },
    { href: '/tools/farm-planner', label: 'แผนฟาร์ม' },
    { href: '/tools/afk-finder', label: 'หาจุด AFK' },
  ],
};

// Trailing slash stripped first so "/database/" and "/database" agree. The
// boundary check keeps "/databases-of-doom" out of the database section.
function normalise(pathname: string): string {
  return pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
}

function isUnder(pathname: string, prefix: string): boolean {
  const path = normalise(pathname);
  return path === prefix || path.startsWith(`${prefix}/`);
}

export function sectionForPath(pathname: string): NavSection {
  if (isUnder(pathname, '/database')) return 'database';
  if (isUnder(pathname, '/tools')) return 'tools';
  return null;
}

// A list link stays highlighted on its own detail pages, so a player reading a
// monster page still sees which section they are in. The home link is exact-
// match only, or it would light up on every page in the site.
export function isActiveLink(href: string, pathname: string): boolean {
  if (href === '/') return normalise(pathname) === '/';
  return isUnder(pathname, href);
}
```

- [ ] **Step 4: Run the tests and watch them pass**

Run: `npm test -- lib/nav-links.test.ts`
Expected: PASS, all cases.

- [ ] **Step 5: Prove the prefix-boundary test can fail**

Temporarily change `isUnder` to `return normalise(pathname).startsWith(prefix);`. Run `npm test -- lib/nav-links.test.ts` and confirm the "databases-of-doom" and "/database/item" cases fail. Restore the real body and confirm green. Do not commit the broken version.

- [ ] **Step 6: Write the client tab component**

Create `components/NavTabs.tsx`:

```tsx
'use client';

// The only client component in the nav. usePathname requires it, and the active
// highlight is the whole reason this file exists: .topnav a.on has been in
// globals.css since v1 and was never applied, so every page's nav looked
// identical and nobody could tell where they were (spec 6.6).

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PRIMARY_LINKS, SECTION_LINKS, sectionForPath, isActiveLink } from '@/lib/nav-links';

export default function NavTabs() {
  const pathname = usePathname() ?? '/';
  const section = sectionForPath(pathname);
  const secondRow = section ? SECTION_LINKS[section] : null;

  return (
    <>
      <nav className="topnav" aria-label="เมนูหลัก">
        {PRIMARY_LINKS.map((link) => {
          const active = isActiveLink(link.href, pathname);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={active ? 'on' : undefined}
              aria-current={active ? 'page' : undefined}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      {secondRow && (
        <nav className="subnav" aria-label="เมนูย่อย">
          {secondRow.map((link) => {
            const active = isActiveLink(link.href, pathname);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={active ? 'on' : undefined}
                aria-current={active ? 'page' : undefined}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      )}
    </>
  );
}
```

- [ ] **Step 7: Rewrite the nav shell**

Replace the whole contents of `components/Nav.tsx` with:

```tsx
// components/Nav.tsx
//
// Server component wrapper. Only NavTabs is a client component -- it needs
// usePathname -- so the shell, the brand mark, and the search box stay on the
// server (spec 4).

import GlobalSearch from './GlobalSearch';
import NavTabs from './NavTabs';

export default function Nav() {
  return (
    <div className="topbar">
      <div className="topbar__in">
        <span className="brand__mark">ZERO<em>CALC</em></span>
        <NavTabs />
        <GlobalSearch />
      </div>
    </div>
  );
}
```

- [ ] **Step 8: Lay out the two rows**

The existing `.topbar__in` is a single-row flex container; the second nav row needs its own line. Append to `app/globals.css`:

```css
/* Two-tier nav (spec 6.1). The shell wraps so the second row lands on its own
   line; the search box keeps its place on the first line by not being allowed
   to wrap ahead of it. */
.topbar__in { flex-wrap: wrap; }

.subnav {
  display: flex;
  gap: 4px;
  flex-basis: 100%;
  overflow-x: auto;
  padding-top: 6px;
  border-top: 1px solid var(--hair);
}

.subnav a {
  padding: 5px 9px;
  border-radius: 6px;
  font: 500 13px/1.6 "Sarabun", sans-serif;
  color: var(--dim);
  text-decoration: none;
  white-space: nowrap;
}

.subnav a:hover { color: var(--text); background: var(--panel-2); }
.subnav a.on { color: var(--yellow); background: var(--panel-2); }

/* On a phone the top row collapses to the two most-used pages plus search; the
   section links stay reachable through the second row, which scrolls. */
@media (max-width: 640px) {
  .topnav { font-size: 13px; }
  .subnav { padding-top: 4px; }
}
```

- [ ] **Step 9: Confirm it type-checks and builds**

Run: `npx tsc --noEmit && npm run build`
Expected: both succeed. If `.next/types` reports stale errors, run `rm -rf .next` and retry.

- [ ] **Step 10: Check it by eye in a browser**

Run `npm run dev` and visit, in order: `/`, `/drop-finder`, `/database/monsters`, `/database/monsters/1002`.
Expected: on `/` and `/drop-finder` there is no second row and the correct top link is highlighted. On both database pages the second row appears, and on the detail page "มอนสเตอร์" is still highlighted. Then narrow the window to 360px and confirm the second row scrolls sideways rather than overflowing the page.

- [ ] **Step 11: Run the whole suite**

Run: `npm test`
Expected: PASS.

- [ ] **Step 12: Commit**

```bash
git add lib/nav-links.ts lib/nav-links.test.ts components/NavTabs.tsx components/Nav.tsx app/globals.css
git commit -m "feat: two-tier nav with active page highlighting"
```

---

### Task 8: Table styling and mobile card rows

Spec §6.4. `app/globals.css` is 60 lines and contains no table rules at all — every table renders at browser defaults. On a 340px screen the current Farming Finder table pushes EXP/HP, the column the entire page exists to show, off-screen; a player has to scroll sideways to reach it, and most will not.

The fix is CSS only. The same HTML table becomes stacked card rows below the breakpoint, driven by a `data-label` attribute on each cell. No second component, no duplicate render.

**Files:**
- Modify: `app/globals.css`
- Modify: `components/FarmingTable.tsx` (add `data-label` to cells)
- Modify: `app/database/monsters/page.tsx` (add `data-label` to cells)
- Modify: `app/database/items/page.tsx` (add `data-label` to cells)

**Interfaces:**
- Consumes: nothing.
- Produces: the `.data-table` class and its responsive behaviour. Every Wave 2 list page uses `<table className="data-table">` with a `data-label` on each `<td>`.

- [ ] **Step 1: Confirm the problem exists before fixing it**

Run `npm run dev`, open `/` in a browser, and narrow the window to 340px. Note which columns are reachable without scrolling sideways. Expected: EXP/HP is not among them. Record what you saw — Step 7 checks the same view again.

- [ ] **Step 2: Add the table styles**

Append to `app/globals.css`:

```css
/* Shared list-table styling. Every list page uses .data-table so one rule set
   covers all six of them (spec 6.4). */
.data-table {
  width: 100%;
  border-collapse: collapse;
  font: 400 14px/1.6 "Sarabun", sans-serif;
}

.data-table th {
  text-align: left;
  padding: 8px 10px;
  border-bottom: 1px solid var(--hair);
  color: var(--faint);
  font: 600 12px/1.6 "Sarabun", sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.data-table td {
  padding: 9px 10px;
  border-bottom: 1px solid var(--hair);
  vertical-align: middle;
}

.data-table tbody tr:hover { background: var(--panel-2); }
.data-table td.num { text-align: right; font-family: "IBM Plex Mono", ui-monospace, monospace; font-variant-numeric: tabular-nums; }
.data-table th.num { text-align: right; }

/* Below 720px the table becomes stacked cards. The measured failure: at 340px
   the Farming Finder's fourth column, EXP/HP, sits off-screen -- and that value
   is the entire point of the page. Most visitors play on a phone, so this is
   the majority case, not an edge case.
   Same HTML, different display. Each cell carries its own label via data-label,
   so nothing is hidden and nothing is rendered twice. */
@media (max-width: 720px) {
  .data-table thead { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
  .data-table, .data-table tbody, .data-table tr, .data-table td { display: block; width: 100%; }

  .data-table tr {
    border: 1px solid var(--hair);
    border-radius: var(--radius);
    background: var(--panel-2);
    padding: 10px 12px;
    margin-bottom: 10px;
  }

  .data-table td {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    border: 0;
    padding: 3px 0;
  }

  .data-table td::before {
    content: attr(data-label);
    color: var(--faint);
    font: 600 12px/1.6 "Sarabun", sans-serif;
    white-space: nowrap;
  }

  /* The name cell is the card's heading: full width, no label, no alignment. */
  .data-table td[data-label=""] { display: block; padding-bottom: 6px; }
  .data-table td[data-label=""]::before { content: none; }

  .data-table td.num { text-align: right; }
}
```

- [ ] **Step 3: Apply the class and labels to the monster list**

In `app/database/monsters/page.tsx`, change `<table>` to `<table className="data-table">`.

Then change each header cell from the inline-styled form to the class form:

```tsx
            <tr>
              <th>ชื่อ</th>
              <th className="num">Lv</th>
              <th>เผ่า</th>
              <th>ธาตุ</th>
            </tr>
```

And give each body cell its label — the name cell gets an empty label so it becomes the card heading:

```tsx
              <tr key={m.id}>
                <td data-label="">
                  <Link href={`/database/monsters/${m.id}`} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {m.image_url && (
                      <img src={m.image_url} alt="" width={24} height={24} style={{ imageRendering: 'pixelated' }} />
                    )}
                    {m.name_en}
                  </Link>
                </td>
                <td data-label="Lv" className="num">{m.level}</td>
                <td data-label="เผ่า">{m.race ?? '—'}</td>
                <td data-label="ธาตุ">{m.element ?? '—'}</td>
              </tr>
```

Note the `?? '—'` on race and element: both columns are nullable, and an empty cell in a stacked card row reads as a rendering bug.

- [ ] **Step 4: Apply the same rules to the items list**

Read `app/database/items/page.tsx` first — its column set is not known to this plan, so the rules below are applied to whatever columns it has. There are exactly four:

1. `<table>` becomes `<table className="data-table">`.
2. Every `<th>` loses its inline `style` attribute. A header over numbers additionally gets `className="num"`.
3. Every `<td>` gains `data-label="<the text of its own column header>"`. The one exception is the cell holding the item name and icon: it gets `data-label=""`, which makes it the card heading.
4. Every `<td>` holding a number loses `style={{ textAlign: 'right' }}` and gains `className="num"` — same alignment, plus tabular figures.

Any cell whose column is nullable renders `?? '—'`. An empty cell reads as a bug once it is a labelled row in a stacked card.

- [ ] **Step 5: Apply the same rules to the farming table**

Read `components/FarmingTable.tsx` and apply the same four rules. Two specifics for this file:

- The **EXP/HP cell is the one that was falling off-screen** and is the reason this task exists. It gets `data-label="EXP/HP"` and `className="num"`.
- The monster name cell gets `data-label=""`.

After editing, confirm no `<td>` in the file is missing a `data-label` — an unlabelled cell renders in the stacked layout as a bare value with no indication of what it is.

- [ ] **Step 6: Confirm it type-checks and builds**

Run: `npx tsc --noEmit && npm run build`
Expected: both succeed.

- [ ] **Step 7: Check the desktop view is unchanged**

Run `npm run dev` and open `/`, `/database/monsters`, and `/database/items` at full window width.
Expected: still tables, now with visible header rules, row hover, and right-aligned monospace numbers. Nothing has become a card.

- [ ] **Step 8: Check the same 340px view from Step 1**

Narrow the window to 340px on `/`.
Expected: rows are now stacked cards, every value carries its own label, and EXP/HP is visible without any sideways scrolling. Confirm the page body itself does not scroll sideways at all.

- [ ] **Step 9: Run the whole suite**

Run: `npm test`
Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add app/globals.css app/database/monsters/page.tsx app/database/items/page.tsx components/FarmingTable.tsx
git commit -m "feat: shared table styling with mobile card rows"
```

---

### Task 9: Baseline SEO

Spec §3.13. Every page currently shares one title, `ROZ Calc`, set once in `app/layout.tsx`. There is no description anywhere, no OG image, and no sitemap. Across Wave 2 the site reaches roughly 3,500 pages, all of which would tell Google the same thing — and a link shared into a game chat would show no image and no summary, which works directly against the one distribution channel this project has.

Wave 1 ships one static OG image for the whole site. Per-page generated images are explicitly deferred: on another project on this same VPS, concurrent OG generation exhausted a 2 GB box and a `sharp` fallback to WASM produced 65 covers with no text on them and no error anywhere. Neither failure is worth risking here for a Wave 1 nicety.

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/page.tsx`
- Modify: `app/drop-finder/page.tsx`
- Modify: `app/database/monsters/page.tsx`
- Modify: `app/database/items/page.tsx`
- Modify: `app/database/monsters/[id]/page.tsx`
- Modify: `app/database/items/[id]/page.tsx`
- Create: `app/sitemap.ts`
- Create: `public/og-default.png` (produced in Step 1)

**Interfaces:**
- Consumes: `supabaseBrowser()` from `lib/supabase.ts`.
- Produces: the `SITE_URL` constant pattern and the `metadataBase` setup that Wave 2 pages copy.

- [ ] **Step 1: [CONTROLLER] Produce the OG image**

Create `public/og-default.png` at exactly 1200×630, per spec §3.13:
- Neon Arcade ground (`#0B0820`) with cyan and yellow glow in opposite corners
- `ZERO CALC` set large and centred
- The line `ฐานข้อมูลและเครื่องมือ Ragnarok Zero Global ภาษาไทย`
- A row of data counts: มอนสเตอร์ 524 · ไอเทม 1,300 · การ์ด 289 · สกิล 851 · แมพ 497

Then verify it is a real image with real text on it — open the file and look at it. Do not accept "the file exists" as the check; the failure being guarded against produced correctly-sized files that were visually blank.

- [ ] **Step 2: Put the site origin in its own module**

`SITE_URL` is needed by both `app/layout.tsx` and `app/sitemap.ts`. It must not live in the layout: importing from `app/layout.tsx` would drag `./globals.css` into the sitemap module graph.

Create `lib/site.ts`:

```ts
// The deployed origin. Needed in two places -- the OG image URL and the sitemap
// -- so it lives in its own module rather than being exported from a route file
// that also imports global CSS.
//
// NEXT_PUBLIC_SITE_URL is a build-time variable in Coolify. The fallback keeps
// local development working; it must not be what production ships.
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
```

- [ ] **Step 3: Set the metadata base and defaults**

In `app/layout.tsx`, replace the `metadata` line:

```ts
export const metadata = { title: 'ROZ Calc' };
```

with:

```ts
import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/site';

// metadataBase turns the relative OG path below into the absolute URL that
// crawlers and chat clients require -- a relative og:image is ignored.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'ROZ Calc — ฐานข้อมูลและเครื่องมือ Ragnarok Zero Global ภาษาไทย',
    // Every page that sets its own title gets the site name appended.
    template: '%s | ROZ Calc',
  },
  description:
    'ฐานข้อมูลมอนสเตอร์ ไอเทม และเครื่องมือหาจุดฟาร์มของ Ragnarok Zero Global ภาษาไทย คำนวณ EXP ต่อชั่วโมงและหาของดรอปได้ในที่เดียว',
  openGraph: {
    type: 'website',
    siteName: 'ROZ Calc',
    locale: 'th_TH',
    images: ['/og-default.png'],
  },
  twitter: { card: 'summary_large_image' },
};
```

Every page below inherits the OG image and the Twitter card, so none of them repeat those.

- [ ] **Step 4: Add `NEXT_PUBLIC_SITE_URL` to the example env file**

Append to `.env.local.example`:

```
# Absolute origin of the deployed site. Required at build time: it is what makes
# the OG image URL absolute, and a relative OG path is ignored by every crawler.
NEXT_PUBLIC_SITE_URL=https://example.com
```

- [ ] **Step 5: Give the four static pages their own titles**

In `app/page.tsx`, add near the top:

```ts
export const metadata = {
  title: 'หามอนสเตอร์คุ้มสุดสำหรับเลเวลของคุณ',
  description:
    'ใส่เลเวลแล้วดูว่ามอนสเตอร์ตัวไหนให้ EXP ต่อ HP สูงสุด เรียงอันดับให้อัตโนมัติจากมอนสเตอร์ทั้งหมดในเกม Ragnarok Zero Global',
};
```

In `app/drop-finder/page.tsx`:

```ts
export const metadata = {
  title: 'ค้นหาว่าของชิ้นนี้ดรอปจากมอนตัวไหน',
  description: 'พิมพ์ชื่อไอเทมแล้วดูว่ามอนสเตอร์ตัวไหนดรอป อัตราดรอปเท่าไร และเจอมอนตัวนั้นได้ที่แมพไหน',
};
```

In `app/database/monsters/page.tsx`:

```ts
export const metadata = {
  title: 'ฐานข้อมูลมอนสเตอร์',
  description: 'มอนสเตอร์ทั้งหมดในเกม Ragnarok Zero Global พร้อมเลเวล เผ่า ธาตุ ค่าสถานะ และของที่ดรอป',
};
```

In `app/database/items/page.tsx`:

```ts
export const metadata = {
  title: 'ฐานข้อมูลไอเทม',
  description: 'ไอเทมทั้งหมดในเกม Ragnarok Zero Global พร้อมค่าพลังโจมตี เลเวลที่ใช้ได้ อาชีพที่ใส่ได้ และมอนสเตอร์ที่ดรอป',
};
```

- [ ] **Step 6: Generate titles for monster detail pages from real data**

In `app/database/monsters/[id]/page.tsx`, add above the default export:

```ts
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const db = supabaseBrowser();
  const { data: monster } = await db
    .from('monsters')
    .select('name_en, level, element, hp, race')
    .eq('id', Number(params.id))
    .maybeSingle();

  if (!monster) return { title: 'ไม่พบมอนสเตอร์นี้' };

  // Every value here comes from the row. Nothing is filled in when the column is
  // null -- an invented element or HP would be a factual claim we cannot make.
  const parts = [`เลเวล ${monster.level}`];
  if (monster.element) parts.push(`ธาตุ${monster.element}`);
  if (monster.race) parts.push(`เผ่า${monster.race}`);
  if (monster.hp) parts.push(`HP ${monster.hp.toLocaleString('en-US')}`);

  return {
    title: `${monster.name_en} (Lv.${monster.level}) — ดรอป จุดเกิด ค่าสถานะ`,
    description: `${monster.name_en} ${parts.join(' ')} — ดูของที่ดรอป อัตราดรอป แมพที่เจอ และค่าสถานะครบใน ROZ Calc`,
  };
}
```

- [ ] **Step 7: Do the same for item detail pages**

In `app/database/items/[id]/page.tsx`, add above the default export:

```ts
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const db = supabaseBrowser();
  const { data: item } = await db
    .from('items')
    .select('name_en, category, atk, required_level')
    .eq('id', Number(params.id))
    .maybeSingle();

  if (!item) return { title: 'ไม่พบไอเทมนี้' };

  const parts: string[] = [];
  if (item.category) parts.push(item.category);
  if (item.atk !== null) parts.push(`ATK ${item.atk}`);
  if (item.required_level !== null) parts.push(`ใช้ได้ที่เลเวล ${item.required_level}`);

  return {
    title: `${item.name_en} — ดรอปจากมอนตัวไหน`,
    description: `${item.name_en}${parts.length ? ` ${parts.join(' ')}` : ''} — ดูว่าดรอปจากมอนสเตอร์ตัวไหน อัตราดรอปเท่าไร และราคาขายใน ROZ Calc`,
  };
}
```

- [ ] **Step 8: Generate the sitemap**

Create `app/sitemap.ts`:

```ts
import type { MetadataRoute } from 'next';
import { supabaseBrowser } from '@/lib/supabase';
import { SITE_URL } from '@/lib/site';

// Regenerated with the daily ISR window, same as the list pages.
export const revalidate = 86400;

const STATIC_PATHS = ['/', '/drop-finder', '/database/monsters', '/database/items'];

// Supabase caps a single select at 1,000 rows and does not say so when it
// truncates. items alone is ~1,300, so a plain select() would silently drop
// hundreds of URLs from the sitemap and nothing would look wrong.
const PAGE = 1000;

async function allIds(table: 'monsters' | 'items'): Promise<number[]> {
  const db = supabaseBrowser();
  const ids: number[] = [];

  for (let from = 0; ; from += PAGE) {
    const { data, error } = await db
      .from(table)
      .select('id')
      .order('id')
      .range(from, from + PAGE - 1);

    if (error) {
      console.error(`sitemap: ${table} query failed`, error);
      break;
    }
    if (!data || data.length === 0) break;

    ids.push(...data.map((row) => row.id));
    if (data.length < PAGE) break;
  }

  return ids;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [monsterIds, itemIds] = await Promise.all([allIds('monsters'), allIds('items')]);

  return [
    ...STATIC_PATHS.map((path) => ({ url: `${SITE_URL}${path}`, changeFrequency: 'weekly' as const, priority: 1 })),
    ...monsterIds.map((id) => ({ url: `${SITE_URL}/database/monsters/${id}`, changeFrequency: 'monthly' as const, priority: 0.7 })),
    ...itemIds.map((id) => ({ url: `${SITE_URL}/database/items/${id}`, changeFrequency: 'monthly' as const, priority: 0.6 })),
  ];
}
```

- [ ] **Step 9: Confirm it type-checks and builds**

Run: `npx tsc --noEmit && npm run build`
Expected: both succeed.

- [ ] **Step 10: Verify the sitemap is complete, not truncated**

Run `npm run dev`, then:

```bash
curl -s http://localhost:3000/sitemap.xml | grep -c "<url>"
```
Expected: roughly 524 + 1,300 + 4 ≈ 1,828. **A result near 1,004 means the paging loop is not working and the item list was cut at the 1,000-row cap** — that is the exact failure this step exists to catch.

- [ ] **Step 11: Verify the page metadata by eye**

With the dev server running, view source on `/database/monsters/1002` and confirm: the `<title>` names that monster and its level, the description contains its real HP and element, and `og:image` is an absolute URL ending in `/og-default.png`. Then open that OG URL in the browser and confirm the image has legible text on it.

- [ ] **Step 12: Run the whole suite**

Run: `npm test`
Expected: PASS.

- [ ] **Step 13: Commit**

```bash
git add app/layout.tsx app/page.tsx app/drop-finder/page.tsx app/database/monsters/page.tsx app/database/items/page.tsx "app/database/monsters/[id]/page.tsx" "app/database/items/[id]/page.tsx" app/sitemap.ts public/og-default.png .env.local.example
git commit -m "feat: per-page metadata, OG image, and paged sitemap"
```

- [ ] **Step 14: [CONTROLLER] Set the production origin**

Add `NEXT_PUBLIC_SITE_URL` as a **build-time** variable in Coolify (the API field name is `is_buildtime`, not `is_build_time` — the latter returns 422). Without it the deployed site emits `localhost:3000` in every OG tag and every sitemap URL.

---

## Wave 1 done criteria

All of these must be true before Wave 2 starts:

1. `npm test` passes and every new test has been shown to fail when its subject is broken.
2. `npm run build` succeeds.
3. `select count(*) from monsters where is_aggressive` returns ≈286; `monster_skills` is non-empty; `items.description` is non-null for ≈1,300 rows.
4. `ls public/images/skills | wc -l` is ≈851, no file under 512 bytes, and no row in `data/raw/skills.json` still points at `/assets/`.
5. At 340px the Farming Finder shows EXP/HP with no sideways scrolling.
6. The site loads and every page renders in a private window with site data blocked.
7. `curl -s <site>/sitemap.xml | grep -c "<url>"` is ≈1,828, not ≈1,004.
8. A link to a monster page pasted into a chat client shows the OG image with legible text.

## Not in Wave 1

Deferred by the spec, listed here so nobody adds them mid-wave: every new page route (§3.1–3.6, Wave 2), the AFK finder (§3.8), per-page generated OG images (§3.13), the Stat Calculator (§3.12), the DPS Calculator (§3.15), the refine simulator (§3.16 — cancelled outright, not deferred), the skill tree planner, and the affix scorer.
