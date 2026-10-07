'use client';

// The build simulator on the homepage: a strip under the hero (owner, 7 Oct
// 2026). One primary action -- start, or carry on with the build this browser
// already has -- and a row of second jobs that open the simulator with a
// guide build and a monster to test it on.
//
// Deliberately light: no simulator code or gear data comes to the homepage.
// The saved build is read as raw JSON (class and level only) and its numbers
// from the player-numbers record the simulator writes for the other tools.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { readPlayerNumbers } from '@/lib/player-numbers';
import { track } from '@/lib/analytics';
import type { HomeBuildClass } from '@/lib/home-build';

// lib/build-calc BUILD_KEY, written out so that module stays off this page.
const BUILD_KEY = 'roz-calc:build';

interface Saved {
  cls: string;
  name: string;
  lv: number;
  hit?: number;
  flee?: number;
  aspd?: number;
}

export default function HomeBuildStrip({ classes, newHref, variant = 'a' }: { classes: HomeBuildClass[]; newHref: string; variant?: 'a' | 'b' }) {
  const [saved, setSaved] = useState<Saved | null>(null);
  const [shown, setShown] = useState<string>('knight');

  useEffect(() => {
    try {
      const raw = JSON.parse(window.localStorage.getItem(BUILD_KEY) ?? 'null');
      if (!raw || typeof raw.cls !== 'string') return;
      const n = readPlayerNumbers(window.localStorage);
      const cls = classes.find((c) => c.cls === raw.cls);
      setSaved({ cls: raw.cls, name: cls?.name ?? raw.cls.charAt(0).toUpperCase() + raw.cls.slice(1), lv: Number(raw.lv) || 1, hit: n.hit, flee: n.flee, aspd: n.aspd });
      setShown(raw.cls);
    } catch {
      // Blocked storage: the strip works as for a first visit.
    }
  }, [classes]);

  const sprite = (cls: string) => `/images/jobs/${cls}.png`;

  const tag = variant === 'b' ? 'homebuild homebuild--b' : 'homebuild homebuild--a';
  return (
    <section className={tag} aria-labelledby="homebuild-h">
      <div className="homebuild__stage" aria-hidden="true">
        <img key={shown} className="homebuild__sprite" src={sprite(shown)} alt="" width={96} height={96} />
      </div>
      <div className="homebuild__body">
        <p className="homebuild__kicker mono">▶ BUILD SIMULATOR</p>
        <h2 id="homebuild-h" className="homebuild__title">จำลองบิลด์<span> ลองก่อนลงแต้มจริง</span></h2>
        {saved ? (
          <p className="homebuild__saved">
            บิลด์ล่าสุดที่เว็บจำไว้ในเครื่องนี้: <b>{saved.name} Lv {saved.lv}</b>
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
      {variant === 'b' && (
        <div className="homebuild__samples">
          <p className="homebuild__samplelabel">หรือเริ่มจากบิลด์ตัวอย่างในไกด์ (พร้อมมอนให้ลองตี):</p>
          <ul className="homebuild__classes">
            {classes.map((c) => (
              <li key={c.cls}>
                <Link
                  href={c.href}
                  title={[`${c.name} Lv ${c.level}`, c.target ? `ตี ${c.target}` : null, c.note].filter(Boolean).join(' · ')}
                  onMouseEnter={() => setShown(c.cls)}
                  onFocus={() => setShown(c.cls)}
                  onClick={() => track('home_build_click', { kind: 'class', cls: c.cls })}
                >
                  <img src={sprite(c.cls)} alt="" width={28} height={28} loading="lazy" />
                  <span>{c.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
