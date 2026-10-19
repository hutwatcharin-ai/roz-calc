// /tools/bot-setup -- จัดเซ็ตบอท (19 Oct 2026). One map, the built-in bot's
// settings tab by tab, and what the run comes to; the ranking that sends
// players here is /tools/leveling-spots (AFK and zeny modes).
import PageHeader from '@/components/PageHeader';
import AdSlot from '@/components/AdSlot';
import BotSetup from '@/components/farm/BotSetup';
import JsonLd from '@/components/JsonLd';
import { breadcrumbJsonLd } from '@/lib/jsonld';
import { FARM_DATA_URL } from '@/lib/farm-data-url';
import Link from 'next/link';

export const metadata = {
  title: 'จัดเซ็ตบอท RO Zero — ติ๊กมอนตัวไหน ตั้งวาร์ป ยา น้ำหนัก อยู่ได้กี่ชั่วโมง',
  description:
    'เลือกแมพแล้วดูว่าบอทในเกม Ragnarok Zero Global ควรติ๊กมอนตัวไหน ตั้ง Teleport เมื่อโดนดาเมจเท่าไร ถือยากี่ขวด บอทอยู่ได้กี่ชั่วโมงก่อนกลับเมือง และได้ EXP กับเงินเท่าไร คิดจากค่าตัวละครของคุณ',
};

function first(raw: string | string[] | undefined): string | undefined {
  return Array.isArray(raw) ? raw[0] : raw;
}

export default function BotSetupPage({ searchParams }: { searchParams: { map?: string | string[]; tick?: string | string[] } }) {
  const map = first(searchParams.map) ?? null;
  const tickRaw = first(searchParams.tick);
  const tick = tickRaw
    ? tickRaw
        .split(',')
        .map(Number)
        .filter((n) => Number.isInteger(n) && n > 0)
    : null;
  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'หน้าแรก', path: '/' },
          { name: 'จัดเซ็ตบอท', path: '/tools/bot-setup' },
        ])}
      />
      <script
        dangerouslySetInnerHTML={{
          __html: `window.__farmData=fetch(${JSON.stringify(FARM_DATA_URL)}).then(function(r){return r.ok?r.json():Promise.reject(new Error('HTTP '+r.status))});`,
        }}
      />
      <PageHeader
        title="จัดเซ็ตบอท"
        lead="เลือกแมพ ดูว่าควรติ๊กมอนตัวไหน ตั้งวาร์ปกับยายังไง และบอทจะอยู่ได้กี่ชั่วโมงก่อนกลับเมือง"
      />
      <BotSetup initialMap={map} initialTick={tick && tick.length ? tick : null} />
      <AdSlot slot="inline" />
      <section className="farm-section">
        <h2 className="section-title">บอทในเกมทำงานยังไง</h2>
        <ul className="muted" style={{ margin: 0, paddingInlineStart: 18, lineHeight: 1.7, maxWidth: '75ch' }}>
          <li>ล่าเฉพาะมอนที่ติ๊กในแท็บมอนสเตอร์ ตัวที่ไม่ได้ติ๊กบอทจะไม่ตี ถ้าเป็นมอนโจมตีก่อน มันจะเข้ามาตีบอทจนกว่าบอทจะวาร์ปหนี</li>
          <li>วาร์ปได้ 3 แบบในแท็บพื้นฐาน: ไม่ได้สู้ตามเวลาที่ตั้ง, โดนดาเมจเกินค่าที่ตั้ง, โดนมอนรุมตามจำนวนที่ตั้ง · คนบอททั้งวันใส่การ์ด Creamy วาร์ปด้วย SP</li>
          <li>กลับเมืองแล้วยืนอยู่ในเมือง ไม่กลับมาล่าต่อ: เมื่อยาหมด ไอเทมบัฟหมด หรือน้ำหนักถึงค่าที่ตั้ง (ถ้าไม่ได้ติ๊กล่าต่อ)</li>
          <li>
            ดูคำถามที่เจอบ่อยเรื่องบอทได้ที่ <Link href="/guides/faq#bot">FAQ หมวดบอทในเกม</Link> · หาแมพที่ดีที่สุดก่อนได้ที่{' '}
            <Link href="/tools/leveling-spots?mode=afk">ฟาร์มที่ไหนดี โหมดทิ้งบอท</Link>
          </li>
        </ul>
      </section>
    </main>
  );
}
