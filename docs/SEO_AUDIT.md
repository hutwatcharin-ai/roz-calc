# SEO Audit — rozerothai.com · 31 สิงหาคม 2569

คะแนนรวม ~55/100 · ตรวจด้วย 8 subagent (technical / content / schema / sitemap / performance / visual / GEO / SXO)
บน production จริงวันแรกที่ผูกโดเมน · **สถานะ: user ให้พักไว้ รออัปเดตเว็บรอบใหม่ แล้วค่อยแก้+ตรวจซ้ำ**

ข้อที่ agent สรุปผิดและถูกตัดออกแล้ว: "ไม่มีหน้าตารางธาตุ" (มี — /tools/elements แต่ agent หาไม่เจอ),
"ไม่อ้างที่มาเลย" (หน้า tools อ้าง แต่ trafilatura ตัดบรรทัด .source-note ทิ้ง — เป็น finding กลายๆ ว่า
extractor มองไม่เห็นบรรทัดที่มาของเรา), ชื่อเว็บ "RozerothAI" (จริงคือ RO Zero Thai)

## Critical
- **C1 เว็บเปิดได้ 3 ทางโดยไม่มี canonical** — apex / www / sslip ตอบ 200 เนื้อหา byte เดียวกัน
  และไม่มี `rel=canonical` สักหน้าใน 3,558 หน้า → canonical ทุกหน้า + 301 www→apex + sslip→apex
  · พิสูจน์: curl เห็น canonical, www ตอบ 301
- **C2 หน้าไอเทม 2,522 หน้า เนื้อหาซ้ำ 93%** (วัดจริง: item 501 vs 502 ต่างกัน 1 คำ) บนโดเมนอายุ 1 วัน
  = โปรไฟล์ doorway → หน้าที่มีของจริง (คำอธิบาย/ตารางดรอป) อยู่ใน sitemap ต่อ, หน้าเปล่า noindex จนกว่าจะเติม

## High
- **H1 schema = 0 ทั้งเว็บ** → BreadcrumbList (มี UI แล้ว) + WebSite + ItemList
  ⚠️ ห้ามใส่ SearchAction (ไม่มี /search route) · ห้ามชี้ /tools (ไม่มี index page) · ห้าม HowTo/FAQPage
- **H2 Cloudflare ไม่ cache เลย** — ทุกหน้า `no-store` + cf DYNAMIC (หน้า database เป็น ƒ dynamic เพราะ searchParams)
  · ทางแก้: CF Cache Rule (ดูบทเรียน RSC ใน project_pcxhub_product_images) หรือทำหน้า detail เป็น ISR จริง
- **H3 LCP แย่: /tools/refine 4.58s, /database/monsters 4.50s** — TTFB ดี (73-270ms) แต่ตัวหนังสือรอ hydration
  (pagehead__lead หน่วง 2.1s) → ลด JS ก่อน paint / ตรวจ font
- **H4 tap target ที่ผมวัดตกรอบก่อน**: เมนูหลัก 30px, แท็บหมวด 31-33px, **ลิงก์ชื่อมอนในตาราง 24px**
  (รอบก่อนวัดแค่ input/select/button ใน main — ไม่ได้วัด nav กับ a ในตาราง)
- **H5 ไม่มีหน้า "เกี่ยวกับเว็บนี้"** — /about /contact = 404 · จุดขายเรื่องตรวจทานอยู่แค่ใน footer
- **H6 security headers = 0** (HSTS, X-Content-Type-Options, X-Frame-Options)

## Medium
- M1 `/drop-finder` HTML มีแต่เมนู เนื้อหาขึ้นหลัง JS (บั๊กแบบเดียวกับหน้า AFK ที่เคยแก้)
- M2 หน้ามอน/ไอเทมไม่มีบรรทัดที่มา (มีแต่หน้า tools)
- M3 ไม่มีวันที่ทั้งเว็บ — sitemap ไม่มี lastmod, หน้าไม่มี "อัปเดตเมื่อ" (อย่าใส่วันปลอม — ใส่เมื่อมีวันจริงจาก import)
- M4 title หน้าแรกหน้าเดียวที่ไม่มี "| RO Zero Thai"
- M5 H2 หน้า tools เป็นป้าย ไม่ใช่รูปคำถามที่คนค้น + ควรมีย่อหน้าตอบก่อนตาราง (GEO)

## Low
- llms.txt · IndexNow · ตัด changefreq/priority ออกจาก sitemap (Google ไม่อ่าน)

## ผ่านแล้ว (อย่าไปแตะให้พัง)
SSR จริงทุกหน้าหลัก · title/description ไม่ซ้ำ 3,558 หน้า · CLS ดีหมด · robots+sitemap ถูก ·
ไม่บล็อกบอท AI ตัวไหน (ตั้งใจ — เว็บอยากถูกอ้าง) · เนื้อหา tools "genuine expertise, not AI filler"

## ช่องว่าง SERP ที่เจอ (SXO)
- **"ragnarok zero ตารางธาตุ" ไม่มีเว็บ Zero จริงแข่งเลย** — มีแต่ไกด์ RO ภาคอื่น · /tools/elements มีอยู่แล้ว รอถูก index
- คู่แข่งที่ชนะโชว์ "sourced from official server data" เป็นจุดขายแบบเดียวกับเรา แต่เขียนเด่นกว่า
- คำค้นดรอปมี YouTube แทรกครึ่ง SERP — format ที่เราไม่มีเลย

## ตัวคูณของทั้งลิสต์
**GSC ยังไม่ได้ตั้ง + ยังไม่ submit sitemap** — ทุกข้อข้างบนไร้ผลจนกว่า Google จะรู้จักเว็บ
