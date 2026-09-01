// Derived facts for the cash shop page (feature pass, 2 Sep): duration and
// per-day cost, the 7-vs-30-day pairing, and a rule-based category. Every
// rule is written against the real 77 captured rows, not guessed shapes.

export const THB_PER_KP = 32 / 1000; // gnjoy TH top-up, 1,000 KP = 32 THB (2 Sep 2026), linear

export interface CashRowFacts {
  name_en: string;
  description_th?: string | null;
}

/** Days the item stays active, or null for permanent/consumable goods. */
export function durationDays(row: CashRowFacts): number | null {
  const m = row.name_en.match(/- (\d+) Days?$/);
  if (m) return Number(m[1]);
  const d = row.description_th ?? '';
  const m2 = d.match(/\[อายุใช้งาน\] (\d+) วัน/) ?? d.match(/ใช้ได้ (\d+) วัน/);
  if (m2) return Number(m2[1]);
  return null;
}

/** The shared name of a 7d/30d pair ("X Box - 7 Days" -> "X Box"). */
export function pairBaseName(name_en: string): string {
  return name_en.replace(/ - \d+ Days?$/, '');
}

export type CashCategory = 'buff' | 'costume' | 'refine' | 'starter' | 'package' | 'utility';

export const CATEGORY_LABELS: Record<CashCategory, string> = {
  buff: 'บัฟ',
  costume: 'คอสตูม',
  refine: 'ตีบวก',
  starter: 'ชุดเริ่มต้น',
  package: 'แพ็กเกจ',
  utility: 'ของใช้',
};

export function categorize(row: CashRowFacts): CashCategory {
  const n = row.name_en;
  const d = row.description_th ?? '';
  if (/Costume|Baby Shark/.test(n) || /คอสตูม/.test(d)) return 'costume';
  if (/^HD |Enriched Abrasive/.test(n)) return 'refine';
  if (/^Shining /.test(n)) return 'starter';
  if (/^Account |Essential Package|Buff Package|Growth Package|Elixir Package/.test(n)) return 'buff';
  if (/Growth Elixir|Bubble Gum|Challenge Drink|Agi Up|Ale's|Mimir|Unlimited Drink|Premium Course Meal/.test(n)) return 'buff';
  if (/Package$/.test(n)) return 'package';
  return 'utility';
}

/** Cost in THB per active day, or null when the item has no duration. */
export function thbPerDay(kpPrice: number, row: CashRowFacts): number | null {
  const days = durationDays(row);
  if (!days) return null;
  return (kpPrice * THB_PER_KP) / days;
}

/**
 * KP top-up planning against gnjoy TH packs. Every pack costs the same per
 * KP, so the cheapest way to cover a need is simply the smallest multiple of
 * 1,000 KP at or above it; the pack list is only about which buttons to press.
 */
export const KP_PACKS = [200000, 100000, 50000, 25000, 10000, 5000, 1000];

export function topUpPlan(neededKp: number): {
  buyKp: number;
  thb: number;
  leftoverKp: number;
  packs: { size: number; count: number }[];
} {
  const buyKp = Math.max(0, Math.ceil(neededKp / 1000) * 1000);
  const packs: { size: number; count: number }[] = [];
  let rest = buyKp;
  for (const size of KP_PACKS) {
    const count = Math.floor(rest / size);
    if (count > 0) {
      packs.push({ size, count });
      rest -= size * count;
    }
  }
  return { buyKp, thb: buyKp * THB_PER_KP, leftoverKp: buyKp - neededKp, packs };
}
