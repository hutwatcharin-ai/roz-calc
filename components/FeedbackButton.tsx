// components/FeedbackButton.tsx
'use client';

import { useState } from 'react';

export default function FeedbackButton({ pageType, entityId }: { pageType: string; entityId: string }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [failed, setFailed] = useState(false);

  async function submit() {
    setFailed(false);
    // Stored through app/api/feedback since 12 Oct 2026: the browser holds
    // no database key any more.
    let error: unknown = null;
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageType, entityId, message }),
      });
      if (!res.ok) error = new Error(`HTTP ${res.status}`);
    } catch (err) {
      error = err;
    }
    if (error) {
      console.error('feedback insert failed', error);
      setFailed(true);
      return;
    }
    setSent(true);
    setMessage('');
  }

  if (sent) {
    return <p style={{ color: 'var(--dim)', fontSize: 13 }}>ขอบคุณ ส่งข้อมูลแล้ว</p>;
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} style={{ fontSize: 12, color: 'var(--faint)', background: 'none', border: '1px solid var(--hair)', borderRadius: 6, padding: '6px 10px', cursor: 'pointer' }}>
        แจ้งข้อมูลผิด
      </button>
    );
  }

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          className="mono"
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            if (failed) setFailed(false);
          }}
          placeholder="อธิบายจุดที่ผิด"
          style={{ flex: 1 }}
        />
        <button type="button" onClick={submit} disabled={!message.trim()}>ส่ง</button>
      </div>
      {failed && (
        <p style={{ marginTop: 6, fontSize: 12, color: 'var(--pink)' }}>ส่งไม่สำเร็จ ลองอีกครั้ง</p>
      )}
    </div>
  );
}
