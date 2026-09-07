'use client';

// Route error boundary. Entity pages throw on a failed database read instead
// of rendering an error message, because a rendered message would be cached
// by ISR for a day (see the throw sites). This is what the reader sees
// instead: a plain line and a retry that re-renders the route.

export default function RouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <h1 className="pagehead__title">โหลดข้อมูลไม่สำเร็จ</h1>
      <p className="muted" style={{ marginTop: 8 }}>ฐานข้อมูลตอบช้าหรือไม่ตอบชั่วคราว ลองใหม่ได้เลย</p>
      <p style={{ marginTop: 16 }}>
        <button type="button" className="btn" onClick={() => reset()}>ลองใหม่</button>
      </p>
    </main>
  );
}
