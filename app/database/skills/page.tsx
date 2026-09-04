// app/database/skills/page.tsx
import { supabaseBrowser } from '@/lib/supabase';
import PageHeader from '@/components/PageHeader';
import FilterState, { EmptyState } from '@/components/FilterState';
import Pagination from '@/components/Pagination';
import { ZERO_JOBS, isInGameSkill } from '@/lib/zero-jobs';

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

// Milliseconds are what the source stores; seconds are what a player thinks
// in. 1500 reads as 1.5 วิ, 800 as 0.8 วิ, and a null stays a dash rather
// than becoming a zero.
function seconds(ms: number | null): string {
  if (ms === null) return '—';
  if (ms === 0) return 'ทันที';
  return `${(ms / 1000).toFixed(ms % 1000 === 0 ? 0 : 1)} วิ`;
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
  const filtered = pool.filter((s) => {
    if (job && !(s.classes ?? []).includes(job)) return false;
    if (type && s.type !== type) return false;
    if (needle && !s.name.toLowerCase().includes(needle)) return false;
    return true;
  });

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
          สกิลกลุ่มนี้แบ่งเป็นสองกลุ่ม — {unreleasedNoClass.length} สกิลไม่มีอาชีพระบุไว้ในข้อมูลต้นทางเลย
          เราไม่ทราบว่าเป็นเพราะยังไม่เปิดใน Global หรือเป็นช่องว่างของข้อมูลที่เก็บมา
          และอีก {unreleasedNonZeroJob.length} สกิลระบุอาชีพที่ Zero ยังไม่มีในเกม
          {nonZeroJobExamples.length > 0 && <> เช่น {nonZeroJobExamples[0]} กับ {nonZeroJobExamples[1] ?? nonZeroJobExamples[0]}</>}
          {' '}— กลุ่มหลังนี้ไม่ใช่ข้อมูลที่เราเก็บมาไม่ครบ
        </p>
      )}

      <form className="filterbar">
        <input type="hidden" name="tab" value={tab} />
        <input type="search" name="q" defaultValue={q} placeholder="ค้นชื่อสกิล..." />
        {tab === 'ingame' && (
          <select name="job" defaultValue={job}>
            <option value="">ทุกอาชีพ</option>
            {ZERO_JOBS.map((j) => (
              <option key={j} value={j}>{j}</option>
            ))}
          </select>
        )}
        <select name="type" defaultValue={type}>
          <option value="">ทุกชนิด</option>
          {types.map((t) => (
            <option key={t} value={t as string}>{t as string}</option>
          ))}
        </select>
        <select name="sort" defaultValue={sort} aria-label="เรียงตาม">
          {Object.entries(SORTS).map(([key, v]) => (
            <option key={key} value={key}>เรียง: {v.label}</option>
          ))}
        </select>
        <button type="submit" className="btn">ค้นหา</button>
      </form>

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>ชื่อ</th>
              <th>ชนิด</th>
              <th className="num">เลเวลสูงสุด</th>
              <th>ธาตุ</th>
              <th>อาชีพ</th>
            </tr>
          </thead>
          <tbody>
            {error ? (
              <tr>
                <td colSpan={5} data-label="" style={{ color: 'var(--faint)', padding: '16px 0' }}>
                  เกิดข้อผิดพลาดในการโหลดข้อมูล ลองใหม่อีกครั้ง
                </td>
              </tr>
            ) : (
              <>
                {rows.map((s) => (
                  <tr key={s.slug}>
                    <td data-label="">
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {s.icon_url && (
                          <img loading="lazy" decoding="async" src={s.icon_url} alt="" width={24} height={24} style={{ imageRendering: 'pixelated' }} />
                        )}
                        {s.name}
                      </span>
                    </td>
                    {/* 448 skills have no type and 691 no element. Those are real
                        gaps in the source data, so they show as em-dashes. */}
                    <td data-label="ชนิด">{s.type ?? '—'}</td>
                    <td data-label="เลเวลสูงสุด" className="num">{s.max_level ?? '—'}</td>
                    <td data-label="ธาตุ">{s.element ?? '—'}</td>
                    <td data-label="อาชีพ">{(s.classes ?? []).length > 0 ? s.classes.join(', ') : '—'}</td>
                    {/* 581 skills carry a description from the export; the rest
                        genuinely have none upstream and get no empty cell. */}
                    {(s.description || s.requires || (levelsBySkill.get(s.slug)?.length ?? 0) > 0) && (
                      <td data-label="" className="wide">
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
                              const hasRange = levels.some((l) => l.attack_range !== null);
                              const hasCast = levels.some((l) => l.cast_time_ms !== null);
                              const hasCooldown = levels.some((l) => l.cooldown_ms !== null);
                              const hasSp = levels.some((l) => l.sp_cost !== null);
                              return (
                                <table className="data-table" style={{ marginTop: 10 }}>
                                  <thead>
                                    <tr>
                                      <th className="num">Lv</th>
                                      <th>ผล</th>
                                      {hasSp && <th className="num">SP</th>}
                                      {hasRange && <th className="num">ระยะ</th>}
                                      {hasCast && <th className="num">ร่าย</th>}
                                      {hasCooldown && <th className="num">คูลดาวน์</th>}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {levels.map((l) => (
                                      <tr key={l.level}>
                                        <td data-label="Lv" className="num mono">{l.level}</td>
                                        <td data-label="ผล">{l.effect ?? '—'}</td>
                                        {hasSp && <td data-label="SP" className="num mono">{l.sp_cost ?? '—'}</td>}
                                        {hasRange && <td data-label="ระยะ" className="num mono">{l.attack_range ?? '—'}</td>}
                                        {hasCast && <td data-label="ร่าย" className="num mono">{seconds(l.cast_time_ms)}</td>}
                                        {hasCooldown && <td data-label="คูลดาวน์" className="num mono">{seconds(l.cooldown_ms)}</td>}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              );
                            })()}
                          </div>
                        </details>
                      </td>
                    )}
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={5} data-label="" style={{ color: 'var(--faint)', padding: '16px 0' }}>
                      ไม่พบสกิลที่ตรงเงื่อนไข
                    </td>
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={safePage} totalPages={totalPages} buildHref={(p) => buildHref(p)} total={filtered.length} pageSize={PAGE_SIZE} />

      <p style={{ color: 'var(--faint)', marginTop: 24, fontSize: 13 }}>
        หน้านี้คือรายการสกิล — ตัววางแผนบิลด์ยังไม่มี (ต้องใช้ข้อมูลเงื่อนไขสกิลที่ยังไม่มีในฐาน)
      </p>
    </main>
  );
}
