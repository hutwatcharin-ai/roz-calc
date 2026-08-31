'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function MapAtlasLink() {
  if (usePathname() !== '/database/maps') return null;
  return (
    <aside style={{ maxWidth: 1280, margin: '20px auto 0', paddingInline: 'var(--shell)' }}>
      <Link href="/database/world-map" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, padding: '12px 16px', border: '1px solid var(--cyan)', borderRadius: 'var(--radius)', background: 'var(--panel)', color: 'var(--text)', textDecoration: 'none' }}>
        <span><strong style={{ display: 'block', color: 'var(--cyan)' }}>เปิดแผนที่โลกแบบโต้ตอบ</strong><small style={{ color: 'var(--dim)' }}>ซูม ลาก ค้นหาเมือง ดันเจียน และมอนสเตอร์</small></span>
        <b aria-hidden="true">→</b>
      </Link>
    </aside>
  );
}
