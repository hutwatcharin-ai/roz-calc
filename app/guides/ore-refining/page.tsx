// app/guides/ore-refining/page.tsx
//
// Redesigned 8 Oct 2026 (owner: every guide in the newer arcade look, and
// fill in what is missing). The recipes split by the Blacksmith skill that
// makes them, each with that skill's success rate per level from the
// client's skill text (data/skill-trees.json), and each product with how
// many other recipes on the site use it.

import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import Caveat from '@/components/Caveat';
import ItemIcon from '@/components/ItemIcon';
import JsonLd from '@/components/JsonLd';
import { breadcrumbJsonLd } from '@/lib/jsonld';
import { itemHref } from '@/lib/item-href';
import { recipesOfKind, recipesUsing, type CraftMaterial } from '@/lib/crafting';
import CraftCalc, { RecipeQty } from '@/components/craft-calc/CraftCalc';
import { craftCalcConfig, oreSkillRates, skillRatesOf } from '@/lib/craft-calc-config';

export const revalidate = 86400;

export const metadata = {
  title: 'หลอมแร่และหินธาตุ Ragnarok Zero — Iron, Steel, หินธาตุ',
  description:
    'สูตรหลอมแร่ของ Blacksmith ใน Ragnarok Zero Global — Iron Ore เป็น Iron, Iron เป็น Steel, หินธาตุทั้งสี่และ Star Crumb ทำจากอะไร โอกาสสำเร็จของ Iron Tempering, Steel Tempering และ Enchanted Stone Craft ทุกเลเวล',
};

const SKILLS = [
  { id: 94, slug: 'iron-tempering', name: 'Iron Tempering', what: 'แร่เหล็กดิบเป็น Iron' },
  { id: 95, slug: 'steel-tempering', name: 'Steel Tempering', what: 'Iron กับ Coal เป็น Steel' },
  { id: 96, slug: 'enchanted-stone-craft', name: 'Enchanted Stone Craft', what: 'ของดรอปจากมอนธาตุเป็นหินธาตุ และ Star Dust เป็น Star Crumb' },
];

function Chip({ m }: { m: CraftMaterial }) {
  return (
    <Link className="oflow__item" href={itemHref(m.id, m.category ?? null)}>
      <ItemIcon iconUrl={m.icon ?? null} category={m.category ?? null} size={28} />
      <span>{m.name}</span>
      {m.amount > 1 && <b className="mono">×{m.amount}</b>}
    </Link>
  );
}

export default async function OreRefiningPage() {
  const all = recipesOfKind('ore');
  const confirmed = all.filter((r) => r.confidence === 'both');
  const unconfirmed = all.filter((r) => r.confidence !== 'both');
  // Steel takes Iron: picking Steel walks back to Iron Ore unless the reader
  // says they already have the Iron.
  const calc = await craftCalcConfig({
    id: 'ore',
    recipes: all,
    chain: confirmed,
    expandLabel: 'หลอม Iron ที่ใช้ทำ Steel เองด้วย',
    expandDefault: true,
    skillRates: oreSkillRates(),
    unknownRateNote: 'สูตรที่ไม่ได้ใช้สกิล Blacksmith ยังไม่รู้โอกาสสำเร็จ คิดแบบทำติดทุกครั้ง',
  });

  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'หน้าแรก', path: '/' },
          { name: 'ไกด์', path: '/guides' },
          { name: 'หลอมแร่', path: '/guides/ore-refining' },
        ])}
      />
      <CraftCalc config={calc}>
      <PageHeader
        title="หลอมแร่และหินธาตุ"
        lead={
          <>
            {confirmed.length} สูตรพื้นฐานที่งานตีอาวุธของ Blacksmith ตั้งอยู่บนนี้ — แร่ดิบเป็นแร่ใช้งาน และของดรอปจากมอนธาตุเป็นหินธาตุ
            · เป็นสกิลติดตัว (passive) อัปแล้วกดใช้ผ่านหน้าต่างหลอมได้เลย · กด <strong>+ คำนวณวัตถุดิบ</strong> ที่ของที่อยากได้ แล้วเว็บไล่ย้อนให้ว่าต้องหาแร่ดิบเท่าไร เผื่อหลอมไม่ติดตามเลเวลสกิล
          </>
        }
      />

      {SKILLS.map((s) => {
        const rows = confirmed.filter((r) => r.skillId === s.id);
        const rates = skillRatesOf(s.slug);
        if (!rows.length) return null;
        return (
          <section key={s.id} className="card oskill" style={{ marginTop: 16 }}>
            <h2 className="section-title">{s.name}</h2>
            <p className="muted" style={{ marginTop: -4 }}>{s.what}</p>

            {rates.length > 0 && (
              <div className="orates" aria-label={`โอกาสสำเร็จของ ${s.name} ตามเลเวลสกิล`}>
                {rates.map((v, i) => (
                  <div key={i} className="orates__bar">
                    <span className="orates__fill" style={{ height: `${v}%` }} />
                    <b className="mono">{v}%</b>
                    <small>Lv {i + 1}</small>
                  </div>
                ))}
              </div>
            )}

            <div className="oflows">
              {rows.map((r) => {
                const uses = recipesUsing(r.product.id).length;
                return (
                  <div key={r.id} className="oflow">
                    <span className="oflow__in">
                      {r.materials.filter((m) => !m.held).map((m) => (
                        <Chip key={m.id} m={m} />
                      ))}
                    </span>
                    <span className="oflow__arrow" aria-hidden="true">▶</span>
                    <span className="oflow__out">
                      <Chip m={r.product} />
                      {uses > 0 && <small>ใช้ต่อใน {uses} สูตร</small>}
                      <RecipeQty id={r.id} name={r.product.name} />
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      {unconfirmed.length > 0 && (
        <section className="card" style={{ marginTop: 16, borderStyle: 'dashed' }}>
          <h2 className="section-title">ยังไม่ยืนยันกับ Zero</h2>
          <p className="muted" style={{ marginTop: -4 }}>มีในแหล่งเดียว อาจเป็นสูตรของ RO เวอร์ชันอื่น</p>
          <div className="oflows">
            {unconfirmed.map((r) => (
              <div key={r.id} className="oflow">
                <span className="oflow__in">{r.materials.map((m) => <Chip key={m.id} m={m} />)}</span>
                <span className="oflow__arrow" aria-hidden="true">▶</span>
                <span className="oflow__out"><Chip m={r.product} /><RecipeQty id={r.id} name={r.product.name} /></span>
              </div>
            ))}
          </div>
        </section>
      )}

      <Caveat label="ที่มาของสูตร">
        สูตรทานกัน 2 แหล่ง ตารางการผลิตฝั่งเซิร์ฟเวอร์ของ{' '}
        <a href="https://github.com/rathena/rathena" rel="noopener nofollow" target="_blank">rAthena</a> กับฐานข้อมูล Zero ของ prontera.info ·
        โอกาสสำเร็จต่อเลเวลมาจากคำอธิบายสกิลในไคลเอนต์ ยังไม่ได้ทดสอบในเกมว่า DEX LUK หรือ Job level บวกเพิ่มเท่าไร
      </Caveat>

      <p className="muted" style={{ marginTop: 16 }}>
        หินธาตุเอาไปทำอาวุธธาตุที่ <Link href="/guides/forging">ตีอาวุธ</Link> · แร่ที่หลอมแล้วเอาไปตีบวก คิดต้นทุนได้ที่{' '}
        <Link href="/tools/refine">ตีบวก</Link> · ของดรอปจากมอนตัวไหน ค้นที่ <Link href="/drop-finder">ค้นของดรอป</Link>
      </p>
      </CraftCalc>
    </main>
  );
}
