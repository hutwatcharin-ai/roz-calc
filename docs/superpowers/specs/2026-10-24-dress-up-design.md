# Meme studio / dress-up room: design (24 Oct 2026)

Background research: `docs/RESEARCH-dress-up-2026-10-24.md`. The owner asked for this to be thought through carefully ("คิดให้ดีๆก่อนนะ งานนี้น่าจะใหญ่").

## Intent

RO Zero players want to show off their look and make memes in their Facebook groups ("แคปไปอวดในกลุ่ม ไปทำมีม").

The tool is a photo studio. You build a small scene that looks exactly like the game, then save a still picture to post:

- one or two dressed-up characters
- a monster
- chat bubbles
- a damage number
- an in-game location behind them

What makes it special:

- It is the real game look. The sprites and the scenes come from the RO Zero client itself.
- It is in Thai.
- No such Thai tool exists. Divine-Pride's dress-up previewer has no scenes and no monsters, and its Zero support is unverified.

**Why now.** This is the owner's request. Costume pages already draw about 22k views a month (/database/costumes 13k, detail pages 9k). Each costume page has a one-item fitting room, built 2 Oct. This tool is the step beyond that.

Search demand for "dress-up" is close to zero ("แต่งตัว ro" had 5 impressions in 90 days). Any value comes from people on the site and from shared images, not from Google.

## Success, measured 4 weeks after launch

- **Pictures saved (`meme_save`):** the main number, because the whole point is a picture leaving the site.
- **Links shared (`meme_share`).**
- **People who change something after landing,** as a share of people who open the page. The build tool's 56% is the bar.
- **Clicks into the room** from costume pages.

## Goals

**Scene**
- One of 10 pre-shot in-game backgrounds. The owner approved this list:
  1. Prontera fountain
  2. Poring field (prt_fild08)
  3. Payon village
  4. Payon cave
  5. Geffen tower
  6. Morroc market
  7. Alberta port
  8. Sphinx (in_sphinx2)
  9. Mjolnir mine (mjolnir_04)
  10. Glast Heim
- **Camera, as the owner chose:**
  - lower than the game's angle, so 3D buildings show
  - closer than the game's zoom
  - looking at the scene's landmark, with the characters standing in the foreground

  The spike reference is Prontera at vertical angle 185, zoom about 90, camera aimed at the fountain, and the character a few cells toward the camera.
- **Actors:** up to 2 characters and 1 monster. Each can be dragged around the ground. They get smaller as they move away from the camera, using the scene's real ground geometry.
- The scene animates live on the page: sprites move and attack loops play. A pause button freezes the chosen moment.

**Character**
- 19 RO Zero classes, male and female. Bard is male only and dancer female only.
- The Stylist's 32 hair styles, 9 hair colours and its cloth colours.
- Up to 4 costume or headgear slots: upper, middle, lower and garment.
  - The choice includes every costume and every normal headgear that has a view id.
  - An item that takes more than one slot clears whatever it overlaps.
- A weapon, so that attack poses look right.
- Poses: stand, walk, sit, attack, hit, dead. 8 directions.
- **Chat bubble:** typed by the user, styled like the in-game chat over the head.
- **Emote:** the in-game /emotion set, if the client's emotion sprites can be read. Unverified.

**Monster**
- Any monster in the site's database, found by searching its name.
- Poses: stand, attack, hit, dead.
- No chat bubble. Monsters do not chat in the game.

**Props**
- A damage number in yellow game digits, typed by the user, or the word MISS.
- A vending shop sign with a typed shop name.

**Output**
- "บันทึกภาพ" saves a 2x PNG with a small rozerothai.com watermark.
- A share link opens the same scene, and the person who opens it can keep editing.

**Layout** (owner chose phone layout A)
- **Desktop:** the stage on the left with turn, zoom and pause controls. A panel on the right with:
  - actor chips: ตัวที่ 1 / ตัวที่ 2 / มอน
  - tabs: ใส่ของ / อาชีพ-ผม / ท่า / ข้อความ / ฉาก
  - the save button
- **Phone:** the stage stays pinned on the upper half and the panel scrolls beneath it.
- The mockup is kept in `.superpowers/brainstorm/` (local only).
- The style is the site's neon arcade style.

**Entry points**
- A new page `/tools/dress-up`.
- A "▶ ลองใส่ในห้องแต่งตัว" button on costume pages that opens the room wearing that item.
- A row in the tools menu.
- A site-updates row.

## Non-goals

- Stats, damage maths or anything about gear effects. The build tool owns that.
- Video or GIF output. The owner said "ภาพนิ่งก็พอ".
- A live 3D map in the browser. The backgrounds are pictures shot ahead of time.
- More than 2 characters or 1 monster.
- Mounts, outfits, effect auras drawn on the body, and skill effects. These are later work, only if the tool is used.

## Anti-goals (it fails even if it works)

- **It does not look like the game.** Examples:
  - a hat drawn on the wrong layer
  - a character floating or the wrong size for the scene
  - a font that is clearly not the game's

  People will not post it. The owner reviews a contact sheet of tricky items in all 8 directions before launch.
- **It is slow or heavy on a phone.** A whole scene should load in well under 1 MB beyond the background.
- **Effect costumes are faked onto the body.** They say so instead, and show their collection art, as the costume pages do today.
- **Raw client files (.spr, .act, .pal, .rsw, a GRF) reach the public repo or the live site.** Only derived pictures and JSON may be published.

## Constraints

- Repo: `D:\Web\roz-calc`, Next.js. It is a public GitHub repo.
- Deploys are previewed on :3178 and go live only when the owner says "ขึ้น".
- Client files come from the local extraction in `D:/Data grf roz/`: the 22 Sep full extraction plus the 15 Oct patch, newest first.
  - The deploy machine has none of these.
  - Every derived asset must be generated locally and committed. The repo pack is 70 MB today.
- **Existing code to build on:**
  - `scripts/ro_sprite.py` (spr/act reader and layer drawing)
  - `scripts/lub.py` (client Lua tables)
  - `scripts/build-costume-fit.py` and `scripts/build-build-doll.py` (view-id lookups, garment file rules)
  - `data/game-items.json`
  - the monster database and its sprite files
  - `lib/search-catalog` (item and monster name search, Thai and English)
- **Scene rendering:** roBrowserLegacy (GPL-3.0) MapViewer, run locally only as a camera to produce background pictures.
  - Its code is never shipped or committed to roz-calc.
  - The spike setup is in the session scratchpad:
    - `grfserve/serve.mjs` serves the extraction as a "remote client" and maps cp949 names.
    - The robl clone has a patched `src/App/MapViewer.js` that reads x/y/doll from the URL hash and exposes `window.ZCam`.
    - `zmap.html` uses INLINE mode.
    - `shot.mjs` drives it with Playwright and takes angle, zoom, target and DPR from the environment.
  - This setup must be rebuilt as a repeatable script in the repo (`scripts/scenes/`). The roBrowser checkout stays outside the repo and is set up by a README step.
- **Gravity's assets:** the site already hosts derived sprite pictures, and so do Divine-Pride and rozerodb. Gravity's known takedowns hit repos that distributed raw client data or client code. Keep to derived output.

## Decided how (the owner's calls)

- Approach B: draw sprites in the browser from data converted at build time, not with a render server.
- Real in-game scenes rendered from the client, with the low, close camera, the landmark behind and the actors in front.
- The 10 scenes listed above.
- 2 characters and 1 monster.
- A still picture as output, an animated page.
- Phone layout A.
- **Claude's calls, which the owner accepted:**
  - weapons included
  - share link included
  - watermark on the saved picture
  - monsters get no chat bubble

## Left to the builder

- Data formats, file layout and atlas packing.
- **Palettes:** pre-apply them per hair and cloth colour at build time (recommended in the research), or swap them in the browser.
- How z-order is baked:
  - `tb_layer_priority`
  - the robe table's `IsTopLayer` / `RobeTopLayer`
  - the `imf` files
  - the direction rules
- **Scene calibration.** For each scene, record the camera's projection so the page can map a ground cell to a screen position and a scale. One way is to export roBrowser's view and projection matrices and the ground heights for the visible cells at shot time. Another is to fit them from 3 to 4 reference Novices that roBrowser draws at known cells.
- **How a scene is lit for sprites.** roBrowser tints entities by map light. Decide whether our sprites match that.
- **The fonts for chat and damage digits.**
  - The client ships damage digit sprites (to check).
  - The chat font is a web font that looks close.
- The URL encoding of a scene.
- The order of work, and how the existing per-item fitting room relates. Keep it, and link from it.
- **Verification:**
  - Pixel-match the browser renderer against `ro_sprite.py` on random looks, and prove the test fails when the renderer is broken.
  - The owner reviews a contact sheet for draw order.
  - A coverage report lists items with no sprite.

## Settled after the builder check (Claude's calls unless marked)

- **Turn** turns the selected actor's facing. It never turns the camera, so each scene is one shot with one calibration.
- **Zoom** is 2 or 3 digital steps over a single shot. The shot is taken at 2x resolution, so the steps stay sharp.
- **"บันทึกภาพ" always saves the whole scene frame** at 16:9 and 2x, whatever the device. A phone and a desktop save the same picture.
- **The share link encodes the scene in the URL.** There is no database and no server rendering.
  - The link preview on Facebook is a generic card in phase 1. The saved picture is the main channel.
  - Chat text is limited to 60 characters per bubble.
- **Weapon:** the user picks a weapon type the class can use (sword, dagger, bow and so on), drawn with that class's own weapon-type sprite. Picking one specific weapon item is not supported. There are no shields or dual wielding in phase 1.
- **Monsters** that have no sprite in the Zero client are left out of the monster search. The coverage report lists them.
- **The asset pipeline can be re-run** after a weekly GRF patch. It is incremental per file.

## Open (for the owner)

- **The total weight ceiling for repo and site, and where the assets live.** The question is whether to commit everything to git or to host it outside, for example on Cloudflare R2.
