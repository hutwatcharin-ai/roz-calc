// app/database/monsters/[id]/page.tsx
import { mobThresholds } from '@/lib/monster-thresholds';
import ThaiAliasLine from '@/components/ThaiAliasLine';
import { thaiAliasNames } from '@/lib/thai-aliases';
import FormerNameLine from '@/components/FormerNameLine';
import SameNameLine from '@/components/SameNameLine';
import { riskySkills, SKILL_RISK_LABELS } from '@/lib/afk-safety';
import MonsterDropsTable, { type MonsterDropRow } from '@/components/MonsterDropsTable';
import { supabaseBrowser } from '@/lib/supabase';
import { stat, unknownIfZero } from '@/lib/unknown-stat';
import FeedbackButton from '@/components/FeedbackButton';
import type { Metadata } from 'next';
import { cache } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import AggroBadge from '@/components/AggroBadge';
import AddToPlanButton from '@/components/AddToPlanButton';
import JsonLd from '@/components/JsonLd';
import { breadcrumbJsonLd, entityJsonLd } from '@/lib/jsonld';
import MonsterElementPanel from '@/components/MonsterElementPanel';
import MonsterSizePanel from '@/components/MonsterSizePanel';
import MonsterBestWeaponPanel from '@/components/MonsterBestWeaponPanel';
import RecordVisit from '@/components/RecordVisit';
import { getMapCanonical } from '@/lib/map-canonical';
import { foldSpawns, type SpawnRow } from '@/lib/spawn-chips';

// ISR (SEO audit Critical-adjacent, perf #1): game reference data changes only
// when we import — cache the rendered page and let the CDN serve it. A deploy
// or the 24h window busts it.
export const revalidate = 86400;

// Empty on purpose: no paths are prebuilt (build stays fast), but the mere
// presence of generateStaticParams switches the route from per-request SSR to
// on-demand ISR -- first hit renders, later hits come from the page cache.
export async function generateStaticParams() {
  return [];
}



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

  // The Thai name goes in the title when players have been searching for it.
  // Search Console showed us at position 8 to 66 for คาราเมล, วอมเทล, หมาฟ้า
  // and the rest, with no click, because the word was nowhere on the page
  // (lib/thai-aliases). Nothing invented: only names people typed.
  const thai = thaiAliasNames('monsters', monster.id);
  const thaiPart = thai.length > 0 ? ` (${thai.join(' / ')})` : '';

  return {
    title: `${monster.name_en}${thaiPart} (Lv.${monster.level}) — ดรอป จุดเกิด ค่าสถานะ`,
    description: `${monster.name_en}${thai.length > 0 ? ` หรือที่เรียกกันว่า ${thai.join(' / ')}` : ''} ${parts.join(' ')} — ดูของที่ดรอป อัตราดรอป แมพที่เจอ และค่าสถานะครบใน RO Zero Thai`,
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
    .select('rate, items(id, name_en, sell_price, icon_url, slots, category, description, description_th)')
    .eq('monster_id', id)
    .order('rate', { ascending: false });
  if (dropsError) console.error('monster drops query failed', dropsError);

  // Each of these three has its own error slot: a failed spawn/skill/farming
  // query must not read as "this monster has none of that" (which is what
  // `data: null` alone would look like). getMonster's error already gets this
  // treatment above; these three were missing it.
  const { data: spawns, error: spawnsError } = await db
    .from('monster_spawns')
    .select('map_code, map_display_name, amount')
    .eq('monster_id', id)
    .order('map_code');
  if (spawnsError) console.error('monster spawns query failed', spawnsError);
  // 28 rows become 11 chips: channel copies fold into the map that owns the
  // page, and a name shared by several maps gets its code's number.
  const canonical = await getMapCanonical();
  const spawnChips = foldSpawns((spawns ?? []) as SpawnRow[], canonical.byCode);

  // Six display names in this table belong to more than one monster, and the
  // game is the one shipping them that way. Ask whether this is one of them so
  // the page can point at the other rather than leaving two identical search
  // results unexplained.
  const { data: sameName, error: sameNameError } = await db
    .from('monsters')
    .select('id, level')
    .eq('name_en', monster.name_en)
    .neq('id', id)
    .order('level');
  if (sameNameError) console.error('same-name monster query failed', sameNameError);

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
    // Thrown, not rendered: these pages are ISR (revalidate 86400), and a
    // rendered "error, try again" is a successful render that gets cached for
    // a day. Seen 7 Sep 2026 on a transient Supabase timeout. A throw goes to
    // app/error.tsx and is never cached.
    throw new Error(`monster detail query failed: ${error.message}`);
  }

  // A clean query that found no row is a genuine 404 -- unlike the error
  // branch above, which must keep rendering its neutral message and never
  // become a 404 for a query we simply failed to run.
  if (!monster) {
    notFound();
  }
  const zeny = farming?.avg_zeny_per_kill;

  // A dash rather than a number wherever the value is unknown; hp and the two
  // EXP columns read a 0 as unknown too. Both readings live in
  // lib/unknown-stat now, because the monster list had its own copy of the
  // first one and wrote "HP 0" for the monsters this page called "—".
  const num = stat;
  const sentinel = unknownIfZero;

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
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'หน้าแรก', path: '/' },
          { name: 'มอนสเตอร์', path: '/database/monsters' },
          { name: monster.name_en, path: `/database/monsters/${monster.id}` },
        ])}
      />
      <JsonLd
        data={entityJsonLd({
          path: `/database/monsters/${monster.id}`,
          name: monster.name_en,
          description: `มอนสเตอร์ Ragnarok Zero Global เลเวล ${monster.level}`,
          properties: [
            { name: 'Level', value: monster.level },
            ...(monster.race ? [{ name: 'Race', value: monster.race }] : []),
            ...(monster.element ? [{ name: 'Element', value: `${monster.element}${monster.element_level ?? ''}` }] : []),
            ...(monster.size ? [{ name: 'Size', value: monster.size }] : []),
            ...(monster.hp ? [{ name: 'HP', value: monster.hp }] : []),
            ...(monster.base_exp ? [{ name: 'Base EXP', value: monster.base_exp }] : []),
          ],
        })}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        {monster.image_url && (
          <img src={monster.image_url} alt="" width={64} height={64} style={{ imageRendering: 'pixelated' }} />
        )}
        <div>
          <h1 className="pagehead__title">{monster.name_en}</h1>
          <ThaiAliasLine kind="monsters" id={monster.id} />
          <FormerNameLine id={monster.id} />
          <SameNameLine id={monster.id} name={monster.name_en} others={sameName ?? []} />
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

      {/* Fluent one-liner for crawlers and quick readers (GEO audit): the
          headline facts as a sentence, not table fragments. */}
      <p className="muted" style={{ marginTop: 10, maxWidth: '70ch' }}>
        {monster.name_en} มอนสเตอร์เลเวล {monster.level}
        {monster.race ? ` เผ่า ${monster.race}` : ''}
        {monster.element ? ` ธาตุ ${monster.element}${monster.element_level ?? ''}` : ''}
        {monster.size ? ` ขนาด ${monster.size}` : ''}
        {(() => {
          const top = (drops ?? []).find((d: any) => d.items?.name_en && d.rate != null);
          return top ? ` — ดรอปเด่น: ${(top.items as any).name_en} ${top.rate}%` : '';
        })()}
      </p>

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
          {/* No input boxes on a database page (4 Sep 2026): a player who came
              to read stats gets stats. The one who wants their own numbers
              follows this to the calculator, which opens on this monster. */}
          <p style={{ marginTop: 20 }}>
            <Link className="chiplink" href={`/tools/damage?monster=${monster.id}`}>
              คำนวณดาเมจกับตัวนี้ →
            </Link>
          </p>

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

          {/* One card for every number (7 Sep 2026, user: stats are primary,
              skills secondary). Three stacked two-column tables ran half a
              screen; a grid says the same in a third of the height. */}
          <div className="card">
            <h2 className="section-title" id="sec-stats">ค่าสถานะ</h2>
            <div className="statgrid statgrid--five">
              <div className="statgrid__cell"><span className="reward-label">HP</span><span className="reward-value mono">{sentinel(monster.hp)}</span></div>
              <div className="statgrid__cell"><span className="reward-label">ATK</span><span className="reward-value mono">{num(monster.atk_min)}–{num(monster.atk_max)}</span></div>
              <div className="statgrid__cell"><span className="reward-label">MATK</span><span className="reward-value mono">{num(monster.matk_min)}–{num(monster.matk_max)}</span></div>
              <div className="statgrid__cell"><span className="reward-label">DEF</span><span className="reward-value mono">{num(monster.def)}</span></div>
              <div className="statgrid__cell"><span className="reward-label">MDEF</span><span className="reward-value mono">{num(monster.mdef)}</span></div>
            </div>
            <div className="statgrid statgrid--two" style={{ marginTop: 10 }}>
              {(() => {
                // hit_100/flee_95 are midgardhub's player-facing thresholds --
                // they already ARE the targets to show. The old code treated
                // them as raw mob stats and added +20/+75 on top (wrong by
                // exactly that much for a day, 1 Sep).
                const { hit100, flee95 } = mobThresholds(monster);
                return (
                  <>
                    {hit100 !== null && (
                      <div className="statgrid__cell" title="HIT ที่ต้องมีเพื่อตีมอนตัวนี้โดน 100%">
                        <span className="reward-label">ตีโดน 100% ต้องมี HIT</span>
                        <span className="reward-value mono" style={{ color: 'var(--yellow)' }}>{hit100}</span>
                      </div>
                    )}
                    {flee95 !== null && (
                      <div className="statgrid__cell" title="FLEE ที่ต้องมีเพื่อหลบมอนตัวนี้ 95%">
                        <span className="reward-label">หลบ 95% ต้องมี FLEE</span>
                        <span className="reward-value mono" style={{ color: 'var(--cyan)' }}>{flee95}</span>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
            <div className="statgrid statgrid--dense" style={{ marginTop: 10 }}>
              {([['STR', monster.str], ['AGI', monster.agi], ['VIT', monster.vit], ['INT', monster.int_], ['DEX', monster.dex], ['LUK', monster.luk]] as const).map(([label, value]) => (
                <div key={label} className="statgrid__cell">
                  <span className="reward-label">{label}</span>
                  <span className="reward-value mono">{num(value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="card">
            <h2 className="section-title" id="sec-drops">ของที่ดรอป</h2>
            <MonsterDropsTable drops={(drops ?? []) as unknown as MonsterDropRow[]} failed={Boolean(dropsError)} />
          </div>

          <div className="card">
            <h2 className="section-title" id="sec-spawns">จุดเกิด</h2>
            {spawnsError ? (
              <p style={{ color: 'var(--faint)' }}>โหลดข้อมูลจุดเกิดไม่สำเร็จ ลองใหม่อีกครั้ง</p>
            ) : (spawns ?? []).length === 0 ? (
              <p style={{ color: 'var(--faint)' }}>ไม่มีข้อมูลจุดเกิด</p>
            ) : (
              <ul style={{ listStyle: 'none', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {spawnChips.map((c) => (
                  <li key={c.code}>
                    <Link
                      href={`/database/maps/${encodeURIComponent(c.code)}`}
                      className="chip"
                      title={`${c.code}${c.channels > 0 ? ` · อีก ${c.channels} ช่อง` : ''}`}
                    >
                      {c.label}
                      {c.amount != null && <span className="chip__count">×{c.amount}</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Skills are the secondary read (user, 7 Sep). Folded unless one
              of them is the kind that changes where you stand -- summons,
              locks, self-destruct, transform (lib/afk-safety) -- in which
              case the card opens and says which. */}
          {(() => {
            const risks = riskySkills((monsterSkills ?? []).map((s: any) => String(s.skill_name)));
            const count = (monsterSkills ?? []).length;
            return (
          <details className="disclose" id="sec-skills" open={risks.length > 0 || Boolean(skillsError)}>
            <summary>
              สกิลที่มอนใช้
              <span className="disclose__count">
                {skillsError
                  ? 'โหลดไม่สำเร็จ'
                  : count === 0
                    ? 'ไม่มีข้อมูล'
                    : risks.length > 0
                      ? `${count} สกิล · ${risks.map((r) => SKILL_RISK_LABELS[r.risk]).filter((v, i, arr) => arr.indexOf(v) === i).join(', ')}`
                      : `${count} สกิล · ไม่มีอะไรน่าห่วง`}
              </span>
            </summary>
            <div className="disclose__body">
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
          </details>
            );
          })()}
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <FeedbackButton pageType="monster" entityId={String(monster.id)} />
      </div>
    </main>
  );
}
