// app/database/cards/page.tsx
//
// The card list, and since 8 Sep 2026 also the card *guide*: the same rows,
// filterable by what the card is for.
//
// That grouping shipped for a few hours as a separate page under /guides and
// it was the wrong call -- 288 cards listed twice with the same three
// columns, two URLs competing for the same search, and two places to fix
// anything. This page already had 360 views in 30 days and a slot filter, so
// the grouping belongs on it. /guides/cards now redirects here.
import { isCVariant } from '@/lib/c-variant';
import './page.css';
import SuggestInput from '@/components/SuggestInput';
import { itemFormerNames } from '@/lib/item-former-names';
import { isAbsentFromGame } from '@/lib/game-absent';
import Link from 'next/link';
import EffectMatchLine from '@/components/EffectMatchLine';
import { EFFECT_FILTERS, effectFilter, filterStrength, ITEM_EFFECTS_SOURCE, itemEffects, matchingBonuses } from '@/lib/item-effects';
import FilterAutoSubmit from '@/components/FilterAutoSubmit';
import { matches } from '@/lib/smart-search';
import { cardRelease, releaseText } from '@/lib/card-availability';
import { CARDS_WITHOUT_ART, cardArtAlt, cardArtThumbUrl, hasCardArt } from '@/lib/card-art';
import { supabaseBrowser } from '@/lib/supabase';
import { fetchAllRows } from '@/lib/fetch-all-rows';
import PageHeader from '@/components/PageHeader';
import FilterState, { EmptyState } from '@/components/FilterState';
import Pagination from '@/components/Pagination';
import { cardSlot, SLOT_ORDER, SLOT_TH, type CardSlot } from '@/lib/card-slot';
import { ROLE_ORDER, ROLE_TH, cardRoles, type CardRole } from '@/lib/card-roles';
import JsonLd from '@/components/JsonLd';
import { breadcrumbJsonLd, itemListJsonLd } from '@/lib/jsonld';

export const revalidate = 86400;

export const metadata = {
  title: 'ฐานข้อมูลการ์ด — การ์ดใบไหนใส่ช่องไหน เอาไว้ทำอะไร',
  description:
    'การ์ดทั้งหมดใน Ragnarok Zero Global พร้อมเอฟเฟกต์ ช่องที่ใส่ และมอนที่ดรอป · เลือกดูตามงานที่ต้องการได้เลย กันสถานะ เปลี่ยนธาตุชุด ต้านธาตุ ตีเผ่าไหนแรงขึ้น หรือค้นจากเอฟเฟกต์ เช่นพิมพ์ LUK',
};

const PAGE_SIZE = 50;

// Type, Equipped on and Weight are structure, not effect. Repeating them in
// every row would bury the one line a player is actually scanning for.
const BOILERPLATE = /^(Type|Equipped on|Weight)\s*:/;

function cardEffect(description: string | null): string | null {
  if (!description) return null;
  const lines = description
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l !== '' && !BOILERPLATE.test(l));
  return lines.length > 0 ? lines.join(' ') : null;
}

export default async function CardsPage({
  searchParams,
}: {
  searchParams: { q?: string; slot?: string; role?: string; fx?: string; page?: string; sort?: string; live?: string };
}) {
  const q = searchParams.q ?? '';
  const slot = SLOT_ORDER.includes(searchParams.slot as CardSlot) ? (searchParams.slot as CardSlot) : '';
  const role = ROLE_ORDER.includes(searchParams.role as CardRole) ? (searchParams.role as CardRole) : '';
  const page = Math.max(1, Number(searchParams.page ?? 1) || 1);
  // "มีผล": cards that do a thing, from the numbers in lib/item-effects
  // (owner, 6 Oct 2026). Strongest first while it is on.
  const fx = effectFilter(searchParams.fx);
  // Off by default: a card that arrives in January is still worth reading
  // about while planning, and hiding rows by default is how a database
  // quietly stops being one.
  const hideUnreleased = searchParams.live === '1';
  const SORTS = {
    name: { label: 'ชื่อ A-Z' },
    slot: { label: 'ช่องที่ใส่' },
  } as const;
  const sort = (searchParams.sort ?? 'name') in SORTS ? ((searchParams.sort ?? 'name') as keyof typeof SORTS) : 'name';

  const db = supabaseBrowser();

  // Slot lives inside description text, so it cannot be filtered in SQL. 289
  // rows is far under the 1,000-row cap, so the whole set is fetched once and
  // filtered in memory -- simpler and always correct, unlike a LIKE filter,
  // which would silently drop the row whose description is null.
  const { data: allCards, error } = await db
    .from('items')
    .select('id, name_en, icon_url, description, description_th')
    .eq('category', 'Card')
    .order('name_en');

  if (error) {
    console.error('cards query failed', error);
  }

  // Which monster drops each card. "Where do I get it" is the question that
  // always follows "which card do I want", and answering it here saves the
  // reader a click per card. fetchAllRows because monster_drops is well over
  // the 1,000-row cap PostgREST applies silently.
  const [dropsResult, monstersResult] = await Promise.all([
    fetchAllRows<{ item_id: number; monster_id: number; rate: number | null }>((from, to) =>
      db.from('monster_drops').select('item_id, monster_id, rate').order('id').range(from, to),
    ),
    fetchAllRows<{ id: number; name_en: string }>((from, to) =>
      db.from('monsters').select('id, name_en').order('id').range(from, to),
    ),
  ]);
  // A failed drops read must not render as "this card drops from nothing":
  // the column simply goes quiet instead.
  const dropsKnown = !dropsResult.error && !monstersResult.error;
  const monsterName = new Map((monstersResult.data ?? []).map((m) => [m.id, m.name_en]));
  const droppers = new Map<number, { id: number; name: string; rate: number }[]>();
  for (const d of dropsResult.data ?? []) {
    const name = monsterName.get(d.monster_id);
    // A Challenge-dungeon clone is the same monster met somewhere else;
    // listing both doubles the cell and tells the reader nothing new.
    if (!name || isCVariant(name)) continue;
    const list = droppers.get(d.item_id) ?? [];
    list.push({ id: d.monster_id, name, rate: d.rate ?? 0 });
    droppers.set(d.item_id, list);
  }

  const squash = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  // Cards the live client does not know (Amatsu, Louyang, Moscovia...) stay
  // out; cards it knows but has not released keep their release label.
  const cards = (allCards ?? []).filter((c) => !isAbsentFromGame(c.id)).map((c) => {
    const from = (droppers.get(c.id) ?? []).sort((a, b) => b.rate - a.rate);
    // Every one of these is called "<something> Card" on a page headed
    // "ฐานข้อมูลการ์ด", so the word is printed 315 times and distinguishes
    // nothing. Dropped from the list; the card's own page still uses the
    // full in-game name.
    const name = c.name_en.replace(/ Card$/, '');
    return {
      ...c,
      name,
      // The folded slot, not the raw string: Headgear and Helmet are one
      // place on the character and splitting the filter into both helps
      // nobody. The card's own page still shows the client's exact wording.
      slot: cardSlot(c.description),
      roles: cardRoles(c.description),
      // Thai translation leads when present; the English effect still powers
      // the search below so "LUK" and English phrasing keep matching.
      effect: c.description_th ?? cardEffect(c.description),
      effectEn: cardEffect(c.description),
      from,
      // Worth printing only when it is not the obvious answer: a single
      // dropper with the card's own name tells the reader nothing they did
      // not already have on the same row.
      dropNote: !(from.length === 1 && squash(from[0].name) === squash(name)),
      // Null for a card that is in the game. 42 of these rows are content
      // that has not opened on Global, and without this the page tells a
      // reader to go and farm something that drops nowhere.
      release: cardRelease(c.name_en, c.id),
    };
  });
  const unreleased = cards.filter((c) => c.release !== null).length;

  // Counts come from the data, so an empty group never shows a chip that
  // leads to an empty page.
  const slotCounts = new Map<CardSlot, number>();
  const roleCounts = new Map<CardRole, number>();
  for (const c of cards) {
    if (c.slot) slotCounts.set(c.slot, (slotCounts.get(c.slot) ?? 0) + 1);
    for (const r of c.roles) roleCounts.set(r, (roleCounts.get(r) ?? 0) + 1);
  }
  const slots = SLOT_ORDER.filter((s) => slotCounts.has(s));
  const roles = ROLE_ORDER.filter((r) => roleCounts.has(r));

  const needle = q.trim().toLowerCase();
  const filtered = cards.filter((c) => {
    if (hideUnreleased && c.release !== null) return false;
    if (slot && c.slot !== slot) return false;
    if (role && !c.roles.includes(role)) return false;
    if (fx && matchingBonuses(itemEffects(c.id), fx).length === 0) return false;
    if (!needle) return true;
    // Searching effect text is the point: a player looks for "cards that add
    // LUK", not for a card whose name they already know.
    // Name and effect text, Thai and English: the cards page is the one
    // people search by what the card DOES ("agi", "matk", "สัตว์").
    return matches(`${c.name_en} ${itemFormerNames(c.id).join(' ')} ${c.effect ?? ''} ${c.effectEn ?? ''}`, needle);
  });

  if (fx) {
    filtered.sort((a, b) => filterStrength(itemEffects(b.id), fx) - filterStrength(itemEffects(a.id), fx) || a.name.localeCompare(b.name));
  } else if (sort === 'slot') {
    // Cards with no "Equipped on" line sort last rather than first: an unknown
    // slot is not a slot that comes before Accessory.
    filtered.sort((a, b) => (a.slot ?? 'zzz').localeCompare(b.slot ?? 'zzz') || a.name_en.localeCompare(b.name_en));
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function buildHref(targetPage: number) {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (slot) params.set('slot', slot);
    if (fx) params.set('fx', fx.key);
    if (role) params.set('role', role);
    if (sort !== 'name') params.set('sort', sort);
    if (hideUnreleased) params.set('live', '1');
    if (targetPage > 1) params.set('page', String(targetPage));
    const qs = params.toString();
    return `/database/cards${qs ? `?${qs}` : ''}`;
  }

  // The same URL with the unreleased-cards switch flipped, back to page 1.
  function liveHref(next: boolean): string {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (slot) params.set('slot', slot);
    if (fx) params.set('fx', fx.key);
    if (role) params.set('role', role);
    if (sort !== 'name') params.set('sort', sort);
    if (next) params.set('live', '1');
    const qs = params.toString();
    return `/database/cards${qs ? `?${qs}` : ''}`;
  }

  // A role chip keeps whatever search and slot are already on, and drops the
  // page number, because page 4 of the old filter is not page 4 of this one.
  function roleHref(target: CardRole | '') {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (slot) params.set('slot', slot);
    if (fx) params.set('fx', fx.key);
    if (target) params.set('role', target);
    if (sort !== 'name') params.set('sort', sort);
    if (hideUnreleased) params.set('live', '1');
    const qs = params.toString();
    return `/database/cards${qs ? `?${qs}` : ''}`;
  }

  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'หน้าแรก', path: '/' },
          { name: 'ฐานข้อมูล', path: '/database/monsters' },
          { name: 'การ์ด', path: '/database/cards' },
        ])}
      />
      {!error && rows.length > 0 && (
        <JsonLd
          data={itemListJsonLd({
            path: '/database/cards',
            rows: rows.map((c) => ({ id: c.id, name: c.name })),
            detailPath: (id) => `/database/cards/${id}`,
          })}
        />
      )}
      <PageHeader title="ฐานข้อมูลการ์ด Ragnarok Zero" />
      {/* A query error and a genuine zero-result search must read differently --
          otherwise an outage looks identical to "there are no cards", which is
          false. */}
      {error ? (
        <p className="filterstate">โหลดจำนวนการ์ดไม่สำเร็จ</p>
      ) : (
        <FilterState
          count={filtered.length}
          unit="ใบ"
          filters={[
            { label: 'คำค้น', value: q },
            { label: 'ช่อง', value: slot ? SLOT_TH[slot] : '' },
            { label: 'เอาไว้', value: role ? ROLE_TH[role].title : '' },
            { label: 'มีผล', value: fx?.label ?? '' },
          ]}
          clearHref="/database/cards"
        />
      )}

      {/* The guide half: pick the job, not the name. Chips rather than another
          dropdown because the list of jobs IS the thing worth reading -- a
          player who does not know what a card can do for them learns it here.
          A card sits in every group it truly serves, so the counts overlap. */}
      <section className="rolepick">
        <h2 className="rolepick__label">เอาไว้ทำอะไร</h2>
        <div className="chips">
          <Link className={`chip${role === '' ? ' chip--on' : ''}`} href={roleHref('')}>
            ทั้งหมด
          </Link>
          {roles.map((r) => (
            <Link key={r} className={`chip${role === r ? ' chip--on' : ''}`} href={roleHref(r)} title={ROLE_TH[r].asks}>
              {ROLE_TH[r].title} {roleCounts.get(r)}
            </Link>
          ))}
        </div>
        {role && <p className="rolepick__asks">{ROLE_TH[role].asks}</p>}
      </section>
      {fx && (
        <p className="muted" style={{ margin: '0 0 10px', fontSize: 13 }}>
          นับจากตัวเลขผลของไอเทมที่ {ITEM_EFFECTS_SOURCE} แยกไว้ ซึ่งยังไม่ครบทุกการ์ด ถ้าหาไม่เจอให้ลองพิมพ์ชื่อผลในช่องค้นหาด้วย
        </p>
      )}
      <form className="filterbar">
        <FilterAutoSubmit />
        <div className="filterbar__row filterbar__row--search">
          <label className="field field--grow">
            <span className="field__label">ค้นชื่อการ์ดหรือเอฟเฟกต์</span>
            <SuggestInput src="/suggest/cards" look="art" heading="SELECT CARD" listLabel="การ์ดที่ตรงกับคำค้น" placeholder="เช่น Poring Card, LUK" defaultValue={q} />
          </label>
          <button type="submit" className="btn">ค้นหา</button>
        </div>
        <div className="filterbar__row">
        <label className="field">
          <span className="field__label">ช่องที่ใส่</span>
        <select name="slot" defaultValue={slot}>
          <option value="">ทุกช่อง</option>
          {slots.map((s) => (
            <option key={s} value={s}>
              {SLOT_TH[s]} ({slotCounts.get(s)})
            </option>
          ))}
        </select>
        </label>
        <label className="field">
          <span className="field__label">มีผล</span>
          <select name="fx" defaultValue={fx?.key ?? ''}>
            <option value="">ทุกอย่าง</option>
            {EFFECT_FILTERS.map((f) => (
              <option key={f.key} value={f.key}>{f.label}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="field__label">เรียงตาม</span>
          <select name="sort" defaultValue={sort} data-default="name">
            {Object.entries(SORTS).map(([key, v]) => (
              <option key={key} value={key}>{v.label}</option>
            ))}
          </select>
        </label>

        {/* The role rides along in the form so hitting search does not throw
            away the group the reader is standing in. */}
        {role && <input type="hidden" name="role" value={role} />}
        {hideUnreleased && <input type="hidden" name="live" value="1" />}
        </div>
      </form>

      {/* Stated, and switchable, rather than either silently listing cards
          nobody can get or silently hiding them. */}
      <p className="muted" style={{ marginTop: 8, marginBottom: 10, fontSize: 13 }}>
        {/* Both numbers are things the page would otherwise leave the reader
            to work out from what is missing. */}
        <strong>{CARDS_WITHOUT_ART} ใบยังไม่มีรูปการ์ด</strong> (ขึ้นเป็นรูปหลังการ์ดแทน) ·{' '}
        <strong>{unreleased} ใบยังไม่เปิดในเซิร์ฟโกลบอล</strong> ติดป้ายไว้ในตารางพร้อมเดือนที่คาดว่าจะมา ·{' '}
        <Link href={liveHref(!hideUnreleased)} scroll={false}>
          {hideUnreleased ? 'แสดงการ์ดที่ยังไม่เปิดด้วย' : 'ซ่อนการ์ดที่ยังไม่เปิด'}
        </Link>
      </p>

      {/* The card list as a collector's album (1 Oct 2026, arcade
          standard): the art leads, then the name, slot and effect. Was a
          four-column table with a 45px thumbnail. */}
      <div className="card">
        {error ? (
          <p className="muted" style={{ margin: 0 }}>เกิดข้อผิดพลาดในการโหลดข้อมูล ลองใหม่อีกครั้ง</p>
        ) : rows.length === 0 ? (
          <p className="muted" style={{ margin: 0 }}>ไม่พบการ์ดที่ตรงเงื่อนไข</p>
        ) : (
          <ul className="cardalbum">
            {rows.map((c) => (
              <li key={c.id} className="cardtile">
                <Link href={`/database/cards/${c.id}`} tabIndex={-1} aria-hidden="true" className="cardtile__art">
                  <img
                    className={hasCardArt(c.id) ? 'cardart' : 'cardart cardart--none'}
                    src={cardArtThumbUrl(c.id)}
                    alt=""
                    width={66}
                    height={88}
                    loading="lazy"
                    decoding="async"
                    title={cardArtAlt(c.id, c.name_en)}
                  />
                </Link>
                <div className="cardtile__body">
                  <Link className="cardname" href={`/database/cards/${c.id}`}>{c.name}</Link>
                  <span className="cardtile__meta">
                    {c.slot && <span className="cardtile__slot">{SLOT_TH[c.slot]}</span>}
                    {c.release && (
                      <span className="cardsoon" title={`แหล่งที่บอก: ${c.release.sources.join(' + ')}`}>
                        ยังไม่เปิด · {releaseText(c.release)}
                      </span>
                    )}
                  </span>
                  <span className="cardtile__effect">{c.effect ?? '—'}</span>
                  {fx && <EffectMatchLine effects={itemEffects(c.id)} filter={fx} />}
                  {/* Where it drops, only where that is not the monster the
                      card is named after (244 of 315 are). */}
                  {dropsKnown && c.dropNote && (
                    <span className="cardfrom">
                      {c.from.length === 0 ? (
                        'ยังไม่รู้ว่าดรอปจากอะไร'
                      ) : (
                        <>
                          ดรอปจาก{' '}
                          {c.from.slice(0, 2).map((m, i) => (
                            <span key={m.id}>
                              {i > 0 && ', '}
                              <Link href={`/database/monsters/${m.id}`}>{m.name}</Link>
                            </span>
                          ))}
                          {c.from.length > 2 && ` +${c.from.length - 2}`}
                        </>
                      )}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {rows.length === 0 && q && <EmptyState kind="cards" what={q} clearHref="/database/cards" />}

      <Pagination page={safePage} totalPages={totalPages} buildHref={buildHref} total={filtered.length} pageSize={PAGE_SIZE} />
    </main>
  );
}
