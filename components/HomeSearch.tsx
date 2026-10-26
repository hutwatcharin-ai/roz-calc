'use client';
// The homepage's one search box (owner's pick C, 26 Oct 2026): a number is a
// level and opens the farming ranking on this page, anything else is an item
// name for the drop finder. Without JS the form still reaches the drop finder.
// Reports which way each search went (GA4 home_search).
import { track } from '@/lib/analytics';

export default function HomeSearch() {
  return (
    <form
      className="homehero__search"
      action="/drop-finder"
      role="search"
      onSubmit={(e) => {
        const q = new FormData(e.currentTarget).get('q')?.toString().trim() ?? '';
        const level = /^\d{1,3}$/.test(q) ? Number(q) : 0;
        track('home_search', { kind: level ? 'level' : 'drop' });
        if (level) {
          e.preventDefault();
          window.location.href = `/?level=${level}&range=10#results`;
        }
      }}
    >
      <input type="search" name="q" placeholder="เลเวล เช่น 45 หรือชื่อของ เช่น Jellopy" aria-label="ใส่เลเวลเพื่อดูมอนคุ้มสุด หรือชื่อของเพื่อดูมอนที่ดรอป" />
      <button type="submit" className="btn">ค้นหา</button>
    </form>
  );
}
