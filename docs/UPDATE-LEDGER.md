# บันทึกรับอัปเดต

ใช้คู่กับ `docs/UPDATE-RUNBOOK.md` · เปิดไฟล์นี้เป็นขั้นแรกทุกครั้งที่ owner พิมพ์ "แพทช์ลงแล้ว" · งานที่ทำเสร็จแล้วให้ลบแถวออก (ยกเว้นหมวดประกาศที่ทำแล้ว)

## ประกาศทางการที่ทำแล้ว (roz.mygnjoy.com/th/news/event/<เลข>)

| เลข | เรื่อง | หน้าในเว็บ | วันที่ทำ |
|---|---|---|---|
| 173 | Black Friday | /news/events-2026-11 | 2026-10-29 |
| 174 | Gatchaman: Visitors from Another World | /news/events-2026-11#gatchaman | 2026-10-29 |
| update 189 | Update Notice 12 พ.ย. (8 รูป: เลเวล 80, ดันใหม่, Ant Hell, อุปกรณ์ Lv 70, Hunting Season, Blessing, Reset Cat, EXP) | /news/patch-2026-11-12 | 2026-11-12 |
| event 193, 194 | Blacksmith Blessing Exchange (Yakt, Eden Group) · Hunting Season (Joh the Card Collector, การ์ด/ไอเทม → Token → คอสตูม 8 ชิ้น) | /news/patch-2026-11-12 | 2026-11-12 |
| notice 192 | ปิดปรับปรุงเสร็จ 01:00–04:45 UTC + แก้บั๊ก 8 ข้อ | /news/patch-2026-11-12#maint | 2026-11-12 |
| guide 21 | Character Level ตาราง EXP ใหม่ 1–80 + Job อาชีพ 2 | /guides/exp | 2026-11-12 |

ประกาศ notice 179 (Black Friday บัฟสุดสัปดาห์ต่อเวลาถึง 2 พ.ย. 13:10 น.) ผ่านไปแล้ว ไม่ได้ลงเว็บ · notice 180 (WoE EU) อยู่ในหน้าแพทช์ 29 ต.ค. แล้ว · ประกาศ Discord ปิดปรับปรุง 5 พ.ย. (3 และ 4 พ.ย.) ทำที่ /news/patch-2026-11-05 วันที่ 4 พ.ย. — 5 พ.ย. เติมแล้ว: เปิดเซิร์ฟ 10:00 น. (ประกาศ notice 184) รอบนี้ไม่มี Update Notice — ถ้ามีแพตช์โน้ตตามมาค่อยเติม

แพทช์ 29 ต.ค. (Clock Tower) ทำแล้วที่ /news/patch-2026-10-29

แพทช์ 12 พ.ย. (เลเวล 80) ทำที่ /news/patch-2026-11-12 จากประกาศ Discord 3 อัน (10, 11, 12 พ.ย. — ปิด 08:00–14:00 น.) + ไฟล์เกม · **เว็บทางการ roz.mygnjoy.com robots.txt บล็อก ClaudeBot อีกแล้ว (12 พ.ย.) ไม่ได้อ่าน** · ยังไม่มีแพทช์โน้ตตัวเต็ม — มาเมื่อไรค่อยเติม · ไฟล์เกมชุดล่าสุดที่อ่านแล้ว: `D:\Data grf roz\weekly\2026-11-12`

## วันหมดอายุ (เลยวันแล้วทำก่อนอย่างอื่น)

| วันที่ | งาน |
|---|---|
| 2026-11-16 | Reset Cat (12–15 พ.ย. UTC, /navi payon 165/49) จบ: แก้การ์ด Reset Cat ในหน้า /news/patch-2026-11-12 เป็นจบแล้ว |
| 2026-11-27 | Hunting Season กับแลก Blacksmith Blessing (12–26 พ.ย. UTC) จบ: แก้การ์ดในหน้า /news/patch-2026-11-12 |
| 2026-11-26 | อีเวนต์ Gatchaman / หน้า events-2026-11 จบ: ย้ายไปกลุ่มจบแล้ว, ปุ่ม Mid Missile หาย, เอาแถวอีเวนต์ออกจาก NOW PLAYING |
| 2026-12-01 | โค้ด KUMAMON ใน /guides/codes#kumamon ย้ายไปกลุ่มหมดอายุ |

## รอรูป / รอข้อมูล

- บอสใต้ดิน 20175–20179: จำนวนใส่ DB แล้ว 30 ต.ค. (Sieglouse 1, General Orc 1, Jeniffer 1, Extra Joker 2, Erzsebet 1 — ไฟล์เกม navi_mob ตรงกับที่ prontera เช็กในเกม) · ยังไม่รู้เวลาเกิด · เลเวลใน DB 122–126 แต่ไฟล์เกมบอก 96–105 ยังไม่ได้แก้
- ระบบปลุก ★: `/guides/star-gear` ยังเขียนว่ายังไม่เปิด — รอ owner เช็กในเกม
- ของทำพิธี Molden: ยังไม่รู้ชื่อไอเทมจริง · Clock Tower Gear ดรอปจากมอนหอนาฬิกา (owner 2 พ.ย.) ยังไม่รู้ว่าตัวไหน
- ตาราง Cash Shop ใหม่ยังไม่เทียบกับ `cash_shop_items`
- แพทช์ 12 พ.ย.: เควสรายวัน Lv 80 (ไม่เจอในไฟล์เควสไคลเอนต์ ประกาศไม่บอก NPC) · ราคา/อัตรา Light Gacha · Memorial แรงค์ II (Lv 80) เปิดหรือยัง — `lib/memorial-gear.ts` ล็อกไว้ที่ 70
- Ant Hell: `b_an_d02`, `b_an_d02_z` ยังปิดตามโรดแมป (ไม่อยู่ใน navi) — ถ้าเป็นแมพของ Memorial Ant Hell ให้เปิด

## ข้อมูลจากไฟล์เกมที่ยังไม่ได้เช็กในเกม

- หน้า /news/patch-2026-11-12 ป้าย "จากไฟล์เกม" 4 จุด: มอน+จำนวนใน Karu / Izlude 4F / 5F (navi_mob), Warrior/Insect Token แลกการ์ดเป็นคอสตูม, แลก Blacksmith Blessing Powder ทุก 7 วัน (เควส 1110100), กล่อง Light Costume 2 แบบ · ตาราง EXP 1–80 จาก prontera.info (ลง 11 พ.ย. ก่อนแพทช์) ใส่หน้าแพทช์เท่านั้น ยังไม่แทน lib/exp-table.ts จนกว่าจะเช็กในเกม · Ant Hell กลไก/ของรางวัลจากไกด์ฝรั่งเศสก่อน Global

- สูตร Hat Maker (หมวกกลาง 19333/19334) จากบันทึกเควส · หน้า /guides/clock-tower-hats
- Thor's Flame (หลอม Mithril Ore 10 → Mithril 1) owner เห็นในเกม 2 พ.ย. อยู่ตรงจุดตีบวกทุกเมือง · Februs กับ Thor's Dismantle Flame owner เช็กแล้ว 2 พ.ย. (บ้าน /navi prontera 50/290 ในบ้านคือแมพ paramk)

## ตัดสินแล้ว ไม่ต้องทำ

- จำนวนมอนธรรมดาในหอนาฬิกา: คงเลข rozerodb ไว้ ไม่ใช้เลขจาก navi_mob ของไคลเอนต์ (ไคลเอนต์บอก High Orc ใต้ดิน B2 แค่ 1 ตัว แต่ owner เห็นในเกมว่าเยอะ, 30 ต.ค.) · navi_mob ช่องที่ 4 = จำนวน<<16 | id มอน
- Galaring, Mutant Galaring, Squid Bomb ไม่ต้องใส่ DB (owner 30 ต.ค.)
- อีเวนต์เช็กชื่อ 29 ต.ค.–25 พ.ย. ไม่ต้องทำหน้า (owner 30 ต.ค.)
- เควสหลัก Gatchaman ขั้น 3–8 owner เดินผ่านในเกมแล้ว 30 ต.ค. ไม่ต้องติดป้าย
