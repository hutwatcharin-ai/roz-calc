// โฮมุนคูลัส — what the game itself says, and what nobody can show us yet.
//
// Written 24 Sep 2026. A deep-research round for this page returned values
// from rAthena almost exclusively: an emulator built for another ruleset,
// which cannot be quoted as Zero. So every line here comes from the Zero
// client instead, collected by scripts/build-homunculus.py, plus two facts
// the owner checked in game.
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
    'วิธีสร้างโฮมุนคูลัสใน Ragnarok Zero Global สำหรับ Alchemist ตั้งแต่สายสกิล Bioethics ถึง Call Homunculus วิธีทำ Embryo และสกิลของ Lif Amistr Filir Vanilmirth ครบทุกตัวพร้อมค่าทุกเลเวล ยกมาจากข้อความในเกม',
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
// RO, so the section that uses it carries a warning of its own.
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
  lif: 'สายช่วยเจ้าของ สกิลของมันฟื้น HP ให้ผู้เล่นและเพิ่มความเร็วเคลื่อนที่ให้ทั้งคู่',
  amistr: 'สายรับ สกิลของมันคือสลับที่กับเจ้าของเพื่อดึงมอน เพิ่ม DEF และเพิ่ม MaxHP ถาวร',
  filir: 'สายตี สกิลของมันคือโจมตีต่อเนื่อง เพิ่ม ASPD และเพิ่ม Flee',
  vanilmirth: 'สายสุ่ม สกิลของมันร่าย Bolt และ Heal แบบสุ่มเป้า และระเบิดตัวเองได้',
};

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

function SkillBlock({ skill }: { skill: Skill }) {
  const facts = [
    skill.maxLevel ? `สูงสุด Lv.${skill.maxLevel}` : null,
    skill.kind,
    skill.role,
    skill.requires ? `ต้องมี ${skill.requires}` : null,
  ].filter(Boolean);
  return (
    <div className="homun__skill">
      <h3 className="homun__skillname">{skill.name}</h3>
      {facts.length > 0 && <p className="homun__facts">{facts.join(' · ')}</p>}
      {skill.detail && <p className="homun__detail">{skill.detail}</p>}
      <Levels skill={skill} />
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
  const text = (id: number) => ITEMS.find((i) => i.id === id)?.text ?? '';
  const name = (id: number) => ITEMS.find((i) => i.id === id)?.name ?? (meta.get(id)?.name_en as string) ?? `#${id}`;

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
        title="โฮมุนคูลัส — สร้างยังไง และแต่ละตัวทำอะไรได้"
        lead="เพื่อนร่วมทางของ Alchemist ที่ออกมาสู้ให้เอง หน้านี้รวมเฉพาะสิ่งที่เกมเขียนไว้เอง ตั้งแต่สายสกิลที่ต้องเรียน วิธีทำ Embryo ไปจนถึงสกิลของโฮมุนทั้งสี่ตัวครบทุกเลเวล"
      />

      <section className="card card--cyan" style={{ marginTop: 14 }}>
        <h2 className="section-title" style={{ marginTop: 0 }}>เริ่มยังไง</h2>
        <ol className="homun__steps">
          <li>เปลี่ยนอาชีพเป็น <Link href="/guides/job-change">Alchemist</Link> ก่อน สกิลทั้งหมดในหน้านี้เป็นของอาชีพนี้เท่านั้น</li>
          <li>
            เรียนตามสาย <strong>Bioethics</strong> แล้วต่อด้วย <strong>Rest</strong> แล้วจึง <strong>Call Homunculus</strong>{' '}
            สามตัวนี้ใช้สกิลพอยต์ตัวละ 1 แต้ม
          </li>
          <li>
            ทำ <ItemLink id={EMBRYO} /> ด้วยสกิล <strong>Pharmacy</strong> (Prepare Potion) ดูขั้นตอนเต็มที่{' '}
            <Link href="/guides/potion-crafting">หน้าทำยา</Link>
          </li>
          <li>กด Call Homunculus แล้วโฮมุนจะออกมา ได้ตัวไหนเป็นการสุ่ม เลือกเองไม่ได้</li>
        </ol>
        <p className="homun__note">
          <strong>ไม่มีเควสต์</strong> ข้อความในเกมที่สกิล Bioethics เขียนว่า &quot;เงื่อนไข : สำเร็จเควสต์&quot; เป็นข้อความเก่าที่เซิร์ฟนี้ไม่ได้ใช้
          เจ้าของเว็บตรวจในเกมเมื่อ 24 ก.ย. 2026 แล้วว่าเรียนและสร้างได้เลย ไกด์ที่ลอกมาจาก RO เดิมมักเขียนว่าต้องทำเควสต์ก่อน
        </p>
      </section>

      <section className="card" style={{ marginTop: 14 }}>
        <h2 className="section-title" style={{ marginTop: 0 }}>ของที่ใช้ทำ Embryo หนึ่งตัว</h2>
        <ul className="homun__mats">
          {MATERIALS.map((id) => (
            <li key={id}>
              <ItemLink id={id} />
              <span className="homun__price">{price(id) ? `${price(id).toLocaleString('th-TH')}z` : 'ไม่ทราบราคา'}</span>
            </li>
          ))}
        </ul>
        <p className="homun__note">
          บวกอีกสองอย่างที่ไม่ใช่วัตถุดิบ: <ItemLink id={GUIDE_BOOK} /> ต้องพกไว้เฉย ๆ ไม่ถูกใช้หมด ส่วน{' '}
          <ItemLink id={MEDICINE_BOWL} /> ถูกใช้ไป 1 ชิ้นทุกครั้งที่กดทำ
        </p>
        {materialCost > 0 && (
          <p className="homun__note">
            เฉพาะวัตถุดิบสามอย่างคิดตามราคาร้านคือ <strong>{materialCost.toLocaleString('th-TH')}z</strong> ต่อการลองหนึ่งครั้ง
            ยังไม่รวม Medicine Bowl และยังไม่รวมโอกาสทำพลาด
          </p>
        )}
        <p className="guildp__src">
          ที่มา: สูตรมาจากตารางสูตรผสมใน data/crafting-recipes.json ซึ่งตรงกันสองแหล่ง ส่วนกลไกว่าทำด้วยสกิล Pharmacy
          เจ้าของเว็บยืนยันในเกม 24 ก.ย. 2026 · ราคาอ่านสดจากฐานข้อมูลของเว็บนี้
        </p>
      </section>

      <section className="card" style={{ marginTop: 14 }}>
        <h2 className="section-title" style={{ marginTop: 0 }}>สกิลของ Alchemist</h2>
        <p className="muted" style={{ marginTop: 2 }}>
          สกิลฝั่งเจ้าของ ใช้เรียก พัก รักษา และชุบชีวิตโฮมุน
        </p>
        <div className="homun__skills">
          {ALCHEMIST.map((skill) => (
            <SkillBlock key={skill.code} skill={skill} />
          ))}
        </div>
        <p className="homun__note">
          ไคลเอนต์ไทยเรียกสกิลพักว่า <strong>Rest</strong> แต่ฐานข้อมูลของเว็บนี้กับไกด์ภาษาอังกฤษเรียก{' '}
          <Link href="/database/skills?q=Vaporize">Vaporize</Link> เป็นสกิลเดียวกัน
        </p>
      </section>

      <AdSlot slot="inline" />

      <section style={{ marginTop: 18 }}>
        <h2 className="section-title">โฮมุนทั้งสี่ตัว</h2>
        <p className="muted" style={{ marginTop: 2, maxWidth: '70ch' }}>
          ตอนกด Call Homunculus เกมสุ่มให้หนึ่งตัว เลือกไม่ได้ แต่ละตัวเรียนสกิลคนละชุด รวม {SKILL_COUNT} สกิล
          คำว่าสายรับ สายตี สายช่วย เป็นการอ่านจากชุดสกิลของมันเอง ไม่ใช่ข้อมูลที่เกมเขียนไว้
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
                <SkillBlock key={skill.code} skill={skill} />
              ))}
            </div>
          </section>
        ))}
        <p className="guildp__src">
          ที่มา: ข้อความสกิลทุกบรรทัดยกมาจากไคลเอนต์ Ragnarok Zero Global อ่านเมื่อ {homun._meta.read} ตัดเฉพาะรหัสสีออก
        </p>
      </section>

      <section className="card" style={{ marginTop: 18 }}>
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
          ในหกอย่างนี้ Homunculus Tablet เป็นชิ้นเดียวที่เกมบอกตรง ๆ ว่าเกี่ยวกับความสนิท ส่วนจะเพิ่มให้เท่าไรต่อครั้ง เกมไม่ได้เขียนไว้
        </p>
      </section>

      <section style={{ marginTop: 18 }}>
        <h2 className="section-title">อาหาร ความสนิท และร่างที่สอง</h2>
        <div className="homun__warn">
          <p>
            <strong>อ่านตรงนี้ก่อน</strong> ทุกอย่างในหัวข้อนี้มาจากสองแหล่งที่เขียนไว้สำหรับ RO รุ่นเดิม
            ไม่ใช่เอกสารของ Zero และยังไม่มีใครยืนยันในเซิร์ฟนี้ ที่กล้าขึ้นเพราะสองแหล่งนี้เป็นอิสระต่อกันแต่ให้ตัวเลขตรงกัน
            และไอเทมทุกชิ้นที่พูดถึงมีอยู่จริงในไคลเอนต์ Zero แล้ว จุดที่สองแหล่งขัดกันเขียนไว้ให้เห็นด้วย
          </p>
        </div>

        <section className="card" style={{ marginTop: 14 }}>
          <h3 className="homun__h3">ตัวไหนกินอะไร</h3>
          <ul className="homun__mats homun__mats--four">
            {CARE.food.map((row) => (
              <li key={row.key}>
                <span className="homun__who">{row.name}</span>
                <ItemLink id={row.itemId} />
                <span className="homun__price">{price(row.itemId) ? `${price(row.itemId).toLocaleString('th-TH')}z` : 'ไม่ทราบราคา'}</span>
              </li>
            ))}
          </ul>
          <p className="homun__note">
            Zargon Garlet และ Scell เป็นของดรอปทั่วไป กดเข้าไปในหน้าไอเทมจะเห็นว่ามอนตัวไหนดรอปบ้าง
            ส่วน Pet Food ซื้อจากร้านอย่างเดียว ราคาทั้งหมดอ่านสดจากฐานข้อมูลของเว็บนี้
          </p>
        </section>

        <section className="card" style={{ marginTop: 14 }}>
          <h3 className="homun__h3">ป้อนตอนไหนถึงคุ้ม</h3>
          <p className="muted" style={{ marginTop: 2 }}>
            ผลของการให้อาหารขึ้นกับว่าตอนนั้นโฮมุนหิวแค่ไหน ป้อนตอนอิ่มอยู่แล้วคือเสียความสนิทฟรี
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
            <p><strong>จุดที่สองแหล่งขัดกัน: {CARE.conflict.topic}</strong></p>
            <p>rAthena ว่า {CARE.conflict.rathena}</p>
            <p>ไกด์ไทย homunkung ว่า {CARE.conflict.homunkung}</p>
            <p className="muted">หน้านี้ไม่เลือกข้าง ทางปลอดภัยคือป้อนตอนหิวอยู่ในช่วง 11-25 ซึ่งสองแหล่งตรงกันว่าดีที่สุด</p>
          </div>
        </section>

        <section className="card" style={{ marginTop: 14 }}>
          <h3 className="homun__h3">ร่างที่สอง</h3>
          <p className="homun__detail" style={{ marginTop: 6 }}>
            พก <ItemLink id={CARE.evolution.itemId} /> ไว้หนึ่งชิ้น
            {price(CARE.evolution.itemId) ? ` ราคาร้าน ${price(CARE.evolution.itemId).toLocaleString('th-TH')}z` : ''} และ{' '}
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
        </section>

        <section className="card" style={{ marginTop: 14 }}>
          <h3 className="homun__h3">โฮมุนขึ้นเลเวลยังไง</h3>
          <p className="homun__detail" style={{ marginTop: 6 }}>{CARE.exp.how}</p>
          <p className="homun__note"><strong>เงื่อนไขที่คนพลาดบ่อย</strong> {CARE.exp.condition}</p>
        </section>

        <p className="guildp__src">
          ที่มา: {CARE._meta.sources.rathena.label} และ{' '}
          <a href={CARE._meta.sources.homunkung.url} rel="nofollow noopener" target="_blank">
            {CARE._meta.sources.homunkung.label}
          </a>{' '}
          อ่านเมื่อ {CARE._meta.read} ทั้งสองแหล่งเขียนไว้สำหรับ RO รุ่นเดิม ไม่ได้ระบุว่าเป็น Ragnarok Zero
        </p>
      </section>

      <section className="card card--yellow" style={{ marginTop: 14 }}>
        <h2 className="section-title" style={{ marginTop: 0 }}>ที่ยังตอบไม่ได้</h2>
        <ul className="homun__unknown">
          <li><strong>ขึ้นเลเวลแล้วสเตตัสเพิ่มเท่าไร</strong> และโฮมุนได้ EXP กี่เปอร์เซ็นต์ของเจ้าของ ตัวเลขที่มีเป็นของ RO รุ่นเดิมและไม่ตรงกันระหว่างรุ่น จึงยังไม่ขึ้นหน้านี้</li>
          <li><strong>เลเวลสูงสุดของโฮมุน</strong> มีแหล่งเดียวที่พูดถึง ยังไม่พอจะเขียน</li>
          <li><strong>ตายแล้วเสียความสนิทไหม</strong> ยังไม่มีแหล่งที่เชื่อถือได้พอจะเขียนทั้งสองทาง</li>
          <li><strong>Zero แก้อะไรจาก RO เดิมบ้าง</strong> ยังไม่เจอประกาศหรือเอกสารฝั่ง Zero ที่พูดถึงระบบโฮมุนเลยสักฉบับ</li>
        </ul>
        <p className="homun__note">
          ถ้าใครมีภาพหน้าต่างโฮมุนในเกมที่เห็นค่าความสนิทหรือความหิว หรือลองป้อนอาหารแล้วรู้ผลจริง ส่งมาได้ จะใส่ให้พร้อมบอกที่มา
        </p>
      </section>

      <section className="card" style={{ marginTop: 14 }}>
        <h2 className="section-title" style={{ marginTop: 0 }}>คำสั่งที่ใช้คุมโฮมุน</h2>
        <ul className="homun__unknown">
          <li><strong>หน้าต่างข้อมูลโฮมุน</strong> เปิดปิดได้จากปุ่มลัดในเมนูตั้งค่าคีย์ ชื่อในเกมคือ &quot;ข้อมูล Homunculus ON/OFF&quot;</li>
          <li><strong>สั่งให้หยุดตาม</strong> มีปุ่มลัดชื่อ &quot;คำสั่ง Homunculus Standby&quot; ให้โฮมุนอยู่กับที่แทนที่จะวิ่งตาม</li>
          <li><strong>AI แบบกำหนดเอง</strong> พิมพ์ <code>/hoai</code> ในช่องแชตเพื่อสลับระหว่าง AI มาตรฐานกับ AI ที่ผู้เล่นเขียนเอง</li>
        </ul>
        <p className="guildp__src">ที่มา: ตารางข้อความในไคลเอนต์ Ragnarok Zero Global อ่านเมื่อ {homun._meta.read}</p>
      </section>
    </main>
  );
}
