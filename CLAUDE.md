# RO Zero Thai — rozerothai.com

ฐานข้อมูล + เครื่องมือ Ragnarok Zero Global ภาษาไทย · Next.js 14 (App Router) + Supabase + Coolify (VPS 207.148.123.125, app uuid `x130k1pxl928ne421jk9i5ic`) · repo GitHub **สาธารณะ** `hutwatcharin-ai/roz-calc`

## คำสั่งหลัก

- เทสต์: `npx vitest run` (~476 เทสต์) · typecheck: `npx tsc --noEmit` · build: `npx next build`
- ทดสอบ prod ในเครื่อง: `npx next start -p 3177` — **ฆ่า listener เก่าก่อนเสมอ** (`netstat -ano | findstr :3177` แล้ว taskkill) — server เก่าค้างพอร์ตทำให้ start ใหม่ตาย EADDRINUSE เงียบๆ แล้วหน้าเสิร์ฟ CSS เก่า 400/ไร้สไตล์
- deploy: push GitHub แล้ว `POST /api/v1/deploy?uuid=...` ที่ Coolify — **ห้าม deploy ถ้า push ยังไม่ติด** (network เครื่อง dev หลุดเป็นพักๆ push ล้มแล้ว deploy จะ build โค้ดเก่าเงียบๆ — เกิดมาแล้ว 2 ครั้ง) · grep ผล push ต้องรวมทั้ง "master -> master" และ "Everything up-to-date" (มีขีด)
- **หลัง deploy ทุกครั้ง: `npm run purge`** (Cloudflare cache HTML 24 ชม. redeploy ไม่บัสต์ให้ — เคยเสิร์ฟ /about เก่า Age 8,474 วิ หลัง deploy สำเร็จ) · ต้องมี `CLOUDFLARE_ZONE_ID` + `CLOUDFLARE_API_TOKEN` (สิทธิ์ Zone > Cache Purge เท่านั้น) ใน `.env.local` · ถ้ายังไม่มี token ต้องกด Purge Everything ในแดชบอร์ดเอง
- ⚠️ status ของ Coolify (`/api/v1/deployments/<uuid>`) เชื่อไม่ได้ — 3 ก.ย. ค้าง `running` ทั้งที่ container สลับแล้ว · เช็คของจริงที่ origin ตรงๆ: `curl -k --resolve rozerothai.com:443:207.148.123.125 https://rozerothai.com/<path>` (ข้าม Cloudflare)
- แก้ข้อมูลใน DB แล้วจะ verify ในเครื่อง: ลบ `.next/cache/fetch-cache` ก่อน build ไม่งั้นเห็นค่าเก่า (Next Data Cache ข้าม build)

## ฐานข้อมูล (Supabase, project `qxqxpnqrchzdpvqpsjvv`)

- PostgREST ตัดที่ **1,000 แถวเงียบๆ** — ตารางเกินพันต้องใช้ `lib/fetch-all-rows.ts` (items 3,833 · monster_drops ~3,750 · spawns 2,688)
- ⚠️ `monsters.hit_100` / `monsters.flee_95` (เดิมชื่อ hit/flee — เคยตีความผิดมาแล้ว 1 วัน): **ไม่ใช่สเตตัสของมอน** แต่เป็นค่าฝั่งผู้เล่นจาก midgardhub — hit_100 = HIT ที่ตีมอนตัวนี้โดน 100%, flee_95 = FLEE ที่หลบมันได้ 95% · แสดงเป็นเป้าได้ตรงๆ **ห้ามบวก +20/+75 ทับ** · โอกาส: ตีโดน = clamp(100−(hit_100−HIT)), มันตีเราโดน = clamp(5+(flee_95−FLEE)) — ดู `lib/hit-flee.ts` + `lib/monster-thresholds.ts`
- ค่า 0 ใน hp/base_exp = sentinel ไม่รู้ค่า · agi/dex ที่ไม่รู้เป็น NULL (ไม่ใช่ 0)
- `monster_drops.rate` เป็น NULL ได้ = ดรอปที่เกมไม่เปิดเผยอัตรา (UI แสดง "ไม่ทราบอัตรา"/"?")
- ตารางเสริม: `cash_shop_items` (77, ราคา ณ 31 ส.ค. 2026) · `quest_npcs` (quest_id → sprite_code, 81 แถว)
- คอลัมน์แปลไทย `*_th`: quests (name/objective/description ครบ 766) · items.description_th (การ์ด 312) · skills.description_th (339 ตัวที่มีข้อความ) · cash_shop_items.description_th (77) — ไฟล์ต้นทางแปลอยู่ใน `data/*.json` regen ได้
- DDL/แก้ข้อมูลตรง: Supabase management API `POST /v1/projects/<ref>/database/query` (curl + `--data-binary @file` — ตัว python urllib โดน 403)

## แหล่งข้อมูลภายนอก — กติกาเข้ม

- **ห้าม fetch เด็ดขาด** (robots ระบุ ClaudeBot): ragnarokzero.wiki · ragnarokze.ro · assets.twroz.wiki · roz.mygnjoy.com · irowiki.org — ส่งผ่าน subagent ก็ห้ามเท่ากัน
- **midgardhub.com**: ToS ห้าม bulk scrape/republish — ใช้ได้แค่ข้อมูล fact ที่อยู่ใน `docs/midgardhub-export/data/` (local เท่านั้น อยู่ใน .gitignore **ห้ามหลุดเข้า repo สาธารณะ** — เคยหลุดแล้วต้อง force-push ลบ) และให้เครดิตใน footer
- **ใช้ได้**: rozerodb.com (ยกเว้น `/api/`) — export อยู่ `docs/rozerodb-export/data/*.jsonl`, sprite NPC ดึงจาก `/assets/npcs/<code>.gif` · ragnarokzero.net (ยกเว้น /m/) · ratemyserver (ไอคอน item id-addressed — แต่ id ใหม่ๆ ได้ป้าย "No Image" md5 `a34c3279…` ต้อง reject) · static.divine-pride.net (รูป item ทาง PNG, robots เปิด) · rAthena raw GitHub
- ห้ามแกะ `D:\RagnarokZero\data.grf` · ห้ามใช้ Divine-Pride API มา mirror DB

## แพทเทิร์นในโค้ดที่ต้องรักษา

- ตัวเลขที่ไม่รู้ = แสดง "—"/"ไม่ทราบ" ห้ามมโน · ค่าที่คำนวณจากตัวละคร = บอกว่าเป็นเพดานบน
- มอน Challenge (ชื่อ `C1 `–`C9 `, 159 ตัว): ซ่อน default ทุกหน้า — list ใช้ server filter `?c=1`, หน้าอื่นใช้ class `.cvariant` + `CVariantToggle`
- character context v2 (`lib/character-context.ts`): เก็บเลขที่เกมโชว์ตรงๆ (Max HP/HIT/FLEE) — parser migrate เซฟ v1 (vit/job/dex/agi/luk) ผ่านสูตรเดิมอัตโนมัติ ห้าม reject
- สำนวน UI: กระชับ ไม่ใช้ "แก" ไม่ใส่คำแก้ตัวยาวๆ — ข้อจำกัดเขียนสั้นๆ ตรงจุดที่ตัวเลขโชว์
- คำว่า "Slot" ไม่ใช่ "ช่อง" สำหรับช่องการ์ดในอุปกรณ์
- component client ที่เป็น controlled input: ต้อง sync state ตาม prop/URL หลัง navigation (บั๊ก checkbox ดีดกลับเคยเกิด) · ห้ามส่ง function จาก server เข้า client component (500 เฉพาะ runtime, build จับไม่ได้ — พิสูจน์ด้วย `next start` ก่อน deploy)
- มีอีก Claude session ทำงาน repo นี้ขนานกันบ่อย: **ห้าม `git add -A`** (เลือกไฟล์รายตัว) · ห้าม `taskkill /IM node.exe` ทั้งเครื่อง

## ประวัติ/สถานะละเอียด

ดู `docs/SESSION_LOG.md` (อัปเดตท้าย session ใหญ่) · สเปกเก่าใน `docs/superpowers/specs/` · audit ที่ค้างใน `docs/SEO_AUDIT.md`, `docs/UX_AUDIT.md`
