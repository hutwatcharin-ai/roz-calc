// app/guides/cards/page.tsx
//
// The cards, grouped by the question a player arrives with.
//
// /database/cards already answers "what does this card do", one card at a
// time, and it is the wrong shape for the way people actually shop: I keep
// getting frozen, I need my armour to be Holy, I farm Demi-Human all day --
// which card, and does it go in my armour or my shield? Two outside sites
// group them that way and neither is in Thai.
//
// Both the grouping and the slot come out of our own items table, read from
// the client's own words (lib/card-roles). Checked on 8 Sep 2026 against the
// 112 cards a public player spreadsheet lists a slot for: 111 agree and one
// is a card whose description carries no slot line at all, so nothing in
// this page's placement contradicts the source that did it by hand.
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import Caveat from '@/components/Caveat';
import ItemIcon from '@/components/ItemIcon';
import JsonLd from '@/components/JsonLd';
import { breadcrumbJsonLd } from '@/lib/jsonld';
import { supabaseBrowser } from '@/lib/supabase';
import { fetchAllRows } from '@/lib/fetch-all-rows';
import { itemHref } from '@/lib/item-href';
import {
  ROLE_ORDER, ROLE_TH, SLOT_TH, cardEffect, cardRoles, cardSlot,
  type CardRole, type CardSlot,
} from '@/lib/card-roles';

export const revalidate = 86400;

export const metadata = {
  title: 'การ์ดใบไหนใส่ช่องไหน — รวมการ์ด Ragnarok Zero แยกตามที่ใช้',
  description:
    'อยากกันแข็ง กันสตัน เปลี่ยนธาตุชุด หรือตีเผ่าไหนให้แรงขึ้น ใช้การ์ดใบไหน ใส่ช่องอะไร และดรอปจากมอนตัวไหน รวมการ์ด Ragnarok Zero Global ทุกใบแยกตามงานที่มันทำ',
};

const SLOT_ORDER: CardSlot[] = ['weapon', 'armor', 'shield', 'garment', 'shoes', 'headgear', 'accessory'];

interface CardRow {
  id: number;
  name: string;
  icon: string | null;
  effect: string;
  effectTh: string | null;
  slot: CardSlot | null;
  roles: CardRole[];
  from: { id: number; name: string; rate: number }[];
}

export default async function CardGuidePage({
  searchParams,
}: {
  searchParams: { slot?: string };
}) {
  const slotFilter = SLOT_ORDER.includes(searchParams.slot as CardSlot) ? (searchParams.slot as CardSlot) : null;

  const db = supabaseBrowser();
  // fetchAllRows, not a plain select: there are more than a thousand rows in
  // monster_drops and PostgREST cuts silently at 1,000.
  const [itemsResult, dropsResult, monstersResult] = await Promise.all([
    fetchAllRows<{
      id: number;
      name_en: string;
      icon_url: string | null;
      description: string | null;
      description_th: string | null;
    }>((from, to) =>
      db
        .from('items')
        .select('id, name_en, icon_url, description, description_th')
        .eq('category', 'Card')
        .order('id')
        .range(from, to),
    ),
    fetchAllRows<{ item_id: number; monster_id: number; rate: number | null }>((from, to) =>
      db.from('monster_drops').select('item_id, monster_id, rate').order('id').range(from, to),
    ),
    fetchAllRows<{ id: number; name_en: string }>((from, to) =>
      db.from('monsters').select('id, name_en').order('id').range(from, to),
    ),
  ]);

  // One failed read must not render as "this card drops from nothing" or as a
  // page with half the cards on it, so any of the three failing stops it.
  const error = itemsResult.error ?? dropsResult.error ?? monstersResult.error;
  if (error || !itemsResult.data || !dropsResult.data || !monstersResult.data) {
    return (
      <main className="shell" style={{ paddingBlock: 32 }}>
        <PageHeader title="การ์ดใบไหนใส่ช่องไหน" />
        <p className="muted">โหลดข้อมูลการ์ดไม่สำเร็จ ลองรีเฟรชอีกครั้ง</p>
      </main>
    );
  }
  const items = itemsResult.data;
  const drops = dropsResult.data;
  const monsters = monstersResult.data;

  const monsterName = new Map(monsters.map((m) => [m.id, m.name_en]));
  const droppers = new Map<number, { id: number; name: string; rate: number }[]>();
  for (const d of drops) {
    const name = monsterName.get(d.monster_id);
    if (!name) continue;
    // C-variants are the same monster met in a Challenge dungeon; listing
    // both doubles every row and tells the reader nothing new.
    if (/^C\d /.test(name)) continue;
    const list = droppers.get(d.item_id) ?? [];
    list.push({ id: d.monster_id, name, rate: d.rate ?? 0 });
    droppers.set(d.item_id, list);
  }

  const cards: CardRow[] = [];
  for (const it of items) {
    const effect = cardEffect(it.description);
    const slot = cardSlot(it.description);
    // Card Coin and the two exchange boxes sit in the Card category without
    // being cards: no slot, and an effect that describes a box.
    if (!slot && !/Type\s*:\s*Card/i.test(it.description ?? '')) continue;
    cards.push({
      id: it.id,
      name: it.name_en.replace(/ Card$/, ''),
      icon: it.icon_url,
      effect,
      effectTh: it.description_th ? cardEffect(it.description_th) : null,
      slot,
      roles: cardRoles(it.description),
      from: (droppers.get(it.id) ?? []).sort((a, b) => b.rate - a.rate),
    });
  }

  const shown = slotFilter ? cards.filter((c) => c.slot === slotFilter) : cards;
  const groups = ROLE_ORDER.map((role) => ({
    role,
    rows: shown.filter((c) => c.roles.includes(role)).sort((a, b) => a.name.localeCompare(b.name)),
  })).filter((g) => g.rows.length > 0);

  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'หน้าแรก', path: '/' },
          { name: 'ไกด์', path: '/guides' },
          { name: 'การ์ดใส่ช่องไหน', path: '/guides/cards' },
        ])}
      />
      <PageHeader title="การ์ดใบไหนใส่ช่องไหน" />
      <p className="muted" style={{ marginTop: -6, marginBottom: 14, maxWidth: '72ch' }}>
        การ์ด {cards.length} ใบ จัดตามงานที่มันทำ ไม่ใช่ตามตัวอักษร — เลื่อนหาหัวข้อที่ตรงกับปัญหาของคุณ
        แล้วดูว่าการ์ดใบนั้นใส่ช่องไหนและดรอปจากมอนตัวไหน · การ์ดใบเดียวโผล่ได้หลายหัวข้อถ้ามันทำหลายอย่าง
      </p>

      <div className="chips" style={{ marginBottom: 18 }}>
        <Link className={`chip${slotFilter === null ? ' chip--on' : ''}`} href="/guides/cards">
          ทุกช่อง
        </Link>
        {SLOT_ORDER.map((s) => (
          <Link key={s} className={`chip${slotFilter === s ? ' chip--on' : ''}`} href={`/guides/cards?slot=${s}`}>
            {SLOT_TH[s]}
          </Link>
        ))}
      </div>

      {groups.length === 0 && <p className="muted">ไม่มีการ์ดในช่องนี้</p>}

      {groups.map(({ role, rows }) => (
        <section key={role} style={{ marginTop: 26 }}>
          <h2 className="section-title">
            {ROLE_TH[role].title} <span className="muted" style={{ fontWeight: 400 }}>· {rows.length} ใบ</span>
          </h2>
          <p className="muted" style={{ marginTop: 2, marginBottom: 8, fontSize: 13 }}>{ROLE_TH[role].asks}</p>
          <div className="recipe__scroll">
            <table className="data-table recipe">
              <thead>
                <tr>
                  <th>การ์ด</th>
                  <th>ใส่ช่อง</th>
                  <th>ผล</th>
                  <th>ดรอปจาก</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id}>
                    <td data-label="การ์ด">
                      <Link className="recipe__item" href={itemHref(c.id, 'Card')}>
                        <ItemIcon iconUrl={c.icon} category="Card" size={22} />
                        <span>{c.name}</span>
                      </Link>
                    </td>
                    <td data-label="ช่อง">{c.slot ? SLOT_TH[c.slot] : '—'}</td>
                    <td data-label="ผล" style={{ whiteSpace: 'pre-line' }}>{c.effectTh || c.effect}</td>
                    <td data-label="ดรอปจาก">
                      {c.from.length === 0 ? (
                        <span className="muted">ยังไม่รู้</span>
                      ) : (
                        <span className="recipe__list">
                          {c.from.slice(0, 3).map((m) => (
                            <Link key={m.id} className="recipe__item" href={`/database/monsters/${m.id}`}>
                              {m.name}
                            </Link>
                          ))}
                          {c.from.length > 3 && <span className="muted">+{c.from.length - 3}</span>}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      <Caveat label="เชื่อได้แค่ไหน">
        ช่องที่ใส่และผลของการ์ดอ่านจากคำอธิบายไอเทมในเกมที่เก็บไว้ในฐานข้อมูลเว็บนี้ ไม่ใช่ความเห็นของใคร ·
        การจัดหัวข้อเป็นการอ่านข้อความนั้นด้วยกฎ ถ้าใบไหนไม่เข้ากฎจะไปอยู่ &quot;อื่น ๆ&quot; แทนที่จะถูกยัดเข้าหัวข้อมั่ว ·
        ทดสอบกับตารางที่ผู้เล่นทำเองไว้ 112 ใบ ตรงกัน 111 ใบ อีกใบเป็นการ์ดใหม่ที่ในเกมยังไม่เขียนช่องไว้ ·{' '}
        <strong>ไม่ได้บอกว่าใบไหนหาได้จริงตอนนี้</strong> เพราะบางแมพยังไม่เปิดในเซิร์ฟโกลบอล และแหล่งข้อมูลสองเจ้าไม่ตรงกันเรื่องนี้ —
        ดูชื่อมอนกับแมพในหน้ามอนแล้วตัดสินเอาเอง
      </Caveat>

      <p className="muted" style={{ marginTop: 16 }}>
        ดูต่อ: <Link href="/database/cards">ฐานข้อมูลการ์ดทั้งหมด</Link> ·{' '}
        <Link href="/guides/elements">ตารางธาตุ</Link> ·{' '}
        <Link href="/tools/damage">ตีมอนด้วยอะไรดี</Link>
      </p>
    </main>
  );
}
