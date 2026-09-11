# Farm tool integration: one data source, one rule set, four distinct modes

Date: 11 Sep 2026
Status: approved by the owner (section 1 reviewed in chat; "โอเคทำเลย" for the rest)
Route: `/tools/leveling-spots` (ฟาร์มที่ไหนดี)

## Why

The farm tool has four modes that were built at different times and disagree with each other.

| | เก็บเลเวล | ทิ้งบอท AFK | รายการของฉัน | หาเงิน |
|---|---|---|---|---|
| Inputs | level + damage ASPD HIT | style + damage ASPD HIT FLEE level max-hits | damage ASPD HIT level | style + damage ASPD/cast HIT FLEE |
| Output | map table | monster table (18,681 px tall on a phone) | planned-monster table | picture cards |
| Safety rule | none | dodge + hit ≥80% + ≤N hits | none | dodge only |
| Zeny per kill | none | none | DB view (counts MVP and luck drops) | own computation (does not) |
| Level drop penalty | no | yes | yes | no |
| Data loading | server, level window | browser loader | browser query | server route |

Observed on production, 11 Sep 2026 (Lv 45 character):

- The level mode's #1 map was Prontera Field with a single Eclipse. It claimed 11,556,000 EXP/hour. #2 was a lone Dragon Fly. Both are one-at-a-time spawns, which is the same fault the zeny mode had before its MVP/solo rule.
- Zeny mode ignores the level drop penalty. A Lv 60 character is shown pay_fild02 at 583k z/hour, but its monsters are Lv 17-18. That is more than 40 levels apart, so the real drops are halved.

Usage, GA4 30 days: the page had 876 views (6th on the site). tool_use by mode: AFK 100, level 41, plan 3. Search Console, 90 days: 0 impressions for any leveling-spots URL. The same query on other pages returns rows (monsters 694, skills 613), so the query itself works. GA4 does count 21 "Organic Search" sessions landing on the page; this is unexplained, possibly another search engine.

## Decisions (grilled with the owner)

1. **Each mode answers one player question.**
   - เก็บเลเวล: where do I level by hand now.
   - ทิ้งบอท AFK: where does a bot collect EXP overnight and survive. This mode becomes **per map**.
   - หาเงิน: where does a bot collect zeny overnight and survive.
   - รายการของฉัน: compare the monsters I picked, EXP and zeny side by side.
2. **One input bar above the mode tabs, shared by all modes.** Fields: style, level, damage, ASPD (casters: seconds per cast), HIT, FLEE. Every field is optional. The bar collapses to one summary line once filled. Each mode says which fields it uses and which are missing.
3. **One safety rule for both overnight modes.**
   - A map is out when any monster on it (MVP and solo included) hits past the AFK dodge cap, or has no FLEE figure.
   - Low hit chance and long fights do not remove a map; they lower the per-hour figure.
   - Risky skills become card tags.
   - The "kill within N hits" field is removed.
4. **One card design for every mode.** Map modes share a map card; the plan mode uses a monster card. The top 3 are large, places 4-10 are compact, and the rest fold away.
5. **Level drop penalty, confirmed rows only.**
   - A gap of 19 or less counts in full.
   - A gap above 40 is halved in the figure.
   - A gap of 20-40 counts in full, with a tag that says the rate is unconfirmed.
   - With no level entered there is no penalty, and the page says so.
6. **Architecture A:** one data payload and one rule library, computed in the browser for every mode. The server renders only the header and the mode descriptions.

Carried over from the zeny grilling: MVPs and monsters whose every spawn point holds one never count toward any ranking. A drop counts toward an overnight figure only if a night of 8 hours would see it at least 3 times. The wording is "เฉลี่ยตัวละ", "z/ชม.", and "ทั้งคืน 8 ชม.".

## 1. Architecture and data flow

1. `app/tools/leveling-spots/page.tsx` (server) renders PageHeader, a short crawlable paragraph naming the four modes, and `<FarmTool initialMode initialLevel />`. It no longer queries the database.
2. `app/tools/leveling-spots/farm-data/route.ts` returns one JSON payload, `FarmData`. It replaces `zeny-data`.
   - **monsters:** every non-C monster. Fields: id, name, level, hp (null if unknown), baseExp (null if 0/unknown), sprite, isMvp, solo, isAggressive, flee95, hit100, priced drops `{rate, sell}`, unpriced count, perKill, best drop, risky skills `{skillName, risk}`.
   - **maps:** walk-in canonical maps with channels folded (largest count). Fields: code, name, image, spawns `{id, amount}`.
   - **excluded:** counts of MVP and solo monsters.
   - **coverage:** priced items and rated drops.
   - On a read failure it returns `503` with `cache-control: no-store`. On success, `cache-control: public, s-maxage=3600`. The deploy script purges the CDN.
3. `lib/use-farm-data.ts` is a client hook. It fetches once per page view, exposes `{data, failed, retry}`, and is shared by every mode.
4. `lib/farm-engine/` holds the rule library: pure functions with no React. Details in section 2.
5. Components:
   - `FarmTool` replaces `FarmSpots`. It owns the bar, the tabs, the URL sync (`?mode=`, `?level=` via `replaceState`) and the single `useToolUse`.
   - `FarmNumbersBar`.
   - `MapCard` and `MonsterCard`.
   - `LevelView`, `AfkView`, `ZenyView`, `PlanView`. These are thin: engine in, cards out.

Deleted: `LevelingSpots.tsx`, `AfkFinderResults.tsx`, `FarmPlannerBoard.tsx`, `ZenyFarm.tsx`, `lib/afk-candidates.ts`, `zeny-data/route.ts`, and `lib/leveling-spots.ts` once its tested pieces have moved.

Kept: `FarmPlanProvider`, `AddToPlanButton`, `lib/farm-plan.ts`, `afkVerdict`, `killRate`, `dropPenalty`, `ToolNumbers` storage (`lib/player-numbers.ts`). Every inbound link (`?mode=afk|plan|zeny`, `?level=`) keeps working. `/tools/zeny-farm` keeps redirecting.

## 2. Rules (lib/farm-engine)

### Shared pieces

- **`population`.** `farmed(map)` is the monsters on a map that are not MVP, not solo, and have known HP. `met(map)` is every monster on the map; the safety gate uses it.
- **`player`.** `PlayerInput { style, level|null, damage|null, perSecond|null, hit|null, flee|null }`.
  - `canRate` = damage and perSecond both present. HIT is optional for melee; when missing, every swing is assumed to land, and the page says so.
  - `canGate` = flee present.
- **`safety`.**
  - `mapGate(map, player)` is `null` without FLEE. Otherwise it is a list of blockers: `dodge` (with the hit %) or `unknown_flee`, using `afkVerdict` with `maxHits = Infinity`. The strict cap applies when the style is magic, when the monster is aggressive or has an unknown flag, or when the map holds any aggressive or unknown-flag kind.
  - `mapTags(map)` gives the aggressive kind count and the risky skills present among `met`.
- **`drops`.**
  - `dropFactor(playerLevel, monsterLevel)`: 1 for none or unknown, 0.5 for halved. With no level it is 1.
  - `dropTag(...)` returns `unconfirmed` for a gap of 20-40 and `halved` for a gap over 40, so cards can say so.
  - `steadyZeny(monster, killsPerNight, factor)` sums only the drops with `rate/100 × factor × kills ≥ 3`.
- **`time`.** `secondsPerKill(monster, player)` wraps `killRate` with the player's hit chance.
- **`collapse`.** Channel fold for display, keyed on the mode's contributing monsters (id × amount), keeping the shortest code. It runs after the gate, so a safe channel is never hidden behind an unsafe copy.

### Per mode

Every map ranking needs `farmed` headcount ≥ 10 and at least one contributing monster.

**เก็บเลเวล (`rankLevel`)**
- Level = bar level, else `?level=`, else 50 (the card summary says "ยังไม่ได้กรอกเลเวล ใช้ 50").
- A map is eligible when some farmed monster has `levelWeight > 0` (±15).
- Without `canRate`: rank by density, Σ amount × baseExp × levelWeight. The headline is "เฉลี่ยตัวละ N EXP", the headcount-weighted baseExp over farmed monsters.
- With `canRate`: the headline is EXP/ชม., the headcount-weighted mean over **all farmed monsters on the map**. The old code counted only the ±15 window; the bot, or the player, meets everything on the map.
- No gate. Tags: aggressive kinds and risky skills.

**ทิ้งบอท AFK (`rankAfk`)**
- Contributors: farmed monsters with baseExp.
- Without `canRate`: rank by EXP per HP × headcount. The headline is "เฉลี่ยตัวละ N EXP".
- With `canRate`: the headline is EXP/ชม., with "ทั้งคืน 8 ชม. ราว N EXP" underneath.
- With `canGate`: blocked maps are listed separately with their blockers, like the zeny mode.
- Tags: risky skills and aggressive kinds.

**หาเงิน (`rankZeny`)**
- As shipped in 2560c4a, plus the level drop factor on every drop and the drop tags.

**รายการของฉัน (`comparePlan`)**
- For each planned monster id present in `data.monsters`, in the order added: EXP/ชม. and z/ชม. when `canRate`.
- z/ชม. uses steady drops over a night spent killing only that monster, times the drop factor.
- Also: "เฉลี่ยตัวละ Nz" from all drops times the factor, the player's hit %, the monster's hit % when HIT/FLEE are given, the drop tag, risky skills, an MVP/solo note, and the walk-in map holding most of it.
- The summary names the best EXP/ชม. and the best z/ชม. It never sums them.

Filters for AFK and zeny (both off by default): "เฉพาะแมพที่ไม่มีมอนโจมตีก่อน" and "เฉพาะแมพที่ไม่มีสกิลเสี่ยง".

## 3. Interface

**FarmNumbersBar**
- A style radio, then level · damage · ASPD (or seconds per cast) · HIT (melee only) · FLEE.
- It shows expanded when every field is empty. Otherwise it shows one line, "สายตี · Lv 45 · ดาเมจ 400 · ASPD 170 · HIT 290 · FLEE 260", with a "แก้" button that expands it.
- Values are stored in the existing `roz-calc:tool-numbers` key and the style in `roz-calc:afk-style`.

**Mode line** under the tabs: the blurb plus "ใช้: …". When something is missing it adds "กรอก FLEE เพิ่ม จะได้ตัดแมพที่หลบไม่พ้น".

**MapCard** props: rank, `big`, image, name, code, channels, `headline {label, value, unit}`, `stats [{label, value}]`, `monsters [{id, name, sprite, note}]`, `tags [{tone: 'warn'|'info', text, title}]`. It reuses the existing `.zfmap*` CSS, renamed to `.farmcard*` as it becomes shared.

**MonsterCard**: sprite, name, level, a headline number, a stats grid, tags, a map link, and an optional remove button (plan mode).

**Each view**
- A summary line, the podium (3), the list (4-10), and a fold for the rest (up to 40). The zeny mode keeps its "ฆ่า 1 ตัว ได้เงินเฉลี่ยเท่าไร" grid.
- Each mode has its own `Caveat`; the page-level caveat is removed.

**States**
- Loading: "กำลังโหลดแมพกับมอน…".
- Failure: a card with a retry button, saying the numbers entered are still kept.
- Empty with the gate on: names the monster most often blocking.
- Empty plan: links to the monster database.

## 4. Analytics, testing, rollout

- **Analytics.** One `useToolUse('leveling_spots', {mode, level, damage, aspd, hit, flee, style})` in FarmTool.
- **Unit tests** in `lib/farm-engine/*.test.ts`, one describe per rule and per mode.
  - The zeny tests move here, and the level density order test from `lib/leveling-spots.test.ts` stays.
  - Every new rule gets a mutation check: break it in a copy and confirm red.
- **Component tests.** The existing `farm-plan-flow.test.tsx` and `farm-planner-board.test.tsx` are rewritten against PlanView.
- **Browser check** with Playwright on the dev server: all four modes at 390 px and 320 px (no sideways overflow), with and without numbers, and the retry state when the route fails.
- **Rollout.** Tests, tsc, and a mobile screenshot pass. Then one commit per stage, then deploy with a marker that only the new build has, then purge and a production check.
