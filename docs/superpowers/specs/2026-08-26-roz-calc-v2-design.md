# ROZ Calc v2 — ขยายฐานข้อมูลจากของที่มีในมือ

**สถานะ:** ร่าง รอ user รีวิว
**ต่อจาก:** `2026-08-25-roz-calc-design.md` (v1 — live อยู่แล้ว)

## 1. ที่มาและเป้าหมาย

v1 ปล่อยขึ้น production แล้ว มี 3 ฟีเจอร์ (Farming Finder, Drop Finder, Monster/Item DB Browser) + Global Search
เป้าหมาย v2: เพิ่มฟีเจอร์ให้ใกล้เคียงเว็บคู่แข่ง (midgardhub, rozerodb) **โดยใช้เฉพาะข้อมูลที่มีสิทธิ์ใช้อยู่แล้ว** ไม่ต้องหาข้อมูลใหม่จากแหล่งที่ติดข้อจำกัด

## 2. สิ่งที่สำรวจแล้วและตัดทิ้ง — พร้อมหลักฐาน

สำรวจฟีเจอร์ของ midgardhub + rozerodb ครบ (26 ส.ค.) พบ gap ~15 อย่าง แบ่งเป็น 4 กลุ่ม กลุ่มที่ตัดทิ้งพร้อมเหตุผล:

### กลุ่มเครื่องมือคำนวณ (refine simulator, forge, brewing, arrow crafting, affix, EXP calc, skill tree) — **ตัดทิ้งทั้งกลุ่ม**

ต้องใช้ตัวเลข/สูตรที่เราไม่มี ตรวจแหล่งที่เป็นไปได้ครบทุกทางแล้ว ไม่มีทางที่ใช้ได้:

| แหล่ง | ผลตรวจ |
|---|---|
| rAthena (GPL-3.0, open source) | มีไฟล์ครบ (`refine.yml`, `produce_db.txt`, `item_randomopt_db.yml`, `skill_tree.yml`, `job_exp.yml`, `level_penalty.yml`) แต่ deep-research ยืนยัน 3-0 ว่า **rAthena ไม่มีโหมด Zero เลย** — มีแค่ pre-renewal/renewal ทั้งระดับ compile flag (`renewal.hpp` ไม่มีคำว่า ZERO) และระดับข้อมูล (`db/` มีแค่ `pre-re`, `re`) สิ่งที่เรียกว่า "Zero support" คือ packet layer ของ client (`PACKETVER_ZERO`) ล้วนๆ ไม่แตะข้อมูลเกมสักไฟล์ ค่าที่ได้จึงเป็นค่า **renewal ไม่ใช่ Zero** |
| Divine-Pride API | มี server alias `GZero`/`kROZ`/`twROZ` แยกจริง แต่ Usage Guidelines ห้ามตรงตัว: *"Don't try to mirror the whole database... It isn't meant to let a third party stand up a competing copy of this site's database"* + *"scripted bulk id enumeration... will get a key revoked"* — และต่อให้ไม่ติดข้อนี้ endpoint มีแค่ `Monster`/`Item`/`Skill`/`Efst`/`LatestUpdates` **ไม่มี refine/forge/affix/EXP** อยู่ดี |
| midgardhub.com | ToS ห้าม *"scrape, republish, or redistribute large portions of the database in bulk"* |
| ragnarokzero.wiki, ragnarokze.ro, assets.twroz.wiki | robots.txt ระบุ `User-agent: ClaudeBot / Disallow: /` |
| rozerodb.com `/api/` | robots.txt ของเขาเอง `Disallow: /api/` (หน้า tool ไม่มีตัวเลขใน HTML โหลดจาก API) |
| `data.grf` (game client) | container เข้ารหัส signature `"Event Horizon"` ไม่ใช่ GRF มาตรฐาน — ไม่ reverse-engineer |

**หลักฐานเพิ่มจากฝั่งผู้เล่น (ซับ YouTube 29 คลิป, 26 ส.ค.):** Zero **ไม่มีขั้นบันได EXP ตามส่วนต่างเลเวลเลย** (ตีมอนห่างแค่ไหนก็ได้ EXP เต็ม) หักเฉพาะดรอป 50% เมื่อห่างเกิน 40 เลเวล — ขัดกับตาราง `level_penalty.yml` ของ rAthena renewal ชัดเจน (renewal ให้โบนัส 140% ที่ +10 และหน้าผา 40% ที่ +16) **ยืนยันว่าค่า renewal ใช้กับ Zero ไม่ได้จริง**

**นัยสำคัญ:** Farming Finder ปัจจุบันเรียงตาม EXP/HP ดิบโดยไม่ใส่ค่าปรับเลเวล — **ถูกต้องแล้วสำหรับ Zero ไม่ต้องแก้**

### Quests + NPCs — **เลื่อนออกไป**

- `quests.json` (766 เควส) ที่มีอยู่ **มาจาก midgardhub** → ruling เดิมของโปรเจกต์ระบุว่าใช้เทียบส่วนตัวได้เท่านั้น ห้ามเป็นฐานข้อมูลเว็บสาธารณะ (เหตุผลที่ v1 ไม่เคย import)
- `npcs.json` (84 ตัว จาก rozerodb ใช้ได้) แต่ชื่อเป็นรหัสสไปรต์ดิบ (`4_BABYLEOPARD`) คุณค่าเดียวคือ "ผูกกับเควสไหน" — ไม่มีเควสก็ไร้ความหมาย
- ถ้าจะทำต้องดึงเควสใหม่จาก rozerodb (767 หน้า) = งานแยกต่างหาก ไม่อยู่ใน v2

### กลุ่มของเล่น/ชุมชน (MVP timer, job quiz, geoguesser, emblem maker, homunculus AI, market, guides) — **ยังไม่ทำใน v2**

ไม่ติดข้อจำกัดข้อมูล แต่เป็นงานคนละก้อน เก็บไว้พิจารณาหลัง v2

## 3. Scope ของ v2 — 6 ฟีเจอร์ + 1 data fix

### 3.0 Data fix: เพิ่ม `description` ให้ตาราง items (ต้องทำก่อนข้ออื่น)

ตาราง `items` ปัจจุบัน**ไม่มีคอลัมน์ description** ทั้งที่ raw data มีครบ 1,300/1,300 — หน้า item detail จึงโชว์แค่ ATK/เลเวล/อาชีพ ไม่มีคำอธิบายเอฟเฟกต์เลย และ Cards browser (ข้อ 3.3) จะไม่มีอะไรให้แสดงถ้าไม่มีข้อมูลนี้

- migration `0003_item_description.sql`: `alter table items add column description text;`
- `transformItem` เพิ่ม `description: raw.description?.text ?? null`
- รัน import ใหม่ (upsert ทับของเดิม ไม่ต้องล้างตาราง)
- หน้า item detail แสดง description (คงบรรทัดใหม่ด้วย `white-space: pre-line`)

### 3.1 Skills browser (`/database/skills`)

ข้อมูลพร้อมใน DB แล้ว 851 แถว ไม่มีหน้าเว็บใช้เลยตั้งแต่ v1

- **List:** ชื่อ + ไอคอน + ชนิด (active/passive) + max level + อาชีพที่ใช้ได้
- **ค้น/กรอง:** ค้นชื่อ, กรองตามอาชีพ (จาก `classes` array), กรองตามชนิด
- **Pagination:** 50/หน้า แบบเดียวกับหน้าอื่น
- **ไม่ทำหน้า detail** — ข้อมูลที่มีต่อสกิล (ชื่อ/ชนิด/max level/ธาตุ/อาชีพ/ไอคอน) น้อยเกินกว่าจะเปิดเป็นหน้าเดี่ยว แสดงครบในแถวรายการได้เลย
- **⚠️ ต้องแสดงให้ผู้ใช้รู้:** 448/851 ไม่มีชนิด และ 418/851 ไม่มีอาชีพผูก (ข้อมูลต้นทางเองไม่สมบูรณ์ — rozerodb เขียนว่า "Client-data verification in progress") → แสดง `—` ไม่ใช่เดาค่า และมีหมายเหตุบนหน้าว่าข้อมูลบางส่วนยังไม่ครบ

### 3.2 Maps browser (`/database/maps`, `/database/maps/[code]`)

จาก `monster_spawns` ที่มีอยู่ (3,032 แถว, 497 แมพ)

- **List:** รหัสแมพ + ชื่อแมพ + จำนวนมอนสเตอร์ในแมพ — ค้นได้ + pagination
- **Detail:** รายชื่อมอนสเตอร์ที่เกิดในแมพนั้น พร้อมรูป/เลเวล/EXP/HP ลิงก์ไปหน้ามอนสเตอร์
- **⚠️ 245/497 แมพเท่านั้นที่มีชื่อจริง** ที่เหลือมีแต่รหัส (`moc_f18_a`) → แสดงรหัสแทนชื่อเมื่อไม่มี ไม่ซ่อนแมพนั้นทิ้ง

### 3.3 Cards browser (`/database/cards`)

289 การ์ด กรองจาก `items.category = 'Card'` — ต้องรอ 3.0 เสร็จก่อน

- **List:** ไอคอน + ชื่อ + **เอฟเฟกต์** (จาก description) + ช่องที่ใส่ได้ (parse จากบรรทัด `Equipped on : X`)
- ค้นชื่อ + ค้นในเอฟเฟกต์ (เช่นพิมพ์ "LUK" เจอการ์ดที่เพิ่ม LUK ทุกใบ) + pagination
- ใช้หน้า item detail เดิมสำหรับรายละเอียด (ไม่ทำหน้า detail แยก — การ์ดคือ item ชนิดหนึ่ง)

### 3.4 Equipment browser (`/database/equipment`)

490 ชิ้น (Armor 181 + Weapon 170 + Costume 139) — ตอนนี้ปนอยู่ในหน้า items รวม หาของที่ใส่ได้ยาก

- **List:** ไอคอน + ชื่อ + หมวด + ประเภทอาวุธ + ATK + required level + อาชีพที่ใส่ได้
- **กรองเฉพาะทาง:** ตามหมวด (Armor/Weapon/Costume), ตามอาชีพที่ใส่ได้ (`equippable_classes`), ตามช่วง required level
- ใช้หน้า item detail เดิม

### 3.5 Element damage table (`/tools/elements`)

ตารางตัวคูณดาเมจธาตุโจมตี × ธาตุป้องกัน — เขียนเป็น constant ในโค้ด

- **⚠️ ป้ายเตือนถาวรแบบเดียวกับที่เคยใช้:** ค่านี้อ้างอิงกฎ RO มาตรฐาน **ยังไม่ยืนยันว่าตรงกับ Zero** (บทเรียนจากตาราง level penalty ที่ค่า renewal ขัดกับที่ผู้เล่น Zero รายงาน)
- **การตัดสินใจ:** ทำฟีเจอร์นี้ **พร้อมป้ายเตือนถาวร** (ไม่ตัดออก) เพราะตารางธาตุเป็นกลไกที่นิ่งที่สุดของ RO และผู้เล่นใช้อ้างอิงกันทั่วไป — ป้ายเตือนต้องมองเห็นชัดบนหน้า ห้ามซ่อนหรือทำให้ปิดได้ แบบเดียวกับที่ Stat Calculator เคยใช้
- เชื่อมกับหน้ามอนสเตอร์: หน้า monster detail แสดง "ธาตุนี้อ่อนต่ออะไร" จากตารางเดียวกัน

### 3.6 Farm planner (`/tools/farm-planner`)

บันทึกรายการมอนสเตอร์ที่วางแผนจะตี — ไม่ต้องใช้ข้อมูลใหม่ ไม่ต้อง login

- ปุ่ม "เพิ่มเข้าแผน" บนหน้า monster detail และแถวใน Farming Finder
- หน้า planner แสดงรายการที่บันทึกไว้ พร้อม EXP/HP, Zeny/ตัว, แมพที่เจอ, และผลรวม
- เก็บใน `localStorage` (ต่อเบราว์เซอร์) — ไม่มี backend, ไม่มีบัญชีผู้ใช้
- **ต้อง handle:** localStorage ใช้ไม่ได้ (private mode/ปิด site data) → หน้าต้องยังเปิดได้ แสดงข้อความว่าบันทึกไม่ได้ ไม่ใช่ crash

## 4. สถาปัตยกรรม

ต่อยอดของเดิมทั้งหมด ไม่รื้อโครง:

- **ไม่มีตารางใหม่** — ทุกฟีเจอร์ใช้ตารางเดิม (`items`, `monsters`, `monster_spawns`, `skills`) ยกเว้นเพิ่ม 1 คอลัมน์ตามข้อ 3.0
- **หน้าใหม่ทั้งหมดตามแพทเทิร์นเดิม:** server component query Supabase → filter/pagination ผ่าน GET query params (ทำงานได้โดยไม่ต้องมี JS, bookmark ได้) → `revalidate = 86400` สำหรับหน้า list
- **Reuse ของเดิม:** `components/Pagination.tsx`, CSS classes ใน `globals.css`, แพทเทิร์น error handling (`console.error` + empty state ไม่ crash)
- **แยก pure function ออกมาเทสต์ได้** เหมือน `lib/search.ts`: parse ช่องใส่การ์ดจาก description, ตารางธาตุ, สรุปผลรวม farm planner

## 5. Testing

ตาม spec เดิม (§6 ของ v1) — unit test เฉพาะ pure function, UI ตรวจด้วยมือผ่าน dev server + browser จริง

- Test: parse `Equipped on :` จาก description, ตารางธาตุ (ค่าที่รู้คำตอบล่วงหน้า), สรุปผลรวม farm planner, และการ handle localStorage ที่ใช้ไม่ได้
- ไม่ทำ E2E อัตโนมัติ

## 6. Design

คงระบบเดิม (Neon Arcade dark-only) ไม่เพิ่ม accent สีใหม่ — หน้าใหม่ทั้ง 6 ใช้ token ที่มีอยู่แล้ว:
- หน้า database ใหม่ (skills/maps/cards/equipment) ใช้ `.card` ธรรมดาเหมือนหน้า database เดิม
- `/tools/*` (element table, farm planner) ใช้ `.card--cyan` (สีที่ว่างหลัง Stat Calculator ถูกลบ)
### 6.1 เมนู — เลือกแบบสองชั้น (ตัดสินใจแล้ว 26 ส.ค.)

เมนูจะโตจาก 4 เป็น 10 รายการ เทียบ 4 แบบเป็นภาพจริงแล้ว ([artifact](https://claude.ai/code/artifact/789fb9a7-de0c-4ab7-9ad6-5429935243cf)) — **เลือกแบบ C สองชั้น**

- **แถวบน (คงที่):** `หาจุดตี` · `ค้นของดรอป` · `ฐานข้อมูล` · `เครื่องมือ` + ช่องค้นหา
  - ของที่คนใช้บ่อยสุด (หาจุดตี, ค้นของดรอป) กดครั้งเดียวถึง ไม่ต้องกดซ้อน
- **แถวล่าง (เปลี่ยนตามหมวดที่อยู่):**
  - หมวดฐานข้อมูล → มอนสเตอร์ · ไอเทม · การ์ด · อุปกรณ์ · สกิล · แมพ (แสดงจำนวนต่อท้ายบนจอคอม)
  - หมวดเครื่องมือ → ตารางธาตุ · แผนฟาร์ม
  - หน้าที่ไม่อยู่ในหมวดไหน (หาจุดตี, ค้นของดรอป) → ไม่มีแถวล่าง
- **มือถือ:** แถวบนยุบเป็นปุ่ม ☰ + ช่องค้นหาคาไว้เสมอ, แถวล่างเลื่อนข้างได้ (มีแค่หมวดเดียวจึงไม่เกะกะ)
- **ต้องผูก route → หมวด ในโค้ด** (เช่น `/database/*` = หมวดฐานข้อมูล, `/tools/*` = หมวดเครื่องมือ)

**ทำไมไม่เลือกแบบอื่น:** A (เรียงยาว) มือถือใช้ไม่ได้จริง · B (dropdown แบบ midgardhub) บังคับกด 2 ครั้งกับหน้าที่ใช้บ่อยสุด · D (ค้นหานำ) เก็บไว้ทีหลัง — **ยังทำไม่ได้ตอนนี้เพราะ Global Search ค้นได้แค่มอนสเตอร์กับไอเทม** ถ้าดันค้นหาเป็นพระเอกทั้งที่ค้นการ์ด/สกิล/แมพไม่ได้ คนพิมพ์แล้วไม่เจอจะเลิกเชื่อ → **ต้องขยาย Global Search ให้ครบ 6 อย่างก่อน ถึงจะย้ายไป D ได้**

### 6.2 ไฮไลต์เมนูหน้าปัจจุบัน (หนี้ค้างจาก v1)

CSS `.topnav a.on` มีอยู่ใน `globals.css` ตั้งแต่ v1 แต่**ไม่เคยถูกใช้เลย** — ทุกหน้าเมนูหน้าตาเหมือนกันหมด ผู้ใช้ไม่รู้ว่าตัวเองอยู่หน้าไหน ต้องทำในรอบนี้ (ใช้ `usePathname()` เทียบกับ href)

## 7. งานที่ยังไม่เสร็จหลัง v2

- Quests + NPCs (ต้องดึงเควสใหม่จาก rozerodb 767 หน้า)
- กลุ่มของเล่น/ชุมชน (MVP timer, job quiz, geoguesser, emblem maker, homunculus AI, market, guides)
- ตั้งชื่อโดเมนจริง + ผูก custom domain (ค้างจาก v1 — `roz-th.com` เช็คแล้วว่าง)
- โปรโมตในกลุ่มเกม (เป้าหมายหลักที่ตกลงไว้ตอน grill — งานเว็บไม่ควรถ่วงข้อนี้ต่อไปเรื่อยๆ)
