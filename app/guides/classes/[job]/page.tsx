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

function BuildSection({ build, guide, skills, items }: { build: ClassBuild; guide: ClassGuide; skills: Map<string, SkillInfo>; items: Map<number, ItemInfo> }) {
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

      {build.gear && build.gear.length > 0 && (
        <>
          <h3 className="cguide__h3">ของสวมใส่</h3>
          <ul className="cguide__gear">
            {build.gear.map((row, i) => (
              <li key={i}>
                <span className="cguide__slot">{row.slot}</span>
                <span className="cguide__gear-body">
                  {row.text}
                  {row.items && row.items.length > 0 && (
                    <span className="cguide__items">
                      {row.items.map((id) => {
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
                  )}
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
  const skillNames = [...new Set(guide.builds.flatMap((b) => (b.skills ?? []).map((s) => s.skill)))];
  const itemIds = [...new Set(guide.builds.flatMap((b) => (b.gear ?? []).flatMap((g) => g.items ?? [])))];
  const db = supabaseBrowser();
  const [skillRead, itemRead] = await Promise.all([
    skillNames.length ? db.from('skills').select('name, icon_url, max_level').in('name', skillNames) : Promise.resolve({ data: [], error: null }),
    itemIds.length ? db.from('items').select('id, name_en, icon_url, category').in('id', itemIds) : Promise.resolve({ data: [], error: null }),
  ]);
  if (skillRead.error) console.error('class guide skills query failed', skillRead.error);
  if (itemRead.error) console.error('class guide items query failed', itemRead.error);
  const skills = new Map(((skillRead.data ?? []) as SkillInfo[]).map((s) => [s.name, s]));
  const items = new Map(((itemRead.data ?? []) as ItemInfo[]).map((i) => [i.id, i]));

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
        <BuildSection key={build.id} build={build} guide={guide} skills={skills} items={items} />
      ))}

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
