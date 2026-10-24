# Dress-up Plan 1: Sprite Pipeline and Renderer — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A dressed-up RO Zero character drawn in the browser, pixel-identical to the client, on a bare test page. The assets come from R2.

**Architecture:**
- Python scripts, local only, read the extracted client with `scripts/ro_sprite.py` and `scripts/lub.py`.
- They export each sprite part as:
  - one atlas picture
  - one flat JSON file with frames, layers, anchors, delays and a baked z value per frame
- A Node script uploads changed files to R2.
- A pure TypeScript compositor (`lib/dress-up/render.ts`) stacks parts into an RGBA buffer. Node tests compare it pixel for pixel with the Python reference.
- A client page draws that buffer to a canvas.

**Tech Stack:** Python 3 (Pillow, lupa through `scripts/lub.py`), Node/TypeScript, Next.js 14, vitest, `@aws-sdk/client-s3` (new devDependency).

**Spec:** `docs/superpowers/specs/2026-10-24-dress-up-design.md`

**Plan sequence:** this is plan 1 of 3.
- **Plan 2, scenes:** the roBrowser shot script, calibration, the 10 backgrounds and depth scaling.
- **Plan 3, studio:** 2 actors plus a monster, chat, emote, damage and shop props, save/share, phone layout A, entry points and analytics.

Plans 2 and 3 are written after this plan is previewed. They build on the interfaces below.

## Global Constraints

- **Client files** come from `D:/Data grf roz/data_grf_extracted/files/data`, with `D:/Data grf roz/grf-2026-10-15-sprites/files/data` winning when a file exists in both. Use the `src()` rule from `scripts/build-costume-fit.py`.
- **Raw client files never enter the repo or R2:** no .spr, .act, .pal, .imf, .lub or GRF. Only derived atlases (WebP lossless, or PNG in test fixtures) and JSON may.
- **Bulk generated assets go to R2, not git.**
  - Committed: scripts, `data/dress-up.json` (the index) and `data/dress-up-manifest.json` (file → content hash).
  - Not committed: the `out/dress-up/` work folder. Add it to `.gitignore`.
- **R2 credentials** live only in `.env.local` and Coolify env. Key names:
  - `R2_ACCOUNT_ID`
  - `R2_ACCESS_KEY_ID`
  - `R2_SECRET_ACCESS_KEY`
  - `R2_BUCKET`
  - `NEXT_PUBLIC_DRESSUP_BASE` (the public base URL ending in `/`)

  Never print the values. Print only names and lengths.
- **Classes:** the 19 RO Zero classes and their Korean sprite names, exactly the `CLASSES` mapping in `scripts/build-build-doll.py`.
  - Bard is male only and dancer female only (`dollSex()` in `lib/build-doll.ts`).
- **Stylist ranges:**
  - hair styles 1–32
  - hair colours 0–8 (names from `dressroom/jobdresslist.lub` `_DressHeadPaletteList_*`)
  - cloth colours 0, 2, 3 (`stylingshop/stylingshopinfo.lub` AddBodyPalette)
  - Whether cloth 0 means the sprite's own palette or `_0.pal` is checked in Task 1 and recorded in the index.
- **Kept action types** (RO player act layout: action = type × 8 + direction):

  | Type | Pose |
  |---|---|
  | 0 | stand |
  | 1 | walk |
  | 2 | sit |
  | 4 | ready |
  | 5 | attack1 |
  | 6 | hurt |
  | 8 | dead |
  | 10 | attack2 |
  | 11 | attack3 |

  Other types are dropped from export.
- **In stand (0) and sit (2),** a head or headgear's 3 frames are head directions (ahead, left, right), not animation. The renderer picks `headDir` there and does not animate those parts.
- **Pictures are mirrored only by the act's own mirror flag.** Never mirror a direction yourself.
- **Copy and UI text is Thai and uses player words** (docs/GAME_MODEL.md §7). The test page is noindex and is not linked from nav in this plan.

## Review Focus

1. **An item whose view has no sprite** for the chosen class or sex shows "ยังไม่มีภาพ" in the picker and draws nothing. There is never a broken image or a thrown error. Test in Task 6.
2. **Multi-slot items:**
   - Wearing an upper+middle item clears whatever is in upper or middle.
   - Then wearing a middle-only item removes the whole upper+middle item.

   Test in Task 6.
3. **Garments that share one .spr at the folder root** with a per-job .act (26 robes, `robe_files()` in build-costume-fit.py) export and draw like the others. This case is in the Task 2 fixtures.
4. **`NEXT_PUBLIC_DRESSUP_BASE` unset or R2 unreachable:** the page shows "ยังโหลดภาพตัวละครไม่ได้" and does not crash. Test in Task 6.
5. **Parts with different frame counts in the same action** (a 24-frame wing on a 1-frame stand body) loop each on its own delay. They are not clamped to the body's count. This case is in the Task 3 pixel test fixtures (one animated garment).

---

### Task 1: Part exporter and Python reference renderer

**Files:**
- Create: `scripts/dressup/__init__.py` (empty)
- Create: `scripts/dressup/part.py`
- Create: `scripts/dressup/reference.py`
- Test: `scripts/dressup/test_part.py`

**Interfaces:**
- Consumes: `Spr`, `Act` and `draw_layers` from `scripts/ro_sprite.py`.
- Produces:
  - `export_part(spr: Spr, act: Act, types=KEPT_TYPES, palette: list[tuple] | None = None) -> tuple[PIL.Image, dict]`
    - Returns an RGBA atlas, packed in shelves 512 px wide, plus the part JSON dict:

      ```json
      {"v": 1, "w": int, "h": int,
       "acts": {"<action>": [[layers, anchor|null, z], ...]},
       "delay": {"<action>": ms}}
      ```

    - `layers` is a list of `[x, y, ax, ay, aw, ah, mirror, sx, sy, rot, r, g, b, a]`.
    - `(ax, ay, aw, ah)` is the picture's rect in the atlas.
    - `anchor` is `[x, y]` or null.
    - `z` is `0` for now (Task 4 fills it).
    - `ms = max(40, round(delay * 25))`, the same rule as `frames_of()` in build-costume-fit.py.
  - `apply_palette(spr: Spr, pal_path: str) -> Spr`: a copy whose palette images are re-coloured from a 1024-byte .pal file.
  - `reference.render(parts: list[tuple[Spr, Act, bool]], action: int, frames: list[int], size=(200, 200), origin=(100, 150)) -> PIL.Image`
    - Each part gets its own frame index from `frames`.
    - `bool` means the part is anchored to the body.
    - Draw order is list order (Task 4 changes this to z).

- [ ] **Step 1: Write the failing tests**
  - `test_export_keeps_only_kept_types`: export the Novice male body. The `acts` keys are exactly `{t*8+d for t in KEPT_TYPES for d in range(8)}`.
  - `test_atlas_rects_hold_the_pictures`: for every layer of action 0 frame 0, the atlas crop at `(ax, ay, aw, ah)` equals `spr.image(idx, kind)` byte for byte.
  - `test_reference_matches_ro_sprite_render`: `reference.render` of Novice body plus head 1, action 0, frames [0, 0], equals `ro_sprite.render(...)` of the same parts.
  - `test_apply_palette_changes_pixels`: hair 1 male with palette `_3.pal` differs from palette `_0.pal` in at least 1 pixel, and has the same alpha mask.
  - `test_cloth_zero_rule`: record which of these is true and assert it, then write the answer as `CLOTH_ZERO = 'own' | 'pal'` in `part.py`:
    - body palette 0 equals the sprite's own palette
    - body palette 0 equals `palette/몸/초보자_남_0.pal`

- [ ] **Step 2: Run them and see them fail**

  Run: `PYTHONIOENCODING=utf-8 py -3 -m unittest scripts/dressup/test_part.py -v` (from the repo root)

  Expected: ImportError for `scripts.dressup.part`.

- [ ] **Step 3: Implement `part.py` and `reference.py`** as specified in Interfaces.
  - Use the atlas packer from the spike: sort by height, use shelves, deduplicate by `(kind, index)`.

- [ ] **Step 4: Run the tests and see them pass.** Expected: 5 OK.

- [ ] **Step 5: Commit**

  ```bash
  git add scripts/dressup/__init__.py scripts/dressup/part.py scripts/dressup/reference.py scripts/dressup/test_part.py
  git commit -m "feat(dress-up): export a sprite part as atlas + flat JSON"
  ```

### Task 2: Test fixtures from the client

**Files:**
- Create: `scripts/dressup/make_fixtures.py`
- Create: `lib/dress-up/__fixtures__/` (generated, committed, under 1.5 MB in total)

**Interfaces:**
- Consumes: `export_part`, `apply_palette` and `reference.render` from Task 1.
- Produces, under `lib/dress-up/__fixtures__/`:
  - `parts/<key>.json` with the matching `parts/<key>.rgba.gz` (gzip of raw RGBA, w × h from the JSON)
  - `looks.json`: a list of `{parts: [{key, anchored}], action, frames, ref}`
  - `ref/<n>.rgba.gz`: 200 × 200 references
- **The fixed part set:**
  - Novice male and female bodies at cloth colours 0 and 2
  - heads 1 and 17 in colours 0 and 5
  - 3 headgears: one 1-frame, one with 3 head-direction frames, one animated
  - 1 garment that shares a root .spr
  - 1 animated garment
  - 1 dagger weapon sprite for Novice
- **30 looks**, drawn with seed 1 from:
  - that part set
  - actions in the kept types × 8 directions
  - random per-part frame indices

- [ ] **Step 1: Write `make_fixtures.py`** with seed 1, the fixed part set above and 30 looks. It must print the total fixture bytes and exit non-zero above 1.5 MB.
- [ ] **Step 2: Run it.**

  Run: `PYTHONIOENCODING=utf-8 py -3 scripts/dressup/make_fixtures.py`

  Expected: "30 looks, N parts, X KB" with X under 1536.
- [ ] **Step 3: Commit**

  ```bash
  git add scripts/dressup/make_fixtures.py lib/dress-up/__fixtures__
  git commit -m "test(dress-up): client-derived fixtures for the renderer"
  ```

### Task 3: TypeScript compositor, pixel-matched

**Files:**
- Create: `lib/dress-up/types.ts`
- Create: `lib/dress-up/render.ts`
- Test: `lib/dress-up/render.test.ts`

**Interfaces:**
- Consumes: the Task 2 fixtures and the part JSON format from Task 1.
- Produces:
  - **`types.ts`:**
    - `PartData` (the JSON)
    - `Atlas = {w: number; h: number; data: Uint8ClampedArray}`
    - `Placed = {part: PartData; atlas: Atlas; anchored: boolean; frame: number}`
  - **`composeFrame(placed: Placed[], action: number, size = {w: 200, h: 200}, origin = {x: 100, y: 150}): Atlas`**
    - Starts with a transparent buffer.
    - Shift for an anchored part = body anchor (placed[0]) − part anchor, the same rule as `ro_sprite.render`.
    - Alpha-composites "over".
    - Supports mirror, nearest scale, rotation and tint, matching `draw_layers`:
      - centre at `origin + (x, y) + shift`
      - top-left = centre − (w // 2, h // 2) after scale and rotation
      - tint per channel `v * m // 255`
    - Draws in array order. Task 4 adds sorting by z.
  - **`frameAt(part: PartData, action: number, ms: number): number`** gives the frame index for elapsed time, using the part's own delay. Parts loop on their own.

- [ ] **Step 1: Write the failing tests**
  - **`it.each(looks)('matches the client reference #%#')`**
    - Load the parts and atlases (gunzip), compose, and expect the RGBA of the result to equal the `ref` buffer exactly.
    - If a look contains a layer with `rot !== 0`, allow at most 0.5% differing pixels and log the count. PIL's rotate and ours can differ on edge pixels. Exact match stays the rule for every other look.
  - **`frameAt`:**
    - `frameAt(part with delay 100 and 4 frames, a, 250) === 2`
    - `frameAt(1-frame part, a, 9999) === 0`

- [ ] **Step 2: Run them and see them fail**

  Run: `npx vitest run lib/dress-up/render.test.ts`

  Expected: FAIL, module not found.

- [ ] **Step 3: Implement `types.ts` and `render.ts`.**
- [ ] **Step 4: Run them and see them pass.** Expected: 31 passed.
- [ ] **Step 5: Prove the test can fail (memory rule [[prove-the-test-can-fail]]).**
  - Temporarily drop the anchor shift: the anchored-part looks must go red.
  - Then temporarily ignore `mirror`: the mirrored looks must go red.
  - Restore both and see them pass.
  - Write in the commit body which looks went red each time.
- [ ] **Step 6: Commit**

  ```bash
  git add lib/dress-up/types.ts lib/dress-up/render.ts lib/dress-up/render.test.ts
  git commit -m "feat(dress-up): TS compositor matches the client pixel for pixel"
  ```

### Task 4: Draw order baked into the parts, plus the contact sheet

**Files:**
- Create: `scripts/dressup/zorder.py`
- Test: `scripts/dressup/test_zorder.py`
- Create: `scripts/dressup/contact_sheet.py`
- Modify: `scripts/dressup/part.py` (`export_part` takes `z_of: Callable[[int, int], int]` for (action, frame), default `lambda a, f: 0`)
- Modify: `scripts/dressup/reference.py` (sort by z, stable)
- Modify: `lib/dress-up/render.ts` (sort `placed` by the frame's z, stable)
- Modify: `scripts/dressup/make_fixtures.py` (re-export with z, regenerate the fixtures)

**Interfaces:**
- Produces: `zorder.z_for(kind: str, view: int | None, job: str, sex: str, action: int, frame: int) -> int`
  - `kind` is one of `body`, `head`, `acc_lower`, `acc_mid`, `acc_upper`, `robe`, `weapon`.
  - Higher z draws later.
  - **Rules, in this order:**
    1. **Base, by direction** `d = action % 8`:
       - Directions 2–5 face away. Base z: body 15, head 20, acc 22/23/24 (lower/mid/upper), weapon 28, robe 5.
       - Otherwise: body 10, head 15, acc 17/18/19, weapon 23, robe 5.
    2. **Robe on top:**
       - Lua `IsTopLayer(robe_view, job)` (load spriterobename and spriterobeid) is truthy, or `RobeTopLayer` lists the view for that direction.
       - Then the robe takes body + 1 when facing towards, head + 1 when facing away.
    3. **Headgear priority:**
       - `TB_Layer_Priority.Items_List[view]` has `Default`, or a `Direction[d]` override.
       - Then map the client value onto our scale: Default_Mid 100, Default_Top 200, Default_Bottom 300, Default_Robe 400 become slots mid/upper/lower/robe.
       - 1xx values above 100 rank among the mids by their offset, and so on.
       - Keep the client's relative order inside each band.
    4. **imf:**
       - If `imf/<job>_<sex>.imf` says the head is behind the body for (action, frame), head z = body z − 1.
       - Parse the IMF format: `version float`, `checksum int`, `maxLayer int`, then per layer, per action, per frame an `int priority` plus `int cx`, `int cy`.

- [ ] **Step 1: Write the failing tests**
  - `test_robe_behind_body_facing_front`: a plain robe view at action 0 (d 0) gives z_for('robe') < z_for('body').
  - `test_robe_over_body_facing_away`: at action 4 (d 4) gives z_for('robe') > z_for('body').
  - `test_top_layer_robe`: pick one view listed in `RobeTopLayer`. It is above the body at action 0.
  - `test_layer_priority_override`: pick one Items_List view with a `Direction` table. Its z differs between the overridden direction and the default.
  - `test_imf_head_behind`: assert the imf rule on a job and frame where the imf file says the head goes behind (found and named in this step).

- [ ] **Step 2: Run them and see them fail.**

  Run: `PYTHONIOENCODING=utf-8 py -3 -m unittest scripts/dressup/test_zorder.py -v`

- [ ] **Step 3: Implement `zorder.py`** and wire `z_of` into `export_part` and the sorting in reference.py and render.ts.

- [ ] **Step 4: Regenerate the fixtures and run every test.**

  Run:

  ```bash
  PYTHONIOENCODING=utf-8 py -3 scripts/dressup/make_fixtures.py
  PYTHONIOENCODING=utf-8 py -3 -m unittest discover scripts/dressup -v
  npx vitest run lib/dress-up
  ```

  Expected: all pass.

- [ ] **Step 5: Write `contact_sheet.py`.**
  - It takes 40 item views (wings, back items, masks, wigs, every Items_List view with `Direction`, and every RobeTopLayer view) on the Novice and Knight.
  - Each is drawn in 8 directions at stand, then once at sit and attack1.
  - Output: `out/dress-up/contact-sheet.png`.
  - Run it and send the picture to the owner with SendUserFile. **Owner review gate:** list the items the owner flags. Fix the rules and re-run until the owner says it looks like the game.

- [ ] **Step 6: Commit**

  ```bash
  git add scripts/dressup/zorder.py scripts/dressup/test_zorder.py scripts/dressup/contact_sheet.py scripts/dressup/part.py scripts/dressup/reference.py scripts/dressup/make_fixtures.py lib/dress-up/render.ts lib/dress-up/__fixtures__
  git commit -m "feat(dress-up): bake the client's draw order into every frame"
  ```

### Task 5: Full export, index, coverage and R2 upload

**Files:**
- Create: `scripts/build-dress-up.py`
- Create: `scripts/upload-dress-up.mjs`
- Create: `scripts/upload-plan.mjs`
- Test: `scripts/upload-plan.test.ts`
- Create: `data/dress-up.json`
- Create: `data/dress-up-manifest.json`
- Modify: `.gitignore` (add `out/dress-up/`)
- Modify: `package.json`
  - scripts `"dress-up:build": "py -3 scripts/build-dress-up.py"` and `"dress-up:upload": "node --env-file=.env.local scripts/upload-dress-up.mjs"`
  - devDependency `@aws-sdk/client-s3`
- Modify: `CLAUDE.md` (a short "dress-up assets" note: where they live, the two commands, never commit `out/dress-up`)

**Interfaces:**
- Consumes: `export_part`, `apply_palette`, `z_for`.
- **Produces `out/dress-up/` keys:**
  - `body/<cls>-<sex>-<cloth>.{json,webp}`
  - `head/<style>-<sex>-<colour>.{json,webp}`
  - `acc/<view>-<sex>.{json,webp}`
  - `robe/<view>-<cls>-<sex>.{json,webp}`
  - `weapon/<cls>-<sex>-<wtype>.{json,webp}`

  Each key is suffixed with an 8-character content hash in the file name, for example `acc/97-m.3fa2c1d0.json`, so R2 can cache forever.
- **Produces `data/dress-up.json`:**

  ```
  {v, classes: [{slug, sexes, cloth: [0, 2, 3], weapons: [wtype...], attackType: {wtype: 5|10|11}}],
   hair: {styles: 32, colours: [{id, th}]},
   items: {"<itemId>": {slots: ["upper"|"mid"|"lower"|"garment"], view, has: {"<cls>-<sex>": true}}},
   files: {"<logical key>": "<hashed path>"},
   coverage: {itemsWithView, drawnEverywhere, missing: [{id, why}]}}
  ```

  - `attackType` comes from the client's weapon table or action use, as build-build-doll.py does. Record 5 when unknown.
  - Item slots come from `game-items.json` desc (`Upper|Middle|Lower|Garment`), the same as `position()` in build-costume-fit.py.
- **Produces `planUpload(local: Record<string, string>, remote: Set<string>): string[]`**
  - `local` maps path to hash.
  - It returns the paths whose hashed name is not in remote. It is pure and lives in `scripts/upload-plan.mjs`.
- **Produces `NEXT_PUBLIC_DRESSUP_BASE`:** the public base URL of the bucket.

- [ ] **Step 1: Write the failing test for `planUpload`**

  `planUpload({'a.1.json': '1', 'b.2.json': '2'}, new Set(['a.1.json']))` gives `['b.2.json']`, and an empty local gives `[]`.

- [ ] **Step 2: Run it and see it fail.** Run: `npx vitest run scripts/upload-plan.test.ts`
- [ ] **Step 3: Implement `upload-plan.mjs` and `upload-dress-up.mjs`.**
  - Use S3Client with endpoint `https://<R2_ACCOUNT_ID>.r2.cloudflarestorage.com` and region `auto`.
  - List the bucket, `planUpload`, then PutObject with `Cache-Control: public, max-age=31536000, immutable` and the right Content-Type.
  - Print only counts and key names.
- [ ] **Step 4: Run it and see it pass.**
- [ ] **Step 5: Implement `build-dress-up.py`.**
  - It is incremental: skip a part whose source files' mtimes and sizes are unchanged since `data/dress-up-manifest.json`.
  - It prints coverage at the end.
  - Run: `npm run dress-up:build`
  - Expected:
    - It finishes.
    - It prints `itemsWithView`, `drawnEverywhere` and `missing` counts.
    - `du -sh out/dress-up` is under 150 MB.
- [ ] **Step 6: Owner step (do not do it yourself).**
  - Ask the owner to create the R2 bucket, a token with Object Read & Write on that bucket only, and public access (r2.dev or a custom domain).
  - The keys go in `.env.local` and Coolify env.
  - Then verify by printing key names and lengths only.
- [ ] **Step 7: Run `npm run dress-up:upload`.**
  - Expected: "uploaded N, skipped 0". A second run gives "uploaded 0".
  - `curl -s -o /dev/null -w "%{http_code}" "$NEXT_PUBLIC_DRESSUP_BASE<one hashed path>"` returns `200`.
- [ ] **Step 8: Commit**

  ```bash
  git add scripts/build-dress-up.py scripts/upload-dress-up.mjs scripts/upload-plan.mjs scripts/upload-plan.test.ts data/dress-up.json data/dress-up-manifest.json .gitignore package.json package-lock.json CLAUDE.md
  git commit -m "feat(dress-up): full export, coverage and R2 upload"
  ```

### Task 6: Look model and the bare preview page

**Files:**
- Create: `lib/dress-up/look.ts`
- Test: `lib/dress-up/look.test.ts`
- Create: `lib/dress-up/load.ts`
- Create: `components/dressup/DressStage.tsx` (client)
- Create: `components/dressup/DressPicker.tsx` (client)
- Create: `app/tools/dress-up/page.tsx`
- Create: `app/tools/dress-up/page.css`

**Interfaces:**
- Consumes: `data/dress-up.json`, `composeFrame` and `frameAt` (Task 3), `dollSex` (`lib/build-doll.ts`), and the item search from `lib/search-catalog`.
- **Produces `look.ts`:**
  - `type Look = {cls: string; sex: 'm'|'f'; hair: number; hairColour: number; cloth: number; upper?: number; mid?: number; lower?: number; garment?: number; weapon?: string; dir: number; pose: 'stand'|'walk'|'sit'|'ready'|'attack'|'hurt'|'dead'; headDir: 0|1|2}`
  - `DEFAULT_LOOK`: novice, m, 1, 0, 0, dir 0, stand, headDir 0.
  - `wear(look: Look, itemId: number): Look`: applies the item's slots, clearing conflicts both ways (Review Focus 2).
  - `takeOff(look: Look, slot)`.
  - `partsFor(look: Look): {key: string; anchored: boolean}[] | {missing: number[]}`
    - Resolves logical keys through `files`.
    - Lists the item ids that have no sprite for `${cls}-${sex}`.
  - `actionFor(look: Look): number`
    - pose type × 8 + dir.
    - attack uses `attackType[weapon]`.
- **Produces `load.ts`:** `loadPart(key: string): Promise<{part: PartData; atlas: Atlas}>`
  - Fetches `${NEXT_PUBLIC_DRESSUP_BASE}${hashedPath}` JSON and WebP.
  - Decodes through `createImageBitmap` and OffscreenCanvas `getImageData`.
  - Memoised.
  - Throws `DressUpUnavailable` when the base URL is unset or a fetch fails.
- **Page:**
  - `/tools/dress-up`, `robots: {index: false}`, title "ห้องแต่งตัว (ทดสอบ)".
  - Picker: class chips, sex, hair style and colour, cloth, 4 slot searches, weapon type, a direction arrow, pose chips.
  - Stage: canvas 200×200 drawn at 3x with `image-rendering: pixelated`, animated with requestAnimationFrame. `frameAt` runs per part; stand and sit use `headDir` for head and acc.
  - Neon arcade styling, reusing the existing `.cfit` and `/tools/build` tokens.

- [ ] **Step 1: Write the failing tests in `look.test.ts`**
  - `wear` of an upper+middle item onto a look that has upper=A and mid=B gives upper and mid both equal to that item.
  - Then `wear` of a mid-only item C gives mid=C and upper undefined.
  - `partsFor` on an item with no sprite for `knight-f` returns `{missing: [id]}`. Pick the id from `coverage.missing` in the index.
  - `actionFor({...DEFAULT_LOOK, pose: 'sit', dir: 3}) === 19`.
  - Bard + 'f' resolves to 'm' (uses `dollSex`).
  - `loadPart` with the base URL unset rejects with `DressUpUnavailable` (Review Focus 4).
- [ ] **Step 2: Run them and see them fail.** Run: `npx vitest run lib/dress-up/look.test.ts`
- [ ] **Step 3: Implement `look.ts` and `load.ts`.**
- [ ] **Step 4: Run them and see them pass.**
- [ ] **Step 5: Build the page and components.**
  - A missing item shows "ยังไม่มีภาพ" on its chip.
  - `DressUpUnavailable` shows "ยังโหลดภาพตัวละครไม่ได้".
- [ ] **Step 6: Run the whole suite and build.**

  Run: `npm test && npm run build`

  Expected: all pass. The build lists `/tools/dress-up`.
- [ ] **Step 7: Restart the local servers and preview.**
  - Restart ports 3177 and 3178 as CLAUDE.md says.
  - Send the owner http://100.108.70.113:3178/tools/dress-up and phone and desktop screenshots via SendUserFile.
  - Compare 3 looks against Divine-Pride or in-game screenshots the owner supplies.
  - Do not deploy. Plans 2 and 3 come first.
- [ ] **Step 8: Commit**

  ```bash
  git add lib/dress-up/look.ts lib/dress-up/look.test.ts lib/dress-up/load.ts components/dressup app/tools/dress-up
  git commit -m "feat(dress-up): bare preview page drawing the character from R2"
  ```
