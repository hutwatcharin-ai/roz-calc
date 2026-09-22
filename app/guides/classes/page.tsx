// app/guides/classes/page.tsx
//
// The way into the class guides: every job with a guide, grouped under its
// 1st job, each with its sprite and its builds, so a player finds "their" job
// by sight before reading a word.
import Link from 'next/link';
import type { Metadata } from 'next';
import PageHeader from '@/components/PageHeader';
import JsonLd from '@/components/JsonLd';
import { breadcrumbJsonLd } from '@/lib/jsonld';
import { CLASS_GUIDES } from '@/lib/class-guides';

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
    </main>
  );
}
