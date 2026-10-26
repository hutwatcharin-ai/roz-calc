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

export default function DressStage({ look, onTurn }: { look: Look; onTurn?: (dir: number) => void }) {
  const drag = useRef<{ id: number; x: number; dir: number } | null>(null);
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
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [scene]);

  const empty = status === 'ready' && scene?.loaded.length === 0;
  return (
    <div
      className="dress__stage"
      data-status={empty ? 'empty' : status}
      data-turn={onTurn ? '' : undefined}
      tabIndex={onTurn ? 0 : undefined}
      aria-label={onTurn ? 'ลากซ้ายขวาหรือกดลูกศรเพื่อหมุนตัวละคร' : undefined}
      onPointerDown={onTurn && ((e) => {
        if (e.button !== 0) return;
        drag.current = { id: e.pointerId, x: e.clientX, dir: look.dir };
        e.currentTarget.setPointerCapture(e.pointerId);
      })}
      onPointerMove={onTurn && ((e) => {
        const d = drag.current;
        if (!d || d.id !== e.pointerId) return;
        const dir = turned(d.dir, Math.round((e.clientX - d.x) / TURN_PX));
        if (dir !== look.dir) onTurn(dir);
      })}
      onPointerUp={() => { drag.current = null; }}
      onPointerCancel={() => { drag.current = null; }}
      onKeyDown={onTurn && ((e) => {
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
        e.preventDefault();
        onTurn(turned(look.dir, e.key === 'ArrowRight' ? 1 : -1));
      })}
    >
      <canvas ref={canvas} width={200} height={200} className="dress__canvas" aria-label="ตัวละครที่แต่งไว้" role="img" />
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
