# เควส (ก้อน B ของ rozerodb-export) — design

**สถานะ:** อนุมัติในแชท 31 ส.ค. 69 (แบบ ค: hub ตามเมือง + อังกฤษก่อนแปลทีหลัง)

## ข้อมูลจริงที่วัดแล้ว
766 หน้าเควสใน `docs/rozerodb-export/data/quests.jsonl` · 590 มี Map+Zone (Zone = ชื่อเมืองสำเร็จรูป เช่น "Alberta")
· 176 ไม่มีแมพ · ชนิด: story 510 / fetch 128 / kill 78 / talk 50 · description 642 · objective 260
· บางเควสมี "Quest chain <ชื่อ> # <id ถัดไป>" — เก็บสายได้
· ข้อความเป็นภาษาอังกฤษจากไฟล์เกม (ไม่ใช่บทความของ rozerodb)

**NPC ตัดออกจากก้อนนี้** — export มีแค่หน้า index รวม 84 sprite code ไม่มีข้อมูลเชื่อม NPC↔เควสให้ดึง
หน้า NPC ที่ทำได้จะเป็นหน้าเปล่าโชว์รหัส sprite = ไม่ทำ บันทึกเป็นช่องว่างข้อมูล

## ตาราง
`quests`: id (PK, จากเกม), name, map_code, coord_x, coord_y, zone, type, objective, description,
chain_name, chain_next_id, town_key, name_th (null รอแปล)
· RLS อ่านอย่างเดียวตั้งแต่ migration แรก · insert-only import

## การจัดกลุ่ม (town_key)
- มี Zone → slug ของ Zone ("Alberta" → `alberta`)
- ไม่มี Zone → กลุ่มตามชนิด: `type-story` / `type-kill` / `type-fetch` / `type-talk`
- **hub ที่ได้ต่ำกว่า 5 เควสถูกยุบเข้า `other`** ("เมืองอื่นๆ") — กันหน้าบางตั้งแต่ออกแบบ
- ตรรกะทั้งหมดเป็นฟังก์ชัน pure ใน `lib/quest-towns.ts` มีเทสต์ขอบ (4 เควสพอดี, zone ซ้ำต่างตัวพิมพ์)

## หน้า
- `/database/quests` — ดัชนี: การ์ด hub รายเมือง (ชื่อ+จำนวน) + ช่องค้นชื่อเควสทั้งหมด (server-rendered, filterbar เดิม)
- `/database/quests/[town]` — รายเควสเป็นบล็อก แต่ละบล็อกมี `id="q<questId>"` แชร์ลิงก์เจาะได้
  แสดง: ชื่อ, ชนิด (badge), แมพ+พิกัด (ลิงก์ไปหน้าแมพถ้ามีในตารางเรา), objective, description, สายเควส (ลิงก์ anchor ถัดไป)
  breadcrumb + บรรทัดที่มา ตามมาตรฐานที่วางแล้ว
- เมนูหมวดฐานข้อมูล + sitemap เพิ่มเฉพาะหน้า hub (~20-40) **ไม่ใช่ 766**

## Import
- `parseQuest()` ใน `scripts/rozerodb-export-parse.ts` + เทสต์ fixture ข้อความจริง (มีแมพ/ไม่มี/มี chain/มี objective)
- `scripts/import-quests.ts`: dry-run ก่อน · insert-only · map_code ที่ไม่อยู่ในตารางแมพเรา = นับรายงาน ไม่เดา

## การทดสอบ
parser ทุก shape · quest-towns (ยุบ <5, กลุ่ม type, slug ชนกัน) · nav/sitemap readiness ใช้เทสต์ระบบไฟล์เดิม
