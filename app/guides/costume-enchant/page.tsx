// app/guides/costume-enchant/page.tsx
//
// Costume enchant stones (owner, 30 Sep 2026): which stone goes in which
// costume slot, what it gives, and which box it comes out of.
//
// The owner picked "show every stone the game data holds, and say which box
// each comes from" over "show only what midgardhub lists": a player holding a
// stone from the market wants to find it here. So:
//   - Stones and effects are our items rows (the game's own English item
//     text), written in Thai here. 43 stones.
//   - Which box gives which stone is the boxes' own item text ("obtains one of
//     the following at random"), not anyone's guess.
//   - How to make the boxes (5 unbound costumes + 10,000z) is midgardhub's
//     costume enchant guide (read 30 Sep 2026) together with the Craft Box B
//     item text, which says the same five-costume rule.
// Box A is the combat set (crit, cast, recovery, size); the plain boxes are
// the +1 stat set. One stone, CRI Stone (Upper), is in no box's list.

import type { Metadata } from 'next';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import Caveat from '@/components/Caveat';
import JsonLd from '@/components/JsonLd';
import { breadcrumbJsonLd } from '@/lib/jsonld';
import NaviCopy from '@/components/NaviCopy';

export const metadata: Metadata = {
  title: 'หินเอนแชนต์คอสตูม Ragnarok Zero — ช่องไหนใส่หินอะไร ได้อะไร',
  description:
    'หินเอนแชนต์คอสตูมทุกแบบใน Ragnarok Zero Global แยกตามช่อง หมวกบน กลาง ล่าง และผ้าคลุม · ผลของแต่ละก้อน โบนัสเมื่อใส่ครบชุด · ทำกล่องหินจากคอสตูม 5 ชิ้น · สุ่มได้จากกล่องไหน',
};

type Box = 'stat' | 'a' | 'none';
type Stone = { id: number; name: string; effect: string; box: Box };

const BOX_LABEL: Record<Box, string> = {
  stat: 'กล่องสเตตัส',
  a: 'กล่อง A',
  none: 'ยังไม่รู้',
};

const SLOTS: { key: string; title: string; short: string; stones: Stone[] }[] = [
  {
    key: 'upper',
    short: 'บน',
    title: 'หมวกบน (Upper)',
    stones: [
      { id: 6636, name: 'STR Stone (Upper)', effect: 'STR +1', box: 'stat' },
      { id: 6637, name: 'INT Stone (Upper)', effect: 'INT +1', box: 'stat' },
      { id: 6638, name: 'AGI Stone (Upper)', effect: 'AGI +1', box: 'stat' },
      { id: 6639, name: 'DEX Stone (Upper)', effect: 'DEX +1', box: 'stat' },
      { id: 6640, name: 'VIT Stone (Upper)', effect: 'VIT +1', box: 'stat' },
      { id: 6641, name: 'LUK Stone (Upper)', effect: 'LUK +1', box: 'stat' },
      { id: 25304, name: 'Critical Stone (Upper)', effect: 'ดาเมจคริ +3%', box: 'a' },
      { id: 25172, name: 'Variable Casting Stone (Upper)', effect: 'ร่ายแปรผัน −3%', box: 'a' },
      { id: 6740, name: 'Recovery Stone (Upper)', effect: 'ฟื้น HP จาก Heal และจากยา +2%', box: 'a' },
      { id: 6741, name: 'Recovery Skill Stone (Upper)', effect: 'สกิลฮีลฟื้นมากขึ้น +3%', box: 'a' },
      { id: 6790, name: 'Large Stone (Upper)', effect: 'ดาเมจใส่มอนขนาดใหญ่ +1%', box: 'a' },
      { id: 6791, name: 'Medium Stone (Upper)', effect: 'ดาเมจใส่มอนขนาดกลาง +1%', box: 'a' },
      { id: 6792, name: 'Small Stone (Upper)', effect: 'ดาเมจใส่มอนขนาดเล็ก +1%', box: 'a' },
      { id: 6716, name: 'CRI Stone (Upper)', effect: 'CRIT +1', box: 'none' },
    ],
  },
  {
    key: 'middle',
    short: 'กลาง',
    title: 'หมวกกลาง (Middle)',
    stones: [
      { id: 6945, name: 'STR Stone (Middle)', effect: 'STR +1', box: 'stat' },
      { id: 6946, name: 'INT Stone (Middle)', effect: 'INT +1', box: 'stat' },
      { id: 6947, name: 'AGI Stone (Middle)', effect: 'AGI +1', box: 'stat' },
      { id: 6948, name: 'DEX Stone (Middle)', effect: 'DEX +1', box: 'stat' },
      { id: 6949, name: 'VIT Stone (Middle)', effect: 'VIT +1', box: 'stat' },
      { id: 6950, name: 'LUK Stone (Middle)', effect: 'LUK +1', box: 'stat' },
      { id: 6642, name: 'ATK Stone (Middle)', effect: 'ATK +1%', box: 'a' },
      { id: 6643, name: 'MATK Stone (Middle)', effect: 'MATK +1%', box: 'a' },
      { id: 25060, name: 'Critical Stone (Middle)', effect: 'ดาเมจคริ +3%', box: 'a' },
      { id: 25173, name: 'Variable Casting Stone (Middle)', effect: 'ร่ายแปรผัน −3%', box: 'a' },
      { id: 6743, name: 'HP Stone (Middle)', effect: 'MaxHP +1%', box: 'a' },
      { id: 6744, name: 'SP Stone (Middle)', effect: 'MaxSP +1%', box: 'a' },
      { id: 6717, name: 'MaxHP Stone (Middle)', effect: 'MaxHP +50', box: 'a' },
      { id: 25001, name: 'DEF Stone (Middle)', effect: 'DEF +20', box: 'a' },
      { id: 6742, name: 'Recovery Stone (Middle)', effect: 'ฟื้น HP 10 ทุก 10 วินาที', box: 'a' },
    ],
  },
  {
    key: 'lower',
    short: 'ล่าง',
    title: 'หมวกล่าง (Lower)',
    stones: [
      { id: 25016, name: 'ATK Stone (Lower)', effect: 'ATK +1%', box: 'a' },
      { id: 25017, name: 'MATK Stone (Lower)', effect: 'MATK +1%', box: 'a' },
      { id: 25305, name: 'Critical Stone (Lower)', effect: 'ดาเมจคริ +3%', box: 'a' },
      { id: 25174, name: 'Variable Casting Stone (Lower)', effect: 'ร่ายแปรผัน −3%', box: 'a' },
      { id: 6644, name: 'HIT Stone (Lower)', effect: 'HIT +1', box: 'a' },
      { id: 6645, name: 'FLEE Stone (Lower)', effect: 'FLEE +1', box: 'a' },
      { id: 6951, name: 'HP Stone (Lower)', effect: 'MaxHP +1%', box: 'a' },
      { id: 6718, name: 'MaxSP Stone (Lower)', effect: 'MaxSP +10', box: 'a' },
      { id: 25014, name: 'MDEF Stone (Lower)', effect: 'MDEF +4', box: 'a' },
      { id: 6745, name: 'Recovery Stone (Lower)', effect: 'ฆ่ามอนด้วยการตีหรือเวท ได้ SP คืน 1', box: 'a' },
    ],
  },
  {
    key: 'garment',
    short: 'ผ้าคลุม',
    title: 'ผ้าคลุม (Garment)',
    stones: [
      { id: 6908, name: 'ASPD Stone (Garment)', effect: 'ASPD +1', box: 'stat' },
      { id: 25306, name: 'Variable Casting Stone (Garment)', effect: 'ร่ายแปรผัน −10%', box: 'stat' },
      { id: 25303, name: 'Critical Stone (Garment)', effect: 'ดาเมจคริ +20%', box: 'a' },
      { id: 25302, name: 'Double Attack Stone (Garment)', effect: 'ใช้ Double Attack Lv.3 ได้กับอาวุธทุกแบบ (ถ้าเรียนสูงกว่าใช้เลเวลที่เรียน)', box: 'a' },
    ],
  },
];

const SETS = [
  { need: 'Critical Stone บน + กลาง + ล่าง', gives: 'ดาเมจคริ +6% เพิ่ม' },
  { need: 'Critical Stone บน + กลาง + ล่าง + ผ้าคลุม', gives: 'CRIT +10 เพิ่มอีก' },
  { need: 'Variable Casting Stone บน + กลาง + ล่าง', gives: 'ร่ายแปรผัน −6% เพิ่ม' },
  { need: 'ATK Stone ครบบน กลาง ล่าง', gives: 'ATK +2% เพิ่ม' },
  { need: 'MATK Stone ครบบน กลาง ล่าง', gives: 'MATK +2% เพิ่ม' },
  { need: 'DEF Stone (Middle) + MDEF Stone (Lower)', gives: 'HIT +5 และ FLEE +5' },
];

const total = SLOTS.reduce((n, s) => n + s.stones.length, 0);

function Icon({ id }: { id: number }) {
  return <img src={`/images/items/${id}.gif`} alt="" width={24} height={24} style={{ imageRendering: 'pixelated' }} loading="lazy" />;
}

export default function CostumeEnchantPage() {
  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'หน้าแรก', path: '/' },
          { name: 'ไกด์', path: '/guides' },
          { name: 'หินเอนแชนต์คอสตูม', path: '/guides/costume-enchant' },
        ])}
      />
      <PageHeader
        title="หินเอนแชนต์คอสตูม"
        lead={<>คอสตูม 4 ชิ้น หมวกบน กลาง ล่าง และผ้าคลุม ใส่หินได้ชิ้นละ 1 ก้อน ตามชื่อช่องที่เขียนในวงเล็บ · มีทั้งหมด {total} แบบ</>}
      />

      <div className="cslots">
        {SLOTS.map((slot) => (
          <a key={slot.key} className="cslots__slot" href={`#${slot.key}`}>
            <span className="cslots__name">{slot.short}</span>
            <span className="cslots__icons">
              {slot.stones.slice(0, 3).map((st) => <Icon key={st.id} id={st.id} />)}
            </span>
            <small>{slot.stones.length} แบบ</small>
          </a>
        ))}
        <div className="cslots__npc">
          <span>ใส่หินที่ <strong>Costume Enchant Master</strong></span>
          <NaviCopy cmd="/navi itemmall 41/54" />
        </div>
      </div>

      <section className="card card--cyan">
        <h2 className="section-title">ทำหินยังไง</h2>
        <ol className="gsteps">
          <li>
            ใช้ <Link href="/database/items/105913">Enchant Stone Craft Box B</Link> ใส่<strong>คอสตูม 5 ชิ้นที่ยังไม่ผูกตัว</strong> + 10,000z ·
            คอสตูมต้องเป็นแบบที่ดรอปจากมอน ของจาก Cash Shop ใช้ไม่ได้
          </li>
          <li>ได้<strong>กล่อง A</strong> ของช่องใดช่องหนึ่งแบบสุ่ม (บน กลาง ล่าง หรือผ้าคลุม)</li>
          <li>เปิดกล่องได้หิน 1 ก้อนแบบสุ่มจากรายการของช่องนั้น ดูได้ในตารางข้างล่าง</li>
        </ol>
        <p className="muted" style={{ marginTop: 10, marginBottom: 0, fontSize: 13 }}>
          <strong>กล่องสเตตัส</strong> (หิน +1 สเตตัส, ASPD และหินลดร่ายของผ้าคลุม) เป็นกล่องอีกชุด ยังไม่รู้ว่าได้จากไหน ·
          ย้ายหินไปคอสตูมอื่นได้ด้วย <Link href="/database/items/1002727">Costume Enchant Transfer Ticket</Link> ที่ NPC Costume Enchant Transfer Yul
        </p>
      </section>

      {SLOTS.map((slot) => (
        <section key={slot.key} id={slot.key} className="card" style={{ marginTop: 16, scrollMarginTop: 90 }}>
          <h2 className="section-title">{slot.title} <span className="muted" style={{ fontWeight: 400 }}>· {slot.stones.length} แบบ</span></h2>
          <div className="cstones">
            {slot.stones.map((st) => (
              <Link key={st.id} className={`cstone is-${st.box}`} href={`/database/items/${st.id}`}>
                <span className="cstone__icon"><Icon id={st.id} /></span>
                <span className="cstone__body">
                  <strong>{st.effect}</strong>
                  <small>{st.name}</small>
                </span>
                <span className="cstone__box">{BOX_LABEL[st.box]}</span>
              </Link>
            ))}
          </div>
          {slot.key === 'middle' && (
            <p className="muted" style={{ marginTop: 8, fontSize: 13 }}>
              กล่องสเตตัสช่องกลางยังมีหินชื่อ Conversion Stone อีก 6 แบบ (STR AGI VIT INT DEX LUK) ซึ่งไม่มีข้อมูลผลในเกม ·
              หมวกกลางยังใส่เอฟเฟกต์ได้อีกช่อง เช่น <Link href="/database/items/25176">Blue Aura Effect</Link> กับ{' '}
              <Link href="/database/items/25177">Shadow Effect</Link> (เงาไม่แสดงในเขตสงครามกิลด์และ PvP) เป็นแค่หน้าตา ไม่มีค่าสถานะ
            </p>
          )}
          {slot.key === 'lower' && (
            <p className="muted" style={{ marginTop: 8, fontSize: 13 }}>
              กล่องสเตตัสช่องล่างให้ Conversion Stone 6 แบบ (STR AGI VIT INT DEX LUK) ซึ่งไม่มีข้อมูลผลในเกม
            </p>
          )}
        </section>
      ))}

      <section className="card card--yellow" style={{ marginTop: 24 }}>
        <h2 className="section-title">ใส่ครบชุดได้โบนัสเพิ่ม</h2>
        <div className="csets">
          {SETS.map((st) => (
            <div key={st.need} className="csets__row">
              <span>{st.need}</span>
              <b aria-hidden="true">▶</b>
              <strong>{st.gives}</strong>
            </div>
          ))}
        </div>
      </section>

      <Caveat label="เชื่อได้แค่ไหน">
        ผลของหินทุกก้อน และกล่องไหนสุ่มได้หินอะไร มาจากคำอธิบายไอเทมในข้อมูลเกม · วิธีทำกล่องจากคอสตูม 5 ชิ้นกับค่า 10,000z มาจากไกด์ของ
        midgardhub (อ่าน 30 ก.ย. 2026) และตรงกับคำอธิบายของ Craft Box B · ยังไม่มีข้อมูลโอกาสสุ่มได้แต่ละก้อน และค่าย้ายหิน
      </Caveat>

      <p className="muted" style={{ marginTop: 16 }}>
        ดูต่อ: <Link href="/guides/costume-craft">คราฟต์หมวก</Link> · <Link href="/database/costumes">คอสตูมทั้งหมด</Link>
      </p>
    </main>
  );
}
