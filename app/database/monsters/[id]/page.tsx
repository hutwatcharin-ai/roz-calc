// app/database/monsters/[id]/page.tsx
import { fleeToCapDodge, hitToNeverMiss } from '@/lib/hit-flee';
import { supabaseBrowser } from '@/lib/supabase';
import FeedbackButton from '@/components/FeedbackButton';
import type { Metadata } from 'next';
import { cache } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import AggroBadge from '@/components/AggroBadge';
import KillRatePanel from '@/components/KillRatePanel';
import AddToPlanButton from '@/components/AddToPlanButton';
import MonsterElementPanel from '@/components/MonsterElementPanel';
import MonsterSizePanel from '@/components/MonsterSizePanel';
import MonsterBestWeaponPanel from '@/components/MonsterBestWeaponPanel';
import RecordVisit from '@/components/RecordVisit';

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
    description: `${monster.name_en} ${parts.join(' ')} — ดูของที่ดรอป อัตราดรอป แมพที่เจอ และค่าสถานะครบใน RO Zero Thai`,
  };
}

export default async function MonsterDetailPage({ params }: { params: { id: string } }) {
  const db = supabaseBrowser();
  const id = Number(params.id);

  // maybeSingle (not single): a missing id must come back as data:null with no
  // error, so a genuine 404 stays distinguishable from a real query failure.
  const { data: monster, error } = await getMonster(id);
  // Drops are the reason most players open this page, and a failed query
  // here must not read as "this monster drops nothing" -- the same failure
  // class the spawns/skills/farming queries below were already fixed for.
  const { data: drops, error: dropsError } = await db
    .from('monster_drops')
    .select('rate, items(id, name_en, sell_price, icon_url)')
    .eq('monster_id', id)
    .order('rate', { ascending: false });
  if (dropsError) console.error('monster drops query failed', dropsError);

  // Each of these three has its own error slot: a failed spawn/skill/farming
  // query must not read as "this monster has none of that" (which is what
  // `data: null` alone would look like). getMonster's error already gets this
  // treatment above; these three were missing it.
  const { data: spawns, error: spawnsError } = await db
    .from('monster_spawns')
    .select('map_code, map_display_name')
    .eq('monster_id', id)
    .order('map_code');
  if (spawnsError) console.error('monster spawns query failed', spawnsError);

  const { data: monsterSkills, error: skillsError } = await db
    .from('monster_skills')
    .select('skill_name, skill_lv, rate, cast_time, delay, target, state')
    .eq('monster_id', id)
    .order('entry_index');
  if (skillsError) console.error('monster skills query failed', skillsError);

  const { data: farming, error: farmingError } = await db
    .from('monster_farming_stats')
    .select('avg_zeny_per_kill')
    .eq('monster_id', id)
    .maybeSingle();
  if (farmingError) console.error('monster farming stats query failed', farmingError);

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
  const zeny = farming?.avg_zeny_per_kill;

  // A dash rather than a number wherever the value is unknown. hp and base_exp
  // of 0 are this database's unknown-value sentinels, not real zeros.
  const num = (v: number | null | undefined) =>
    v === null || v === undefined ? '—' : v.toLocaleString('en-US');
  const sentinel = (v: number | null | undefined) =>
    v === null || v === undefined || v === 0 ? '—' : v.toLocaleString('en-US');

  // Exhaustive over every distinct value seen in monster_skills.state (attack,
  // chase, idle, angry, walk, loot, follow, dead) -- ordinary descriptive
  // words, unlike skill_name's internal constants, so these get translated.
  // A value the feed adds later renders verbatim rather than vanishing as
  // '—', which would misreport it as unknown.
  const SKILL_STATE_LABELS: Record<string, string> = {
    attack: 'โจมตี',
    chase: 'ไล่ตาม',
    idle: 'ว่าง',
    angry: 'โกรธ',
    walk: 'เดิน',
    loot: 'เก็บของ',
    follow: 'ตาม',
    dead: 'ตาย',
  };
  const stateLabel = (state: string | null) =>
    state === null ? '—' : (SKILL_STATE_LABELS[state] ?? state);

  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      {/* Half the visits to a detail page come from outside -- search, a shared
          link -- where the browser back button leads off the site. The crumb is
          the way up. */}
      <nav className="crumbs" aria-label="ตำแหน่งหน้า">
        <Link href="/database/monsters">มอนสเตอร์</Link>
        <span className="crumbs__sep" aria-hidden="true">›</span>
        <span className="crumbs__here">{monster.name_en}</span>
      </nav>
      <RecordVisit kind="monster" id={monster.id} name={monster.name_en} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        {monster.image_url && (
          <img src={monster.image_url} alt="" width={64} height={64} style={{ imageRendering: 'pixelated' }} />
        )}
        <div>
          <h1 className="pagehead__title">{monster.name_en}</h1>
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
          <AggroBadge monster={{ is_aggressive: monster.is_aggressive, atk_max: monster.atk_max }} />
          {monster.is_mvp && <span className="tag">MVP</span>}
          {monster.loots_items && <span className="tag">เก็บของ</span>}
          <AddToPlanButton monsterId={monster.id} />
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
              {farmingError
                ? 'โหลดไม่สำเร็จ'
                : zeny === null || zeny === undefined
                  ? '—'
                  : Number(zeny).toLocaleString('en-US')}
            </span>
          </div>
        </div>
      </div>

      {/* Nine sections and 5,600px of page. A reader arrives wanting one of
          them, so the page says which are there and jumps. */}
      <nav className="jumpbar" aria-label="ข้ามไปที่หัวข้อ">
        <a href="#sec-answer">ตีด้วยอะไรดี</a>
        <a href="#sec-drops">ของที่ดรอป</a>
        <a href="#sec-spawns">จุดเกิด</a>
        <a href="#sec-stats">ค่าสถานะ</a>
        <a href="#sec-skills">สกิล</a>
      </nav>

      <div className="detail-cols">
        <div className="panel">
          {/* Answers before reference. The summary used to sit third, at 2,271px
              on a phone, underneath the two thirty-row tables it summarises --
              so a reader decided from half the picture and never saw the line
              that existed to stop exactly that (UX audit F3). */}
          <div id="sec-answer">
          <MonsterBestWeaponPanel
            element={monster.element}
            elementLevel={monster.element_level}
            size={monster.size}
          />
          </div>

          <KillRatePanel
            monsterHp={monster.hp}
            expPerKill={monster.base_exp}
            monsterName={monster.name_en}
          />

          {/* The two reference tables are thirty rows the summary above already
              read for the reader. Open on request rather than scrolled past. */}
          <details className="disclose" id="sec-tables">
            <summary>
              ตารางเต็ม: ธาตุและขนาด
              <span className="disclose__count">10 ธาตุ · 20 ชนิดอาวุธ</span>
            </summary>
            <div className="disclose__body">
              <MonsterElementPanel element={monster.element} elementLevel={monster.element_level} />
              <MonsterSizePanel size={monster.size} />
            </div>
          </details>

          <div className="card">
            <h2 className="section-title" id="sec-stats">ค่าสถานะ</h2>
            <table className="stat-table">
              <tbody>
                <tr><td>HP</td><td className="num">{sentinel(monster.hp)}</td></tr>
                <tr><td>ATK</td><td className="num">{num(monster.atk_min)} – {num(monster.atk_max)}</td></tr>
                <tr><td>MATK</td><td className="num">{num(monster.matk_min)} – {num(monster.matk_max)}</td></tr>
                <tr><td>DEF</td><td className="num">{num(monster.def)}</td></tr>
                <tr><td>MDEF</td><td className="num">{num(monster.mdef)}</td></tr>
                <tr><td>FLEE</td><td className="num">{num(monster.flee)}</td></tr>
                <tr><td>HIT</td><td className="num">{num(monster.hit)}</td></tr>
              </tbody>
            </table>
          </div>

          <div className="card">
            <h2 className="section-title">สเตตัสพื้นฐาน</h2>
            <table className="stat-table">
              <tbody>
                <tr><td>STR</td><td className="num">{num(monster.str)}</td></tr>
                <tr><td>AGI</td><td className="num">{num(monster.agi)}</td></tr>
                <tr><td>VIT</td><td className="num">{num(monster.vit)}</td></tr>
                <tr><td>INT</td><td className="num">{num(monster.int_)}</td></tr>
                <tr><td>DEX</td><td className="num">{num(monster.dex)}</td></tr>
                <tr><td>LUK</td><td className="num">{num(monster.luk)}</td></tr>
              </tbody>
            </table>
            {/* Real per-mob values from the game files (the monsters table
                stores them) -- NOT computed from level+stat: mob mode bonuses
                make the base formula wrong per-monster (Mummy: file FLEE 293
                vs formula 159). Null stays a dash. */}
            {(() => {
              const flee = monster.flee ?? null;
              const hit = monster.hit ?? null;
              if (flee === null && hit === null) return null;
              return (
                <div style={{ marginTop: 12 }}>
                  <h3 className="section-title" style={{ fontSize: 14 }}>แม่นยำ/หลบ</h3>
                  <table className="stat-table">
                    <tbody>
                      {flee !== null && <tr><td>FLEE</td><td className="num">{flee}</td></tr>}
                      {hit !== null && <tr><td>HIT</td><td className="num">{hit}</td></tr>}
                      {flee !== null && (
                        <tr>
                          <td>ตีมันโดน 100% ต้องมี HIT</td>
                          <td className="num" style={{ color: 'var(--yellow)' }}>{hitToNeverMiss(flee)}</td>
                        </tr>
                      )}
                      {hit !== null && (
                        <tr>
                          <td>หลบมัน 95% ต้องมี FLEE</td>
                          <td className="num" style={{ color: 'var(--cyan)' }}>{fleeToCapDodge(hit)}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  <p className="source-note" style={{ marginTop: 6 }}>
                    HIT/FLEE คือค่าจริงจากไฟล์เกม · เป้า &ldquo;โดน 100%&rdquo; = FLEE+20 และ &ldquo;หลบตัน 95%&rdquo; = HIT+75 ตามสูตร Renewal
                  </p>
                </div>
              );
            })()}
          </div>
        </div>

        <div className="panel">
          <div className="card">
            <h2 className="section-title" id="sec-drops">ของที่ดรอป</h2>
            <table className="data-table">
              <thead>
                <tr><th>ไอเทม</th><th className="num">อัตราดรอป</th></tr>
              </thead>
              <tbody>
                {dropsError ? (
                  <tr><td colSpan={2} data-label="" style={{ color: 'var(--faint)' }}>โหลดข้อมูลของที่ดรอปไม่สำเร็จ ลองใหม่อีกครั้ง</td></tr>
                ) : (
                  <>
                    {(drops ?? []).map((d: any, i: number) => (
                      <tr key={i}>
                        <td data-label="">
                          {d.items?.id ? (
                            <Link href={`/database/items/${d.items.id}`} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              {d.items.icon_url && (
                                <img src={d.items.icon_url} alt="" width={20} height={20} style={{ imageRendering: 'pixelated' }} />
                              )}
                              {d.items.name_en ?? '—'}
                            </Link>
                          ) : (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              {d.items?.icon_url && (
                                <img src={d.items.icon_url} alt="" width={20} height={20} style={{ imageRendering: 'pixelated' }} />
                              )}
                              {d.items?.name_en ?? '—'}
                            </span>
                          )}
                        </td>
                        <td data-label="อัตราดรอป" className="num">{d.rate}%</td>
                      </tr>
                    ))}
                    {(drops ?? []).length === 0 && (
                      <tr><td colSpan={2} data-label="" style={{ color: 'var(--faint)' }}>ไม่มีข้อมูลของที่ดรอป</td></tr>
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>

          <div className="card">
            <h2 className="section-title" id="sec-spawns">จุดเกิด</h2>
            {spawnsError ? (
              <p style={{ color: 'var(--faint)' }}>โหลดข้อมูลจุดเกิดไม่สำเร็จ ลองใหม่อีกครั้ง</p>
            ) : (spawns ?? []).length === 0 ? (
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
            <h2 className="section-title" id="sec-skills">สกิลที่มอนใช้</h2>
            {skillsError ? (
              <p style={{ color: 'var(--faint)' }}>โหลดข้อมูลสกิลไม่สำเร็จ ลองใหม่อีกครั้ง</p>
            ) : (monsterSkills ?? []).length === 0 ? (
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
                      <td data-label="ตอน">{stateLabel(s.state)}</td>
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
