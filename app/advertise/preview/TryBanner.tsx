'use client';

// A shop picks its own banner files and sees them in a real page of the site,
// in the slot it chooses, on a desktop or a phone (owner, 27 Nov 2026: the
// preview link we sent Gametopup.center only opened on our own network, so
// every look at a placement cost us a round of screenshots).
//
// The page is the real one, in a same-origin frame. Nothing is uploaded: the
// files become blob: URLs in this browser, and the frame -- same origin --
// can draw them. The real slot is hidden and a copy of it, holding the
// shop's picture, sits beside it, so React on the framed page never finds a
// node it owns changed under it. Inside the frame no event is sent and no
// Google ad loads (lib/analytics inFrame), and the banners there cannot be
// clicked, so trying a banner counts nothing for anyone.

import { useCallback, useEffect, useRef, useState } from 'react';
import { AD_FILE_SIZES, AD_SIZES, type AdSlot } from '@/lib/ads';

interface SlotInfo {
  key: AdSlot;
  name: string;
  where: string;
  page: string;
}

const SLOTS: SlotInfo[] = [
  { key: 'top', name: 'บนสุดทุกหน้า', where: 'ใต้เมนู เหนือเนื้อหา เห็นทุกหน้า', page: '/database/monsters' },
  { key: 'inline', name: 'แทรกเนื้อหา', where: 'คั่นกลางรายการในหน้าที่คนเปิดมาก', page: '/database/monsters' },
  { key: 'detail', name: 'หน้ารายละเอียด', where: 'ท้ายหน้ามอนสเตอร์และไอเทมรายตัว', page: '/database/monsters/1002' },
  { key: 'list', name: 'ในตารางการ์ดมอนสเตอร์', where: 'แทรกในตารางการ์ด หน้ามอนสเตอร์', page: '/database/monsters' },
  { key: 'bonus', name: 'Cash Shop แพตช์ อีเวนต์', where: 'หน้า Cash Shop หน้าแพตช์ และหน้าอีเวนต์', page: '/database/cash-shop' },
  { key: 'guide', name: 'ท้ายไกด์อาชีพ', where: 'ท้ายไกด์ทุกอาชีพ', page: '/guides/classes/knight' },
];

const VIEW = {
  desk: { w: 1280, h: 760, label: 'คอม' },
  phone: { w: 390, h: 760, label: 'มือถือ' },
} as const;
type View = keyof typeof VIEW;

interface Pic {
  url: string;
  w: number;
  h: number;
  name: string;
}

const ratio = (s: [number, number]) => s[0] / s[1];
const near = (a: number, b: number) => Math.abs(a / b - 1) < 0.08;

/** The box the banner is drawn in: the slot's own, unless the picture is
 *  the top slot's shape -- then it is drawn as the top slot, as a shop that
 *  sends one set for every slot gets on the live site (Ad.size). */
function shapeFor(slot: AdSlot, pic: Pic | null): AdSlot {
  if (slot === 'top' || !pic) return slot;
  return near(pic.w / pic.h, ratio(AD_SIZES.top.wide)) || near(pic.w / pic.h, ratio(AD_SIZES.top.narrow)) ? 'top' : slot;
}

/** What to tell the shop about a file for this slot, if anything. */
function advice(slot: AdSlot, view: View, pic: Pic | null): string | null {
  if (!pic) return null;
  const shape = shapeFor(slot, pic);
  const box = view === 'desk' ? AD_SIZES[shape].wide : AD_SIZES[shape].narrow;
  const want = view === 'desk' ? AD_FILE_SIZES[shape].wide : AD_FILE_SIZES[shape].narrow;
  if (!near(pic.w / pic.h, ratio(box))) {
    return `สัดส่วนไม่ตรงกรอบ (${pic.w}×${pic.h}) ภาพจะมีขอบว่าง ขนาดที่พอดีคือ ${want[0]}×${want[1]}`;
  }
  // Smaller than the box itself is a real problem; between the box and twice
  // it is fine, only less sharp on 2x screens (said quietly, under the frame).
  if (pic.w < box[0] * 0.95) {
    return `ภาพเล็กกว่ากรอบ (${pic.w}×${pic.h}) จะดูแตก แนะนำ ${want[0]}×${want[1]}`;
  }
  return null;
}

function readPic(file: File): Promise<Pic> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ url, w: img.naturalWidth, h: img.naturalHeight, name: file.name });
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('not an image'));
    };
    img.src = url;
  });
}

export default function TryBanner() {
  const [slot, setSlot] = useState<AdSlot>('top');
  const [view, setView] = useState<View>('desk');
  const [wide, setWide] = useState<Pic | null>(null);
  const [narrow, setNarrow] = useState<Pic | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(0);
  const [found, setFound] = useState(true);
  const [scale, setScale] = useState(1);
  const [stageH, setStageH] = useState(0);
  // Full screen is a fixed layer over the page, not the Fullscreen API:
  // iPhone Safari gives that only to videos.
  const [full, setFull] = useState(false);
  const [busy, setBusy] = useState(false);
  const frame = useRef<HTMLIFrameElement>(null);
  const stage = useRef<HTMLDivElement>(null);

  const info = SLOTS.find((s) => s.key === slot)!;
  const size = VIEW[view];
  // The phone file when there is one, else the desktop one.
  const pic = view === 'phone' ? narrow ?? wide : wide;

  // Fit the frame to the column; a 1280 px page is drawn smaller, not cut.
  useEffect(() => {
    const node = stage.current;
    if (!node) return;
    const fit = () => {
      setScale(Math.min(1, node.clientWidth / size.w));
      setStageH(node.clientHeight);
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(node);
    return () => observer.disconnect();
  }, [size.w, full]);

  useEffect(() => {
    if (!full) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setFull(false);
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [full]);

  // The frame can finish loading before this component has hydrated, and then
  // its load event is missed: check it once on mount and on each new page.
  useEffect(() => {
    if (frame.current?.contentDocument?.readyState === 'complete') setLoaded((n) => n + 1);
  }, [info.page, view]);

  // The frame's own height: the page height it shows, before scaling.
  const frameH = full && stageH ? Math.round(stageH / scale) : size.h;

  /** Saves what the frame shows now as a PNG, for a shop to send us. Drawn
   *  from the framed page itself (modern-screenshot, loaded on the click), so
   *  a moving banner is caught on one frame. */
  const capture = useCallback(async () => {
    const doc = frame.current?.contentDocument;
    const win = frame.current?.contentWindow;
    if (!doc || !win) return;
    setBusy(true);
    try {
      const { domToBlob } = await import('modern-screenshot');
      const blob = await domToBlob(doc.documentElement, {
        width: VIEW[view].w,
        height: frameH,
        scale: view === 'phone' ? 2 : 1,
        backgroundColor: '#0a0720',
        style: { marginTop: `-${Math.round(win.scrollY)}px` },
      });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `แบนเนอร์-${SLOTS.find((s) => s.key === slot)!.name}-${VIEW[view].label}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      setError(null);
    } catch {
      setError('แคปภาพไม่สำเร็จ ใช้ปุ่มแคปหน้าจอของเครื่องแทนได้');
    } finally {
      setBusy(false);
    }
  }, [view, frameH, slot]);

  const pick = useCallback(async (file: File | undefined, set: (p: Pic | null) => void, old: Pic | null) => {
    if (!file) return;
    try {
      const p = await readPic(file);
      if (old) URL.revokeObjectURL(old.url);
      set(p);
      setError(null);
    } catch {
      setError('เปิดไฟล์นี้ไม่ได้ ใช้ไฟล์ JPG, PNG, WebP หรือ GIF');
    }
  }, []);

  // Draw the trial banner into the framed page whenever anything changes.
  useEffect(() => {
    const doc = frame.current?.contentDocument;
    const win = frame.current?.contentWindow;
    if (!doc || !win || !loaded) return;
    let tries = 0;
    let timer = 0;
    const draw = () => {
      doc.getElementById('trybanner')?.remove();
      doc.getElementById('trybanner-style')?.remove();
      const real = doc.querySelector<HTMLElement>(`[data-slot="${slot}"]`);
      // Wait for React to take the framed page over (hydrate) before adding
      // anything to it: a node added earlier is a mismatch, React throws
      // (#418) and redraws the page without it.
      const hydrated = real && Object.keys(real).some((k) => k.startsWith('__reactFiber'));
      if (!real || !hydrated) {
        if (tries++ < 40) timer = win.setTimeout(draw, 150);
        else setFound(false);
        return;
      }
      setFound(true);
      const shape = shapeFor(slot, pic);
      const box = AD_SIZES[shape];
      // As on the live site: a phone file brings its own shape, and a banner
      // sold without one keeps its desktop shape on a phone.
      const narrowBox: [number, number] = narrow ? [narrow.w, narrow.h] : wide ? box.wide : box.narrow;
      const style = doc.createElement('style');
      style.id = 'trybanner-style';
      // Only the banner being tried: every other slot on the page (another
      // shop's banner, a Google unit) is hidden, so nothing else reads as
      // part of what is being tried.
      style.textContent = `[data-slot]{display:none!important}.adslot:not(#trybanner){display:none!important}.adslot__link,.adslot a{pointer-events:none}`;
      doc.head.appendChild(style);

      const aside = doc.createElement('aside');
      aside.id = 'trybanner';
      aside.className = `adslot adslot--${slot} ${shape === 'top' ? 'adslot--fluid' : 'adslot--fit'}`;
      aside.setAttribute('aria-label', 'แบนเนอร์ทดลอง');
      for (const [k, v] of Object.entries({
        '--ad-w': `${box.wide[0]}px`,
        '--ad-h': `${box.wide[1]}px`,
        '--ad-narrow-w': `${box.narrow[0]}px`,
        '--ad-narrow-h': `${box.narrow[1]}px`,
        '--ad-ratio': `${box.wide[0]} / ${box.wide[1]}`,
        '--ad-narrow-ratio': `${narrowBox[0]} / ${narrowBox[1]}`,
      })) aside.style.setProperty(k, v);
      if (shape !== 'top' && view === 'phone') aside.classList.add('adslot--phonefluid');
      // In a grid of cards the real slot spans the row; so does the copy.
      if (real.parentElement && getComputedStyle(real.parentElement).display === 'grid') aside.style.gridColumn = '1 / -1';

      const tag = doc.createElement('span');
      tag.className = 'adslot__tag';
      tag.textContent = 'โฆษณา';
      const link = doc.createElement('span');
      link.className = 'adslot__link';
      if (pic) {
        const img = doc.createElement('img');
        img.src = pic.url;
        img.alt = 'แบนเนอร์ทดลอง';
        link.appendChild(img);
      } else {
        link.classList.add('trybanner__empty');
        // Nothing inside to give it a size, so it takes the box's own.
        link.style.width = `${view === 'phone' ? box.narrow[0] : box.wide[0]}px`;
        link.style.maxWidth = '100%';
        link.innerHTML = '<strong>แบนเนอร์ของคุณ</strong>';
        Object.assign(link.style, {
          flexDirection: 'column', border: '2px dashed #ff3fa4', color: '#fff',
          background: 'linear-gradient(135deg, rgba(255,61,154,.25), rgba(61,232,255,.2))', font: '700 18px sans-serif',
        });
      }
      aside.append(tag, link);
      real.after(aside);
      const top = aside.getBoundingClientRect().top + win.scrollY;
      win.scrollTo({ top: Math.max(0, top - size.h * 0.35) });
    };
    draw();
    return () => win.clearTimeout(timer);
  }, [slot, view, pic, narrow, loaded, size.h]);

  // Sizes for the box the banner is drawn in: a top-shaped picture in another
  // slot is drawn, and judged, as the top slot.
  const wantDesk = AD_FILE_SIZES[shapeFor(slot, pic)].wide;
  const wantPhone = AD_FILE_SIZES[shapeFor(slot, pic)].narrow;
  const note = advice(slot, view, pic);
  const want = view === 'desk' ? wantDesk : wantPhone;
  const softer = pic && !note && pic.w < want[0] * 0.95;

  return (
    <div className="trybanner">
      <div className="trybanner__controls">
        <fieldset className="trybanner__group">
          <legend>1 · ไฟล์แบนเนอร์ของคุณ</legend>
          <label className="trybanner__file">
            <span>ไฟล์สำหรับคอม</span>
            <input type="file" accept="image/*" onChange={(e) => pick(e.target.files?.[0], setWide, wide)} />
            {wide && <small className="mono">{wide.name} · {wide.w}×{wide.h}</small>}
          </label>
          <label className="trybanner__file">
            <span>ไฟล์สำหรับมือถือ <em>(ไม่มีก็ได้ จะใช้ไฟล์คอมแทน)</em></span>
            <input type="file" accept="image/*" onChange={(e) => pick(e.target.files?.[0], setNarrow, narrow)} />
            {narrow && <small className="mono">{narrow.name} · {narrow.w}×{narrow.h}</small>}
          </label>
          {error && <p className="trybanner__warn">{error}</p>}
          <p className="trybanner__private">ไฟล์อยู่ในเครื่องคุณเท่านั้น ไม่ได้อัปโหลดขึ้นเว็บ และไม่มีใครเห็นนอกจากคุณ</p>
        </fieldset>

        <fieldset className="trybanner__group">
          <legend>2 · เลือกตำแหน่ง</legend>
          <div className="trybanner__slots" role="radiogroup" aria-label="ตำแหน่ง">
            {SLOTS.map((s) => (
              <button
                key={s.key}
                type="button"
                role="radio"
                aria-checked={slot === s.key}
                className={`trybanner__slot${slot === s.key ? ' is-on' : ''}`}
                onClick={() => setSlot(s.key)}
              >
                <strong>{s.name}</strong>
                <span className="mono">คอม {AD_FILE_SIZES[s.key].wide[0]}×{AD_FILE_SIZES[s.key].wide[1]} · มือถือ {AD_FILE_SIZES[s.key].narrow[0]}×{AD_FILE_SIZES[s.key].narrow[1]}</span>
              </button>
            ))}
          </div>
          <p className="muted trybanner__hint">ขนาดที่เขียนไว้ใหญ่กว่ากรอบจริง 2 เท่า ให้ภาพคมบนจอรุ่นใหม่ ไม่อยากทำหลายขนาด ส่งชุดบนสุด (2400×400 กับ 1920×640) ชุดเดียวก็ใช้ได้ทุกตำแหน่ง</p>
        </fieldset>

        <fieldset className="trybanner__group">
          <legend>3 · ดูบน</legend>
          <div className="trybanner__views" role="radiogroup" aria-label="หน้าจอ">
            {(Object.keys(VIEW) as View[]).map((v) => (
              <button key={v} type="button" role="radio" aria-checked={view === v} className={`trybanner__view${view === v ? ' is-on' : ''}`} onClick={() => setView(v)}>
                {VIEW[v].label}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="trybanner__result">
        <p className="trybanner__where">
          <strong>{info.name}</strong> · {info.where}
          <br />
          <span className="mono">ไฟล์ที่แนะนำ: {view === 'desk' ? `${wantDesk[0]}×${wantDesk[1]}` : `${wantPhone[0]}×${wantPhone[1]}`}</span>
        </p>
        {note && <p className="trybanner__warn">{note}</p>}
        {!found && <p className="trybanner__warn">ตำแหน่งนี้ไม่มีในหน้าตัวอย่างตอนนี้</p>}
        <div className="trybanner__tools">
          <button type="button" className="btn" onClick={() => setFull(true)}>⛶ ดูเต็มจอ</button>
          <button type="button" className="btn" onClick={capture} disabled={busy}>{busy ? 'กำลังแคป…' : '📷 แคปภาพเก็บไว้'}</button>
        </div>
        <div className={`trybanner__stage${full ? ' is-full' : ''}`} ref={stage} style={full ? undefined : { height: size.h * scale }}>
          {full && (
            <div className="trybanner__fullbar">
              <button type="button" className="btn" onClick={capture} disabled={busy}>{busy ? 'กำลังแคป…' : '📷 แคปภาพ'}</button>
              <button type="button" className="btn" onClick={() => setFull(false)}>✕ ปิด</button>
            </div>
          )}
          <iframe
            key={`${info.page}-${view}`}
            ref={frame}
            title={`หน้า ${info.page} พร้อมแบนเนอร์ทดลอง`}
            src={info.page}
            width={size.w}
            height={frameH}
            style={{ transform: `scale(${scale})` }}
            onLoad={() => setLoaded((n) => n + 1)}
          />
        </div>
        {softer && <p className="muted trybanner__hint">ใช้ได้ ถ้าส่งไฟล์ใหญ่ขึ้นเป็น {want[0]}×{want[1]} จะคมขึ้นบนจอมือถือและโน้ตบุ๊กรุ่นใหม่</p>}
        <p className="muted trybanner__hint">เลื่อนดูในกรอบได้ ภาพในกรอบคือหน้าจริงของเว็บ แบนเนอร์ GIF ขยับเหมือนบนเว็บจริง</p>
      </div>
    </div>
  );
}
