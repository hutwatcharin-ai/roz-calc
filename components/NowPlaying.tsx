// NOW PLAYING (2 Oct 2026): the running events and the newest patch as one
// block -- on the homepage under the MODE cards, and at the top of /news.
// Reads lib/news, so it changes itself when an event ends.

import Link from 'next/link';
import { TIMELINE, daysLeft, type NewsItem } from '@/lib/news';

const KIND_TAG: Record<NewsItem['kind'], string> = { event: 'EVENT', patch: 'PATCH', timeline: 'TIMELINE' };

function SideCard({ item, now }: { item: NewsItem; now: number }) {
  const left = daysLeft(item, now);
  const tag =
    item.kind === 'event' && item.endsTh
      ? `EVENT · ถึง ${item.endsTh}`
      : item.dateTh
        ? `${KIND_TAG[item.kind]} · ${item.dateTh}`
        : KIND_TAG[item.kind];
  return (
    <Link href={item.href} className="nowcard" data-kind={item.kind}>
      <span className="nowcard__badge" aria-hidden="true">
        {item.badge ?? (item.kind === 'timeline' ? '⏱' : item.kind === 'event' ? '★' : '▲')}
      </span>
      <span>
        <span className="nowcard__tag">{tag}</span>
        <b className="nowcard__title">{item.title}</b>
        <span className="nowcard__blurb">
          {item.blurb}
          {left !== null && ` · เหลือ ${left} วัน`}
        </span>
      </span>
    </Link>
  );
}

export default function NowPlaying({ live, now, moreHref }: { live: NewsItem[]; now: number; moreHref?: string }) {
  const lead = live.find((n) => n.cast?.length) ?? live[0];
  if (!lead) return null;
  const side = [...live.filter((n) => n !== lead), TIMELINE].slice(0, 3);
  const left = daysLeft(lead, now);
  return (
    <section className="nowplay" aria-labelledby="nowplay-h">
      <div className="nowplay__head">
        <h2 id="nowplay-h" className="nowplay__title">▶ NOW PLAYING · ข่าวและกิจกรรม</h2>
        {moreHref && (
          <Link href={moreHref} className="nowplay__more">
            ดูข่าวทั้งหมด →
          </Link>
        )}
      </div>
      <div className="nowplay__grid">
        <Link href={lead.href} className="nowlead">
          {lead.cast && (
            <span className="nowlead__cast" aria-hidden="true">
              {lead.cast.map((src) => (
                <img key={src} src={src} alt="" loading="lazy" />
              ))}
            </span>
          )}
          <span className="nowlead__live">{lead.kind === 'event' ? 'กำลังจัด' : 'ใหม่'}</span>
          <b className="nowlead__title">{lead.title}</b>
          <span className="nowlead__blurb">{lead.blurb}</span>
          <span className="nowlead__meta">
            {left !== null && (
              <span className="nowlead__cd">
                ⏳ เหลือ {left} วัน{lead.endsTh ? ` · ถึง ${lead.endsTh}` : ''}
              </span>
            )}
            <span className="nowlead__go">{lead.kind === 'event' ? 'อ่านวิธีทำ →' : 'อ่านสรุป →'}</span>
          </span>
        </Link>
        <div className="nowplay__side">
          {side.map((item) => (
            <SideCard key={item.href} item={item} now={now} />
          ))}
        </div>
      </div>
    </section>
  );
}
