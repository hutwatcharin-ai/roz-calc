// app/guides/classes/[job]/page.tsx
//
// One build guide per job. The words live in lib/class-guides/<job>.ts; this
// page only lays them out, so every job reads the same way.
//
// Built to be used, not read top to bottom (owner, 22 Sep 2026: "easy to read,
// pictures wherever they fit, a table of contents"):
// - a contents list, open on phones, a sticky side column on wide screens;
// - each build opens with a one-glance summary -- target stats, the key
//   skills and gear as icons -- before the detail;
// - the full point plan folds away, since it is a reference, not a read;
// - sources sit on their own quiet line under each claim instead of pills in
//   the middle of the sentence, and still open the clip at the second.
// Nearly all of it comes from players' videos, so every line keeps its source.
import Link from 'next/link';
import AdsenseUnit from '@/components/AdsenseUnit';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import JsonLd from '@/components/JsonLd';
import { breadcrumbJsonLd } from '@/lib/jsonld';
import { supabaseBrowser } from '@/lib/supabase';
import { itemHref } from '@/lib/item-href';
import { mapImage } from '@/lib/map-image';
import { CLASS_GUIDES, citeHref, classGuide } from '@/lib/class-guides';
import type { Cite, CitedLine, ClassBuild, ClassGuide, StatRow } from '@/lib/class-guides/types';
import { buildPlan, type JobPlan } from '@/lib/skill-plan';
import trees from '@/data/skill-trees.json';

export const revalidate = 86400;

export function generateStaticParams() {
  return CLASS_GUIDES.map((guide) => ({ job: guide.slug }));
}

export function generateMetadata({ params }: { params: { job: string } }): Metadata {
  const guide = classGuide(params.job);
  if (!guide) return {};
  return {
    title: `${guide.job} บิลด์ Ragnarok Zero — สกิล สเตตัส ของสวมใส่`,
    description: `ไกด์ ${guide.job} (${guide.jobTh}) RO Zero Global: ${guide.builds.map((b) => b.name).join(', ')} พร้อมแผนอัพสกิล การแจกสเตตัส เส้นทางเก็บเลเวล และของที่ควรใส่ ทุกข้อลิงก์ไปคลิปต้นทาง`,
  };
}

type SkillInfo = { name: string; icon_url: string | null; max_level: number | null };
type ItemInfo = { id: number; name_en: string; icon_url: string | null; category: string | null };
type MonsterInfo = { id: number; name_en: string; level: number; image_url: string | null };

interface Lookups {
  guide: ClassGuide;
  skills: Map<string, SkillInfo>;
  items: Map<number, ItemInfo>;
}

const JOB_NAMES: Record<string, string> = Object.fromEntries(
  Object.entries((trees as { jobs: Record<string, { name: string }> }).jobs).map(([slug, job]) => [slug, job.name]),
);

const STAT_KEYS = ['str', 'agi', 'vit', 'int', 'dex', 'luk'] as const;

function youtubeId(url: string): string | null {
  return /[?&]v=([\w-]{11})/.exec(url)?.[1] ?? null;
}

/** The claim's sources on one quiet line under it. */
function Src({ cites, guide }: { cites: Cite[]; guide: ClassGuide }) {
  if (!cites.length) return null;
  return (
    <small className="cguide__src">
      ที่มา{' '}
      {cites.map(([key, at], i) => {
        const source = guide.sources[key];
        if (!source) return null;
        const label = at ? `${source.label} ${at}` : source.label;
        const href = citeHref(source.url, at);
        return (
          <span key={i}>
            {i > 0 && ' · '}
            {href ? (
              <a href={href} target="_blank" rel="noopener noreferrer" title={`${source.title}${at ? ` (นาที ${at})` : ''}`}>
                {source.kind === 'clip' && <span aria-hidden="true">▶ </span>}{label}
              </a>
            ) : (
              <span title={source.title}>{label}</span>
            )}
          </span>
        );
      })}
    </small>
  );
}

function Lines({ lines, guide }: { lines: CitedLine[]; guide: ClassGuide }) {
  return (
    <ul className="cguide__lines">
      {lines.map((line, i) => (
        <li key={i}>
          {line.text}
          <Src cites={line.cites} guide={guide} />
        </li>
      ))}
    </ul>
  );
}

function ItemChips({ ids, items }: { ids?: number[]; items: Map<number, ItemInfo> }) {
  if (!ids?.length) return null;
  return (
    <span className="cguide__items">
      {ids.map((id) => {
        const item = items.get(id);
        if (!item) return null;
        return (
          <Link key={id} className="chip" href={itemHref(id, item.category)}>
            {item.icon_url && <img src={item.icon_url} alt="" width={24} height={24} loading="lazy" />}
            {item.name_en}
          </Link>
        );
      })}
    </span>
  );
}

function statNumber(value?: string): number | null {
  const nums = (value ?? '').match(/\d+/g);
  return nums ? Math.max(...nums.map(Number)) : null;
}

/** One player's stats as bars; words like "ที่เหลือ" stay words. */
function StatBars({ row, guide }: { row: StatRow; guide: ClassGuide }) {
  const shown = STAT_KEYS.filter((k) => row[k]);
  return (
    <div className="cguide__statcard">
      <strong>{row.who}</strong>
      {shown.length > 0 ? (
        <dl className="cguide__bars">
          {shown.map((k) => {
            const n = statNumber(row[k]);
            return (
              <div key={k} className="cguide__bar">
                <dt className="mono">{k.toUpperCase()}</dt>
                <dd>
                  <span className={`cguide__fill${n === null ? ' is-rest' : ''}`} style={{ width: `${n === null ? 100 : Math.min(100, n)}%` }} aria-hidden="true" />
                  <span className="cguide__val mono">{row[k]}</span>
                </dd>
              </div>
            );
          })}
        </dl>
      ) : (
        <p className="muted">คลิปไม่ได้บอกตัวเลข</p>
      )}
      {row.note && <p className="cguide__note">{row.note}</p>}
      <Src cites={row.cites} guide={guide} />
    </div>
  );
}

function SkillIcon({ name, skills, size = 24 }: { name: string; skills: Map<string, SkillInfo>; size?: number }) {
  const icon = skills.get(name)?.icon_url;
  return icon
    ? <img src={icon} alt="" width={size} height={size} loading="lazy" />
    : <span className="cguide__skill-blank" style={{ width: size, height: size }} aria-hidden="true" />;
}

// The full point plan: every prerequisite in, every point counted. Worked out
// by lib/skill-plan.ts from the build's picks, never typed in.
function PlanView({ plans, skills }: { plans: JobPlan[]; skills: Map<string, SkillInfo> }) {
  return (
    <div className="cguide__plan">
      {plans.map((plan) => (
        <div key={plan.job} className="cguide__planjob">
          <h4>
            {JOB_NAMES[plan.job] ?? plan.job}
            <span className={`mono cguide__points${plan.used > plan.budget ? ' is-over' : ''}`}>
              {plan.used}/{plan.budget} แต้ม{plan.budget - plan.used > 0 ? ` · เหลือ ${plan.budget - plan.used}` : ''}
            </span>
          </h4>
          <ul>
            {plan.rows.map((row) => (
              <li key={row.name} className={row.reason === 'prereq' ? 'is-prereq' : undefined}>
                <SkillIcon name={row.name} skills={skills} size={20} />
                <span className="cguide__planname">{row.name}</span>
                <span className="mono cguide__lv">{row.free ? 'ฟรี' : `${row.level}/${row.max}`}</span>
                {row.reason === 'prereq' && <span className="cguide__via">ทางผ่านของ {row.neededBy.join(', ')}</span>}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function planSummary(plans: JobPlan[]): string {
  return plans.map((p) => `${JOB_NAMES[p.job] ?? p.job} ${p.used}/${p.budget}`).join(' · ');
}

function BuildSection({ build, look, plans }: { build: ClassBuild; look: Lookups; plans: JobPlan[] | null }) {
  const { guide, skills, items } = look;
  const keyItems = [...new Set((build.gear ?? []).flatMap((g) => g.items ?? []))].slice(0, 6);
  const topStats = build.stats?.find((row) => STAT_KEYS.some((k) => row[k]));
  let step = 0;
  const h = (title: string) => <h3 className="cguide__h3"><span className="cguide__num mono">{++step}</span>{title}</h3>;

  return (
    <section id={build.id} className="card cguide__build">
      <h2 className="cguide__buildtitle">
        {build.name}
        {build.tag && <span className="cguide__tag">{build.tag}</span>}
      </h2>
      <p className="cguide__lead">{build.idea.text}</p>
      <Src cites={build.idea.cites} guide={guide} />

      {build.missing && <p className="cguide__missing">{build.missing}</p>}

      {(topStats || build.skills?.length || keyItems.length > 0) && (
        <div className="cguide__glance">
          <strong className="cguide__glance-title">สรุปสายนี้</strong>
          {topStats && (
            <div className="cguide__glance-row">
              <span className="cguide__glance-label">สเตตัส</span>
              <span className="cguide__glance-stats mono">
                {STAT_KEYS.filter((k) => topStats[k]).map((k) => (
                  <span key={k}><b>{k.toUpperCase()}</b> {topStats[k]}</span>
                ))}
              </span>
            </div>
          )}
          {build.skills && build.skills.length > 0 && (
            <div className="cguide__glance-row">
              <span className="cguide__glance-label">สกิลหลัก</span>
              <span className="cguide__glance-icons">
                {build.skills.slice(0, 6).map((s) => (
                  <span key={s.skill} className="cguide__glance-skill" title={`${s.skill} Lv ${s.level}`}>
                    <SkillIcon name={s.skill} skills={skills} size={32} />
                    <span className="mono">{s.level}</span>
                    <span className="sr-only">{s.skill} Lv {s.level}</span>
                  </span>
                ))}
              </span>
            </div>
          )}
          {keyItems.length > 0 && (
            <div className="cguide__glance-row">
              <span className="cguide__glance-label">ของ</span>
              <span className="cguide__glance-icons">
                {keyItems.map((id) => {
                  const item = items.get(id);
                  if (!item?.icon_url) return null;
                  return (
                    <Link key={id} href={itemHref(id, item.category)} className="cguide__glance-item" title={item.name_en}>
                      <img src={item.icon_url} alt={item.name_en} width={32} height={32} loading="lazy" />
                    </Link>
                  );
                })}
              </span>
            </div>
          )}
        </div>
      )}

      {build.stats && build.stats.length > 0 && (
        <>
          {h('แจกสเตตัส')}
          <div className="cguide__statgrid">
            {build.stats.map((row, i) => <StatBars key={i} row={row} guide={guide} />)}
          </div>
          {build.statNotes && <Lines lines={build.statNotes} guide={guide} />}
        </>
      )}

      {build.skills && build.skills.length > 0 && (
        <>
          {h('ลำดับอัพสกิล')}
          <ol className="cguide__skills">
            {build.skills.map((s, i) => {
              const info = skills.get(s.skill);
              return (
                <li key={i} className="cguide__skill">
                  <SkillIcon name={s.skill} skills={skills} size={32} />
                  <span className="cguide__skill-body">
                    <span className="cguide__skill-head">
                      <Link href={`/database/skills?q=${encodeURIComponent(s.skill)}`}>{s.skill}</Link>
                      <span className="cguide__lv mono">Lv {s.level}{info?.max_level ? `/${info.max_level}` : ''}</span>
                    </span>
                    {s.why && <span className="cguide__why">{s.why}</span>}
                    <Src cites={s.cites} guide={guide} />
                  </span>
                </li>
              );
            })}
          </ol>
          {build.skillNotes && <Lines lines={build.skillNotes} guide={guide} />}
        </>
      )}

      {build.plan && plans && (
        <details className="cguide__plandetails">
          <summary>
            ดูแผนแต้มครบทุกสกิล <span className="mono muted">({planSummary(plans)})</span>
          </summary>
          <p className="cguide__note">
            {build.plan.basis.text} · สกิลสีจางคือทางผ่านที่ต้องลงก่อน นับตามผังสกิลของ roz.prontera.info
          </p>
          <Src cites={build.plan.basis.cites} guide={guide} />
          <PlanView plans={plans} skills={skills} />
          {build.plan.leftover && <Lines lines={[build.plan.leftover]} guide={guide} />}
        </details>
      )}

      {build.gear && build.gear.length > 0 && (
        <>
          {h('ของสวมใส่')}
          <ul className="cguide__gear">
            {build.gear.map((row, i) => (
              <li key={i}>
                <span className="cguide__slot">{row.slot}</span>
                <span className="cguide__gear-body">
                  {row.text}
                  <ItemChips ids={row.items} items={items} />
                  <Src cites={row.cites} guide={guide} />
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      {build.play && build.play.length > 0 && (<>{h('เล่นยังไง / ตั้งบอท')}<Lines lines={build.play} guide={guide} /></>)}
      {build.maps && build.maps.length > 0 && (<>{h('แมพที่เหมาะ')}<Lines lines={build.maps} guide={guide} /></>)}
      {build.cautions && build.cautions.length > 0 && (
        <div className="cguide__warn">
          <strong>ข้อควรระวัง</strong>
          <Lines lines={build.cautions} guide={guide} />
        </div>
      )}
    </section>
  );
}

export default async function ClassGuidePage({ params }: { params: { job: string } }) {
  const guide = classGuide(params.job);
  if (!guide) notFound();

  const plans = new Map(guide.builds.filter((b) => b.plan).map((b) => [b.id, buildPlan(guide.path, b.plan!.picks).jobs]));
  // Icons and exact names from the database, so a renamed item or skill shows
  // up as a missing icon instead of a confident wrong name.
  const skillNames = [...new Set([
    ...guide.builds.flatMap((b) => (b.skills ?? []).map((s) => s.skill)),
    ...[...plans.values()].flatMap((jobs) => jobs.flatMap((j) => j.rows.map((r) => r.name))),
  ])];
  const itemIds = [...new Set([
    ...guide.builds.flatMap((b) => (b.gear ?? []).flatMap((g) => g.items ?? [])),
    ...(guide.gearByLevel ?? []).flatMap((g) => g.items ?? []),
  ])];
  const monsterIds = [...new Set((guide.route ?? []).flatMap((s) => s.monsters ?? []))];
  const mapCodes = [...new Set((guide.route ?? []).flatMap((s) => s.maps ?? []))];
  const db = supabaseBrowser();
  const none = Promise.resolve({ data: [], error: null });
  const [skillRead, itemRead, monsterRead, mapRead] = await Promise.all([
    skillNames.length ? db.from('skills').select('name, icon_url, max_level').in('name', skillNames) : none,
    itemIds.length ? db.from('items').select('id, name_en, icon_url, category').in('id', itemIds) : none,
    monsterIds.length ? db.from('monsters').select('id, name_en, level, image_url').in('id', monsterIds) : none,
    mapCodes.length ? db.from('monster_spawns').select('map_code, map_display_name').in('map_code', mapCodes) : none,
  ]);
  for (const [what, read] of [['skills', skillRead], ['items', itemRead], ['monsters', monsterRead], ['maps', mapRead]] as const) {
    if (read.error) console.error(`class guide ${what} query failed`, read.error);
  }
  const skills = new Map(((skillRead.data ?? []) as SkillInfo[]).map((s) => [s.name, s]));
  const items = new Map(((itemRead.data ?? []) as ItemInfo[]).map((i) => [i.id, i]));
  const monsters = new Map(((monsterRead.data ?? []) as MonsterInfo[]).map((m) => [m.id, m]));
  const mapNames = new Map<string, string>();
  for (const row of (mapRead.data ?? []) as { map_code: string; map_display_name: string | null }[]) {
    if (row.map_display_name && !mapNames.has(row.map_code)) mapNames.set(row.map_code, row.map_display_name);
  }
  const look: Lookups = { guide, skills, items };

  const toc: { id: string; label: string; sub?: { id: string; label: string }[] }[] = [
    { id: 'overview', label: 'ภาพรวม จุดแข็ง จุดอ่อน' },
    { id: 'builds', label: 'เลือกสาย', sub: guide.builds.map((b) => ({ id: b.id, label: b.name })) },
    ...(guide.route?.length ? [{ id: 'route', label: 'เส้นทางเก็บเลเวล' }] : []),
    ...(guide.gearByLevel?.length ? [{ id: 'gear', label: 'ของตามช่วงเลเวล' }] : []),
    { id: 'limits', label: 'เชื่อได้แค่ไหน' },
    { id: 'sources', label: 'คลิปและแหล่งที่มา' },
  ];
  const clips = Object.entries(guide.sources).filter(([, s]) => s.kind === 'clip' && s.url);
  const webs = Object.entries(guide.sources).filter(([, s]) => s.kind === 'web' && s.url);

  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <nav className="crumbs" aria-label="ตำแหน่งหน้า">
        <Link href="/guides">ไกด์</Link>
        <span className="crumbs__sep" aria-hidden="true">›</span>
        <Link href="/guides/classes">อาชีพ</Link>
        <span className="crumbs__sep" aria-hidden="true">›</span>
        <span className="crumbs__here">{guide.job}</span>
      </nav>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'หน้าแรก', path: '/' },
          { name: 'ไกด์', path: '/guides' },
          { name: 'อาชีพ', path: '/guides/classes' },
          { name: guide.job, path: `/guides/classes/${guide.slug}` },
        ])}
      />

      <div className="cguide__hero">
        <img className="cguide__sprite" src={`/images/jobs/${guide.slug}.png`} alt={`ตัวละครอาชีพ ${guide.job}`} width={96} height={96} />
        <PageHeader
          title={`${guide.job} — ไกด์บิลด์ RO Zero`}
          lead={guide.summary}
          source={`รวบรวมจากคลิปผู้เล่นและเว็บ ${Object.values(guide.sources).filter((s) => s.url).length} แหล่ง · อัปเดต ${guide.gathered}`}
        />
      </div>

      {(() => {
        // The rest of this job's family, so a Priest reader can reach the
        // Acolyte route and an Acolyte reader can see where it leads.
        const family = CLASS_GUIDES.filter((g) => g.path[0] === guide.path[0] && g.slug !== guide.slug);
        if (!family.length) return null;
        return (
          <nav className="cguide__kin" aria-label="อาชีพในสายเดียวกัน">
            <span className="muted">สายเดียวกัน</span>
            {family.map((g) => (
              <Link key={g.slug} href={`/guides/classes/${g.slug}`} className="chip">
                <img src={`/images/jobs/${g.slug}.png`} alt="" width={28} height={28} />
                {g.job}{g.path.length === 1 ? ' (อาชีพแรก)' : ''}
              </Link>
            ))}
          </nav>
        );
      })()}

      <div className="cguide__layout">
        <aside className="cguide__toc">
          <details open>
            <summary>สารบัญ</summary>
            <ol>
              {toc.map((entry) => (
                <li key={entry.id}>
                  <a href={`#${entry.id}`}>{entry.label}</a>
                  {entry.sub && (
                    <ol>
                      {entry.sub.map((s) => <li key={s.id}><a href={`#${s.id}`}>{s.label}</a></li>)}
                    </ol>
                  )}
                </li>
              ))}
            </ol>
          </details>
        </aside>

        <div className="cguide__main">
          <section id="overview" className="cguide__anchor">
            <ul className="cguide__facts">
              {guide.facts.map((fact, i) => (
                <li key={i}>
                  {fact.text}
                  <Src cites={fact.cites} guide={guide} />
                </li>
              ))}
            </ul>
            <div className="cguide__pros">
              <div className="card cguide__pro">
                <h2 className="section-title">จุดแข็ง</h2>
                <Lines lines={guide.strengths} guide={guide} />
              </div>
              <div className="card cguide__con">
                <h2 className="section-title">จุดอ่อน</h2>
                <Lines lines={guide.weaknesses} guide={guide} />
              </div>
            </div>
          </section>

          <nav id="builds" className="cguide__picker cguide__anchor" aria-label="เลือกสาย">
            <h2 className="section-title">เลือกสาย</h2>
            <div className="cguide__picks">
              {guide.builds.map((build) => {
                const lead = build.skills?.[0]?.skill;
                const thin = Boolean(build.missing && !build.skills);
                return (
                  <a key={build.id} href={`#${build.id}`} className={`cguide__pick${thin ? ' is-thin' : ''}`}>
                    {lead
                      ? <SkillIcon name={lead} skills={skills} size={36} />
                      : <span className="cguide__skill-blank" style={{ width: 36, height: 36 }} aria-hidden="true" />}
                    <span className="cguide__pick-body">
                      <strong>{build.name}</strong>
                      {build.tag && <span className="cguide__tag">{build.tag}</span>}
                      <span>{build.pickIf}</span>
                      {thin && <em>ข้อมูลยังน้อย</em>}
                    </span>
                  </a>
                );
              })}
            </div>
          </nav>

          {guide.builds.map((build) => (
            <BuildSection key={build.id} build={build} look={look} plans={plans.get(build.id) ?? null} />
          ))}

          {guide.route && guide.route.length > 0 && (
            <section id="route" className="card cguide__build">
              <h2 className="cguide__buildtitle">เส้นทางเก็บเลเวล {guide.from} ถึง {guide.job}</h2>
              <ol className="cguide__route">
                {guide.route.map((stop, i) => {
                  const firstMap = stop.maps?.[0];
                  const pic = firstMap ? mapImage(firstMap) : null;
                  return (
                    <li key={i}>
                      <span className="cguide__range mono">Lv {stop.range}</span>
                      <div className="cguide__stop">
                        {pic && firstMap && (
                          <Link href={`/database/maps/${encodeURIComponent(firstMap)}`} className="cguide__mapthumb">
                            <img src={pic.src} alt={`แผนที่ ${mapNames.get(firstMap) ?? firstMap}`} width={88} height={88} loading="lazy" decoding="async" />
                          </Link>
                        )}
                        <div className="cguide__gear-body">
                          <span>{stop.text}</span>
                          {(stop.maps?.length || stop.monsters?.length) ? (
                            <span className="cguide__items">
                              {(stop.maps ?? []).map((code) => (
                                <Link key={code} className="chip" href={`/database/maps/${encodeURIComponent(code)}`}>
                                  <span aria-hidden="true">📍</span> {mapNames.get(code) ?? code}
                                </Link>
                              ))}
                              {(stop.monsters ?? []).map((id) => {
                                const monster = monsters.get(id);
                                if (!monster) return null;
                                return (
                                  <Link key={id} className="chip cguide__mon" href={`/database/monsters/${id}`}>
                                    {monster.image_url && <img src={monster.image_url} alt="" width={28} height={28} loading="lazy" />}
                                    {monster.name_en} <span className="mono muted">Lv {monster.level}</span>
                                  </Link>
                                );
                              })}
                            </span>
                          ) : null}
                          <Src cites={stop.cites} guide={guide} />
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
              {guide.routeNotes && <Lines lines={guide.routeNotes} guide={guide} />}
            </section>
          )}

          {guide.gearByLevel && guide.gearByLevel.length > 0 && (
            <section id="gear" className="card cguide__build">
              <h2 className="cguide__buildtitle">ของสวมใส่ตามช่วงเลเวล</h2>
              <ul className="cguide__gear">
                {guide.gearByLevel.map((row, i) => (
                  <li key={i}>
                    <span className="cguide__slot">
                      <span className="cguide__range mono">Lv {row.range}</span>
                      {row.slot}
                    </span>
                    <span className="cguide__gear-body">
                      {row.text}
                      <ItemChips ids={row.items} items={items} />
                      <Src cites={row.cites} guide={guide} />
                    </span>
                  </li>
                ))}
              </ul>
              <p className="cguide__note">
                <Link href={`/database/equipment?job=${encodeURIComponent(guide.equipJob)}`}>ค้นของทั้งหมดที่ {guide.job} ใส่ได้ ตามเลเวลของคุณ →</Link>
              </p>
            </section>
          )}

          <section id="limits" className="card cguide__build">
            <h2 className="cguide__buildtitle">เชื่อได้แค่ไหน</h2>
            <p className="cguide__note">
              ไกด์นี้รวมจากคลิปและเว็บของผู้เล่น ไม่ใช่ข้อมูลทางการ · คลิปส่วนใหญ่อัดตอนเลเวลตัน 60 / Job 60 ตอนนี้ Job ตันที่ 70 แล้ว ·
              คลิปภาษาไทยใช้คำบรรยายที่ YouTube ถอดอัตโนมัติ จึงสรุปจากใจความ · ชื่อสกิลและไอเทมตรวจกับฐานข้อมูลเว็บนี้แล้ว
            </p>
            <strong className="cguide__glance-title">ยังไม่มีข้อมูล</strong>
            <ul className="cguide__lines">{guide.gaps.map((gap, i) => <li key={i}>{gap}</li>)}</ul>
          </section>

          <AdsenseUnit slot="guide" />

          <section id="sources" className="card cguide__build">
            <h2 className="cguide__buildtitle">คลิปและแหล่งที่มา</h2>
            <div className="cguide__clips">
              {clips.map(([key, s]) => {
                const id = youtubeId(s.url);
                return (
                  <a key={key} className="cguide__clip" href={s.url} target="_blank" rel="noopener noreferrer">
                    {id && <img src={`https://i.ytimg.com/vi/${id}/mqdefault.jpg`} alt="" width={320} height={180} loading="lazy" decoding="async" />}
                    <span className="cguide__clip-body">
                      <strong>{s.title}</strong>
                      <span className="muted">{s.label} · คลิป{s.lang === 'th' ? 'ไทย' : 'อังกฤษ'}</span>
                    </span>
                  </a>
                );
              })}
            </div>
            {webs.length > 0 && (
              <ul className="cguide__lines" style={{ marginTop: 12 }}>
                {webs.map(([key, s]) => (
                  <li key={key}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.title}</a> <span className="muted">· {s.label}</span></li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
