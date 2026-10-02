'use client';

// The guide list on /guides (owner's mix of three drafts, 2 Oct 2026): a
// search box with world tabs beside it (draft C), and each group as a
// "world" of stage-select tiles (draft A). The page renders every tile on
// the server; typing only hides the ones that do not match, so the list is
// whole without script.

import Link from 'next/link';
import { useState } from 'react';
import { matches } from '@/lib/smart-search';

export interface GuideTile {
  href: string;
  label: string;
  title: string;
  blurb: string;
  icon: string;
  isNew: boolean;
}

export interface GuideWorld {
  name: string;
  en: string;
  slug: string;
  guides: GuideTile[];
}

export default function GuideBrowser({ worlds }: { worlds: GuideWorld[] }) {
  const [q, setQ] = useState('');
  const needle = q.trim();
  const hit = (g: GuideTile) => !needle || [g.label, g.title, g.blurb].some((t) => matches(t, needle));
  const shown = worlds.map((w) => ({ ...w, guides: w.guides.filter(hit) }));
  const total = shown.reduce((n, w) => n + w.guides.length, 0);

  return (
    <>
      <div className="gbar">
        <label className="gbar__search">
          <span aria-hidden="true">🔍</span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ค้นหาไกด์ เช่น หมวก, MVP, ทำยา"
            aria-label="ค้นหาไกด์"
          />
        </label>
        <nav className="gbar__tabs" aria-label="ไปที่กลุ่ม">
          {shown.map((w) => (
            <a key={w.slug} href={`#${w.slug}`} className="gtab" data-g={w.slug} aria-disabled={w.guides.length === 0}>
              {w.en} · {w.name} <small>{w.guides.length}</small>
            </a>
          ))}
        </nav>
      </div>

      {total === 0 && (
        <p className="gnone">
          NO MATCH · ไม่มีไกด์ที่ตรงกับ “{needle}” ลองคำอื่น หรือใช้{' '}
          <Link href="/drop-finder">ค้นของดรอป</Link>
        </p>
      )}

      {shown.map((w, wi) =>
        w.guides.length === 0 ? null : (
          <section key={w.slug} id={w.slug} className="gworld" data-g={w.slug}>
            <h2 className="gworld__title">
              WORLD {wi + 1} · {w.name}
            </h2>
            <div className="gworld__grid">
              {w.guides.map((g) => {
                const stage = worlds[wi].guides.indexOf(g) + 1;
                return (
                  <Link key={g.href} href={g.href} className="gtile">
                    <span className="gtile__num" aria-hidden="true">
                      {wi + 1}-{stage}
                    </span>
                    <img className="gtile__icon" src={g.icon} alt="" width={48} height={48} loading="lazy" />
                    <b className="gtile__name">
                      {g.label}
                      {g.isNew && <span className="newbadge">NEW!</span>}
                    </b>
                    <span className="gtile__blurb">{g.blurb}</span>
                  </Link>
                );
              })}
            </div>
          </section>
        ),
      )}
    </>
  );
}
