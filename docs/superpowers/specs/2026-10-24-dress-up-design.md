# Dress-up room: design (24 Oct 2026)

The owner chose approach B from `docs/RESEARCH-dress-up-2026-10-24.md`: convert the client's sprites at build time, and draw in the browser. The owner said: "think it through first, this one is big".

## Goal

A player picks a class, sex, hair style, hair colour, cloth colour and up to four costume or headgear pieces. They then see that character the way the game draws it: any of 8 directions, standing, walking or sitting, with the sprites moving.

They can share the result as a link or save it as a picture.

**What success looks like (measure 4 weeks after launch):**
- People who open the page and change something, as a share of people who open it. The build tool's 56% is the bar to beat.
- `dressup_share` events.
- Clicks into the room from costume pages.

## Scope

**Phase 1 (MVP)**

- **Classes:** the 19 RO Zero classes that build-doll already knows, male and female. Bard is male only and dancer female only.
- **Look:**
  - The 32 Stylist hair styles.
  - 9 hair colours.
  - The Stylist cloth colours (0, 2, 3; check whether 0 is the sprite's own palette or `_0.pal`).
- **Pieces** come from every item in `game-items.json` with a view id. That covers costumes and normal headgear. The slots are:
  - upper
  - middle
  - lower
  - garment

  An item that takes more than one slot clears whatever it overlaps, as the game does.
- **Effect costumes** (view id 0) are listed as "เอฟเฟกต์ ไม่แสดงบนตัว". Selecting one shows its collection art from costume-art beside the character. It is never faked onto the sprite.
- **Pose:** 8 directions, stand / walk / sit. Animation plays at the act's own delays. In stand and sit the three head frames are where the head looks (ahead, left, right), not animation.
- **Sharing:**
  - A URL `?d=` with a compact code, the same idea as `/tools/build?b=`.
  - "Save picture" exports the canvas as a PNG at 2x, with a site watermark.
- **Entry points:**
  - A new page `/tools/dress-up`.
  - A button "▶ ลองใส่ในห้องแต่งตัว" on every costume page that has a fitting sheet. It opens the room with that item on.
  - A row in the tools menu.

**Phase 2 (later, only if phase 1 is used)**

- Weapons and shields.
- Mounts (Peco, Grand Peco), which use riding garments.
- Outfit costumes (jobdresslist).
- A shared-link preview image drawn on the server.
- Comparing two looks side by side.

**Out:** stats and gear effects. The build tool owns those.

## Architecture

There are three parts. All the hard rules are settled at build time, so the browser only stacks pictures.

### 1. Converter: `scripts/build-dress-up.py`

It reuses `ro_sprite.py` and `lub.py`, and reads the 22 Sep extraction with the newest patch winning, the same way build-costume-fit does.

**What it writes per sprite part:**
- One atlas picture, lossless WebP: every image the kept actions use, packed.
- One small JSON file. For each kept action (stand 0-7, walk 8-15, sit 16-23):
  - its frames
  - each frame's layers (x, y, rect, mirror, scale, rotation, tint)
  - the anchor
  - the frame delay

**Palettes are applied here, not in the browser.**
- The converter writes one atlas per body × cloth colour and per head × hair colour.
- Reading palette indices back from a PNG in a browser is fragile because of colour management. Pre-applied colours cost a little disk and nothing at runtime.

**Draw order is settled here.** For each part, action and frame, the converter writes a z value that combines:
- `tb_layer_priority` (per view, with its per-direction overrides)
- the robe table's `IsTopLayer` / `RobeTopLayer`
- the `imf` files (whether the head goes behind the body)
- the direction rule: facing up or left swaps garment and head order, as `build-costume-fit.py` does today

**Index** `data/dress-up.json`:
- classes, hair styles, colours with Thai names
- per item: slot(s), view id, which sexes and classes have a sprite, and the file keys
- a skipped count with reasons, as costume-fit has

**Output** goes under `public/dress-up/`:
- `body/<class>-<sex>-<cloth>`
- `head/<style>-<sex>-<colour>`
- `acc/<view>-<sex>`
- `robe/<view>-<class>-<sex>`

Expected size, measured on samples (stand, walk and sit only):

| Part | Per file (WebP + gzipped JSON) | Files | Total |
|---|---|---|---|
| Headgear | about 4.6 KB | about 600 views × 2 sexes | about 6 MB |
| Body | about 31 KB | 38 bodies × 3 cloth colours | about 3.5 MB |
| Head | about 1.8 KB | 32 styles × 9 colours × 2 sexes | about 1 MB |
| Garment | about 3 KB | 141 × 19 × 2 at most | under 20 MB |

The whole set is under 40 MB on disk. One look loads about 50 KB.

### 2. Renderer: `lib/dress-up/render.ts`

This is a plain TypeScript port of `ro_sprite.draw_layers` plus the anchor shift from `render()`, drawing onto a canvas. It does no file parsing, because the JSON is already flat.

For each part it:
1. picks the frame for the current action and tick
2. shifts by `body anchor − part anchor` (body and garment are not shifted)
3. sorts by the baked z value
4. draws each layer with mirror, scale, rotation and tint

The canvas uses `imageSmoothingEnabled = false`, and the page scales it with pixelated rendering.

### 3. Page: `app/tools/dress-up/page.tsx` with a client component

**Layout** (neon arcade, same shell as /tools/build):
- On the left, a large stage with the character on a scanline floor, plus direction arrows, pose chips and a play/pause control.
- On the right, tabs for อาชีพ / ทรงผม / ใส่ของ.
- The "ใส่ของ" tab has a search box (Thai and English names through the existing search catalog), slot filter chips, and an icon grid. Tapping an icon puts the item on.
- The slots in use show as removable chips under the stage.

**Phones:** the stage stays sticky on top, at about 40% of the height, and the tabs scroll under it.

**Analytics:**
- `reportToolUse('dressup', {cls})` fires on the first change.
- `track('dressup_share', {via})` fires on share.

## How we know it is right

- **The renderer must match the Python reference pixel for pixel.**
  - A test renders 30 random looks (class, sex, hair, colour, pieces, direction, action, frame) in TypeScript, using node-canvas or an offscreen canvas in Playwright, and with Python `render()`, and diffs them.
  - The test must be shown to fail: break the anchor shift or the mirror and watch it go red.
- **Draw order cannot be checked against Python**, because Python has no z rules beyond what we write.
  - Instead, a contact sheet of 40 known-tricky items (wings, back items, masks, hair wigs, items with per-direction overrides) is drawn in all 8 directions.
  - The owner checks it against the game.
- **Coverage report:** the converter prints how many items have a sprite for every class and sex, and lists the ones missing. Missing items show in the picker as "ยังไม่มีภาพ", never as a broken image.

## Order of work

0. **Spike (no deploy).**
   - Convert the Novice, head 1 in 2 colours, 3 hats and 1 garment.
   - Write `render.ts`.
   - Run the pixel test against Python.
   - Measure real sizes.
   - **Gate:** the pixels match. If they do not, stop and rethink before anything else.
1. **Full converter**, including the z baking and the coverage report.
2. **Page and picker**, previewed on :3178 with screenshots.
3. **Contact sheet review** by the owner.
4. **Hook-ups:**
   - the costume page button
   - nav
   - a site-updates row
   - analytics
5. **Deploy** after the owner says "ขึ้น".

## Risks

- **Draw order mistakes** on some items in some directions. The contact sheet review exists for this. The fix lives in the converter, so one rule change fixes every file.
- **Zero item ids differ from kRO.** We read Zero's own itemInfo, so view ids come from the client itself.
- **Assets:** only derived pictures go to `public/`. Raw .spr, .act and .pal files and any GRF never enter the repo. The repo is public.
- **Repo weight:** about 40 MB of binary files across about 10k files.
  - Option: put `public/dress-up/` in `.gitignore` and generate it during the deploy build. But the deploy machine has no client files, so in practice the files have to be committed, as costume-fit's are today.
  - This needs the owner's decision before step 1.

## Brainstorm notes, same day (supersede the scope above where they differ)

The owner's answers, in their words where quoted:

- **Purpose:** players screenshot the result to show off in groups and make memes ("แคปไปอวดในกลุ่ม ไปทำมีม"). So this is a photo scene, not just a fitting room.
- **The owner wants it complete:** movement, hitting a monster, picking which monster to hit, and typing a chat line over the head like in game.
- **Output:** a still picture is enough ("ภาพนิ่งก็พอ"). The page itself still animates. The capture takes the frame on screen.
- **Actors:** up to 2 characters plus 1 monster. This was Claude's recommendation; the owner left it to Claude.
- **Background:** real in-game scenes ("ฉากในเกม").
  - Spike result: roBrowserLegacy's MapViewer, run locally against the extracted Zero client, renders any of the 1,204 maps.
  - The throwaway setup is in the session scratchpad: `grfserve/serve.mjs`, the robl clone and `zmap.html`.
  - roBrowser can also drop a Novice entity into the scene, which serves as the calibration reference for scale and feet position.
- **Camera:**
  - The owner wants it closer than the game's default ("ซูมกว่านี้ เห็นตัวละครชัดๆ").
  - The game's own zoom limit is 65. 45 looks good.
  - The owner then asked for a lower angle so that 3D buildings show, not just floor.
  - Tested vertical angles: default 230, then 188, 185 and 183.
  - **185 with zoom about 90** shows the fountain statue, buildings and trees, with the character in front. This is Claude's pick.
  - At 183 a black sky shows, because town maps have no sky.
- **Characters away from the camera must shrink with depth.** Use the known ground position in the scene to compute the scale.
- Backgrounds are shot at 2x so the page can offer 2-3 zoom steps.
- **Open questions:**
  - One standard angle for all scenes, or a best angle per scene?
  - Which 10 scenes first?
