'use client';

// The FAQ as something to search and open (owner, 8 Oct 2026: "easier to
// read, nicer"). Topic tiles across the top, a search over the questions,
// and each question a card that opens to its answer. The answers are
// rendered on the server and handed in, so they are in the HTML for search
// engines and readers without JavaScript -- closed <details> still carry them.

import { useMemo, useState, type ReactNode } from 'react';

export interface FaqItem {
  q: string;
  a: ReactNode;
  unsure?: boolean;
  /** Extra words people type for this question (Thai slang, English terms). */
  k?: string;
}
export interface FaqGroup {
  id: string;
  title: string;
  icon: string;
  items: FaqItem[];
}

export default function FaqBrowser({ groups }: { groups: FaqGroup[] }) {
  const [q, setQ] = useState('');
  const [only, setOnly] = useState('');
  const [openAll, setOpenAll] = useState(false);
  const needle = q.trim().toLowerCase();

  const shown = useMemo(
    () =>
      groups
        .filter((g) => !only || g.id === only)
        .map((g) => ({ ...g, items: g.items.filter((it) => !needle || `${it.q} ${it.k ?? ''} ${g.title}`.toLowerCase().includes(needle)) }))
        .filter((g) => g.items.length > 0),
    [groups, only, needle],
  );
  const total = shown.reduce((n, g) => n + g.items.length, 0);

  return (
    <div className="faqb">
      <div className="faqb__search">
        <input type="search" value={q} placeholder="พิมพ์คำถาม เช่น ตีบวก บอท รีเซ็ต ขายของ" aria-label="ค้นคำถาม" onChange={(e) => setQ(e.target.value)} />
        <button type="button" className="faqb__all" onClick={() => setOpenAll((v) => !v)}>{openAll ? 'ปิดทั้งหมด' : 'เปิดคำตอบทั้งหมด'}</button>
      </div>

      <div className="faqb__tiles" role="tablist" aria-label="หมวดคำถาม">
        <button type="button" role="tab" aria-selected={only === ''} className={`faqb__tile${only === '' ? ' is-on' : ''}`} onClick={() => setOnly('')}>
          <span className="faqb__tileicon mono">ALL</span>
          <b>ทุกหมวด</b>
          <small>{groups.reduce((n, g) => n + g.items.length, 0)} ข้อ</small>
        </button>
        {groups.map((g) => (
          <button key={g.id} type="button" role="tab" aria-selected={only === g.id} className={`faqb__tile${only === g.id ? ' is-on' : ''}`} onClick={() => setOnly(only === g.id ? '' : g.id)}>
            <img src={g.icon} alt="" width={28} height={28} />
            <b>{g.title}</b>
            <small>{g.items.length} ข้อ</small>
          </button>
        ))}
      </div>

      {total === 0 && <p className="faqb__none">ไม่เจอคำถามที่ตรงกับ &ldquo;{q}&rdquo; · ลองคำสั้นลง หรือดู <a href="/guides">ไกด์ทั้งหมด</a></p>}

      {shown.map((g) => (
        <section key={g.id} id={g.id} className="faqb__group">
          <h2 className="faqb__h">
            <img src={g.icon} alt="" width={24} height={24} />
            {g.title}
          </h2>
          {g.items.map((it) => (
            <details key={it.q} className="faqb__qa" open={openAll || (needle !== '' && total <= 3) || undefined}>
              <summary>
                <span className="faqb__q mono" aria-hidden="true">Q</span>
                <span className="faqb__qt">{it.q}</span>
                {it.unsure && <span className="faqb__unsure">ยังไม่ยืนยัน</span>}
              </summary>
              <div className="faqb__a">
                <span className="faqb__ab mono" aria-hidden="true">A</span>
                <div>{it.a}</div>
              </div>
            </details>
          ))}
        </section>
      ))}
    </div>
  );
}
