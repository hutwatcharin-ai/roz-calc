// app/guides/classes/[job]/page.tsx
//
// One build guide per job. The words live in lib/class-guides/<job>.ts; this
// page only lays them out, so every job reads the same way: what the job is
// for, which build to pick, then per build the stats, the skill order and the
// gear, each line with a chip that opens the source clip at the second the
// claim was made. Almost nothing here comes from the game itself, so the
// reader gets to check it rather than take it on trust.
import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import Caveat from '@/components/Caveat';
import JsonLd from '@/components/JsonLd';
import { breadcrumbJsonLd } from '@/lib/jsonld';
import { supabaseBrowser } from '@/lib/supabase';
import { itemHref } from '@/lib/item-href';
import { CLASS_GUIDES, citeHref, classGuide } from '@/lib/class-guides';
import type { Cite, CitedLine, ClassBuild, ClassGuide } from '@/lib/class-guides/types';
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
    description: `ไกด์ ${guide.job} (${guide.jobTh}) RO Zero Global: ${guide.builds.map((b) => b.name).join(', ')} พร้อมลำดับอัพสกิล การแจกสเตตัส และของที่ควรใส่ ทุกข้อลิงก์ไปคลิปต้นทาง`,
  };
}

type SkillInfo = { name: string; icon_url: string | null; max_level: number | null };
type ItemInfo = { id: number; name_en: string; icon_url: string | null; category: string | null };
type MonsterInfo = { id: number; name_en: string; level: number; image_url: string | null };

const JOB_NAMES: Record<string, string> = Object.fromEntries(
  Object.entries((trees as { jobs: Record<string, { name: string }> }).jobs).map(([slug, job]) => [slug, job.name]),
);

function ItemChips({ ids, items }: { ids?: number[]; items: Map<number, ItemInfo> }) {
  if (!ids?.length) return null;
  return (
    <span className="cguide__items">
      {ids.map((id) => {
        const item = items.get(id);
        if (!item) return null;
        return (
          <Link key={id} className="chip" href={itemHref(id, item.category)}>
            {item.icon_url && <img src={item.icon_url} alt="" width={20} height={20} loading="lazy" />}
            {item.name_en}
          </Link>
        );
      })}
    </span>
  );
}

// The full point plan: every prerequisite in, every point counted. Worked out
// by lib/skill-plan.ts from the build's picks, never typed in, so the sums on
// the page cannot drift from the skills listed under them.
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
            {plan.rows.map((row) => {
              const icon = skills.get(row.name)?.icon_url;
              return (
                <li key={row.name} className={row.reason === 'prereq' ? 'is-prereq' : undefined}>
                  {icon ? <img src={icon} alt="" width={20} height={20} loading="lazy" /> : <span className="cguide__skill-blank" aria-hidden="true" />}
                  <span className="cguide__planname">{row.name}</span>
                  <span className="mono cguide__lv">{row.free ? 'ฟรี' : `${row.level}/${row.max}`}</span>
                  {row.reason === 'prereq' && <span className="cguide__via">ทางผ่านของ {row.neededBy.join(', ')}</span>}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

function Cites({ cites, guide }: { cites: Cite[]; guide: ClassGuide }) {
  return (
    <span className="cguide__cites">
      {cites.map(([key, at], i) => {
        const source = guide.sources[key];
        if (!source) return null;
        const label = at ? `${source.label} ${at}` : source.label;
        const href = citeHref(source.url, at);
        return href ? (
          <a key={i} className="cguide__cite" href={href} target="_blank" rel="noopener noreferrer" title={source.title}>
            {label}
          </a>
        ) : (
          <span key={i} className="cguide__cite" title={source.title}>{label}</span>
        );
      })}
    </span>
  );
}

function Lines({ lines, guide }: { lines: CitedLine[]; guide: ClassGuide }) {
  return (
    <ul className="cguide__lines">
      {lines.map((line, i) => (
        <li key={i}>
          {line.text} <Cites cites={line.cites} guide={guide} />
        </li>
      ))}
    </ul>
  );
}

const STAT_KEYS = ['str', 'agi', 'vit', 'int', 'dex', 'luk'] as const;

function BuildSection({ build, guide, skills, items, plans }: { build: ClassBuild; guide: ClassGuide; skills: Map<string, SkillInfo>; items: Map<number, ItemInfo>; plans: JobPlan[] | null }) {
  return (
    <section id={build.id} className="card cguide__build">
      <h2 className="section-title">
        {build.name}
        {build.tag && <span className="cguide__tag">{build.tag}</span>}
      </h2>
      <p className="cguide__idea">
        {build.idea.text} <Cites cites={build.idea.cites} guide={guide} />
      </p>

      {build.missing && <p className="cguide__missing">{build.missing}</p>}

      {build.stats && build.stats.length > 0 && (
        <>
          <h3 className="cguide__h3">สเตตัส</h3>
          <div className="recipe__scroll">
            <table className="data-table cguide__stats">
              <thead>
                <tr>
                  <th>ของใคร</th>
                  {STAT_KEYS.map((k) => <th key={k} className="num">{k.toUpperCase()}</th>)}
                  <th>หมายเหตุ</th>
                </tr>
              </thead>
              <tbody>
                {build.stats.map((row, i) => (
                  <tr key={i}>
                    <td data-label="ของใคร"><strong>{row.who}</strong></td>
                    {STAT_KEYS.map((k) => (
                      <td key={k} data-label={k.toUpperCase()} className="num mono">{row[k] ?? '—'}</td>
                    ))}
                    <td data-label="หมายเหตุ">
                      {row.note} <Cites cites={row.cites} guide={guide} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {build.statNotes && <Lines lines={build.statNotes} guide={guide} />}
        </>
      )}

      {build.skills && build.skills.length > 0 && (
        <>
          <h3 className="cguide__h3">ลำดับอัพสกิล</h3>
          <ol className="cguide__skills">
            {build.skills.map((step, i) => {
              const info = skills.get(step.skill);
              return (
                <li key={i} className="cguide__skill">
                  {info?.icon_url ? <img src={info.icon_url} alt="" width={24} height={24} loading="lazy" /> : <span className="cguide__skill-blank" aria-hidden="true" />}
                  <span className="cguide__skill-body">
                    <span className="cguide__skill-head">
                      <Link href={`/database/skills?q=${encodeURIComponent(step.skill)}`}>{step.skill}</Link>
                      <span className="cguide__lv mono">Lv {step.level}{info?.max_level ? `/${info.max_level}` : ''}</span>
                    </span>
                    {step.why && <span className="cguide__why">{step.why}</span>}
                    <Cites cites={step.cites} guide={guide} />
                  </span>
                </li>
              );
            })}
          </ol>
          {build.skillNotes && <Lines lines={build.skillNotes} guide={guide} />}
        </>
      )}

      {build.plan && plans && (
        <>
          <h3 className="cguide__h3">แผนแต้มสกิลครบทุกตัว</h3>
          <p className="cguide__idea">
            {build.plan.basis.text} <Cites cites={build.plan.basis.cites} guide={guide} /> · สกิลสีจางคือทางผ่านที่ต้องลงก่อนถึงจะเปิดสกิลที่เลือกได้ นับตามผังสกิลของ roz.prontera.info
          </p>
          <PlanView plans={plans} skills={skills} />
          {build.plan.leftover && <Lines lines={[build.plan.leftover]} guide={guide} />}
        </>
      )}

      {build.gear && build.gear.length > 0 && (
        <>
          <h3 className="cguide__h3">ของสวมใส่</h3>
          <ul className="cguide__gear">
            {build.gear.map((row, i) => (
              <li key={i}>
                <span className="cguide__slot">{row.slot}</span>
                <span className="cguide__gear-body">
                  {row.text}
                  <ItemChips ids={row.items} items={items} />
                  <Cites cites={row.cites} guide={guide} />
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      {build.play && build.play.length > 0 && (<><h3 className="cguide__h3">เล่นยังไง / ตั้งบอท</h3><Lines lines={build.play} guide={guide} /></>)}
      {build.maps && build.maps.length > 0 && (<><h3 className="cguide__h3">แมพ</h3><Lines lines={build.maps} guide={guide} /></>)}
      {build.cautions && build.cautions.length > 0 && (<><h3 className="cguide__h3">ข้อควรระวัง</h3><Lines lines={build.cautions} guide={guide} /></>)}
    </section>
  );
}

export default async function ClassGuidePage({ params }: { params: { job: string } }) {
  const guide = classGuide(params.job);
  if (!guide) notFound();

  // Icons and exact names from the database, so a renamed item or skill shows
  // up here as a missing chip instead of a confident wrong name.
  const plans = new Map(guide.builds.filter((b) => b.plan).map((b) => [b.id, buildPlan(guide.path, b.plan!.picks).jobs]));
  const skillNames = [...new Set([
    ...guide.builds.flatMap((b) => (b.skills ?? []).map((s) => s.skill)),
    ...[...plans.values()].flatMap((jobs) => jobs.flatMap((j) => j.rows.map((r) => r.name))),
  ])];
  const itemIds = [...new Set([
    ...guide.builds.flatMap((b) => (b.gear ?? []).flatMap((g) => g.items ?? [])),
    ...(guide.gearByLevel ?? []).flatMap((g) => g.items ?? []),
  ])];
  const monsterIds = [...new Set((guide.route ?? []).flatMap((step) => step.monsters ?? []))];
  const mapCodes = [...new Set((guide.route ?? []).flatMap((step) => step.maps ?? []))];
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

  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <nav className="crumbs" aria-label="ตำแหน่งหน้า">
        <Link href="/guides">ไกด์</Link>
        <span className="crumbs__sep" aria-hidden="true">›</span>
        <span className="crumbs__here">{guide.job}</span>
      </nav>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'หน้าแรก', path: '/' },
          { name: 'ไกด์', path: '/guides' },
          { name: guide.job, path: `/guides/classes/${guide.slug}` },
        ])}
      />
      <PageHeader
        title={`${guide.job} — ไกด์บิลด์ RO Zero`}
        lead={guide.summary}
        source={`รวบรวมจากคลิปผู้เล่นและเว็บ ${Object.keys(guide.sources).length} แหล่ง · ${guide.gathered} · กดชื่อช่องเพื่อเปิดคลิปตรงวินาทีนั้น`}
      />

      <ul className="cguide__facts">
        {guide.facts.map((fact, i) => (
          <li key={i}>{fact.text} <Cites cites={fact.cites} guide={guide} /></li>
        ))}
      </ul>

      <nav className="cguide__picker" aria-label="เลือกสาย">
        <h2 className="section-title">เลือกสาย</h2>
        <div className="cguide__picks">
          {guide.builds.map((build) => (
            <a key={build.id} href={`#${build.id}`} className={`cguide__pick${build.missing && !build.skills ? ' is-thin' : ''}`}>
              <strong>{build.name}</strong>
              {build.tag && <span className="cguide__tag">{build.tag}</span>}
              <span>{build.pickIf}</span>
              {build.missing && !build.skills && <em>ข้อมูลยังน้อย</em>}
            </a>
          ))}
        </div>
        <p className="cguide__jumps">
          {guide.route && <a href="#route">เส้นทางเก็บเลเวล</a>}
          {guide.gearByLevel && <a href="#gear">ของตามช่วงเลเวล</a>}
        </p>
      </nav>

      <div className="cguide__pros">
        <div className="card">
          <h2 className="section-title">จุดแข็ง</h2>
          <Lines lines={guide.strengths} guide={guide} />
        </div>
        <div className="card">
          <h2 className="section-title">จุดอ่อน</h2>
          <Lines lines={guide.weaknesses} guide={guide} />
        </div>
      </div>

      {guide.builds.map((build) => (
        <BuildSection key={build.id} build={build} guide={guide} skills={skills} items={items} plans={plans.get(build.id) ?? null} />
      ))}

      {guide.route && guide.route.length > 0 && (
        <section id="route" className="card cguide__build">
          <h2 className="section-title">เส้นทางเก็บเลเวล {guide.from} ถึง {guide.job}</h2>
          <ol className="cguide__route">
            {guide.route.map((step, i) => (
              <li key={i}>
                <span className="cguide__range mono">Lv {step.range}</span>
                <span className="cguide__gear-body">
                  <span>{step.text} <Cites cites={step.cites} guide={guide} /></span>
                  {(step.maps?.length || step.monsters?.length) ? (
                    <span className="cguide__items">
                      {(step.maps ?? []).map((code) => (
                        <Link key={code} className="chip" href={`/database/maps/${encodeURIComponent(code)}`}>
                          {mapNames.get(code) ?? code} <span className="mono muted">{code}</span>
                        </Link>
                      ))}
                      {(step.monsters ?? []).map((id) => {
                        const monster = monsters.get(id);
                        if (!monster) return null;
                        return (
                          <Link key={id} className="chip" href={`/database/monsters/${id}`}>
                            {monster.image_url && <img src={monster.image_url} alt="" width={20} height={20} loading="lazy" />}
                            {monster.name_en} <span className="mono muted">Lv {monster.level}</span>
                          </Link>
                        );
                      })}
                    </span>
                  ) : null}
                </span>
              </li>
            ))}
          </ol>
          {guide.routeNotes && <Lines lines={guide.routeNotes} guide={guide} />}
        </section>
      )}

      {guide.gearByLevel && guide.gearByLevel.length > 0 && (
        <section id="gear" className="card cguide__build">
          <h2 className="section-title">ของสวมใส่ตามช่วงเลเวล</h2>
          <ul className="cguide__gear">
            {guide.gearByLevel.map((row, i) => (
              <li key={i}>
                <span className="cguide__slot"><span className="mono">Lv {row.range}</span><br />{row.slot}</span>
                <span className="cguide__gear-body">
                  {row.text}
                  <ItemChips ids={row.items} items={items} />
                  <Cites cites={row.cites} guide={guide} />
                </span>
              </li>
            ))}
          </ul>
          <p className="cguide__idea">
            ดูของทั้งหมดที่ {guide.job} ใส่ได้ ตามเลเวลของคุณ:{' '}
            <Link href={`/database/equipment?job=${encodeURIComponent(guide.equipJob)}`}>ค้นอุปกรณ์ที่ {guide.job} ใส่ได้ →</Link>
          </p>
        </section>
      )}

      <Caveat label="เชื่อได้แค่ไหน">
        ไกด์นี้รวมจากคลิปและเว็บของผู้เล่น ไม่ใช่ข้อมูลทางการ · คลิปส่วนใหญ่อัดตอนเลเวลตันที่ 60 และ Job 60
        ตอนนี้ Job ตันที่ 70 แล้ว · คลิปภาษาไทยใช้คำบรรยายที่ YouTube ถอดอัตโนมัติ จึงสรุปจากใจความ ไม่ได้ยกคำพูดตรง ·
        ชื่อสกิลและไอเทมตรวจกับฐานข้อมูลเว็บนี้แล้ว
        <h3 className="cguide__h3">ยังไม่มีข้อมูล</h3>
        <ul>{guide.gaps.map((gap, i) => <li key={i}>{gap}</li>)}</ul>
      </Caveat>

      <section className="card" style={{ marginTop: 20 }}>
        <h2 className="section-title">แหล่งที่มา</h2>
        <ul className="shoplist">
          {Object.entries(guide.sources).filter(([, s]) => s.url).map(([key, s]) => (
            <li key={key} className="shoprow">
              <span className="shoprow__who">
                <a href={s.url} target="_blank" rel="noopener noreferrer">{s.title}</a>
                <span className="muted"> · {s.label}{s.kind === 'clip' ? ` · คลิป${s.lang === 'th' ? 'ไทย' : 'อังกฤษ'}` : ' · เว็บ'}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
