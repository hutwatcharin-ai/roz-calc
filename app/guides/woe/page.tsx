// สงครามกิลด์ (WoE) — what the game itself says, and what it does not say.
//
// Written 23 Sep 2026. WoE is in the live server: our own patch summary for
// 17 Sep lists "WoE (War of Emperium) ปรับระบบสงครามกิลด์", and the 3 Sep one
// opened the pre-season of the guild ranking event. The site had no page for
// it -- /guides/guild covers the event items only.
//
// Every claim below is the client's own Thai item text, collected into
// data/woe-items.json by scripts/build-woe-items.py, and every count on the
// page is that file's length rather than a number somebody typed. The two
// questions players ask most -- what time does WoE run, and which castles are
// open -- are NOT in any data we hold, so the page says so in a box near the
// top instead of guessing. The official portal is a domain we may not fetch,
// so there is no second-hand answer to copy either.

import type { Metadata } from 'next';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import AdSlot from '@/components/AdSlot';
import woe from '@/data/woe-items.json';
import castleFile from '@/data/woe-castles.json';
import { itemHref } from '@/lib/item-href';
import { supabaseBrowser } from '@/lib/supabase';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'สงครามกิลด์ WoE Ragnarok Zero — ของที่ใช้ได้ ใช้ไม่ได้ และชุดกิลด์',
  description:
    'War of Emperium ใน Ragnarok Zero Global — ยาที่ใช้ไม่ได้ในเขตสงครามกิลด์, ยาเฉพาะ WoE, สกรอล Force/Resist, ชุดสมาชิกกิลด์ 2 ระดับที่ค่าทำงานเฉพาะในเขต WoE และ Emperium ทุกบรรทัดยกมาจากคำอธิบายไอเทมในเกม',
};

type Row = { id: number; name: string; note: string; full: string };
type Gear = { id: number; name: string; tier: string; slots: number; headline: string };
type Scroll = { id: number; name: string; kind: string; effect: string };

const BLOCKED = woe.consumableBlocked as Row[];
const ONLY = woe.consumableOnly as Row[];
const GEAR = woe.gear as Gear[];
const SCROLLS = woe.force as Scroll[];
const CARDS = woe.cards as Row[];
const OTHER = woe.other as Row[];

type Castle = { code: string; number: number; name: string; region: string; warpZeny: number; warpZenySiege: number };
const CASTLES = castleFile.castles as Castle[];
const REGIONS = [...new Set(CASTLES.map((c) => c.region))];
// One pair of numbers for all thirty, so the sentence can quote it as a rule.
const WARP = { normal: CASTLES[0].warpZeny, siege: CASTLES[0].warpZenySiege };

const LESSER = GEAR.filter((g) => g.tier === 'lesser');
const ADVANCED = GEAR.filter((g) => g.tier === 'advanced');
const FORCE = SCROLLS.filter((s) => s.kind === 'force');
const RESIST = SCROLLS.filter((s) => s.kind === 'resist');

// Emperium is not in the list above: its own description is flavour text and
// never says the word WoE. It is here because it is the thing being broken.
const EMPERIUM = 714;

const ALL_IDS = [
  EMPERIUM,
  ...BLOCKED.map((r) => r.id),
  ...ONLY.map((r) => r.id),
  ...GEAR.map((r) => r.id),
  ...CARDS.map((r) => r.id),
  ...OTHER.map((r) => r.id),
];

// Category decides which of the four detail routes a row belongs to, and the
// icon path is read, never guessed -- half of them are .png (23 Sep 2026).
async function rowsById(ids: number[]) {
  const { data, error } = await supabaseBrowser().from('items').select('id, icon_url, category').in('id', ids);
  if (error) console.error('woe guide lookup failed', error);
  return new Map(
    (data ?? []).map((row) => [row.id as number, { icon: (row.icon_url as string) ?? null, category: row.category as string | null }]),
  );
}

// The client's description, cut where it stops being about WoE. The item's own
// page carries the whole thing, and this list is a pointer to it.
function shorten(text: string, max = 170): string {
  return text.length <= max ? text : `${text.slice(0, max).trimEnd()}…`;
}

function Src({ children }: { children: React.ReactNode }) {
  return <p className="guildp__src">ที่มา: {children}</p>;
}

export default async function WoeGuidePage() {
  const meta = await rowsById(ALL_IDS);
  const href = (id: number) => itemHref(id, meta.get(id)?.category);
  const icon = (id: number) => meta.get(id)?.icon ?? null;

  const ItemLink = ({ id, name }: { id: number; name: string }) => (
    <Link href={href(id)} className="woe__item">
      {icon(id) && <img src={icon(id)!} alt="" width={24} height={24} className="woe__icon" loading="lazy" />}
      <span>{name}</span>
    </Link>
  );

  return (
    <main className="shell guildp woe">
      <nav className="crumbs" aria-label="ตำแหน่งหน้า">
        <Link href="/">หน้าแรก</Link><span className="crumbs__sep" aria-hidden="true">›</span>
        <Link href="/guides">ไกด์</Link><span className="crumbs__sep" aria-hidden="true">›</span>
        <span className="crumbs__here">สงครามกิลด์ (WoE)</span>
      </nav>

      <PageHeader
        title="สงครามกิลด์ (WoE) — ของที่ใช้ได้ ใช้ไม่ได้ และชุดกิลด์"
        lead="War of Emperium อยู่ในเซิร์ฟแล้ว หน้านี้รวมเฉพาะสิ่งที่เกมเขียนไว้เอง: ยาที่ถูกปิดในเขตสงคราม ยาที่ใช้ได้เฉพาะที่นั่น สกรอลเฉพาะสงคราม และชุดกิลด์ที่ค่าโผล่เฉพาะในเขต WoE"
      />

      <section className="card card--yellow" style={{ marginTop: 14 }}>
        <h2 className="section-title" style={{ marginTop: 0 }}>สองข้อที่หน้านี้ยังตอบไม่ได้</h2>
        <ul style={{ margin: '8px 0 0', paddingInlineStart: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <li><strong>เวลาเปิดสงครามกิลด์</strong> วันไหน กี่โมง ยาวกี่ชั่วโมง ยังไม่มีในข้อมูลที่เว็บนี้มี</li>
          <li><strong>ปราสาทที่เปิดจริงในเซิร์ฟนี้</strong> <a href="#castles">รายชื่อปราสาทในไคลเอนต์อยู่ด้านล่าง</a> แต่ไฟล์ที่มีอยู่ไม่ได้แปลว่าเซิร์ฟเปิดสงครามที่นั่นครบทุกหลัง</li>
        </ul>
        <p className="muted" style={{ marginTop: 10 }}>
          สองข้อนี้ต้องดูจากประกาศในเกมหรือหน้าประกาศทางการ ถ้าใครมีภาพหน้าประกาศเวลา WoE ส่งมาได้ จะใส่ให้พร้อมบอกที่มา
        </p>
      </section>

      <nav className="guildp__toc" aria-label="สารบัญ">
        <a href="#blocked">ของที่ใช้ไม่ได้</a>
        <a href="#only">ยาเฉพาะ WoE</a>
        <a href="#scrolls">สกรอล Force / Resist</a>
        <a href="#gear">ชุดกิลด์</a>
        <a href="#castles">ปราสาท</a>
        <a href="#misc">Emperium และของอื่น</a>
      </nav>

      <section className="card" id="blocked" style={{ marginTop: 14 }}>
        <h2 className="section-title">ของที่ใช้ไม่ได้ในเขตสงครามกิลด์ ({BLOCKED.length} รายการ)</h2>
        <p style={{ marginTop: 8 }}>
          ยาฟื้นฟูต่อเนื่องที่หลายคนติดใช้ตอนฟาร์ม <strong>ถูกปิดในเขตสงครามกิลด์</strong> คำอธิบายในเกมเขียนไว้ตรง ๆ ว่าใช้ไม่ได้
          และเอฟเฟกต์ไม่ทำงาน แปลว่ากดไปก็เสียของ ต้องเปลี่ยนไปใช้ยาแบบกดทีละขวดหรือยาเฉพาะ WoE ด้านล่างแทน
          ในลิสต์นี้มีของที่ไม่ใช่ยาอยู่ชิ้นเดียวคือเอนชานต์เงาช่อง Middle ซึ่งเขียนว่าไม่มีผลทั้งในเขต WoE และ PvP
        </p>
        <ul className="woe__list woe__list--tight">
          {BLOCKED.map((r) => (
            <li key={r.id}>
              <ItemLink id={r.id} name={r.name} />
            </li>
          ))}
        </ul>
        <Src>คำอธิบายไอเทมในไคลเอนต์ภาษาไทย (System/iteminfo_thTH.lub)</Src>
      </section>

      <AdSlot slot="inline" />

      <section className="card" id="only" style={{ marginTop: 14 }}>
        <h2 className="section-title">ยาที่ใช้ได้เฉพาะ WoE / PVP / ในเมือง ({ONLY.length} รายการ)</h2>
        <p style={{ marginTop: 8 }}>
          อีกฝั่งหนึ่งคือของที่มีไว้สำหรับสงครามโดยเฉพาะ ออกนอกเขตแล้วกดไม่ได้ ถือติดตัวไว้ก่อนเข้าสงครามได้เลย
        </p>
        <ul className="woe__list woe__list--tight">
          {ONLY.map((r) => (
            <li key={r.id}>
              <ItemLink id={r.id} name={r.name} />
            </li>
          ))}
        </ul>
        <Src>คำอธิบายไอเทมในไคลเอนต์ภาษาไทย</Src>
      </section>

      <section className="card" id="scrolls" style={{ marginTop: 14 }}>
        <h2 className="section-title">สกรอล Force และ Resist ({SCROLLS.length} ใบ)</h2>
        <p style={{ marginTop: 8 }}>
          ทุกใบขึ้นบรรทัดเดียวกันว่า <strong>ใช้ได้เฉพาะในสงครามกิลด์เท่านั้น</strong> แบ่งเป็นสองฝั่ง:
          <strong> Force {FORCE.length} ใบ</strong> เพิ่มดาเมจของสกิลที่ระบุ และ <strong>Resist {RESIST.length} ใบ</strong> ลดดาเมจที่โดนจากสกิลนั้น
          ทั้งคู่เจาะจงเป็นรายสกิล ไม่ใช่บัฟรวม
        </p>
        <div className="woe__cols">
          <div>
            <h3 className="woe__sub">Force เพิ่มดาเมจสกิลตัวเอง</h3>
            <ul className="woe__list woe__list--tight">
              {FORCE.map((s) => (
                <li key={s.id}>
                  <strong>{s.name.replace('Force: ', '').replace(' Lv.1', '')}</strong>
                  <span className="muted">{s.effect}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="woe__sub">Resist ลดดาเมจที่โดนจากสกิลนั้น</h3>
            <ul className="woe__list woe__list--tight">
              {RESIST.map((s) => (
                <li key={s.id}>
                  <strong>{s.name.replace('Resist: ', '').replace(' Lv.1', '')}</strong>
                  <span className="muted">{s.effect}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <Src>คำอธิบายไอเทมในไคลเอนต์ภาษาไทย ส่วนที่ยังไม่ทราบคือสกรอลเหล่านี้ได้มาจากไหนในเซิร์ฟนี้</Src>
      </section>

      <AdSlot slot="inline" />

      <section className="card" id="gear" style={{ marginTop: 14 }}>
        <h2 className="section-title">ชุดสมาชิกกิลด์ {GEAR.length} ชิ้น ค่าโผล่เฉพาะในเขตสงคราม</h2>
        <p style={{ marginTop: 8 }}>
          ของชุดนี้เขียนไว้เองว่า <strong>ออปชันเพิ่มเติมในพื้นที่สงครามกิลด์</strong> และบางชิ้นเติมอีกบรรทัดว่า
          จะไม่แสดงผลออปชันในพื้นที่ที่ไม่ใช่สงครามกิลด์ เอาไปฟาร์มมอนจึงไม่ได้ผล ทุกชิ้นใช้ที่เลเวล 70
          และตัวเลขทั้งหมดเป็นค่าที่ทำกับ <strong>ผู้เล่น</strong> ไม่ใช่มอนสเตอร์
        </p>
        <div className="woe__cols">
          <div>
            <h3 className="woe__sub">Lesser Guild Member ({LESSER.length} ชิ้น)</h3>
            <ul className="woe__list woe__list--tight">
              {LESSER.map((g) => (
                <li key={g.id}>
                  <ItemLink id={g.id} name={g.name.replace("Lesser Guild Member's ", '')} />
                  <span className="muted">{g.headline}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="woe__sub">Advanced Guild Member ({ADVANCED.length} ชิ้น)</h3>
            <ul className="woe__list woe__list--tight">
              {ADVANCED.map((g) => (
                <li key={g.id}>
                  <ItemLink id={g.id} name={g.name.replace("Advanced Guild Member's ", '')} />
                  <span className="muted">{g.headline}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="muted" style={{ marginTop: 10 }}>
          กดชื่อชิ้นไหนก็ได้เพื่อดูคำอธิบายเต็ม รวมถึงโบนัสตอนตีบวกถึงขั้น 7 / 9 / 10 และเงื่อนไขใส่ครบเซ็ต
        </p>
        <Src>คำอธิบายไอเทมในไคลเอนต์ภาษาไทย · <Link href="/guides/guild">ไอเทมกิลด์อีกชุด (โล่อีเวนต์ แต้มกิลด์ เหรียญดันเจี้ยน) อยู่หน้านี้</Link></Src>
      </section>


      <section className="card" id="castles" style={{ marginTop: 14 }}>
        <h2 className="section-title">ปราสาทในไฟล์ไคลเอนต์ ({CASTLES.length} หลัง)</h2>
        <p style={{ marginTop: 8 }}>
          ไคลเอนต์มีตารางปราสาทของตัวเอง แบ่งเป็น {REGIONS.length} โซน โซนละ {CASTLES.length / REGIONS.length} หลัง
          พร้อมชื่อปราสาทและค่าวาร์ปของคาฟรา: ปกติ <strong>{WARP.normal}z</strong> แต่ช่วงเวลาสงคราม
          <strong> {WARP.siege.toLocaleString('en-US')}z</strong> แพงขึ้น {WARP.siege / WARP.normal} เท่า
        </p>
        <p className="guildp__warn">
          <strong>ไฟล์มี ไม่ได้แปลว่าเปิด</strong> ตารางนี้คือสิ่งที่ไคลเอนต์ติดตั้งมา ไม่ใช่ประกาศว่าเซิร์ฟเปิดสงครามครบทุกหลัง
          ยึดประกาศในเกมเป็นหลัก
        </p>
        <div className="woe__castles">
          {REGIONS.map((region) => (
            <div key={region} className="woe__castleblock">
              <h3 className="woe__sub">{region}</h3>
              <ul className="woe__list woe__list--tight">
                {CASTLES.filter((c) => c.region === region).map((c) => (
                  <li key={c.code}>
                    <strong>{c.name}</strong>
                    <span className="muted mono">{c.code}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <Src>ตารางปราสาทในไคลเอนต์ (data/luafiles514/lua files/agit/agitconfig*.lub) ชื่อตามที่ไคลเอนต์ไทยใช้</Src>
      </section>

      <section className="card" id="misc" style={{ marginTop: 14 }}>
        <h2 className="section-title">Emperium และของอื่นที่พูดถึงสงครามกิลด์</h2>
        <div className="guildp__hero">
          {icon(EMPERIUM) && <img src={icon(EMPERIUM)!} alt="" width={40} height={40} className="guildp__icon" />}
          <div>
            <strong><Link href={href(EMPERIUM)}>Emperium</Link></strong>
            <p className="muted">
              คำอธิบายในเกมเป็นข้อความบรรยายล้วน ไม่ได้บอกกติกาสงคราม เขียนไว้แค่ว่าเป็นโลหะที่จะปรากฏต่อผู้ที่เปลี่ยนชะตากรรมของโลกได้
              เว็บนี้จึงไม่เขียนกติกาการทุบแทนเกม
            </p>
          </div>
        </div>
        <ul className="woe__list" style={{ marginTop: 10 }}>
          {[...CARDS, ...OTHER].map((r) => (
            <li key={r.id}>
              <ItemLink id={r.id} name={r.name} />
              <span className="muted">{shorten(r.full)}</span>
            </li>
          ))}
        </ul>
        <Src>คำอธิบายไอเทมในไคลเอนต์ภาษาไทย</Src>
      </section>

      <p className="muted" style={{ marginTop: 16 }}>
        รวมทั้งหมด {woe._meta.total} ไอเทมในไคลเอนต์ที่เอ่ยถึงสงครามกิลด์ สร้างจากไฟล์เกมวันที่ {woe._meta.source.built}
        และจะอัปเดตเมื่อไคลเอนต์เปลี่ยน
      </p>
    </main>
  );
}
