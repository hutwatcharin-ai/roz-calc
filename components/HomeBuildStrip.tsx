'use client';

// The build simulator on the homepage: a strip under the hero (owner, 7 Oct
// 2026). One primary action. A first visit sees what the tool answers and a
// start button; a player with saved builds sees how many and the latest, with
// a way to open it or start over.
//
// The owner picked this over a row of 13 class buttons, which read as busy
// and left a new player wondering what the buttons did.
//
// Reads the list of builds the player saved (owner, 7 Oct 2026), not the
// build the simulator keeps open between visits: a player who deleted every
// saved build expects the homepage to have nothing of theirs to show.
//
// Deliberately light: no simulator code or gear data comes to the homepage.
// A saved build's class and level are read straight out of its share-link
// encoding (base64 JSON).

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { track } from '@/lib/analytics';

// BuildSimulator SAVED_KEY, written out so that module stays off this page.
const SAVED_KEY = 'roz-calc:builds';

interface Saved {
  count: number;
  name: string;
  cls: string | null;
  lv: number | null;
}

const className = (slug: string) => slug.charAt(0).toUpperCase() + slug.slice(1);

function peek(b: string): { cls: string | null; lv: number | null } {
  try {
    const raw = JSON.parse(decodeURIComponent(escape(atob(b.replace(/-/g, '+').replace(/_/g, '/')))));
    return { cls: typeof raw.cls === 'string' ? raw.cls : null, lv: Number(raw.lv) || null };
  } catch {
    return { cls: null, lv: null };
  }
}

export default function HomeBuildStrip({ newHref }: { newHref: string }) {
  const [saved, setSaved] = useState<Saved | null>(null);

  useEffect(() => {
    try {
      const list = JSON.parse(window.localStorage.getItem(SAVED_KEY) ?? '[]');
      const ok = Array.isArray(list) ? list.filter((x) => x && typeof x.name === 'string' && typeof x.b === 'string') : [];
      if (!ok.length) return;
      // The simulator puts the newest save first.
      setSaved({ count: ok.length, name: ok[0].name, ...peek(ok[0].b) });
    } catch {
      // Blocked storage: the strip works as for a first visit.
    }
  }, []);

  // public/images/jobs has every class but Novice.
  const sprite = saved?.cls && saved.cls !== 'novice' ? saved.cls : 'knight';

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
            บิลด์ที่คุณบันทึกไว้ {saved.count} อัน · ล่าสุด: <b>{saved.name}</b>
            {saved.cls && <> ({className(saved.cls)}{saved.lv ? ` Lv ${saved.lv}` : ''})</>}
          </p>
        ) : (
          <p className="homebuild__lead">อัปสเตตัส ใส่ของ เลือกมอน แล้วดูว่าตีโดนกี่ % หลบได้กี่ % ตีกี่ทีตาย</p>
        )}
      </div>
      <div className="homebuild__act">
        <Link
          href={saved ? `/tools/build?${new URLSearchParams({ open: saved.name })}` : '/tools/build'}
          className="homebuild__go"
          onClick={() => track('home_build_click', { kind: saved ? 'resume' : 'start', cls: saved?.cls ?? '' })}
        >
          {saved ? 'เปิดบิลด์ล่าสุด' : 'เริ่มจำลองบิลด์'} <span aria-hidden="true">▶</span>
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
