// /database/cards/effect/<topic> -- the cards that do one thing (owner, 8 Oct
// 2026): "การ์ดกันใบ้", "การ์ดตีมอนธาตุดิน", "การ์ดใส่โล่". Players search those
// words and Google sent them to the whole card list. Each page lists the
// matching cards with the line of game text that put them there, where they
// go, and who drops them. lib/card-topics decides which card is on which page.

import '../../page.css';
import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import JsonLd from '@/components/JsonLd';
import PageHeader from '@/components/PageHeader';
import { breadcrumbJsonLd } from '@/lib/jsonld';
import { supabaseBrowser } from '@/lib/supabase';
import { fetchAllRows } from '@/lib/fetch-all-rows';
import { isAbsentFromGame } from '@/lib/game-absent';
import { isCVariant } from '@/lib/c-variant';
import { cardRelease, releaseText } from '@/lib/card-availability';
import { cardSlotWord, cardsForTopic, publishedTopics, topicBySlug } from '@/lib/card-topics';
import { ELEMENT_TH } from '@/lib/monster-th';
import { ELEMENTS, elementModifier, type Element } from '@/lib/element-table';

export const revalidate = 86400;
export const dynamicParams = false;

const SLOT_WORD_TH: Record<string, string> = {
  Weapon: 'อาวุธ', Armor: 'เสื้อ', Shield: 'โล่', Garment: 'ผ้าคลุม', Footgear: 'รองเท้า', Headgear: 'หมวก', Accessory: 'เครื่องประดับ',
};

export function generateStaticParams() {
  return publishedTopics().map((t) => ({ slug: t.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const t = topicBySlug(params.slug);
  if (!t) return {};
  const n = cardsForTopic(params.slug).filter((c) => !isAbsentFromGame(c.id)).length;
  return {
    title: `${t.title} Ragnarok Zero${n ? ` — ${n} ใบ` : ''}`,
    description: `${t.lead} ใน Ragnarok Zero Global${n ? ` ครบ ${n} ใบ พร้อมผลจากข้อความในเกม ช่องที่ใส่ และมอนที่ดรอป` : ' · ตอนนี้ยังไม่มีการ์ดแบบนี้ในเกม และทางที่ใช้แทน'}`,
    alternates: { canonical: `/database/cards/effect/${params.slug}` },
  };
}

/** For an element nothing on the card list hits harder: the weapon elements that do. */
function counterElements(target: string): Element[] {
  const t = ELEMENTS.find((e) => e.toLowerCase() === target);
  if (!t) return [];
  return ELEMENTS.filter((a) => elementModifier(a, t, 1) > 100).sort((a, b) => elementModifier(b, t, 1) - elementModifier(a, t, 1));
}

export default async function CardTopicPage({ params }: { params: { slug: string } }) {
  const topic = topicBySlug(params.slug);
  if (!topic) notFound();
  const found = cardsForTopic(params.slug).filter((c) => !isAbsentFromGame(c.id));
  const ids = found.map((c) => c.id);

  const db = supabaseBrowser();
  const [{ data: rows }, drops, monsters] = await Promise.all([
    ids.length ? db.from('items').select('id, name_en, icon_url').in('id', ids) : Promise.resolve({ data: [] as { id: number; name_en: string; icon_url: string | null }[] }),
    ids.length
      ? fetchAllRows<{ item_id: number; monster_id: number; rate: number | null }>((from, to) => db.from('monster_drops').select('item_id, monster_id, rate').in('item_id', ids).order('id').range(from, to))
      : Promise.resolve({ data: [], error: null }),
    fetchAllRows<{ id: number; name_en: string }>((from, to) => db.from('monsters').select('id, name_en').order('id').range(from, to)),
  ]);
  const info = new Map((rows ?? []).map((r) => [r.id, r]));
  const monsterName = new Map((monsters.data ?? []).map((m) => [m.id, m.name_en]));
  const droppers = new Map<number, { id: number; name: string; rate: number }[]>();
  for (const d of drops.data ?? []) {
    const name = monsterName.get(d.monster_id);
    if (!name || isCVariant(name)) continue;
    droppers.set(d.item_id, [...(droppers.get(d.item_id) ?? []), { id: d.monster_id, name, rate: d.rate ?? 0 }]);
  }
  const cards = found
    .map((c) => ({ ...c, name: (info.get(c.id)?.name_en ?? '').replace(/ Card$/, ''), icon: info.get(c.id)?.icon_url ?? `/images/items/${c.id}.gif`, release: cardRelease(info.get(c.id)?.name_en ?? '', c.id) }))
    .filter((c) => c.name)
    .sort((a, b) => Number(a.release !== null) - Number(b.release !== null) || a.name.localeCompare(b.name));

  const isSlot = 'word' in topic;
  const group = isSlot ? 'ช่องที่ใส่' : topic.group;
  const siblings = publishedTopics().filter((t) => t.group === group);
  const vsElement = /^vs-(?!race-)(.+)$/.exec(topic.slug)?.[1];

  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <JsonLd data={breadcrumbJsonLd([
        { name: 'หน้าแรก', path: '/' },
        { name: 'การ์ด', path: '/database/cards' },
        { name: topic.title, path: `/database/cards/effect/${topic.slug}` },
      ])} />
      <PageHeader
        title={`${topic.title}${cards.length ? ` — ${cards.length} ใบ` : ''}`}
        lead={`${topic.lead} ใน Ragnarok Zero Global · เรียงตามชื่อ การ์ดที่ยังไม่มาในเกมอยู่ท้าย`}
        source={<><strong>ที่มา:</strong> ข้อความการ์ดจากไฟล์เกม (ภาษาไทย) · บรรทัดที่แสดงคือเหตุผลที่การ์ดอยู่ในหน้านี้</>}
      />

      {cards.length === 0 ? (
        <section className="card" style={{ marginTop: 16 }}>
          <p style={{ margin: 0 }}>ตอนนี้ยังไม่มีการ์ดใน Ragnarok Zero Global ที่{topic.lead.replace(/^การ์ดที่/, '')} โดยตรง</p>
          {vsElement && counterElements(vsElement).length > 0 && (
            <p className="muted" style={{ marginTop: 8 }}>
              ทางที่ใช้แทน: ตีด้วยอาวุธหรือเอนชานต์ธาตุ{' '}
              {counterElements(vsElement).slice(0, 3).map((e, i) => (
                <span key={e}>{i > 0 && ' · '}<b>{ELEMENT_TH[e]}</b> ({elementModifier(e, ELEMENTS.find((x) => x.toLowerCase() === vsElement)!, 1)}%)</span>
              ))}{' '}
              ใส่มอนธาตุ{ELEMENT_TH[ELEMENTS.find((x) => x.toLowerCase() === vsElement)!]} ระดับ 1 · ดู <Link href="/guides/elements">ตารางธาตุ</Link>
            </p>
          )}
        </section>
      ) : (
        <ul className="cardtopic">
          {cards.map((c) => {
            const from = (droppers.get(c.id) ?? []).sort((a, b) => b.rate - a.rate).slice(0, 2);
            const slot = cardSlotWord(c.id);
            return (
              <li key={c.id} className="cardtopic__row">
                <Link href={`/database/cards/${c.id}`} className="cardtopic__name">
                  <img src={c.icon} alt="" width={28} height={28} loading="lazy" />
                  {c.name}
                </Link>
                <span className="cardtopic__fx">{c.lines.join(' · ')}</span>
                <span className="cardtopic__meta">
                  {slot && <span className="chip">{SLOT_WORD_TH[slot] ?? slot}</span>}
                  {c.release && <span className="chip">{releaseText(c.release)}</span>}
                  {from.length > 0 && (
                    <span className="muted">
                      ดรอปจาก {from.map((m, i) => (
                        <span key={m.id}>{i > 0 && ', '}<Link href={`/database/monsters/${m.id}`}>{m.name}</Link>{m.rate ? ` ${m.rate}%` : ''}</span>
                      ))}
                    </span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {siblings.length > 0 && (
        <section className="rolepick" style={{ marginTop: 22 }}>
          <h2 className="rolepick__label">{group} แบบอื่น</h2>
          <div className="chips">
            {siblings.map((t) => <Link key={t.slug} className={`chip${t.slug === topic.slug ? ' chip--on' : ''}`} href={`/database/cards/effect/${t.slug}`}>{t.title}</Link>)}
          </div>
        </section>
      )}
      <p className="muted" style={{ marginTop: 16 }}>
        การ์ดทั้งหมดพร้อมตัวกรองอยู่ที่ <Link href="/database/cards">ฐานข้อมูลการ์ด</Link>
      </p>
    </main>
  );
}
