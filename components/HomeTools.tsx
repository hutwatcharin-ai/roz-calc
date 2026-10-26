'use client';
// The homepage's six tool tiles (owner's pick C, 26 Oct 2026). They replace
// the four MODE cards and the build strip; the level tile comes first because
// the level ranking is what the homepage is used for most (GA4, 28 days to 26
// Oct 2026). Lit cabinet panels, one neon colour each (owner: no repeats).
// Each click is reported (GA4 home_tool_click) so the order can be checked
// against use.
import Link from 'next/link';
import { track } from '@/lib/analytics';

const TOOLS = [
  { id: 'level', href: '/?level=50&range=10#results', icon: '/images/items/1101.gif', title: 'เลเวลนี้ตีอะไรดี', note: 'จัดอันดับมอนคุ้มสุด', c: 'var(--yellow)' },
  { id: 'afk', href: '/tools/leveling-spots?mode=afk', icon: '/images/monsters/1002.gif', title: 'ทิ้งบอทไว้ไหน', note: 'จุด AFK ปลอดภัย', c: 'var(--cyan)' },
  { id: 'zeny', href: '/tools/leveling-spots?mode=zeny', icon: '/images/items/909.gif', title: 'ฟาร์มเงิน', note: 'มอนดรอปขายได้ดี', c: '#5CFF8A' },
  { id: 'gear', href: '/database/equipment', icon: '/images/items/2302.gif', title: 'ของชิ้นนี้ดีไหม', note: 'อุปกรณ์ทุกชิ้น', c: '#FF9A3D' },
  { id: 'dress', href: '/tools/dress-up', icon: '/images/items/2220.gif', title: 'ห้องแต่งตัว', note: 'ลองใส่ก่อนซื้อ', c: 'var(--pink)' },
  { id: 'build', href: '/tools/build', icon: '/images/items/1360.gif', title: 'จำลองบิลด์', note: 'ก่อนลงแต้มจริง', c: '#B26BFF' },
] as const;

export default function HomeTools() {
  return (
    <div className="tiles">
      {TOOLS.map((t) => (
        <Link
          key={t.id}
          href={t.href}
          className="tile"
          style={{ ['--c' as string]: t.c }}
          onClick={() => track('home_tool_click', { tool: t.id })}
        >
          <img src={t.icon} alt="" loading="lazy" />
          <b>{t.title}</b>
          <small>{t.note}</small>
        </Link>
      ))}
    </div>
  );
}
