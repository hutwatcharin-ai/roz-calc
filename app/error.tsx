'use client';

// Route error boundary. Entity pages throw on a failed database read instead
// of rendering an error message, because a rendered message would be cached
// by ISR for a day (see the throw sites). This is what the reader sees
// instead: a plain line and a retry that re-renders the route.
//
// A tab left open across a deploy asks for the old build's code chunks,
// which the new build no longer has (owner, 19 Oct 2026: clicking from the
// farm tool to another page landed here right after a deploy). That is not
// a database problem and a retry cannot fix it: reload the page once to pick
// up the new build.

import { useEffect } from 'react';

const RELOADED_KEY = 'roz-calc:chunk-reload';

function isStaleBuild(error: Error): boolean {
  return (
    error.name === 'ChunkLoadError' ||
    /Loading (CSS )?chunk|dynamically imported module|Failed to load chunk/i.test(error.message)
  );
}

export default function RouteError({ error }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    if (!isStaleBuild(error)) return;
    try {
      // Once per minute at most, so a chunk that is really missing does not loop.
      const last = Number(window.sessionStorage.getItem(RELOADED_KEY) ?? 0);
      if (Date.now() - last < 60_000) return;
      window.sessionStorage.setItem(RELOADED_KEY, String(Date.now()));
    } catch {
      // No storage: reload anyway, the browser stops a tight loop itself.
    }
    window.location.reload();
  }, [error]);

  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <h1 className="pagehead__title">โหลดข้อมูลไม่สำเร็จ</h1>
      <p className="muted" style={{ marginTop: 8 }}>ฐานข้อมูลตอบช้าหรือไม่ตอบชั่วคราว ลองใหม่ได้เลย</p>
      <p style={{ marginTop: 16 }}>
        {/* A full reload, not reset(): it also cures a stale build, and a
            database read gets a fresh try either way. */}
        <button type="button" className="btn" onClick={() => window.location.reload()}>ลองใหม่</button>
      </p>
    </main>
  );
}
