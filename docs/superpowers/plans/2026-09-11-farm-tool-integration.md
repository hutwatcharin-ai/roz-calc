# Farm Tool Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the four modes of `/tools/leveling-spots` read one data payload, apply one rule library, share one input bar and one card design, and still each answer a distinct player question.

**Architecture:** The server route `farm-data` builds one JSON payload of monsters and walk-in maps. A browser hook loads it once. The pure functions in `lib/farm-engine/` rank maps for three modes (level, afk, zeny) and compare planned monsters for the fourth. The React views are thin: they turn engine output into `MapCard` and `MonsterCard` props.

**Tech Stack:** Next.js 14 App Router, TypeScript, Supabase (PostgREST), Vitest (node for `.test.ts`, jsdom for `.test.tsx`), Playwright for the browser check.

**Spec:** `docs/superpowers/specs/2026-09-11-farm-tool-integration-design.md`

## Global Constraints

- Drop `rate` is a PERCENT (70 = 70%).
- Farmed population excludes `isMvp`, `solo` (no spawn point anywhere holds more than one), unknown HP, and unknown amount.
- The safety gate runs only when FLEE is known. A map fails when any monster on it fails the AFK dodge cap, or has no `flee95`. `maxHits` is not a gate.
- Drop factor: a level gap of 19 or less, or no level, is 1. A gap of 20-40 is 1 with a tag `unconfirmed`. A gap above 40 is 0.5 with a tag `halved`.
- A drop counts toward an overnight figure only if `rate/100 × factor × kills in 8 h ≥ 3`.
- `MIN_MOBS = 10`, `NIGHT_HOURS = 8`, `STEADY_DROPS_PER_NIGHT = 3`, level taper `LEVEL_SPAN = 15`, default level 50.
- Per-hour figures are ratio of means: Σ(amount × value) / Σ(amount × seconds) × 3600.
- UI wording: "เฉลี่ยตัวละ", "EXP/ชม.", "z/ชม.", "ทั้งคืน 8 ชม. ราว". Never put "≈" inside a mono number.
- Plan mode never sums rates across monsters.
- Every inbound URL keeps working: `?mode=level|afk|plan|zeny`, `?level=`, `/tools/zeny-farm`.
- Storage keys stay the same: `roz-calc:tool-numbers`, `roz-calc:afk-style`, `roz-calc:farm-plan`.
- Code comments are English. User-facing copy is Thai.
- Commit after each task. Never deploy if `git push` failed.

## File Structure

| File | Responsibility |
|---|---|
| `lib/farm-engine/types.ts` | Payload types, `PlayerInput`, constants |
| `lib/farm-engine/basics.ts` | Population, player readiness, kill time, drop factor, steady drops, channel collapse |
| `lib/farm-engine/safety.ts` | Map gate (blockers) and map tags |
| `lib/farm-engine/rank.ts` | `rankMaps(data, player, mode, opts)` for level, afk, zeny |
| `lib/farm-engine/plan.ts` | `comparePlan`, `topEarners` |
| `lib/farm-engine/*.test.ts` | Unit tests per file |
| `lib/zeny-farm.ts` | Trimmed to `zenyPerKill` and `walkInReason` (the route uses them) |
| `app/tools/leveling-spots/farm-data/route.ts` | Builds `FarmData` (replaces `zeny-data`) |
| `lib/use-farm-data.ts` | Client hook: load once, retry |
| `lib/use-bot-style.ts` | Client hook: melee/magic in `roz-calc:afk-style` |
| `components/farm/MapCard.tsx`, `MonsterCard.tsx`, `RankedMaps.tsx`, `BlockedMaps.tsx` | Shared presentation |
| `components/farm/FarmNumbersBar.tsx` | The one input bar |
| `components/farm/LevelView.tsx`, `AfkView.tsx`, `ZenyView.tsx`, `PlanView.tsx` | Mode views |
| `components/farm/FarmTool.tsx` | Bar, tabs, URL sync, analytics, loading/failure |
| `app/tools/leveling-spots/page.tsx` | Header, crawlable mode descriptions, `<FarmTool>` |

Deleted:
- `components/FarmSpots.tsx`, `LevelingSpots.tsx`, `AfkFinderResults.tsx`, `FarmPlannerBoard.tsx`, `ZenyFarm.tsx`.
- `components/farm-planner-board.test.tsx`.
- `lib/afk-candidates.ts`, `lib/leveling-spots.ts` and its test.
- `app/tools/leveling-spots/zeny-data/`.

---

### Task 1: Engine types and basics

**Files:**
- Create: `lib/farm-engine/types.ts`, `lib/farm-engine/basics.ts`
- Test: `lib/farm-engine/basics.test.ts`

**Interfaces:**
- Produces:
  - `FarmMonster`, `FarmMap`, `FarmData`, `PlayerInput`, `BotStyle`, `MapRow`.
  - Constants `NIGHT_HOURS`, `STEADY_DROPS_PER_NIGHT`, `MIN_MOBS`, `LEVEL_SPAN`, `DEFAULT_LEVEL`.
  - `metOn(map, monsters): MapRow[]` and `farmedOn(map, monsters): MapRow[]`.
  - `headcount(rows): number` and `levelWeight(monsterLevel, playerLevel): number`.
  - `canRate(p): boolean` and `canGate(p): boolean`.
  - `playerFromNumbers(numbers: PlayerNumbers, style: BotStyle): PlayerInput`.
  - `myHitChance(m, p): number | null` and `theirHitChance(m, p): number | null`.
  - `secondsPerKill(m, p): number | null`.
  - `dropFactor(playerLevel, monsterLevel): number` and `dropTag(playerLevel, monsterLevel): DropTag | null`.
  - `steadyPerKill(m, kills, factor): number`.
  - `collapseChannels<T extends { code: string; fingerprint: string; channels: number }>(list: T[]): T[]`.

- [ ] **Step 1: Write types.ts** (full content in the executed file; the fields exactly as listed in spec section 1, with `FarmSpawn.amount: number | null` and `FarmMonster.risks: RiskySkill[]`)
- [ ] **Step 2: Write failing tests** in `basics.test.ts`:
  - `farmedOn` drops MVP, solo, unknown HP, and unknown amount. `metOn` keeps them, with amount 0 when unknown.
  - `levelWeight(50,50)=1`, `levelWeight(65,50)=0`, never negative.
  - `canRate` needs damage and perSecond. `canGate` needs flee.
  - `playerFromNumbers`: melee uses `attacksPerSecond(aspd)`; magic uses `castsPerSecond(castSeconds)` and hit null.
  - `secondsPerKill` counts misses. `hp 100000`, damage 500, 2/s, hit 200 against hit100 220 gives 0.8 of the easy rate. A two-hit monster at 80% costs 2/3.
  - `dropFactor(60,18)=0.5`, `dropFactor(45,20)=1`, `dropFactor(null,1)=1`. `dropTag(45,20)='unconfirmed'`, `dropTag(60,18)='halved'`, `dropTag(45,40)=null`.
  - `steadyPerKill`: 14,400 kills at 0.01% × 1,000,000z is excluded; 50% × 10z is included. The factor 0.5 halves both the threshold count and the value.
  - `collapseChannels`: equal fingerprints fold with channels summed and the shortest code kept.
- [ ] **Step 3: Run** `npx vitest run lib/farm-engine/basics.test.ts`. Expect FAIL (module missing).
- [ ] **Step 4: Implement basics.ts**
- [ ] **Step 5: Run** the same. Expect PASS.
- [ ] **Step 6: Commit** `feat(farm-engine): shared population, kill time, drop factor and channel fold`

### Task 2: Safety and map ranking

**Files:**
- Create: `lib/farm-engine/safety.ts`, `lib/farm-engine/rank.ts`
- Test: `lib/farm-engine/safety.test.ts`, `lib/farm-engine/rank.test.ts`

**Interfaces:**
- Consumes: Task 1, plus `afkVerdict` from `lib/afk-safety`.
- Produces:
  - `Blocker { id, name, reason: 'dodge' | 'unknown_flee', theirHitPct }` and `mapBlockers(met, player): Blocker[] | null`.
  - `MapTags { aggressiveKinds; risks: { risk: SkillRisk; names: string[] }[] }` and `mapTags(met)`.
  - `RankMode = 'level' | 'afk' | 'zeny'`.
  - `RankedMap { code, name, image, mobs, avgPerKill, perHour, sortKey, top: { id, value, amount }[], blockers, tags, dropTags, fingerprint, channels }`.
  - `rankMaps(data, player, mode, opts: { level; cleanOnly?; noRiskOnly? }): { ranked; blocked }`.

- [ ] **Step 1: Failing tests**
  - **Safety:**
    - No FLEE gives null.
    - flee95 400 against FLEE 200 is a dodge blocker at 100%.
    - flee95 null is `unknown_flee`.
    - An MVP on the map still blocks.
    - Magic uses the strict cap.
    - Tags count aggressive kinds and group risky skills.
  - **Zeny** (ported from `lib/zeny-farm.test.ts`):
    - Zeny/HP × headcount without numbers.
    - MVP and solo are excluded.
    - Under 10 is ignored.
    - Channels fold.
    - 9,000 z/h.
    - Averages over what the bot meets (1,500).
    - The lucky drop is left out.
    - Dodge, unknown FLEE and MVP all block.
    - The safe channel is kept.
    - **New:** Lv 60 on Lv 18 is halved with the `halved` tag; Lv 45 on Lv 20 is full with the `unconfirmed` tag.
  - **Level** (ported from `lib/leveling-spots.test.ts`):
    - Density = Σ amount × baseExp × levelWeight.
    - A Lv 60 reader sees 1/3.
    - Null baseExp is ignored.
    - Population-mixed EXP/h.
    - A map with every monster outside ±15 is ineligible.
    - No gate, even with FLEE.
  - **AFK:**
    - EXP/HP × headcount without numbers.
    - EXP/h with numbers.
    - The gate.
    - `cleanOnly` and `noRiskOnly`.
- [ ] **Step 2:** `npx vitest run lib/farm-engine` → FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run → PASS.
- [ ] **Step 5:** Mutation check in a copy under `lib/__prove__/`. Break each rule and confirm red: steady threshold, dodge blocker, solo filter, safe-door filter, drop factor, level eligibility.
- [ ] **Step 6:** Commit `feat(farm-engine): one safety gate and one ranking for level, afk and zeny`

### Task 3: Plan comparison and top earners

**Files:**
- Create: `lib/farm-engine/plan.ts`
- Test: `lib/farm-engine/plan.test.ts`

**Interfaces:**
- Produces:
  - `PlanRow { m, expPerHour, zenyPerHour, zenyPerKill, myHitPct, theirHitPct, dropTag, homeMap }`.
  - `comparePlan(ids, data, player): { rows; missing; bestExp; bestZeny }`.
  - `topEarners(data, limit, playerLevel): { m; value }[]`.

- [ ] **Tests:**
  - Rows keep the plan order.
  - An unknown id goes to `missing`.
  - Without numbers the rates are null, but `zenyPerKill` = perKill × factor.
  - EXP/h = baseExp / seconds × 3600, and z/h uses steady drops.
  - The home map has the largest amount, with fewer aggressive kinds winning a tie.
  - `bestExp` and `bestZeny` are picked separately.
  - `topEarners` excludes MVP, solo and off-map monsters, and applies the factor.
- [ ] FAIL → implement → PASS.
- [ ] Commit `feat(farm-engine): compare planned monsters on EXP and zeny`

### Task 4: Data route and client hooks

**Files:**
- Create: `app/tools/leveling-spots/farm-data/route.ts`, `lib/use-farm-data.ts`, `lib/use-bot-style.ts`
- Modify: `lib/zeny-farm.ts` (keep `DropRow`, `zenyPerKill`, `walkInReason`) and its test
- Delete: `app/tools/leveling-spots/zeny-data/`

**Route rules:**
- All non-C monsters, with `baseExp` (null for 0) and `risks` from paginated `monster_skills`.
- Unknown amounts stay null; the fold takes the maximum known amount.
- `solo` = at least one known amount, and none above 1.
- `excluded` counts only monsters on a walk-in map.
- Success: `cache-control: public, s-maxage=3600`. Failure: `503 no-store`.

**Hook:** `useFarmData()` returns `{ data, failed, retry }`.

- [ ] Write, run tsc, `curl` the route (expect 200). Commit `feat: one farm-data payload for every farm mode`

### Task 5: Shared cards

**Files:**
- Create: `components/farm/MapCard.tsx`, `MonsterCard.tsx`, `RankedMaps.tsx`, `BlockedMaps.tsx`
- Modify: `app/globals.css`
  - Rename `zfmap→farmcard`, `zfmob→farmmob`, `zfmon→farmmon`, `zf-→farm-`.
  - Add `.farmbar*`.
  - Tags reuse `.tag--risk` (warn) and `.tag--unknown` (info).

- [ ] Write, run tsc, commit `feat: shared farm map and monster cards`

### Task 6: Input bar, views, tool, page

**Files:**
- Create: `components/farm/FarmNumbersBar.tsx`, `LevelView.tsx`, `AfkView.tsx`, `ZenyView.tsx`, `PlanView.tsx`, `FarmTool.tsx`, `plan-view.test.tsx`
- Modify: `app/tools/leveling-spots/page.tsx`
- Delete: `components/FarmSpots.tsx`, `LevelingSpots.tsx`, `AfkFinderResults.tsx`, `FarmPlannerBoard.tsx`, `ZenyFarm.tsx`, `farm-planner-board.test.tsx`, `lib/afk-candidates.ts`, `lib/leveling-spots.ts`, `lib/leveling-spots.test.ts`

**Behaviour:**
- **Bar fields.** Melee: `level, damagePerHit, aspd, hit, flee`. Magic: `level, damagePerHit, castSeconds, flee`. Collapses to a summary once any value exists.
- **Level.** `numbers.level ?? URL level ?? 50`; when guessed, the view says so.
- **URL sync.** `replaceState` for mode and level.
- **Analytics.** One `useToolUse`.
- **Loading and failure** are handled once, with a retry button.
- **PlanView tests** (data as a prop):
  - Lists names and the home map.
  - Shows the empty message.
  - Remove writes storage.
  - Never shows "รวม".

- [ ] Write, delete, then tsc and full vitest. Commit `feat: farm tool reads one payload through one bar and one card design`

### Task 7: Verify and ship

- [ ] Full vitest and tsc.
- [ ] Playwright, all four modes at 390 px and 320 px, with and without numbers:
  - No sideways overflow.
  - The level mode's #1 map is not a single-monster map.
  - The failure state is shown when the route is aborted.
- [ ] Push with retries. Deploy with a marker only the new build has (the crawlable mode description), then purge and check production.
