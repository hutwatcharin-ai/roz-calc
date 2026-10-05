'use client';

// "Read new screenshots" on /admin/prices (owner, 5 Oct 2026). Opens the
// game's screenshots of an NPC's sell window or shop (buy) window in the
// browser, reads each row's
// item and plain price with lib/sell-reader (pixel matching, no outside
// service), and hands the ones the owner ticks to the price list as unsaved
// drafts -- nothing is written until they press save there.
//
// Some items share one picture (Butterfly Wing and Novice Butterfly Wing);
// those rows offer the candidates, and the owner's pick is remembered for
// that set so the next screenshot chooses it on its own.

import { useEffect, useRef, useState } from 'react';
import { readSellWindow, type IconAtlas, type Pixels, type WindowKind } from '@/lib/sell-reader';

export interface ReaderItem {
  id: number;
  name: string;
  sell: number | null;
  buy: number | null;
  icon: string | null;
  /** Card slots: twins like Muffler and Muffler [1] share one icon. */
  slots: number;
  /** A classic leftover with a Zero copy (lib/classic-twins): never offered
   *  when another candidate is left. */
  classicTwin?: boolean;
}

interface Found {
  key: string;
  /** Which window the row came from: a sell price or a shop (buy) price. */
  kind: WindowKind;
  shot: string;
  candidates: number[];
  chosen: number;
  price: number | null;
  text: string | null;
  crop: string;
  use: boolean;
}

const PICKS_KEY = 'roz-sell-picks';

const KIND_TH: Record<WindowKind, string> = { sell: 'ขาย', buy: 'ซื้อ' };

/** The price this window's row is about: the sell price, or the shop price. */
const current = (item: ReaderItem | undefined, kind: WindowKind) => (kind === 'buy' ? item?.buy : item?.sell);

/** "Muffler [1] · ขาย 10z (#480378)" -- enough to tell same-icon items apart. */
function label(item: ReaderItem | undefined, id: number, kind: WindowKind): string {
  if (!item) return `#${id}`;
  const slots = item.slots > 0 ? ` [${item.slots}]` : '';
  const now = current(item, kind);
  const price = now === null || now === undefined ? 'ไม่มีราคา' : `${KIND_TH[kind]} ${now.toLocaleString('en-US')}z`;
  return `${item.name}${slots} · ${price} (#${id})`;
}

function loadPicks(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(PICKS_KEY) ?? '{}') as Record<string, number>;
  } catch {
    return {};
  }
}

async function pixelsOf(src: string): Promise<{ pixels: Pixels; canvas: HTMLCanvasElement }> {
  const img = new Image();
  img.src = src;
  await img.decode();
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0);
  const d = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return { pixels: { width: d.width, height: d.height, data: d.data }, canvas };
}

export default function SellShotReader({
  items,
  onDrafts,
}: {
  items: ReaderItem[];
  onDrafts: (prices: Record<WindowKind, Record<number, string>>) => void;
}) {
  const [shots, setShots] = useState<{ name: string; read: boolean }[]>([]);
  const [dirError, setDirError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [found, setFound] = useState<Found[]>([]);
  const [readNames, setReadNames] = useState<string[]>([]);
  const atlasRef = useRef<IconAtlas | null>(null);
  const byId = new Map(items.map((i) => [i.id, i]));

  // Screenshot names already on the list when this page opened or last
  // looked; anything new after that is read on its own (below).
  const seenRef = useRef<Set<string> | null>(null);
  const busyRef = useRef(false);

  const refresh = () =>
    fetch('/admin/prices/shots')
      .then((r) => r.json())
      .then((d: { shots: { name: string; read: boolean }[]; error?: string; dir: string }) => {
        setShots(d.shots);
        setDirError(d.error ? `${d.error}: ${d.dir}` : null);
        return d.shots;
      })
      .catch(() => {
        setDirError('อ่านรายการภาพไม่สำเร็จ');
        return [] as { name: string; read: boolean }[];
      });

  useEffect(() => {
    void refresh().then((list) => {
      seenRef.current = new Set(list.map((s) => s.name));
    });
    // Coming back to this tab from the game reads the screenshots taken in
    // the meantime, without a click (owner, 5 Oct 2026).
    const onBack = () => {
      if (document.visibilityState === 'hidden' || busyRef.current) return;
      void refresh().then((list) => {
        const seen = seenRef.current;
        if (!seen) return;
        const fresh = list.filter((s) => !s.read && !seen.has(s.name)).map((s) => s.name);
        list.forEach((s) => seen.add(s.name));
        if (fresh.length) void read(fresh, true);
      });
    };
    window.addEventListener('focus', onBack);
    document.addEventListener('visibilitychange', onBack);
    return () => {
      window.removeEventListener('focus', onBack);
      document.removeEventListener('visibilitychange', onBack);
    };
    // read() is recreated each render; the listener only needs the latest
    // items, which it gets through the closure of this first render's props.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function atlas(): Promise<IconAtlas> {
    if (atlasRef.current) return atlasRef.current;
    const meta = (await (await fetch('/admin-data/icon-atlas.json')).json()) as { cell: number; cols: number; ids: number[] };
    const { pixels } = await pixelsOf('/admin-data/icon-atlas.png');
    atlasRef.current = { ...meta, pixels };
    return atlasRef.current;
  }

  async function read(names: string[], append = false) {
    if (!names.length || busyRef.current) return;
    busyRef.current = true;
    const live = new Set(items.map((i) => i.id));
    const picks = loadPicks();
    try {
      setBusy('กำลังโหลดไอคอน…');
      const a = await atlas();
      const out: Found[] = [];
      for (const [n, name] of names.entries()) {
        setBusy(`กำลังอ่าน ${n + 1}/${names.length}: ${name}`);
        // Let the browser paint the progress before the heavy loop.
        await new Promise((r) => setTimeout(r, 0));
        const { pixels, canvas } = await pixelsOf(`/admin/prices/shots?file=${encodeURIComponent(name)}`);
        const result = readSellWindow(pixels, a, live);
        if (!result) continue;
        for (const row of result.rows) {
          // Hallberd 1463 is the classic copy nobody holds; offer 630039 and
          // 630053 only (owner, 5 Oct 2026).
          const real = row.candidates.filter((id) => !byId.get(id)?.classicTwin);
          if (real.length) row.candidates = real;
          if (!row.candidates.length) continue;
          // A pick in the sell window says nothing about the shop: own key.
          const key = (result.kind === 'buy' ? 'buy:' : '') + row.candidates.join(',');
          const crop = document.createElement('canvas');
          crop.width = 48;
          crop.height = 48;
          const c = crop.getContext('2d')!;
          c.imageSmoothingEnabled = false;
          c.drawImage(canvas, row.iconAt.x, row.iconAt.y, 24, 24, 0, 0, 48, 48);
          // Same picture, several items: the owner's last pick for this set,
          // else the one whose price already matches what the screenshot
          // says (Buckler, not Ahura Mazdah, for a 50z shield), else in a shop
          // a Zero copy (six-digit id, what Zero's shops stock) over a classic
          // or guild one (Waghnak 560054, not 1801), else the first. Not for
          // the sell window: Novice Butterfly Wing is 12324, not 105052.
          const matching = row.candidates.find((id) => current(byId.get(id), result.kind) === row.price);
          const zero = result.kind === 'buy' ? row.candidates.find((id) => id >= 100000) : undefined;
          const chosen = row.candidates.includes(picks[key]) ? picks[key] : (matching ?? zero ?? row.candidates[0]);
          out.push({ key, kind: result.kind, shot: name, candidates: row.candidates, chosen, price: row.price, text: row.text, crop: crop.toDataURL(), use: false });
        }
      }
      // One line per item and price: the same row on several screenshots reads
      // the same. A row whose price was hidden (mouse pointer over it) is
      // dropped when another screenshot read that item's price.
      const merged = new Map<string, Found>();
      for (const f of out) {
        const k = `${f.kind}|${f.chosen}|${f.price}`;
        if (!merged.has(k)) merged.set(k, f);
      }
      for (const [k, f] of merged) {
        if (f.price === null && [...merged.values()].some((o) => o.kind === f.kind && o.chosen === f.chosen && o.price !== null)) merged.delete(k);
      }
      const list = [...merged.values()].map((f) => ({ ...f, use: f.price !== null && current(byId.get(f.chosen), f.kind) !== f.price }));
      if (append) {
        // Keep what is already on screen; add only items not listed yet.
        setFound((prev) => [...prev, ...list.filter((f) => !prev.some((p) => p.kind === f.kind && p.chosen === f.chosen && p.price === f.price))]);
        setReadNames((prev) => [...prev, ...names]);
      } else {
        setFound(list);
        setReadNames(names);
      }
    } catch (e) {
      setDirError(`อ่านภาพไม่สำเร็จ: ${(e as Error).message}`);
    } finally {
      setBusy(null);
      busyRef.current = false;
    }
  }

  function choose(i: number, id: number) {
    setFound((prev) => prev.map((f, n) => (n === i ? { ...f, chosen: id, use: f.price !== null && current(byId.get(id), f.kind) !== f.price } : f)));
    const picks = loadPicks();
    picks[found[i].key] = id;
    try {
      localStorage.setItem(PICKS_KEY, JSON.stringify(picks));
    } catch {
      // No storage: the pick holds for this screen only.
    }
  }

  async function apply() {
    const prices: Record<WindowKind, Record<number, string>> = { sell: {}, buy: {} };
    for (const f of found) if (f.use && f.price !== null) prices[f.kind][f.chosen] = String(f.price);
    onDrafts(prices);
    await fetch('/admin/prices/shots', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ read: readNames }) });
    setFound([]);
    setReadNames([]);
    void refresh();
  }

  const unread = shots.filter((s) => !s.read).map((s) => s.name);

  return (
    <section className="ssr">
      <div className="ssr__head">
        <b>📷 อ่านราคาจากภาพแคปหน้าต่าง NPC (ขายของ / ซื้อของ)</b>
        <span className="muted">แคปในเกมด้วย Fn + PrintScreen ตอนเปิดหน้าต่างขายหรือหน้าต่างร้าน แล้วสลับกลับมาหน้านี้ ระบบอ่านภาพใหม่ให้เอง</span>
      </div>
      {dirError && <p className="pt__msg pt__msg--err">{dirError}</p>}
      <div className="ssr__actions">
        <button type="button" className="btn" disabled={!!busy || unread.length === 0} onClick={() => void read(unread)}>
          อ่านภาพแคปใหม่ ({unread.length})
        </button>
        {shots.length > 0 && (
          <button type="button" className="pt__chip" disabled={!!busy} onClick={() => void read(shots.slice(0, 3).map((s) => s.name))}>
            อ่าน 3 ภาพล่าสุดอีกครั้ง
          </button>
        )}
        {busy && <span className="mono">{busy}</span>}
      </div>

      {found.length > 0 && (
        <>
          <table className="ssr__table">
            <thead>
              <tr>
                <th></th>
                <th>ราคา</th>
                <th>ไอคอนในภาพ</th>
                <th>ของ</th>
                <th>อ่านได้</th>
                <th>ในเว็บตอนนี้</th>
              </tr>
            </thead>
            <tbody>
              {found.map((f, i) => {
                const item = byId.get(f.chosen);
                const now = current(item, f.kind);
                const same = now === f.price;
                return (
                  <tr key={`${f.key}|${f.price}|${i}`} data-state={f.price === null ? 'unread' : same ? 'same' : 'diff'}>
                    <td>
                      <input
                        type="checkbox"
                        checked={f.use}
                        disabled={f.price === null}
                        onChange={(e) => setFound((prev) => prev.map((x, n) => (n === i ? { ...x, use: e.target.checked } : x)))}
                        aria-label="ใช้ราคานี้"
                      />
                    </td>
                    <td className={`ssr__kind ssr__kind--${f.kind}`}>{KIND_TH[f.kind]}</td>
                    <td>
                      <img src={f.crop} alt="" width={48} height={48} className="ssr__crop" />
                    </td>
                    <td>
                      {f.candidates.length > 1 ? (
                        <select value={f.chosen} onChange={(e) => choose(i, Number(e.target.value))}>
                          {f.candidates.map((id) => (
                            <option key={id} value={id}>
                              {label(byId.get(id), id, f.kind)}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span>
                          {item?.name ?? f.chosen}
                          {item && item.slots > 0 && <span className="pt__slots mono"> [{item.slots}]</span>} <small className="mono">#{f.chosen}</small>
                        </span>
                      )}
                      {f.candidates.length > 1 && <small className="ssr__warn">ไอคอนเหมือนกัน {f.candidates.length} ชิ้น เลือกให้ถูก</small>}
                    </td>
                    <td className="mono">{f.price === null ? <span className="ssr__warn">อ่านไม่ออก (มีอะไรบัง)</span> : `${f.price.toLocaleString('en-US')}z`}</td>
                    <td className="mono">
                      {now === null || now === undefined ? '—' : `${now.toLocaleString('en-US')}z`}
                      {f.price !== null && (same ? ' ✓ ตรง' : ' ≠')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="ssr__actions">
            <button type="button" className="btn" onClick={() => void apply()}>
              ใส่ {found.filter((f) => f.use && f.price !== null).length} ราคาเป็นรายการรอบันทึก
            </button>
            <span className="muted">ยังไม่บันทึกลงเว็บ ตรวจในรายการแล้วกด &ldquo;บันทึกทั้งหมด&rdquo;</span>
          </div>
        </>
      )}
    </section>
  );
}
