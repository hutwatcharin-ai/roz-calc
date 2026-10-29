# RO Zero Thai — rozerothai.com

ฐานข้อมูล + เครื่องมือ Ragnarok Zero Global ภาษาไทย · Next.js 14 (App Router) + Supabase + Coolify (VPS 207.148.123.125, app uuid `x130k1pxl928ne421jk9i5ic`) · repo GitHub **สาธารณะ** `hutwatcharin-ai/roz-calc`

> **อ่าน `docs/GAME_MODEL.md` ก่อนทำงานที่แตะกติกาเกม เนื้อหาไกด์ หรือเครื่องมือ** — ภาพเกมที่เล่นจริง (ของใส่ ออปชัน ตลาด อาชีพ) · ทุกครั้งที่เจ้าของเว็บแก้ความเข้าใจผิดเรื่องเกม ให้เพิ่มหนึ่งบรรทัดในหัวข้อ 8 ของไฟล์นั้นทันที

## คำสั่งหลัก

- เทสต์: `npx vitest run` (~476 เทสต์) · typecheck: `npx tsc --noEmit` · build: `npx next build`
- ทดสอบ prod ในเครื่อง: `npx next start -p 3177` — **ฆ่า listener เก่าก่อนเสมอ** (`netstat -ano | findstr :3177` แล้ว taskkill) — server เก่าค้างพอร์ตทำให้ start ใหม่ตาย EADDRINUSE เงียบๆ แล้วหน้าเสิร์ฟ CSS เก่า 400/ไร้สไตล์
- deploy: push GitHub แล้ว `POST /api/v1/deploy?uuid=...` ที่ Coolify — **ห้าม deploy ถ้า push ยังไม่ติด** (network เครื่อง dev หลุดเป็นพักๆ push ล้มแล้ว deploy จะ build โค้ดเก่าเงียบๆ — เกิดมาแล้ว 2 ครั้ง) · grep ผล push ต้องรวมทั้ง "master -> master" และ "Everything up-to-date" (มีขีด)
- **`npm run deploy -- --path /บางหน้า --expect "ข้อความที่ต้องเจอ"`** = ตรวจ push → ยิง Coolify → รอจน origin เสิร์ฟของใหม่จริง → purge → แจ้ง Telegram พร้อมหัวข้อ commit (ต้องมี `TELEGRAM_BOT_TOKEN` ใน `.env.local` ไม่งั้นพิมพ์ข้อความออกจอแทน) · `--dry-run` ดูข้อความก่อนได้ ไม่ยิงจริง
- **หลัง deploy ทุกครั้ง: `npm run purge`** (Cloudflare cache HTML 24 ชม. redeploy ไม่บัสต์ให้ — เคยเสิร์ฟ /about เก่า Age 8,474 วิ หลัง deploy สำเร็จ) · ต้องมี `CLOUDFLARE_ZONE_ID` + `CLOUDFLARE_API_TOKEN` (สิทธิ์ Zone > Cache Purge เท่านั้น) ใน `.env.local` · ถ้ายังไม่มี token ต้องกด Purge Everything ในแดชบอร์ดเอง
- ⚠️ status ของ Coolify (`/api/v1/deployments/<uuid>`) เชื่อไม่ได้ — 3 ก.ย. ค้าง `running` ทั้งที่ container สลับแล้ว · เช็คของจริงที่ origin ตรงๆ: `curl -k --resolve rozerothai.com:443:207.148.123.125 https://rozerothai.com/<path>` (ข้าม Cloudflare)
- แก้ข้อมูลใน DB แล้วจะ verify ในเครื่อง: ลบ `.next/cache/fetch-cache` ก่อน build ไม่งั้นเห็นค่าเก่า (Next Data Cache ข้าม build)
- GA4 (`G-ZKTNY2H104`, property 552516626): event มีแค่ 3 — `page_view`(+content_group) / `search` / `tool_use` — **ห้ามเปลี่ยนชื่อ event/param** (ประวัติแตก) ทุกอย่างผ่าน `lib/analytics.ts` · ทดสอบในเครื่อง: build ด้วย `NEXT_PUBLIC_GA_DEBUG=1` แล้วดู DebugView · เปิดเว็บด้วย `?internal=1` ครั้งเดียวต่อเบราว์เซอร์เพื่อไม่ให้ตัวเองปนใน report · property ปิด history-based page_view ไว้ ถ้าเอา `send_page_view:false` ออกจะได้ page_view ซ้ำ

## ฐานข้อมูล (Supabase, project `qxqxpnqrchzdpvqpsjvv`)

- PostgREST ตัดที่ **1,000 แถวเงียบๆ** — ตารางเกินพันต้องใช้ `lib/fetch-all-rows.ts` (items 3,833 · monster_drops ~3,750 · spawns 2,688)
- ⚠️ `monsters.hit_100` / `monsters.flee_95` (เดิมชื่อ hit/flee — เคยตีความผิดมาแล้ว 1 วัน): **ไม่ใช่สเตตัสของมอน** แต่เป็นค่าฝั่งผู้เล่นจาก midgardhub — hit_100 = HIT ที่ตีมอนตัวนี้โดน 100%, flee_95 = FLEE ที่หลบมันได้ 95% · แสดงเป็นเป้าได้ตรงๆ **ห้ามบวก +20/+75 ทับ** · โอกาส: ตีโดน = clamp(100−(hit_100−HIT)), มันตีเราโดน = clamp(5+(flee_95−FLEE)) — ดู `lib/hit-flee.ts` + `lib/monster-thresholds.ts`
- ค่า 0 ใน hp/base_exp = sentinel ไม่รู้ค่า · agi/dex ที่ไม่รู้เป็น NULL (ไม่ใช่ 0)
- `monster_drops.rate` เป็น NULL ได้ = ดรอปที่เกมไม่เปิดเผยอัตรา (UI แสดง "ไม่ทราบอัตรา"/"?")
- ตารางเสริม: `cash_shop_items` (77, ราคา ณ 31 ส.ค. 2026) · `quest_npcs` (quest_id → sprite_code, 81 แถว)
- คอลัมน์แปลไทย `*_th`: quests (name/objective/description ครบ 766) · items.description_th (การ์ด 312) · skills.description_th (339 ตัวที่มีข้อความ) · cash_shop_items.description_th (77) — ไฟล์ต้นทางแปลอยู่ใน `data/*.json` regen ได้
- DDL/แก้ข้อมูลตรง: Supabase management API `POST /v1/projects/<ref>/database/query` (curl + `--data-binary @file` — ตัว python urllib โดน 403)

## แหล่งข้อมูลภายนอก — กติกาเข้ม

- **ห้าม fetch เด็ดขาด** (robots ระบุ ClaudeBot): ragnarokzero.wiki · ragnarokze.ro · assets.twroz.wiki · irowiki.org — ส่งผ่าน subagent ก็ห้ามเท่ากัน
- **เว็บทางการ `roz.mygnjoy.com` / `getporing.mygnjoy.com` อ่านได้แล้ว** (owner 15 ต.ค. 2569 สั่งเอากฎห้ามออก · robots.txt วันนั้นเหลือแค่ `User-Agent: * Allow: /` ไม่มีบรรทัด ClaudeBot แล้ว) · อ่านทีละหน้าเท่าที่ต้องใช้ ไม่ไล่ดูดทั้งเว็บ · ก่อนแตะ subdomain mygnjoy ใหม่ เช็ก robots.txt ให้ถึงท้ายไฟล์ก่อน ถ้ากลับมาบล็อก ClaudeBot ให้หยุดและบอก owner
- **midgardhub.com**: ToS ห้าม bulk scrape/republish — ใช้ได้แค่ข้อมูล fact ที่อยู่ใน `docs/midgardhub-export/data/` (local เท่านั้น อยู่ใน .gitignore **ห้ามหลุดเข้า repo สาธารณะ** — เคยหลุดแล้วต้อง force-push ลบ) และให้เครดิตใน footer
- **ใช้ได้**: rozerodb.com (ยกเว้น `/api/`) — export อยู่ `docs/rozerodb-export/data/*.jsonl`, sprite NPC ดึงจาก `/assets/npcs/<code>.gif` · ragnarokzero.net (ยกเว้น /m/) · ratemyserver (ไอคอน item id-addressed — แต่ id ใหม่ๆ ได้ป้าย "No Image" md5 `a34c3279…` ต้อง reject) · static.divine-pride.net (รูป item ทาง PNG, robots เปิด) · rAthena raw GitHub
- `D:\RagnarokZero\data.grf` แตกได้ (owner 15 ต.ค. 2569 ยกเลิกกฎห้าม) — ใช้เครื่องมือของ owner: โค้ด `tools\GrfDiffTool` · ตัวติดตั้งอยู่ `D:\Data grf roz\GrfDiffTool` (shortcut บน Desktop, publish ทับด้วย `-o` ตาม README) อ่าน `D:\RagnarokZero\data.grf` ตรง ผลไปที่ `D:\Data grf roz\weekly` (ฐานแรกที่แตกจริง = 2026-10-29) · คู่มือ `D:\Data grf roz\GRF_WEEKLY_DIFF_GUIDE.md` · ⚠️ GRF ของเกมเป็น 0x300 "Event Horizon" — **GrfCL/GRF Editor เปิดไม่ได้** (snapshot 12/15 ต.ค. จึงมาจากไฟล์แตกเก่า 22 ก.ย.) ต้องใช้ `tools/grf-extract.mjs` (โปรแกรมเรียกผ่าน node) · entry flag 2 (~49,790 ไฟล์) ถอดไม่ได้ เทียบได้แค่ hash ข้อมูลดิบ · ถ้าเกม (Ragexe) เปิดอยู่ โปรแกรมหยุดไม่เขียน snapshot · ไม่เอาไฟล์ดิบ GRF ทั้งก้อนขึ้น repo สาธารณะ
- ห้ามใช้ Divine-Pride API มา mirror DB

## คำสั่งบอท Telegram (@rozerothaibot)

owner พิมพ์ / ในแชตบอท: /news /inbox /check /today /week /up /events /find /help · โค้ดคำสั่ง `lib/telegram-bot.ts` (มีเทสต์) ตัวดึงข้อมูลจริง `lib/telegram-deps.ts` รับ webhook ที่ `app/api/telegram/route.ts` (เช็ก `TELEGRAM_WEBHOOK_SECRET` + ตอบเฉพาะแชต owner) · แก้รายการคำสั่งแล้วรัน `npx tsx --env-file=.env.local scripts/telegram-setup.mts` ให้เมนูอัปเดต · Coolify ต้องมี `TELEGRAM_BOT_TOKEN` `TELEGRAM_WEBHOOK_SECRET` `GA4_SERVICE_ACCOUNT_JSON` `GITHUB_DISPATCH_TOKEN` (fine-grained, repo นี้, Actions เขียนได้อย่างเดียว ใช้กับ /check)

## ประกาศ Discord ทางการ → "ทำข่าว"

ระบบ: ห้อง #ข่าวทางการ ในเซิร์ฟเวอร์ ROZ ข่าว ของเจ้าของเว็บ กด Follow 5 ช่องทางการไว้ ส่วนห้อง #ส่งต่อ เป็นโพสต์ผู้เล่นที่เจ้าของเว็บกด Forward มาเอง บอท ROZ Reader อ่านทุกชั่วโมงด้วย `scripts/discord-news.mjs` ผ่าน workflow `discord-news.yml` แล้วเก็บลง branch `discord-inbox` พร้อมส่ง Telegram รายงาน 14:00 นับประกาศที่ยังค้างให้ด้วย

เมื่อ owner บอก "ทำข่าว":
1. `npx tsx --env-file=.env.local scripts/discord-inbox.mts list` เพื่อดูประกาศที่ค้าง (เปิด worktree `../roz-inbox` ให้เอง) แล้วอ่านไฟล์ `.md` กับรูปใน `img/`
2. ประกาศทางการ แบ่งตามประเภท:
   - แพทช์หรือปิดปรับปรุง: แก้ข้อมูลที่ประกาศบอก (มอน/แมพ/ร้าน) และทำหน้า `/news/patch-*` + แถว NEWS + การ์ด (`scripts/build-news-cards.mts`)
   - อีเวนต์/คูปอง: ใส่หน้า `/news/events-<ปี-เดือน>`
   - โปรร้าน Kafra: ใส่หน้า cash shop ถ้าเกี่ยว
3. โพสต์ผู้เล่น (`kind: player`): เป็น**ข้ออ้าง** ไม่ใช่ข้อมูลยืนยัน ใส่เว็บได้เฉพาะพร้อมป้าย "ผู้เล่นรายงาน" + วันที่ และห้ามเขียนทับค่าที่มาจากเกม
4. ส่งพรีวิวตามปกติ ขึ้นเว็บเมื่อ owner บอก "ขึ้น" เท่านั้น
5. หลังขึ้นเว็บแล้ว: `scripts/discord-inbox.mts done <id...>` · ถ้าแพทช์เพิ่มมอนหรือแมพ ให้รัน `... names` ใหม่ เพื่อให้ระบบจับชื่อในประกาศรอบหน้าได้

## แพทเทิร์นในโค้ดที่ต้องรักษา

- ตัวเลขที่ไม่รู้ = แสดง "—"/"ไม่ทราบ" ห้ามมโน · ค่าที่คำนวณจากตัวละคร = บอกว่าเป็นเพดานบน
- มอน Challenge (ชื่อ `C1 `–`C9 `, 159 ตัว): ซ่อน default ทุกหน้า — list ใช้ server filter `?c=1`, หน้าอื่นใช้ class `.cvariant` + `CVariantToggle`
- character context v2 (`lib/character-context.ts`): เก็บเลขที่เกมโชว์ตรงๆ (Max HP/HIT/FLEE) — parser migrate เซฟ v1 (vit/job/dex/agi/luk) ผ่านสูตรเดิมอัตโนมัติ ห้าม reject
- สำนวน UI: กระชับ ไม่ใช้ "แก" ไม่ใส่คำแก้ตัวยาวๆ — ข้อจำกัดเขียนสั้นๆ ตรงจุดที่ตัวเลขโชว์
- คำว่า "Slot" ไม่ใช่ "ช่อง" สำหรับช่องการ์ดในอุปกรณ์ · **ศัพท์อาวุธ/เกมใช้ตาม `docs/PLAYER_GLOSSARY.md`** (มีด ไม่ใช่กริช · คทา ไม่ใช่ไม้เท้า · สนับมือ · กาต้า · "ตีกี่ที" ไม่ใช่หมัด)
- component client ที่เป็น controlled input: ต้อง sync state ตาม prop/URL หลัง navigation (บั๊ก checkbox ดีดกลับเคยเกิด) · ห้ามส่ง function จาก server เข้า client component (500 เฉพาะ runtime, build จับไม่ได้ — พิสูจน์ด้วย `next start` ก่อน deploy)
- มีอีก Claude session ทำงาน repo นี้ขนานกันบ่อย: **ห้าม `git add -A`** (เลือกไฟล์รายตัว) · ห้าม `taskkill /IM node.exe` ทั้งเครื่อง
- **ภาพห้องแต่งตัว (dress-up)**: atlas+JSON ทุกชิ้นอยู่บน R2 (`NEXT_PUBLIC_DRESSUP_BASE`) ไม่อยู่ใน git · `npm run dress-up:build` (อ่านไคลเอนต์ที่แตกไว้ → `out/dress-up/` + `data/dress-up.json` index + `data/dress-up-manifest.json`, ทำเฉพาะชิ้นที่ไฟล์ต้นทางเปลี่ยน) แล้ว `npm run dress-up:upload` (ตั้ง CORS ให้ bucket + ส่งเฉพาะไฟล์ที่ bucket ยังไม่มี) · **bucket ต้องมี CORS** อนุญาต GET, HEAD จาก https://rozerothai.com, https://www.rozerothai.com, http://100.108.70.113:3178, http://localhost:3000 (หน้าเว็บดึง JSON/WebP ข้ามโดเมนมาวาดลง canvas) — สคริปต์ตั้งให้เองถ้า token มีสิทธิ์ ไม่งั้นตั้งใน dashboard R2 > bucket > Settings > CORS Policy · ตรวจด้วย `npm run dress-up:upload -- --check` (ต้องได้ 200 + Access-Control-Allow-Origin) · **ห้าม commit `out/dress-up/`** และห้ามเอาไฟล์ดิบไคลเอนต์ (.spr/.act/.pal/.imf/.lub) เข้า repo หรือ R2 · env R2: `R2_ACCOUNT_ID` `R2_ACCESS_KEY_ID` `R2_SECRET_ACCESS_KEY` `R2_BUCKET` — เช็กได้แค่ชื่อกับความยาว ห้ามพิมพ์ค่า

## ประวัติ/สถานะละเอียด

ดู `docs/SESSION_LOG.md` (อัปเดตท้าย session ใหญ่) · สเปกเก่าใน `docs/superpowers/specs/` · audit ที่ค้างใน `docs/SEO_AUDIT.md`, `docs/UX_AUDIT.md`
