// app/guides/page.tsx
//
// The landing page of the section the reference tables and the written guide
// moved into on 3 Sep 2026. It exists because the nav's primary tab needs
// somewhere to point, and because "which table do I want" is a question worth
// answering in a sentence each rather than by chip label alone.
//
// Redesigned 2 Oct 2026 from three of five drafts the owner mixed: a
// "start here" strip of three steps for a new player (draft B), a search box
// with world tabs (draft C), and each group as a world of stage-select tiles
// (draft A) -- components/GuideBrowser.
import Link from 'next/link';
import './page.css';
import siteUpdates from '@/data/site-updates.json';
import PageHeader from '@/components/PageHeader';
import JsonLd from '@/components/JsonLd';
import GuideBrowser, { type GuideWorld } from '@/components/GuideBrowser';
import { breadcrumbJsonLd } from '@/lib/jsonld';
import { GUIDE_GROUPS, SECTION_LINKS } from '@/lib/nav-links';
import { GUIDES } from '@/lib/guide-cards';

export const metadata = {
  title: 'ไกด์และตารางอ้างอิง',
  description:
    'ตารางธาตุ ตารางขนาด ตาราง EXP ต่อเลเวล และจุดฟาร์มแนะนำของ Ragnarok Zero Global รวมไว้ที่เดียว เปิดดูได้เลยไม่ต้องกรอกอะไร',
};

// Rebuilt daily so the NEW! badge (3 days, as on the homepage) wears off.
export const revalidate = 86400;

const WORLD_EN: Record<string, { en: string; slug: string }> = {
  เริ่มเล่น: { en: 'START', slug: 'start' },
  คราฟต์: { en: 'CRAFT', slug: 'craft' },
  ดันเจี้ยน: { en: 'DUNGEON', slug: 'dungeon' },
  ตารางอ้างอิง: { en: 'TABLES', slug: 'tables' },
  ระบบในเกม: { en: 'SYSTEMS', slug: 'systems' },
};

// The three pages a new player needs before any other, in reading order.
const START_HERE = [
  { href: '/guides/faq', title: 'ถามบ่อย', sub: 'ข้อสงสัยของคนเพิ่งเริ่ม' },
  { href: '/guides/classes', title: 'เลือกอาชีพ', sub: '19 อาชีพ แผนสกิล สเตตัส' },
  { href: '/guides/farm-guide', title: 'ไปฟาร์มที่ไหน', sub: 'ไล่ตามช่วงเลเวล' },
];

const NEW_FOR_MS = 3 * 86400000;

export default function GuidesPage() {
  // A guide is NEW! when a site-updates row points into it in the last 3 days.
  const now = Date.now();
  const recent = new Set(
    siteUpdates.items
      .filter((u) => now - Date.parse(`${u.date}T00:00:00+07:00`) < NEW_FOR_MS)
      .map((u) => u.href.split(/[?#]/)[0]),
  );
  const links = SECTION_LINKS.guides;
  const iconOf = (href: string) => links.find((l) => l.href === href)?.icon ?? '';

  const worlds: GuideWorld[] = GUIDE_GROUPS.map((group) => ({
    name: group,
    en: WORLD_EN[group]?.en ?? group,
    slug: WORLD_EN[group]?.slug ?? group,
    guides: links
      .filter((link) => link.group === group)
      .map((link) => {
        const card = GUIDES.find((guide) => guide.href === link.href);
        return card
          ? { href: link.href, label: link.label, title: card.title, blurb: card.blurb, icon: link.icon ?? '', isNew: recent.has(link.href) }
          : null;
      })
      .filter((g): g is NonNullable<typeof g> => g !== null),
  })).filter((w) => w.guides.length > 0);
  const count = worlds.reduce((n, w) => n + w.guides.length, 0);

  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'หน้าแรก', path: '/' },
          { name: 'ไกด์', path: '/guides' },
        ])}
      />
      <p className="arckicker">GUIDES · {count} หน้า</p>
      <PageHeader title="ไกด์และตารางอ้างอิง" />
      <p className="muted" style={{ marginTop: -6, marginBottom: 16, maxWidth: '70ch' }}>
        หน้าพวกนี้เปิดอ่านได้เลย ไม่ต้องกรอกอะไร ส่วนที่ต้องใส่ตัวเลขของตัวเองแล้วให้เว็บคำนวณ อยู่ใน{' '}
        <Link href="/tools/leveling-spots">เครื่องมือ</Link> · ส่วนอัปเดตของเกมว่ามาแล้วอะไรและเดือนหน้ามีอะไร อยู่ที่{' '}
        <Link href="/news/roadmap">ไทม์ไลน์อัปเดต</Link> · วิธีได้สัตว์เลี้ยง (Qpet) อยู่ที่{' '}
        <Link href="/database/pets">ฐานข้อมูลสัตว์เลี้ยง</Link>
      </p>

      <section className="gstart" aria-labelledby="gstart-title">
        <h2 id="gstart-title" className="gstart__title">▶ เพิ่งเริ่มเล่น? อ่าน 3 หน้านี้ก่อน</h2>
        <ol className="gstart__steps">
          {START_HERE.map((s, i) => (
            <li key={s.href}>
              <Link href={s.href} className="gstep">
                <span className="gstep__n" aria-hidden="true">{i + 1}</span>
                {iconOf(s.href) && <img className="gstep__icon" src={iconOf(s.href)} alt="" width={32} height={32} />}
                <span>
                  <b>{s.title}</b>
                  <small>{s.sub}</small>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <GuideBrowser worlds={worlds} />
    </main>
  );
}
