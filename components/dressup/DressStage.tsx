'use client';
// The character on a 200x200 canvas, drawn by lib/dress-up/render.ts from the
// parts the look needs and scaled up 3x with nearest-neighbour pixels. Each
// part keeps its own frame clock (lib/dress-up/look.ts frameFor); the canvas
// is only redrawn when some part's frame changes.
import { useEffect, useMemo, useRef, useState } from 'react';
import { actionFor, drawable, frameFor, type Look, type PartRef } from '@/lib/dress-up/look';
import { DressUpUnavailable, loadPart, type LoadedPart } from '@/lib/dress-up/load';
import { composeFrame } from '@/lib/dress-up/render';
import type { Placed } from '@/lib/dress-up/types';

type Loaded = PartRef & LoadedPart;
type Status = 'loading' | 'ready' | 'unavailable';

export default function DressStage({ look }: { look: Look }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [loaded, setLoaded] = useState<Loaded[] | null>(null);
  const { parts } = useMemo(() => drawable(look), [look]);
  const partKey = parts.map((p) => p.key).join('|');

  // Fetch the parts; the previous drawing stays up until the new set is in.
  useEffect(() => {
    let alive = true;
    setStatus((s) => (s === 'unavailable' ? s : 'loading'));
    Promise.all(parts.map((p) => loadPart(p.key)))
      .then((got) => {
        if (!alive) return;
        setLoaded(parts.map((p, i) => ({ ...p, ...got[i] })));
        setStatus('ready');
      })
      .catch((e) => {
        if (!alive) return;
        if (!(e instanceof DressUpUnavailable)) console.error('dress-up: load failed', e);
        setStatus('unavailable');
      });
    return () => { alive = false; };
    // partKey stands for parts
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partKey]);

  // Animate: restart the clock whenever the look or its parts change.
  useEffect(() => {
    const ctx = canvas.current?.getContext('2d');
    if (!ctx || !loaded || loaded.length === 0) return;
    const action = actionFor(look);
    const start = performance.now();
    let last = '';
    let raf = 0;
    const tick = (now: number) => {
      const ms = now - start;
      const frames = loaded.map((p) => frameFor(p.kind, p.part, action, look, ms));
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
  }, [loaded, look]);

  return (
    <div className="dress__stage" data-status={status}>
      <canvas ref={canvas} width={200} height={200} className="dress__canvas" aria-label="ตัวละครที่แต่งไว้" role="img" />
      {status === 'unavailable' && (
        <p className="dress__msg dress__msg--err" role="alert">ยังโหลดภาพตัวละครไม่ได้</p>
      )}
      {status === 'loading' && !loaded && <p className="dress__msg">กำลังโหลด…</p>}
    </div>
  );
}
