'use client';

// The /admin/prices list (owner, 5 Oct 2026). Built to be used with one hand
// on the keyboard between trips to an NPC: type a name, Enter picks the top
// row and jumps to its price box, Enter saves and jumps back to the search.
// "150/50" is read as a stack total over its count (lib/admin). The smaller
// box beside it is the NPC shop (buy) price, filled mostly from screenshots
// of the shop window.

import { useEffect, useMemo, useRef, useState } from 'react';
import { halfOfBuy, parsePriceInput } from '@/lib/admin';
import { matches } from '@/lib/smart-search';
import type { PriceEdit } from '@/lib/price-log';
import SellShotReader from '@/components/SellShotReader';

export interface PriceRow {
  id: number;
  name: string;
  aka: string[];
  category: string;
  icon: string | null;
  buy: number | null;
  sell: number | null;
  /** Card slots, so two copies of one weapon can be told apart. */
  slots: number;
  checkedAt: string | null;
}

type Status = 'missing' | 'zero' | 'odd' | 'ok';

function statusOf(row: PriceRow): Status {
  if (row.sell === null) return 'missing';
  if (row.sell === 0) return 'zero';
  const half = halfOfBuy(row.buy);
  if (half !== null && row.sell !== half) return 'odd';
  return 'ok';
}

const STATUS_LABEL: Record<Status, string> = {
  missing: 'ไม่มีข้อมูล',
  zero: 'ราคา 0',
  odd: 'ไม่ตรงครึ่งราคาซื้อ',
  ok: 'ปกติ',
};

const GROUPS: { key: string; label: string; test: (c: string) => boolean }[] = [
  { key: '', label: 'ทั้งหมด', test: () => true },
  { key: 'weapon', label: 'อาวุธ', test: (c) => c === 'Weapon' },
  { key: 'armor', label: 'สวมใส่', test: (c) => c === 'Armor' },
  { key: 'costume', label: 'คอสตูม', test: (c) => c === 'Costume Equipment' },
  { key: 'card', label: 'การ์ด', test: (c) => c === 'Card' },
  { key: 'use', label: 'ยา/ของกิน', test: (c) => c === 'Consumable / Recovery' },
  { key: 'other', label: 'อื่นๆ', test: (c) => !['Weapon', 'Armor', 'Costume Equipment', 'Card', 'Consumable / Recovery'].includes(c) },
];

const STATUS_FILTERS: { key: string; label: string; test: (r: PriceRow) => boolean }[] = [
  { key: '', label: 'ทุกสถานะ', test: () => true },
  { key: 'todo', label: 'ยังไม่มีราคา', test: (r) => statusOf(r) === 'missing' || statusOf(r) === 'zero' },
  { key: 'odd', label: 'ราคาน่าสงสัย', test: (r) => statusOf(r) === 'odd' },
  { key: 'checked', label: 'ตรวจแล้ว', test: (r) => r.checkedAt !== null },
  { key: 'unchecked', label: 'ยังไม่ตรวจ', test: (r) => r.checkedAt === null },
];

const SHOW = 60;
const DRAFTS_KEY = 'roz-price-drafts';
const BUY_DRAFTS_KEY = 'roz-buy-drafts';
type Field = 'sell' | 'buy';
const fmt = (n: number | null) => (n === null ? '—' : n.toLocaleString('en-US'));

type Publishing = { startedAt: string; done: boolean; ok: boolean | null; tail: string } | null;

export default function PriceTool({ rows: initial }: { rows: PriceRow[] }) {
  const [rows, setRows] = useState(initial);
  const [q, setQ] = useState('');
  const [group, setGroup] = useState('');
  const [statusKey, setStatusKey] = useState('');
  const [log, setLog] = useState<PriceEdit[]>([]);
  const [message, setMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [publishing, setPublishing] = useState<Publishing>(null);
  // What has been typed into a price box but not saved yet (owner, 5 Oct
  // 2026: "a button to save what I typed, for peace of mind"). Kept in this
  // browser too, so a closed tab or a refresh does not lose it.
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [buyDrafts, setBuyDrafts] = useState<Record<number, string>>({});
  const [justSaved, setJustSaved] = useState<Record<number, true>>({});
  const [savingAll, setSavingAll] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const priceRefs = useRef(new Map<number, HTMLInputElement>());

  useEffect(() => {
    fetch('/admin/prices/api')
      .then((r) => r.json())
      .then((d: { log: PriceEdit[]; publishing: Publishing }) => {
        setLog(d.log.slice().reverse());
        setPublishing(d.publishing);
      })
      .catch(() => {});
    try {
      const kept = JSON.parse(localStorage.getItem(DRAFTS_KEY) ?? '{}') as Record<number, string>;
      setDrafts(kept);
      setBuyDrafts(JSON.parse(localStorage.getItem(BUY_DRAFTS_KEY) ?? '{}') as Record<number, string>);
    } catch {
      // No storage (private window): drafts just live for this visit.
    }
    searchRef.current?.focus();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
      localStorage.setItem(BUY_DRAFTS_KEY, JSON.stringify(buyDrafts));
    } catch {
      // Same: nothing to keep them in.
    }
  }, [drafts, buyDrafts]);

  function setDraft(id: number, text: string, field: Field = 'sell') {
    (field === 'buy' ? setBuyDrafts : setDrafts)((prev) => {
      const next = { ...prev };
      if (text.trim()) next[id] = text;
      else delete next[id];
      return next;
    });
  }

  // While a publish runs, ask how it is going every 10 seconds.
  useEffect(() => {
    if (!publishing || publishing.done) return;
    const t = setInterval(() => {
      fetch('/admin/prices/api')
        .then((r) => r.json())
        .then((d: { publishing: Publishing }) => setPublishing(d.publishing))
        .catch(() => {});
    }, 10000);
    return () => clearInterval(t);
  }, [publishing]);

  const counts = useMemo(() => {
    const c = { missing: 0, zero: 0, odd: 0, ok: 0, checked: 0 };
    for (const r of rows) {
      c[statusOf(r)] += 1;
      if (r.checkedAt) c.checked += 1;
    }
    return c;
  }, [rows]);

  const shown = useMemo(() => {
    const needle = q.trim();
    const g = GROUPS.find((x) => x.key === group) ?? GROUPS[0];
    const s = STATUS_FILTERS.find((x) => x.key === statusKey) ?? STATUS_FILTERS[0];
    const idQuery = /^\d+$/.test(needle) ? Number(needle) : null;
    const hits = rows.filter(
      (r) =>
        g.test(r.category) &&
        s.test(r) &&
        (!needle || r.id === idQuery || [r.name, ...r.aka].some((n) => matches(n, needle))),
    );
    // An exact name or id first, then names that start with the query.
    const lower = needle.toLowerCase();
    const rank = (r: PriceRow) =>
      r.id === idQuery || r.name.toLowerCase() === lower ? 0 : r.name.toLowerCase().startsWith(lower) ? 1 : 2;
    return needle ? hits.sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name)) : hits;
  }, [rows, q, group, statusKey]);

  function focusPrice(id: number) {
    const el = priceRefs.current.get(id);
    if (el) {
      el.focus();
      el.select();
    }
  }

  async function post(body: object) {
    const res = await fetch('/admin/prices/api', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`);
    return data;
  }

  function applyEdit(edit: PriceEdit) {
    setRows((prev) =>
      prev.map((r) => (r.id !== edit.id ? r : edit.field === 'buy' ? { ...r, buy: edit.to } : { ...r, sell: edit.to, checkedAt: edit.at })),
    );
    setLog((prev) => [edit, ...prev].slice(0, 200));
  }

  /** Saves one price; true when it went in. `jump` returns to the search box. */
  async function save(row: PriceRow, text: string, jump = true, field: Field = 'sell'): Promise<boolean> {
    const price = parsePriceInput(text);
    if (price === null) {
      setMessage({ kind: 'err', text: `อ่านราคา "${text}" ของ ${row.name} ไม่ออก ใส่ตัวเลข หรือ ยอดรวม/จำนวน เช่น 150/50` });
      return false;
    }
    try {
      const { edit } = (await post({ action: 'save', id: row.id, price, field })) as { edit: PriceEdit };
      applyEdit(edit);
      setDraft(row.id, '', field);
      setJustSaved((prev) => ({ ...prev, [row.id]: true }));
      setTimeout(
        () =>
          setJustSaved((prev) => {
            const next = { ...prev };
            delete next[row.id];
            return next;
          }),
        5000,
      );
      setMessage({ kind: 'ok', text: `✓ บันทึกแล้ว ${row.name}${field === 'buy' ? ' (ราคาซื้อ)' : ''}: ${fmt(edit.from)} → ${fmt(edit.to)}z` });
      if (jump) {
        setQ('');
        searchRef.current?.focus();
      }
      return true;
    } catch (e) {
      setMessage({ kind: 'err', text: `บันทึก ${row.name} ไม่สำเร็จ: ${(e as Error).message}` });
      return false;
    }
  }

  async function saveAll() {
    setSavingAll(true);
    let ok = 0;
    const pending = [
      ...Object.entries(drafts).map(([id, text]) => ({ id, text, field: 'sell' as const })),
      ...Object.entries(buyDrafts).map(([id, text]) => ({ id, text, field: 'buy' as const })),
    ];
    for (const { id, text, field } of pending) {
      const row = rows.find((r) => r.id === Number(id));
      if (row && (await save(row, text, false, field))) ok += 1;
    }
    setSavingAll(false);
    setMessage({
      kind: ok === pending.length ? 'ok' : 'err',
      text: `✓ บันทึกแล้ว ${ok} จาก ${pending.length} ชิ้น${ok < pending.length ? ' · ที่เหลือยังค้างอยู่ในช่อง แก้ตามข้อความแล้วกดใหม่' : ''}`,
    });
  }

  async function undo(edit: PriceEdit) {
    try {
      const { edit: back } = (await post({ action: 'undo', at: edit.at })) as { edit: PriceEdit };
      applyEdit(back);
      setMessage({ kind: 'ok', text: `ย้อน ${edit.name} กลับเป็น ${fmt(back.to)}` });
    } catch (e) {
      setMessage({ kind: 'err', text: (e as Error).message });
    }
  }

  async function publish() {
    try {
      const { publishing: p } = (await post({ action: 'publish' })) as { publishing: Publishing };
      setPublishing(p);
    } catch (e) {
      setMessage({ kind: 'err', text: `สั่งอัปเดตเว็บไม่สำเร็จ: ${(e as Error).message}` });
    }
  }

  const undone = new Set(log.filter((e) => e.undoOf).map((e) => e.undoOf));
  const pendingCount = Object.keys(drafts).length + Object.keys(buyDrafts).length;

  return (
    <div className="pt">
      <div className="pt__main">
        <SellShotReader
          items={rows}
          onDrafts={(prices) => {
            setDrafts((prev) => ({ ...prev, ...prices.sell }));
            setBuyDrafts((prev) => ({ ...prev, ...prices.buy }));
            const n = Object.keys(prices.sell).length + Object.keys(prices.buy).length;
            setMessage({ kind: 'ok', text: `ใส่ ${n} ราคาจากภาพเป็นรายการรอบันทึกแล้ว ตรวจแล้วกด "บันทึกทั้งหมด"` });
          }}
        />
        <div className="pt__bar">
          <input
            ref={searchRef}
            className="pt__search"
            type="search"
            value={q}
            placeholder="พิมพ์ชื่อของหรือ ID แล้วกด Enter"
            aria-label="ค้นหาไอเทม"
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && shown[0]) {
                e.preventDefault();
                focusPrice(shown[0].id);
              }
            }}
          />
          <span className="pt__count mono">{shown.length.toLocaleString('en-US')} ชิ้น</span>
        </div>
        <div className="pt__chips" role="group" aria-label="หมวด">
          {GROUPS.map((g) => (
            <button key={g.key} type="button" className={`pt__chip${group === g.key ? ' on' : ''}`} onClick={() => setGroup(g.key)}>
              {g.label}
            </button>
          ))}
        </div>
        <div className="pt__chips" role="group" aria-label="สถานะ">
          {STATUS_FILTERS.map((s) => (
            <button key={s.key} type="button" className={`pt__chip${statusKey === s.key ? ' on' : ''}`} onClick={() => setStatusKey(s.key)}>
              {s.label}
            </button>
          ))}
          <span className="pt__tally mono">
            ไม่มีข้อมูล {counts.missing} · 0: {counts.zero} · สงสัย {counts.odd} · ตรวจแล้ว {counts.checked}
          </span>
        </div>
        {message && <p className={`pt__msg pt__msg--${message.kind}`}>{message.text}</p>}
        {pendingCount > 0 && (
          <div className="pt__pending">
            <span>
              ✏️ พิมพ์ไว้ยังไม่บันทึก <b>{pendingCount}</b> ราคา:{' '}
              {[
                ...Object.keys(drafts).map((id) => rows.find((r) => r.id === Number(id))?.name ?? id),
                ...Object.keys(buyDrafts).map((id) => `${rows.find((r) => r.id === Number(id))?.name ?? id} (ซื้อ)`),
              ]
                .slice(0, 6)
                .join(', ')}
              {pendingCount > 6 && ' …'}
            </span>
            <button type="button" className="btn" onClick={() => void saveAll()} disabled={savingAll}>
              {savingAll ? 'กำลังบันทึก…' : 'บันทึกทั้งหมด'}
            </button>
          </div>
        )}

        <ul className="pt__list">
          {shown.slice(0, SHOW).map((r) => {
            const st = statusOf(r);
            const half = halfOfBuy(r.buy);
            return (
              <li key={r.id} className="pt__row" data-status={st}>
                <span className="pt__icon">{r.icon && <img src={r.icon} alt="" width={36} height={36} loading="lazy" />}</span>
                <span className="pt__name">
                  <b>
                    {r.name}
                    {r.slots > 0 && <span className="pt__slots mono"> [{r.slots}]</span>}
                  </b>
                  <small className="mono">
                    #{r.id} · {r.category}
                    {r.aka.length > 0 && ` · ${r.aka.slice(0, 2).join(', ')}`}
                  </small>
                </span>
                <span className="pt__nums mono">
                  <span>ซื้อ {fmt(r.buy)}</span>
                  <span>
                    ขาย <b>{fmt(r.sell)}</b> <em className="pt__st">{STATUS_LABEL[st]}</em>
                  </span>
                  {justSaved[r.id] ? (
                    <span className="pt__saved">✓ บันทึกแล้ว</span>
                  ) : drafts[r.id] || buyDrafts[r.id] ? (
                    <span className="pt__draft">✏️ ยังไม่บันทึก</span>
                  ) : (
                    r.checkedAt && <span className="pt__checked">✓ ตรวจแล้ว {r.checkedAt.slice(0, 10)}</span>
                  )}
                </span>
                <span className="pt__edit">
                  <input
                    ref={(el) => {
                      if (el) priceRefs.current.set(r.id, el);
                      else priceRefs.current.delete(r.id);
                    }}
                    className="pt__price mono"
                    inputMode="numeric"
                    placeholder={r.sell !== null ? String(r.sell) : 'ราคา'}
                    aria-label={`ราคาขายของ ${r.name}`}
                    value={drafts[r.id] ?? ''}
                    onChange={(e) => setDraft(r.id, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        void save(r, e.currentTarget.value);
                      } else if (e.key === 'Escape') {
                        searchRef.current?.focus();
                      }
                    }}
                  />
                  <input
                    className="pt__price pt__price--buy mono"
                    inputMode="numeric"
                    placeholder={r.buy !== null ? `ซื้อ ${r.buy}` : 'ซื้อ'}
                    aria-label={`ราคาซื้อจากร้าน NPC ของ ${r.name}`}
                    title="ราคาซื้อจากร้าน NPC"
                    value={buyDrafts[r.id] ?? ''}
                    onChange={(e) => setDraft(r.id, e.target.value, 'buy')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        void save(r, e.currentTarget.value, true, 'buy');
                      } else if (e.key === 'Escape') {
                        searchRef.current?.focus();
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="pt__save"
                    disabled={!drafts[r.id] && !buyDrafts[r.id]}
                    onClick={() => {
                      if (drafts[r.id]) void save(r, drafts[r.id], false);
                      if (buyDrafts[r.id]) void save(r, buyDrafts[r.id], false, 'buy');
                    }}
                  >
                    บันทึก
                  </button>
                  {half !== null && half !== r.sell && (
                    <button type="button" className="pt__half" onClick={() => void save(r, String(half))} title="ใส่ครึ่งหนึ่งของราคาซื้อ">
                      ½ = {fmt(half)}
                    </button>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
        {shown.length > SHOW && <p className="muted">แสดง {SHOW} ชิ้นแรก พิมพ์ค้นหาให้แคบลง</p>}
      </div>

      <aside className="pt__side">
        <div className="pt__publish">
          <button type="button" className="btn" onClick={() => void publish()} disabled={Boolean(publishing && !publishing.done)}>
            {publishing && !publishing.done ? 'กำลังอัปเดตเว็บ…' : 'อัปเดตเว็บตอนนี้'}
          </button>
          <small>
            ไม่กดก็ขึ้นเองภายใน 1 วัน · กดแล้วเว็บสร้างใหม่ทั้งเว็บ ประมาณ 5–8 นาที
            {publishing?.done && (publishing.ok ? ' · ✓ รอบล่าสุดขึ้นแล้ว' : ' · ✗ รอบล่าสุดไม่สำเร็จ')}
          </small>
        </div>
        <h2 className="pt__sidehead">แก้ล่าสุด</h2>
        <ol className="pt__log">
          {log.slice(0, 20).map((e) => (
            <li key={e.at}>
              <span>
                <b>{e.name}</b>
                {e.field === 'buy' && <em> ซื้อ</em>} <span className="mono">{fmt(e.from)} → {fmt(e.to)}</span>
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
