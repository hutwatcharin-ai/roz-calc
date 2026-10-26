import './page.css';
import siteUpdates from '@/data/site-updates.json';
import FarmingTable from '@/components/FarmingTable';
import Link from 'next/link';
import SiteStats, { getSiteStats } from '@/components/SiteStats';
import RecentlyViewed from '@/components/RecentlyViewed';
import CVariantToggle from '@/components/CVariantToggle';
import JsonLd from '@/components/JsonLd';
import { websiteJsonLd } from '@/lib/jsonld';
import { timeAgoTh } from '@/lib/time-ago';
import { getLastUpdated } from '@/lib/last-updated';
import ReactDOM from 'react-dom';
import NowPlaying from '@/components/NowPlaying';
import HomeSearch from '@/components/HomeSearch';
import HomeTools from '@/components/HomeTools';
import { splitNews } from '@/lib/news';
import { getFarmingRows } from '@/lib/home-farm';


export const metadata = {
  // Root page shares the root layout's segment, so the "| RO Zero Thai"
  // title template does NOT apply here -- brand goes in by hand.
  // DB-first positioning (user call, 2 Sep): the Thai-language database IS
  // the moat — the English competitors own lookup, nobody owns Thai. The
  // farm-spot keyword lives on /guides/farm-guide instead.
  title: 'RO Zero Thai — ฐานข้อมูล Ragnarok Zero ภาษาไทย',
  description:
    'ฐานข้อมูล Ragnarok Zero Global ภาษาไทย — มอนสเตอร์ ไอเทม การ์ด อุปกรณ์ และเควสแปลไทยครบ พร้อมเครื่องมือหาจุดฟาร์มที่คิดเป็นตัวเลขของตัวละครคุณ',
};

export default async function HomePage({
  searchParams,
}: {
  searchParams: { level?: string; range?: string; c?: string };
}) {
  // The farming finder still lives at "/" (spec 6.2: the link people share in
  // game chat keeps working, params and all). What changed is the default
  // view: intent cards first, and the results table renders only after a
  // search -- a first-time visitor sees what the site can do, not a table
  // computed for a level they never chose.
  const searched = searchParams.level !== undefined;
  const level = Number(searchParams.level ?? 50);
  const range = Number(searchParams.range ?? 10);
  const showC = searchParams.c === '1';

  const [rows, stats, lastUpdated] = await Promise.all([
    searched ? getFarmingRows(Math.max(1, level - range), level + range, showC) : Promise.resolve([]),
    getSiteStats(),
    getLastUpdated(),
  ]);

  const resultsHref = (show: boolean) =>
    `/?level=${level}&range=${range}${show ? '&c=1' : ''}#results`;

  // The fighter's frames are what the browser paints largest above the fold,
  // so they are fetched with the stylesheet rather than after it: without
  // this the page's largest paint waited on them (PageSpeed mobile 72-76
  // against 82-87, 23 Sep 2026).
  ReactDOM.preload('/images/arcade/fighter.webp', { as: 'image', fetchPriority: 'high' });
  ReactDOM.preload('/images/arcade/monsters.webp', { as: 'image' });

  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <JsonLd data={websiteJsonLd()} />
      {/* DB-first H1 (user call, 2 Sep): "ฐานข้อมูล...ภาษาไทย" is the SERP
          whitespace and the translation moat; the farm keyword is held by
          /guides/farm-guide. No hardcoded counts here — SiteStats below
          carries the live ones. */}
      {/* An arcade stage over the heading (owner, 22 Sep 2026): a Swordsman
          cutting down Porings, Lunatics and Drops in turn, on the site's own
          neon grid, so a first-time visitor sees at a glance that this is a
          Ragnarok site. The swing, the hits and the deaths are the game's own
          frames (scripts/build-arcade-sprites.py, 25 kB for all of them).
          Decoration only: the heading stays the page's largest paint, and it
          all holds still for anyone who asks for less motion. */}
      <section className="homehero">
        <div className="arcade" aria-hidden="true">
          <span className="arcade__sun" />
          <span className="arcade__floor"><i /></span>
          <span className="arcade__hud"><b>1P SWORDSMAN</b><span className="arcade__bar"><i /></span></span>
          <span className="arcade__hud arcade__hud--right"><b>STAGE 1</b>PRONTERA FIELD</span>
          <span className="arcade__fighter" />
          <span className="arcade__foe"><i /></span>
          <span className="arcade__dmg">57</span>
          <span className="arcade__dmg arcade__dmg--crit">124</span>
          <span className="arcade__start">INSERT COIN</span>
        </div>
        <h1 className="pagehead__title">ฐานข้อมูล Ragnarok Zero Global ภาษาไทย</h1>
        <p className="muted" style={{ marginTop: 8, maxWidth: '65ch' }}>
          มอนสเตอร์ ไอเทม การ์ด อุปกรณ์ สกิล <strong>เควสและการ์ดแปลไทยครบ ที่เดียวที่ทำ</strong> ·
          เครื่องมือทุกตัวคิดเป็นตัวเลขของตัวละครคุณ
        </p>
        {/* One box for the homepage's two searches (owner's pick C, 26 Oct
            2026): a level opens the ranking below, a name the drop finder. */}
        <HomeSearch />
        <p style={{ marginTop: 6 }}>
          <Link href="/guides/faq" className="homehero__faq">เล่นใหม่? เริ่มที่คำถามที่ถามบ่อย →</Link>
        </p>
      </section>

      {/* Results right under the search that asked for them (owner's pick C,
          26 Oct 2026): they used to sit below the news and the site updates. */}
      {searched && (
        <div className="panel" id="results" style={{ marginTop: 20 }}>
          <div className="pagehead__row" style={{ alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <h2 className="pagehead__title" style={{ fontSize: 20, margin: 0 }}>
              มอนคุ้มสุดช่วงเลเวล {Math.max(1, level - range)}–{level + range}
            </h2>
            <CVariantToggle mode="nav" navShow={showC} navHrefShow={resultsHref(true)} navHrefHide={resultsHref(false)} />
          </div>
          {/* The search box takes a level only, so the range is changed here. */}
          <form className="farmrefine" action="/#results">
            {showC && <input type="hidden" name="c" value="1" />}
            <label>เลเวล <input className="mono" type="number" name="level" defaultValue={level} inputMode="numeric" /></label>
            <label>± <input className="mono" type="number" name="range" defaultValue={range} inputMode="numeric" /></label>
            <button type="submit" className="btn">ค้นใหม่</button>
          </form>
          <FarmingTable rows={rows} />
        </div>
      )}

      <RecentlyViewed />

      {/* Tools beside what the site added lately (owner's pick C, 26 Oct
          2026): 85% of homepage views are returning players (GA4), so the
          page is a board to jump from, not a tour. The tiles replace the four
          MODE cards and the build strip, which overlapped (two drop searches,
          three ways into one leveling tool). */}
      <div className="board">
        <section aria-labelledby="board-tools">
          <h2 id="board-tools" className="board__h mono">▶ TOOLS</h2>
          <HomeTools />
        </section>
        <section className="siteupd" aria-labelledby="siteupd-h">
          <h2 id="siteupd-h" className="siteupd__title">ใหม่ในเว็บ</h2>
          <ul className="siteupd__list">
            {(siteUpdates.items as { date: string; href: string; title: string; note: string }[]).slice(0, 4).map((u) => (
              <li key={u.href + u.date}>
                {Date.now() - Date.parse(`${u.date}T00:00:00+07:00`) < 3 * 86400000 && <span className="newbadge">NEW!</span>}
                <Link href={u.href}><strong>{u.title}</strong></Link>
                <span className="muted"> · {u.note}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <NowPlaying live={splitNews(Date.now()).live} now={Date.now()} moreHref="/news" />

      <SiteStats stats={stats} />
      {/* Freshness badge, not a trust claim (user, 2 Sep): computed live from
          updated_at, so it can only ever say something true. */}
      {lastUpdated && (
        <p className="muted" style={{ marginTop: 8 }}>
          ข้อมูลอัปเดตล่าสุด {timeAgoTh(lastUpdated)}
        </p>
      )}

      {/* Explore row: the database sections the tiles do not cover. Chips,
          quieter than the tiles. No counts: SiteStats above carries them. */}
      <div className="explorerow">
        <Link href="/database/monsters" className="chiplink">มอนสเตอร์</Link>
        <Link href="/database/cards" className="chiplink">การ์ด</Link>
        <Link href="/database/costumes" className="chiplink">คอสตูม</Link>
        <Link href="/database/items" className="chiplink">ไอเทม</Link>
        <Link href="/database/quests" className="chiplink">เควสแปลไทย</Link>
        <Link href="/database/world-map" className="chiplink">แผนที่โลก</Link>
        <Link href="/database/skills" className="chiplink">สกิล</Link>
        {/* ตารางธาตุ was orphaned (only reachable from monster-page footers)
            while its Thai keyword has no Zero-specific competitor (SXO audit). */}
        <Link href="/guides/elements" className="chiplink">ตารางธาตุ</Link>
        <Link href="/guides" className="chiplink">ไกด์ทั้งหมด</Link>
      </div>
    </main>
  );
}
