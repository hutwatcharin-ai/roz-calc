// app/database/monsters/[id]/page.tsx
import { supabaseBrowser } from '@/lib/supabase';
import FeedbackButton from '@/components/FeedbackButton';
import type { Metadata } from 'next';
import { cache } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import AggroBadge from '@/components/AggroBadge';
import { aggroLevel } from '@/lib/aggro-tier';

// Shared by generateMetadata and the page body so a request does one query for
// the row instead of two -- the two callers used to select different column
// lists, which meant Next's fetch memoisation couldn't collapse them. Returns
// the raw { data, error } so each caller keeps its own error handling; this
// helper must not swallow the error itself.
const getMonster = cache(async (id: number) => {
  return await supabaseBrowser().from('monsters').select('*').eq('id', id).maybeSingle();
});

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const { data: monster, error } = await getMonster(Number(params.id));

  // A failed query must not read as "this monster does not exist" -- only a
  // clean query returning no row may claim that. On error we know nothing
  // about the row, so we make no title/description claim either way rather
  // than tell a crawler a live page is dead.
  if (error) {
    console.error('monster detail query failed (metadata)', error);
    return {};
  }

  if (!monster) return { title: 'ไม่พบมอนสเตอร์นี้' };

  // Every value here comes from the row. Nothing is filled in when the column is
  // null -- an invented element or HP would be a factual claim we cannot make.
  const parts = [`เลเวล ${monster.level}`];
  if (monster.element) parts.push(`ธาตุ ${monster.element}`);
  if (monster.race) parts.push(`เผ่า ${monster.race}`);
  // Truthy, not "!== null": 0 is this database's unknown-HP sentinel (see the
  // same convention in kills-per-hour.ts), not a monster with 0 HP, so a
  // missing value must skip this line rather than print "HP 0". A future
  // column where 0 is a real value must not copy this pattern -- use
  // `!== null` there instead.
  if (monster.hp) parts.push(`HP ${monster.hp.toLocaleString('en-US')}`);

  return {
    title: `${monster.name_en} (Lv.${monster.level}) — ดรอป จุดเกิด ค่าสถานะ`,
    description: `${monster.name_en} ${parts.join(' ')} — ดูของที่ดรอป อัตราดรอป แมพที่เจอ และค่าสถานะครบใน ROZ Calc`,
  };
}

export default async function MonsterDetailPage({ params }: { params: { id: string } }) {
  const db = supabaseBrowser();
  const id = Number(params.id);

  // maybeSingle (not single): a missing id must come back as data:null with no
  // error, so a genuine 404 stays distinguishable from a real query failure.
  const { data: monster, error } = await getMonster(id);
  const { data: drops } = await db
    .from('monster_drops')
    .select('rate, items(name_en, sell_price, icon_url)')
    .eq('monster_id', id)
    .order('rate', { ascending: false });

  const { data: spawns } = await db
    .from('monster_spawns')
    .select('map_code, map_display_name')
    .eq('monster_id', id)
    .order('map_code');

  const { data: monsterSkills } = await db
    .from('monster_skills')
    .select('skill_name, skill_lv, rate, cast_time, delay, target, state')
    .eq('monster_id', id)
    .order('entry_index');

  const { data: farming } = await db
    .from('monster_farming_stats')
    .select('avg_zeny_per_kill')
    .eq('monster_id', id)
    .maybeSingle();

  // A failed query must not read as "this monster does not exist".
  if (error) {
    console.error('monster detail query failed', error);
    return <main className="shell" style={{ paddingBlock: 32 }}>เกิดข้อผิดพลาด ลองใหม่อีกครั้ง</main>;
  }

  // A clean query that found no row is a genuine 404 -- unlike the error
  // branch above, which must keep rendering its neutral message and never
  // become a 404 for a query we simply failed to run.
  if (!monster) {
    notFound();
  }

  const aggro = aggroLevel({ is_aggressive: monster.is_aggressive, atk_max: monster.atk_max }, null);
  const zeny = farming?.avg_zeny_per_kill;

  // A dash rather than a number wherever the value is unknown. hp and base_exp
  // of 0 are this database's unknown-value sentinels, not real zeros.
  const num = (v: number | null | undefined) =>
    v === null || v === undefined ? '—' : v.toLocaleString('en-US');
  const sentinel = (v: number | null | undefined) =>
    v === null || v === undefined || v === 0 ? '—' : v.toLocaleString('en-US');

  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        {monster.image_url && (
          <img src={monster.image_url} alt="" width={64} height={64} style={{ imageRendering: 'pixelated' }} />
        )}
        <div>
          <h1 style={{ fontFamily: '"Chakra Petch", sans-serif', fontSize: 32 }}>{monster.name_en}</h1>
          <p style={{ color: 'var(--dim)' }}>
            Lv.{monster.level}
            {monster.race ? ` · ${monster.race}` : ''}
            {monster.element ? ` · ${monster.element}${monster.element_level ?? ''}` : ''}
            {monster.size ? ` · ${monster.size}` : ''}
          </p>
        </div>
        {/* The badge sits in the header, not buried below: it is the reason a
            player opened this page and no competing site shows it. */}
        <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
          <AggroBadge level={aggro} />
          {monster.is_mvp && <span className="aggro aggro--danger">MVP</span>}
          {monster.loots_items && <span className="aggro aggro--caution">เก็บของ</span>}
        </div>
      </div>

      <div className="card card--yellow" style={{ marginTop: 20 }}>
        <div className="reward-row">
          <div><span className="reward-label">Base EXP</span><span className="reward-value mono">{sentinel(monster.base_exp)}</span></div>
          <div><span className="reward-label">Job EXP</span><span className="reward-value mono">{sentinel(monster.job_exp)}</span></div>
          <div>
            <span className="reward-label">Zeny/ตัว</span>
            <span
              className="reward-value mono"
              title="คิดจาก ราคาขายของที่ดรอป × อัตราดรอป ไม่ใช่เงินที่มอนดรอปออกมาตรงๆ"
            >
              {zeny === null || zeny === undefined ? '—' : Number(zeny).toLocaleString('en-US')}
            </span>
          </div>
        </div>
      </div>

      <div className="detail-cols">
        <div className="panel">
          <div className="card">
            <h2 className="section-title">ค่าสถานะ</h2>
            <table className="data-table">
              <tbody>
                <tr><td data-label="HP">HP</td><td className="num">{sentinel(monster.hp)}</td></tr>
                <tr><td data-label="ATK">ATK</td><td className="num">{num(monster.atk_min)} – {num(monster.atk_max)}</td></tr>
                <tr><td data-label="MATK">MATK</td><td className="num">{num(monster.matk_min)} – {num(monster.matk_max)}</td></tr>
                <tr><td data-label="DEF">DEF</td><td className="num">{num(monster.def)}</td></tr>
                <tr><td data-label="MDEF">MDEF</td><td className="num">{num(monster.mdef)}</td></tr>
                <tr><td data-label="FLEE">FLEE</td><td className="num">{num(monster.flee)}</td></tr>
                <tr><td data-label="HIT">HIT</td><td className="num">{num(monster.hit)}</td></tr>
              </tbody>
            </table>
          </div>

          <div className="card">
            <h2 className="section-title">สเตตัสพื้นฐาน</h2>
            <table className="data-table">
              <tbody>
                <tr><td data-label="STR">STR</td><td className="num">{num(monster.str)}</td></tr>
                <tr><td data-label="AGI">AGI</td><td className="num">{num(monster.agi)}</td></tr>
                <tr><td data-label="VIT">VIT</td><td className="num">{num(monster.vit)}</td></tr>
                <tr><td data-label="INT">INT</td><td className="num">{num(monster.int_)}</td></tr>
                <tr><td data-label="DEX">DEX</td><td className="num">{num(monster.dex)}</td></tr>
                <tr><td data-label="LUK">LUK</td><td className="num">{num(monster.luk)}</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <div className="card">
            <h2 className="section-title">ของที่ดรอป</h2>
            <table className="data-table">
              <thead>
                <tr><th>ไอเทม</th><th className="num">อัตราดรอป</th></tr>
              </thead>
              <tbody>
                {(drops ?? []).map((d: any, i: number) => (
                  <tr key={i}>
                    <td data-label="">
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {d.items?.icon_url && (
                          <img src={d.items.icon_url} alt="" width={20} height={20} style={{ imageRendering: 'pixelated' }} />
                        )}
                        {d.items?.name_en ?? '—'}
                      </span>
                    </td>
                    <td data-label="อัตราดรอป" className="num">{d.rate}%</td>
                  </tr>
                ))}
                {(drops ?? []).length === 0 && (
                  <tr><td colSpan={2} data-label="" style={{ color: 'var(--faint)' }}>ไม่มีข้อมูลของที่ดรอป</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="card">
            <h2 className="section-title">จุดเกิด</h2>
            {(spawns ?? []).length === 0 ? (
              <p style={{ color: 'var(--faint)' }}>ไม่มีข้อมูลจุดเกิด</p>
            ) : (
              <ul style={{ listStyle: 'none', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {(spawns ?? []).map((s: any) => (
                  <li key={s.map_code}>
                    <Link href={`/database/maps/${encodeURIComponent(s.map_code)}`} className="chip">
                      {s.map_display_name ?? s.map_code}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card">
            <h2 className="section-title">สกิลที่มอนใช้</h2>
            {(monsterSkills ?? []).length === 0 ? (
              <p style={{ color: 'var(--faint)' }}>ไม่มีข้อมูลสกิล</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr><th>สกิล</th><th className="num">Lv</th><th className="num">โอกาส</th><th>ตอน</th></tr>
                </thead>
                <tbody>
                  {(monsterSkills ?? []).map((s: any, i: number) => (
                    <tr key={i}>
                      {/* skill_name is the game's internal constant. The feed
                          gives no display name here, and inventing one would
                          be inventing a game value. */}
                      <td data-label="" className="mono">{s.skill_name}</td>
                      <td data-label="Lv" className="num">{num(s.skill_lv)}</td>
                      <td data-label="โอกาส" className="num">{s.rate === null ? '—' : `${s.rate}%`}</td>
                      <td data-label="ตอน">{s.state ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <FeedbackButton pageType="monster" entityId={String(monster.id)} />
      </div>
    </main>
  );
}
