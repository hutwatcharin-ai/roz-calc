// app/tools/hit-flee/page.tsx
//
// "ตีโดนไหม / หลบได้ไหม" -- the renewal hit/flee math (lib/hit-flee.ts) turned
// into a tool: enter Lv/DEX/AGI/LUK, get your HIT and FLEE, and see every
// monster in your level band with the chance you hit it and the chance it
// hits you. GET params, not the character bar: this page must work as a
// shareable link ("ดูตารางกู" in a game chat) with no setup.
import HitFleeTable, { type HitFleeRow } from '@/components/HitFleeTable';
import { supabaseBrowser } from '@/lib/supabase';
import PageHeader from '@/components/PageHeader';
import { playerFlee, playerHit } from '@/lib/hit-flee';

export const metadata = {
  title: 'คำนวณ HIT/FLEE Ragnarok Zero',
  description:
    'กรอก HIT/FLEE จากหน้าต่างสเตตัส แล้วดูว่าตีมอนแต่ละตัวโดนกี่เปอร์เซ็นต์ และมอนตีคุณโดนแค่ไหน ใน Ragnarok Zero',
};

export const revalidate = 86400;

export default async function HitFleePage({
  searchParams,
}: {
  searchParams: { lv?: string; hit?: string; flee?: string; dex?: string; agi?: string; luk?: string; range?: string };
}) {
  const lv = Math.max(0, Number(searchParams.lv ?? 0) || 0);
  const range = Math.max(1, Number(searchParams.range ?? 10) || 10);

  // Since the mob side is player-facing thresholds, the player side needs no
  // formula either: type HIT/FLEE straight off the status window (Alt+A),
  // same call as character-context v2 (user, 2 Sep). Old shared links that
  // carried dex/agi/luk still resolve through the Renewal formulas.
  const hitParam = Math.max(0, Number(searchParams.hit ?? 0) || 0);
  const fleeParam = Math.max(0, Number(searchParams.flee ?? 0) || 0);
  const dex = Math.max(0, Number(searchParams.dex ?? 0) || 0);
  const agi = Math.max(0, Number(searchParams.agi ?? 0) || 0);
  const luk = Math.max(0, Number(searchParams.luk ?? 0) || 0);
  const legacy = hitParam === 0 && fleeParam === 0 && (dex > 0 || agi > 0 || luk > 0);

  const myHit = hitParam > 0 ? hitParam : legacy && lv > 0 ? playerHit(lv, dex, luk) : null;
  const myFlee = fleeParam > 0 ? fleeParam : legacy && lv > 0 ? playerFlee(lv, agi, luk) : null;
  const filled = lv > 0 && myHit !== null && myFlee !== null;

  const db = supabaseBrowser();
  const { data: monsters, error } = filled
    ? await db
        .from('monsters')
        .select('id, name_en, level, hit_100, flee_95, image_url, is_aggressive, atk_max')
        .gte('level', Math.max(1, lv - range))
        .lte('level', lv + range)
        .not('name_en', 'like', 'C_ %')
        .order('level')
        .order('id')
        .limit(120)
    : { data: null, error: null };
  if (error) console.error('hit-flee monsters query failed', error);

  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <PageHeader
        title="คำนวณ HIT / FLEE — ตีโดนไหม หลบพ้นไหม"
        lead="กรอก HIT/FLEE จากหน้าต่างสเตตัส (Alt+A) แล้วดูเป็นเปอร์เซ็นต์: คุณตีมอนโดนแค่ไหน และมอนตีคุณโดนแค่ไหน"
        source={
          <>
            <strong>ที่มา:</strong> ฝั่งมอนใช้ค่าเป้าที่วัดแล้วจาก midgardhub (HIT ที่ตีโดน 100% / FLEE ที่หลบได้ 95%) · โอกาสขยับ 1% ต่อ 1 แต้ม (ขั้นต่ำ 5% เพดาน 100%)
          </>
        }
      />

      <form className="filterbar">
        <label>
          Lv{' '}
          <input className="mono" type="number" name="lv" defaultValue={lv > 0 ? lv : ''} inputMode="numeric" style={{ width: 76 }} required />
        </label>
        <label>
          HIT{' '}
          <input className="mono" type="number" name="hit" defaultValue={myHit ?? ''} inputMode="numeric" style={{ width: 90 }} required />
        </label>
        <label>
          FLEE{' '}
          <input className="mono" type="number" name="flee" defaultValue={myFlee ?? ''} inputMode="numeric" style={{ width: 90 }} required />
        </label>
        <label>
          ±<input className="mono" type="number" name="range" defaultValue={range} inputMode="numeric" style={{ width: 64 }} aria-label="ช่วงเลเวลมอน" />
        </label>
        <button type="submit" className="btn">คำนวณ</button>
      </form>

      {filled && myHit !== null && myFlee !== null && (
        <div className="statgrid" style={{ marginTop: 16 }}>
          <div className="statgrid__cell">
            <span className="reward-label">HIT ของคุณ</span>
            <span className="reward-value mono">{myHit}</span>
          </div>
          <div className="statgrid__cell">
            <span className="reward-label">FLEE ของคุณ</span>
            <span className="reward-value mono">{myFlee}</span>
          </div>
        </div>
      )}

      {!filled && (
        <p className="muted" style={{ marginTop: 18, maxWidth: '65ch' }}>
          ใส่เลเวลกับ HIT/FLEE จากหน้าต่างสเตตัส (Alt+A) แล้วกดคำนวณ —
          ได้ตารางต่อมอน: ตีโดนกี่ % โดนตีกี่ % และเป้า HIT/FLEE สำหรับ &ldquo;โดน 100%&rdquo; / &ldquo;หลบตัน 95%&rdquo; · เลเวลใช้เลือกช่วงมอนที่โชว์เท่านั้น
        </p>
      )}

      {filled && (monsters ?? []).length === 0 && (
        <p className="muted" style={{ marginTop: 18 }}>ไม่พบมอนในช่วงเลเวลนี้</p>
      )}

      {filled && (monsters ?? []).length > 0 && myHit !== null && myFlee !== null && (
        <div className="card" style={{ marginTop: 16, overflowX: 'auto' }}>
          <HitFleeTable monsters={(monsters ?? []) as HitFleeRow[]} myHit={myHit} myFlee={myFlee} />
          <p className="source-note">
            มอนที่ขึ้น — คือตัวที่ไม่มีค่า HIT/FLEE ในไฟล์เกม (ราว 34 จาก 524 ตัว) · มอน Challenge ไม่รวมในตารางนี้
          </p>
        </div>
      )}
    </main>
  );
}
