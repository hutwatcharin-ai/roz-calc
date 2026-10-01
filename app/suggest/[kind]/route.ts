// The rows behind the "SELECT ITEM / CARD / EQUIPMENT / COSTUME" suggestion
// panels (components/SuggestInput), one JSON per list page.
//
// Built once a day and served from the CDN; the box fetches it the first time
// it is focused, then ranks every keystroke in the browser. Items run to
// thousands of rows, too many to ship inside every page view the way the
// ~340 monsters are.

import { NextResponse } from 'next/server';
import { supabaseBrowser } from '@/lib/supabase';
import { fetchAllRows } from '@/lib/fetch-all-rows';
import { isAbsentFromGame } from '@/lib/game-absent';
import { itemHref, GEAR_CATEGORIES, COSTUME_CATEGORY, CARD_CATEGORY } from '@/lib/item-href';
import { ITEM_LIST_CATEGORIES } from '@/lib/item-list-categories';
import { POSITION_LABELS } from '@/lib/costume-position';
import { TYPE_TH, gearType } from '@/lib/gear-type';
import { thaiAliasNames } from '@/lib/thai-aliases';
import type { SuggestEntry } from '@/lib/suggest';
import { cardArtThumbUrl, hasCardArt } from '@/lib/card-art';
import { cardSlot, SLOT_TH } from '@/lib/card-slot';

export const revalidate = 86400;
export const dynamic = 'force-static';

const KINDS = {
  items: ITEM_LIST_CATEGORIES,
  cards: [CARD_CATEGORY],
  equipment: [...GEAR_CATEGORIES],
  costumes: [COSTUME_CATEGORY],
} as const;
type Kind = keyof typeof KINDS;

export function generateStaticParams() {
  return Object.keys(KINDS).map((kind) => ({ kind }));
}

interface Row {
  id: number;
  name_en: string;
  category: string | null;
  icon_url: string | null;
  slots: number | null;
  required_level: number | null;
  weapon_type: string | null;
  description: string | null;
}

function sub(kind: Kind, row: Row): string {
  if (kind === 'equipment') {
    const t = gearType(row);
    return t ? TYPE_TH[t] ?? t : '';
  }
  if (kind === 'costumes') return row.weapon_type ? POSITION_LABELS[row.weapon_type] ?? row.weapon_type : '';
  if (kind === 'items') return row.category ?? '';
  if (kind === 'cards') {
    const slot = cardSlot(row.description);
    return slot ? `ใส่${SLOT_TH[slot]}` : '';
  }
  return '';
}

export async function GET(_request: Request, { params }: { params: { kind: string } }) {
  if (!(params.kind in KINDS)) return NextResponse.json([], { status: 404 });
  const kind = params.kind as Kind;
  const db = supabaseBrowser();
  const { data, error } = await fetchAllRows<Row>((from, to) =>
    db
      .from('items')
      .select('id, name_en, category, icon_url, slots, required_level, weapon_type, description')
      .in('category', KINDS[kind] as unknown as string[])
      .order('id')
      .range(from, to),
  );
  // Thrown, not served as []: an empty list cached for a day would quietly
  // switch every suggestion box off.
  if (error) throw new Error(`suggest/${kind}: ${error.message}`);
  const rows: SuggestEntry[] = (data ?? [])
    .filter((r) => !isAbsentFromGame(r.id))
    .map((r) => {
      const label = r.slots && r.slots > 0 ? `${r.name_en} [${r.slots}]` : r.name_en;
      return {
        id: r.id,
        href: itemHref(r.id, r.category),
        name: r.name_en,
        label,
        sub: sub(kind, r),
        aliases: thaiAliasNames('items', r.id),
        // A card's own picture where we have one; its icon is the same
        // generic card for every card.
        sprite: kind === 'cards' && hasCardArt(r.id) ? cardArtThumbUrl(r.id) : r.icon_url,
        el: '',
        lv: kind === 'equipment' && r.required_level ? r.required_level : null,
        tag: null,
      };
    });
  return NextResponse.json(rows, {
    headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=3600' },
  });
}
