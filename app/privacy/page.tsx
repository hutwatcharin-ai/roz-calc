// The privacy policy. Written from what the site actually does -- the
// storage keys are the ones in the code, the third parties are the two that
// are really loaded -- because a policy that describes someone else's site is
// worse than none. AdSense also requires this page and a logo before it will
// show a consent message to European readers (23 Sep 2026).

import type { Metadata } from 'next';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'นโยบายความเป็นส่วนตัว',
  description:
    'เว็บนี้เก็บอะไรบ้าง ใช้คุกกี้อะไร และข้อมูลอะไรอยู่ในเครื่องคุณเอง — นโยบายความเป็นส่วนตัวของ RO Zero Thai',
};

const MAIL = 'kidkrob@gmail.com';

const STORED = [
  ['roz-calc:farm-plan', 'แผนฟาร์มที่คุณกดเก็บไว้'],
  ['roz-calc:recent', 'หน้าที่คุณเพิ่งเปิด เพื่อแสดงรายการดูล่าสุด'],
  ['roz-calc:tool-numbers', 'ตัวเลขตัวละครที่กรอกในเครื่องมือ จะได้ไม่ต้องกรอกซ้ำ'],
  ['roz-calc:weapon', 'อาวุธที่เลือกไว้ล่าสุดในเครื่องมือคำนวณ'],
  ['roz-calc:afk-style', 'รูปแบบบอทที่เลือกไว้ในหน้าหาจุด AFK'],
  ['roz-calc:description-language', 'ภาษาที่เลือกดูคำอธิบายไอเทม'],
  ['roz-calc:internal', 'ตั้งเมื่อเปิดเว็บด้วยลิงก์ ?internal=1 เพื่อไม่ให้การเข้าชมของทีมงานปนกับสถิติจริง'],
];

export default function PrivacyPage() {
  return (
    <main className="shell" style={{ paddingBlock: 28 }}>
      <PageHeader
        title="นโยบายความเป็นส่วนตัว"
        lead="เว็บนี้ไม่มีระบบสมาชิก ไม่ต้องสมัคร และไม่เคยขอชื่อ อีเมล หรือเบอร์โทรของคุณ"
      />

      <section className="card" style={{ marginTop: 14 }}>
        <h2 className="section-title">ข้อมูลที่เราไม่ได้เก็บ</h2>
        <p style={{ marginTop: 8, lineHeight: 1.8 }}>
          ไม่มีการสมัครสมาชิก ไม่มีการล็อกอิน เราจึงไม่มีชื่อ อีเมล เบอร์โทร รหัสผ่าน หรือข้อมูลการชำระเงินของคุณอยู่เลย
          ช่องเดียวที่รับข้อความจากคุณคือปุ่มแจ้งข้อมูลผิด ซึ่งเก็บเฉพาะข้อความที่คุณพิมพ์กับรหัสของหน้าที่แจ้ง
        </p>
      </section>

      <section className="card" style={{ marginTop: 14 }}>
        <h2 className="section-title">ข้อมูลที่อยู่ในเครื่องคุณเอง</h2>
        <p style={{ marginTop: 8, lineHeight: 1.8 }}>
          ของพวกนี้เก็บไว้ในเบราว์เซอร์ของคุณ (localStorage) ไม่ได้ส่งมาที่เซิร์ฟเวอร์ของเรา ล้างได้เองโดยล้างข้อมูลเว็บไซต์ในเบราว์เซอร์
        </p>
        <ul className="adpage__list">
          {STORED.map(([key, what]) => (
            <li key={key}><code className="mono">{key}</code> — {what}</li>
          ))}
        </ul>
      </section>

      <section className="card" style={{ marginTop: 14 }}>
        <h2 className="section-title">สถิติการใช้งาน (Google Analytics)</h2>
        <p style={{ marginTop: 8, lineHeight: 1.8 }}>
          เราใช้ Google Analytics 4 เพื่อดูว่าหน้าไหนมีคนอ่าน เครื่องมือไหนมีคนใช้ และคนค้นหาอะไรในเว็บ
          ข้อมูลที่ส่งเป็นระดับภาพรวม เช่น หน้าที่เปิด ประเทศ และชนิดอุปกรณ์ ไม่มีชื่อหรืออีเมลเพราะเราไม่มีอยู่แล้ว
          Google ตั้งคุกกี้ของตัวเองเพื่อแยกว่าเป็นการเข้าชมครั้งเดิมหรือครั้งใหม่
        </p>
      </section>

      <section className="card" style={{ marginTop: 14 }}>
        <h2 className="section-title">โฆษณา</h2>
        <p style={{ marginTop: 8, lineHeight: 1.8 }}>
          เว็บนี้มีโฆษณา 2 แบบ
        </p>
        <ul className="adpage__list">
          <li>
            <strong>แบนเนอร์ที่ขายตรง</strong> — เป็นภาพนิ่งที่เราวางเอง เมื่อคุณคลิก ลิงก์จะผ่านเว็บเราเพื่อนับจำนวนคลิกก่อนพาไปเว็บปลายทาง
            เรานับแค่จำนวนครั้ง ไม่ได้เก็บว่าใครเป็นคนคลิก
          </li>
          <li>
            <strong>Google AdSense</strong> — Google และพาร์ตเนอร์อาจใช้คุกกี้เพื่อเลือกโฆษณาให้เหมาะกับคุณ
            ปิดโฆษณาที่ปรับตามความสนใจได้ที่{' '}
            <a href="https://myadcenter.google.com/" target="_blank" rel="noopener noreferrer">myadcenter.google.com</a>{' '}
            และดูรายละเอียดการใช้ข้อมูลของ Google ได้ที่{' '}
            <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer">policies.google.com</a>
          </li>
        </ul>
        <p className="muted" style={{ marginTop: 10, lineHeight: 1.8 }}>
          ผู้อ่านจากยุโรปจะเห็นกล่องขอความยินยอมก่อนแสดงโฆษณาที่ใช้คุกกี้ และเลือกปฏิเสธได้
        </p>
      </section>

      <section className="card" style={{ marginTop: 14 }}>
        <h2 className="section-title">ผู้ให้บริการที่เราใช้</h2>
        <ul className="adpage__list">
          <li><strong>Cloudflare</strong> — ตัวกลางส่งหน้าเว็บและกันการโจมตี เห็นข้อมูลการเชื่อมต่อตามปกติของการเปิดเว็บ</li>
          <li><strong>Supabase</strong> — ฐานข้อมูลของเว็บ เก็บข้อมูลเกม ไม่ได้เก็บข้อมูลผู้อ่าน</li>
          <li><strong>Google Analytics และ Google AdSense</strong> — ตามที่อธิบายไว้ด้านบน</li>
        </ul>
      </section>

      <section className="card" style={{ marginTop: 14 }}>
        <h2 className="section-title">สิทธิของคุณ</h2>
        <p style={{ marginTop: 8, lineHeight: 1.8 }}>
          เพราะไม่มีบัญชีผู้ใช้ เราจึงไม่มีข้อมูลรายบุคคลให้ลบหรือส่งคืน สิ่งที่คุณทำเองได้คือ
          ล้างข้อมูลเว็บไซต์ในเบราว์เซอร์เพื่อลบของที่เก็บไว้ในเครื่อง ปิดคุกกี้โฆษณาที่ลิงก์ด้านบน
          และใช้ส่วนขยายบล็อกโฆษณาได้ตามสะดวก เว็บยังใช้งานได้ครบทุกอย่าง
        </p>
        <p style={{ marginTop: 10, lineHeight: 1.8 }}>
          มีคำถามหรืออยากให้เราลบอะไร ติดต่อ <a href={`mailto:${MAIL}?subject=${encodeURIComponent('เรื่องความเป็นส่วนตัว rozerothai.com')}`}>{MAIL}</a>
        </p>
      </section>

      <p className="muted" style={{ marginTop: 16 }}>
        ดูเพิ่มที่ <Link href="/about">เกี่ยวกับเว็บนี้</Link> หรือ <Link href="/advertise">ลงโฆษณา</Link>
      </p>
    </main>
  );
}
