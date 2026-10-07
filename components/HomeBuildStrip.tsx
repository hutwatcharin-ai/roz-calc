'use client';

// The build simulator on the homepage: a strip under the hero (owner, 7 Oct
// 2026). One primary action. A first visit sees what the tool answers and a
// start button; a returning visitor is told the site remembered their last
// build in this browser, with a way to open it or start over.
//
// The owner picked this over a row of 13 class buttons, which read as busy
// and left a new player wondering what the buttons did. Sample builds stay
// one step in, in the simulator's own "load a build" list.
//
// Deliberately light: no simulator code or gear data comes to the homepage.
// The saved build is read as raw JSON (class and level only) and its numbers
// from the player-numbers record the simulator writes for the other tools.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { readPlayerNumbers } from '@/lib/player-numbers';
import { track } from '@/lib/analytics';

// lib/build-calc BUILD_KEY, written out so that module stays off this page.
const BUILD_KEY = 'roz-calc:build';

interface Saved {
  cls: string;
  lv: number;
  hit?: number;
  flee?: number;
}

const className = (slug: string) => slug.charAt(0).toUpperCase() + slug.slice(1);

export default function HomeBuildStrip({ newHref }: { newHref: string }) {
  const [saved, setSaved] = useState<Saved | null>(null);

  useEffect(() => {
    try {
      const raw = JSON.parse(window.localStorage.getItem(BUILD_KEY) ?? 'null');
      if (!raw || typeof raw.cls !== 'string') return;
      const n = readPlayerNumbers(window.localStorage);
      setSaved({ cls: raw.cls, lv: Number(raw.lv) || 1, hit: n.hit, flee: n.flee });
    } catch {
      // Blocked storage: the strip works as for a first visit.
    }
  }, []);

  // public/images/jobs has every class but Novice.
  const sprite = saved && saved.cls !== 'novice' ? saved.cls : 'knight';

  return (
    <section className="homebuild" aria-labelledby="homebuild-h">
      <div className="homebuild__stage" aria-hidden="true">
        <img key={sprite} className="homebuild__sprite" src={`/images/jobs/${sprite}.png`} alt="" width={84} height={84} />
      </div>
      <div className="homebuild__body">
        <p className="homebuild__kicker mono">▶ BUILD SIMULATOR</p>
        <h2 id="homebuild-h" className="homebuild__title">จำลองบิลด์<span> ลองก่อนลงแต้มจริง</span></h2>
        {saved ? (
          <p className="homebuild__saved">
            บิลด์ล่าสุดที่เว็บจำไว้ในเครื่องนี้: <b>{className(saved.cls)} Lv {saved.lv}</b>
            {saved.hit ? <> · HIT <b className="mono">{saved.hit}</b></> : null}
            {saved.flee ? <> · FLEE <b className="mono">{saved.flee}</b></> : null}
          </p>
        ) : (
          <p className="homebuild__lead">อัปสเตตัส ใส่ของ เลือกมอน แล้วดูว่าตีโดนกี่ % หลบได้กี่ % ตีกี่ทีตาย</p>
        )}
      </div>
      <div className="homebuild__act">
        <Link
          href="/tools/build"
          className="homebuild__go"
          onClick={() => track('home_build_click', { kind: saved ? 'resume' : 'start', cls: saved?.cls ?? '' })}
        >
          {saved ? 'เปิดบิลด์นี้ต่อ' : 'เริ่มจำลองบิลด์'} <span aria-hidden="true">▶</span>
        </Link>
        {saved && (
          <Link href={newHref} className="homebuild__new" onClick={() => track('home_build_click', { kind: 'new', cls: '' })}>
            หรือเริ่มบิลด์ใหม่
          </Link>
        )}
      </div>
    </section>
  );
}
