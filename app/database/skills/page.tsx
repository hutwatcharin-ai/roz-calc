// app/database/skills/page.tsx
import { supabaseBrowser } from '@/lib/supabase';
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

// 851 rows is under the cap today but close enough that a plain select()
// would start truncating silently the moment more content ships.
//
// Ordered by name THEN slug, never by name alone. Five skill names are not
// unique -- "Elemental Change -" occurs three times, and Axe/Lefthand/
// Righthand Mastery twice each -- and Postgres does not guarantee a stable
// order among tied rows across separate queries, so paging on name alone can
// return a row twice or skip it entirely. slug is unique across all 851 rows,
// so appending it makes the sort total and the paging safe.
async function allSkills() {
  const db = supabaseBrowser();
  const rows: any[] = [];

  for (let from = 0; ; from += FETCH_PAGE) {
    const { data, error } = await db
      .from('skills')
      .select('slug, name, type, max_level, element, classes, icon_url')
      .order('name')
      .order('slug')
      .range(from, from + FETCH_PAGE - 1);

    if (error) {
      console.error('skills query failed', error);
      break;
    }
    if (!data || data.length === 0) break;
    rows.push(...data);
    if (data.length < FETCH_PAGE) break;
  }

  return rows;
}

export default async function SkillsPage({
  searchParams,
}: {
  searchParams: { q?: string; job?: string; type?: string; tab?: string; page?: string };
}) {
  const q = searchParams.q ?? '';
  const job = searchParams.job ?? '';
  const type = searchParams.type ?? '';
  const tab = searchParams.tab === 'unreleased' ? 'unreleased' : 'ingame';
  const page = Math.max(1, Number(searchParams.page ?? 1) || 1);

  const skills = await allSkills();

  const inGame = skills.filter((s) => isInGameSkill(s.classes));
  const unreleased = skills.filter((s) => !isInGameSkill(s.classes));
  const pool = tab === 'unreleased' ? unreleased : inGame;

  const types = [...new Set(skills.map((s) => s.type).filter(Boolean))].sort();

  const needle = q.trim().toLowerCase();
  const filtered = pool.filter((s) => {
    if (job && !(s.classes ?? []).includes(job)) return false;
    if (type && s.type !== type) return false;
    if (needle && !s.name.toLowerCase().includes(needle)) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function buildHref(targetPage: number, overrides: Record<string, string> = {}) {
    const params = new URLSearchParams();
    const next = { q, job, type, tab, ...overrides };
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
      <h1 style={{ fontFamily: '"Chakra Petch", sans-serif', fontSize: 32 }}>ฐานข้อมูลสกิล</h1>
      <p style={{ color: 'var(--faint)', marginTop: 6 }}>
        {filtered.length} สกิล จาก {pool.length} สกิลในหมวดนี้
      </p>

      <div className="tabs" style={{ marginTop: 16 }}>
        <a href={buildHref(1, { tab: 'ingame' })} className={tab === 'ingame' ? 'on' : undefined}>
          มีในเกม ({inGame.length})
        </a>
        <a href={buildHref(1, { tab: 'unreleased' })} className={tab === 'unreleased' ? 'on' : undefined}>
          ยังไม่เปิดในเซิร์ฟ ({unreleased.length})
        </a>
      </div>

      {tab === 'unreleased' && (
        <p style={{ color: 'var(--faint)', marginTop: 12, fontSize: 13 }}>
          สกิลกลุ่มนี้อยู่ในไฟล์ข้อมูลของเกมแต่ยังไม่เปิดใน Global — เป็นสกิลคลาส 3 สกิลโฮมุนคูลุส
          และสกิลของอาชีพที่ Zero ยังไม่มี ไม่ใช่ข้อมูลที่เราเก็บมาไม่ครบ
        </p>
      )}

      <form style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '20px 0' }}>
        <input type="hidden" name="tab" value={tab} />
        <input className="mono" type="text" name="q" defaultValue={q} placeholder="ค้นชื่อสกิล..." />
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
        <button type="submit">กรอง</button>
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
            {rows.map((s) => (
              <tr key={s.slug}>
                <td data-label="">
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {s.icon_url && (
                      <img src={s.icon_url} alt="" width={24} height={24} style={{ imageRendering: 'pixelated' }} />
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
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} data-label="" style={{ color: 'var(--faint)', padding: '16px 0' }}>
                  ไม่พบสกิลที่ตรงเงื่อนไข
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={safePage} totalPages={totalPages} buildHref={(p) => buildHref(p)} />

      <p style={{ color: 'var(--faint)', marginTop: 24, fontSize: 13 }}>
        หน้านี้เป็นรายการสกิล ยังไม่ใช่ตัววางแผนบิลด์ — ตัววางแผนต้องใช้ข้อมูลเงื่อนไขสกิลที่ต้องลงก่อน
        ซึ่งยังไม่มีในฐานข้อมูล
      </p>
    </main>
  );
}
