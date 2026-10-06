// app/guides/sp-recovery/page.tsx
//
// "ของฟื้น SP ตัวไหนคุ้ม" -- the owner asked Strawberry vs Blue Herb, then for
// every SP item side by side (28 Sep 2026). The answer that matters to a bot
// player is SP per unit of weight, because carry weight is what runs out.
//
// Where each number comes from:
//   - Weight, and the few SP values the client states outright (Blue Potion
//     "ประมาณ 60", the event and cash items, the Dishes): the game's own Thai
//     item text, data/game-items.json.
//   - The SP range of the fruits, herbs, Honey and Royal Jelly: rAthena's
//     item_db_usable (read 28 Sep 2026), because the client only says
//     "ฟื้นฟู SP เล็กน้อย". Every weight rAthena lists matches the client's
//     (theirs x10), but Zero has changed values before -- the client's own
//     Blue Potion reads ~60 where rAthena has 40-60 -- so the page says so.
//   - Who drops what: our monster_drops table, read at request time.
import './page.css';
import Link from 'next/link';
import type { Metadata } from 'next';
import PageHeader from '@/components/PageHeader';
import Caveat from '@/components/Caveat';
import JsonLd from '@/components/JsonLd';
import AdSlot from '@/components/AdSlot';
import { breadcrumbJsonLd } from '@/lib/jsonld';
import { itemHref } from '@/lib/item-href';
import { supabaseBrowser } from '@/lib/supabase';
import { isCVariant, isInstanceVariant, isMjVariant } from '@/lib/c-variant';

export const revalidate = 86400;

const PATH = '/guides/sp-recovery';

export const metadata: Metadata = {
  title: 'ของฟื้น SP ตัวไหนคุ้ม Ragnarok Zero — Strawberry, Blue Herb, Cheese เทียบกัน',
  description:
    'เทียบของฟื้น SP ทุกตัวใน Ragnarok Zero Global: ฟื้นได้เท่าไร หนักเท่าไร และคุ้มน้ำหนักแค่ไหนสำหรับเปิดบอท Strawberry ได้ SP ต่อน้ำหนักมากที่สุด Cheese ซื้อจาก NPC ได้ พร้อมมอนที่ดรอปแต่ละตัว',
};

type Food = {
  id: number;
  name: string;
  th: string;
  min: number;
  max: number;
  weight: number;
  hp?: string;
  extra?: string;
  shop?: string;
  fromClient?: boolean;
};

// Sorted by SP per unit of weight, best first.
const FOODS: Food[] = [
  { id: 578, name: 'Strawberry', th: 'สตรอว์เบอร์รี', min: 16, max: 28, weight: 2 },
  { id: 582, name: 'Orange', th: 'ส้ม', min: 10, max: 20, weight: 2, hp: 'HP 10–20' },
  { id: 514, name: 'Grape', th: 'องุ่น', min: 10, max: 15, weight: 2 },
  { id: 576, name: 'Prickly Fruit', th: 'ผลไม้หนาม', min: 20, max: 30, weight: 6, hp: 'HP 150–300' },
  { id: 505, name: 'Blue Potion', th: 'ยาสีฟ้า', min: 60, max: 60, weight: 15, fromClient: true },
  { id: 568, name: 'Lemon', th: 'มะนาว', min: 10, max: 20, weight: 4 },
  { id: 526, name: 'Royal Jelly', th: 'รอยัลเยลลี', min: 40, max: 60, weight: 15, hp: 'HP 325–405', extra: 'แก้พิษ คำสาป ใบ้ สับสน ตาบอด' },
  { id: 510, name: 'Blue Herb', th: 'สมุนไพรสีฟ้า', min: 15, max: 30, weight: 7 },
  { id: 518, name: 'Honey', th: 'น้ำผึ้ง', min: 20, max: 40, weight: 10, hp: 'HP 70–100' },
  { id: 548, name: 'Cheese', th: 'ชีส', min: 10, max: 15, weight: 5, shop: 'ร้าน NPC 28z · ร้านนมมุมซ้ายล่าง Prontera' },
];

const avg = (f: Food) => (f.min + f.max) / 2;
const perWeight = (f: Food) => avg(f) / f.weight;
const BEST = Math.max(...FOODS.map(perWeight));
const CARRY = 700;

const SPECIAL = [
  { id: 100005, name: 'Small Mana Potion', what: 'ฟื้น 5% ของ MaxSP ทุก 5 วินาที นาน 10–30 นาที', note: 'ของแคช · ยิ่ง MaxSP สูงยิ่งคุ้ม ดีที่สุดสำหรับตีนาน ๆ' },
  { id: 100080, name: 'Dishes Lv.5–10 (อาหารรวมมิตร)', what: 'ฟื้น HP/SP 5–10% และ All Stats +5 ถึง +10', note: 'ทำเองได้จากระบบทำอาหาร' },
  { id: 607, name: 'Yggdrasil Berry', what: 'ฟื้น HP/SP เต็ม 100%', note: 'หายาก เก็บไว้ใช้ตอนจำเป็น' },
  { id: 608, name: 'Yggdrasil Seed', what: 'ฟื้น HP/SP 50%', note: 'หายาก' },
  { id: 11637, name: 'Berry Soda', what: 'ฟื้น SP ประมาณ 180 · หนัก 0.1', note: 'ของอีเวนต์ หายเมื่อจบอีเวนต์' },
  { id: 1100061, name: 'Baby Shark Singing Candy', what: 'ฟื้น SP ประมาณ 84 · หนัก 0.1', note: 'ของอีเวนต์ หายเมื่อจบอีเวนต์' },
];

function iconOf(id: number) {
  return id === 1100061 ? `/images/items/${id}.png` : `/images/items/${id}.gif`;
}

/** SP back per regen tick: floor(INT/6) + floor(MaxSP/100) + 1, plus extra from INT 120 (rAthena, via roz.prontera.info). */
function spRegen(int: number, maxSp: number): number {
  return Math.floor(int / 6) + Math.floor(maxSp / 100) + 1 + (int >= 120 ? Math.floor((int - 120) / 2) + 4 : 0);
}
const SP_REGEN_INT = [1, 30, 50, 70, 90];
const SP_REGEN_MAXSP = [200, 400, 600, 800];

export default async function SpRecoveryPage() {
  const db = supabaseBrowser();
  const { data, error } = await db
    .from('monster_drops')
    .select('item_id, rate, monsters(id, name_en, level, image_url)')
    .in('item_id', FOODS.map((f) => f.id))
    .order('rate', { ascending: false, nullsFirst: false });
  if (error) console.error('sp-recovery drops query failed', error);
  // Plain monsters only: champion (C1-C9) and instance copies are not what a
  // reader goes out to hunt.
  const droppers = new Map<number, { id: number; name: string; level: number; image: string | null; rate: number | null }[]>();
  for (const d of (data ?? []) as any[]) {
    const m = d.monsters;
    if (!m || isCVariant(m.name_en) || isMjVariant(m.name_en) || isInstanceVariant(m.name_en)) continue;
    const list = droppers.get(d.item_id) ?? [];
    if (list.length < 3 && !list.some((x) => x.id === m.id)) list.push({ id: m.id, name: m.name_en, level: m.level, image: m.image_url, rate: d.rate });
    droppers.set(d.item_id, list);
  }

  return (
    <main className="shell guildp" style={{ paddingBlock: 32 }}>
      <JsonLd data={breadcrumbJsonLd([
        { name: 'หน้าแรก', path: '/' },
        { name: 'ไกด์', path: '/guides' },
        { name: 'ของฟื้น SP', path: PATH },
      ])} />
      <nav className="crumbs" aria-label="ตำแหน่งหน้า">
        <Link href="/">หน้าแรก</Link><span className="crumbs__sep" aria-hidden="true">›</span>
        <Link href="/guides">ไกด์</Link><span className="crumbs__sep" aria-hidden="true">›</span>
        <span className="crumbs__here">ของฟื้น SP</span>
      </nav>

      <PageHeader
        title="ของฟื้น SP ตัวไหนคุ้ม"
        lead="เทียบว่าฟื้นได้เท่าไร หนักเท่าไร เวลาเปิดบอทน้ำหนักหมดก่อนเงินหมด เลยต้องดูว่า SP ต่อน้ำหนักได้เท่าไร"
      />

      <section className="card card--yellow" style={{ marginTop: 14 }}>
        <h2 className="section-title" style={{ marginTop: 0 }}>สรุปสั้น ๆ</h2>
        <div className="spr__picks">
          <div className="spr__pick">
            <img src={iconOf(578)} alt="" width={32} height={32} />
            <div><strong>เปิดบอทนาน ๆ → Strawberry</strong><span>เบาที่สุด ได้ SP ต่อน้ำหนักมากที่สุด ฟาร์มเองจาก Snake ได้</span></div>
          </div>
          <div className="spr__pick">
            <img src={iconOf(582)} alt="" width={32} height={32} />
            <div><strong>อยากได้ HP ด้วย → Orange</strong><span>เบาเท่า Strawberry ฟื้นทั้ง HP และ SP</span></div>
          </div>
          <div className="spr__pick">
            <img src={iconOf(548)} alt="" width={32} height={32} />
            <div><strong>ไม่อยากฟาร์ม → Cheese</strong><span>ซื้อจาก NPC ได้ 28z แต่หนัก ได้ SP ต่อน้ำหนักน้อยสุด</span></div>
          </div>
          <div className="spr__pick">
            <img src={iconOf(100005)} alt="" width={32} height={32} />
            <div><strong>MaxSP สูง / ตีนาน → Small Mana Potion</strong><span>ฟื้นเป็น % ต่อเนื่อง 10–30 นาที ดีกว่าของกินทุกตัว</span></div>
          </div>
        </div>
      </section>

      {/* Natural SP regen (6 Oct 2026): the free SP every bot player gets
          between kills, from the formula roz.prontera.info uses. */}
      <section className="card" style={{ marginTop: 14 }}>
        <h2 className="section-title" style={{ marginTop: 0 }}>SP ที่ฟื้นเองต่อรอบ</h2>
        <p className="muted" style={{ marginTop: 4 }}>
          ฟื้นเองต่อรอบ = floor(INT ÷ 6) + floor(MaxSP ÷ 100) + 1 · INT ตั้งแต่ 120 ได้เพิ่มอีก ·
          สูตร rAthena ที่ roz.prontera.info ใช้ ยังไม่มีใครวัดใน Global · ยิ่ง INT กับ MaxSP สูง ยิ่งพกของฟื้น SP น้อยลงได้
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table className="stat-table">
            <thead>
              <tr>
                <th scope="col">INT ↓ · MaxSP →</th>
                {SP_REGEN_MAXSP.map((sp) => <th key={sp} scope="col" className="num">{sp}</th>)}
              </tr>
            </thead>
            <tbody>
              {SP_REGEN_INT.map((int) => (
                <tr key={int}>
                  <th scope="row" className="mono">{int}</th>
                  {SP_REGEN_MAXSP.map((sp) => <td key={sp} className="num">{spRegen(int, sp)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card" style={{ marginTop: 14 }}>
        <h2 className="section-title" style={{ marginTop: 0 }}>เทียบทุกตัว เรียงจากคุ้มน้ำหนักที่สุด</h2>
        <p className="muted" style={{ marginTop: 4 }}>
          แถบยาว = ได้ SP ต่อน้ำหนักมาก · &quot;ถ้าพก {CARRY} น้ำหนัก&quot; คือเอาน้ำหนักเท่านี้ไปใส่ของตัวนั้นทั้งหมด จะได้ SP รวมประมาณเท่าไร
        </p>
        <ol className="spr__list">
          {FOODS.map((f, i) => {
            const pw = perWeight(f);
            const drops = droppers.get(f.id) ?? [];
            return (
              <li key={f.id} className="spr__row">
                <span className="spr__rank mono">{i + 1}</span>
                <img className="spr__icon" src={iconOf(f.id)} alt="" width={32} height={32} />
                <div className="spr__body">
                  <div className="spr__head">
                    <Link href={itemHref(f.id, 'Consumable / Recovery')}><strong>{f.name}</strong></Link>
                    <span className="muted"> {f.th}</span>
                  </div>
                  <div className="spr__nums">
                    <span><b>SP {f.min === f.max ? `~${f.min}` : `${f.min}–${f.max}`}</b></span>
                    {f.hp && <span>+ {f.hp}</span>}
                    <span className="muted">หนัก {f.weight}</span>
                  </div>
                  <div className="spr__bar" aria-hidden="true"><i style={{ width: `${Math.round((pw / BEST) * 100)}%` }} /></div>
                  <div className="spr__nums">
                    <span>SP ต่อน้ำหนัก 1: <b className="mono">{pw.toFixed(1)}</b></span>
                    <span className="muted">ถ้าพก {CARRY} น้ำหนัก ≈ <b className="mono">{Math.round((CARRY / f.weight) * avg(f)).toLocaleString('en-US')}</b> SP</span>
                  </div>
                  {f.extra && <p className="spr__extra">{f.extra}</p>}
                  <p className="spr__from">
                    {f.shop ? <><b>ซื้อได้:</b> {f.shop}{drops.length ? ' · ' : ''}</> : null}
                    {drops.length > 0 ? (
                      <>
                        <b>ดรอปจาก:</b>{' '}
                        {drops.map((m, j) => (
                          <span key={m.id}>
                            {j > 0 && ' · '}
                            <Link href={`/database/monsters/${m.id}`}>{m.name}</Link>
                            <span className="muted"> Lv {m.level}{m.rate != null ? ` ${m.rate}%` : ''}</span>
                          </span>
                        ))}
                      </>
                    ) : !f.shop ? <span className="muted">ยังไม่มีข้อมูลมอนที่ดรอป</span> : null}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <AdSlot slot="inline" />

      <section className="card" style={{ marginTop: 14 }}>
        <h2 className="section-title" style={{ marginTop: 0 }}>ของพิเศษ (แคช · อาหาร · อีเวนต์)</h2>
        <ul className="spr__special">
          {SPECIAL.map((s) => (
            <li key={s.id}>
              <img src={iconOf(s.id)} alt="" width={28} height={28} />
              <div>
                <strong>{s.name}</strong>
                <span>{s.what}</span>
                <span className="muted">{s.note}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <Caveat label="เชื่อได้แค่ไหน">
        <strong>น้ำหนักทุกตัว</strong> และค่าของ Blue Potion ของแคช อาหาร และของอีเวนต์ มาจากข้อความไอเทมในเกม ·
        <strong>ค่าฟื้น SP ของผลไม้ สมุนไพร Honey และ Royal Jelly มาจาก rAthena</strong> (ข้อมูล RO เกาหลี) เพราะในเกมเขียนแค่ว่า &quot;ฟื้นฟู SP เล็กน้อย&quot;
        น้ำหนักทุกตัวตรงกับในเกม แต่ Zero เคยปรับค่าบางตัว (Blue Potion ในเกมเขียนประมาณ 60 ขณะที่ rAthena ให้ 40–60) ถ้าในเกมไม่ตรง ยึดตามเกม ·
        มอนที่ดรอปมาจากฐานข้อมูลมอนของเว็บนี้ ไม่นับมอน Challenge (C1–C9) และมอนในดันเจี้ยน
      </Caveat>

      <p className="muted" style={{ marginTop: 16 }}>
        ดูต่อ: <Link href="/guides/cooking">ทำอาหาร</Link> · <Link href="/tools/leveling-spots?mode=afk">จุดทิ้งบอท</Link> ·{' '}
        <Link href="/guides/faq">คำถามที่ถามบ่อย</Link>
      </p>
    </main>
  );
}
