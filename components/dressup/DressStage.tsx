'use client';
// The character on a 200x200 canvas, drawn by lib/dress-up/render.ts from the
// parts the look needs and scaled up 3x with nearest-neighbour pixels. Each
// part keeps its own frame clock (lib/dress-up/look.ts frameFor); the canvas
// is only redrawn when some part's frame changes.
//
// The drawing always pairs a look with the parts loaded for that look: while a
// new set is on its way the last picture stays put, so old parts are never
// drawn in the new pose.
//
// Dragging across the stage turns the character like a turntable, one
// direction every TURN_PX; the arrow keys do the same when it has focus.
// Zoom (1x to ZOOM_MAX, about the middle of the character): the wheel, a two-finger pinch, the
// + and - buttons in the corner, or the + and - keys.
import { useEffect, useMemo, useRef, useState } from 'react';
import { actionFor, drawable, frameFor, type Look, type PartRef } from '@/lib/dress-up/look';
import { DressUpUnavailable, loadPart, type LoadedPart } from '@/lib/dress-up/load';
import { composeFrame } from '@/lib/dress-up/render';
import type { Placed } from '@/lib/dress-up/types';

type Loaded = PartRef & LoadedPart;
type Scene = { look: Look; loaded: Loaded[] };
type Status = 'loading' | 'ready' | 'unavailable';

const TURN_PX = 28;
/** Turning right (a drag or the right arrow) walks the directions down: front, front-right, right... */
const turned = (dir: number, steps: number) => (((dir - steps) % 8) + 8) % 8;
const ZOOM_MAX = 3;
const clampZoom = (z: number) => Math.min(ZOOM_MAX, Math.max(1, Math.round(z * 100) / 100));

/** The middle of the drawn pixels, in whole % of the frame; a tall mount and a cart move it. */
function middleOf(out: { w: number; h: number; data: Uint8ClampedArray }): { x: number; y: number } {
  let x0 = out.w, y0 = out.h, x1 = -1, y1 = -1;
  for (let y = 0; y < out.h; y++) {
    for (let x = 0; x < out.w; x++) {
      if (out.data[(y * out.w + x) * 4 + 3] === 0) continue;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
  if (x1 < 0) return { x: 50, y: 60 };
  return { x: Math.round(((x0 + x1) / 2 / out.w) * 100), y: Math.round(((y0 + y1) / 2 / out.h) * 100) };
}

export default function DressStage({ look, onTurn, scene: backdrop = 'neon' }: {
  look: Look;
  onTurn?: (dir: number) => void;
  /** the backdrop, styled in app/tools/dress-up/page.css */
  scene?: string;
}) {
  const drag = useRef<{ id: number; x: number; dir: number } | null>(null);
  const touches = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ dist: number; zoom: number } | null>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  /** the zoom's fixed point: the middle of what the scene draws, in % of the stage */
  const [centre, setCentre] = useState({ x: 50, y: 60 });
  const canvas = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [scene, setScene] = useState<Scene | null>(null);
  const [attempt, setAttempt] = useState(0);
  const { parts } = useMemo(() => drawable(look), [look]);

  // Load the look's parts (memoised in loadPart, so a pose change resolves at
  // once), then swap look and parts in together.
  useEffect(() => {
    let alive = true;
    setStatus('loading');
    Promise.all(parts.map((p) => loadPart(p.key)))
      .then((got) => {
        if (!alive) return;
        setScene({ look, loaded: parts.map((p, i) => ({ ...p, ...got[i] })) });
        setStatus('ready');
      })
      .catch((e) => {
        if (!alive) return;
        if (!(e instanceof DressUpUnavailable)) console.error('dress-up: load failed', e);
        setStatus('unavailable');
      });
    return () => { alive = false; };
  }, [look, parts, attempt]);

  // Animate the current scene; the clock restarts with each new scene.
  useEffect(() => {
    const ctx = canvas.current?.getContext('2d');
    if (!ctx || !scene) return;
    const { look: shown, loaded } = scene;
    if (loaded.length === 0) {
      ctx.clearRect(0, 0, 200, 200);
      return;
    }
    const action = actionFor(shown);
    const start = performance.now();
    let last = '';
    let raf = 0;
    let centred = false;
    const tick = (now: number) => {
      // rAF's timestamp is when the frame began, which can be just before `start`.
      const ms = Math.max(0, now - start);
      const frames = loaded.map((p) => frameFor(p.kind, p.part, action, shown, ms));
      const sig = frames.join(',');
      if (sig !== last) {
        last = sig;
        const placed: Placed[] = loaded.map((p, i) => ({ part: p.part, atlas: p.atlas, anchored: p.anchored, frame: frames[i] }));
        const out = composeFrame(placed, action);
        const img = ctx.createImageData(out.w, out.h);
        img.data.set(out.data);
        ctx.putImageData(img, 0, 0);
        if (!centred) {
          centred = true;
          setCentre(middleOf(out));
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [scene]);

  // The wheel zooms instead of scrolling the page while the pointer is on the stage
  // (a native listener: React's wheel handler is passive and cannot stop the scroll).
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setZoom((z) => clampZoom(z * (e.deltaY < 0 ? 1.15 : 1 / 1.15)));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const spread = () => {
    const [a, b] = [...touches.current.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  };
  const lift = (id: number) => {
    touches.current.delete(id);
    if (touches.current.size < 2) pinch.current = null;
    drag.current = null;
  };

  const empty = status === 'ready' && scene?.loaded.length === 0;
  return (
    <div
      ref={stage}
      className="dress__stage"
      style={{ '--zoom': zoom, '--zx': `${centre.x}%`, '--zy': `${centre.y}%` } as React.CSSProperties}
      data-status={empty ? 'empty' : status}
      data-scene={backdrop}
      data-turn={onTurn ? '' : undefined}
      tabIndex={0}
      aria-label={onTurn ? 'ลากซ้ายขวาเพื่อหมุน หมุนล้อเมาส์หรือถ่างสองนิ้วเพื่อซูม' : 'หมุนล้อเมาส์หรือถ่างสองนิ้วเพื่อซูม'}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        touches.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        e.currentTarget.setPointerCapture(e.pointerId);
        if (touches.current.size === 2) {
          drag.current = null; // a second finger: pinch, not turn
          pinch.current = { dist: spread(), zoom };
        } else if (onTurn && touches.current.size === 1) {
          drag.current = { id: e.pointerId, x: e.clientX, dir: look.dir };
        }
      }}
      onPointerMove={(e) => {
        if (!touches.current.has(e.pointerId)) return;
        touches.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        const p = pinch.current;
        if (p && touches.current.size >= 2) {
          setZoom(clampZoom(p.zoom * (spread() / Math.max(1, p.dist))));
          return;
        }
        const d = drag.current;
        if (!onTurn || !d || d.id !== e.pointerId) return;
        const dir = turned(d.dir, Math.round((e.clientX - d.x) / TURN_PX));
        if (dir !== look.dir) onTurn(dir);
      }}
      onPointerUp={(e) => lift(e.pointerId)}
      onPointerCancel={(e) => lift(e.pointerId)}
      onKeyDown={(e) => {
        if (e.key === '+' || e.key === '=') setZoom((z) => clampZoom(z + 0.25));
        else if (e.key === '-') setZoom((z) => clampZoom(z - 0.25));
        else if (onTurn && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) onTurn(turned(look.dir, e.key === 'ArrowRight' ? 1 : -1));
        else return;
        e.preventDefault();
      }}
    >
      <canvas ref={canvas} width={200} height={200} className="dress__canvas" aria-label="ตัวละครที่แต่งไว้" role="img" />
      <div className="dress__zoom" onPointerDown={(e) => e.stopPropagation()}>
        <button type="button" aria-label="ซูมเข้า" disabled={zoom >= ZOOM_MAX} onClick={() => setZoom((z) => clampZoom(z + 0.25))}>+</button>
        <button type="button" aria-label="ซูมออก" disabled={zoom <= 1} onClick={() => setZoom((z) => clampZoom(z - 0.25))}>−</button>
        {zoom > 1 && <button type="button" aria-label="กลับขนาดเดิม" className="dress__zoomreset" onClick={() => setZoom(1)}>{zoom.toFixed(1)}x</button>}
      </div>
      {status === 'unavailable' && (
        <div className="dress__msg dress__msg--err" role="alert">
          <p>ยังโหลดภาพตัวละครไม่ได้</p>
          <button type="button" className="dress__chip" onClick={() => setAttempt((n) => n + 1)}>ลองใหม่</button>
        </div>
      )}
      {empty && <p className="dress__msg">ยังไม่มีภาพ</p>}
      {status === 'loading' && !scene && <p className="dress__msg">กำลังโหลด…</p>}
    </div>
  );
}
