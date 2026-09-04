// app/database/maps/[code]/page.tsx
import Link from 'next/link';
import JsonLd from '@/components/JsonLd';
import { breadcrumbJsonLd } from '@/lib/jsonld';
import type { Metadata } from 'next';
import { cache } from 'react';
import { notFound, permanentRedirect } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase';
import MapMonsterTable from '@/components/MapMonsterTable';
import { isCVariant } from '@/lib/c-variant';
import { getMapCanonical } from '@/lib/map-canonical';
import { mapImage } from '@/lib/map-image';

export const revalidate = 86400;

// Empty on purpose: no paths are prebuilt (build stays fast), but the mere
// presence of generateStaticParams switches the route from per-request SSR to
// on-demand ISR -- first hit renders, later hits come from the page cache.
export async function generateStaticParams() {
  return [];
}


// Shared by generateMetadata and the page body so one request does one query.
// Returns the raw { data, error } so each caller keeps its own handling.
const getMapSpawns = cache(async (code: string) => {
  return await supabaseBrowser()
    .from('monster_spawns')
    .select('map_display_name, monsters(id, name_en, level, hp, base_exp, image_url, is_aggressive, atk_max, hit_100, flee_95)')
    .eq('map_code', code);
});

export async function generateMetadata({ params }: { params: { code: string } }): Promise<Metadata> {
  const code = decodeURIComponent(params.code);
  const { data, error } = await getMapSpawns(code);

  // An error tells us nothing about the map, so make no claim either way
  // rather than tell a crawler a live page is dead.
  if (error) {
    console.error('map metadata query failed', error);
    return {};
  }
  if (!data || data.length === 0) return { title: 'ไม่พบแมพนี้' };

  const name = data.find((r) => r.map_display_name)?.map_display_name ?? code;
  return {
    title: `${name} — มอนสเตอร์ในแมพนี้`,
    description: `${name} (${code}) มีมอนสเตอร์ ${data.length} ชนิด ดูเลเวล HP EXP และของที่ดรอปได้ใน RO Zero Thai`,
  };
}

export default async function MapDetailPage({ params }: { params: { code: string } }) {
  const code = decodeURIComponent(params.code);

  // Channel copies (gef_f10_a and _b against gef_fild10) hold the same
  // monsters in the same numbers -- 118 pages of identical content across
  // different URLs. They send the reader to the one page instead. An event
  // channel (_z, one monster more) or a boss room (b_, different monster) is
  // not a copy and keeps its own page; the rule is in lib/map-variants.ts and
  // reads the monster set, never the code's shape.
  const canonical = await getMapCanonical();
  const owner = canonical.byCode[code];
  if (owner && owner !== code) {
    permanentRedirect(`/database/maps/${encodeURIComponent(owner)}`);
  }

  const { data: spawns, error } = await getMapSpawns(code);

  if (error) {
    console.error('map detail query failed', error);
    return <main className="shell" style={{ paddingBlock: 32 }}>เกิดข้อผิดพลาด ลองใหม่อีกครั้ง</main>;
  }

  // A clean query returning nothing is a genuine 404 -- unlike the error
  // branch above, which must never become one.
  if (!spawns || spawns.length === 0) {
    notFound();
  }

  const name = spawns.find((s: any) => s.map_display_name)?.map_display_name ?? code;
  const monsters = spawns
    .map((s: any) => s.monsters)
    .filter(Boolean)
    .sort((a: any, b: any) => a.level - b.level);
  // Challenge clones stay in the static HTML (this page is ISR) but carry the
  // cvariant class, hidden by CSS until the player opts in via the toggle.
  const cCount = monsters.filter((m: any) => isCVariant(m.name_en)).length;
  // Not every map has a picture, so this is null on 149 of them and the block
  // below disappears rather than leaving a broken image behind.
  const picture = mapImage(code);

  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <nav className="crumbs" aria-label="ตำแหน่งหน้า">
        <Link href="/database/maps">แมพ</Link>
        <span className="crumbs__sep" aria-hidden="true">›</span>
        <span className="crumbs__here">{name}</span>
      </nav>

      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'หน้าแรก', path: '/' },
          { name: 'แมพ', path: '/database/maps' },
          { name, path: `/database/maps/${params.code}` },
        ])}
      />
      <h1 className="pagehead__title">{name}</h1>
      <p className="mono" style={{ color: 'var(--faint)', marginTop: 6 }}>
        {code}
        {/* The channels this page stands for. Naming them keeps the fold
            honest: a player who typed gef_f10_a into the URL and landed here
            can see why. */}
        {(canonical.variantsOf.get(code) ?? []).length > 0 && (
          <span> · อีก {canonical.variantsOf.get(code)!.length} ช่อง: {canonical.variantsOf.get(code)!.join(', ')}</span>
        )}
      </p>
      <p style={{ color: 'var(--dim)', marginTop: 10 }}>
        มอนสเตอร์ {monsters.length - cCount} ชนิดในแมพนี้
        {cCount > 0 && ` (+${cCount} มอน Challenge)`}
      </p>
      {picture && (
        <figure className="mapimg">
          {/* 205x205 pixel minimap: scaled up it must stay crisp, and it is
              decorative next to the monster table, so the caption carries the
              credit and the alt text stays short. Not lazy -- it sits above
              the fold, and a lazy image there paints as an empty box first. */}
          <img
            src={picture.src}
            alt={`แผนที่ ${name}`}
            width={205}
            height={205}
            decoding="async"
          />
          <figcaption>
            แผนที่ย่อ · ที่มา ratemyserver.net
            {picture.fromCode && ` (ไฟล์ชื่อ ${picture.fromCode})`}
          </figcaption>
        </figure>
      )}
      <MapMonsterTable monsters={monsters} cCount={cCount} />
    </main>
  );
}
