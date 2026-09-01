import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { supabaseBrowser } from '@/lib/supabase';
import { mobThresholds } from '@/lib/monster-thresholds';

// Per-monster OG card: sharing a monster page into LINE/FB group chat shows
// the monster's own numbers instead of the generic site image (SEO audit,
// Low #5). Text-only on purpose — satori cannot decode the GIF sprites, and
// the PCX incident showed concurrent image work can take a small VPS down,
// so this stays one cheap cached render per monster per week.
export const revalidate = 604800;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'สรุปค่ามอนสเตอร์';

export default async function Image({ params }: { params: { id: string } }) {
  const [bold, regular, { data: monster }] = await Promise.all([
    readFile(path.join(process.cwd(), 'assets/fonts/Sarabun-Bold.ttf')),
    readFile(path.join(process.cwd(), 'assets/fonts/Sarabun-Regular.ttf')),
    supabaseBrowser().from('monsters').select('name_en, level, race, element, element_level, size, hp, base_exp, hit, flee').eq('id', Number(params.id)).maybeSingle(),
  ]);

  const name = monster?.name_en ?? 'Monster';
  const meta = [
    monster?.level != null ? `Lv.${monster.level}` : null,
    monster?.race,
    monster?.element ? `${monster.element}${monster.element_level ?? ''}` : null,
    monster?.size,
  ].filter(Boolean).join(' · ');
  const { hit100, flee95 } = mobThresholds(monster ?? undefined);
  const stats: [string, string][] = [];
  if (monster?.hp && monster.hp > 0) stats.push(['HP', monster.hp.toLocaleString()]);
  if (monster?.base_exp && monster.base_exp > 0) stats.push(['Base EXP', monster.base_exp.toLocaleString()]);
  if (hit100 != null) stats.push(['ตีโดน 100% ที่ HIT', String(hit100)]);
  if (flee95 != null) stats.push(['หลบ 95% ที่ FLEE', String(flee95)]);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#0B0820',
          color: '#F4F2FF',
          padding: 64,
          fontFamily: 'Sarabun',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 84, fontWeight: 700, lineHeight: 1.1 }}>{name}</div>
          <div style={{ fontSize: 36, color: '#B3A9E6', marginTop: 12 }}>{meta}</div>
        </div>
        <div style={{ display: 'flex', gap: 40 }}>
          {stats.slice(0, 4).map(([label, value]) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 26, color: '#8F86C4' }}>{label}</div>
              <div style={{ fontSize: 48, fontWeight: 700, color: '#FFE53D' }}>{value}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 32, fontWeight: 700 }}>
            RO ZERO<span style={{ color: '#FFE53D' }}>THAI</span>
          </div>
          <div style={{ fontSize: 26, color: '#8F86C4' }}>ฐานข้อมูล Ragnarok Zero ภาษาไทย · rozerothai.com</div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Sarabun', data: bold, weight: 700 },
        { name: 'Sarabun', data: regular, weight: 400 },
      ],
    },
  );
}
