# ROZ Calc v2 — Wave 2A (Database Pages) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the four missing database browse pages, rebuild the two detail pages around the data Wave 1 imported, and make the site's search cover everything it lists.

**Architecture:** Every page follows the pattern already in `app/database/monsters/page.tsx` — a server component that reads `searchParams`, queries Supabase, and pages with `.range()`, so filters are bookmarkable and the page works with JavaScript off. Any parsing or filtering rule with more than one branch moves into a `lib/` function with its own tests; page files stay thin. No new tables and no migrations — everything here reads columns Wave 1 already created.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Supabase (Postgres), Vitest. Test command `npm test`. Dev server `npm run dev` (it may pick a port other than 3000; use whichever it prints).

**Spec:** `docs/superpowers/specs/2026-08-26-roz-calc-v2-design.md` — read §3.1–3.4, §3.15.1, §6.3, §6.4, §6.5 before starting.

**Scope note:** Spec §3.17's Wave 2 lists ten items. This plan covers the four that are database pages (items 9, 10, 11, 17). The other six — homepage, element table, farm planner, AFK finder, kills/hour, drop-penalty warning — are tools and personalization and get their own plan (Wave 2B). This plan ships working software on its own.

## Global Constraints

- **Thai for every user-facing string.** Code, identifiers, and comments in English.
- **Never invent game values.** A missing value renders `—`, never `0`, `N/A`, or a guess. `hp = 0` and `base_exp = 0` are this database's unknown-value sentinels, written when the raw feed said `""` or `"???"` — they are not real zeros.
- **One migration only, and it adds a view — no table or column changes.** Task 3 adds `map_stats`. Everything else reads columns Wave 1 already created; if another task appears to need a new one, stop and report instead of adding it.
- **Supabase returns at most 1,000 rows per request and does not warn when it truncates.** Any query meant to cover a whole table must page with `.range()`.
- **`NULL` in SQL is not `false`.** `WHERE col NOT LIKE '...'` silently returns neither the matching nor the non-matching row when `col` is null.
- **Server components stay server components.** `'use client'` belongs only on a small leaf component that needs browser APIs, never on a route file — that would cost the per-page metadata Wave 1 added.
- **Design tokens only** — the CSS custom properties already in `app/globals.css`. No new colour values.
- **Every list page uses `<table className="data-table">`.** Every `<td>` carries a `data-label` holding its column's Thai header; the primary name cell carries `data-label=""`; numeric cells carry `className="num"`. This is what turns the table into readable cards on a phone. An unlabelled cell renders there as a bare value with nothing saying what it is.
- **A test must be proven capable of failing.** After a test goes green, break the logic it covers, confirm red, restore, and report which case went red.
- **Flipping the nav flag is part of the page's own task.** Wave 1 shipped `lib/nav-links.ts` with `ready: false` on every route that did not exist yet, rendering those as inert text. A page is not done until its flag is `true` and its link works.

---

## Data facts established before this plan was written

Probed against the live database on 26 Aug. Trust these over assumption.

| Fact | Value |
|---|---|
| `items.category` | `Other` 414, `Card` 289, `Armor` 181, `Weapon` 170, `Costume Equipment` 139, `Consumable / Recovery` 84, `Pet` 23 |
| Equipment total | 490 = Armor + Weapon + Costume Equipment |
| Maps | 497 distinct `map_code`, 3,032 spawn rows, **only 245 carry a `map_display_name`** |
| Skills | 851 rows; 433 carry a non-empty `classes`; 403 have `type`; 160 have `element` |
| Monsters | 524; `is_aggressive` 286; `base_exp = 0` on 202 (all sentinels); `str` null on 28 |
| `monster_skills` | 2,517 rows |

### Four traps in this data. Each becomes a wrong page if ignored.

**Trap 1 — card slot names are not normalised, and one is a typo.** The `Equipped on :` line yields ten distinct values: `Weapon` 76, `Accessory` 54, `Armor` 45, `Shield` 29, `Garment` 28, `Headgear` 22, `Shoes` 20, `Helmet` 9, `Footgear` 4, `c` 1. `Headgear`/`Helmet` and `Shoes`/`Footgear` are the same slot in game terms, and `c` is a typo in the upstream feed on `Ground Petite Card` (id 4118) — that row really reads `Equipped on : c`.

Do **not** merge the synonym pairs. That is an editorial claim about the game we have not verified for Zero, and merging hides the fact that the data disagrees with itself. Derive the filter list from the data so no value is hidden, and show each value's count so a player can see both spellings exist.

**Trap 2 — one card has a NULL description, and SQL will hide it from you.** 289 cards exist but only 288 match `description LIKE '%Equipped on%'`. The 289th is not missing the line; its `description` is null, and `NULL NOT LIKE '...'` evaluates to NULL rather than true, so a `NOT LIKE` query returns it in neither result set. Any card filter must handle a null description explicitly.

**Trap 3 — `equippable_classes` holds group values, not just job names.** Its commonest entries are `All Jobs` (166) and `All Jobs except Novice` (56), alongside real jobs like `Swordsman` (97). A filter matching the array against a job name alone would hide every item any job can wear — the majority of the useful results.

**Trap 4 — `items.weapon_type` is not only weapon types.** Its values include `Card` 288, `Costume` 106, `Headgear` 94, `Armor` 29, `Taming Item` 23, `Accessory` 22, `Dagger` 22, `Sword` 16. Label that column "ชนิด", never "ประเภทอาวุธ".

---

## File Structure

| File | Responsibility | Task |
|---|---|---|
| `lib/card-slot.ts` + `.test.ts` | Pull a card's equip slot out of its description text | 1 |
| `app/database/cards/page.tsx` | Cards browser | 1 |
| `lib/equip-filter.ts` + `.test.ts` | Decide whether an item is wearable by a chosen job | 2 |
| `app/database/equipment/page.tsx` | Equipment browser | 2 |
| `app/database/maps/page.tsx` | Map list | 3 |
| `app/database/maps/[code]/page.tsx` | One map's monsters | 3 |
| `lib/zero-jobs.ts` + `.test.ts` | Which jobs exist in Zero; split skills into in-game and not-yet-released | 4 |
| `app/database/skills/page.tsx` | Skills browser | 4 |
| `app/database/monsters/[id]/page.tsx` | Monster detail, rebuilt two-column | 5 |
| `app/database/items/[id]/page.tsx` | Item detail plus description and prices | 6 |
| `lib/search.ts` + `.test.ts` | Merge search hits across six sources | 7 |
| `components/GlobalSearch.tsx` | Query all six | 7 |
| `app/globals.css` | Styles the new pages need — append only | 1, 4, 5 |
| `lib/nav-links.ts` | Flip one `ready` flag per page shipped | 1–4 |

---

### Task 1: Cards browser

Spec §3.3. 289 cards sit buried in the general items list, and a card's entire value is its effect line — which Wave 1's `items.description` finally made available.

**Files:**
- Create: `lib/card-slot.ts`, `lib/card-slot.test.ts`, `app/database/cards/page.tsx`
- Modify: `lib/nav-links.ts`, `app/globals.css`

**Interfaces:**
- Consumes: `supabaseBrowser()` from `lib/supabase.ts`; `Pagination` from `components/Pagination.tsx` with props `{ page: number; totalPages: number; buildHref: (page: number) => string }`.
- Produces: `export function parseCardSlot(description: string | null): string | null`

- [ ] **Step 1: Write the failing test**

Create `lib/card-slot.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { parseCardSlot } from './card-slot';

describe('parseCardSlot', () => {
  it('reads the slot from the Equipped on line', () => {
    const d = 'ATK +20.\nType : Card\nEquipped on : Weapon\nWeight : 1';
    expect(parseCardSlot(d)).toBe('Weapon');
  });

  it('returns null for a null description rather than throwing', () => {
    expect(parseCardSlot(null)).toBeNull();
  });

  it('returns null when there is no Equipped on line', () => {
    expect(parseCardSlot('Type : Card\nWeight : 1')).toBeNull();
  });

  it('returns the malformed upstream value verbatim rather than guessing', () => {
    const d = 'Physical Damage to Dragon Monsters +20%.\nType : Card\nEquipped on : c\nWeight : 1';
    expect(parseCardSlot(d)).toBe('c');
  });

  it('does not merge Helmet into Headgear', () => {
    expect(parseCardSlot('Equipped on : Helmet')).toBe('Helmet');
    expect(parseCardSlot('Equipped on : Headgear')).toBe('Headgear');
  });

  it('trims whitespace and stops at the end of the line', () => {
    expect(parseCardSlot('Equipped on :   Shield  \nWeight : 1')).toBe('Shield');
  });

  it('returns null for an empty slot value instead of an empty string', () => {
    expect(parseCardSlot('Equipped on : \nWeight : 1')).toBeNull();
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npm test -- lib/card-slot.test.ts`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Write the module**

Create `lib/card-slot.ts`:

```ts
// A card's equip slot lives in its description text, on a line reading
// "Equipped on : X". There is no column for it, and the values are not
// normalised: Headgear and Helmet both occur, as do Shoes and Footgear, and
// one card carries a typo from upstream. This reports what the data says and
// nothing more -- normalising here would be inventing a game value.

const SLOT_LINE = /^\s*Equipped on\s*:\s*(.*)$/m;

export function parseCardSlot(description: string | null): string | null {
  if (!description) return null;
  const match = SLOT_LINE.exec(description);
  if (!match) return null;
  const slot = match[1].trim();
  return slot === '' ? null : slot;
}
```

- [ ] **Step 4: Run it and watch it pass**

Run: `npm test -- lib/card-slot.test.ts`
Expected: PASS, all seven.

- [ ] **Step 5: Prove the tests can fail**

Change the return to `return slot;`, dropping the empty-string guard; confirm the empty-slot case goes red; restore. Then change the capture group to `(\w)`; confirm the `Shield` case goes red because it captures one character; restore and confirm green. Commit neither broken version.

- [ ] **Step 6: Build the page**

Create `app/database/cards/page.tsx`:

```tsx
// app/database/cards/page.tsx
import Link from 'next/link';
import { supabaseBrowser } from '@/lib/supabase';
import Pagination from '@/components/Pagination';
import { parseCardSlot } from '@/lib/card-slot';

export const revalidate = 86400;

export const metadata = {
  title: 'ฐานข้อมูลการ์ด',
  description:
    'การ์ดทั้งหมดในเกม Ragnarok Zero Global พร้อมเอฟเฟกต์และช่องที่ใส่ได้ ค้นจากเอฟเฟกต์ได้ เช่นพิมพ์ LUK เพื่อหาการ์ดที่เพิ่ม LUK',
};

const PAGE_SIZE = 50;

// Type, Equipped on and Weight are structure, not effect. Repeating them in
// every row would bury the one line a player is actually scanning for.
const BOILERPLATE = /^(Type|Equipped on|Weight)\s*:/;

function cardEffect(description: string | null): string | null {
  if (!description) return null;
  const lines = description
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l !== '' && !BOILERPLATE.test(l));
  return lines.length > 0 ? lines.join(' ') : null;
}

export default async function CardsPage({
  searchParams,
}: {
  searchParams: { q?: string; slot?: string; page?: string };
}) {
  const q = searchParams.q ?? '';
  const slot = searchParams.slot ?? '';
  const page = Math.max(1, Number(searchParams.page ?? 1) || 1);

  const db = supabaseBrowser();

  // Slot lives inside description text, so it cannot be filtered in SQL. 289
  // rows is far under the 1,000-row cap, so the whole set is fetched once and
  // filtered in memory -- simpler and always correct, unlike a LIKE filter,
  // which would silently drop the row whose description is null.
  const { data: allCards, error } = await db
    .from('items')
    .select('id, name_en, icon_url, description')
    .eq('category', 'Card')
    .order('name_en');

  if (error) {
    console.error('cards query failed', error);
  }

  const cards = (allCards ?? []).map((c) => ({
    ...c,
    slot: parseCardSlot(c.description),
    effect: cardEffect(c.description),
  }));

  // The filter list is derived from the data rather than hardcoded, so a value
  // that exists is never hidden -- synonym pairs and the upstream typo alike.
  const slotCounts = new Map<string, number>();
  for (const c of cards) {
    if (c.slot) slotCounts.set(c.slot, (slotCounts.get(c.slot) ?? 0) + 1);
  }
  const slots = [...slotCounts.entries()].sort((a, b) => b[1] - a[1]);

  const needle = q.trim().toLowerCase();
  const filtered = cards.filter((c) => {
    if (slot && c.slot !== slot) return false;
    if (!needle) return true;
    // Searching effect text is the point: a player looks for "cards that add
    // LUK", not for a card whose name they already know.
    return (
      c.name_en.toLowerCase().includes(needle) ||
      (c.effect ?? '').toLowerCase().includes(needle)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function buildHref(targetPage: number) {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (slot) params.set('slot', slot);
    if (targetPage > 1) params.set('page', String(targetPage));
    const qs = params.toString();
    return `/database/cards${qs ? `?${qs}` : ''}`;
  }

  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <h1 style={{ fontFamily: '"Chakra Petch", sans-serif', fontSize: 32 }}>ฐานข้อมูลการ์ด</h1>
      <p style={{ color: 'var(--faint)', marginTop: 6 }}>
        {filtered.length} ใบ จากทั้งหมด {cards.length} ใบ
      </p>

      <form style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '20px 0' }}>
        <input className="mono" type="text" name="q" defaultValue={q} placeholder="ค้นชื่อการ์ดหรือเอฟเฟกต์ เช่น LUK" />
        <select name="slot" defaultValue={slot}>
          <option value="">ทุกช่อง</option>
          {slots.map(([s, n]) => (
            <option key={s} value={s}>
              {s} ({n})
            </option>
          ))}
        </select>
        <button type="submit">กรอง</button>
      </form>

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>ชื่อ</th>
              <th>ช่องที่ใส่</th>
              <th>เอฟเฟกต์</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id}>
                <td data-label="">
                  <Link href={`/database/items/${c.id}`} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {c.icon_url && (
                      <img src={c.icon_url} alt="" width={24} height={24} style={{ imageRendering: 'pixelated' }} />
                    )}
                    {c.name_en}
                  </Link>
                </td>
                <td data-label="ช่องที่ใส่">{c.slot ?? '—'}</td>
                <td data-label="เอฟเฟกต์" className="effect">{c.effect ?? '—'}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={3} data-label="" style={{ color: 'var(--faint)', padding: '16px 0' }}>
                  ไม่พบการ์ดที่ตรงเงื่อนไข
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={safePage} totalPages={totalPages} buildHref={buildHref} />
    </main>
  );
}
```

- [ ] **Step 7: Add the effect-column style**

Append to `app/globals.css`:

```css
/* Card effects are one line in most rows but a few run long. Cap the column on
   desktop so one verbose card cannot stretch every other row; the stacked
   mobile layout has no columns to distort, so it wraps freely there. */
.data-table td.effect { max-width: 520px; color: var(--dim); }

@media (max-width: 720px) {
  .data-table td.effect { max-width: none; }
}
```

- [ ] **Step 8: Turn the nav link on**

In `lib/nav-links.ts`, change the `/database/cards` entry's `ready` from `false` to `true`. Change nothing else in that file.

- [ ] **Step 9: Check it in a browser**

Run `npm run dev` and open `/database/cards`. Confirm and report each:
- 289 cards total.
- The slot dropdown lists counts and shows **both** `Headgear` and `Helmet`, and `Shoes` and `Footgear`.
- Filtering by slot `c` finds exactly `Ground Petite Card`.
- Searching `LUK` matches on effect text, not only names.
- **The card whose `description` is null renders with `—` in both the slot and effect columns rather than vanishing.** Find it by searching the page source for a row with two em-dashes, or by paging to the end. If you cannot locate it, say so rather than claiming it works.
- At 340px each row is a labelled card with the effect visible.
- The nav's "การ์ด" link is now clickable.

- [ ] **Step 10: Run the suite and commit**

Run: `npm test && npx tsc --noEmit`

```bash
git add lib/card-slot.ts lib/card-slot.test.ts app/database/cards/page.tsx app/globals.css lib/nav-links.ts
git commit -m "feat: add cards browser with effect search"
```

---

### Task 2: Equipment browser

Spec §3.4. 490 wearable items are mixed into the general items list, so finding what a job can actually wear is impractical.

**Files:**
- Create: `lib/equip-filter.ts`, `lib/equip-filter.test.ts`, `app/database/equipment/page.tsx`
- Modify: `lib/nav-links.ts`

**Interfaces:**
- Consumes: `supabaseBrowser()`; `Pagination`.
- Produces:
  - `export const EQUIPMENT_CATEGORIES: readonly string[]` — exactly `['Armor', 'Weapon', 'Costume Equipment']`
  - `export function canJobEquip(equippableClasses: string[] | null, job: string): boolean`

- [ ] **Step 1: Write the failing test**

Create `lib/equip-filter.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { canJobEquip, EQUIPMENT_CATEGORIES } from './equip-filter';

describe('canJobEquip', () => {
  it('matches an exact job name', () => {
    expect(canJobEquip(['Swordsman', 'Knight'], 'Swordsman')).toBe(true);
  });

  it('includes items marked All Jobs', () => {
    // 166 items carry this. Matching job names alone would hide every item
    // that any job can wear -- most of the useful results.
    expect(canJobEquip(['All Jobs'], 'Wizard')).toBe(true);
  });

  it('includes All Jobs except Novice for a non-Novice job', () => {
    expect(canJobEquip(['All Jobs except Novice'], 'Knight')).toBe(true);
  });

  it('excludes All Jobs except Novice for Novice itself', () => {
    expect(canJobEquip(['All Jobs except Novice'], 'Novice')).toBe(false);
  });

  it('does not match an unrelated job', () => {
    expect(canJobEquip(['Swordsman'], 'Mage')).toBe(false);
  });

  it('returns false for a null class list rather than throwing', () => {
    expect(canJobEquip(null, 'Knight')).toBe(false);
  });

  it('returns false for an empty class list', () => {
    expect(canJobEquip([], 'Knight')).toBe(false);
  });

  it('is case-insensitive on the job name', () => {
    expect(canJobEquip(['Swordsman'], 'swordsman')).toBe(true);
  });
});

describe('EQUIPMENT_CATEGORIES', () => {
  it('is exactly the three categories that make up the 490 wearable items', () => {
    expect([...EQUIPMENT_CATEGORIES]).toEqual(['Armor', 'Weapon', 'Costume Equipment']);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npm test -- lib/equip-filter.test.ts`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Write the module**

Create `lib/equip-filter.ts`:

```ts
// items.equippable_classes mixes real job names with group values. The two
// commonest entries in the whole table are "All Jobs" (166 items) and
// "All Jobs except Novice" (56), so a filter that compares against job names
// alone hides the majority of what a player can actually wear.

export const EQUIPMENT_CATEGORIES = ['Armor', 'Weapon', 'Costume Equipment'] as const;

const ALL_JOBS = 'all jobs';
const ALL_JOBS_EXCEPT_NOVICE = 'all jobs except novice';
const NOVICE = 'novice';

export function canJobEquip(equippableClasses: string[] | null, job: string): boolean {
  if (!equippableClasses || equippableClasses.length === 0) return false;

  const wanted = job.trim().toLowerCase();

  return equippableClasses.some((entry) => {
    const value = entry.trim().toLowerCase();
    if (value === ALL_JOBS) return true;
    if (value === ALL_JOBS_EXCEPT_NOVICE) return wanted !== NOVICE;
    return value === wanted;
  });
}
```

- [ ] **Step 4: Run it and watch it pass**

Run: `npm test -- lib/equip-filter.test.ts`
Expected: PASS, all nine.

- [ ] **Step 5: Prove the tests can fail**

Delete the `ALL_JOBS` branch; confirm the "All Jobs" case goes red; restore. Then change the `ALL_JOBS_EXCEPT_NOVICE` branch to `return true`; confirm the Novice-exclusion case goes red; restore and confirm green. Commit neither broken version.

- [ ] **Step 6: Build the page**

Create `app/database/equipment/page.tsx`:

```tsx
// app/database/equipment/page.tsx
import Link from 'next/link';
import { supabaseBrowser } from '@/lib/supabase';
import Pagination from '@/components/Pagination';
import { canJobEquip, EQUIPMENT_CATEGORIES } from '@/lib/equip-filter';

export const revalidate = 86400;

export const metadata = {
  title: 'ฐานข้อมูลอุปกรณ์',
  description:
    'อาวุธ เกราะ และคอสตูมทั้งหมดในเกม Ragnarok Zero Global กรองตามอาชีพที่ใส่ได้และเลเวลที่ต้องการ พร้อมค่าพลังโจมตี',
};

const PAGE_SIZE = 50;

export default async function EquipmentPage({
  searchParams,
}: {
  searchParams: { q?: string; category?: string; job?: string; page?: string };
}) {
  const q = searchParams.q ?? '';
  const category = searchParams.category ?? '';
  const job = searchParams.job ?? '';
  const page = Math.max(1, Number(searchParams.page ?? 1) || 1);

  const db = supabaseBrowser();

  // 490 rows, well under the 1,000-row cap. Fetched whole because the job
  // filter is an array-membership rule with group values that SQL would need
  // awkward gymnastics to express, and because the job dropdown is derived
  // from the same rows.
  const { data: allItems, error } = await db
    .from('items')
    .select('id, name_en, icon_url, category, weapon_type, atk, required_level, equippable_classes')
    .in('category', [...EQUIPMENT_CATEGORIES])
    .order('name_en');

  if (error) {
    console.error('equipment query failed', error);
  }

  const items = allItems ?? [];

  // Group values are not jobs, so they must not appear in a "which job" list.
  const jobSet = new Set<string>();
  for (const it of items) {
    for (const c of it.equippable_classes ?? []) {
      const v = c.trim();
      if (v === '' || v.toLowerCase().startsWith('all jobs')) continue;
      jobSet.add(v);
    }
  }
  const jobs = [...jobSet].sort();

  const needle = q.trim().toLowerCase();
  const filtered = items.filter((it) => {
    if (category && it.category !== category) return false;
    if (job && !canJobEquip(it.equippable_classes, job)) return false;
    if (needle && !it.name_en.toLowerCase().includes(needle)) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function buildHref(targetPage: number) {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (category) params.set('category', category);
    if (job) params.set('job', job);
    if (targetPage > 1) params.set('page', String(targetPage));
    const qs = params.toString();
    return `/database/equipment${qs ? `?${qs}` : ''}`;
  }

  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <h1 style={{ fontFamily: '"Chakra Petch", sans-serif', fontSize: 32 }}>ฐานข้อมูลอุปกรณ์</h1>
      <p style={{ color: 'var(--faint)', marginTop: 6 }}>
        {filtered.length} ชิ้น จากทั้งหมด {items.length} ชิ้น
      </p>

      <form style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '20px 0' }}>
        <input className="mono" type="text" name="q" defaultValue={q} placeholder="ค้นชื่ออุปกรณ์..." />
        <select name="category" defaultValue={category}>
          <option value="">ทุกหมวด</option>
          {EQUIPMENT_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select name="job" defaultValue={job}>
          <option value="">ทุกอาชีพ</option>
          {jobs.map((j) => (
            <option key={j} value={j}>{j}</option>
          ))}
        </select>
        <button type="submit">กรอง</button>
      </form>

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>ชื่อ</th>
              <th>หมวด</th>
              <th>ชนิด</th>
              <th className="num">ATK</th>
              <th className="num">เลเวลที่ใช้ได้</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((it) => (
              <tr key={it.id}>
                <td data-label="">
                  <Link href={`/database/items/${it.id}`} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {it.icon_url && (
                      <img src={it.icon_url} alt="" width={24} height={24} style={{ imageRendering: 'pixelated' }} />
                    )}
                    {it.name_en}
                  </Link>
                </td>
                <td data-label="หมวด">{it.category ?? '—'}</td>
                <td data-label="ชนิด">{it.weapon_type ?? '—'}</td>
                <td data-label="ATK" className="num">{it.atk ?? '—'}</td>
                <td data-label="เลเวลที่ใช้ได้" className="num">{it.required_level ?? '—'}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} data-label="" style={{ color: 'var(--faint)', padding: '16px 0' }}>
                  ไม่พบอุปกรณ์ที่ตรงเงื่อนไข
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={safePage} totalPages={totalPages} buildHref={buildHref} />
    </main>
  );
}
```

- [ ] **Step 7: Turn the nav link on**

In `lib/nav-links.ts`, change the `/database/equipment` entry's `ready` to `true`.

- [ ] **Step 8: Check it in a browser**

Open `/database/equipment` and confirm, reporting each number you see:
- 490 items with no filters.
- Filtering job `Swordsman` returns **more** than the 97 items that name Swordsman directly, because `All Jobs` items are included. Report the count.
- The job dropdown contains no entry starting with "All Jobs".
- A row whose `atk` is null shows `—`, not `0` or a blank.
- At 340px, rows become labelled cards.

- [ ] **Step 9: Run the suite and commit**

Run: `npm test && npx tsc --noEmit`

```bash
git add lib/equip-filter.ts lib/equip-filter.test.ts app/database/equipment/page.tsx lib/nav-links.ts
git commit -m "feat: add equipment browser with job filter"
```

---

### Task 3: Maps browser

Spec §3.2. `monster_spawns` holds 3,032 rows across 497 maps and nothing on the site reads them except one line on the monster page. A map page turns "where do I go" into a browsable answer.

**Files:**
- Create: `supabase/migrations/0006_map_stats.sql`, `app/database/maps/page.tsx`, `app/database/maps/[code]/page.tsx`
- Modify: `lib/nav-links.ts`

**Why this task needs a view, and why paging the raw table is the wrong answer.**

`monster_spawns` holds 3,032 rows and Supabase caps a request at 1,000, so the obvious move is to page through it with `.range()` and group the rows in JavaScript. That is what the first draft of this plan said to do, and it is subtly wrong.

Paging requires an ORDER BY, and the only column worth ordering by here is `map_code` — which has ties, roughly six rows per map. **Postgres does not guarantee a stable order among tied rows across separate queries.** If the planner picks a different scan, or a write lands between two pages, a row can be returned twice or skipped entirely, and the page shows a wrong monster count for a map with no error anywhere.

I tested it against the live database: today all four pages come back with exactly 3,032 distinct rows, none duplicated. That is the current behaviour, not a promise — it rests on an implementation detail the database is free to change.

The fix removes the question instead of managing it. Aggregating in SQL yields **497 rows, one per map** — comfortably inside the cap, one request, no pagination and therefore no ordering to be unstable. It also matches what this project already does for `monster_farming_stats`.

Two facts checked while designing this: the busiest map holds **29** monsters and the average is 6.1, so the detail page is nowhere near the cap and needs no paging of its own; and **no map carries two different display names**, so `min(map_display_name)` collapses the 245 named maps without discarding anything.

**Interfaces:**
- Consumes: `supabaseBrowser()`; `Pagination`; `AggroBadge` from `components/AggroBadge.tsx` taking `{ level: AggroLevel }`; `aggroLevel(monster: { is_aggressive: boolean | null; atk_max: number | null }, playerMaxHp: number | null): AggroLevel` from `lib/aggro-tier.ts`.
- Produces: routes `/database/maps` and `/database/maps/[code]`.

**Note on the aggro badge:** pass `null` for `playerMaxHp` on both pages. There is no character context wired into any page yet, and `aggroLevel` deliberately returns the two-level answer when the player is unknown. Do not invent a player to get three levels.

- [ ] **Step 1: Write the migration**

Create `supabase/migrations/0006_map_stats.sql`:

```sql
-- 0006_map_stats.sql
--
-- monster_spawns holds 3,032 rows and Supabase caps a request at 1,000, so a
-- map list built from the raw table has to page. Paging needs an ORDER BY, and
-- the only useful column, map_code, has ties -- about six rows per map.
-- Postgres does not guarantee a stable order among tied rows across separate
-- queries, so a row can be returned twice or skipped between pages, and a map
-- shows a wrong monster count with no error anywhere.
--
-- Aggregating here removes the question rather than managing it: 497 rows, one
-- per map, one request, no pagination and so no ordering to be unstable.
--
-- min(map_display_name) is safe: no map in the data carries two different
-- display names, and only 245 of 497 carry one at all -- the rest stay null and
-- the page shows the code instead of guessing a name.

create or replace view map_stats as
select
  s.map_code,
  min(s.map_display_name) as map_display_name,
  count(*)::integer as monster_count
from monster_spawns s
group by s.map_code;

-- Without security_invoker a view runs as its owner and bypasses the RLS
-- policies on the table beneath it. monster_spawns is public-read anyway, but
-- the setting is stated explicitly so the next view added here inherits the
-- habit rather than the omission.
alter view map_stats set (security_invoker = on);
```

**Do not apply this migration.** You have no database credentials. The controller applies it and confirms before the page is verified.

- [ ] **Step 2: Build the list page**

Create `app/database/maps/page.tsx`:

```tsx
// app/database/maps/page.tsx
import Link from 'next/link';
import { supabaseBrowser } from '@/lib/supabase';
import Pagination from '@/components/Pagination';

export const revalidate = 86400;

export const metadata = {
  title: 'ฐานข้อมูลแมพ',
  description:
    'แมพทั้งหมดในเกม Ragnarok Zero Global พร้อมจำนวนมอนสเตอร์ที่เกิดในแต่ละแมพ กดเข้าไปดูว่ามีมอนอะไรบ้าง',
};

const PAGE_SIZE = 50;

export default async function MapsPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string };
}) {
  const q = searchParams.q ?? '';
  const page = Math.max(1, Number(searchParams.page ?? 1) || 1);

  const db = supabaseBrowser();

  // map_stats is one row per map -- 497 of them, inside the 1,000-row cap --
  // so this pages in SQL with an exact count instead of pulling 3,032 spawn
  // rows across four requests and grouping them here.
  let query = db.from('map_stats').select('map_code, map_display_name, monster_count', { count: 'exact' });

  if (q) {
    // or() takes one string; a comma inside a value would split it, so the
    // needle is stripped of commas rather than trusted.
    const needle = q.replace(/[,()]/g, '');
    query = query.or(`map_code.ilike.%${needle}%,map_display_name.ilike.%${needle}%`);
  }

  const from = (page - 1) * PAGE_SIZE;
  // Ordered by monster_count then map_code. map_code is unique in this view,
  // so the sort is total and paging is stable -- the property the raw table
  // could not offer.
  const { data: maps, count, error } = await query
    .order('monster_count', { ascending: false })
    .order('map_code')
    .range(from, from + PAGE_SIZE - 1);

  if (error) {
    console.error('maps query failed', error);
  }

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  function buildHref(targetPage: number) {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (targetPage > 1) params.set('page', String(targetPage));
    const qs = params.toString();
    return `/database/maps${qs ? `?${qs}` : ''}`;
  }

  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <h1 style={{ fontFamily: '"Chakra Petch", sans-serif', fontSize: 32 }}>ฐานข้อมูลแมพ</h1>
      <p style={{ color: 'var(--faint)', marginTop: 6 }}>{count ?? 0} แมพ</p>
      <p style={{ color: 'var(--faint)', marginTop: 4, fontSize: 13 }}>
        แมพบางแห่งมีแต่รหัส เพราะข้อมูลต้นทางไม่มีชื่อให้ ไม่ได้แปลว่าแมพนั้นไม่มีอยู่
      </p>

      <form style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '20px 0' }}>
        <input className="mono" type="text" name="q" defaultValue={q} placeholder="ค้นชื่อหรือรหัสแมพ..." />
        <button type="submit">ค้นหา</button>
      </form>

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>แมพ</th>
              <th>รหัส</th>
              <th className="num">จำนวนมอน</th>
            </tr>
          </thead>
          <tbody>
            {(maps ?? []).map((m) => (
              <tr key={m.map_code}>
                <td data-label="">
                  <Link href={`/database/maps/${encodeURIComponent(m.map_code)}`}>
                    {m.map_display_name ?? m.map_code}
                  </Link>
                </td>
                <td data-label="รหัส" className="mono">{m.map_code}</td>
                <td data-label="จำนวนมอน" className="num">{m.monster_count}</td>
              </tr>
            ))}
            {(maps ?? []).length === 0 && (
              <tr>
                <td colSpan={3} data-label="" style={{ color: 'var(--faint)', padding: '16px 0' }}>
                  ไม่พบแมพที่ตรงเงื่อนไข
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={totalPages} buildHref={buildHref} />
    </main>
  );
}
```

- [ ] **Step 3: Build the detail page**

Create `app/database/maps/[code]/page.tsx`:

```tsx
// app/database/maps/[code]/page.tsx
import Link from 'next/link';
import type { Metadata } from 'next';
import { cache } from 'react';
import { notFound } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase';
import AggroBadge from '@/components/AggroBadge';
import { aggroLevel } from '@/lib/aggro-tier';

export const revalidate = 86400;

// Shared by generateMetadata and the page body so one request does one query.
// Returns the raw { data, error } so each caller keeps its own handling.
const getMapSpawns = cache(async (code: string) => {
  return await supabaseBrowser()
    .from('monster_spawns')
    .select('map_display_name, monsters(id, name_en, level, hp, base_exp, image_url, is_aggressive, atk_max)')
    .eq('map_code', code);
});

export async function generateMetadata({ params }: { params: { code: string } }): Promise<Metadata> {
  const code = decodeURIComponent(params.code);
  const { data, error } = await getMapSpawns(code);

  // An error tells us nothing about the map, so make no claim either way
  // rather than tell a crawler a live page is dead.
  if (error) {
    console.error('map metadata query failed', error);
    return {};
  }
  if (!data || data.length === 0) return { title: 'ไม่พบแมพนี้' };

  const name = data.find((r) => r.map_display_name)?.map_display_name ?? code;
  return {
    title: `${name} — มอนสเตอร์ในแมพนี้`,
    description: `${name} (${code}) มีมอนสเตอร์ ${data.length} ชนิด ดูเลเวล HP EXP และของที่ดรอปได้ใน ROZ Calc`,
  };
}

export default async function MapDetailPage({ params }: { params: { code: string } }) {
  const code = decodeURIComponent(params.code);
  const { data: spawns, error } = await getMapSpawns(code);

  if (error) {
    console.error('map detail query failed', error);
    return <main className="shell" style={{ paddingBlock: 32 }}>เกิดข้อผิดพลาด ลองใหม่อีกครั้ง</main>;
  }

  // A clean query returning nothing is a genuine 404 -- unlike the error
  // branch above, which must never become one.
  if (!spawns || spawns.length === 0) {
    notFound();
  }

  const name = spawns.find((s: any) => s.map_display_name)?.map_display_name ?? code;
  const monsters = spawns
    .map((s: any) => s.monsters)
    .filter(Boolean)
    .sort((a: any, b: any) => a.level - b.level);

  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <h1 style={{ fontFamily: '"Chakra Petch", sans-serif', fontSize: 32 }}>{name}</h1>
      <p className="mono" style={{ color: 'var(--faint)', marginTop: 6 }}>{code}</p>
      <p style={{ color: 'var(--dim)', marginTop: 10 }}>มอนสเตอร์ {monsters.length} ชนิดในแมพนี้</p>

      <div className="card" style={{ marginTop: 20 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>มอนสเตอร์</th>
              <th className="num">Lv</th>
              <th className="num">HP</th>
              <th className="num">Base EXP</th>
              <th>เข้าตีเอง</th>
            </tr>
          </thead>
          <tbody>
            {monsters.map((m: any) => (
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
                {/* hp and base_exp of 0 are the unknown-value sentinels, not real zeros. */}
                <td data-label="HP" className="num">{m.hp > 0 ? m.hp.toLocaleString('en-US') : '—'}</td>
                <td data-label="Base EXP" className="num">{m.base_exp > 0 ? m.base_exp.toLocaleString('en-US') : '—'}</td>
                <td data-label="เข้าตีเอง">
                  <AggroBadge level={aggroLevel({ is_aggressive: m.is_aggressive, atk_max: m.atk_max }, null)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Turn the nav link on**

In `lib/nav-links.ts`, change the `/database/maps` entry's `ready` to `true`.

- [ ] **Step 5: Check it in a browser**

Open `/database/maps` and confirm, reporting each:
- 497 maps listed, sorted with the busiest first.
- A map with no display name shows its code in the name column, not a blank.
- Clicking through reaches a detail page listing that map's monsters with an aggro badge on every row.
- A monster whose `hp` is 0 shows `—` in the HP column, not `0`.
- `/database/maps/does_not_exist` returns 404, not a 200 with an empty table.

- [ ] **Step 6: Run the suite and commit**

Run: `npm test && npx tsc --noEmit && npm run build`

```bash
git add supabase/migrations/0006_map_stats.sql app/database/maps lib/nav-links.ts
git commit -m "feat: add maps browser backed by a pre-aggregated view"
```

- [ ] **Step 7: [CONTROLLER] Apply the migration**

The controller applies `0006_map_stats.sql` and confirms `select count(*) from map_stats` returns 497 and that `reloptions` still reads `security_invoker=on`. The browser checks in Step 5 cannot pass until this has run — until then the page queries a view that does not exist.

---

### Task 4: Skills browser

Spec §3.1 and `docs/skill-tree-research.md` §5.11. 851 skills sit in the database unused. The important design point: **most of what looks like missing data is content the server has not released yet**, and saying so is more useful than hiding it.

**Files:**
- Create: `lib/zero-jobs.ts`, `lib/zero-jobs.test.ts`, `app/database/skills/page.tsx`
- Modify: `lib/nav-links.ts`, `app/globals.css`

**Interfaces:**
- Consumes: `supabaseBrowser()`; `Pagination`.
- Produces:
  - `export const ZERO_JOBS: readonly string[]` — the 20 jobs that exist in Zero
  - `export function isZeroJob(job: string): boolean`
  - `export function isInGameSkill(classes: string[] | null): boolean`

**The job list, verified against the live `skills.classes` data:**

Class 1 — Novice 3, Swordsman 11, Mage 15, Archer 7, Thief 11, Acolyte 16, Merchant 12.
Class 2 — Knight 18, Crusader 24, Wizard 19, Sage 32, Hunter 22, Bard 24, Dancer 24, Assassin 17, Rogue 23, Priest 24, Monk 22, Blacksmith 28, Alchemist 21.

That is 20 jobs and 373 skills. `docs/skill-tree-research.md` quotes 19 jobs and 370 skills because its table listed only class 1 and class 2 rows and omitted Novice. Novice is a real job players start in, so this plan includes it — a deliberate, recorded deviation from that document.

Everything else in `classes` is content Zero has not released: Super Novice, Expanded Super Novice, Ninja, Gunslinger, Kagerou, Oboro, Rebellion, and the transcendent and class-3 jobs Professor, High Priest, Whitesmith, Paladin, Stalker, Lord Knight, High Wizard, Clown, Champion, Gypsy, Assassin Cross, Creator, Sniper.

- [ ] **Step 1: Write the failing test**

Create `lib/zero-jobs.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { ZERO_JOBS, isZeroJob, isInGameSkill } from './zero-jobs';

describe('ZERO_JOBS', () => {
  it('holds twenty jobs', () => {
    expect(ZERO_JOBS).toHaveLength(20);
  });

  it('includes Novice, which the research doc omitted from its count', () => {
    expect(isZeroJob('Novice')).toBe(true);
  });

  it('includes every class-1 job', () => {
    for (const j of ['Swordsman', 'Mage', 'Archer', 'Thief', 'Acolyte', 'Merchant']) {
      expect(isZeroJob(j)).toBe(true);
    }
  });

  it('includes every class-2 job', () => {
    for (const j of ['Knight', 'Crusader', 'Wizard', 'Sage', 'Hunter', 'Bard', 'Dancer',
                     'Assassin', 'Rogue', 'Priest', 'Monk', 'Blacksmith', 'Alchemist']) {
      expect(isZeroJob(j)).toBe(true);
    }
  });

  it('excludes jobs that are not in Zero', () => {
    for (const j of ['Super Novice', 'Ninja', 'Gunslinger', 'Kagerou', 'Oboro', 'Rebellion']) {
      expect(isZeroJob(j)).toBe(false);
    }
  });

  it('excludes transcendent and class-3 jobs', () => {
    for (const j of ['Lord Knight', 'High Priest', 'Paladin', 'Assassin Cross', 'Sniper', 'Creator']) {
      expect(isZeroJob(j)).toBe(false);
    }
  });

  it('does not treat Super Novice as Novice', () => {
    // A substring check would wrongly accept it and put 52 unreleased skills
    // into the in-game list.
    expect(isZeroJob('Super Novice')).toBe(false);
    expect(isZeroJob('Expanded Super Novice')).toBe(false);
  });
});

describe('isInGameSkill', () => {
  it('is true when any class is a Zero job', () => {
    expect(isInGameSkill(['Knight'])).toBe(true);
  });

  it('is true when a skill is shared by an in-game and an unreleased job', () => {
    expect(isInGameSkill(['Knight', 'Lord Knight'])).toBe(true);
  });

  it('is false when every class is unreleased content', () => {
    expect(isInGameSkill(['Lord Knight', 'Paladin'])).toBe(false);
  });

  it('is false for an empty class list', () => {
    // 418 skills carry no class at all. They are unreleased content, not a
    // gap in our data -- and they must not silently land in the in-game view.
    expect(isInGameSkill([])).toBe(false);
  });

  it('is false for a null class list rather than throwing', () => {
    expect(isInGameSkill(null)).toBe(false);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npm test -- lib/zero-jobs.test.ts`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Write the module**

Create `lib/zero-jobs.ts`:

```ts
// Which jobs actually exist in Ragnarok Zero Global.
//
// The skills table carries 851 rows, but most of what looks like missing data
// is content the server has not released: class-3 and transcendent jobs, plus
// job lines Zero does not have at all (Ninja, Gunslinger, Rebellion, and the
// Super Novice pair). Telling a player "this is not in the game yet" is more
// useful than hiding it, so the browser separates the two rather than
// filtering one away.
//
// Verified against the live skills.classes data on 26 Aug: these 20 jobs
// account for 373 of the 433 skills that carry any class at all.

export const ZERO_JOBS = [
  // Class 1
  'Novice',
  'Swordsman',
  'Mage',
  'Archer',
  'Thief',
  'Acolyte',
  'Merchant',
  // Class 2
  'Knight',
  'Crusader',
  'Wizard',
  'Sage',
  'Hunter',
  'Bard',
  'Dancer',
  'Assassin',
  'Rogue',
  'Priest',
  'Monk',
  'Blacksmith',
  'Alchemist',
] as const;

// Exact match on a lowercased name. A substring test would accept
// "Super Novice" as Novice and drag 52 unreleased skills into the in-game
// list, and "Lord Knight" as Knight.
const ZERO_JOB_SET = new Set<string>(ZERO_JOBS.map((j) => j.toLowerCase()));

export function isZeroJob(job: string): boolean {
  return ZERO_JOB_SET.has(job.trim().toLowerCase());
}

export function isInGameSkill(classes: string[] | null): boolean {
  if (!classes || classes.length === 0) return false;
  return classes.some(isZeroJob);
}
```

- [ ] **Step 4: Run it and watch it pass**

Run: `npm test -- lib/zero-jobs.test.ts`
Expected: PASS, all twelve.

- [ ] **Step 5: Prove the tests can fail**

Change `isZeroJob` to use `[...ZERO_JOB_SET].some((j) => job.toLowerCase().includes(j))`; confirm the Super Novice and Lord Knight cases go red; restore. Then change `isInGameSkill`'s empty-list guard to `if (!classes) return false;`; confirm the empty-list case goes red; restore and confirm green. Commit neither broken version.

- [ ] **Step 6: Build the page**

Create `app/database/skills/page.tsx`:

```tsx
// app/database/skills/page.tsx
import { supabaseBrowser } from '@/lib/supabase';
import Pagination from '@/components/Pagination';
import { ZERO_JOBS, isInGameSkill } from '@/lib/zero-jobs';

export const revalidate = 86400;

export const metadata = {
  title: 'ฐานข้อมูลสกิล',
  description:
    'สกิลของทุกอาชีพในเกม Ragnarok Zero Global แยกตามอาชีพ พร้อมเลเวลสูงสุดและชนิดสกิล และรายการสกิลที่ยังไม่เปิดในเซิร์ฟ',
};

const PAGE_SIZE = 50;
const FETCH_PAGE = 1000;

// 851 rows is under the cap today but close enough that a plain select()
// would start truncating silently the moment more content ships.
async function allSkills() {
  const db = supabaseBrowser();
  const rows: any[] = [];

  for (let from = 0; ; from += FETCH_PAGE) {
    const { data, error } = await db
      .from('skills')
      .select('slug, name, type, max_level, element, classes, icon_url')
      .order('name')
      .range(from, from + FETCH_PAGE - 1);

    if (error) {
      console.error('skills query failed', error);
      break;
    }
    if (!data || data.length === 0) break;
    rows.push(...data);
    if (data.length < FETCH_PAGE) break;
  }

  return rows;
}

export default async function SkillsPage({
  searchParams,
}: {
  searchParams: { q?: string; job?: string; type?: string; tab?: string; page?: string };
}) {
  const q = searchParams.q ?? '';
  const job = searchParams.job ?? '';
  const type = searchParams.type ?? '';
  const tab = searchParams.tab === 'unreleased' ? 'unreleased' : 'ingame';
  const page = Math.max(1, Number(searchParams.page ?? 1) || 1);

  const skills = await allSkills();

  const inGame = skills.filter((s) => isInGameSkill(s.classes));
  const unreleased = skills.filter((s) => !isInGameSkill(s.classes));
  const pool = tab === 'unreleased' ? unreleased : inGame;

  const types = [...new Set(skills.map((s) => s.type).filter(Boolean))].sort();

  const needle = q.trim().toLowerCase();
  const filtered = pool.filter((s) => {
    if (job && !(s.classes ?? []).includes(job)) return false;
    if (type && s.type !== type) return false;
    if (needle && !s.name.toLowerCase().includes(needle)) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function buildHref(targetPage: number, overrides: Record<string, string> = {}) {
    const params = new URLSearchParams();
    const next = { q, job, type, tab, ...overrides };
    if (next.q) params.set('q', next.q);
    if (next.job) params.set('job', next.job);
    if (next.type) params.set('type', next.type);
    if (next.tab === 'unreleased') params.set('tab', 'unreleased');
    if (targetPage > 1) params.set('page', String(targetPage));
    const qs = params.toString();
    return `/database/skills${qs ? `?${qs}` : ''}`;
  }

  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <h1 style={{ fontFamily: '"Chakra Petch", sans-serif', fontSize: 32 }}>ฐานข้อมูลสกิล</h1>
      <p style={{ color: 'var(--faint)', marginTop: 6 }}>
        {filtered.length} สกิล จาก {pool.length} สกิลในหมวดนี้
      </p>

      <div className="tabs" style={{ marginTop: 16 }}>
        <a href={buildHref(1, { tab: 'ingame' })} className={tab === 'ingame' ? 'on' : undefined}>
          มีในเกม ({inGame.length})
        </a>
        <a href={buildHref(1, { tab: 'unreleased' })} className={tab === 'unreleased' ? 'on' : undefined}>
          ยังไม่เปิดในเซิร์ฟ ({unreleased.length})
        </a>
      </div>

      {tab === 'unreleased' && (
        <p style={{ color: 'var(--faint)', marginTop: 12, fontSize: 13 }}>
          สกิลกลุ่มนี้อยู่ในไฟล์ข้อมูลของเกมแต่ยังไม่เปิดใน Global — เป็นสกิลคลาส 3 สกิลโฮมุนคูลุส
          และสกิลของอาชีพที่ Zero ยังไม่มี ไม่ใช่ข้อมูลที่เราเก็บมาไม่ครบ
        </p>
      )}

      <form style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '20px 0' }}>
        <input type="hidden" name="tab" value={tab} />
        <input className="mono" type="text" name="q" defaultValue={q} placeholder="ค้นชื่อสกิล..." />
        {tab === 'ingame' && (
          <select name="job" defaultValue={job}>
            <option value="">ทุกอาชีพ</option>
            {ZERO_JOBS.map((j) => (
              <option key={j} value={j}>{j}</option>
            ))}
          </select>
        )}
        <select name="type" defaultValue={type}>
          <option value="">ทุกชนิด</option>
          {types.map((t) => (
            <option key={t} value={t as string}>{t as string}</option>
          ))}
        </select>
        <button type="submit">กรอง</button>
      </form>

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>ชื่อ</th>
              <th>ชนิด</th>
              <th className="num">เลเวลสูงสุด</th>
              <th>ธาตุ</th>
              <th>อาชีพ</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.slug}>
                <td data-label="">
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {s.icon_url && (
                      <img src={s.icon_url} alt="" width={24} height={24} style={{ imageRendering: 'pixelated' }} />
                    )}
                    {s.name}
                  </span>
                </td>
                {/* 448 skills have no type and 691 no element. Those are real
                    gaps in the source data, so they show as em-dashes. */}
                <td data-label="ชนิด">{s.type ?? '—'}</td>
                <td data-label="เลเวลสูงสุด" className="num">{s.max_level ?? '—'}</td>
                <td data-label="ธาตุ">{s.element ?? '—'}</td>
                <td data-label="อาชีพ">{(s.classes ?? []).length > 0 ? s.classes.join(', ') : '—'}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} data-label="" style={{ color: 'var(--faint)', padding: '16px 0' }}>
                  ไม่พบสกิลที่ตรงเงื่อนไข
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={safePage} totalPages={totalPages} buildHref={(p) => buildHref(p)} />

      <p style={{ color: 'var(--faint)', marginTop: 24, fontSize: 13 }}>
        หน้านี้เป็นรายการสกิล ยังไม่ใช่ตัววางแผนบิลด์ — ตัววางแผนต้องใช้ข้อมูลเงื่อนไขสกิลที่ต้องลงก่อน
        ซึ่งยังไม่มีในฐานข้อมูล
      </p>
    </main>
  );
}
```

- [ ] **Step 7: Add the tab style**

Append to `app/globals.css`:

```css
/* Two-way tab strip. Reuses the nav's active-pill treatment so the site has
   one visual language for "you are here". */
.tabs { display: flex; gap: 4px; border-bottom: 1px solid var(--hair); }

.tabs a {
  padding: 8px 14px;
  border-radius: 6px 6px 0 0;
  font: 600 14px/1.6 "Sarabun", sans-serif;
  color: var(--dim);
  text-decoration: none;
  white-space: nowrap;
}

.tabs a:hover { color: var(--text); background: var(--panel-2); }
.tabs a.on { color: var(--yellow); background: var(--panel-2); }
```

- [ ] **Step 8: Turn the nav link on**

In `lib/nav-links.ts`, change the `/database/skills` entry's `ready` to `true`.

- [ ] **Step 9: Check it in a browser**

Open `/database/skills` and confirm, reporting each count:
- The in-game tab shows **373** skills and the unreleased tab **478**. The two must sum to 851. If they do not, the job list and the data disagree — report the numbers rather than adjusting the list to fit.
- **Every skill icon renders.** They were mirrored in Wave 1; an empty frame means the icon path is wrong, and that is the failure this check exists to catch.
- The job dropdown lists 20 jobs and appears only on the in-game tab.
- Filtering job `Swordsman` returns 11 skills.
- A skill with no type shows `—`.
- At 340px, rows become labelled cards.

- [ ] **Step 10: Run the suite and commit**

Run: `npm test && npx tsc --noEmit`

```bash
git add lib/zero-jobs.ts lib/zero-jobs.test.ts app/database/skills/page.tsx app/globals.css lib/nav-links.ts
git commit -m "feat: add skills browser separating in-game from unreleased content"
```

---

### Task 5: Rebuild the monster detail page

Spec §6.5. The page shows eight values; Wave 1 imported roughly twenty-five more plus a skill list, and none of it is on screen. This is also the page that carries the site's clearest differentiator — the aggro badge — and the one Google sends the most people to, at 524 URLs.

**Files:**
- Modify: `app/database/monsters/[id]/page.tsx`, `app/globals.css`

**Interfaces:**
- Consumes: `AggroBadge` from `components/AggroBadge.tsx`; `aggroLevel` from `lib/aggro-tier.ts`; the existing cached `getMonster` in this file.
- Produces: nothing other tasks depend on.

**Hard requirements from the spec, each with a reason:**
- **No tabs.** 524 pages of content hidden behind an unopened tab scores worse in search and cannot be found with Ctrl+F.
- **The aggro badge is the most prominent thing in the header.** It is what a player came for and what no competing site shows.
- **Zeny per kill needs a tooltip** saying it is computed from sell price times drop rate, not money the monster drops. Without it the number reads as a different claim.
- **Spawn points link to the map page** so a player can carry on to "what else is here".
- Pass `null` for `playerMaxHp` — no page has a character context yet, and `aggroLevel` returns the honest two-level answer when the player is unknown.

- [ ] **Step 1: Read the current page**

Read `app/database/monsters/[id]/page.tsx` in full before editing. Keep the existing `getMonster` cache wrapper, the `generateMetadata` function, and the split between its error branch and its not-found branch exactly as they are — that split was hard-won and a regression there tells crawlers a live page is dead.

- [ ] **Step 2: Add the queries the new sections need**

Inside the page body, alongside the existing drops query, add:

```tsx
  const { data: spawns } = await db
    .from('monster_spawns')
    .select('map_code, map_display_name')
    .eq('monster_id', id)
    .order('map_code');

  const { data: monsterSkills } = await db
    .from('monster_skills')
    .select('skill_name, skill_lv, rate, cast_time, delay, target, state')
    .eq('monster_id', id)
    .order('entry_index');
```

- [ ] **Step 3: Rebuild the page body**

Replace everything the page returns after the `notFound()` guard with this. Do not touch anything above it.

```tsx
  const aggro = aggroLevel({ is_aggressive: monster.is_aggressive, atk_max: monster.atk_max }, null);
  const zeny = monster.avg_zeny_per_kill;

  // A dash rather than a number wherever the value is unknown. hp and base_exp
  // of 0 are this database's unknown-value sentinels, not real zeros.
  const num = (v: number | null | undefined) =>
    v === null || v === undefined ? '—' : v.toLocaleString('en-US');
  const sentinel = (v: number | null | undefined) =>
    v === null || v === undefined || v === 0 ? '—' : v.toLocaleString('en-US');

  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        {monster.image_url && (
          <img src={monster.image_url} alt="" width={64} height={64} style={{ imageRendering: 'pixelated' }} />
        )}
        <div>
          <h1 style={{ fontFamily: '"Chakra Petch", sans-serif', fontSize: 32 }}>{monster.name_en}</h1>
          <p style={{ color: 'var(--dim)' }}>
            Lv.{monster.level}
            {monster.race ? ` · ${monster.race}` : ''}
            {monster.element ? ` · ${monster.element}${monster.element_level ?? ''}` : ''}
            {monster.size ? ` · ${monster.size}` : ''}
          </p>
        </div>
        {/* The badge sits in the header, not buried below: it is the reason a
            player opened this page and no competing site shows it. */}
        <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
          <AggroBadge level={aggro} />
          {monster.is_mvp && <span className="aggro aggro--danger">MVP</span>}
          {monster.loots_items && <span className="aggro aggro--caution">เก็บของ</span>}
        </div>
      </div>

      <div className="card card--yellow" style={{ marginTop: 20 }}>
        <div className="reward-row">
          <div><span className="reward-label">Base EXP</span><span className="reward-value mono">{sentinel(monster.base_exp)}</span></div>
          <div><span className="reward-label">Job EXP</span><span className="reward-value mono">{sentinel(monster.job_exp)}</span></div>
          <div>
            <span className="reward-label">Zeny/ตัว</span>
            <span
              className="reward-value mono"
              title="คิดจาก ราคาขายของที่ดรอป × อัตราดรอป ไม่ใช่เงินที่มอนดรอปออกมาตรงๆ"
            >
              {zeny === null || zeny === undefined ? '—' : Number(zeny).toLocaleString('en-US')}
            </span>
          </div>
        </div>
      </div>

      <div className="detail-cols">
        <div className="panel">
          <div className="card">
            <h2 className="section-title">ค่าสถานะ</h2>
            <table className="data-table">
              <tbody>
                <tr><td data-label="HP">HP</td><td className="num">{sentinel(monster.hp)}</td></tr>
                <tr><td data-label="ATK">ATK</td><td className="num">{num(monster.atk_min)} – {num(monster.atk_max)}</td></tr>
                <tr><td data-label="MATK">MATK</td><td className="num">{num(monster.matk_min)} – {num(monster.matk_max)}</td></tr>
                <tr><td data-label="DEF">DEF</td><td className="num">{num(monster.def)}</td></tr>
                <tr><td data-label="MDEF">MDEF</td><td className="num">{num(monster.mdef)}</td></tr>
                <tr><td data-label="FLEE">FLEE</td><td className="num">{num(monster.flee)}</td></tr>
                <tr><td data-label="HIT">HIT</td><td className="num">{num(monster.hit)}</td></tr>
              </tbody>
            </table>
          </div>

          <div className="card">
            <h2 className="section-title">สเตตัสพื้นฐาน</h2>
            <table className="data-table">
              <tbody>
                <tr><td data-label="STR">STR</td><td className="num">{num(monster.str)}</td></tr>
                <tr><td data-label="AGI">AGI</td><td className="num">{num(monster.agi)}</td></tr>
                <tr><td data-label="VIT">VIT</td><td className="num">{num(monster.vit)}</td></tr>
                <tr><td data-label="INT">INT</td><td className="num">{num(monster.int_)}</td></tr>
                <tr><td data-label="DEX">DEX</td><td className="num">{num(monster.dex)}</td></tr>
                <tr><td data-label="LUK">LUK</td><td className="num">{num(monster.luk)}</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <div className="card">
            <h2 className="section-title">ของที่ดรอป</h2>
            <table className="data-table">
              <thead>
                <tr><th>ไอเทม</th><th className="num">อัตราดรอป</th></tr>
              </thead>
              <tbody>
                {(drops ?? []).map((d: any, i: number) => (
                  <tr key={i}>
                    <td data-label="">
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {d.items?.icon_url && (
                          <img src={d.items.icon_url} alt="" width={20} height={20} style={{ imageRendering: 'pixelated' }} />
                        )}
                        {d.items?.name_en ?? '—'}
                      </span>
                    </td>
                    <td data-label="อัตราดรอป" className="num">{d.rate}%</td>
                  </tr>
                ))}
                {(drops ?? []).length === 0 && (
                  <tr><td colSpan={2} data-label="" style={{ color: 'var(--faint)' }}>ไม่มีข้อมูลของที่ดรอป</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="card">
            <h2 className="section-title">จุดเกิด</h2>
            {(spawns ?? []).length === 0 ? (
              <p style={{ color: 'var(--faint)' }}>ไม่มีข้อมูลจุดเกิด</p>
            ) : (
              <ul style={{ listStyle: 'none', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {(spawns ?? []).map((s: any) => (
                  <li key={s.map_code}>
                    <Link href={`/database/maps/${encodeURIComponent(s.map_code)}`} className="chip">
                      {s.map_display_name ?? s.map_code}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card">
            <h2 className="section-title">สกิลที่มอนใช้</h2>
            {(monsterSkills ?? []).length === 0 ? (
              <p style={{ color: 'var(--faint)' }}>ไม่มีข้อมูลสกิล</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr><th>สกิล</th><th className="num">Lv</th><th className="num">โอกาส</th><th>ตอน</th></tr>
                </thead>
                <tbody>
                  {(monsterSkills ?? []).map((s: any, i: number) => (
                    <tr key={i}>
                      {/* skill_name is the game's internal constant. The feed
                          gives no display name here, and inventing one would
                          be inventing a game value. */}
                      <td data-label="" className="mono">{s.skill_name}</td>
                      <td data-label="Lv" className="num">{num(s.skill_lv)}</td>
                      <td data-label="โอกาส" className="num">{s.rate === null ? '—' : `${s.rate}%`}</td>
                      <td data-label="ตอน">{s.state ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <FeedbackButton pageType="monster" entityId={String(monster.id)} />
      </div>
    </main>
  );
```

Add `import Link from 'next/link';`, `import AggroBadge from '@/components/AggroBadge';`, and `import { aggroLevel } from '@/lib/aggro-tier';` at the top if they are not already there.

**`monster.avg_zeny_per_kill` is not on the `monsters` table** — it lives on the `monster_farming_stats` view. Fetch it with its own query beside the others:

```tsx
  const { data: farming } = await db
    .from('monster_farming_stats')
    .select('avg_zeny_per_kill')
    .eq('monster_id', id)
    .maybeSingle();
```

and read `farming?.avg_zeny_per_kill` where the code above says `monster.avg_zeny_per_kill`.

- [ ] **Step 4: Add the layout styles**

Append to `app/globals.css`:

```css
/* Monster detail: two columns on desktop, one on a phone. Deliberately not
   tabs -- 524 of these pages are the site's main search entry point, and
   content inside an unopened tab is both worse for search and invisible to
   Ctrl+F. */
.detail-cols {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-top: 20px;
  align-items: start;
}

@media (max-width: 900px) {
  .detail-cols { grid-template-columns: 1fr; }
}

.section-title {
  font: 700 15px/1.4 "Chakra Petch", sans-serif;
  color: var(--text);
  margin-bottom: 10px;
}

.reward-row { display: flex; flex-wrap: wrap; gap: 28px; }
.reward-row > div { display: flex; flex-direction: column; gap: 2px; }
.reward-label { font: 600 12px/1.4 "Sarabun", sans-serif; color: var(--faint); text-transform: uppercase; letter-spacing: 0.04em; }
.reward-value { font-size: 22px; color: var(--text); }

.chip {
  display: inline-block;
  padding: 4px 10px;
  border: 1px solid var(--hair);
  border-radius: 999px;
  background: var(--panel-2);
  color: var(--dim);
  font: 500 13px/1.6 "Sarabun", sans-serif;
  text-decoration: none;
}

.chip:hover { color: var(--text); border-color: var(--cyan); }
```

- [ ] **Step 5: Check it in a browser**

Open these four monsters and report what each shows:
- `/database/monsters/1002` (Poring) — a plain, complete monster. Every section populated, aggro badge reads ปลอดภัย.
- `/database/monsters/1029` (Isis) — `base_exp` is 0, the unknown sentinel. **Base EXP must read `—`, not `0`.** Aggro badge reads เข้าตีเอง.
- `/database/monsters/1185` (Whisper) — `hp` is 0 and all six base stats are null. Those cells must be em-dashes.
- `/database/monsters/1039` (Baphomet) — MVP flag set, and it has several skills including two `NPC_SUMMONSLAVE` entries at different levels. **Both must appear**; if only one does, the entry-index work from Wave 1 has regressed.

Also confirm: no tabs anywhere on the page; the Zeny tooltip appears on hover; a spawn chip navigates to the map page; and at 340px the two columns become one with nothing cut off.

- [ ] **Step 6: Run the suite and commit**

Run: `npm test && npx tsc --noEmit && npm run build`

```bash
git add "app/database/monsters/[id]/page.tsx" app/globals.css
git commit -m "feat: rebuild monster detail with stats, skills, spawns and aggro badge"
```

---

### Task 6: Item detail — description and prices

Spec §3.17 item 11. Wave 1 added `items.description` for all 1,213 items that have one, and the page still does not show it. Buy and sell price are also on the table and unused.

**Files:**
- Modify: `app/database/items/[id]/page.tsx`

**Interfaces:** consumes only what the file already imports.

- [ ] **Step 1: Read the current page**

Read `app/database/items/[id]/page.tsx` in full. Keep `getItem`, `generateMetadata`, and the error-versus-notFound split exactly as they are.

- [ ] **Step 2: Add the description and price sections**

Replace the existing stats card — the `<div className="card" style={{ marginTop: 20 }}>` block holding the ATK line and the equippable-classes line — with:

```tsx
      <div className="card" style={{ marginTop: 20 }}>
        {item.atk !== null && (
          <p>
            ATK {item.atk}
            {item.weapon_level !== null ? ` · Weapon Lv.${item.weapon_level}` : ''}
            {item.required_level !== null ? ` · ใช้ได้ที่เลเวล ${item.required_level}` : ''}
          </p>
        )}
        {item.equippable_classes.length > 0 && <p>สวมใส่ได้: {item.equippable_classes.join(', ')}</p>}
        <div className="reward-row" style={{ marginTop: 12 }}>
          <div>
            <span className="reward-label">ราคาซื้อ</span>
            <span className="reward-value mono">
              {item.buy_price === null ? '—' : item.buy_price.toLocaleString('en-US')}
            </span>
          </div>
          <div>
            <span className="reward-label">ราคาขาย</span>
            <span className="reward-value mono">
              {item.sell_price === null ? '—' : item.sell_price.toLocaleString('en-US')}
            </span>
          </div>
        </div>
      </div>

      {item.description && (
        <div className="card" style={{ marginTop: 20 }}>
          <h2 className="section-title">คำอธิบาย</h2>
          {/* Newlines in the source text carry meaning -- each effect is its
              own line -- so they are preserved rather than collapsed. */}
          <p style={{ whiteSpace: 'pre-line', color: 'var(--dim)' }}>{item.description}</p>
        </div>
      )}
```

`.reward-row`, `.reward-label`, `.reward-value` and `.section-title` come from Task 5's CSS. If Task 5 has not landed yet, add that CSS block here instead and note it in your report so Task 5 does not duplicate it.

- [ ] **Step 3: Check it in a browser**

Report what you see for each:
- `/database/items/4118` (Ground Petite Card) — the description renders on multiple lines, including the malformed `Equipped on : c` line, verbatim.
- `/database/items/516` (Sweet Potato) — `atk` and `required_level` are null, so no ATK line appears at all, and prices show either a number or `—`.
- An item with no description shows no description card rather than an empty one.

- [ ] **Step 4: Run the suite and commit**

Run: `npm test && npx tsc --noEmit`

```bash
git add "app/database/items/[id]/page.tsx"
git commit -m "feat: show item description and prices on the detail page"
```

---

### Task 7: Global search across all six

Spec §6.3. Search covers monsters and items. The site now lists six kinds of thing, and a player who types a card name and gets nothing stops trusting the box. The spec also notes this unlocks two deferred design changes: the search-led nav (§6.1 option D) and the search-led homepage (§6.2) are both blocked on exactly this.

**Files:**
- Modify: `lib/search.ts`, `lib/search.test.ts`, `components/GlobalSearch.tsx`

**Interfaces:**
- Produces:
  - `export type SearchType = 'monster' | 'item' | 'card' | 'equipment' | 'skill' | 'map'`
  - `export interface SearchResult { type: SearchType; id: string; name: string; href: string; iconUrl: string | null }`
  - `export interface SearchGroups { monsters: SearchRow[]; items: SearchRow[]; cards: SearchRow[]; equipment: SearchRow[]; skills: SkillSearchRow[]; maps: MapSearchRow[] }`
  - `export function mergeSearchResults(groups: SearchGroups): SearchResult[]`
  - `export const SEARCH_TYPE_LABELS: Record<SearchType, string>`

**Note:** `SearchResult.id` becomes a string because skills are keyed by slug and maps by code, neither of which is a number. Cards and equipment link to `/database/items/[id]` — they are items, and giving them their own badge is what tells the player which kind of thing they found.

- [ ] **Step 1: Write the failing test**

Replace the contents of `lib/search.test.ts` with:

```ts
import { describe, it, expect } from 'vitest';
import { mergeSearchResults, SEARCH_TYPE_LABELS, type SearchGroups } from './search';

const empty: SearchGroups = { monsters: [], items: [], cards: [], equipment: [], skills: [], maps: [] };

describe('mergeSearchResults', () => {
  it('returns nothing for empty groups', () => {
    expect(mergeSearchResults(empty)).toEqual([]);
  });

  it('builds a monster result with the right href and icon', () => {
    const [r] = mergeSearchResults({ ...empty, monsters: [{ id: 1002, name_en: 'Poring', image_url: '/images/monsters/1002.gif' }] });
    expect(r).toEqual({ type: 'monster', id: '1002', name: 'Poring', href: '/database/monsters/1002', iconUrl: '/images/monsters/1002.gif' });
  });

  it('sends a card to the item detail page but labels it a card', () => {
    // Cards are items. The href must reach a real page; the badge is what
    // tells the player which kind of thing they found.
    const [r] = mergeSearchResults({ ...empty, cards: [{ id: 4118, name_en: 'Ground Petite Card', icon_url: '/images/items/4118.gif' }] });
    expect(r.type).toBe('card');
    expect(r.href).toBe('/database/items/4118');
  });

  it('sends equipment to the item detail page but labels it equipment', () => {
    const [r] = mergeSearchResults({ ...empty, equipment: [{ id: 1201, name_en: 'Knife', icon_url: null }] });
    expect(r.type).toBe('equipment');
    expect(r.href).toBe('/database/items/1201');
  });

  it('keys a skill by slug, not by a numeric id', () => {
    const [r] = mergeSearchResults({ ...empty, skills: [{ slug: 'bash', name: 'Bash', icon_url: '/images/skills/x.webp' }] });
    expect(r).toEqual({ type: 'skill', id: 'bash', name: 'Bash', href: '/database/skills?q=Bash', iconUrl: '/images/skills/x.webp' });
  });

  it('keys a map by code and falls back to the code when it has no name', () => {
    // Only 245 of 497 maps carry a display name. A blank result row is worse
    // than one showing the code.
    const [r] = mergeSearchResults({ ...empty, maps: [{ map_code: 'moc_f18_a', map_display_name: null }] });
    expect(r.name).toBe('moc_f18_a');
    expect(r.href).toBe('/database/maps/moc_f18_a');
  });

  it('uses the display name when a map has one', () => {
    const [r] = mergeSearchResults({ ...empty, maps: [{ map_code: 'prontera', map_display_name: 'Prontera' }] });
    expect(r.name).toBe('Prontera');
  });

  it('url-encodes a map code that needs it', () => {
    const [r] = mergeSearchResults({ ...empty, maps: [{ map_code: 'a b', map_display_name: null }] });
    expect(r.href).toBe('/database/maps/a%20b');
  });

  it('keeps every group and orders them monsters, items, cards, equipment, skills, maps', () => {
    const results = mergeSearchResults({
      monsters: [{ id: 1, name_en: 'M', image_url: null }],
      items: [{ id: 2, name_en: 'I', icon_url: null }],
      cards: [{ id: 3, name_en: 'C', icon_url: null }],
      equipment: [{ id: 4, name_en: 'E', icon_url: null }],
      skills: [{ slug: 's', name: 'S', icon_url: null }],
      maps: [{ map_code: 'p', map_display_name: null }],
    });
    expect(results.map((r) => r.type)).toEqual(['monster', 'item', 'card', 'equipment', 'skill', 'map']);
  });

  it('defaults a missing icon to null rather than undefined', () => {
    const [r] = mergeSearchResults({ ...empty, items: [{ id: 9, name_en: 'X' }] });
    expect(r.iconUrl).toBeNull();
  });
});

describe('SEARCH_TYPE_LABELS', () => {
  it('has a distinct Thai label for every type', () => {
    const labels = Object.values(SEARCH_TYPE_LABELS);
    expect(labels).toHaveLength(6);
    expect(new Set(labels).size).toBe(6);
    for (const l of labels) expect(l.trim().length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npm test -- lib/search.test.ts`
Expected: FAIL — `mergeSearchResults` still takes two array arguments.

- [ ] **Step 3: Rewrite the module**

Replace the contents of `lib/search.ts` with:

```ts
// Search covers everything the site lists. A player who types a card name and
// gets nothing stops trusting the box, and two deferred design changes -- the
// search-led nav and the search-led homepage -- are both blocked on this
// covering all six.

export type SearchType = 'monster' | 'item' | 'card' | 'equipment' | 'skill' | 'map';

export interface SearchRow {
  id: number;
  name_en: string;
  image_url?: string | null;
  icon_url?: string | null;
}

export interface SkillSearchRow {
  slug: string;
  name: string;
  icon_url?: string | null;
}

export interface MapSearchRow {
  map_code: string;
  map_display_name: string | null;
}

export interface SearchGroups {
  monsters: SearchRow[];
  items: SearchRow[];
  cards: SearchRow[];
  equipment: SearchRow[];
  skills: SkillSearchRow[];
  maps: MapSearchRow[];
}

export interface SearchResult {
  // A string, because skills are keyed by slug and maps by code.
  id: string;
  type: SearchType;
  name: string;
  href: string;
  iconUrl: string | null;
}

export const SEARCH_TYPE_LABELS: Record<SearchType, string> = {
  monster: 'มอนสเตอร์',
  item: 'ไอเทม',
  card: 'การ์ด',
  equipment: 'อุปกรณ์',
  skill: 'สกิล',
  map: 'แมพ',
};

function fromItemRow(row: SearchRow, type: SearchType): SearchResult {
  return {
    id: String(row.id),
    type,
    name: row.name_en,
    // Cards and equipment are items and share the item detail page. The badge
    // is what tells the player which kind of thing they found.
    href: `/database/items/${row.id}`,
    iconUrl: row.icon_url ?? null,
  };
}

export function mergeSearchResults(groups: SearchGroups): SearchResult[] {
  return [
    ...groups.monsters.map((m) => ({
      id: String(m.id),
      type: 'monster' as const,
      name: m.name_en,
      href: `/database/monsters/${m.id}`,
      iconUrl: m.image_url ?? null,
    })),
    ...groups.items.map((i) => fromItemRow(i, 'item')),
    ...groups.cards.map((c) => fromItemRow(c, 'card')),
    ...groups.equipment.map((e) => fromItemRow(e, 'equipment')),
    ...groups.skills.map((s) => ({
      id: s.slug,
      type: 'skill' as const,
      name: s.name,
      // There is no skill detail page: the browser's own search is the
      // destination, which keeps the result honest about what exists.
      href: `/database/skills?q=${encodeURIComponent(s.name)}`,
      iconUrl: s.icon_url ?? null,
    })),
    ...groups.maps.map((m) => ({
      id: m.map_code,
      type: 'map' as const,
      // Only 245 of 497 maps have a display name; a blank row is worse than
      // one showing the code.
      name: m.map_display_name ?? m.map_code,
      href: `/database/maps/${encodeURIComponent(m.map_code)}`,
      iconUrl: null,
    })),
  ];
}
```

- [ ] **Step 4: Run it and watch it pass**

Run: `npm test -- lib/search.test.ts`
Expected: PASS, all twelve.

- [ ] **Step 5: Prove the tests can fail**

Change the map name fallback to `m.map_display_name ?? ''`; confirm the unnamed-map case goes red; restore. Then drop `encodeURIComponent` from the map href; confirm the encoding case goes red; restore and confirm green. Commit neither broken version.

- [ ] **Step 6: Query all six in the component**

Read `components/GlobalSearch.tsx`. It currently runs two queries in a `Promise.all` and passes two arrays to `mergeSearchResults`. Replace that block with six queries and one grouped call:

```tsx
      const [monsters, items, cards, equipment, skills, maps] = await Promise.all([
        db.from('monsters').select('id, name_en, image_url').ilike('name_en', `%${query}%`).limit(5),
        // Items excludes cards and equipment so the same row cannot appear
        // twice under two different badges.
        db.from('items').select('id, name_en, icon_url')
          .not('category', 'in', '("Card","Armor","Weapon","Costume Equipment")')
          .ilike('name_en', `%${query}%`).limit(5),
        db.from('items').select('id, name_en, icon_url').eq('category', 'Card').ilike('name_en', `%${query}%`).limit(5),
        db.from('items').select('id, name_en, icon_url')
          .in('category', ['Armor', 'Weapon', 'Costume Equipment'])
          .ilike('name_en', `%${query}%`).limit(5),
        db.from('skills').select('slug, name, icon_url').ilike('name', `%${query}%`).limit(5),
        db.from('monster_spawns').select('map_code, map_display_name').ilike('map_code', `%${query}%`).limit(20),
      ]);

      // monster_spawns has one row per monster per map, so a map with forty
      // monsters would otherwise fill the result list with forty copies of
      // itself. Over-fetch, then keep the first of each code.
      const seenMaps = new Set<string>();
      const uniqueMaps = (maps.data ?? []).filter((m) => {
        if (seenMaps.has(m.map_code)) return false;
        seenMaps.add(m.map_code);
        return true;
      }).slice(0, 5);

      setResults(
        mergeSearchResults({
          monsters: monsters.data ?? [],
          items: items.data ?? [],
          cards: cards.data ?? [],
          equipment: equipment.data ?? [],
          skills: skills.data ?? [],
          maps: uniqueMaps,
        }),
      );
```

- [ ] **Step 7: Badge each result with its type**

In the same file, find where a result row is rendered and add the type label beside the name, reading it from `SEARCH_TYPE_LABELS[result.type]`. Import that constant alongside the existing imports. Style it with `var(--faint)` at a smaller size — a label, not a heading. Without it a card and an item are indistinguishable in the list, which is the confusion this task exists to remove.

Note also that `result.id` is now a string, so any `key={result.id}` still works but any arithmetic on it would not. Search the file for other uses of `id` before finishing.

- [ ] **Step 8: Check it in a browser**

Type each of these into the search box and report what comes back:
- `poring` — monster results with a มอนสเตอร์ badge.
- `petite` — `Ground Petite Card` with a การ์ด badge, going to `/database/items/4118`.
- `knife` — equipment with an อุปกรณ์ badge.
- `bash` — a skill with a สกิล badge, landing on the skills page filtered to it.
- `prontera` — the map **once**, not once per monster that spawns there.
- A query matching an item in more than one category — confirm no row appears twice.

- [ ] **Step 9: Run the suite and commit**

Run: `npm test && npx tsc --noEmit && npm run build`

```bash
git add lib/search.ts lib/search.test.ts components/GlobalSearch.tsx
git commit -m "feat: search across monsters, items, cards, equipment, skills and maps"
```

---

## Wave 2A done criteria

All must hold before this plan is considered finished:

1. `npm test` passes, `npx tsc --noEmit` is clean, `npm run build` exits 0.
2. Every new test has been shown to fail when its subject is broken.
3. All six nav links under ฐานข้อมูล are live — no `ready: false` remains on a route that now exists.
4. The skills page's two tabs sum to 851.
5. Every skill icon renders; none is an empty frame.
6. Isis (`/database/monsters/1029`) shows `—` for Base EXP, never `0`.
7. Baphomet (`/database/monsters/1039`) lists both `NPC_SUMMONSLAVE` rows.
8. Searching `prontera` returns the map once.
9. Every new page renders correctly at 340px with no horizontal page scroll.
10. `/database/maps/does_not_exist` returns 404, not a 200 with an empty table.

## Not in Wave 2A

Wave 2B, with its own plan: the hybrid homepage (§6.2), the element damage table (§3.5), the farm planner (§3.6), the AFK finder (§3.8), kills-per-hour plus aggro badges on the remaining list pages (§3.15.1, §3.15.3), and the ±40-level drop-penalty warning (§3.9).

Still deferred by the spec: Stat Calculator, DPS Calculator, skill tree planner, affix scorer, per-page OG images, quests and NPCs.
