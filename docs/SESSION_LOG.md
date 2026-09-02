# Session Log — RO Zero Thai

บันทึกงานรอบใหญ่ (ล่าสุดอยู่บนสุด) — กติกาการทำงานอยู่ที่ `/CLAUDE.md`

## 1–2 ก.ย. 2026 — รอบใหญ่: โครงหน้า, hit/flee, แปลไทย, NPC

**2 ก.ย. (บ่าย) — เตรียมแพทช์ 3 ก.ย. + ปิดงาน SEO ฝั่ง user**
- หน้า `/news/patch-2026-09-03` สรุปประกาศปิดปรับปรุงเป็นไทย (เวลาไทย 07:00–11:15, cap 60/60, 2nd Job, Episode 1-2, Orc Underground/Comodo Luanda/Memorial ×2, Raid equipment) + Article JSON-LD + ชิปเหลืองบน explore row หน้าแรก (เอาออกหลัง ~1 สัปดาห์) · sitemap มี `EXTRA_STATIC_PATHS` (/about + news) และเทสต์ล็อกไว้
- **runbook พรุ่งนี้: `docs/PATCH-2026-09-03.md`** (re-crawl rozerodb → import --dry → import → เควสใหม่+แปล → equipment pipeline → cash shop → IndexNow → อัปเดตหน้าแพทช์) · 2nd Job รองรับอยู่แล้วใน `lib/zero-jobs.ts`
- ฝั่ง user เสร็จครบ 6 ข้อ: GSC verify+sitemap ✓ · CF Cache Rule `cache-html` (ยกเว้น `_rsc`) ✓ · Always Use HTTPS 301 ✓ · Bot Fight ปิดอยู่แล้ว + AI bot policy Allow ✓ · Supabase PAT ใหม่ (scope roz-calc DB rw, 7 วัน) → rename `hit_100/flee_95` จริง + `updated_at` 3 ตาราง + lastmod ใน sitemap ✓ · โดเมนผิดปิด auto-renew ✓
- Footer redesign รอบ 2: ย้าย "ตัวเลขมาจากไหน/ที่ควรรู้ก่อนเชื่อ" ไป `/about#sources` (dl `.sourcelist`) · footer ใหม่ = แบรนด์+tagline+badge อัปเดตล่าสุด (ทุกหน้า, `lib/last-updated.ts` กัน error เป็น null) · คอลัมน์ฐานข้อมูล/เครื่องมือดึงจาก `SECTION_LINKS` (ไม่ต้องดูแลมือ) · คอลัมน์เกี่ยวกับ+ปุ่มโฆษณา · แถบล่าง © + เครดิตแหล่งตรวจทาน · mobile 2 คอลัมน์
- ตารางฟาร์มหน้าแรก: คอลัมน์ EXP (base_exp ต่อตัว) ก่อน EXP/HP เรียงได้ · หน้าแมพทุกหน้า: คอลัมน์ HIT 100% / FLEE 95% (threshold ผู้เล่นจาก midgardhub, เรียงน้อย→มาก, "—" ถ้าไม่มี)
- SEO ก้อนโค้ด: IndexNow key + `npm run indexnow` (ยิงแล้ว 4,908 URL) · ItemList JSON-LD 3 หน้า list · Organization บน /about · footer แยกคอลัมน์ติดต่อ (บั๊ก→GitHub / โฆษณา→`kidkrob@gmail.com`) + copyright · หน้าแรก: badge "ข้อมูลอัปเดตล่าสุด X ที่แล้ว" จาก updated_at แทนประโยค trust · charbar กรอก ASPD แทนครั้ง/วิ (50/(200−ASPD)) · เมนู tools เรียงตามงาน + "ตีมอนโดนไหม/ตีมอนด้วยอะไรดี" · positioning หน้าแรกเป็น "ฐานข้อมูล…ภาษาไทย" (H1/title/og)

**2 ก.ย. (ดึก) — feature รัว**
- Cash Shop: ราคาบาทจากอัตราเติมจริง gnjoy TH (1,000 KP = 32฿ เส้นตรง, `THB_PER_KP` ใน lib/cash-shop-analysis) · ฿/วัน + ป้าย "คุ้มกว่าแบบสั้น X%/วัน" คู่ 7/30 วัน 6 คู่ · ชิปหมวด 6 หมวด (rule-based) + sort คุ้มสุดต่อวัน · ตะกร้าเติมเงิน (components/CashPlan, localStorage `roz-calc:cash-plan`, topUpPlan บอกแพ็คที่ต้องกด)
- เควส UX (จาก flow review ใน artifact): หน้ารวมเรียงตามเส้นทางผู้เล่น (`hubOrder`) + เปลี่ยนชื่อกลุ่ม "(ไม่ระบุเมือง)" + ตัวอย่างชื่อเควสบนการ์ด · หน้าเมืองจัดกลุ่มสายเควสเป็นขั้น 1→2→3 ป้าย "เริ่มสายที่นี่" (`lib/quest-chains`)
- `/tools/farm-guide` จุดฟาร์มแนะนำ 7 ช่วงเลเวล (SERP ไทยว่าง) · hit-flee tool กรอก HIT/FLEE ตรง + ปุ่มดึงจาก charbar (ลิงก์ dex/agi/luk เก่า migrate) · equipment cascade ชนิดโผล่ทันที 3 หมวด + ตำแหน่งคอสตูม crawl จาก rozerodb 894 ตัว (Upper/Mid/Lower Head/Garment...) · equip_jobs เติม 546 แถวจาก midgardhub CSV
- ราคาขาย equipment sync rozerodb 303 แถว · OG รายมอนพยายามแล้ว 502 บน prod (@vercel/og module crash) — revert, ฟอนต์ Sarabun ค้างไว้ใน assets/fonts
- รางวัลเควส: สรุปว่าไม่มีแหล่งไหนมี (อยู่ฝั่ง server script) — divine-pride มีหน้าเควสแต่ Rewards ว่าง, irowiki ห้าม fetch — ถ้าจะมีต้อง crowdsource เอง (user ปล่อยไปก่อน)

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
- 🔴 **แก้การตีความผิดครั้งใหญ่ (1 ก.ย. ดึก, user ชี้):** คอลัมน์ hit/flee ที่ import จาก midgardhub ไม่ใช่สเตตัสมอน — CSV ต้นทางชื่อ `hit_100`/`flee_95` = ค่าฝั่งผู้เล่น (HIT ตีโดน 100% / FLEE หลบ 95%) โค้ดเดิมบวก +20/+75 ทับอีกชั้น → เป้า FLEE เพี้ยน ~100 แต้ม (Poring โชว์ 278 ที่ถูกคือ 178) แก้ครบ 5 จุด (หน้ามอน/หน้าแรก/AFK/hit-flee tool/สูตรใน lib) + เทสต์ pin ค่าจริง Poring 203/178, Mummy 259/293 — **DB ยัง rename ไม่ได้ (PAT ตาย) โค้ดใช้ alias `hit_100:hit` ใน select + helper รับสองชื่อ — rename จริงเมื่อได้ PAT ใหม่**
- `lib/hit-flee.ts`: สูตรฝั่งผู้เล่น HIT=175+Lv+DEX+LUK/3, FLEE=100+Lv+AGI+LUK/5 (ยืนยัน rAthena) · ฝั่งมอนใช้ threshold: ตีโดน=clamp(100−(hit_100−HIT)), โดนตี=clamp(5+(flee_95−FLEE))
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
- SEO audit: ทำแล้วเกือบหมด 1 ก.ย. (hardening + About/ติดต่อ + ลิงก์ source + ประโยคสรุป entity + trust หน้าแรก) — ค้าง: item pages ที่ยังบางจริง (พิจารณา noindex), lastmod (รอ updated_at จริง)
- ⏳ รอ PAT Supabase ใหม่จาก user: rename คอลัมน์ monsters.hit→hit_100, flee→flee_95 แล้วกวาด alias `hit_100:hit`/`flee_95:flee` ใน select 3 จุด (หน้าแรก, afk-finder, hit-flee tool)
- ~~midgardhub equip_jobs~~ ทำแล้ว 2 ก.ย. (546 แถวที่ว่าง)
- ตัววางแผนบิลด์สกิล — ต้องการข้อมูลเงื่อนไขสกิล (ยังไม่มี)
- ฝั่ง user: ตั้ง GSC + submit sitemap · ปิด auto-renew โดเมนจดผิด rezerothai.com

## 31 ส.ค. 2026 และก่อนหน้า

- rebrand rozerothai.com + Cloudflare orange cloud · เควสระบบ 34 town hubs · import rozerodb export (equipment/card/skill/quest parsers + เทสต์) · การ์ดกริด item/monster · statgrid หน้า item · mirror ไอคอน ratemyserver 3,202 · แปลเควสไทยครบ — รายละเอียดใน git log และ `docs/superpowers/specs/`
