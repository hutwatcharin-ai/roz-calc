// app/guides/elemental-converter/page.tsx
//
// Sage's Elemental Converters (owner, 9 Oct 2026). The skill comes with the
// job change itself, so the page skips how to learn it and goes straight to
// what each converter costs, who drops the material on an open map, and which
// monsters each element is for. Recipes from data/crafting-recipes.json
// (rAthena and prontera agree); droppers ranked by lib/drop-rank as on
// /drop-finder; element multipliers from lib/element-table.

import Link from 'next/link';
import './page.css';
import PageHeader from '@/components/PageHeader';
import Caveat from '@/components/Caveat';
import JsonLd from '@/components/JsonLd';
import ConverterCalc, { type ConverterCalcRow } from '@/components/ConverterCalc';
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

  const calcRows: ConverterCalcRow[] = rows
    .filter((r) => r.mat)
    .map((r) => ({
      key: r.el,
      th: r.th,
      color: r.color,
      productId: r.product,
      matId: r.mat!.id,
      matName: r.mat!.name,
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
            Sage ได้สกิล <strong>Create Elemental Converter</strong> ทันทีที่เปลี่ยนอาชีพ ·
            ทำ 1 ใบใช้ <strong>Empty Scroll 1 + วัตถุดิบธาตุนั้น 3 ชิ้น</strong> ·
            ใช้แล้วอาวุธเป็นธาตุนั้น <strong>20 นาที</strong>
          </>
        }
        source="สูตรจาก rAthena กับ roz.prontera.info ตรงกัน · มอนและแมพจากฐานข้อมูลเว็บนี้ เฉพาะแมพที่เปิดแล้ว"
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
        <a className="gtile" href="#calc">
          <span className="gtile__k">CALC</span>
          <span className="gtile__v">ต้องฟามเท่าไร</span>
          <span className="gtile__s">ใส่จำนวนใบ ได้ยอดวัตถุดิบ</span>
        </a>
      </nav>

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

      <Caveat label="ยังไม่รู้อะไรบ้าง">
        <ul>
          <li>
            <strong>Empty Scroll ซื้อจากไหน:</strong> ยังไม่รู้ ฐานข้อมูลเว็บนี้ไม่มีมอนตัวไหนดรอป และยังไม่เจอร้าน NPC ที่ขายในเกมนี้ ·
            ราคาซื้อที่ตั้งไว้ในไอเทมคือ 4,000z
          </li>
          <li>
            <strong>โอกาสทำสำเร็จ:</strong> ยังไม่รู้ ข้อความสกิลในเกมไม่บอก
          </li>
          <li>ใบธาตุเปลี่ยนธาตุอาวุธอย่างเดียว ใช้กับเวทไม่ได้</li>
        </ul>
      </Caveat>
    </main>
  );
}
