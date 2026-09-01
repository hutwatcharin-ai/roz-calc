# SEO Audit — rozerothai.com (2026-09-01, full 8-agent pass)

แทนที่ audit 2026-08-31 · คะแนนรวมถ่วงน้ำหนัก **~56/100**
(Technical 58 · Content 62 · On-Page ~65 · Schema ~5 · Performance ~60 · AI/GEO 56 · SXO home 28 / entity 45)

**ความจริงข้อแรก:** `site:rozerothai.com` = 0 ผล ยังไม่ index เลย — ทุกข้อข้างล่างไร้ผลจนกว่า user ตั้ง GSC + submit sitemap

## Critical (โค้ด)

1. **canonical ไม่มีทั้งเว็บ + www เสิร์ฟซ้ำ 200** — `www.rozerothai.com` กับ apex ให้เนื้อหา byte-identical ไม่ redirect หากัน + query variants (`?level=`, `?q=`, `?page=`, `?c=1`) เป็น 200 title ซ้ำ canonical ไม่มี
   แก้: Cloudflare Redirect Rule 301 www→apex · `alternates.canonical` ใน generateMetadata ทุก route (strip query)
2. **Security headers = ศูนย์** — ไม่มี HSTS/nosniff/frame-ancestors/Referrer-Policy เลย
   แก้: `headers()` ใน next.config.js (HSTS 31536000, nosniff, Referrer-Policy strict-origin-when-cross-origin, CSP frame-ancestors 'self', Permissions-Policy)
3. **Structured data = ศูนย์ทุกหน้า** (JSON-LD/microdata/RDFa) — schema agent ให้ JSON-LD พร้อมใช้ 3 ชุดในรายงานเต็ม: WebSite+SearchAction (`/drop-finder?q=` — ยืนยัน param แล้วว่า `q` จริง), BreadcrumbList, WebPage+Thing+PropertyValue สำหรับ entity
   ⚠️ ห้ามใช้ Product/Offer กับ item ในเกม (เสี่ยง manual action) — ใช้ Thing · ห้าม HowTo/FAQPage ใหม่

## High

4. **HTML ไม่ cache ที่ edge เลย** — ทุกหน้า `no-store` + `cf-cache-status: DYNAMIC` ทั้งที่เป็นข้อมูลเกมแทบนิ่ง → ISR (`export const revalidate = 3600`) หน้า database ทั้งหมด (TTFB วัดได้ 200–350ms origin-bound; edge hit จะเหลือ <50ms)
5. **Google Fonts บล็อกเรนเดอร์** — 3 ตระกูล 10 น้ำหนัก 44 @font-face จาก googleapis ใน head → ย้ายเป็น `next/font/google` (self-host + adjustFontFallback ลด CLS)
6. **ไม่มีหน้า About/ติดต่อ + แหล่งอ้างอิงไม่มีลิงก์** — ลิงก์ออกนอกเว็บ = 0 ทั้งเว็บ ชื่อ source ใน footer เป็น text เปล่า → ทำหน้า "เกี่ยวกับ" สั้นๆ + ช่องทางติดต่อ + ใส่ `<a>` ให้ทุก source (จำเป็นก่อนคิดเรื่อง AdSense ด้วย)
7. **หน้าแรกขายผิดจุด (SXO)** — คีย์เวิร์ด "ro zero ฐานข้อมูลภาษาไทย" ว่างจริงใน SERP (มีแต่ข่าวเปิดเกม) แต่หน้าแรกขาย farm finder อย่างเดียว · `/tools/elements` เป็นหน้า orphan ทั้งที่ "ragnarok zero ตารางธาตุ" ไม่มีคู่แข่ง Zero-specific ภาษาไทยเลย → เพิ่มเข้า explore row หน้าแรก
8. **topnav สูง ~30px** ต่ำกว่า 44px ทุกหน้า (subnav มือถือ 40px) → `min-height:44px` แบบเดียวกับปุ่มอื่นที่ทำแล้ว
9. **item pages 3,833 หน้าโปรไฟล์บาง/ซ้ำ template** (Jellopy-tier: ต่างกัน ~62 บรรทัด/2,000) — เสริม fact ที่คำนวณได้จากข้อมูลเดิม ("ตัวถูกสุดที่ดรอป", "ใช้ในเควสไหน") หรือ noindex ตัวว่างจนกว่าจะมีเนื้อ

## Medium

- sitemap: ไม่มี lastmod (อย่าใส่วันปลอม — ต้องมี updated_at จริงก่อน) · ตัด priority/changefreq (Google ไม่อ่าน)
- http→https เป็น 302 ควรเป็น 301 (เช็ค Cloudflare Always Use HTTPS)
- sprite `/images/**` cache แค่ 4 ชม. เจอ EXPIRED → `max-age=31536000, immutable`
- input font 15px → 16px (กัน iOS auto-zoom ตอน focus)
- หน้าเควสรายเมือง: `<title>` เป็น slug ดิบ "เควส prontera-region" + H2 เป็นประโยคเควสเต็มสองภาษา 32 อัน → H2 ใช้ชื่อเควสสั้น เนื้อความลงไปเป็น body
- entity pages ไม่มี "ตรวจข้อมูลล่าสุดเมื่อ" — pattern มีแล้วที่ cash-shop เอามาใช้ต่อ
- og:image ใช้ default รูปเดียวทั้งเว็บ
- เพิ่มย่อหน้าสรุป ~120 คำภาษาคนต่อ entity ("Poring ธาตุ Water เผ่า Plant ดรอป Jellopy 70%...") — GEO citability
- alt="": visual agent ยืนยันถูกแล้ว (decorative ข้างชื่อ text) — GEO agent เห็นต่าง · คงไว้แบบเดิม ยกเว้นรูปที่ไม่มี text ข้างๆ

## Low

- `X-Powered-By: Next.js` → poweredByHeader:false · `//double-slash` เสิร์ฟซ้ำ (canonical แก้ให้เอง) · IndexNow ยังไม่มี key file · llms.txt ไม่มี (optional, Google ไม่อ่าน)

## ฝั่ง user (บล็อกทุกอย่าง)

1. ตั้ง Google Search Console + submit sitemap.xml — **สำคัญสุดในลิสต์นี้ทั้งหมด**
2. เช็ค Cloudflare Bot Fight Mode ว่าไม่ได้ 403 UA ของ Googlebot/AI crawlers ที่ edge

## จุดแข็งที่ยืนยันแล้ว (อย่าไปพัง)

SSR เต็ม (ข้อมูลอยู่ใน HTML ไม่ต้องรัน JS) · sitemap 4,907 URL สะอาดไม่มี query รั่ว · robots.txt เปิดหมด · 404 จริงไม่ใช่ soft-404 · brotli + `_next/static` immutable ถูกแล้ว · รูปมี width/height ครบ + lazy · charbar จอง 45px กัน CLS · methodology footer ("ตัวเลขมาจากไหน") = สัญญาณ E-E-A-T ของจริง · หน้า monster (588 คำ 11 heading) คือหน้าที่แข็งสุดของเว็บ

## ลำดับลงมือ

1. (user) GSC + submit sitemap
2. canonical + 301 www + security headers + strip priority/changefreq — ครึ่งวัน
3. JSON-LD 3 ชุด template-level — ครึ่งวัน
4. ISR หน้า database + sprite cache immutable + next/font — 1 วัน
5. About/ติดต่อ + ลิงก์ source + หน้าแรก reposition + elements เข้า explore row — 1 วัน
6. touch targets + input 16px + quest H2/title — ครึ่งวัน
7. ค่อยว่ากัน: enrich item pages, สรุปภาษาคนต่อ entity, guide layer ("จุดฟาร์มแนะนำตามเลเวล")
