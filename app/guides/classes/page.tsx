// app/guides/classes/page.tsx
//
// The way into the class guides: every job with a guide, grouped under its
// 1st job, each with its sprite and its builds, so a player finds "their" job
// by sight before reading a word. Below the cards (14 Oct 2026): the builds
// sorted by what a player wants to do (lib/class-goals), and each 2nd job's
// one-paragraph summary, so the page helps choose and not only navigate.
import './page.css';
import Link from 'next/link';
import type { Metadata } from 'next';
import PageHeader from '@/components/PageHeader';
import JsonLd from '@/components/JsonLd';
import { breadcrumbJsonLd } from '@/lib/jsonld';
import { CLASS_GUIDES } from '@/lib/class-guides';
import { classGoals } from '@/lib/class-goals';

export const metadata: Metadata = {
  title: 'ไกด์อาชีพ Ragnarok Zero — บิลด์ทุกอาชีพ สกิล สเตตัส ของสวมใส่',
  description: 'ไกด์บิลด์ทุกอาชีพใน RO Zero Global ทั้งอาชีพแรกและอาชีพสอง พร้อมแผนอัพสกิล การแจกสเตตัส เส้นทางเก็บเลเวล และของที่ควรใส่ ทุกข้อลิงก์ไปคลิปต้นทาง',
};

export default function ClassGuidesIndex() {
  const firsts = CLASS_GUIDES.filter((g) => g.path.length === 1);
  const seconds = CLASS_GUIDES.filter((g) => g.path.length > 1);
  // Each 1st job heads a family; a 2nd job whose 1st job has no guide yet
  // still gets listed, under its own family name.
  const families = [...new Set(CLASS_GUIDES.map((g) => g.path[0]))];
  const goals = classGoals(CLASS_GUIDES);

  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <nav className="crumbs" aria-label="ตำแหน่งหน้า">
        <Link href="/guides">ไกด์</Link>
        <span className="crumbs__sep" aria-hidden="true">›</span>
        <span className="crumbs__here">อาชีพ</span>
      </nav>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'หน้าแรก', path: '/' },
          { name: 'ไกด์', path: '/guides' },
          { name: 'อาชีพ', path: '/guides/classes' },
        ])}
      />
      <PageHeader
        title="ไกด์อาชีพ RO Zero"
        lead="เลือกอาชีพเพื่อดูสายการเล่น แผนอัพสกิล การแจกสเตตัส เส้นทางเก็บเลเวล และของที่ควรใส่"
        source={`${CLASS_GUIDES.length} อาชีพ · รวบรวมจากคลิปผู้เล่นและเว็บ ทุกข้อลิงก์ไปคลิปต้นทาง`}
      />

      <div className="cguide__families">
        {families.map((family) => {
          const head = firsts.find((g) => g.path[0] === family);
          const kids = seconds.filter((g) => g.path[0] === family);
          return (
            <section key={family} className="card cguide__family">
              {head && (
                <Link href={`/guides/classes/${head.slug}`} className="cguide__jobcard is-first">
                  <img src={`/images/jobs/${head.slug}.png`} alt="" width={64} height={64} />
                  <span>
                    <strong>{head.job}</strong>
                    <small>อาชีพแรก · {head.builds.length} สาย</small>
                  </span>
                </Link>
              )}
              <div className="cguide__jobkids">
                {kids.map((g) => (
                  <Link key={g.slug} href={`/guides/classes/${g.slug}`} className="cguide__jobcard">
                    <img src={`/images/jobs/${g.slug}.png`} alt="" width={64} height={64} />
                    <span>
                      <strong>{g.job}</strong>
                      <small>{g.builds.filter((b) => b.skills?.length).map((b) => b.name).slice(0, 2).join(' · ') || `${g.builds.length} สาย`}</small>
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <section className="cguide__goals" aria-labelledby="cguide-goals">
        <h2 id="cguide-goals" className="section-title">อยากเล่นแบบไหน</h2>
        <p className="muted cguide__intro">
          สายของอาชีพสองแยกตามสิ่งที่อยากทำ อ่านจากชื่อสายกับบรรทัด &quot;เหมาะถ้า&quot; ในไกด์แต่ละอาชีพ สายเดียวอยู่ได้หลายหัวข้อ · กดแล้วไปที่สายนั้นในไกด์เลย
        </p>
        <div className="cguide__goalgrid">
          {goals.map((goal) => (
            <section key={goal.id} className="card cguide__goal" aria-labelledby={`goal-${goal.id}`}>
              <h3 id={`goal-${goal.id}`}>
                {goal.title} <span className="mono muted">{goal.builds.length}</span>
              </h3>
              <ul>
                {goal.builds.map((b) => (
                  <li key={`${b.slug}-${b.buildId}`}>
                    <img src={`/images/jobs/${b.slug}.png`} alt="" width={32} height={32} />
                    <span>
                      <Link href={`/guides/classes/${b.slug}#${b.buildId}`}>
                        <strong>{b.job}</strong> · {b.build}
                      </Link>
                      {b.main && <span className="cguide__maintag">สายหลัก</span>}
                      <small>เหมาะถ้า{b.pickIf}</small>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </section>

      <section className="cguide__goals" aria-labelledby="cguide-seconds">
        <h2 id="cguide-seconds" className="section-title">อาชีพสองทั้ง {seconds.length} อาชีพ สรุปสั้น</h2>
        <ul className="cguide__sumlist">
          {seconds.map((g) => (
            <li key={g.slug} className="card">
              <img src={`/images/jobs/${g.slug}.png`} alt="" width={48} height={48} />
              <div>
                <h3>
                  <Link href={`/guides/classes/${g.slug}`}>{g.job}</Link> <small className="muted">มาจาก {g.from}</small>
                </h3>
                <p>{g.summary}</p>
              </div>
            </li>
          ))}
        </ul>
        <p className="muted cguide__intro">
          เปลี่ยนอาชีพสองได้ที่ Base Lv 50 ไม่มีเควสต์ คุยกับ NPC แล้วเปลี่ยนได้เลย ดูว่า NPC อยู่ไหนที่{' '}
          <Link href="/guides/job-change">เปลี่ยนอาชีพ 2</Link> · ลองวางสกิลก่อนเลือกที่ <Link href="/tools/skill-planner">จำลองอัพสกิล</Link>
        </p>
      </section>
    </main>
  );
}
