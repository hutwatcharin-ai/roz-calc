// app/guides/costume-craft/page.tsx
//
// Headgear you have an NPC make for you: what to bring, and where to stand.
//
// /database/costumes lists cosmetic headgear and where it drops. This is the
// other half -- the ones nobody drops, that an NPC assembles out of ordinary
// materials. Neither the NPC nor the recipe is anywhere in our data; the
// materials are, so they link.
import Link from 'next/link';
import type { Metadata } from 'next';
import PageHeader from '@/components/PageHeader';
import Caveat from '@/components/Caveat';
import ItemIcon from '@/components/ItemIcon';
import JsonLd from '@/components/JsonLd';
import { breadcrumbJsonLd } from '@/lib/jsonld';
import { itemHref } from '@/lib/item-href';
import { naviCommand, rozglobalGuides } from '@/lib/rozglobal-guides';
import { bonusText, itemEffects } from '@/lib/item-effects';
import NaviCopy from '@/components/NaviCopy';
import RecipeFilter from '@/components/RecipeFilter';

// Which town an NPC's map belongs to, for the filter chips (owner, 8 Oct
// 2026: cards with filters on every guide list).
const TOWNS: [RegExp, string][] = [
  [/^(prontera|prt_)/, 'Prontera'], [/^(geffen|gef_)/, 'Geffen'], [/^(payon|pay_)/, 'Payon'], [/^(morocc|moc_)/, 'Morroc'],
  [/^(alberta|alb_)/, 'Alberta'], [/^(izlude|iz_)/, 'Izlude'], [/^(aldebaran|alde_)/, 'Al De Baran'], [/^(comodo|cmd_)/, 'Comodo'],
  [/^xmas/, 'Lutie'],
];
function townOf(map: string | null): { value: string; label: string } {
  if (!map) return { value: 'tunknown', label: 'ไม่ทราบ' };
  const hit = TOWNS.find(([re]) => re.test(map));
  const label = hit ? hit[1] : map;
  return { value: 't' + label.replace(/\W/g, ''), label };
}

/** The hat's unconditional bonuses, "AGI +1 · MDEF +3". */
function effectLine(id: number): string | null {
  const e = itemEffects(id);
  if (!e) return null;
  const parts = (e.g ?? []).filter((g) => Object.keys(g.c).length === 0).flatMap((g) => g.b).map(bonusText).filter(Boolean);
  return parts.length ? parts.slice(0, 4).join(' · ') : null;
}

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'คราฟต์หมวกแฟชั่น Ragnarok Zero — NPC ทำอะไรได้บ้าง ใช้ของอะไร',
  description:
    'หมวกและหน้ากากแฟชั่นใน Ragnarok Zero Global ที่ให้ NPC ทำให้ได้ บอกครบว่าต้องเอาของอะไรไปกี่ชิ้น NPC อยู่แมพไหน พร้อมพิกัด /navi ก๊อปไปวางในแชตได้เลย',
};

export default function CostumeCraftPage() {
  const { cosmetics } = rozglobalGuides;
  const linkedMaterials = cosmetics.reduce(
    (n, c) => n + c.materials.filter((m) => m.itemId !== null).length,
    0,
  );
  const totalMaterials = cosmetics.reduce((n, c) => n + c.materials.filter((m) => m.item !== 'Zeny').length, 0);
  const townCount = new Map<string, { value: string; label: string; count: number }>();
  for (const c of cosmetics) {
    const t = townOf(c.map);
    const row = townCount.get(t.value) ?? { ...t, count: 0 };
    row.count += 1;
    townCount.set(t.value, row);
  }
  const towns = [...townCount.values()].sort((a, b) => b.count - a.count);
  const withEffect = cosmetics.filter((c) => c.itemId && effectLine(c.itemId)).length;

  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'หน้าแรก', path: '/' },
          { name: 'ไกด์', path: '/guides' },
          { name: 'คราฟต์หมวกแฟชั่น', path: '/guides/costume-craft' },
        ])}
      />
      <PageHeader
        title="คราฟต์หมวกแฟชั่น — เอาของไปให้ NPC ทำ"
        lead={
          <>
            หมวกพวกนี้<strong>ไม่มีมอนตัวไหนดรอป</strong> ต้องเก็บของไปให้ NPC ทำให้ · กดคำสั่ง <code className="mono">/navi</code> ในการ์ดเพื่อก๊อป ·
            อยากได้หมวกที่ดรอปจากมอนดู <Link href="/database/costumes">ฐานข้อมูลคอสตูม</Link>
          </>
        }
      />

      <div className="gtiles">
        <div className="gtile">
          <span className="gtile__k">หมวกที่ทำได้</span>
          <span className="gtile__v">{cosmetics.length}</span>
          <span className="gtile__s">ใน {towns.length} เมือง</span>
        </div>
        <div className="gtile">
          <span className="gtile__k">มีผลกับสเตตัส</span>
          <span className="gtile__v">{withEffect}</span>
          <span className="gtile__s">ใบที่เหลือเป็นของแต่งตัวอย่างเดียว</span>
        </div>
        <div className="gtile">
          <span className="gtile__k">เมืองที่มี NPC มากสุด</span>
          <span className="gtile__v">{towns[0]?.label}</span>
          <span className="gtile__s">{towns[0]?.count} ใบ</span>
        </div>
      </div>

      <section className="card rguide" style={{ marginTop: 16 }}>
        <h2 className="section-title">หมวกทั้งหมด ({cosmetics.length})</h2>
        <RecipeFilter
          group="costume"
          placeholder="ค้นชื่อหมวก หรือของที่ต้องใช้ เช่น Steel"
          facets={[{ label: 'NPC อยู่ที่', options: towns.map((t) => ({ value: t.value, label: t.label, count: t.count })) }]}
        />
        <div className="rcards" data-rgroup="costume">
          {cosmetics.map((entry) => {
            const navi = naviCommand(entry.map, entry.x, entry.y);
            const effect = entry.itemId ? effectLine(entry.itemId) : null;
            const q = [entry.item, effect, ...entry.materials.map((m) => m.item)].filter(Boolean).join(' ').toLowerCase();
            return (
              <article key={entry.item} className="rcard" data-tags={townOf(entry.map).value} data-q={q}>
                <header className="rcard__head">
                  {entry.itemId ? (
                    <Link className="rcard__product" href={itemHref(entry.itemId, null)}>
                      <span className="rcard__icon"><ItemIcon iconUrl={`/images/items/${entry.itemId}.gif`} category="Other" size={32} /></span>
                      <span className="rcard__name">{entry.item}</span>
                    </Link>
                  ) : (
                    <span className="rcard__product"><span className="rcard__name">{entry.item}</span></span>
                  )}
                  <span className="rcard__badge mono">{townOf(entry.map).label}</span>
                </header>
                {effect && <p className="rcard__effect">{effect}</p>}
                <div className="rcard__mats">
                  {entry.materials.map((m, i) =>
                    m.itemId ? (
                      <Link key={`${m.item}-${i}`} className="rcard__mat" href={itemHref(m.itemId, null)}>
                        <ItemIcon iconUrl={`/images/items/${m.itemId}.gif`} category="Other" size={22} />
                        <span>{m.item}</span>
                        {m.amount > 1 && <b className="mono">×{m.amount.toLocaleString('en-US')}</b>}
                      </Link>
                    ) : (
                      <span key={`${m.item}-${i}`} className="rcard__mat">
                        <span>{m.item}</span>
                        {m.amount > 1 && <b className="mono">×{m.amount.toLocaleString('en-US')}</b>}
                      </span>
                    ),
                  )}
                </div>
                <p className="rcard__held">{navi ? <NaviCopy cmd={navi} /> : <span>ไม่ทราบพิกัด NPC</span>}</p>
              </article>
            );
          })}
        </div>
      </section>

      <Caveat label="เชื่อได้แค่ไหน">
        สูตรและพิกัด NPC มาจากไกด์ภาษาฝรั่งเศส roz-global.info (อ่าน 8 ก.ย. 2026) ·
        ของที่ใช้<strong>ตรวจกับฐานข้อมูลไอเทมของเราแล้ว {linkedMaterials} จาก {totalMaterials} ชิ้น</strong> และลิงก์ไปดูได้ —
        ที่เหลือชื่อไม่ตรงกับในตารางเรา จึงปล่อยเป็นตัวหนังสือเฉยๆ ไม่เดาว่าเป็นของชิ้นไหน ·
        พิกัด NPC ไม่มีแหล่งที่สองให้ตรวจ ถ้าเดินไปแล้วไม่เจอ บอกได้
      </Caveat>

      <p className="muted" style={{ marginTop: 16 }}>
        ดูต่อ: <Link href="/database/costumes">ฐานข้อมูลคอสตูม</Link> ·{' '}
        <Link href="/database/pets">สัตว์เลี้ยง</Link> ·{' '}
        <Link href="/drop-finder">ค้นของดรอป</Link>
      </p>
    </main>
  );
}
