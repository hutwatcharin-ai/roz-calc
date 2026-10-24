# Dress-up simulator research (24 Oct 2026)

Owner asked for a new tool, a dress-up simulator ("จำลองแต่งตัว"). This is the research before any design.

## What the site already has

- **Fitting room on every costume page**, built 2 Oct 2026.
  - Built by `scripts/build-costume-fit.py` into `public/images/costume-fit` and `data/costume-fit.json`, rendered by `components/CostumeFit.tsx`.
  - It shows a Novice with the default head wearing one costume, in 3 directions, male and female, animated when the sprite moves.
  - Coverage: 1,040 costumes on 522 sheets.
  - Skipped: 67 with no view id, 60 with no sprite, 6 with no position.
- **Effect costumes** (auras and the like) cannot be drawn as a sprite.
  - `scripts/build-costume-art.py` shows the in-game collection illustration instead, for 81 items.
- **Build simulator paper doll**, built 7 Oct 2026.
  - Built by `scripts/build-build-doll.py` into `data/build-doll.json`.
  - It has 38 class and sex bodies facing front, plus 160 headgear pieces placed by anchor offset.
- **The sprite reader is already written.**
  - `scripts/ro_sprite.py` reads .spr and .act and draws layers by anchor.
  - `scripts/lub.py` runs the client's .lub tables.
- The owner's words on 2 Oct were "a preview, not a simulator". Asking for a simulator now is the step beyond that.

## What the client gives us (22 Sep extraction plus the 15 Oct patch)

- **Stylist** (`luafiles514/lua files/stylingshop/stylingshopinfo.lub`)
  - 32 hair styles.
  - Hair palettes 1 to 8, plus the default 0, which makes 9 colours.
  - Body (cloth) palettes 0, 2 and 3.
  - The Stylist NPC is in itemmall (19,71). A change costs 100,000 zeny or a coupon (rozglobal guide).
- **Client dress room tables** (`dressroom/jobdresslist.lub`)
  - Hair colour names: default, yellow, purple, light brown, green, blue, white, dark brown, red.
  - Body palette names: default, A style, B style.
  - Whether RO Zero exposes the in-game dress room UI is unverified.
- **Layer order** (`datainfo/tb_layer_priority.lub`)
  - Default Top 200, Mid 100, Bottom 300, Robe 400.
  - Per-view overrides, some with a per-direction override, and some with isIgnoreRiding.
  - It needs `accessoryid.lub` loaded first.
- **Other tables present:**
  - `offsetitempos` (per-item position fixes)
  - `hateffectinfo` (effect costumes)
  - `transparentitem`
  - `spriterobeid` and `spriterobename` (garments)
  - `accessoryid` and `accname` (headgear)
- **Sprite folders**
  - 인간족/몸통 holds about 324 male files, covering every class through the 4th jobs plus mounts and outfits.
  - 머리통 holds 42 numbered heads per sex.
  - 악세사리 holds about 3,068 male headgear files and is 294 MB raw.
  - 로브 holds 112 garments. Each garment has its own .act per job, including riding variants.
  - palette/머리 has 750 files and palette/몸 has 1,339.
- **Costumes in game-items.json:** 1,173 in total.
  - By slot: Upper 446, Lower 324, Middle 196, Garment 141.
  - 60 take more than one slot.
  - 6 have no slot.
- Normal headgear also has view ids. The doll has 160 of them today.

## Demand (GA4 28 days, GSC 90 days, up to 22 Oct)

- **/database/costumes:** 13,003 views by 991 users.
- **Costume detail pages:** 738 pages, 9,160 views between them.
- **Search demand for a dress-up tool is close to nothing.**
  - "แต่งตัว ro" had 5 impressions at position 37.
  - Costume-related queries in total had 562 impressions and 60 clicks in 90 days, nearly all of them costume names.
- So the value is on-site use and sharing to Facebook, not search traffic.

## Existing tools elsewhere

- **Divine-Pride Dress-Up Previewer** (https://www.divine-pride.net/tools/dressup)
  - Choices: job, sex, hair style and colour, body colour, 3 headgear slots, garment, direction, and stand/move/attack/sit.
  - Weapon, armour, shield and shoes are marked "not supported yet".
  - The choice is shared through the URL.
  - Each layer is rendered on the server (/Tools/DressupFrame?layer=...) and the page stacks the layers.
  - Whether it uses Zero item ids is unverified. Its API has no render endpoint.
- **rozerodb.com** (Zero)
  - Per-item previews only, pre-rendered PNG rotations plus a GIF, male and female.
  - You cannot combine items. This is the same idea as our fitting room.
- **RateMyServer Char Simulator**
  - Visual dress-up, last changelog entry 2011. Pre-Zero.
- **zrenderer** (MIT, https://github.com/zhad3/zrenderer)
  - Self-hosted Docker render server reading an extracted GRF.
  - There is no public endpoint.
- **ragassets** (Go port, licence unclear)
  - A best-effort public demo running kRO/LATAM data, not Zero.
- **roBrowserLegacy** (GPL-3.0)
  - A full browser client with an ItemPreview window.
- **ROChargenPHP** was DMCA'd by Gravity on 2017-07-20 ("distributes RAGNAROK ONLINE data without permission") and now returns HTTP 451.
- No Thai dress-up tool turned up in Thai searches. That is unverified, not proof.

## Format notes

- Headgear is drawn by view id (ClassNum in itemInfo).
  - Path: `악세사리/<sex>/<sex><accname>`.
- Garment path: `로브/<name>/<sex>/<job>_<sex>`.
- Palette paths:
  - Hair: `palette/머리/머리<n>_<sex>_<c>.pal`
  - Body: `palette/몸/<job>_<sex>_<c>.pal`
- The action number is animation type × 8 + direction.
- In stand and sit, the 3 head frames are where the head looks (ahead, left, right), not animation.
- The z-order changes with direction:
  - Facing up or left, the head and headgear go above the body and the garment moves.
  - A garment sits behind the body from the front and in front of it from the back.

## Risk

- Gravity's known takedowns hit repos that distribute raw client data or client code.
- Fan databases that host derived images (Divine-Pride, rozerodb, RateMyServer) have no known takedown. That is unverified, and absence of evidence is not proof.
- The site already hosts derived costume images. A simulator would host more of the same kind.
- Raw GRF files must never go into the public repo. This is already a CLAUDE.md rule.

## Three ways to build it

- **A. Pre-drawn pieces stacked on the page** (the build-doll approach, made wider)
  - Pieces: body per class/sex/direction/cloth colour, head per style/colour/sex/direction, hat per view/sex/direction with an offset, garment per view/class/sex/direction.
  - No server is needed. It is cheap.
  - The cost is the image count. Garments times classes is the big multiplier.
  - It only works for a fixed set of directions and poses.
- **B. Draw on the client from converted sprites.**
  - Convert .spr to a PNG atlas and .act to JSON at build time.
  - A small TypeScript renderer places layers by anchor and swaps palettes on a canvas.
  - Every direction, sit, walk, the real animation and every hair and cloth colour would come for free.
  - Bytes are loaded only for what is picked.
  - The cost is porting ro_sprite.py to TypeScript plus the conversion step.
- **C. Self-host zrenderer** on the VPS or Coolify.
  - Least code. But it is one more service to run, the render cost is on our server, and Zero compatibility is unverified.
