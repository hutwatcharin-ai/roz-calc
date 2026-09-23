// ไกด์กิลด์: อีเวนต์โล่ Guild Parma, แต้มเกียรติยศ, อัปเลเวลกิลด์ และของจากดันเจี้ยนกิลด์
//
// Published without the player screenshots the local draft used (owner,
// 23 Sep 2026): those came from a Facebook group and asking three people for
// permission was the one thing holding the page back. Everything here is
// either the game's own item text, which we already hold, or a video, which is
// named beside the claim it supports.
//
// The event items say in their own description that they are deleted when the
// event ends, so the page says the same rather than reading as permanent gear.

import type { Metadata } from 'next';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import eventPorings from '@/data/raw/event-porings.json';
import { supabaseBrowser } from '@/lib/supabase';
import AdSlot from '@/components/AdSlot';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'ไอเทมกิลด์ Ragnarok Zero — โล่ Guild Parma, แต้มกิลด์, อัปเลเวลกิลด์',
  description:
    'ของที่ต้องมีกิลด์ถึงจะได้ใน Ragnarok Zero Global — โล่ Guild Parma จากอีเวนต์ (ATK/MATK/EXP +5%), ไฟกิลด์ 4 สี, แต้มเกียรติยศกิลด์, รูปปั้นอัปเลเวลกิลด์ และเหรียญจากดันเจี้ยนกิลด์',
};

// Icon paths come from the items table, not from a guessed filename: half of
// these are .png, and guessing .gif drew nine broken images (23 Sep 2026).
async function iconsFor(ids: number[]): Promise<Map<number, string>> {
  const { data, error } = await supabaseBrowser().from('items').select('id, icon_url').in('id', ids);
  if (error) console.error('guild guide icons failed', error);
  return new Map((data ?? []).filter((row) => row.icon_url).map((row) => [row.id as number, row.icon_url as string]));
}

// Counted, not written: the spawn list is the source, so the sentence cannot
// drift from it the way a typed number would.
const PORING_MAPS = new Set(
  (['bunny-poring', 'gold-poring'] as const).flatMap((key) =>
    ((eventPorings as Record<string, { spawns?: { slug: string }[] }>)[key]?.spawns ?? []).map((s) => s.slug),
  ),
).size;

const FLAMES = [
  { id: 1003110, th: 'แดง', color: '#ff5a5a', means: 'ความมุ่งมั่น' },
  { id: 1003111, th: 'ฟ้า', color: '#4aa8ff', means: 'ความสุขุม' },
  { id: 1003112, th: 'เขียว', color: '#46c46a', means: 'ความใจกว้าง' },
  { id: 1003113, th: 'เหลือง', color: '#ffd23f', means: 'ความรอบรู้' },
];

const HONOR = [
  { id: 107810, name: "Guild's Honor (Iron)", points: '1 แต้ม', from: 'ดรอปจากโพริ่งอีเวนต์' },
  { id: 107811, name: "Guild's Honor (Bronze)", points: '30 แต้ม', from: 'รางวัลเควสประจำวันของอีเวนต์' },
  { id: 107812, name: "Guild's Honor (MVP)", points: '500 แต้ม', from: 'ชื่อไอเทมบอกว่าเกี่ยวกับ MVP — ยังไม่ยืนยัน' },
];

const UNITY = [
  { id: 107805, name: 'Iron', exp: '1,000 – 3,000' },
  { id: 107806, name: 'Bronze', exp: '5,000 – 15,000' },
  { id: 107807, name: 'Silver', exp: '30,000 – 100,000' },
  { id: 107808, name: 'Gold', exp: '150,000 – 500,000' },
  { id: 107809, name: 'MVP', exp: '750,000 – 2,500,000' },
];

const COINS = [
  { id: 25630, name: 'Guild Agit Coin', body: 'เหรียญจากดันเจี้ยนกิลด์ เอาไปแลกของกับ NPC ในฐานกิลด์ ไม่มีน้ำหนัก' },
  { id: 100110, name: 'Heavy Guild Coin Pouch', body: 'ถุงเหรียญ กดใช้แล้วได้ Guild Agit Coin จำนวนสุ่ม' },
  { id: 1000030, name: 'Guild Medal', body: 'ของมีค่าจากดันเจี้ยนฐานกิลด์ ใช้แลกของและใส่เอนชานต์' },
  { id: 100115, name: 'Veteran Guild Member Enchant Box', body: 'กล่องเอนชานต์ของอุปกรณ์กิลด์ เปิดแล้วถึงรู้ว่าได้อะไร' },
];

const GEAR = [
  { id: 15218, name: "Lesser Guild Member's Plate", note: 'ใน GvG: MHP +900 · โดนผู้เล่นตีเบาลง 4% · ครบเซ็ตกับ Greaves/Cloak ตีบวกรวม 21 ขึ้นไป ได้เพิ่มอีกชุด' },
  { id: 26147, name: "Lesser Guild Member's Arc Wand", note: 'ใน GvG: ดาเมจเวทใส่ผู้เล่น +15% · เจาะ MDEF ผู้เล่น 10%' },
  { id: 450014, name: "Advanced Guild Member's Plate", note: 'ใน GvG: MHP +1,250 · MSP +50 · โดนผู้เล่นตีเบาลง 5% · ที่ +7 ลดเพิ่มอีก 2%' },
  { id: 550005, name: "Advanced Guild Member's Arc Wand", note: 'ใน GvG: ดาเมจเวทใส่ผู้เล่น +15% · เจาะ MDEF ผู้เล่น 10% · MATK +140' },
];

function Src({ children }: { children: React.ReactNode }) {
  return <p className="guildp__src">ที่มา: {children}</p>;
}

export default async function GuildGuidePage() {
  const icons = await iconsFor([
    1270260,
    ...HONOR.map((h) => h.id),
    ...UNITY.map((u) => u.id),
    ...COINS.map((c) => c.id),
    ...GEAR.map((g) => g.id),
  ]);
  const icon = (id: number) => icons.get(id) ?? null;
  return (
    <main className="shell guildp">
      <nav className="crumbs" aria-label="ตำแหน่งหน้า">
        <Link href="/">หน้าแรก</Link><span className="crumbs__sep" aria-hidden="true">›</span>
        <Link href="/guides">ไกด์</Link><span className="crumbs__sep" aria-hidden="true">›</span>
        <span className="crumbs__here">ไอเทมกิลด์</span>
      </nav>

      <PageHeader
        title="ไอเทมกิลด์ Ragnarok Zero — ได้จากไหน ใช้ทำอะไร"
        lead="ของที่ต้องมีกิลด์ถึงจะได้: โล่จากอีเวนต์, แต้มเกียรติยศกิลด์, รูปปั้นอัปเลเวลกิลด์, เหรียญดันเจี้ยนกิลด์ และอุปกรณ์สาย GvG"
      />

      <nav className="guildp__toc" aria-label="สารบัญ">
        <a href="#parma">โล่ Guild Parma</a>
        <a href="#flames">ไฟกิลด์ 4 สี</a>
        <a href="#honor">แต้มเกียรติยศ</a>
        <a href="#level">อัปเลเวลกิลด์</a>
        <a href="#coins">เหรียญดันเจี้ยนกิลด์</a>
        <a href="#gear">อุปกรณ์ GvG</a>
      </nav>

      <section className="card card--yellow" id="parma" style={{ marginTop: 14 }}>
        <h2 className="section-title">โล่ Guild Parma — ของอีเวนต์ที่คุ้มที่สุดตอนนี้</h2>
        <div className="guildp__hero">
          {icon(1270260) && <img src={icon(1270260)!} alt="" width={40} height={40} className="guildp__icon" />}
          <div>
            <strong>Guild&apos;s Parma</strong>
            <p className="guildp__stats">ATK +5% · MATK +5% · EXP ที่ได้จากมอน +5%</p>
            <p className="muted">โล่ช่อง Shadow ใส่ได้ทุกอาชีพ ป้องกันน้อยมาก ค่าที่ได้คือสามบรรทัดบน</p>
          </div>
        </div>
        <ol className="guildp__steps">
          <li><strong>ต้องอยู่ในกิลด์ก่อน</strong> ไม่มีกิลด์ทำเควสนี้ไม่ได้</li>
          <li><strong>เก็บไฟกิลด์ให้ครบ 4 สี อย่างละ 1 ชิ้น</strong> จากโพริ่งอีเวนต์ที่เกิดทั่วแมพ</li>
          <li><strong>คุย NPC ที่น้ำพุกลางเมือง Prontera</strong> เพื่อรับเควสและส่งไฟ</li>
          <li><strong>ทำเควสประจำวันต่อได้</strong> ใช้ไฟอย่างละ 1 ชิ้นเหมือนกัน และได้แต้มกิลด์เพิ่ม</li>
        </ol>
        <p className="guildp__warn">
          <strong>ของอีเวนต์</strong> — คำอธิบายในเกมเขียนไว้เองว่า ไอเทมนี้จะถูกลบเมื่ออีเวนต์จบ ทั้งโล่และไฟทั้ง 4 สี
        </p>
        <Src>คำอธิบายไอเทมในเกม (ฐานข้อมูลของเว็บนี้) · ขั้นตอนเควสจากคลิป <a href="https://www.youtube.com/watch?v=7M9kzc4PCMs" target="_blank" rel="noopener noreferrer">Big GUILD EVENT in Ragnarok Zero Global</a> (3 ก.ย. 2569)</Src>
        <p className="muted" style={{ marginTop: 6 }}>
          หมายเหตุ: หน้าประกาศทางการเขียนว่าโล่ให้ +1% แต่ไอเทมในเกมเขียน +5% ยึดตามในเกม
        </p>
      </section>

      <section className="card" id="flames" style={{ marginTop: 14 }}>
        <h2 className="section-title">ไฟกิลด์ 4 สี</h2>
        <p style={{ marginTop: 8 }}>
          ดรอปจากโพริ่งอีเวนต์ 2 ตัว คือตัวสีทองกับตัวสีชมพูที่มีของติดหัว เกิดทั่วแมพปกติรวม {PORING_MAPS} แมพ แมพละ 3 ตัว
          และเกิดใหม่ทันทีที่ถูกฆ่า
        </p>
        <div className="guildp__flames">
          {FLAMES.map((f) => (
            <div key={f.id} className="guildp__flame">
              <span className="guildp__flamedot" style={{ background: f.color, color: f.color }} aria-hidden="true" />
              <strong>ไฟสี{f.th}</strong>
              <span className="muted">{f.means}</span>
            </div>
          ))}
        </div>
        <p className="muted" style={{ marginTop: 10 }}>
          คนที่ฟาร์มมา 1 วันบอกว่า <strong>สีเหลืองหายากกว่าสีอื่นชัดเจน</strong> สีอื่นได้อย่างละราว 20 ชิ้น แต่สีเหลืองได้ไม่กี่ชิ้น
          ถ้าจะทำเควสประจำวันยาว ๆ ให้เก็บสีเหลืองเผื่อไว้
        </p>
        <Src>ชื่อและความหมายของไฟจากคำอธิบายในเกม · จำนวนแมพที่เกิดจากข้อมูลจุดเกิดของเว็บนี้ · ความหายากจากคลิปข้างบน (แหล่งเดียว)</Src>
      </section>

      <AdSlot slot="inline" />

      <section className="card" id="honor" style={{ marginTop: 14 }}>
        <h2 className="section-title">แต้มเกียรติยศกิลด์ (Guild&apos;s Honor)</h2>
        <p style={{ marginTop: 8 }}>ของสะสมแต้มให้ทั้งกิลด์ระหว่างอีเวนต์ มี 3 ระดับ</p>
        <table className="stat-table guildp__table">
          <thead><tr><th scope="col">ไอเทม</th><th scope="col">แต้ม</th><th scope="col">ได้จาก</th></tr></thead>
          <tbody>
            {HONOR.map((h) => (
              <tr key={h.id}>
                <th scope="row">{icon(h.id) && <img src={icon(h.id)!} alt="" width={24} height={24} className="guildp__rowicon" />}{h.name}</th>
                <td className="num">{h.points}</td>
                <td>{h.from}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="muted" style={{ marginTop: 10 }}>
          รางวัลคิดจากแต้มรวมของทั้งกิลด์ ไม่ใช่ของรายคน กิลด์ต้องได้ <strong>10,000 แต้ม</strong> ถึงได้รางวัลขั้นต่ำ
          (Authoritative Badge 10 ชิ้น + Yellow Potion 40 ขวด) ส่วนอันดับ 1-3 ได้ Costume Rune Helm
        </p>
        <Src>แต้มของแต่ละระดับจากคำอธิบายในเกม · เกณฑ์รางวัลจากคลิปข้างบน (แหล่งเดียว ยังไม่ได้ตรวจกับหน้าประกาศ)</Src>
      </section>

      <section className="card" id="level" style={{ marginTop: 14 }}>
        <h2 className="section-title">อัปเลเวลกิลด์ (Guild&apos;s Unity)</h2>
        <p style={{ marginTop: 8 }}>
          คนละระบบกับแต้มอีเวนต์ ตัวนี้คือรูปปั้นที่ใช้เพิ่ม EXP ของกิลด์ มี 5 ระดับ
        </p>
        <table className="stat-table guildp__table">
          <thead><tr><th scope="col">ระดับ</th><th scope="col">EXP กิลด์ที่ได้</th></tr></thead>
          <tbody>
            {UNITY.map((u) => (
              <tr key={u.id}>
                <th scope="row">{icon(u.id) && <img src={icon(u.id)!} alt="" width={24} height={24} className="guildp__rowicon" />}Guild&apos;s Unity ({u.name})</th>
                <td className="num">{u.exp}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="muted" style={{ marginTop: 10 }}>
          ระดับ MVP คำอธิบายในเกมบอกตรง ๆ ว่าได้จากการล้ม MVP ส่วนระดับอื่นมาจากเควสกิลด์ประจำวัน
        </p>
        <Src>คำอธิบายไอเทมในเกมทั้งหมด</Src>
      </section>

      <section className="card" id="coins" style={{ marginTop: 14 }}>
        <h2 className="section-title">เหรียญและของจากดันเจี้ยนกิลด์</h2>
        <div className="guildp__rows">
          {COINS.map((c) => (
            <div key={c.id} className="guildp__row">
              {icon(c.id) && <img src={icon(c.id)!} alt="" width={36} height={36} />}
              <div>
                <strong>{c.name}</strong>
                <p className="muted">{c.body}</p>
              </div>
            </div>
          ))}
        </div>
        <Src>คำอธิบายไอเทมในเกม</Src>
      </section>

      <section className="card" id="gear" style={{ marginTop: 14 }}>
        <h2 className="section-title">อุปกรณ์กิลด์สาย GvG</h2>
        <p style={{ marginTop: 8 }}>
          ของกลุ่มนี้มีเงื่อนไขเดียวกันหมด คือ <strong>ค่าที่เขียนไว้ทำงานเฉพาะในเขต GvG</strong> ออกนอกเขตแล้วไม่ทำงาน
          จึงไม่คุ้มถ้าเอามาใส่ล่ามอนธรรมดา
        </p>
        <div className="guildp__rows">
          {GEAR.map((g) => (
            <div key={g.id} className="guildp__row">
              {icon(g.id) && <img src={icon(g.id)!} alt="" width={36} height={36} />}
              <div>
                <strong>{g.name}</strong>
                <p className="muted">{g.note}</p>
              </div>
            </div>
          ))}
        </div>
        <Src>คำอธิบายไอเทมในเกม · ดูค่าทั้งหมดได้ที่ <Link href="/database/equipment?q=guild">ฐานข้อมูลอุปกรณ์</Link></Src>
      </section>

      <p className="muted" style={{ marginTop: 16 }}>
        ยังไม่รู้: วิธีได้ Guild&apos;s Honor (MVP) แน่ชัด และราคาแลกของกับ NPC ในฐานกิลด์ ถ้าใครเห็นในเกมแล้ว
        แจ้งได้ที่ <a href="https://github.com/hutwatcharin-ai/roz-calc/issues" target="_blank" rel="noopener noreferrer">GitHub Issues</a> จะได้เติมให้ครบ
      </p>
    </main>
  );
}
