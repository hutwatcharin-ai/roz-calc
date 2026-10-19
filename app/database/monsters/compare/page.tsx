// /database/monsters/compare -- เปรียบเทียบมอน (19 Oct 2026). The list lives in
// the browser (components/FarmPlanProvider), so the server sends the frame.
import PageHeader from '@/components/PageHeader';
import MonsterCompare from '@/components/farm/MonsterCompare';
import JsonLd from '@/components/JsonLd';
import { breadcrumbJsonLd } from '@/lib/jsonld';
import { FARM_DATA_URL } from '@/lib/farm-data-url';

export const metadata = {
  title: 'เปรียบเทียบมอน RO Zero — EXP เงิน และความเจ็บ ทีละตัว',
  description:
    'เทียบมอนสเตอร์ Ragnarok Zero Global ที่เลือกไว้ทีละตัว: EXP และเงินต่อชั่วโมงตามค่าตัวละครของคุณ ตีโดนกี่ % มันตีเราทีละเท่าไร และอยู่แมพไหน',
};

export default function MonsterComparePage() {
  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'หน้าแรก', path: '/' },
          { name: 'มอนสเตอร์', path: '/database/monsters' },
          { name: 'เปรียบเทียบมอน', path: '/database/monsters/compare' },
        ])}
      />
      <script
        dangerouslySetInnerHTML={{
          __html: `window.__farmData=fetch(${JSON.stringify(FARM_DATA_URL)}).then(function(r){return r.ok?r.json():Promise.reject(new Error('HTTP '+r.status))});`,
        }}
      />
      <PageHeader title="เปรียบเทียบมอน" lead="กด “+ เปรียบเทียบ” ที่หน้ามอนตัวไหนก็ได้ แล้วมาเทียบกันที่นี่ทีละตัว" />
      <MonsterCompare />
    </main>
  );
}
