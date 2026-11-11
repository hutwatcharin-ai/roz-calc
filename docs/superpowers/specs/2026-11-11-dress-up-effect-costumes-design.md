# Dress-up: effect costumes (auras, landmarks, wings drawn as effects)

Date: 2026-11-11 · Owner request: "ทำเพิ่ม ทุกชิ้นที่ยังไม่มี" then "เห็นแบบที่จะเห็นในเกมเลย"

## Intent

The dress-up room (`/tools/dress-up`, spec `2026-10-24-dress-up-design.md`) shows every
headgear and garment whose sprite the client has. About 70 costume item ids (roughly 35
distinct looks plus their "(Bound)" twins) are missing because the game draws them as
**hat effects**, not sprites: Magic Circle, Swirling Flame, Soul's Blessing, the landmark
series (Tower of Light, Twin Towers, Kiwi's Peak...), Angel Stairs, Moon and Stars, etc.
The owner wants them in the room looking the way they look in game: animated, in front of
or behind the character as the client says, glowing (additive) rather than pasted on.

## What the client gives us (verified 11 Nov 2026)

- `System/itemInfo_data.lub`: these items have `ClassNum = 0` (no view id) and an
  `identifiedResourceName` (e.g. `C_Swirling_Flame`, `Magic_Circle`, Korean names for older ones).
- Extracted client `luafiles514/lua files/hateffectinfo/`:
  - `hateffectids.lub` → `HatEFID` (name → id, 280 entries, includes FOOTPRINT_* which we ignore)
  - `hateffectinfo.lub` → `hatEffectTable[id]` = `{ resourceFileName = 'efst_X\\file.str',
    hatEffectPos (y offset), hatEffectPosX, isRenderBeforeCharacter, isIgnoreRiding,
    isAdjustSizeWhenShrinkState, ... }`
  - `effecthatitemtable.lub` → plain list of item ids that carry a hat effect (155). Not a mapping.
- Effect files: `data/texture/effect/<dir>/<file>.str` plus its `.bmp`/`.tga` textures (present
  for the ones checked: `efst_magiccircle/mc.str`, `c_swirling_flame/vortexf2.str`). Paths are
  case-insensitive on the client; resolve case-insensitively.
- The item → hat effect link is **server-side** in the real game. We rebuild it:
  1. normalised `identifiedResourceName` vs `HAT_EF_*` name (matches 47 of 78 today);
  2. rAthena item_db (raw GitHub, allowed source) `hateffect HAT_EF_...` scripts by item id;
  3. a "(Bound)" / ROZ-only id takes the effect of a twin with the same resource name;
  4. anything still unmatched goes in a small hand-checked table in the build script with a
     comment saying how it was matched. Never guess silently: unmatched items are reported
     by the build and stay out of the room.

## Goals

- Every costume item whose effect we can link and whose `.str` exists appears in the room
  in its slot (upper/mid/lower/garment per the item description's ตำแหน่ง), wearable with
  other pieces, replacing whatever is in that slot (as in game).
- Drawn as in game: animated at the file's fps, looped; placed by `hatEffectPos`/`PosX`
  relative to the character; behind the character when `isRenderBeforeCharacter`, else in
  front; additive layers glow over the backdrop and character.
- Part of `npm run dress-up:build` / `dress-up:upload`, incremental like the other parts
  (rebuilt only when the `.str`, its textures or the tables change). New effects in a later
  patch come in with no code edit.
- The picker lists them like other costumes (search, slot filter, thumbnails).

## Non-goals

- The item page's fitting-room preview (`build-costume-fit.py`) — not this round.
- Footprint effects, guild shields (1270260, 1270291-1270294), Taming Ring (24966).
- The 14 garments and 48 headgear with a view id but no sprite in the client. Re-checked
  11 Nov 2026 across the current extract, the 15 Oct extracts and every weekly `added`
  folder: none of the 31 sprite names exists under any spelling. They come in on their
  own when a patch adds the files.
- Mounted-state or shrink-state variants (`isIgnoreRiding`, shrink flags): handle riding by
  following `isIgnoreRiding` if trivial, otherwise draw the same as unmounted.

## Anti-goals

- An effect that renders visibly wrong (missing layers, wrong colours, wrong place) going
  live. Each new effect is shown to the owner in the preview before deploy; any that look
  off are left out of the index, not shipped "close enough".
- Raw client files (`.str`, `.bmp`, `.tga`, `.lub`) in git or on R2. Only our own rendered
  output (WebP atlas + JSON) goes to R2, same as every other dress-up part.
- Copying code from roBrowser or other GPL projects. Reading format descriptions is fine;
  the parser is ours.
- Slowing the room for people who never pick an effect: effect data loads only when worn.

## Design

### Build side (Python, alongside `scripts/build-dress-up.py`)

1. **Mapping**: build `item id → { efId, str path, posY, posX, before }` as above. Output into
   the dress-up index under the item (new slot kind, e.g. `fx`), and list unmatched ids in
   `coverage.missing` with a reason.
2. **STR parser**: `STRM` header, version 0x94, fps, key count, layer count; per layer the
   texture names and keyframes (frame, type, position, uv, 4 corner xy, texture frame and
   anim type, delay, angle, RGBA colour, src/dst blend, preset). Keyframe type 0 = set,
   1 = morph toward the next key. Test against a few files whose look we can check in game.
3. **Pre-render**: rasterise every frame offline (numpy/Pillow: per layer, texture warped onto
   its quad, coloured, alpha) into two buffers per frame:
   - `normal`: layers with ordinary alpha blending, composited over transparent;
   - `add`: layers with additive blending (dst = ONE), composited onto black.
   Most effects are all-additive; mixed files keep relative order only within each buffer
   (accepted approximation, owner told). Black in `.bmp` textures is transparent as in the client.
   Crop each frame to its content; pack into a WebP atlas + JSON (frame rects, offsets, fps,
   anchor relative to the character's feet, `before` flag), keyed `fx/<efId>.<hash>`.
4. Frame count: if a file has many frames, render at the file's fps but allow dropping to every
   2nd frame if the atlas gets too big (builder's call on the threshold; keep total upload sane).

### Client side

- `lib/dress-up/look.ts`: an item in a slot whose index entry is an effect yields an `fx` part
  instead of an `acc`/`robe` part.
- `components/dressup/DressStage.tsx`: two extra canvases stacked with the character canvas,
  same 200x200 logical size and 3x pixel scaling: one behind (for `before` effects) and one in
  front. The `add` buffer is drawn on a canvas with CSS `mix-blend-mode: plus-lighter` so it
  adds over the backdrop and character; the `normal` buffer is a plain canvas layer. Each effect
  keeps its own clock (like other parts, frame = floor(ms·fps/1000) mod frames).
- Effects bigger than the 200x200 stage are clipped by the stage like anything else; if the
  landmark costumes routinely clip badly, the builder may widen the canvas for fx layers.
- Direction: hat effects do not turn with the character; same image for all 8 directions.

## Verification

- Unit tests: STR parse of a fixture (header/layer/key counts, a morph interpolation), mapping
  (a name match, a Bound twin, an unmatched item reported), `look.ts` producing the fx part.
- Visual: preview on 100.108.70.113:3178 with a short list of effects; compare against the
  owner's in-game look (the owner can screenshot a few in game if a match is doubtful).
- `npm run dress-up:upload -- --check` after upload; `next start` before deploy.

## Decisions after the builder check (Claude's calls, owner can overrule)

- **Sprite items that also carry a hat effect get both.** "เห็นแบบที่จะเห็นในเกมเลย" means the
  in-game look, and in game a headgear with an effect shows sprite + effect. One item can yield an
  `acc`/`robe` part and an `fx` part. The effect is valid for every class even when the sprite
  is missing for some; the missing-sprite check stays about the sprite. Review set grows from
  about 35 looks to all of `effecthatitemtable` that we can map (up to ~100).
- **Later patches: effects go in by default, with a deny-list.** The build includes every mapped
  effect; `data/dress-up-fx-deny.json` (ids + reason) keeps out ones the owner rejected. This
  matches the existing rule that visible work is previewed before deploy: the UPDATE-RUNBOOK
  dress-up step gets a line "new fx parts: show them in the preview".
- **Scale: one STR unit = one sprite pixel at the stage's 1x**, the same space the client uses for
  both at default zoom. Verified against the owner's eye in the first preview with three effects
  (Magic Circle, a landmark, Swirling Flame) before batch-rendering the rest; re-rendering is local
  and cheap, so a wrong first guess costs one rebuild, not a re-upload of everything (upload
  happens after the check).
- **Item page**: the note in `components/CostumeFit.tsx` that says effect costumes have no picture
  is replaced by the usual "▶ ลองใส่ในห้องแต่งตัว" link when the item has an fx part.
  `inDressRoom()` counts fx items; `CostumeSpin` (sprite turntable) ignores fx-only items.
  No effect rendering on the item page itself (still a non-goal).

## Left to the builder

Exact JSON shape for fx parts, atlas packing, frame-drop threshold, how shrink/riding flags are
handled, case-insensitive path lookup, and how thumbnails for the picker are made (one
representative frame on the usual thumbnail background).
