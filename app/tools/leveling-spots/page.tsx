// app/tools/leveling-spots/page.tsx
//
// "Where should I go now?" -- maps ranked for one level. The ranking itself is
// in lib/leveling-spots.ts; this file only fetches the window of monsters
// around the level and groups them by map.
import PageHeader from '@/components/PageHeader';
import Caveat from '@/components/Caveat';
import FarmSpots, { type FarmMode } from '@/components/FarmSpots';
import { supabaseBrowser } from '@/lib/supabase';
import { fetchAllRows } from '@/lib/fetch-all-rows';
import { LEVEL_SPAN, type Spot } from '@/lib/leveling-spots';
import { isCVariant } from '@/lib/c-variant';

export const revalidate = 86400;

export const metadata = {
  title: 'ฟาร์มที่ไหนดี — แมพเก็บเลเวล จุด AFK และแผนของคุณ',
  description:
    'ใส่เลเวลแล้วดูได้เลยว่าควรไปแมพไหนใน Ragnarok Zero Global · สลับเป็นโหมดหาจุดทิ้งบอท AFK หรือเทียบมอนที่เลือกไว้ · ใส่ดาเมจกับ ASPD เพิ่มเพื่อคิดเป็น EXP ต่อชั่วโมงจริงของคุณ',
};

const DEFAULT_LEVEL = 50;

function readLevel(raw: string | string[] | undefined): number {
  const value = Number(Array.isArray(raw) ? raw[0] : raw);
  if (!Number.isFinite(value)) return DEFAULT_LEVEL;
  return Math.min(200, Math.max(1, Math.round(value)));
}

async function getSpots(level: number): Promise<{ spots: Spot[]; failed: boolean }> {
  const db = supabaseBrowser();

  // The window is the taper's width: a monster outside it scores 0 anyway, so
  // fetching it would only make the payload bigger.
  const { data: monsters, error: monstersError } = await db
    .from('monsters')
    .select('id, name_en, level, hp, base_exp, hit_100, is_aggressive')
    .gte('level', level - LEVEL_SPAN)
    .lte('level', level + LEVEL_SPAN)
    .order('id');

  if (monstersError) {
    console.error('leveling spots monster query failed', monstersError);
    return { spots: [], failed: true };
  }

  // Challenge clones share their parent's map and stats and would double every
  // map's population -- the same rule every other monster surface applies.
  const inWindow = (monsters ?? []).filter((m) => !isCVariant(m.name_en));
  const byId = new Map(inWindow.map((m) => [m.id, m]));
  if (byId.size === 0) return { spots: [], failed: false };

  const { data: spawns, error: spawnsError } = await fetchAllRows<{
    monster_id: number;
    map_code: string;
    map_display_name: string | null;
    amount: number | null;
  }>((from, to) =>
    db
      .from('monster_spawns')
      .select('monster_id, map_code, map_display_name, amount')
      .in('monster_id', [...byId.keys()])
      .order('map_code')
      .range(from, to),
  );

  if (spawnsError) {
    console.error('leveling spots spawn query failed', spawnsError);
    return { spots: [], failed: true };
  }

  const spots = new Map<string, Spot>();
  for (const spawn of spawns ?? []) {
    const monster = byId.get(spawn.monster_id);
    if (!monster) continue;
    const spot =
      spots.get(spawn.map_code) ??
      { map_code: spawn.map_code, map_name: spawn.map_display_name ?? spawn.map_code, monsters: [] };
    spot.monsters.push({
      monster_id: monster.id,
      name_en: monster.name_en,
      level: monster.level,
      hp: monster.hp,
      base_exp: monster.base_exp,
      hit_100: monster.hit_100,
      is_aggressive: monster.is_aggressive,
      amount: spawn.amount,
    });
    spots.set(spawn.map_code, spot);
  }

  return { spots: [...spots.values()], failed: false };
}

export default async function LevelingSpotsPage({
  searchParams,
}: {
  searchParams: { level?: string | string[]; mode?: string | string[] };
}) {
  const level = readLevel(searchParams.level);
  const rawMode = Array.isArray(searchParams.mode) ? searchParams.mode[0] : searchParams.mode;
  const mode: FarmMode = rawMode === 'afk' || rawMode === 'plan' ? rawMode : 'level';
  const { spots, failed } = await getSpots(level);

  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <PageHeader title="ฟาร์มที่ไหนดี" />
      <p className="muted" style={{ marginTop: -6, marginBottom: 16, maxWidth: '70ch' }}>
        ใส่แค่เลเวลก็ได้คำตอบแล้ว — จะใส่ดาเมจกับ ASPD เพิ่มก็ได้ แล้วอันดับจะเปลี่ยนเป็น EXP ต่อชั่วโมงที่คุณทำได้จริง
      </p>

      {failed ? (
        <p className="muted">ดึงข้อมูลไม่สำเร็จ ลองใหม่อีกครั้ง</p>
      ) : (
        <FarmSpots spots={spots} level={level} initialMode={mode} />
      )}

      <Caveat>
        เวลาที่คิดคือเวลาที่ตีอยู่เท่านั้น ไม่รวมเดินหามอนกับรอเกิดใหม่ ของจริงน้อยกว่าเสมอ ·
        &ldquo;EXP/ชม. เฉลี่ยทั้งแมพ&rdquo; คิดว่าคุณตีมอนที่เดินชนตามสัดส่วนจำนวนตัวในแมพ ไม่ใช่ไล่ล่าตัวที่คุ้มสุดตัวเดียว ·
        จำนวนมอนต่อแมพมาจาก rozerodb (2,725 จาก 3,032 จุดเกิดมีตัวเลข ที่เหลือขึ้น &ldquo;—&rdquo;) ·
        โอกาสตีโดนมาจากค่า hit_100 ของ midgardhub เทียบกับ HIT ของคุณ
      </Caveat>
    </main>
  );
}
