// app/guides/elemental-converter/page.tsx
//
// Sage's Elemental Converters (owner, 9 Oct 2026). Rewritten the same day from
// DOUGH's Zero clip (https://www.youtube.com/watch?v=7BC1BCsxteE): the skill
// is grey after the job change until Mishuna's quest is done, and a converter
// is one Empty Scroll + ONE elemental stone, 100% success. The quest's four
// drops are what rAthena listed as the recipe. Recipes via lib/crafting
// (ZERO_RECIPE_FIXES); droppers ranked by lib/drop-rank as on /drop-finder;
// element multipliers from lib/element-table.

import Link from 'next/link';
import './page.css';
import PageHeader from '@/components/PageHeader';
import JsonLd from '@/components/JsonLd';
import ConverterCalc, { type ConverterCalcRow } from '@/components/ConverterCalc';
import MaterialRow from '@/components/craft-calc/MaterialRow';
import '@/components/craft-calc/craft-calc.css';
import { materialSources } from '@/lib/material-sources';
import { breadcrumbJsonLd } from '@/lib/jsonld';
import { CREATE_ELEMENTAL_CONVERTER, recipesOfSkill } from '@/lib/crafting';
import { supabaseBrowser } from '@/lib/supabase';
import { rankDrops } from '@/lib/drop-rank';
import { mapRelease } from '@/lib/map-availability';
import { ELEMENTS, elementModifier, type Element } from '@/lib/element-table';
import { ELEMENT_TH } from '@/lib/monster-th';

export const revalidate = 86400;

export const metadata = {
  title: 'ใบธาตุ Sage (Elemental Converter) ทำจากอะไร — Ragnarok Zero',
  description:
    'วิธีทำใบธาตุ Elemental Converter ของ Sage ใน Ragnarok Zero Global ครบ 4 ธาตุ ไฟ น้ำ ดิน ลม ใช้ Empty Scroll กับวัตถุดิบอะไร ฟามจากมอนตัวไหน แมพไหน และใบธาตุไหนใช้ตีมอนธาตุอะไร พร้อมตัวคำนวณจำนวนวัตถุดิบ',
};


const EMPTY_SCROLL = 7433;

const SET: { product: number; el: Element; color: string }[] = [
  { product: 12114, el: 'Fire', color: '#ff6b3d' },
  { product: 12115, el: 'Water', color: '#3d9bff' },
  { product: 12116, el: 'Earth', color: '#d9a640' },
  { product: 12117, el: 'Wind', color: '#4dffb8' },
];

// The ten elements a monster can carry, in the order /guides/elements uses.
const TARGETS: Element[] = [...ELEMENTS];

interface Dropper {
  id: number;
  name: string;
  level: number | null;
  image: string | null;
  rate: number | null;
  map: { code: string; name: string; amount: number | null } | null;
  killsPerItem: number | null;
}

async function droppersOf(itemId: number): Promise<Dropper[]> {
  const db = supabaseBrowser();
  const { data: drops, error } = await db
    .from('monster_drops')
    .select('monster_id, rate, monsters(name_en, level, image_url)')
    .eq('item_id', itemId)
    .order('rate', { ascending: false })
    .limit(40);
  if (error || !drops?.length) {
    if (error) console.error('converter droppers failed', error);
    return [];
  }
  const ids = [...new Set(drops.map((d: any) => d.monster_id as number))];
  const { data: spawns } = await db.from('monster_spawns').select('monster_id, map_code, map_display_name, amount').in('monster_id', ids);
  const base = drops.map((d: any) => ({
    monster_id: d.monster_id as number,
    name: d.monsters?.name_en as string,
    level: (d.monsters?.level ?? null) as number | null,
    image: (d.monsters?.image_url ?? null) as string | null,
    rate: d.rate as number | null,
  }));
  return rankDrops(
    base,
    (spawns ?? []).map((s: any) => ({ monster_id: s.monster_id, map_code: s.map_code, map_name: s.map_display_name, amount: s.amount })),
    (code) => Boolean(mapRelease(code)),
  )
    .filter((r) => !r.closed)
    .map((r) => ({
      id: r.row.monster_id,
      name: r.row.name,
      level: r.row.level,
      image: r.row.image,
      rate: r.row.rate,
      map: r.best,
      killsPerItem: r.killsPerItem,
    }));
}

// Mishuna's quest for the skill (quest 8184; amounts from the quest text in
// data/quest-th, the same four drops DOUGH farms in the clip).
const QUEST_NPC = { name: 'Mishuna', map: 'tu_ac01_e', mapName: 'Academy 1F', x: 137, y: 69 };
const QUEST_ITEMS = [
  { id: 904, name: 'Scorpion Tail', amount: 10 },
  { id: 947, name: 'Horn', amount: 7 },
  { id: 1013, name: 'Rainbow Shell', amount: 12 },
  { id: 946, name: "Snail's Shell", amount: 10 },
];

const pct = (n: number | null) => (n === null ? '?' : `${Number.isInteger(n) ? n : n.toFixed(1)}%`);

export default async function ElementalConverterPage() {
  const recipes = recipesOfSkill(CREATE_ELEMENTAL_CONVERTER);
  const rows = await Promise.all(
    SET.map(async (s) => {
      const recipe = recipes.find((r) => r.product.id === s.product) ?? null;
      const mat = recipe?.materials.find((m) => m.id !== EMPTY_SCROLL) ?? null;
      const scroll = recipe?.materials.find((m) => m.id === EMPTY_SCROLL) ?? null;
      const droppers = mat ? await droppersOf(mat.id) : [];
      const hits = TARGETS.map((t) => ({ t, v: elementModifier(s.el, t, 1) }));
      return {
        ...s,
        th: ELEMENT_TH[s.el],
        recipe,
        mat,
        scroll,
        droppers,
        strong: hits.filter((h) => h.v > 100).sort((a, b) => b.v - a.v),
        weak: hits.filter((h) => h.v < 100).sort((a, b) => a.v - b.v),
      };
    }),
  );

  const questSources = await materialSources(QUEST_ITEMS.map((q) => q.id));

  const calcRows: ConverterCalcRow[] = rows
    .filter((r) => r.mat)
    .map((r) => ({
      key: r.el,
      th: r.th,
      color: r.color,
      productId: r.product,
      matId: r.mat!.id,
      matName: r.mat!.name,
      matAmount: r.mat!.amount,
      rate: r.droppers[0]?.rate ?? null,
      monster: r.droppers[0]?.name ?? null,
    }));

  // Every monster element, and the converter that hits it hardest.
  const byTarget = TARGETS.map((t) => {
    const best = rows
      .map((r) => ({ r, v: elementModifier(r.el, t, 1) }))
      .sort((a, b) => b.v - a.v)[0];
    return { t, best: best && best.v > 100 ? best : null };
  });

  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'หน้าแรก', path: '/' },
          { name: 'ไกด์', path: '/guides' },
          { name: 'ใบธาตุ Sage', path: '/guides/elemental-converter' },
        ])}
      />
      <p className="arckicker">SAGE · ELEMENTAL CONVERTER</p>
      <PageHeader
        title="ใบธาตุ Sage ทำจากอะไร"
        lead={
          <>
            Sage ต้อง<strong>ทำเควสต์ก่อน</strong> เปลี่ยนอาชีพแล้วสกิลยังเป็นสีเทา ·
            ทำ 1 ใบใช้ <strong>Empty Scroll 1 + หินธาตุนั้น 1 ก้อน</strong> ติด 100% ·
            ใช้แล้วอาวุธเป็นธาตุนั้น <strong>20 นาที</strong>
          </>
        }
        source={
          <>
            วิธีปลดสกิลและสูตรจาก <a href="https://www.youtube.com/watch?v=7BC1BCsxteE" target="_blank" rel="noopener noreferrer">คลิปของ DOUGH</a> ·
            จำนวนของในเควสต์จากข้อความเควสต์ในเกม · มอนและแมพจากฐานข้อมูลเว็บนี้ เฉพาะแมพที่เปิดแล้ว
          </>
        }
      />

      <nav className="gtiles" aria-label="ไปที่ใบธาตุ">
        {rows.map((r) => (
          <a key={r.el} className="gtile cvjump" href={`#${r.el.toLowerCase()}`} style={{ '--el': r.color } as React.CSSProperties}>
            <span className="gtile__k">{r.el.toUpperCase()}</span>
            <span className="gtile__v">
              <img src={`/images/items/${r.product}.gif`} alt="" width={24} height={24} />
              ใบ{r.th}
            </span>
            <span className="gtile__s">{r.mat ? `${r.mat.name} ×${r.mat.amount}` : 'ไม่รู้สูตร'}</span>
          </a>
        ))}
        <a className="gtile" href="#unlock">
          <span className="gtile__k">STEP 1</span>
          <span className="gtile__v">ปลดสกิล</span>
          <span className="gtile__s">เควสต์ Mishuna · ของ 4 อย่าง</span>
        </a>
        <a className="gtile" href="#calc">
          <span className="gtile__k">CALC</span>
          <span className="gtile__v">ต้องฟามเท่าไร</span>
          <span className="gtile__s">ใส่จำนวนใบ ได้ยอดวัตถุดิบ</span>
        </a>
      </nav>

      <section id="unlock" className="card card--cyan" style={{ marginTop: 18, scrollMarginTop: 90 }}>
        <h2 className="section-title">ปลดสกิลก่อน: เควสต์ของ Mishuna</h2>
        <ol className="gsteps">
          <li>
            เปลี่ยนเป็น Sage แล้วสกิล Create Elemental Converter จะขึ้นในหน้าต่างสกิลแต่<strong>เป็นสีเทา ยังใช้ไม่ได้</strong>
          </li>
          <li>
            ไปหา <strong>{QUEST_NPC.name}</strong> ที่ {QUEST_NPC.mapName} ห้องที่สองนับจากล่างฝั่งขวา (ห้องเดียวกับที่เปลี่ยนเป็น Sage){' '}
            <code className="mono navicmd">/navi {QUEST_NPC.map} {QUEST_NPC.x}/{QUEST_NPC.y}</code> · เลือกเรียน Create Elemental Converter
          </li>
          <li>ฟามของ 4 อย่างด้านล่างให้ครบ</li>
          <li>
            ซื้อ <strong>Empty Scroll 4 ใบ</strong> จาก NPC ที่ยืนข้าง {QUEST_NPC.name} แล้วกลับไปส่งของ ได้สกิลทันที
          </li>
        </ol>
        <h3 className="section-title" style={{ fontSize: 14, marginTop: 14 }}>ของที่เควสต์ขอ</h3>
        <ul className="mrows">
          {QUEST_ITEMS.map((q) => (
            <MaterialRow key={q.id} id={q.id} name={q.name} icon={`/images/items/${q.id}.gif`} category="Other" amount={q.amount} source={questSources[q.id]} />
          ))}
        </ul>
        <p className="muted" style={{ marginBottom: 0 }}>
          ตอนนี้เกมยังไม่มีเมือง Juno ถ้าเปิด Juno ทีหลัง NPC เควสต์นี้อาจย้ายไปที่นั่น
        </p>
      </section>

      <div className="cvgrid">
        {rows.map((r) => (
          <section key={r.el} id={r.el.toLowerCase()} className="cvcard" style={{ '--el': r.color } as React.CSSProperties}>
            <header className="cvcard__head">
              <Link href={`/database/items/${r.product}`} className="cvcard__icon">
                <img src={`/images/items/${r.product}.gif`} alt="" width={40} height={40} />
              </Link>
              <div>
                <h2 className="cvcard__title">ใบธาตุ{r.th}</h2>
                <p className="cvcard__en">Elemental Converter ({r.el})</p>
              </div>
            </header>

            <div className="cvcard__recipe" aria-label="สูตร">
              {r.scroll && (
                <Link className="cvmat" href={`/database/items/${r.scroll.id}`}>
                  <img src={`/images/items/${r.scroll.id}.gif`} alt="" width={24} height={24} />
                  <span>{r.scroll.name}</span>
                  <b>×{r.scroll.amount}</b>
                </Link>
              )}
              <span className="cvplus">+</span>
              {r.mat ? (
                <Link className="cvmat cvmat--el" href={`/database/items/${r.mat.id}`}>
                  <img src={`/images/items/${r.mat.id}.gif`} alt="" width={24} height={24} />
                  <span>{r.mat.name}</span>
                  <b>×{r.mat.amount}</b>
                </Link>
              ) : (
                <span className="muted">ไม่รู้</span>
              )}
            </div>

            <h3 className="cvcard__h">ฟาม {r.mat?.name ?? 'วัตถุดิบ'} ที่ไหน</h3>
            {r.droppers.length ? (
              <ul className="cvdrop">
                {r.droppers.slice(0, 3).map((d, i) => (
                  <li key={d.id} className={i === 0 ? 'is-top' : ''}>
                    <Link href={`/database/monsters/${d.id}`} className="cvdrop__mon">
                      {d.image ? <img src={d.image} alt="" width={36} height={36} loading="lazy" /> : <span className="cvdrop__noimg" />}
                      <span>
                        <strong>{d.name}</strong>
                        <small>Lv {d.level ?? '?'} · ดรอป {pct(d.rate)}{d.killsPerItem ? ` · ราว ${d.killsPerItem} ตัว/ชิ้น` : ''}</small>
                      </span>
                    </Link>
                    {d.map && (
                      <Link href={`/database/maps/${encodeURIComponent(d.map.code)}`} className="cvdrop__map">
                        {d.map.name}
                        <small>
                          {d.map.code}
                          {d.map.amount ? ` · ${d.map.amount} ตัว` : ''}
                        </small>
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">ยังไม่รู้ว่ามอนตัวไหนดรอปในแมพที่เปิดแล้ว</p>
            )}

            <h3 className="cvcard__h">ใช้ตีมอนธาตุอะไร</h3>
            <div className="cvhits">
              {r.strong.map((h) => (
                <Link key={h.t} className="cvhit is-up" href={`/database/monsters?element=${h.t}`}>
                  {ELEMENT_TH[h.t]} <b>{h.v}%</b>
                </Link>
              ))}
            </div>
            {r.weak.length > 0 && (
              <div className="cvhits">
                <span className="cvhits__label">อย่าใช้กับ</span>
                {r.weak.map((h) => (
                  <Link key={h.t} className="cvhit is-down" href={`/database/monsters?element=${h.t}`}>
                    {ELEMENT_TH[h.t]} <b>{h.v}%</b>
                  </Link>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>

      <section id="calc" className="card card--yellow" style={{ marginTop: 20 }}>
        <h2 className="section-title">ต้องฟามวัตถุดิบเท่าไร</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          ใส่จำนวนใบที่อยากทำ · จำนวนตัวที่ต้องตีคิดจากมอนอันดับ 1 ของแต่ละธาตุ เป็นค่าเฉลี่ย
        </p>
        <ConverterCalc rows={calcRows} />
      </section>

      <section className="card" style={{ marginTop: 20 }}>
        <h2 className="section-title">เจอมอนธาตุนี้ ใช้ใบไหน (มอนธาตุระดับ 1)</h2>
        <div className="cvpick">
          {byTarget.map(({ t, best }) => (
            <div key={t} className="cvpick__row" style={best ? ({ '--el': best.r.color } as React.CSSProperties) : undefined}>
              <span className="cvpick__def">มอน{ELEMENT_TH[t]}</span>
              {best ? (
                <span className="cvpick__best">
                  <img src={`/images/items/${best.r.product}.gif`} alt="" width={20} height={20} />
                  ใบ{best.r.th} <b>{best.v}%</b>
                </span>
              ) : (
                <span className="muted">ใบธาตุทั้ง 4 ไม่ช่วย</span>
              )}
            </div>
          ))}
        </div>
        <p className="muted" style={{ marginBottom: 0 }}>
          มอนธาตุระดับสูงตัวเลขเปลี่ยน ดูเต็มที่ <Link href="/guides/elements">ตารางธาตุ</Link> · คิดดาเมจจริงของบิลด์ที่{' '}
          <Link href="/tools/build">จำลองบิลด์</Link>
        </p>
      </section>

    </main>
  );
}
