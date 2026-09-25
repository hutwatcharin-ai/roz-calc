# Plan: เครื่องมือ "อยากได้สเตตัสเท่านี้ ต้องใส่อะไร" (stat target builder)

Written 25 Sep 2026 from the owner's brief. Decisions the owner already made are
marked **[owner]**; everything else is a proposal to be confirmed on the preview.

## What it does

The player types what they have and what they want; the tool shows every way
in the game to close the gap, and can assemble a set for them.

- Input: job, base level, the stat's current value read off Alt+A, the target.
  v1 stats: **FLEE, HIT, CRI** (additive, formulas already in `lib/hit-flee.ts`;
  AGI/DEX/LUK on gear convert 1:1 / 1:1 / per the game's CRI formula).
- Output: the gap, then candidates per equipment slot, each with how much it
  adds and what it costs to get that amount, and a running total.
- Two modes, both **[owner]**:
  - **จัดให้เอง** — one button fills every slot with the biggest contributor
    the job can wear at that level, cards into the slotted pieces, random
    options counted at their max. The player then swaps pieces.
  - **เลือกเอง** — the same candidate lists, nothing pre-picked, total updates.

## Where the numbers come from (in the order the page shows them)

1. Flat bonuses written on the item ("FLEE +10") and on cards. Parsed from the
   client's own Thai text (`data/game-items.json`), English DB text as fallback.
2. Base-stat bonuses converted: AGI → FLEE, DEX → HIT, LUK → CRI (formula in
   `lib/hit-flee.ts`; CRI per the renewal formula, to be added and tested).
3. **Random options, counted as obtainable** **[owner]**: the market sells rolled
   pieces, so a slot's random-option line is listed like any other source, with
   its min–max (armour/garment/shoes line 2: FLEE 5–15 each; shoes line 2:
   HIT 5–10; weapon lv2–4 line 2: HIT 5–20, CRI 2–5; blacksmith-forged: HIT
   1–40, CRI 1–20 — `lib/data/random-option-pools.json`). Labelled "ซื้อจากตลาด
   หรือทอยเอง"; the tool never claims odds (weights are unknown).
4. Refine-conditional bonuses ("ถึง +7: FLEE +10", "ทุก +2: FLEE +8") shown
   **with the refine they need, never asked up front** **[owner]**: the row says
   "ต้องตี +7"; the player who won't refine simply picks something else. The
   parser for these already exists for ★ gear (`scripts/build-star-gear.py`,
   `split_thai`) and is generalised here.
5. Other ways, after gear: a hand-kept list of buffs/foods that add the stat
   (Increase AGI, Blessing, …). No data for this exists in the repo yet; v1
   ships the list empty-but-present ("ยังไม่มีข้อมูล") rather than invented.

## Slots and rules

Slots: หมวกบน / กลาง / ล่าง, เสื้อ, อาวุธ, โล่, ผ้าคลุม, รองเท้า, เครื่องประดับ ×2.
A card goes only into a piece with a slot of the card's type (`lib/card-slot`).
Two-handed weapons block the shield slot. Job gating via `lib/equip-filter.ts`
(already maps "Swordsman Class" / "All Jobs except Novice" etc.). Costume
Equipment is excluded (no stats). Items the live client does not have are
excluded (`lib/game-absent`).

## Build order (each step previewed on the Tailscale link before deploy)

1. **Parser + data + tests.** `scripts/build-stat-sources.py` → `data/stat-sources.json`:
   per item/card `{ stat, value, condition: null | {refineAtLeast} | {everyRefine, value} }`
   plus slot, jobs, level. A test file with ~30 hand-checked items (positive,
   negative "FLEE −40", conditional, percent-not-flat, AGI-converted) that
   must fail when the parser is broken. Also a coverage print: how many
   items give each stat, so the page can say it.
2. **Read-only page** `/tools/stat-target`: inputs + candidate tables per slot,
   each row showing the item, the amount, the condition, and the item's own
   text so the number can be checked against the source. No picking yet.
3. **Manual picker** with running total, URL-encoded so a set can be shared.
4. **จัดให้เอง** button (greedy per slot on certain sources first, then random
   options if still short). Explain the choice in one line per slot.
5. **Buffs/foods list** once the owner supplies the values from the game.

## Validation

- Parser tests as above (prove they fail: corrupt a fixture, see red).
- Formula tests for FLEE/HIT/CRI vs level and base stats (match the existing
  hit-flee tool's numbers).
- Owner equips a suggested set in game and compares Alt+A against the tool's
  total — the only check that catches wrong game rules, not just wrong parsing.

## Risks

- Parsing Thai item text: a missed condition turns "ถึง +9 FLEE +20" into a
  flat +20. Mitigation: show the source line on every row; tests on the
  patterns the ★ page already met.
- Job strings are inconsistent ("Swordsman" vs "Swordsman Class"): reuse
  `lib/equip-filter.ts`, do not write a second mapping.
- Random-option pools are TW-official via prontera; if Global differs the
  ranges are wrong. Source line says so.
- CRI formula in renewal (LUK/3 + 1, plus modifiers) needs a test against a
  known in-game value before it is shown.
- Scope creep into ASPD / MaxHP: not additive the same way; keep to v1 stats.

## Open questions for the owner

- Which jobs to offer in the dropdown: the 19 in `lib/class-guides`, or also
  Novice/High variants?
- Headgear: real (non-costume) headgear exists but is rare in Zero — include?
- Name for the tool in the nav (working title: "จัดของให้ถึงค่า").
