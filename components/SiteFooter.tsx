// components/SiteFooter.tsx
//
// The site had no footer at all: nothing saying who made it, nothing saying
// where the numbers come from, and no way to tell a fan site from an official
// one. Individual pages carry a source line for their own tables, but the
// catalogue itself -- monsters, items, drops, spawns -- had no credit anywhere.
//
// This is also where the item catalogue's second source is acknowledged. Around
// 1,200 items came from rozerodb because our own dump never had them, including
// Red Potion.

import Link from 'next/link';

export default function SiteFooter() {
  return (
    <footer className="sitefooter">
      <div className="shell sitefooter__in">
        <p className="sitefooter__lead">
          เว็บฐานข้อมูลและเครื่องมือ <strong>Ragnarok Zero Global</strong> ภาษาไทย ทำโดยผู้เล่น
          ไม่ใช่เว็บทางการ และไม่ได้เกี่ยวข้องกับ Gravity หรือผู้ให้บริการเกม
        </p>

        <div className="sitefooter__cols">
          <div>
            <h2 className="sitefooter__h">ตัวเลขมาจากไหน</h2>
            <ul>
              <li>
                <strong>คู่มือเกมทางการ</strong> — ตารางธาตุ ตารางขนาด อัตราตีบวก EXP ต่อเลเวล
              </li>
              <li>
                <strong>ข้อมูลมอนสเตอร์และไอเทม</strong> — ชุดข้อมูลสาธารณะจากไคลเอนต์เกม
              </li>
              <li>
                <strong>rozerodb.com</strong> — ไอเทมประมาณ 1,200 ชิ้นที่ชุดข้อมูลของเราไม่มี
                และใช้ตรวจทานตารางตีบวกกับตารางขนาด
              </li>
              <li>
                <strong>ragnarokzero.net</strong> — ใช้ตรวจทานค่าสถานะมอนสเตอร์ครบทั้ง 524 ตัว
              </li>
              <li>
                <strong>midgardhub.com</strong> — รายการดรอปชนิดไม่ทราบอัตรา 410 แถวที่ต้นทางอื่นไม่มี
              </li>
              <li>
                <strong>rAthena</strong> — ใช้ตรวจทานตารางธาตุทั้ง 4 ระดับ
              </li>
            </ul>
          </div>

          <div>
            <h2 className="sitefooter__h">ที่ควรรู้ก่อนเชื่อ</h2>
            <ul>
              <li>ตัวเลขที่ยังไม่ยืนยันจะเขียนบอกไว้ตรงนั้น เว็บนี้ไม่เดาแล้วพิมพ์เป็นคำตอบ</li>
              <li>ค่าที่คิดจากตัวละครของคุณเป็นเพดาน ไม่ใช่ค่าที่จะได้จริง เพราะไม่ได้นับเวลาเดินและเวลารอเกิด</li>
              <li>เจอตัวเลขที่ไม่ตรงกับในเกม บอกได้ จะไปตรวจให้</li>
            </ul>
          </div>

          <div>
            <h2 className="sitefooter__h">ทางลัด</h2>
            <ul>
              <li>
                <Link href="/">หาจุดฟาร์ม</Link>
              </li>
              <li>
                <Link href="/tools/afk-finder">หาจุด AFK</Link>
              </li>
              <li>
                <Link href="/tools/damage">ตีตัวนี้ด้วยอะไรดี</Link>
              </li>
              <li>
                <Link href="/tools/refine">ตีบวกต้องเตรียมเท่าไร</Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
