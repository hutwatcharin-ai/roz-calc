// app/database/skills/page.tsx
import skillExtra from '@/data/skill-level-extra.json';
import Link from 'next/link';
import FilterAutoSubmit from '@/components/FilterAutoSubmit';
import { supabaseBrowser } from '@/lib/supabase';
import PageHeader from '@/components/PageHeader';
import FilterState, { EmptyState } from '@/components/FilterState';
import Pagination from '@/components/Pagination';
import { FIRST_JOBS, isInGameSkill, jobLine, secondJobsOf } from '@/lib/zero-jobs';

// The type column holds lowercase "active"/"passive" (274 and 65 of the 340
// in-game skills on 11 Sep 2026); labelled in the words a player uses.
const TYPE_TH: Record<string, string> = { active: 'กดใช้ (Active)', passive: 'ติดตัว (Passive)' };

export const revalidate = 86400;

export const metadata = {
  title: 'ฐานข้อมูลสกิล',
  description:
    'สกิลของทุกอาชีพในเกม Ragnarok Zero Global แยกตามอาชีพ พร้อมเลเวลสูงสุดและชนิดสกิล และรายการสกิลที่ยังไม่เปิดในเซิร์ฟ',
};

const PAGE_SIZE = 50;
const FETCH_PAGE = 1000;

interface SkillLevel {
  skill_slug: string;
  level: number;
  effect: string | null;
  sp_cost: number | null;
  attack_range: number | null;
  cast_time_ms: number | null;
  cooldown_ms: number | null;
}

const SKILL_EXTRA = (skillExtra as { skills: Record<string, Record<string, { cv?: number; cf?: number; acd?: number; cd?: number; h?: number; aspd?: number }>> }).skills;

// Milliseconds are what the source stores; seconds are what a player thinks
// in, and a null stays a dash rather than becoming a zero. The unit lives in
// the column header and cells carry the bare number (owner, 6 Oct 2026: the
// cells wrapped into towers).
function secs(ms: number | null | undefined): string {
  if (ms === null || ms === undefined) return '—';
  if (ms === 0) return '0';
  return String(Number((ms / 1000).toFixed(ms % 100 === 0 ? 1 : 2)));
}

// 851 rows is under the cap today but close enough that a plain select()
// would start truncating silently the moment more content ships.
//
// Ordered by name THEN slug, never by name alone. Five skill names are not
// unique -- "Elemental Change -" occurs three times, and Axe/Lefthand/
// Righthand Mastery twice each -- and Postgres does not guarantee a stable
// order among tied rows across separate queries, so paging on name alone can
// return a row twice or skip it entirely. slug is unique across all 851 rows,
// so appending it makes the sort total and the paging safe.
// A mid-loop error must be reported, not truncated into a short list that
// looks like a complete (if small) result -- the same failure app/sitemap.ts's
// allIds() throws on. This page renders its own error state instead of
// throwing, so the failure comes back as a flag rather than an exception.
async function allSkills(): Promise<{ skills: any[]; error: boolean }> {
  const db = supabaseBrowser();
  const rows: any[] = [];

  for (let from = 0; ; from += FETCH_PAGE) {
    const { data, error } = await db
      .from('skills')
      .select('slug, name, type, max_level, element, classes, icon_url, description, description_th, requires')
      .order('name')
      .order('slug')
      .range(from, from + FETCH_PAGE - 1);

    if (error) {
      console.error('skills query failed', error);
      return { skills: [], error: true };
    }
    if (!data || data.length === 0) break;
    rows.push(...data);
    if (data.length < FETCH_PAGE) break;
  }

  return { skills: rows, error: false };
}

// Next hands back a string[] when a query key repeats (e.g. ?job=Knight&job=Mage).
// Taking the first value keeps every downstream comparison a plain string
// instead of failing silently against an array.
function firstParam(v: string | string[] | undefined): string {
  return Array.isArray(v) ? v[0] ?? '' : v ?? '';
}

export default async function SkillsPage({
  searchParams,
}: {
  searchParams: {
    q?: string | string[];
    job?: string | string[];
    type?: string | string[];
    tab?: string | string[];
    page?: string | string[];
    sort?: string | string[];
  };
}) {
  const q = firstParam(searchParams.q);
  const job = firstParam(searchParams.job);
  const type = firstParam(searchParams.type);
  const tab = firstParam(searchParams.tab) === 'unreleased' ? 'unreleased' : 'ingame';
  const page = Math.max(1, Number(firstParam(searchParams.page)) || 1);
  const SORTS = {
    name: { label: 'ชื่อ A-Z' },
    maxlv: { label: 'เลเวลสูงสุดมากก่อน' },
    type: { label: 'ชนิดสกิล' },
  } as const;
  const sortParam = firstParam(searchParams.sort) || 'name';
  const sort = sortParam in SORTS ? (sortParam as keyof typeof SORTS) : 'name';

  const { skills, error } = await allSkills();

  const inGame = skills.filter((s) => isInGameSkill(s.classes));
  const unreleased = skills.filter((s) => !isInGameSkill(s.classes));
  const pool = tab === 'unreleased' ? unreleased : inGame;

  // The unreleased tab is not one thing -- it is two groups with different
  // evidence behind them, and the copy below must say so honestly rather
  // than asserting a reason for the group we don't have one for. Computed
  // from the same `unreleased` array the tab count uses, so the sentence
  // cannot drift from the data the way a hardcoded number would.
  const unreleasedNoClass = unreleased.filter((s) => (s.classes ?? []).length === 0);
  const unreleasedNonZeroJob = unreleased.filter((s) => (s.classes ?? []).length > 0);
  const nonZeroJobExamples = [...new Set(unreleasedNonZeroJob.flatMap((s) => s.classes as string[]))].sort();

  const types = [...new Set(skills.map((s) => s.type).filter(Boolean))].sort();

  const needle = q.trim().toLowerCase();
  const matchesQ = (s: any) => !needle || s.name.toLowerCase().includes(needle);
  const matchesJob = (s: any) => !job || (s.classes ?? []).includes(job);
  const matchesType = (s: any) => !type || s.type === type;
  const filtered = pool.filter((s) => matchesJob(s) && matchesType(s) && matchesQ(s));

  // Chip counts, each counted against the other filters already on -- the
  // monsters page's rule -- so a chip never leads to an empty page and a
  // zero-count chip is simply not drawn (11 Sep 2026, owner: "filters like
  // cards and monsters").
  const jobCounts = new Map<string, number>();
  const typeCounts = new Map<string, number>();
  for (const s of pool) {
    if (matchesType(s) && matchesQ(s)) for (const c of s.classes ?? []) jobCounts.set(c, (jobCounts.get(c) ?? 0) + 1);
    if (matchesJob(s) && matchesQ(s) && s.type) typeCounts.set(s.type, (typeCounts.get(s.type) ?? 0) + 1);
  }
  // The job row is two tiers: the seven first jobs, then the second jobs of
  // whichever line is picked. Twenty chips in one row ran five lines deep on a
  // phone, above the first skill.
  const line = jobLine(job);
  const lineHasSkills = (first: string) =>
    (jobCounts.get(first) ?? 0) > 0 || secondJobsOf(first).some((c) => (jobCounts.get(c) ?? 0) > 0);

  // Name is the tiebreak in every order: five skill names repeat and slug is
  // the only unique key, so ties are broken on it to keep paging stable.
  if (sort === 'maxlv') {
    filtered.sort((a, b) => (b.max_level ?? 0) - (a.max_level ?? 0) || a.name.localeCompare(b.name) || a.slug.localeCompare(b.slug));
  } else if (sort === 'type') {
    filtered.sort((a, b) => (a.type ?? 'zzz').localeCompare(b.type ?? 'zzz') || a.name.localeCompare(b.name) || a.slug.localeCompare(b.slug));
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // Per-level numbers for the 50 rows this page renders, not for all 851 --
  // the levels of a skill nobody expanded cost nothing to skip. 846 of our
  // skills have them (4,363 rows); the rest render without the table rather
  // than with an empty one.
  const levelsBySkill = new Map<string, SkillLevel[]>();
  if (rows.length > 0) {
    const { data: levelRows, error: levelsError } = await supabaseBrowser()
      .from('skill_levels')
      .select('skill_slug, level, effect, sp_cost, attack_range, cast_time_ms, cooldown_ms')
      .in('skill_slug', rows.map((s) => s.slug))
      .order('skill_slug')
      .order('level');
    // A failed query is not "these skills have no levels": the table simply
    // does not render, and the reason lands in the log rather than on screen
    // as a claim about the game.
    if (levelsError) console.error('skill levels query failed', levelsError);
    for (const row of levelRows ?? []) {
      const list = levelsBySkill.get(row.skill_slug) ?? [];
      list.push(row as SkillLevel);
      levelsBySkill.set(row.skill_slug, list);
    }
  }

  function buildHref(targetPage: number, overrides: Record<string, string> = {}) {
    const params = new URLSearchParams();
    const next = { q, job, type, tab, sort, ...overrides };
    // The job filter only has a control on the in-game tab, and the two tabs
    // are a strict partition of isInGameSkill -- a canonical Zero-job value
    // can never match a row on the unreleased tab. Carrying it across a tab
    // switch would land the player on an unexplainable empty page with no
    // visible control to clear it, so switching tabs always drops it.
    if (next.tab !== tab) next.job = '';
    if (next.sort && next.sort !== 'name') params.set('sort', next.sort);
    if (next.q) params.set('q', next.q);
    if (next.job) params.set('job', next.job);
    if (next.type) params.set('type', next.type);
    if (next.tab === 'unreleased') params.set('tab', 'unreleased');
    if (targetPage > 1) params.set('page', String(targetPage));
    const qs = params.toString();
    return `/database/skills${qs ? `?${qs}` : ''}`;
  }

  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <PageHeader title="ฐานข้อมูลสกิล Ragnarok Zero" />
      {/* A query error and a genuine zero-result search must read differently --
          otherwise an outage looks identical to "there are no skills", which
          is false. */}
      <p style={{ color: 'var(--faint)', marginTop: 6 }}>
        {error ? 'โหลดจำนวนสกิลไม่สำเร็จ' : `${filtered.length} สกิล จาก ${pool.length} สกิลในหมวดนี้`}
      </p>

      <div className="tabs" style={{ marginTop: 16 }}>
        <a href={buildHref(1, { tab: 'ingame' })} className={tab === 'ingame' ? 'on' : undefined}>
          มีในเกม ({error ? '—' : inGame.length})
        </a>
        <a href={buildHref(1, { tab: 'unreleased' })} className={tab === 'unreleased' ? 'on' : undefined}>
          ยังไม่เปิดในเซิร์ฟ ({error ? '—' : unreleased.length})
        </a>
      </div>

      {tab === 'unreleased' && !error && (
        <p style={{ color: 'var(--faint)', marginTop: 12, fontSize: 13 }}>
          สกิลกลุ่มนี้แบ่งเป็นสองกลุ่ม {unreleasedNoClass.length} สกิลไม่มีอาชีพระบุไว้ในข้อมูลต้นทางเลย
          เราไม่ทราบว่าเป็นเพราะยังไม่เปิดใน Global หรือเป็นช่องว่างของข้อมูลที่เก็บมา
          และอีก {unreleasedNonZeroJob.length} สกิลระบุอาชีพที่ Zero ยังไม่มีในเกม
          {nonZeroJobExamples.length > 0 && <> เช่น {nonZeroJobExamples[0]} กับ {nonZeroJobExamples[1] ?? nonZeroJobExamples[0]}</>}
          {' '}— กลุ่มหลังนี้ไม่ใช่ข้อมูลที่เราเก็บมาไม่ครบ
        </p>
      )}

      {!error && (
        <section className="rolepick">
          {/* Jobs only exist as a filter on the in-game tab: the other tab is
              skills of jobs Zero does not have, so no chip here could match. */}
          {tab === 'ingame' && (
            <>
              <h2 className="rolepick__label">อาชีพ</h2>
              <div className="chips">
                <Link className={`chip${job === '' ? ' chip--on' : ''}`} href={buildHref(1, { job: '' })}>
                  ทุกอาชีพ
                </Link>
                {FIRST_JOBS.filter(lineHasSkills).map((j) => (
                  <Link key={j} className={`chip${line === j ? ' chip--on' : ''}`} href={buildHref(1, { job: job === j ? '' : j })}>
                    {j} <span className="chip__count">{jobCounts.get(j) ?? 0}</span>
                  </Link>
                ))}
              </div>
              {line && secondJobsOf(line).some((c) => (jobCounts.get(c) ?? 0) > 0) && (
                <div className="chips" style={{ marginTop: 8 }}>
                  <span className="rolepick__asks" style={{ margin: 0, alignSelf: 'center' }}>
                    อาชีพ 2 สาย {line}:
                  </span>
                  {secondJobsOf(line)
                    .filter((c) => (jobCounts.get(c) ?? 0) > 0)
                    .map((c) => (
                      <Link key={c} className={`chip${job === c ? ' chip--on' : ''}`} href={buildHref(1, { job: job === c ? line : c })}>
                        {c} <span className="chip__count">{jobCounts.get(c)}</span>
                      </Link>
                    ))}
                </div>
              )}
            </>
          )}
          <h2 className="rolepick__label" style={{ marginTop: tab === 'ingame' ? 12 : 0 }}>
            ชนิด
          </h2>
          <div className="chips">
            <Link className={`chip${type === '' ? ' chip--on' : ''}`} href={buildHref(1, { type: '' })}>
              ทุกชนิด
            </Link>
            {types
              .filter((t) => (typeCounts.get(t as string) ?? 0) > 0)
              .map((t) => (
                <Link key={t as string} className={`chip${type === t ? ' chip--on' : ''}`} href={buildHref(1, { type: type === t ? '' : (t as string) })}>
                  {TYPE_TH[t as string] ?? (t as string)} <span className="chip__count">{typeCounts.get(t as string)}</span>
                </Link>
              ))}
          </div>
        </section>
      )}

      <form className="filterbar">
        <FilterAutoSubmit />
        <input type="hidden" name="tab" value={tab} />
        <div className="filterbar__row filterbar__row--search">
          <label className="field field--grow">
            <span className="field__label">ค้นชื่อสกิล</span>
            <input type="search" name="q" defaultValue={q} placeholder="เช่น Bash, Heal" />
          </label>
          <button type="submit" className="btn">ค้นหา</button>
        </div>
        <div className="filterbar__row">

        {/* The chips' choices ride along so pressing search keeps them. */}
        {job && tab === 'ingame' && <input type="hidden" name="job" value={job} />}
        {type && <input type="hidden" name="type" value={type} />}
        <label className="field">
          <span className="field__label">เรียงตาม</span>
          <select name="sort" defaultValue={sort}>
            {Object.entries(SORTS).map(([key, v]) => (
              <option key={key} value={key}>{v.label}</option>
            ))}
          </select>
        </label>
        </div>
      </form>

      {/* Skill cards (2 Oct 2026, arcade pass): icon in a frame, the classes,
          ACTIVE/PASSIVE and max level on the right, the edge coloured by type.
          The per-skill details still open inside the card. */}
      {error ? (
        <p className="card" style={{ color: 'var(--faint)' }}>เกิดข้อผิดพลาดในการโหลดข้อมูล ลองใหม่อีกครั้ง</p>
      ) : rows.length === 0 ? (
        <p className="card" style={{ color: 'var(--faint)' }}>ไม่พบสกิลที่ตรงเงื่อนไข</p>
      ) : (
        <ul className="skillcards">
          {rows.map((s) => (
            <li key={s.slug} className="skillcard" data-type={s.type ?? undefined}>
              <div className="skillcard__head">
                <span className="skillcard__icon">
                  {s.icon_url && <img loading="lazy" decoding="async" src={s.icon_url} alt="" width={32} height={32} />}
                </span>
                <span className="skillcard__main">
                  <b className="skillcard__name">{s.name}</b>
                  <small>{(s.classes ?? []).length > 0 ? s.classes.join(', ') : 'ไม่ระบุอาชีพ'}</small>
                </span>
                {/* 448 skills have no type and 691 no element. Those are real
                    gaps in the source data, so they show as em-dashes. */}
                <span className="skillcard__k">
                  {s.type ? s.type.toUpperCase() : '—'}
                  <i>{s.max_level ?? '—'}</i>
                  {s.element && <em>{s.element}</em>}
                </span>
              </div>
                    {(s.description || s.requires || (levelsBySkill.get(s.slug)?.length ?? 0) > 0) && (
                                              <details className="disclose disclose--row">
                          <summary>รายละเอียดสกิล</summary>
                          <div className="disclose__body">
                            {/* Thai leads once translated; the English original
                                stays in small type because the in-game client is
                                English. */}
                            {s.description_th && <p style={{ maxWidth: '65ch' }}>{s.description_th}</p>}
                            {s.description && (
                              <p className="muted" style={{ maxWidth: '65ch', fontSize: s.description_th ? 12.5 : undefined }}>
                                {s.description}
                              </p>
                            )}
                            {s.requires && (
                              <p className="muted">
                                ต้องมีก่อน: <strong>{s.requires}</strong>
                              </p>
                            )}
                            {/* Per level: what the skill does at that level and
                                what it costs. Columns that are empty for this
                                skill are dropped rather than rendered as a
                                column of dashes -- most skills have no cast or
                                cooldown recorded, and a table of blanks reads
                                as "this skill is instant", which it does not
                                say. */}
                            {(() => {
                              const levels = levelsBySkill.get(s.slug) ?? [];
                              if (levels.length === 0) return null;
                              // Cast split, after-cast delay, cooldown and hits from
                              // roz.prontera.info (data/skill-level-extra.json).
                              const extra = (l: SkillLevel) => SKILL_EXTRA[l.skill_slug]?.[String(l.level)] ?? {};
                              // One column per number. A column with the same value at
                              // every level moves up into a one-line summary, so the table
                              // keeps only what changes and fits the skill card (owner,
                              // 6 Oct 2026: the cells had wrapped into towers).
                              const castText = (l: SkillLevel) =>
                                extra(l).cv || extra(l).cf ? `${secs(extra(l).cv ?? 0)} +${secs(extra(l).cf ?? 0)}` : l.cast_time_ms !== null ? secs(l.cast_time_ms) : null;
                              const columns: { label: string; unit: string; value: (l: SkillLevel) => string | null; title?: string }[] = [
                                { label: 'SP', unit: '', value: (l) => (l.sp_cost !== null ? String(l.sp_cost) : null) },
                                { label: 'ระยะ', unit: 'ช่อง', value: (l) => (l.attack_range !== null ? String(l.attack_range) : null) },
                                { label: 'ร่าย', unit: 'วิ', value: castText, title: 'ร่ายแปรผัน +คงที่ (DEX/INT ลดได้แค่ส่วนแปรผัน)' },
                                { label: 'ดีเลย์', unit: 'วิ', value: (l) => (extra(l).aspd ? 'ตาม ASPD' : extra(l).acd ? secs(extra(l).acd) : null), title: 'ดีเลย์หลังร่าย' },
                                { label: 'คูลดาวน์', unit: 'วิ', value: (l) => (l.cooldown_ms !== null ? secs(l.cooldown_ms) : extra(l).cd ? secs(extra(l).cd) : null) },
                                { label: 'ตี', unit: 'ครั้ง', value: (l) => ((extra(l).h ?? 1) > 1 ? String(extra(l).h) : null) },
                              ];
                              const present = columns.filter((c) => levels.some((l) => c.value(l) !== null));
                              const same = present.filter((c) => levels.length > 1 && new Set(levels.map((l) => c.value(l))).size === 1);
                              const varying = present.filter((c) => !same.includes(c));
                              return (
                                <>
                                  {same.length > 0 && (
                                    <p className="skilllv__same">
                                      ทุกเลเวล:{' '}
                                      {same.map((c, i) => {
                                        const v = c.value(levels[0])!;
                                        return (
                                          <span key={c.label} title={c.title}>
                                            {i > 0 && ' · '}
                                            {c.label} <b className="mono">{v}</b>
                                            {c.unit && v !== 'ตาม ASPD' ? ` ${c.unit}` : ''}
                                          </span>
                                        );
                                      })}
                                    </p>
                                  )}
                                  <table className="data-table skilllv" style={{ marginTop: 10 }}>
                                    <thead>
                                      <tr>
                                        <th className="num">Lv</th>
                                        <th>ผล</th>
                                        {varying.map((c) => (
                                          <th key={c.label} className="num" title={c.title}>
                                            {c.label}
                                            {c.unit && ` (${c.unit})`}
                                          </th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {levels.map((l) => (
                                        <tr key={l.level}>
                                          <td data-label="Lv" className="num mono">{l.level}</td>
                                          <td data-label="ผล">{l.effect ?? '—'}</td>
                                          {varying.map((c) => (
                                            <td key={c.label} data-label={c.label} className="num mono">{c.value(l) ?? '—'}</td>
                                          ))}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </>
                              );
                            })()}
                          </div>
                        </details>
                    )}
            </li>
          ))}
        </ul>
      )}

      <Pagination page={safePage} totalPages={totalPages} buildHref={(p) => buildHref(p)} total={filtered.length} pageSize={PAGE_SIZE} />

      <p style={{ color: 'var(--faint)', marginTop: 24, fontSize: 13 }}>
        อยากลองลงแต้มสกิลของอาชีพ ใช้ <Link href="/tools/skill-planner">ตัววางแผนสกิล</Link>
      </p>
    </main>
  );
}
