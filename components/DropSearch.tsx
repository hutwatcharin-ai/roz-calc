'use client';

// components/DropSearch.tsx
//
// The drop finder's search and answer (rebuilt 6 Oct 2026, owner: "lots of
// people use it and it looks plain"). The answer is "where do I farm this",
// not a list of rates: rows come ranked by items per clear of the best open
// map (lib/drop-rank), each saying how many kills one item takes, where the
// monster stands thickest, and whether it attacks first. A level typed once
// (kept with the site's other tool numbers) fades monsters far enough away
// that the drop rate drops.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import MonsterLink from '@/components/MonsterLink';
import TrackSearch from '@/components/TrackSearch';
import AggroBadge from '@/components/AggroBadge';
import CVariantToggle from '@/components/CVariantToggle';
import SuggestInput from '@/components/SuggestInput';
import { isCVariant } from '@/lib/c-variant';
import { dropPenalty, DROP_PENALTY_LABELS } from '@/lib/drop-penalty';
import { readPlayerNumbers, writePlayerNumbers } from '@/lib/player-numbers';
import type { BestMap } from '@/lib/drop-rank';

interface DropRow {
  monster_id: number;
  monster_name: string;
  monster_image_url?: string | null;
  monster_level: number | null;
  is_aggressive: boolean | null;
  atk_max: number | null;
  rate: number | null;
  best?: BestMap | null;
  perClear?: number | null;
  killsPerItem?: number | null;
  closed?: boolean;
}

interface Choice {
  id: number;
  name_en: string;
  slots?: number | null;
  icon_url?: string | null;
}

const RANKS = ['1ST', '2ND', '3RD'];

function perClearText(n: number): string {
  if (n >= 1) return `≈ ${Number(n.toFixed(1))} ชิ้น/รอบ`;
  return `≈ 1 ชิ้นต่อ ${Math.round(1 / n)} รอบ`;
}

export default function DropSearch({
  query,
  resolvedName,
  resolvedId,
  rows,
  choices = [],
}: {
  query: string;
  resolvedName?: string | null;
  resolvedId?: number | null;
  rows: DropRow[];
  choices?: Choice[];
}) {
  const [level, setLevel] = useState<number | null>(null);
  useEffect(() => {
    try {
      setLevel(readPlayerNumbers(window.localStorage).level ?? null);
    } catch {
      // Blocked site data: no level, no fading.
    }
  }, []);
  function saveLevel(raw: string) {
    const n = Math.max(0, Math.min(99, Number(raw) || 0));
    setLevel(n || null);
    try {
      const prev = readPlayerNumbers(window.localStorage);
      writePlayerNumbers(window.localStorage, { ...prev, level: n || undefined });
    } catch {
      // Not remembering it does not stop it working on this page.
    }
  }

  return (
    <div className="card card--pink dropfind">
      {/* An unresolved item is a search with no result, whatever rows says. */}
      <TrackSearch term={query} count={resolvedName ? rows.length : 0} />
      {!query && <p className="dropfind__insert" aria-hidden="true">▶ INSERT ITEM</p>}
      <form className="dropfind__form">
        <SuggestInput
          src="/suggest/drops"
          look="icon"
          heading="SELECT ITEM"
          listLabel="ไอเทมที่มีมอนดรอป"
          placeholder="เช่น Elunium, Steel, หินโอริ"
          defaultValue={query}
        />
        <button type="submit" className="btn">ค้นหา</button>
      </form>
      <label className="dropfind__lv">
        เลเวลคุณ
        <input
          className="mono"
          type="number"
          inputMode="numeric"
          min={1}
          max={99}
          value={level ?? ''}
          placeholder="—"
          onChange={(e) => saveLevel(e.target.value)}
        />
        <span className="muted">ใส่แล้วมอนที่ห่างเกิน 19 เลเวลจะขึ้นจาง (ดรอปอาจโดนหัก)</span>
      </label>

      {choices.length > 0 && (
        <div className="dropfind__choices">
          <p className="muted">เจอ {choices.length} ไอเทมที่มีมอนดรอป เลือกตัวที่ต้องการ</p>
          <ul>
            {choices.map((c) => (
              <li key={c.id}>
                <a href={`/drop-finder?id=${c.id}`}>
                  {c.icon_url && <img src={c.icon_url} alt="" width={24} height={24} />}
                  {c.name_en}
                  {(c.slots ?? 0) > 0 && <span className="mono"> [{c.slots}]</span>}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      {query && !resolvedName && choices.length === 0 && <p style={{ color: 'var(--faint)' }}>ไม่พบไอเทมนี้</p>}
      {resolvedName && (
        <p style={{ marginTop: 10, fontSize: 13, color: 'var(--dim)' }}>
          ผลลัพธ์สำหรับ:{' '}
          {resolvedId ? (
            <Link href={`/database/items/${resolvedId}`} className="mono" style={{ color: 'var(--pink)', fontWeight: 700 }}>
              {resolvedName}
            </Link>
          ) : (
            <b className="mono" style={{ color: 'var(--pink)' }}>{resolvedName}</b>
          )}
          {rows.length > 0 && <span> · เรียงจากตัวที่ได้ของเร็วสุดเมื่อกวาดแมพที่มีมันเยอะสุด 1 รอบ</span>}
        </p>
      )}
      {resolvedName && rows.length === 0 && (
        <p style={{ color: 'var(--faint)' }}>ไอเทมนี้ไม่มีมอนสเตอร์ตัวไหนดรอป</p>
      )}
      {/* Same rule as every other monster surface: Challenge clones hidden by
          default, one checkbox to reveal. */}
      {rows.some((row) => isCVariant(row.monster_name)) && <CVariantToggle mode="local" />}
      {rows.length > 0 && (
        <p className="dropfind__board" aria-hidden="true">
          <span>HI-SCORE</span> ฟาร์มตัวไหนได้ของเร็วสุด
        </p>
      )}
      <ol className="dropfind__rows">
        {rows.map((row, i) => {
          // Rank among the rows shown by default: Challenge clones are hidden
          // until toggled, and a hidden clone must not take the 1ST slot.
          const c = isCVariant(row.monster_name);
          const index = c ? -1 : rows.slice(0, i).filter((r) => !isCVariant(r.monster_name)).length;
          const penalty = level && row.monster_level !== null ? dropPenalty(level, row.monster_level) : 'none';
          const far = penalty !== 'none';
          return (
            <li
              key={row.monster_id}
              className={[c ? 'cvariant' : '', row.closed ? 'is-closed' : '', far ? 'is-far' : '', index >= 0 && index < 3 ? `is-rank${index + 1}` : ''].filter(Boolean).join(' ') || undefined}
            >
              <span className="dropfind__rank mono" aria-hidden="true">
                {index === 0 && !row.closed && <i>▶</i>}
                {index < 0 ? 'C' : RANKS[index] ?? `${index + 1}TH`}
              </span>
              <span className="dropfind__who">
                {row.monster_image_url && (
                  <img loading="lazy" decoding="async" src={row.monster_image_url} alt="" width={28} height={28} />
                )}
                <span>
                  <MonsterLink id={row.monster_id} name={row.monster_name} />
                  {row.monster_level !== null && <span className="muted"> Lv.{row.monster_level}</span>}{' '}
                  <AggroBadge monster={{ is_aggressive: row.is_aggressive, atk_max: row.atk_max }} />
                  <small className="dropfind__where">
                    {row.closed ? (
                      'ยังไม่มีในเกม (แมพยังไม่เปิด)'
                    ) : row.best ? (
                      <>
                        เยอะสุดที่ <Link href={`/database/maps/${encodeURIComponent(row.best.code)}`}>{row.best.name}</Link>
                        {row.best.amount ? ` · ${row.best.amount} ตัว` : ' · ไม่ทราบจำนวน'}
                      </>
                    ) : (
                      'ไม่ทราบแมพ'
                    )}
                    {far && ` · ${DROP_PENALTY_LABELS[penalty]}`}
                  </small>
                </span>
              </span>
              <span className="dropfind__nums">
                {row.perClear && !row.closed && <span className="dropfind__score mono">{perClearText(row.perClear)}</span>}
                <span className="dropgauge">
                  {row.rate != null && (
                    <span
                      className="dropgauge__bar"
                      style={{ ['--fill' as string]: Math.min(1, Math.max(0.04, (Math.log10(row.rate) + 2) / 4)) }}
                      aria-hidden="true"
                    />
                  )}
                  <span className="mono dropfind__rate">{row.rate != null ? `${row.rate}%` : '?'}</span>
                </span>
                {row.killsPerItem && <small>ฆ่า ~{row.killsPerItem.toLocaleString('en-US')} ตัว/ชิ้น</small>}
              </span>
            </li>
          );
        })}
      </ol>
      {rows.length > 0 && (
        <p className="muted" style={{ marginTop: 10, fontSize: 12.5 }}>
          &quot;รอบ&quot; คือฆ่ามอนตัวนั้นครบทุกตัวในแมพ 1 ครั้ง · อยากรู้เป็นชิ้นต่อชั่วโมง ใช้{' '}
          <Link href="/tools/leveling-spots">หาจุดฟาร์ม</Link> ที่คิดจากความเร็วฆ่าของคุณ
        </p>
      )}
    </div>
  );
}
