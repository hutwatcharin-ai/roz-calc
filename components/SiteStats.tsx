// components/SiteStats.tsx
//
// The row of counts under the home page's H1 (spec 6.2). Every figure is a
// live count, never a literal: the point of the row is to say how much is in
// here, and a hardcoded "524 monsters" becomes a lie the first time an import
// adds one.

import Link from 'next/link';
import { supabaseBrowser } from '@/lib/supabase';
import { COSTUME_CATEGORY, GEAR_CATEGORIES } from '@/lib/item-href';

export interface SiteStat {
  href: string;
  label: string;
  count: number | null;
}

// head: true asks PostgREST for the count header with no rows at all, so six
// counts cost six empty responses rather than six full tables.
export async function getSiteStats(): Promise<SiteStat[]> {
  const db = supabaseBrowser();

  const [monsters, items, cards, equipment, costumes, skills, maps] = await Promise.all([
    db.from('monsters').select('id', { count: 'exact', head: true }),
    db.from('items').select('id', { count: 'exact', head: true }),
    db.from('items').select('id', { count: 'exact', head: true }).eq('category', 'Card'),
    db.from('items').select('id', { count: 'exact', head: true }).in('category', [...GEAR_CATEGORIES]),
    db.from('items').select('id', { count: 'exact', head: true }).eq('category', COSTUME_CATEGORY),
    // `slug`, not `id`: the skills table is keyed by slug and has no id column,
    // so selecting one returns an error and the count comes back null.
    db.from('skills').select('slug', { count: 'exact', head: true }),
    db.from('map_stats').select('map_code', { count: 'exact', head: true }),
  ]);

  // A failed count renders as a dash, not as zero: "0 มอนสเตอร์" would be a
  // claim about the database rather than about the request.
  const results = [monsters, items, cards, equipment, costumes, skills, maps];
  for (const result of results) {
    if (result.error) console.error('site stat count failed', result.error);
  }

  return [
    { href: '/database/monsters', label: 'มอนสเตอร์', count: monsters.count ?? null },
    { href: '/database/items', label: 'ไอเทม', count: items.count ?? null },
    { href: '/database/cards', label: 'การ์ด', count: cards.count ?? null },
    { href: '/database/equipment', label: 'อุปกรณ์', count: equipment.count ?? null },
    { href: '/database/costumes', label: 'คอสตูม', count: costumes.count ?? null },
    { href: '/database/skills', label: 'สกิล', count: skills.count ?? null },
    { href: '/database/maps', label: 'แมพ', count: maps.count ?? null },
  ];
}

export default function SiteStats({ stats }: { stats: SiteStat[] }) {
  return (
    <nav className="sitestats" aria-label="ฐานข้อมูลในเว็บนี้">
      {stats.map((stat) => (
        <Link key={stat.href} href={stat.href} className="sitestats__item">
          <span className="sitestats__count mono">
            {stat.count === null ? '—' : stat.count.toLocaleString()}
          </span>
          <span className="sitestats__label">{stat.label}</span>
        </Link>
      ))}
    </nav>
  );
}
