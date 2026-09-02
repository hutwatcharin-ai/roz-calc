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
                <strong><a href="https://rozerodb.com" target="_blank" rel="noopener noreferrer">rozerodb.com</a></strong> — ไอเทมประมาณ 1,200 ชิ้นที่ชุดข้อมูลของเราไม่มี
                และใช้ตรวจทานตารางตีบวกกับตารางขนาด
              </li>
              <li>
                <strong><a href="https://ragnarokzero.net" target="_blank" rel="noopener noreferrer">ragnarokzero.net</a></strong> — ใช้ตรวจทานค่าสถานะมอนสเตอร์ครบทั้ง 524 ตัว
              </li>
              <li>
                <strong><a href="https://midgardhub.com" target="_blank" rel="noopener noreferrer">midgardhub.com</a></strong> — รายการดรอปชนิดไม่ทราบอัตรา 410 แถวที่ต้นทางอื่นไม่มี
              </li>
              <li>
                <strong><a href="https://github.com/rathena/rathena" target="_blank" rel="noopener noreferrer">rAthena</a></strong> — ใช้ตรวจทานตารางธาตุทั้ง 4 ระดับ
              </li>
            </ul>
          </div>

          <div>
            <h2 className="sitefooter__h">ที่ควรรู้ก่อนเชื่อ</h2>
            <ul>
              <li>ตัวเลขไหนยังไม่ยืนยัน จะเขียนกำกับไว้ตรงจุดนั้น</li>
              <li>ค่าที่คิดจากตัวละครเป็นเพดานบน — ไม่รวมเวลาเดินและรอมอนเกิด</li>
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
              <li>
                <Link href="/about">เกี่ยวกับเว็บนี้</Link>
              </li>
            </ul>
          </div>

          {/* Split on purpose (user, 2 Sep): a bug report and an ad inquiry
              are different audiences reading the same footer -- a would-be
              advertiser landing on "แจ้งบั๊กที่ GitHub" reads as a hobby
              project with no business contact, and quietly leaves. */}
          <div>
            <h2 className="sitefooter__h">ติดต่อ</h2>
            <ul>
              <li>
                เจอข้อมูลผิด{' '}
                <a href="https://github.com/hutwatcharin-ai/roz-calc/issues" target="_blank" rel="noopener noreferrer">
                  แจ้งที่ GitHub Issues
                </a>
              </li>
              <li>
                <a
                  className="sitefooter__adlink"
                  href="mailto:kidkrob@gmail.com?subject=สอบถามลงโฆษณา%20rozerothai.com"
                >
                  ลงโฆษณา / ติดต่อธุรกิจ →
                </a>
              </li>
            </ul>
          </div>
        </div>

        <p className="sitefooter__bottom">© {new Date().getFullYear()} RO Zero Thai · rozerothai.com</p>
      </div>
    </footer>
  );
}
