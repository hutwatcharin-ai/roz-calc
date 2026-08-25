# ROZ Calc — เว็บไกด์คำนวณ Ragnarok Zero Global

**สถานะ:** ร่าง รอ user รีวิว
**ชื่อโปรเจกต์:** `roz-calc` (codename ชั่วคราว — ยังไม่ได้ตั้งชื่อ/โดเมนจริง เปลี่ยนได้ก่อนเริ่ม implementation)

## 1. ภาพรวม

เว็บไกด์การเล่น Ragnarok Zero Global ภาษาไทย เน้นเครื่องมือคำนวณที่ใช้งานได้จริง (ไม่ใช่แค่บทความอธิบาย) ครอบคลุมทั้งผู้เล่นใหม่และผู้เล่นที่อยากเก่งขึ้น/optimize

**v1 มี 4 ฟีเจอร์หลัก:**
1. **EXP/Zeny Farming Finder** — ใส่ช่วงเลเวลตัวละคร แนะนำมอนสเตอร์/แมพที่ฟาร์ม EXP หรือ Zeny คุ้มสุด
2. **Drop Finder** — ค้นไอเทม → รายชื่อมอนสเตอร์ที่ดรอปพร้อมอัตรา (และกลับทาง มอนสเตอร์ → ของที่ดรอปได้)
3. **Stat/Build Calculator** — เลือกอาชีพ + ใส่แต้มสเตตัส คำนวณ ATK/HP/MATK ตามสูตร RO มาตรฐาน
4. **Monster/Item Database Browser** — เปิดดู/ค้น/filter ฐานข้อมูลมอนสเตอร์และไอเทม

## 2. แหล่งข้อมูล — สถานะและข้อจำกัดทางกฎหมาย

ตรวจสอบแล้วหลายเว็บก่อนเลือกแหล่งข้อมูล (2026-08-25):

| แหล่ง | ใช้ได้ไหม | เหตุผล |
|---|---|---|
| `ragnarokzero.net` — `/data/monsters.json`, `/data/items.json` | ✅ ใช้เป็นหลัก | robots.txt ไม่บล็อก ไม่มี ToS ห้าม bulk scrape ที่พบ ข้อมูลมี drop table + baseStats(STR/AGI/VIT/INT/DEX/LUK) + spawn map ครบ (ต้นทางแท้จริงคือ TWRoZ public asset feed) |
| `rozerodb.com` — `/player-skills` (851 ตัว, 9 หน้า) | ✅ ใช้เสริม | ไม่มีข้อห้ามเช่นกัน มี skill↔class mapping ที่อีกสองแหล่งไม่มี — ยังไม่ดึงเต็ม รอทำตอน implementation |
| `midgardhub.com` — `/data/monsters.json` ฯลฯ | ⚠️ ใช้เฉพาะ personal reference | ToS ระบุห้าม "scrape, republish, or redistribute large portions of the database in bulk without permission" — **ห้ามใช้เป็นฐานข้อมูลของเว็บสาธารณะนี้** ใช้ maps/quests เทียบข้อมูลส่วนตัวได้เท่านั้น |
| `ragnarokzero.wiki`, `ragnarokze.ro`, `assets.twroz.wiki` | ❌ ห้ามแตะ | robots.txt ระบุ `User-agent: ClaudeBot Disallow: /` ตรงตัว — เคารพ directive นี้เสมอ ไม่ว่าจะขอกี่รอบ |
| `wiki.playragnarokzero.com` | ❌ ใช้ไม่ได้ | โดเมนเข้าไม่ถึง (ตายหรือไม่มีจริง) |

**นัยสำคัญ:** สูตรคำนวณ ATK/HP/MATK ในฟีเจอร์ #3 เป็น**สูตร RO มาตรฐานที่เขียนขึ้นเอง**จากความรู้เกมสาธารณะ ไม่ใช่ค่าที่ยืนยันจาก Ragnarok Zero โดยตรง (ไม่มีแหล่งข้อมูล job/stat-growth ที่ใช้ซ้ำได้ถูกกฎหมาย) — **ต้องติดป้าย "ค่าประมาณการ" ถาวรในหน้า UI** พร้อมช่องทางแจ้งแก้ไข

## 3. สถาปัตยกรรมข้อมูล (Supabase)

Import ครั้งเดียว/รีเฟรชเป็นรอบ (รายเดือน) — ไม่ fetch สดทุก request

**ตาราง:**
- `monsters` — id, name_en/th, level, element, hp, atk_min/max, def, mdef, flee, hit, base_exp, job_exp, image_url
- `items` — id, name_en/th, category, weapon_type (parse จาก description text), atk, required_level, equippable_classes, buy/sell_price, icon_url
- `monster_drops` — monster_id, item_id, rate (junction — ขับเคลื่อน Drop Finder และคำนวณ zeny/kill โดยประมาณจาก sell_price × rate)
- `monster_spawns` — monster_id, map_id, map_display_name
- `maps`, `quests` — จาก midgardhub (personal reference เท่านั้น ตามข้อจำกัดข้อ 2)
- `skills` — id, name, type (active/passive), max_level, classes[] (จาก rozerodb)
- `feedback_reports` — page_type, entity_id, message, status (ปุ่ม "แจ้งข้อมูลผิด" ทุกหน้า — แก้ปัญหาความน่าเชื่อถือของข้อมูลระยะยาว)

สูตรคำนวณสเตตัส (ATK/HP/MATK ตามอาชีพ+เลเวล) เป็น **constant ในโค้ด ไม่ใช่ DB** เพราะเป็นกฎเกมตายตัว

## 4. Data Pipeline

สคริปต์ `scripts/import-data.ts` แยกจากตัวเว็บ รันตอน dev มือ + cron รายเดือน:
1. ดึง `ragnarokzero.net/data/monsters.json`, `/data/items.json`
2. Parse weapon type/required level/equippable class จาก item description (regex ตาม pattern `Type : X`, `Required Level : N`, `Equippable by : ...`)
3. ดึง maps/quests จาก midgardhub JSON ที่มีอยู่แล้ว (personal reference)
4. Upsert เข้า Supabase ทีละตาราง, log จำนวนแถวเปลี่ยน + error ให้เช็คมือ
5. ถ้าดึงปลายทางไม่ได้ (เว็บล่ม/โครงสร้างเปลี่ยน) — สคริปต์ต้อง fail ชัดเจน ห้าม overwrite ข้อมูลเก่าด้วยข้อมูลว่าง/พัง

**Error handling หน้าเว็บ:** query ไม่เจอผล → empty state ปกติ ไม่ throw; Supabase ล่ม → fallback message ไม่ crash หน้า

## 4.1 Assets (รูปมอนสเตอร์/ไอเทม/NPC)

ตรวจแล้ว (2026-08-25) — โหลดตรงจากโดเมนที่ใช้ได้ (ไม่ผ่านเว็บที่ถูกบล็อกในข้อ 2):

- **มอนสเตอร์**: `ragnarokzero.net/images/monsters/{monster_id}.gif` — ตรวจตัวอย่าง 1001/1091/1583 โหลดสำเร็จ (real GIF, 200)
- **ไอเทม**: `ragnarokzero.net/images/items/{item_id}.gif` — ส่วนใหญ่โหลดได้ แต่แคตตาล็อกไอเทมของ ragnarokzero.net ไม่ครบเท่า midgardhub (เช่น "Red Potion" ไม่มีในชุดเขา) → ไอเทมที่ไม่มีรูปต้อง fallback เป็น placeholder icon ในหน้าเว็บ ไม่ error
- **NPC**: `rozerodb.com/assets/npcs/{npc_name_lowercase}.gif` — มี 84 สไปรต์ ครอบคลุมเฉพาะ NPC ที่ผูกกับเควสที่ import ไว้แล้ว (ไม่ใช่ NPC ทั้งหมดในเกม)

**แผน**: สคริปต์ import ดาวน์โหลดรูปมาเก็บเอง (mirror ใน object storage/Supabase Storage หรือ public folder ของเว็บเรา) ไม่ hotlink ตรงจากปลายทางตอน production — กัน dependency กับเว็บคนอื่นตอน serve จริง และลดโหลดปลายทางเวลามีคนเข้าเว็บเรา

## 5. Tech Stack & Deploy

- Next.js 14+ (App Router) + Supabase — เหมือน PCX Hub/kidkrob
- ISR revalidate รายวันสำหรับหน้า DB/Farming Finder
- Deploy ผ่าน Coolify VPS เดิม (`207.148.123.125:8000`)
- ภาษา: UI ภาษาไทยทั้งเว็บ, เก็บ `name_en` คู่กันไว้ค้นหา/SEO

## 6. Testing

- Unit test สูตรคำนวณ (ATK/HP/MATK/EXP-per-hour) — จุดเสี่ยงพังเงียบสุดเพราะเป็นตัวเลข
- Test import script ด้วย fixture JSON ย่อ (กัน source เปลี่ยน format แล้ว parse เพี้ยนไม่รู้ตัว)
- ไม่ทำ E2E เต็มรูปแบบตอน v1 — เช็ค golden path ด้วยมือ (dev server)

## 7. Visual Identity — Neon Arcade

เทียบ 3 แนวทางจริง (Swiss Data / Neon Arcade / ผสม) ผ่าน artifact ก่อนเลือก — สรุปตัดสินใจ: **Neon Arcade ล้วน**

- อ้างอิง mockup: https://claude.ai/code/artifact/9b462926-d358-4eee-b386-76a29496b973
- **โทนสี**: พื้น indigo เข้ม (`#0B0820`/`#150E33`) — dark-only โดยตั้งใจ ไม่ทำ light theme
- แต่ละฟีเจอร์มีสีประจำตัว ("every entity owns an accent colour"): Farming Finder = เหลือง `#FFE53D`, Drop Finder = ชมพู `#FF3D9A`, Stat Calculator = ฟ้า `#3DE8FF`
- เงา offset แข็ง `4px 4px 0` (ไม่ใช้ soft shadow) บน panel/card หลักของแต่ละฟีเจอร์
- Label เล็กทั้งหมด (nav, field label, chip) ใช้ mono ตัวพิมพ์ใหญ่ letter-spacing กว้าง
- **ฟอนต์**: หัวข้อ Chakra Petch 700 (ไทย+อังกฤษ), เนื้อหา Sarabun, ตัวเลข/label IBM Plex Mono แบบ tabular-nums

**Trade-off ที่ยอมรับแล้ว** (แจ้ง user ก่อนเลือก): สไตล์นี้ "dark only, cannot carry a formal or financial tone" ตามคำอธิบายต้นแบบ — หน้าเว็บมีตัวเลขเงิน/อัตราดรอป/สเตตัสละเอียดที่ต้องสแกนนาน สีสามสีพร้อมกันเสี่ยงเมื่อยตากว่าดีไซน์ minimal — user เลือกยืนยันแบบนี้แล้วหลังเห็นการเทียบจริง

## 8. งานที่ยังไม่เสร็จ / ต้องทำตอน implementation

- [ ] ตั้งชื่อโปรเจกต์/โดเมนจริง (ตอนนี้ใช้ codename `roz-calc`)
- [ ] ดึง skill data เต็ม 851 ตัวจาก rozerodb.com (9 หน้า, ยังไม่ได้ทำตอน brainstorm)
- [ ] เขียน+verify สูตร ATK/HP/MATK มาตรฐาน RO ให้ตรงพฤติกรรมเกมมากที่สุดเท่าที่ทำได้ พร้อม unit test — ต้องตัดสินใจก่อนว่าใช้สูตรยุค Renewal หรือ Pre-Renewal เป็นฐาน (job list ที่เจอมี High Priest/Sniper/Paladin ชี้ว่าเป็น Renewal-era แต่ยังไม่ยืนยัน)
- [ ] ออกแบบ schema/flow ของ `feedback_reports` + หน้า admin รีวิว (ยังไม่ลง detail)
- [ ] Supabase project ใหม่ (ยังไม่สร้าง)
