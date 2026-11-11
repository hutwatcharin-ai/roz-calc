# Dress-up Effect Costumes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Draw hat-effect costumes (auras, landmarks, effect wings) in the dress-up room, animated and placed as in game.

**Architecture:** Offline Python reads the client's `.str` effect files, pre-renders every frame into two buffers (alpha-blended and additive), packs them into a WebP atlas + JSON per effect (`fx/<efId>`), and adds an item→effect map to the dress-up index. The browser draws effects on two extra canvases behind/in front of the character canvas; the additive buffer sits on a canvas with CSS `mix-blend-mode: plus-lighter`.

**Tech Stack:** Python 3 (Pillow, numpy, `scripts/lub.py`), Next.js 14 / React client components, Vitest, unittest.

**Spec:** `docs/superpowers/specs/2026-11-11-dress-up-effect-costumes-design.md`

## Global Constraints

- No raw client files (`.str`, `.bmp`, `.tga`, `.lub`) in git or R2; only our rendered WebP + JSON go to R2 via `npm run dress-up:upload`. `out/dress-up/` is never committed.
- No code copied from roBrowser or other GPL projects; the STR parser is ours.
- Effect data loads only when an effect item is worn.
- External sources: rAthena raw GitHub only (for `hateffect` lines). Never ragnarokzero.wiki, ragnarokze.ro, assets.twroz.wiki, irowiki.org, Divine-Pride API.
- Scale: one STR unit = one stage pixel at 1x (verified by owner at the Task 3 checkpoint).
- Effects not drawn: footprint effects, guild shields 1270260 / 1270291-1270294, Taming Ring 24966.
- Deny-list: `data/dress-up-fx-deny.json` = `{ "<efId>": "reason" }`; denied effects stay out of the index.
- Git: never `git add -A`; add files one by one. Thai UI copy: short, no "แก".
- Visible work is previewed at http://100.108.70.113:3178 before deploy; deploy only on the owner's "ขึ้น".

## Review Focus

- Effect item worn on a class with no sprite for its other slot → the effect still draws; the item is not listed as "missing" (test in Task 6).
- Wearing an effect item in a slot replaces whatever headgear was there, and taking it off clears the effect canvases (test in Task 6).
- An item that has both a sprite and an effect draws both (test in Task 6).
- Texture name in `.str` differs in case from the file on disk, or a texture file is missing → the layer is skipped with a build warning, the effect still exports (test in Task 1/2).
- Changing look quickly while an fx part loads → no fx from the previous look is drawn on the new one (same rule DressStage uses for parts; test in Task 6 via `fxFor` purity + scene swap).

---

### Task 1: STR parser

**Files:**
- Create: `scripts/dressup/strfx.py`
- Create: `scripts/dressup/test_strfx.py`

**Interfaces:**
- Produces: `parse_str(data: bytes) -> Str`; dataclasses `Str(fps: int, max_key: int, layers: list[StrLayer])`, `StrLayer(textures: list[str], keys: list[StrKey])`, `StrKey(frame, type, pos: (x,y), uv: 8 floats, xy: 8 floats, aniframe: float, anitype: int, delay: float, angle: float, color: (r,g,b,a) 0-255, src_blend: int, dst_blend: int, mt_preset: int)`; `layer_state(layer: StrLayer, frame: int) -> StrKey | None` returning the interpolated state at `frame` (type 0 key = set, type 1 key = morph delta applied per frame since the last set key) or None when the layer is not shown at that frame.
- `find_texture(str_path: str, name: str) -> str | None` — case-insensitive lookup in the `.str`'s folder.

- [ ] **Step 1: Write failing tests** in `test_strfx.py` (unittest, skip if `D:/Data grf roz/data_grf_extracted` absent): parse `texture/effect/efst_magiccircle/mc.str` → `fps > 0`, `len(layers) >= 1`, every layer has ≥1 texture name ending `.bmp`/`.tga`; `layer_state` at frame 0 of the first layer is not None; a synthetic two-key layer (set at frame 0 pos (0,0), morph at frame 0 with delta pos (1,0)) gives pos x == 10 at frame 10; `find_texture` finds `magiccircle1.bmp` when asked for `MagicCircle1.BMP`, returns None for `nope.bmp`.
- [ ] **Step 2: Run** `py -3 -m unittest scripts/dressup/test_strfx.py -v` — expect ImportError/FAIL.
- [ ] **Step 3: Implement** with `struct`: magic `STRM`, version 0x94; header then layers; texture names are 128-byte NUL-padded CP949 strings. Morph keys: confirm the exact semantics against the files (morph keys store per-frame deltas from the preceding set key); if a field order turns out different, adjust the test, not around it.
- [ ] **Step 4: Run tests** — PASS.
- [ ] **Step 5: Commit** `scripts/dressup/strfx.py scripts/dressup/test_strfx.py` — `feat(dress-up): read client .str effect files`.

### Task 2: Render an effect to frames and an atlas

**Files:**
- Create: `scripts/dressup/fxrender.py`
- Create: `scripts/dressup/test_fxrender.py`

**Interfaces:**
- Consumes: Task 1.
- Produces: `render_frames(str_path: str, step: int = 1) -> list[tuple[Image|None, Image|None]]` — per kept frame, `(normal RGBA, add RGB-on-black as RGBA with alpha 255 where lit)`, each the full effect canvas centred on the STR origin; `export_fx(str_path, out_dir, key, pos_x, pos_y, before) -> (hash8, json_bytes, webp_bytes)` writing `<key>.<hash8>.json/.webp`.
- FX JSON (consumed by Task 6): `{"v":1,"fps":n,"before":bool,"frames":[{"n":[ax,ay,w,h,dx,dy]|null,"a":[ax,ay,w,h,dx,dy]|null}, ...]}` — `ax,ay,w,h` the rect in the atlas, `dx,dy` the rect's top-left relative to the character's feet in stage pixels (feet = composeFrame origin (100,150)).

Rendering rules: STR origin is (320, 320) in STR space (verify at checkpoint); a layer quad = its 4 corner `xy` around `pos`, rotated by `angle` (degrees /1024·360 if the files say so — check), texture chosen by `aniframe`, tinted by `color`; black (0,0,0) in `.bmp` textures is transparent; `dst_blend == 2 (ONE)` → additive buffer, else normal buffer. Then apply `hatEffectPosX` / `hatEffectPos` as a stage-pixel offset (verify sign at checkpoint). `step` keeps every n-th frame (use 2 when the atlas would exceed 4096x4096).

- [ ] **Step 1: Failing tests**: `render_frames(mc.str)` returns `max_key` (±1) frames, at least one frame has a non-empty buffer; `export_fx` JSON parses, `len(frames)` matches, every non-null rect lies inside the atlas size; a missing texture (point a copy of a layer at `missing.bmp` via a monkeypatched `find_texture`) logs a warning and still returns frames.
- [ ] **Step 2: Run** `py -3 -m unittest scripts/dressup/test_fxrender.py -v` — FAIL.
- [ ] **Step 3: Implement** quad warp with `Image.transform(..., Image.QUAD)` / numpy compositing.
- [ ] **Step 4: Run tests** — PASS.
- [ ] **Step 5: Commit** — `feat(dress-up): pre-render .str effects into an atlas`.

### Task 3: Sample sheet for the owner (CHECKPOINT)

**Files:**
- Create: `scripts/dressup/fx_sample.py` (dev tool; kept for later recalibration)

- [ ] **Step 1:** Script draws a Novice (male, front, stand — reuse `dressup/reference.py` / `part.py` the way `contact_sheet.py` does) on the room's dark backdrop, composites three effects at 1x and 3x: Magic Circle (efId of `HAT_EF_Magiccircle`), Tower of Light (`HAT_EF_C_Light_Tower`), Swirling Flame (`HAT_EF_C_Swirling_Flame`) — `before` effects under the body, additive buffers added — and writes an animated WebP per effect plus one still PNG sheet to `public/draft/fx-sample/` (that folder is untracked draft space).
- [ ] **Step 2:** Run it, look at the output yourself; fix obvious origin/sign errors.
- [ ] **Step 3: STOP.** Send the owner the preview link(s) (http://100.108.70.113:3178/draft/fx-sample/... via the running preview server, or SendUserFile) and ask whether size/position match the game. Adjust Task 2 constants until the owner says yes. Do not batch-render before that.

### Task 4: Item → effect map

**Files:**
- Create: `scripts/dressup/fxmap.py`
- Create: `scripts/dressup/test_fxmap.py`
- Create: `data/dress-up-fx-deny.json` (`{}`)
- Create: `data/rathena-hateffect.json` (cached `{item_id: "HAT_EF_..."}` from rAthena `db/re/item_db_equip.yml` + `db/pre-re/...` `hateffect`/`HatEffect` lines; script fetches with `--refresh`, otherwise reads the cache)

**Interfaces:**
- Produces: `effect_items(game_items: dict, item_info: dict, hat_ids: dict[str,int], hat_table: dict[int,dict], rathena: dict[int,str], manual: dict[int,str]) -> (mapping: dict[int, FxRef], unmatched: list[(id, reason)])`, `FxRef(ef_id: int, str_rel: str, pos_x: int, pos_y: int, before: bool, how: str)`. `how` ∈ `name`, `rathena`, `twin`, `manual`.
- `MANUAL: dict[int, str]` at the top of `fxmap.py`, each line commented with how it was confirmed.

Order: rAthena by id → normalised resource name vs `HAT_EF_*` (strip `HAT_EF_`, `C_`, non-alphanumerics, lower) → twin (another item with the same `identifiedResourceName` already mapped) → MANUAL. Candidates: every id in `effectHatItemTable` plus every `costume` item with `ClassNum == 0`, minus the excluded ids in Global Constraints. An effect whose `resourceFileName` has no `.str` on disk is unmatched with reason `no .str`.

- [ ] **Step 1: Failing tests** with small in-memory tables: name match (`C_Swirling_Flame` → `HAT_EF_C_Swirling_Flame`), rAthena wins over name, Bound twin with Korean resource name gets the twin's effect, excluded id 24966 never appears, unmatched item reported with a reason.
- [ ] **Step 2: Run** — FAIL. **Step 3: Implement.** **Step 4: Run** — PASS.
- [ ] **Step 5:** Run against the real client; print mapped / unmatched. Fill `MANUAL` for leftovers you can confirm by file contents (texture folder names) only; leave the rest unmatched.
- [ ] **Step 6: Commit** the three files + test — `feat(dress-up): map effect costumes to client hat effects`.

### Task 5: Build integration

**Files:**
- Modify: `scripts/build-dress-up.py` (`wardrobe()` items loop ~line 289, `main()`; add `'fx'` to `FOLDERS`)
- Modify: `scripts/build-dress-up-client.mjs` (`buildClient`)
- Modify: `lib/dress-up/client-index.test.ts`
- Modify: `scripts/build-dress-up-thumbs.py` (thumb for `fx/<efId>`: middle frame, normal over add on the usual cell background)

**Interfaces:**
- Full index: an item gains `"fx": efId`. Effect-only items (no view) enter `items` with `view: 0`, `has: {}`, `slots` from the description. `coverage.fx = {mapped, unmatched: [{id, why}], denied: [...]}`. Parts `fx/<efId>` go through the same manifest/incremental path (sources = `.str` + its textures + hateffectinfo.lub).
- Client index (`data/dress-up-client.json`): new top-level `fx: Record<itemId, efId>`; effect-only items appear in `items` as `[slots, 0, 0]`. `files["fx/<efId>"]` = hash8.
- Thumbs: `at["fx/<efId>"] = n`.

- [ ] **Step 1: Failing test** in `client-index.test.ts`: `buildClient` on a fixture with one fx-only item and one sprite+fx item produces `fx` entries for both and `[slots, 0, 0]` for the fx-only one; drift test still passes after rebuild.
- [ ] **Step 2: Run** `npx vitest run lib/dress-up/client-index.test.ts` — FAIL. **Step 3: Implement** both builders + thumbs. **Step 4:** `npm run dress-up:build`; vitest PASS; build output prints fx mapped/unmatched counts.
- [ ] **Step 5: Commit** scripts, test, `data/dress-up.json`, `data/dress-up-client.json`, `data/dress-up-manifest.json`, `data/dress-up-thumbs.json` — `feat(dress-up): export effect costumes`.

### Task 6: Draw effects in the room

**Files:**
- Modify: `lib/dress-up/look.ts` (`ClientIndex.fx`, `fxFor`, `drawable`, `hasSprite` callers)
- Modify: `lib/dress-up/load.ts` (`loadFx`)
- Create: `lib/dress-up/fx.ts` (types + `fxFrameAt`)
- Modify: `components/dressup/DressStage.tsx`, `app/tools/dress-up/page.css`
- Modify: `lib/dress-up/catalog.ts` (tile for fx-only items: key `fx/<efId>|<slots>`, thumb `fx/<efId>`; `drawnAnywhere` true when the item has fx)
- Modify: `components/dressup/DressPicker.tsx` (no "อาชีพนี้ยังไม่มีภาพ" for fx-only items)
- Test: `lib/dress-up/look.test.ts`, `lib/dress-up/fx.test.ts`, `lib/dress-up/catalog.test.ts` (create if absent)

**Interfaces:**
- `fxFor(look: Look): { key: string; efId: number }[]` — one per distinct worn item with fx, in slot order.
- `drawable(look)`: an item with fx and no sprite is not `missing` and adds no acc/robe part; an item with both adds its sprite part as today.
- `type FxData = { v: 1; fps: number; before: boolean; frames: { n: Rect | null; a: Rect | null }[] }`, `Rect = [ax, ay, w, h, dx, dy]`; `fxFrameAt(fx: FxData, ms: number): number` = `floor(ms * fps / 1000) % frames.length`.
- `loadFx(key: string): Promise<{ fx: FxData; atlas: HTMLImageElement | ImageBitmap }>` — memoised, throws `DressUpUnavailable` like `loadPart`.
- DressStage: four stacked 200x200 canvases inside the stage — `behind-n`, `behind-a` (plus-lighter), character, `front-n`, `front-a` (plus-lighter) — drawn with `drawImage` from the atlas at `(100+dx, 150+dy)`. FX load with the parts in the same `Promise.all` so scene swap keeps old/new apart.

- [ ] **Step 1: Failing tests**: `fxFor` returns the effect for an fx-only item in `lower`; `drawable` for that look has no `missing`; sprite+fx item yields an acc part and an fx entry; wearing a plain headgear in the same slot removes the fx; `fxFrameAt` loops (fps 10, 5 frames, ms 600 → 1); catalog lists the fx-only item as a tile with `thumb` defined.
- [ ] **Step 2: Run** `npx vitest run lib/dress-up` — FAIL. **Step 3: Implement.** **Step 4: Run** — PASS, `npx tsc --noEmit` clean.
- [ ] **Step 5: Commit** — `feat(dress-up): draw effect costumes on the stage`.

### Task 7: Item page, runbook, full check

**Files:**
- Modify: `components/CostumeFit.tsx` (replace the "ไม่มีภาพตอนใส่" note with the "▶ ลองใส่ในห้องแต่งตัว" link when `INDEX.fx[id]`; `inDressRoom` true for fx items)
- Modify: `components/CostumeSpin.tsx` (ignore fx-only items)
- Modify: `docs/UPDATE-RUNBOOK.md` (dress-up step: "new fx parts: show them in the preview; reject with data/dress-up-fx-deny.json")
- Modify: `docs/GAME_MODEL.md` §8 only if the owner corrects something during review

- [ ] **Step 1:** Implement; `npx vitest run`, `npx tsc --noEmit`, `npx next build` all pass.
- [ ] **Step 2:** `npm run dress-up:upload`, then `npm run dress-up:upload -- --check` → 200 + Access-Control-Allow-Origin.
- [ ] **Step 3:** Kill the old listener on 3178, `npx next start -p 3178`; open the room, wear Magic Circle, a landmark, Swirling Flame, a sprite+fx hat; check `/items/<effect id>` link. Send the owner the preview link with a list of every effect added and any unmatched.
- [ ] **Step 4:** Add rejected effects to the deny-list, rebuild if needed. Commit (with the gef_dun02 change already committed) and deploy only on "ขึ้น": `npm run deploy -- --path /tools/dress-up --expect "<text>"`, then `npm run purge`.
