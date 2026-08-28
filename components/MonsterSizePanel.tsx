// components/MonsterSizePanel.tsx
//
// The size table read for one monster: which weapon types hit it for full, and
// which lose a quarter or a half before element even applies.

import Link from 'next/link';
import { SIZE_LABELS, bestWeaponsFor, parseSize } from '@/lib/size-table';

export default function MonsterSizePanel({ size }: { size: string | null }) {
  const parsed = parseSize(size);

  // A size the feed never gave, or one we have not seen, shows nothing rather
  // than advice for whichever size happened to be the default.
  if (parsed === null) return null;

  const ranked = bestWeaponsFor(parsed);
  const full = ranked.filter((row) => row[parsed] >= 100);
  const worst = ranked.filter((row) => row[parsed] <= 50);

  return (
    <div className="card">
      <h2 className="section-title">อาวุธชนิดไหนตีตัวนี้ได้เต็ม</h2>
      <p className="muted" style={{ marginBottom: 10 }}>
        ตัวนี้ขนาด{SIZE_LABELS[parsed]}
      </p>

      <table className="stat-table">
        <tbody>
          {ranked.map((row) => (
            <tr key={row.weapon}>
              <td>
                {row.weapon}
                <span className="muted" style={{ fontSize: 12, marginInlineStart: 6 }}>
                  {row.label}
                </span>
              </td>
              <td
                className="num"
                style={{
                  color:
                    row[parsed] <= 50
                      ? 'var(--status-danger)'
                      : row[parsed] < 100
                        ? undefined
                        : 'var(--status-safe)',
                }}
              >
                {row[parsed]}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="muted" style={{ marginTop: 10 }}>
        ตีได้เต็ม {full.length} ชนิด
        {worst.length > 0 && ` · เหลือครึ่งเดียวถ้าใช้ ${worst.map((r) => r.weapon).join(', ')}`}
      </p>

      <p className="muted">
        ตัวเลขมาจาก <Link href="/tools/sizes">ตารางขนาด</Link> ของคู่มือเกมทางการ ·
        คิดก่อนตัวคูณธาตุ
      </p>
    </div>
  );
}
