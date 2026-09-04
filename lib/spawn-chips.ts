// The "จุดเกิด" chips on a monster page.
//
// Straight from the table they read "Payon Forest, Payon Forest, Payon
// Forest, Payon Forest ..." -- Zero gives its fields one name each with no
// number, and every field exists three times over as channel copies (user
// screenshot of the Poring page, 4 Sep 2026: 28 chips for 11 maps). Two fixes,
// both derived rather than stored:
//
//   1. channel copies fold into the map that owns the page, the same rule the
//      map pages use, so each map is one chip
//   2. a name shared by several maps on the page gets the number from its code
//      (prt_fild08 -> "Prontera Field 08"), which is how players say it anyway

import { canonicalOf } from './map-variants';

export interface SpawnRow {
  map_code: string;
  map_display_name: string | null;
  amount: number | null;
}

export interface SpawnChip {
  code: string;
  label: string;
  amount: number | null;
  /** Other channels folded into this chip, for the title attribute. */
  channels: number;
}

/** prt_f08_a, b_prt_f08, moc_fild17_ -> "08", "08", "17"; prt_maze01 -> "01"; prontera -> null */
export function codeNumber(code: string): string | null {
  const stem = code.replace(/^b_/, '').replace(/_[abz]$/, '').replace(/_$/, '');
  const m = /(\d+)$/.exec(stem);
  return m ? m[1] : null;
}

/**
 * What a player means by "the map": one field, whatever channel it is on.
 * The map pages keep an event channel (_z) apart because its monster set
 * differs by one, and keep the classic-code row (pay_fild01) apart from
 * pay_f01_a when their sets differ -- both right for a page, both wrong for a
 * chip that says where this monster spawns. So chips fold on name + family +
 * number instead. A boss room (b_) is a different room and keeps its own key.
 */
function physicalKey(row: SpawnRow): string {
  const name = row.map_display_name ?? row.map_code;
  if (row.map_code.startsWith('b_')) return `b|${row.map_code}`;
  const number = codeNumber(row.map_code);
  const family = row.map_code.slice(0, 3);
  return number ? `${name}|${family}|${number}` : `${name}|${row.map_code.replace(/_[abz]$/, '')}`;
}

export function foldSpawns(rows: SpawnRow[], canonicalByCode: Record<string, string>): SpawnChip[] {
  const groups = new Map<string, SpawnRow[]>();
  for (const row of rows) {
    const key = physicalKey(row);
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }

  // A name carried by more than one map on this page is not a name any more;
  // the code's number tells them apart. Names that already carry a floor
  // ("Labyrinth Forest 1F") are left alone.
  const nameCount = new Map<string, number>();
  for (const members of groups.values()) {
    const name = members[0].map_display_name ?? members[0].map_code;
    nameCount.set(name, (nameCount.get(name) ?? 0) + 1);
  }

  const chips: SpawnChip[] = [];
  for (const members of groups.values()) {
    const name = members[0].map_display_name ?? members[0].map_code;
    // Link to the page that owns this map: the plainest member, then wherever
    // the map pages redirect it.
    const plainest = canonicalOf(members.map((m) => m.map_code));
    const code = canonicalByCode[plainest] ?? plainest;
    const number = codeNumber(code);
    const shared = (nameCount.get(name) ?? 0) > 1;
    const label = shared && number && !/\d/.test(name) ? `${name} ${number}` : name;
    const amount = members.reduce<number | null>((best, m) => (m.amount != null && (best == null || m.amount > best) ? m.amount : best), null);
    chips.push({ code, label, amount, channels: members.length - 1 });
  }

  // Most spawns first: the map worth walking to is the first chip, not the
  // one whose code happens to sort first.
  return chips.sort((a, b) => (b.amount ?? -1) - (a.amount ?? -1) || a.label.localeCompare(b.label));
}
