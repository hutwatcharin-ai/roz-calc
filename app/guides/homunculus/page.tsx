// โฮมุนคูลัส — what the game itself says, and what nobody can show us yet.
//
// Written 24 Sep 2026. A deep-research round for this page returned values
// from rAthena almost exclusively: an emulator built for another ruleset,
// which cannot be quoted as Zero. So the skill and item text here comes from
// the Zero client instead, collected by scripts/build-homunculus.py, plus two
// facts the owner checked in game.
//
// The correction worth keeping: the client's Bioethics tooltip says
// "เงื่อนไข : สำเร็จเควสต์", but the owner confirmed on 24 Sep 2026 that the
// live game has no such quest -- the skill is learned and the homunculus is
// created straight from the skill. Guides copied from classic RO all say a
// quest is required, so the page states the difference rather than hiding it.
//
// Care, feeding and evolution came later, from data/homunculus-care.json.
// They are NOT client facts: rAthena and the Thai guide at homunkung both
// describe classic RO. The owner's call on 24 Sep 2026 was to publish them
// with the label, because the two sources are independent and agree -- their
// intimacy scales are the same numbers a hundred apart (Loyal at 911 vs
// 91,100), which is hard to get by coincidence -- and because every item they
// name is already in the Zero client. Where they disagree, the page prints
// both and picks neither.
//
// What is still deliberately NOT here: base stats, growth per level, the EXP
// rate, and the level cap. Those have no agreeing pair of sources.
//
// Order of sections, reordered on 24 Sep 2026 when the owner asked for an
// easier read: the page now follows what a player does, not what our data
// files contain. Make one, feed it, then the reference lists. The jump bar
// exists because the reference half is long and a returning reader wants the
// feeding table, not a scroll past sixteen skills.

import type { Metadata } from 'next';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import AdSlot from '@/components/AdSlot';
import JsonLd from '@/components/JsonLd';
import { breadcrumbJsonLd } from '@/lib/jsonld';
import homun from '@/data/homunculus.json';
import care from '@/data/homunculus-care.json';
import { itemHref } from '@/lib/item-href';
import { supabaseBrowser } from '@/lib/supabase';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'โฮมุนคูลัส Ragnarok Zero — สร้างยังไง เลี้ยงยังไง สกิลแต่ละตัว',
  description:
    'วิธีสร้างโฮมุนคูลัสใน Ragnarok Zero Global สำหรับ Alchemist ตั้งแต่สายสกิล Bioethics ถึง Call Homunculus วิธีทำ Embryo อาหารของแต่ละตัว การวิวัฒน์ร่างสอง และสกิลของ Lif Amistr Filir Vanilmirth ครบทุกเลเวล',
};

type Skill = {
  code: string;
  id: number;
  name: string;
  maxLevel?: number | null;
  requires?: string;
  kind?: string;
  role?: string;
  target?: string;
  detail?: string;
  levels: { level: number; text: string }[];
};
type Creature = { key: string; name: string; sprite: string; evolvedSprite: string; skills: Skill[] };

const ALCHEMIST = homun.alchemist as Skill[];
const HOMUNCULI = homun.homunculus as Creature[];
const ITEMS = homun.items as { id: number; name: string; text: string }[];
// Everything in data/homunculus-care.json is from sources written for classic
// RO, so the sections that use it carry a warning of their own.
const CARE = care;
const SKILL_COUNT = HOMUNCULI.reduce((sum, h) => sum + h.skills.length, 0);

// The Embryo recipe: what Pharmacy consumes per attempt. The guide book is
// held, not spent, which is why it is listed apart from the three materials.
const MATERIALS = [7140, 7141, 7143];
const GUIDE_BOOK = 7144;
// Every other id on the page is already in the data file; the bowl is not,
// because the client's text for it says nothing about homunculi.
const MEDICINE_BOWL = 7134;
const EMBRYO = 7142;

// Roles are our reading of each creature's own skill list, not a field in any
// data we hold. The page says so where they appear.
const ROLES: Record<string, string> = {
  lif: 'สายช่วยเจ้าของ ฟื้น HP ให้ผู้เล่น และเพิ่มความเร็วเคลื่อนที่',
  amistr: 'สายรับ สลับที่กับเจ้าของเพื่อดึงมอน เพิ่ม DEF และ MaxHP',
  filir: 'สายตี โจมตีต่อเนื่อง เพิ่ม ASPD และ Flee',
  vanilmirth: 'สายสุ่ม ร่าย Bolt และ Heal แบบสุ่มเป้า ระเบิดตัวเองได้',
};

const JUMPS = [
  { id: 'sec-start', label: 'เริ่มยังไง' },
  { id: 'sec-embryo', label: 'ทำ Embryo' },
  { id: 'sec-food', label: 'ให้อาหาร' },
  { id: 'sec-evolve', label: 'ร่างที่สอง' },
  { id: 'sec-homun', label: 'โฮมุน 4 ตัว' },
  { id: 'sec-skills', label: 'สกิลเจ้าของ' },
  { id: 'sec-unknown', label: 'ที่ยังไม่รู้' },
];

function Levels({ skill }: { skill: Skill }) {
  if (!skill.levels.length) return null;
  return (
    <ul className="homun__levels">
      {skill.levels.map((l) => (
        <li key={l.level}>
          <strong>Lv.{l.level}</strong> {l.text}
        </li>
      ))}
    </ul>
  );
}

/** `level` keeps the heading order legal: h3 under a section, h4 under a creature. */
function SkillBlock({ skill, level = 3 }: { skill: Skill; level?: 3 | 4 }) {
  const Heading = level === 4 ? 'h4' : 'h3';
  const facts = [
    skill.maxLevel ? `สูงสุด Lv.${skill.maxLevel}` : null,
    skill.kind,
    skill.role,
    skill.requires ? `ต้องมี ${skill.requires}` : null,
  ].filter(Boolean);
  return (
    <div className="homun__skill">
      <Heading className="homun__skillname">{skill.name}</Heading>
      {facts.length > 0 && <p className="homun__facts">{facts.join(' · ')}</p>}
      {skill.detail && <p className="homun__detail">{skill.detail}</p>}
      <Levels skill={skill} />
    </div>
  );
}

const THAI_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

/** "2026-09-24" -> "24 ก.ย. 2026", the form the rest of the site uses. */
function thaiDate(iso: string): string {
  const [year, month, day] = iso.split('-');
  return `${Number(day)} ${THAI_MONTHS[Number(month) - 1]} ${year}`;
}

function OldRoWarning() {
  return (
    <div className="homun__warn">
      <p>
        <strong>หัวข้อนี้ยังไม่มีใครยืนยันกับ Zero</strong> ตัวเลขมาจากไกด์ RO รุ่นเดิมสองเจ้าที่ให้ค่าตรงกัน
        ไอเทมที่พูดถึงมีในเกมครบแล้วทุกชิ้น ตรงไหนที่สองเจ้าขัดกัน หน้านี้เขียนไว้ให้เห็นทั้งคู่
      </p>
    </div>
  );
}

async function itemMeta(ids: number[]) {
  const { data, error } = await supabaseBrowser()
    .from('items')
    .select('id, name_en, icon_url, category, buy_price')
    .in('id', ids);
  if (error) console.error('homunculus guide lookup failed', error);
  return new Map((data ?? []).map((row) => [row.id as number, row]));
}

export default async function HomunculusGuidePage() {
  const meta = await itemMeta([
    ...ITEMS.map((i) => i.id),
    MEDICINE_BOWL,
    ...CARE.food.map((f) => f.itemId),
    CARE.evolution.itemId,
  ]);
  const href = (id: number) => itemHref(id, (meta.get(id)?.category as string) ?? null);
  const icon = (id: number) => (meta.get(id)?.icon_url as string) ?? null;
  const price = (id: number) => (meta.get(id)?.buy_price as number) ?? 0;
  // Read from the price column rather than typed, so it cannot go stale
  // silently. Only the three consumed materials count toward it.
  const materialCost = MATERIALS.reduce((sum, id) => sum + price(id), 0);
  const name = (id: number) => ITEMS.find((i) => i.id === id)?.name ?? (meta.get(id)?.name_en as string) ?? `#${id}`;
  const zeny = (id: number) => (price(id) ? `${price(id).toLocaleString('th-TH')}z` : 'ไม่ทราบราคา');

  const ItemLink = ({ id }: { id: number }) => (
    <Link href={href(id)} className="homun__item">
      {icon(id) && <img src={icon(id)!} alt="" width={22} height={22} loading="lazy" />}
      <span>{name(id)}</span>
    </Link>
  );

  return (
    <main className="shell homun">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'หน้าแรก', path: '/' },
          { name: 'ไกด์', path: '/guides' },
          { name: 'โฮมุนคูลัส', path: '/guides/homunculus' },
        ])}
      />
      <nav className="crumbs" aria-label="ตำแหน่งหน้า">
        <Link href="/">หน้าแรก</Link><span className="crumbs__sep" aria-hidden="true">›</span>
        <Link href="/guides">ไกด์</Link><span className="crumbs__sep" aria-hidden="true">›</span>
        <span className="crumbs__here">โฮมุนคูลัส</span>
      </nav>

      <PageHeader
        title="โฮมุนคูลัส — สร้างยังไง เลี้ยงยังไง"
        lead="โฮมุนคูลัสคือตัวช่วยของ Alchemist เรียกออกมาแล้วมันสู้ให้เอง มีเลเวลของตัวเอง และเรียนสกิลของมันได้ หน้านี้ไล่ตั้งแต่ยังไม่มี จนเลี้ยงเป็น"
      />

      <nav className="jumpbar" aria-label="หัวข้อในหน้านี้">
        {JUMPS.map((j) => (
          <a key={j.id} href={`#${j.id}`}>{j.label}</a>
        ))}
      </nav>

      <section className="card card--cyan" id="sec-start">
        <h2 className="section-title" style={{ marginTop: 0 }}>เริ่มยังไง</h2>
        <ol className="homun__steps">
          <li>เป็น <Link href="/guides/job-change">Alchemist</Link> ก่อน สกิลทั้งหมดในหน้านี้เป็นของอาชีพนี้</li>
          <li>เรียน <strong>Bioethics</strong> ต่อด้วย <strong>Rest</strong> ปิดท้ายด้วย <strong>Call Homunculus</strong> ใช้สกิลพอยต์ตัวละ 1 แต้ม</li>
          <li>ทำ <ItemLink id={EMBRYO} /> ด้วยสกิล <strong>Pharmacy</strong> วิธีอยู่หัวข้อถัดไป</li>
          <li>กด Call Homunculus แล้วมันจะออกมา <strong>ได้ตัวไหนเป็นการสุ่ม</strong> เลือกเองไม่ได้</li>
        </ol>
        <p className="homun__note">
          <strong>ไม่ต้องทำเควสต์</strong> ในเกมเขียนที่สกิล Bioethics ว่า &quot;เงื่อนไข : สำเร็จเควสต์&quot; แต่เป็นข้อความเก่าที่เซิร์ฟนี้ไม่ได้ใช้
          เราตรวจในเกมแล้วเมื่อ 24 ก.ย. 2026 ว่าเรียนแล้วสร้างได้เลย ไกด์ที่ลอกมาจาก RO เดิมมักเขียนผิดตรงนี้
        </p>
      </section>

      <section className="card" id="sec-embryo">
        <h2 className="section-title" style={{ marginTop: 0 }}>ทำ Embryo</h2>
        <p className="muted" style={{ marginTop: 2 }}>
          ใช้สกิล Pharmacy ของ Alchemist ขั้นตอนเต็มอยู่ที่ <Link href="/guides/potion-crafting">หน้าทำยา</Link>
        </p>
        <ul className="homun__mats">
          {MATERIALS.map((id) => (
            <li key={id}>
              <ItemLink id={id} />
              <span className="homun__price">{zeny(id)}</span>
            </li>
          ))}
        </ul>
        {materialCost > 0 && (
          <p className="homun__note">
            วัตถุดิบสามอย่างนี้ถูกใช้หมดทุกครั้งที่กดทำ รวม <strong>{materialCost.toLocaleString('th-TH')}z</strong> ต่อหนึ่งครั้ง
            ยังไม่รวมโอกาสทำพลาด และทั้งสามอย่างไม่มีมอนตัวไหนดรอป ต้องซื้อจากร้าน
          </p>
        )}
        <p className="homun__note">
          <strong>อีกสองอย่างที่ต้องมี</strong> <ItemLink id={MEDICINE_BOWL} /> ถูกใช้ครั้งละ 1 ชิ้น ส่วน{' '}
          <ItemLink id={GUIDE_BOOK} /> ราคา {zeny(GUIDE_BOOK)} พกไว้เฉย ๆ ไม่หาย ซื้อครั้งเดียวจบ
        </p>
        <p className="guildp__src">
          ที่มา: สูตรจากตารางสูตรผสมที่ตรงกันสองแหล่ง · กลไกว่าทำด้วย Pharmacy เราตรวจในเกม 24 ก.ย. 2026 · ราคาอ่านสดจากฐานข้อมูลเว็บนี้
        </p>
      </section>

      <section id="sec-food" style={{ marginTop: 18 }}>
        <h2 className="section-title">ให้อาหารและความสนิท</h2>
        <OldRoWarning />

        <div className="card" style={{ marginTop: 14 }}>
          <h3 className="homun__h3">ตัวไหนกินอะไร</h3>
          <ul className="homun__mats homun__mats--four">
            {CARE.food.map((row) => (
              <li key={row.key}>
                <span className="homun__who">{row.name}</span>
                <ItemLink id={row.itemId} />
                <span className="homun__price">{zeny(row.itemId)}</span>
              </li>
            ))}
          </ul>
          <p className="homun__note">
            Zargon Garlet และ Scell เป็นของดรอปทั่วไป กดเข้าหน้าไอเทมจะเห็นว่ามอนตัวไหนดรอป ส่วน Pet Food ซื้อจากร้านอย่างเดียว
          </p>
        </div>

        <div className="card" style={{ marginTop: 14 }}>
          <h3 className="homun__h3">ป้อนตอนไหนถึงคุ้ม</h3>
          <p className="muted" style={{ marginTop: 2 }}>
            ผลขึ้นกับว่าตอนนั้นมันหิวแค่ไหน ป้อนตอนอิ่มอยู่แล้วคือเสียความสนิทฟรี
          </p>
          <ul className="homun__feed">
            {CARE.feeding.map((row) => (
              <li key={row.hunger} className={row.agree.length > 1 ? 'homun__feed--both' : undefined}>
                <span className="homun__range">หิว {row.hunger}</span>
                <span>
                  <strong>{row.effect}</strong>
                  <span className="homun__detail">{row.detail}</span>
                </span>
              </li>
            ))}
          </ul>
          <div className="homun__conflict">
            <p><strong>ตรงนี้สองแหล่งขัดกัน: {CARE.conflict.topic}</strong></p>
            <p>rAthena ว่า {CARE.conflict.rathena}</p>
            <p>ไกด์ไทย homunkung ว่า {CARE.conflict.homunkung}</p>
            <p className="muted">ทางปลอดภัยคือป้อนตอนหิว 11-25 ซึ่งทั้งสองแหล่งตรงกันว่าดีที่สุด</p>
          </div>
        </div>

        <div className="card" style={{ marginTop: 14 }}>
          <h3 className="homun__h3">โฮมุนขึ้นเลเวลยังไง</h3>
          <p className="homun__detail" style={{ marginTop: 6 }}>{CARE.exp.how}</p>
          <p className="homun__note"><strong>จุดที่คนพลาดบ่อย</strong> {CARE.exp.condition}</p>
        </div>
      </section>

      <section className="card" id="sec-evolve">
        <h2 className="section-title" style={{ marginTop: 0 }}>ร่างที่สอง</h2>
        <p className="homun__detail" style={{ marginTop: 6 }}>
          พก <ItemLink id={CARE.evolution.itemId} /> ไว้หนึ่งชิ้น ราคาร้าน {zeny(CARE.evolution.itemId)} และ{' '}
          {CARE.evolution.needs}
        </p>
        <ul className="homun__unknown" style={{ marginTop: 10 }}>
          {CARE.evolution.effects.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <p className="homun__note"><strong>ราคาที่ต้องจ่าย</strong> {CARE.evolution.cost}</p>
        <div className="homun__evolved">
          {HOMUNCULI.map((creature) => (
            <img
              key={creature.key}
              src={creature.evolvedSprite}
              alt={`ร่างที่สองของ ${creature.name}`}
              loading="lazy"
              width={96}
              height={96}
            />
          ))}
        </div>
        <p className="muted" style={{ marginTop: 6, fontSize: 13 }}>ร่างที่สองของทั้งสี่ตัว ภาพจากไฟล์ไคลเอนต์</p>
        <p className="guildp__src">
          ที่มา: {CARE._meta.sources.rathena.label} และ{' '}
          <a href={CARE._meta.sources.homunkung.url} rel="nofollow noopener" target="_blank">
            {CARE._meta.sources.homunkung.label}
          </a>{' '}
          อ่านเมื่อ {thaiDate(CARE._meta.read)} ทั้งสองเขียนไว้สำหรับ RO รุ่นเดิม ไม่ได้ระบุว่าเป็น Zero · ใช้กับหัวข้อให้อาหารด้วย
        </p>
      </section>

      <AdSlot slot="inline" />

      <section id="sec-homun" style={{ marginTop: 18 }}>
        <h2 className="section-title">โฮมุนทั้งสี่ตัว</h2>
        <p className="muted" style={{ marginTop: 2, maxWidth: '70ch' }}>
          แต่ละตัวเรียนสกิลคนละชุด รวม {SKILL_COUNT} สกิล คำว่าสายรับ สายตี สายช่วย เป็นการอ่านจากชุดสกิลของมันเอง ไม่ใช่คำที่เกมเขียนไว้
        </p>
        {HOMUNCULI.map((creature) => (
          <section key={creature.key} className="card homun__card" id={creature.key}>
            <div className="homun__head">
              <img
                src={creature.sprite}
                alt={`โฮมุนคูลัส ${creature.name}`}
                className="homun__portrait"
                width={120}
                height={120}
                loading="lazy"
              />
              <div>
                <h3 className="homun__name">{creature.name}</h3>
                <p className="homun__role">{ROLES[creature.key]}</p>
              </div>
            </div>
            <div className="homun__skills">
              {creature.skills.map((skill) => (
                <SkillBlock key={skill.code} skill={skill} level={4} />
              ))}
            </div>
          </section>
        ))}
      </section>

      <section className="card" id="sec-skills">
        <h2 className="section-title" style={{ marginTop: 0 }}>สกิลฝั่งเจ้าของ</h2>
        <p className="muted" style={{ marginTop: 2 }}>ใช้เรียก พัก รักษา และชุบชีวิตโฮมุน</p>
        <div className="homun__skills">
          {ALCHEMIST.map((skill) => (
            <SkillBlock key={skill.code} skill={skill} />
          ))}
        </div>
        <p className="homun__note">
          ในเกมไทยเรียกสกิลพักว่า <strong>Rest</strong> ส่วนฐานข้อมูลเว็บนี้กับไกด์ภาษาอังกฤษเรียก{' '}
          <Link href="/database/skills?q=Vaporize">Vaporize</Link> เป็นสกิลเดียวกัน
        </p>
        <p className="guildp__src">ที่มา: ข้อความสกิลทุกบรรทัดยกมาจากไคลเอนต์ Zero อ่านเมื่อ {thaiDate(homun._meta.read)}</p>
      </section>

      <section className="card" id="sec-items">
        <h2 className="section-title" style={{ marginTop: 0 }}>ไอเทมที่ควรรู้จัก</h2>
        <div className="homun__items">
          {ITEMS.map((item) => (
            <div key={item.id} className="homun__itemrow">
              <ItemLink id={item.id} />
              <p className="homun__detail">{item.text}</p>
            </div>
          ))}
        </div>
        <p className="homun__note">
          Homunculus Tablet เป็นชิ้นเดียวที่เกมบอกตรง ๆ ว่าเกี่ยวกับความสนิท ส่วนเพิ่มให้เท่าไรต่อครั้ง เกมไม่ได้เขียนไว้
        </p>
      </section>

      <section className="card" id="sec-commands">
        <h2 className="section-title" style={{ marginTop: 0 }}>คำสั่งที่ใช้คุมโฮมุน</h2>
        <ul className="homun__unknown">
          <li><strong>เปิดหน้าต่างข้อมูล</strong> ตั้งปุ่มลัดได้ในเมนูคีย์ ชื่อในเกมคือ &quot;ข้อมูล Homunculus ON/OFF&quot;</li>
          <li><strong>สั่งให้หยุดตาม</strong> ปุ่มลัดชื่อ &quot;คำสั่ง Homunculus Standby&quot; ให้มันอยู่กับที่แทนวิ่งตาม</li>
          <li><strong>AI ที่เขียนเอง</strong> พิมพ์ <code>/hoai</code> ในช่องแชตเพื่อสลับไปใช้ AI ของผู้เล่น</li>
        </ul>
        <p className="guildp__src">ที่มา: ตารางข้อความในไคลเอนต์ Zero อ่านเมื่อ {thaiDate(homun._meta.read)}</p>
      </section>

      <section className="card card--yellow" id="sec-unknown">
        <h2 className="section-title" style={{ marginTop: 0 }}>ที่ยังตอบไม่ได้</h2>
        <ul className="homun__unknown">
          <li><strong>ขึ้นเลเวลแล้วสเตตัสเพิ่มเท่าไร</strong> และได้ EXP กี่เปอร์เซ็นต์ของเจ้าของ ตัวเลขที่มีเป็นของ RO รุ่นเดิมและไม่ตรงกันเองระหว่างรุ่น</li>
          <li><strong>เลเวลสูงสุดของโฮมุน</strong> มีแหล่งเดียวที่พูดถึง ยังไม่พอจะเขียน</li>
          <li><strong>ตายแล้วเสียความสนิทไหม</strong> ยังไม่มีแหล่งที่เชื่อถือได้พอจะเขียนทั้งสองทาง</li>
          <li><strong>Zero แก้อะไรจาก RO เดิมบ้าง</strong> ยังไม่เจอประกาศฝั่ง Zero ที่พูดถึงระบบโฮมุนเลยสักฉบับ</li>
        </ul>
        <p className="homun__note">
          ถ้าใครมีภาพหน้าต่างโฮมุนที่เห็นค่าความสนิทหรือความหิว หรือลองป้อนอาหารแล้วรู้ผลจริง ส่งมาได้ จะใส่ให้พร้อมบอกที่มา
        </p>
      </section>
    </main>
  );
}
