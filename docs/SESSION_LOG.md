# Session Log — RO Zero Thai

บันทึกงานรอบใหญ่ (ล่าสุดอยู่บนสุด) — กติกาการทำงานอยู่ที่ `/CLAUDE.md`

## 1–2 ก.ย. 2026 — รอบใหญ่: โครงหน้า, hit/flee, แปลไทย, NPC

**SEO hardening (1 ก.ย. ค่ำ — จาก audit 8-agent ใน docs/SEO_AUDIT.md)**
- canonical ทุกหน้า (layout `alternates.canonical './'` — ตัด query เอง) · middleware 301 www/sslip→apex · security headers 5 ตัว + ปิด X-Powered-By · sitemap ตัด priority/changefreq
- JSON-LD: WebSite+SearchAction (หน้าแรก), BreadcrumbList (มอน/ไอเทม/เควส/แมพ), Thing+PropertyValue (มอน/ไอเทม — ห้าม Product/Offer กับของในเกม)
- ฟอนต์ self-host next/font แทนลิงก์ googleapis (CSS ผ่านตัวแปร --font-*)
- **บั๊กลึก: supabase ส่ง Authorization ทุก fetch → Next 14 บังคับ no-store เงียบๆ ทำ revalidate ไร้ผล** — override global fetch ใส่ `next.revalidate` ใน supabaseBrowser
- entity pages (มอน/ไอเทม/แมพ) = on-demand ISR: revalidate 86400 + generateStaticParams ว่าง (MISS→HIT, s-maxage=86400) · sprite /images/** immutable
- touch target topnav/subnav 44px, input 16px กัน iOS zoom, title เควสเลิกโชว์ slug ดิบ, ตารางธาตุเข้า explore row หน้าแรก
- ⚠️ ค้างฝั่ง user: **Cloudflare ยัง DYNAMIC กับ HTML** — s-maxage ถูกส่งแล้วแต่ CF ไม่ cache HTML จนกว่าจะตั้ง Cache Rule ในแดชบอร์ด (ระวัง rule ล่างทับบน + ต้องยกเว้น RSC — ดูบทเรียน PCX) · GSC + submit sitemap ยังไม่ทำ

**โครงหน้า/เมนู**
- แยก database เป็น 3 หน้าแบบ rozerodb: `/database/equipment` (1,815 — cascade หมวด→ชนิด 18 อาวุธ/6 ตำแหน่ง, filter อาชีพ+Slot+"ใส่ได้ที่ Lv", sort ATK/Lv), `/database/items` (ของใช้ 1,705, ลิงก์เก่า redirect), `/database/cards` (313)
- Cash Shop ใหม่: 77 รายการ ราคา KP+€ ณ 31 ส.ค. 2026, ตาราง `cash_shop_items`, รูปจาก Divine-Pride, อยู่ในเมนูถัดจากไอเทม
- เมนู: ตัดปุ่มค้นหา Ctrl+K ออก · subnav เป็นปุ่มการ์ดทุกความกว้าง (มือถือกริด 3×3 ไม่มีสครอล) · ไอคอน sprite จากเกมทุกเมนู · แผนที่โลกเป็นเมนูแยก (เคยยุบใต้แมพแล้ว revert ตาม user)
- หน้าแรก "แบบ 3+1": การ์ดเจตนา 4 ใบ ใบแรกฝังฟอร์มหาจุดตี ตารางผลโชว์เมื่อค้นเท่านั้น (ลิงก์ `/?level=` เดิมใช้ได้) · ตารางคุ้มสุดกรองมอน C default
- โลโก้ใหม่: favicon (app/icon.png) + apple-icon + og-default.jpg

**hit/flee**
- `lib/hit-flee.ts`: สูตรฝั่งผู้เล่น (HIT=175+Lv+DEX+LUK/3, FLEE=100+Lv+AGI+LUK/5, โอกาส=80+HIT−FLEE clamp 5–100, โดนชัวร์ FLEE+20, หลบตัน HIT+75 — ยืนยันกับซอร์ส rAthena)
- **ฝั่งมอนใช้ค่าจริงจากคอลัมน์ monsters.hit/flee เท่านั้น** (บั๊กที่เคยคำนวณทับถูกแก้ — Mummy ไฟล์ 293 vs สูตร 159)
- ใช้ใน: หน้ามอน (บล็อกแม่นยำ/หลบ + เป้า HIT/FLEE), หน้าแรก (คอลัมน์ตีโดน% + EXP/ชม.คูณ hit), AFK (คอลัมน์มันตีเราโดน + มอน aggro ที่หลบตันเข้าลิสต์พร้อมป้าย "โจมตีก่อน·หลบได้"), tool ใหม่ `/tools/hit-flee` (แชร์ลิงก์ได้)
- character context v2: กรอก Max HP/HIT/FLEE ตรงจากจอเกม แทน VIT/อาชีพ/DEX/AGI/LUK — ตัดสูตร HP เดาเอง + ข้อจำกัด 4 อาชีพทิ้ง, เซฟเก่า migrate อัตโนมัติ, มีปุ่มล้างค่า

**ข้อมูล**
- ลบ costume `(Bound)`/`[Bound]` 682 แถวถาวร (backup `Downloads/roz-bound-costumes-backup-2026-08-31.json`)
- กวาดไอคอน "No Image" ปลอม 1,986 ไฟล์ (md5 เดียวกัน) — mirror script reject hash นั้นแล้ว · สรุป item: sprite จริง 2,500 / ตัวย่อ 1,333
- Slot การ์ด: parse จาก rozerodb export 2,661 คู่ → matched 1,781 (`data/equipment-slots.json`)
- ดรอปไม่ทราบอัตรา 410 แถวจาก midgardhub CSV (rate NULL) — ดรอปที่มีอัตราตรงกับเขาอยู่แล้วทุกช่อง · เครดิตใน footer
- ราคาซื้อ/ขาย equipment sync จาก rozerodb รายหน้า 1,815 ตัว (user report ราคาขายไม่ตรงเกม, user เลือกเชื่อ rozerodb) — อัปเดต 303 แถว หลายตัวขายจริงได้ 0 (Trident 25,500→0) · ของ ETC ตรงอยู่แล้ว (client dataset มี sell จริงเช่น Star Crumb 10z)
- weapon_type ล้างแล้ว: case dupes รวม, Sword/Spear เปล่า→One-handed, Helmet→Headgear
- AFK: ความปลอดภัยระดับแมพ (census มอน aggro ต่อแมพจาก spawns ทุกแถว เลือกแมพเสี่ยงต่ำสุด + ป้ายแมพสะอาด/โจมตีก่อน N ชนิด) + ปลด cap แสดงครบ + toggle แมพสะอาด/ไม่มีสกิลเสี่ยง

**แปลไทย** (ไฟล์ต้นทางใน `data/` ทั้งหมด)
- เควส 766 (name/objective/description) — จากรอบก่อน
- การ์ด 312/313 effect (`data/card-effects-th.json` — rule-based + dict มือ 282 ประโยค)
- สกิล 339/339 ตัวที่มีข้อความ (`data/skill-descriptions-th.json` แปลมือ 5 batch)
- Cash Shop 77 (`data/cash-shop-th.json`)

**NPC ในเควส**
- ทำได้แล้ว (เคยสรุปว่าไม่ได้): crawl หน้า NPC รายตัวของ rozerodb 84 หน้า → join NPC→quest 81 คู่ (`data/npc-quests.json`, ตาราง `quest_npcs`), sprite 84 ไฟล์ `public/images/npcs/` — การ์ดเควสโชว์รูป+รหัส (มี session ขนานทำ feature เดียวกัน commit b105a3d — ไฟล์ตรงกัน ไม่ชน) · hover ที่รูป NPC ขยาย 2.4 เท่า (`.npcsprite`, scale จากเท้า, ปิด transition ตาม prefers-reduced-motion)

**อื่นๆ**
- ลิงก์ entity เชื่อมครบ: ดรอปในหน้ามอน→item, dropped-by ในหน้า item→มอน, drop-finder→item, อ้างอิง `[ชื่อ]id` ในเควส (133 จุด) → item (lib/quest-item-refs + เทสต์)
- sort กดหัวตาราง (`lib/use-table-sort.ts`): หน้าแรก/AFK/หน้าแมพ
- filter ครบ: มอน Lv ช่วง, เควส chip ประเภทต่อเมือง, equipment Slot+ใส่ได้ที่ Lv
- copy pass ทั้งเว็บ: ตัด "แก", ยุบโน้ตยาว ~20 ก้อน (สแกน regex ไทย ≥70 ตัวอักษร เจอ 71 จุด)
- ป้าย aggro เปลี่ยนคำ "เข้าตีเอง"→"โจมตีก่อน"

**ค้าง/ไอเดียต่อ**
- SEO audit: ก้อนหลักทำแล้ว 1 ก.ย. (ดูหัวข้อ SEO hardening) — ที่ยังค้าง: หน้า About/ติดต่อ + ลิงก์ source ใน footer, item pages บาง 3,833 หน้า (enrich หรือ noindex), reposition หน้าแรกตาม SXO, lastmod (ต้องมี updated_at จริงก่อน)
- midgardhub equip_jobs (~1,000 items) ยังไม่ import (มี canJobEquip ใช้ equippable_classes จาก rozerodb แล้วบางส่วน)
- ตัววางแผนบิลด์สกิล — ต้องการข้อมูลเงื่อนไขสกิล (ยังไม่มี)
- ฝั่ง user: ตั้ง GSC + submit sitemap · ปิด auto-renew โดเมนจดผิด rezerothai.com

## 31 ส.ค. 2026 และก่อนหน้า

- rebrand rozerothai.com + Cloudflare orange cloud · เควสระบบ 34 town hubs · import rozerodb export (equipment/card/skill/quest parsers + เทสต์) · การ์ดกริด item/monster · statgrid หน้า item · mirror ไอคอน ratemyserver 3,202 · แปลเควสไทยครบ — รายละเอียดใน git log และ `docs/superpowers/specs/`
