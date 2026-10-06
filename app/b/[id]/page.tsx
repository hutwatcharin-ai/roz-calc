// app/b/[id]/page.tsx -- a shared build (owner, 7 Oct 2026).
//
// The short link a player posts in a Facebook group or LINE chat. The page is
// the simulator itself, opened on that build; its preview card (og:image) is
// the build drawn as a picture (./card.png), so the group sees the build in
// the post without opening it. Not for search: a shared build is someone's
// copy of the tool page, so it is noindex and points canonical at the tool.
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import BuildSimulator from '@/components/BuildSimulator';
import { loadBuild } from '@/lib/build-share';
import { calcBuild, gearById } from '@/lib/build-calc';
import { classStats } from '@/lib/class-stats';

// A stored build never changes.
export const revalidate = 31536000;

async function load(id: string) {
  const build = await loadBuild(id);
  if (!build) return null;
  const r = calcBuild(build);
  const name = classStats(build.cls)?.name ?? build.cls;
  const weapon = build.g.weapon ? gearById(build.g.weapon.id) : null;
  return {
    build,
    title: `${name} Lv${build.lv} · HIT ${r.hit} · FLEE ${r.flee} · ATK ${r.atk.status + r.atk.equip}`,
    description: [
      weapon ? `${weapon.n}${build.g.weapon!.r ? ` +${build.g.weapon!.r}` : ''}` : 'มือเปล่า',
      `STR ${r.total.str} AGI ${r.total.agi} VIT ${r.total.vit} INT ${r.total.int} DEX ${r.total.dex} LUK ${r.total.luk}`,
      r.aspd ? `ASPD ${r.aspd}` : '',
      'กดเพื่อเปิดในเครื่องจำลองบิลด์ แก้ต่อได้เลย',
    ].filter(Boolean).join(' · '),
  };
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const data = await load(params.id);
  if (!data) return { title: 'ไม่พบบิลด์นี้', robots: { index: false } };
  const image = `/b/${params.id}/card.png`;
  return {
    title: `${data.title} — จำลองบิลด์`,
    description: data.description,
    robots: { index: false, follow: true },
    alternates: { canonical: '/tools/build' },
    openGraph: { title: data.title, description: data.description, url: `/b/${params.id}`, images: [{ url: image, width: 1200, height: 630 }] },
    twitter: { card: 'summary_large_image', title: data.title, description: data.description, images: [image] },
  };
}

export default async function SharedBuildPage({ params }: { params: { id: string } }) {
  const data = await load(params.id);
  if (!data) notFound();
  return (
    <main className="shell" style={{ paddingBlock: 24 }}>
      <header className="bhero bhero--shared">
        <div className="bhero__text">
          <p className="bhero__kicker mono">▶ SHARED BUILD</p>
          <h1 className="bhero__title">บิลด์ที่แชร์มา</h1>
          <p className="bhero__lead">แก้ต่อได้เลย ของที่แก้จะเป็นบิลด์ของคุณเอง ไม่ทับของคนแชร์</p>
        </div>
      </header>
      <BuildSimulator initial={data.build} sharedId={params.id} />
    </main>
  );
}
