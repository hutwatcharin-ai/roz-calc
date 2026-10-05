'use client';

// The /admin/monsters list (owner, 5 Oct 2026). One click per monster:
// "ตีก่อน" or "ไม่ตีก่อน", saved at once, undoable from the side list. Opens
// on the monsters with no answer yet, lowest level first, with the open maps
// to test them on.

import { useEffect, useMemo, useState } from 'react';
import { matches } from '@/lib/smart-search';
import type { AggroEdit } from '@/lib/aggro-log';

export interface AggroRow {
  id: number;
  name: string;
  level: number | null;
  race: string | null;
  element: string | null;
  image: string | null;
  aggressive: boolean | null;
  /** Open maps it spawns on, by the name the game shows. */
  maps: string[];
  checkedAt: string | null;
}

const FILTERS: { key: string; label: string; test: (r: AggroRow) => boolean }[] = [
  { key: 'todo', label: 'ยังไม่รู้ · เกิดในแมพที่เปิด', test: (r) => r.aggressive === null && r.maps.length > 0 },
  { key: 'unknown', label: 'ยังไม่รู้ทั้งหมด', test: (r) => r.aggressive === null },
  { key: 'checked', label: 'กดแล้ว', test: (r) => r.checkedAt !== null },
  { key: 'all', label: 'ทุกตัว', test: () => true },
];

const SHOW = 80;
const word = (v: boolean | null) => (v === null ? 'ไม่รู้' : v ? 'ตีก่อน' : 'ไม่ตีก่อน');

export default function AggroTool({ rows: initial }: { rows: AggroRow[] }) {
  const [rows, setRows] = useState(initial);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('todo');
  const [log, setLog] = useState<AggroEdit[]>([]);
  const [busy, setBusy] = useState<number | null>(null);
  const [message, setMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    fetch('/admin/monsters/api')
      .then((r) => r.json())
      .then((d: { log: AggroEdit[] }) => setLog(d.log.slice().reverse()))
      .catch(() => {});
  }, []);

  const shown = useMemo(() => {
    const f = FILTERS.find((x) => x.key === filter) ?? FILTERS[0];
    const needle = q.trim();
    const idQuery = /^\d+$/.test(needle) ? Number(needle) : null;
    return rows
      .filter((r) => (needle ? r.id === idQuery || matches(r.name, needle) : f.test(r)))
      .sort((a, b) => (a.level ?? 0) - (b.level ?? 0) || a.name.localeCompare(b.name));
  }, [rows, q, filter]);

  const counts = useMemo(
    () => ({
      todo: rows.filter(FILTERS[0].test).length,
      unknown: rows.filter(FILTERS[1].test).length,
      checked: rows.filter(FILTERS[2].test).length,
    }),
    [rows],
  );

  async function post(body: object): Promise<AggroEdit> {
    const res = await fetch('/admin/monsters/api', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    const data = (await res.json().catch(() => ({}))) as { edit?: AggroEdit; error?: string };
    if (!res.ok || !data.edit) throw new Error(data.error ?? `HTTP ${res.status}`);
    return data.edit;
  }

  function apply(edit: AggroEdit) {
    setRows((prev) => prev.map((r) => (r.id === edit.id ? { ...r, aggressive: edit.to, checkedAt: edit.at } : r)));
    setLog((prev) => [edit, ...prev].slice(0, 200));
  }

  async function set(row: AggroRow, value: boolean | null) {
    if (row.aggressive === value) return;
    setBusy(row.id);
    try {
      const edit = await post({ action: 'set', id: row.id, value });
      apply(edit);
      setMessage({ kind: 'ok', text: `✓ ${row.name}: ${word(edit.from)} → ${word(edit.to)}` });
    } catch (e) {
      setMessage({ kind: 'err', text: `บันทึก ${row.name} ไม่สำเร็จ: ${(e as Error).message}` });
    } finally {
      setBusy(null);
    }
  }

  async function undo(edit: AggroEdit) {
    try {
      const back = await post({ action: 'undo', at: edit.at });
      apply(back);
      setMessage({ kind: 'ok', text: `ย้อน ${edit.name} กลับเป็น ${word(back.to)}` });
    } catch (e) {
      setMessage({ kind: 'err', text: (e as Error).message });
    }
  }

  const undone = new Set(log.filter((e) => e.undoOf).map((e) => e.undoOf));

  return (
    <div className="pt">
      <div className="pt__main">
        <div className="pt__bar">
          <input className="pt__search" type="search" value={q} placeholder="พิมพ์ชื่อมอนหรือ ID" aria-label="ค้นหามอน" onChange={(e) => setQ(e.target.value)} />
          <span className="pt__count mono">{shown.length} ตัว</span>
        </div>
        <div className="pt__chips" role="group" aria-label="ตัวกรอง">
          {FILTERS.map((f) => (
            <button key={f.key} type="button" className={`pt__chip${filter === f.key && !q ? ' on' : ''}`} onClick={() => { setFilter(f.key); setQ(''); }}>
              {f.label}
              {f.key in counts && ` (${counts[f.key as keyof typeof counts]})`}
            </button>
          ))}
        </div>
        {message && <p className={`pt__msg pt__msg--${message.kind}`}>{message.text}</p>}

        <ul className="pt__list">
          {shown.slice(0, SHOW).map((r) => (
            <li key={r.id} className="pt__row ag__row" data-aggro={r.aggressive === null ? 'unknown' : r.aggressive ? 'yes' : 'no'}>
              <span className="ag__sprite">{r.image && <img src={r.image} alt="" loading="lazy" />}</span>
              <span className="pt__name">
                <b>{r.name}</b>
                <small className="mono">
                  #{r.id} · Lv {r.level ?? '—'} · {r.race ?? '—'} · {r.element ?? '—'}
                </small>
              </span>
              <span className="ag__maps">{r.maps.length ? r.maps.slice(0, 3).join(' · ') : <em>ไม่เกิดในแมพที่เปิด</em>}</span>
              <span className="ag__btns">
                <button type="button" className={`ag__btn ag__btn--yes${r.aggressive === true ? ' on' : ''}`} disabled={busy === r.id} onClick={() => void set(r, true)}>
                  ตีก่อน
                </button>
                <button type="button" className={`ag__btn ag__btn--no${r.aggressive === false ? ' on' : ''}`} disabled={busy === r.id} onClick={() => void set(r, false)}>
                  ไม่ตีก่อน
                </button>
                {r.aggressive !== null && (
                  <button type="button" className="ag__btn ag__btn--clear" disabled={busy === r.id} onClick={() => void set(r, null)} title="กลับเป็นไม่มีข้อมูล">
                    ?
                  </button>
                )}
              </span>
            </li>
          ))}
        </ul>
        {shown.length > SHOW && <p className="muted">แสดง {SHOW} ตัวแรก พิมพ์ค้นหาให้แคบลง</p>}
        {shown.length === 0 && <p className="muted">ไม่มีตัวที่ต้องกดแล้ว</p>}
      </div>

      <aside className="pt__side">
        <h2 className="pt__sidehead">กดล่าสุด</h2>
        <ol className="pt__log">
          {log.slice(0, 25).map((e) => (
            <li key={e.at}>
              <span>
                <b>{e.name}</b> <span className="mono">{word(e.from)} → {word(e.to)}</span>
                {e.undoOf && <em> (ย้อน)</em>}
              </span>
              {!e.undoOf && !undone.has(e.at) && (
                <button type="button" className="pt__undo" onClick={() => void undo(e)}>
                  ย้อน
                </button>
              )}
            </li>
          ))}
          {log.length === 0 && <li className="muted">ยังไม่มี</li>}
        </ol>
      </aside>
    </div>
  );
}
