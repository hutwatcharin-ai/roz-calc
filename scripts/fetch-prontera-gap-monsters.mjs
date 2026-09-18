// Fetches the monster pages roz.prontera.info lists that our monsters table
// has no row for (found 18 Sep 2026 by diffing its mobs sitemap against ours:
// 691 pages, 534 rows here, 396 names unmatched -- but 312 of those are the
// variant tiers it spells "fast-/sturdy-/enraged-/wandering-/boss-" and we
// store as "C1 ".."C5 ", so the real gap is the 84 plain names kept here).
//
// Its robots.txt allows /mobs/ (only /api/ is disallowed), and the page
// carries a Nuxt payload we read with the item script's resolver rather than
// scraping rendered HTML.
//
// Fetching and importing stay separate, same as the item pair: this writes a
// file to look at, and nothing here touches the database. A sample on 18 Sep
// showed most of these pages are name-only stubs (level, hp, race all null),
// so the file records what each page actually carried and the import step
// decides what is worth having.
//
// Run:  node scripts/fetch-prontera-gap-monsters.mjs
// Writes data/raw/prontera-gap-monsters.json.

import fs from 'node:fs';
import path from 'node:path';
import { resolveNuxtData } from './prontera-nuxt.mjs';

const OUT = path.join(process.cwd(), 'data', 'raw', 'prontera-gap-monsters.json');
const DELAY_MS = 300;

// From the 18 Sep 2026 diff. Kept verbatim so a rerun fetches the same set.
const SLUGS = [
  'abysmal-knight', 'alphoccio-ballzac-blue', 'alphoccio-ballzac-green', 'amdarais-pet', 'andre-egg',
  'apocalips-h', 'aqua-elemental-event', 'archer-skeleton-reinforced', 'baphomet-jr', 'beetle-king',
  'big-dalcom', 'big-eggring', 'big-morocc-event-strong', 'big-morocc-event-weak', 'big-morocc-medium',
  'big-morocc-strong', 'big-morocc-weak', 'boulderdwarf-hammer-mj', 'boulderdwarf-leader-mj',
  'boulderdwarf-mace-mj', 'boulderdwarf-sm', 'bunny-poring', 'celia-alcazar-blue', 'celia-alcazar-green',
  'chen-kuang-woo-blue', 'chen-kuang-woo-green', 'chepet', 'clock-tower-manager', 'cutie-event',
  'daebak-gourd', 'dummy-10-2408', 'dummy-10-fire-2413', 'eremes-guile-blue', 'eremes-guile-green',
  'fatal-bug', 'female-thiefbug', 'flamel-chenier-blue', 'flamel-chenier-green', 'gertie-wiegel-blue',
  'gertie-wiegel-green', 'gold-anopheles', 'gold-poring', 'golden-thief-bug', 'ground-petite',
  'harword-reginleif-blue', 'harword-reginleif-green', 'high-orc-mirror-dungeon', 'hunter-v-event',
  'katrinn-rodriguez-blue', 'katrinn-rodriguez-green', 'male-thiefbug', 'margaretha-sorin-blue',
  'margaretha-sorin-green', 'mistress', 'mutant-dragon', 'old-treasure-chest', 'orc-archer-mirror-dungeon',
  'orc-general', 'orc-hero-mirror-dungeon', 'orc-lord-mirror-dungeon', 'orc-skeleton-mirror-dungeon',
  'orc-zombie-mirror-dungeon', 'picky-egg', 'picky-poring', 'pirate-skeleton', 'poring-gem',
  'randel-lawrence-blue', 'randel-lawrence-green', 'rhinoceros-beetle', 'seyren-windsor-blue',
  'seyren-windsor-green', 'shecil-blue', 'shecil-green', 'skeleton-reinforced', 'sky-petite',
  'soldier-skeleton-reinforced', 'the-paper-event', 'thiefbug-event', 'tivia', 'tower-keeper',
  'trentini-blue', 'trentini-green', 'wanderer', 'zealotus',
];

export function parseMobPage(html) {
  const m = /<script[^>]*id="__NUXT_DATA__"[^>]*>([\s\S]*?)<\/script>/.exec(html);
  if (!m) return null;
  const root = resolveNuxtData(JSON.parse(m[1]));
  const key = Object.keys(root.data ?? {}).find((k) => k.startsWith('mob-') && k.endsWith('-en'));
  if (!key) return null;
  const bundle = root.data[key];
  const mob = bundle?.mob;
  if (!mob) return null;
  return {
    slug: mob.slug,
    name: mob.name,
    id: mob.mob_id_ingame,
    level: mob.level,
    hp: mob.hp,
    race: mob.race,
    element: mob.element,
    elementLevel: mob.element_level,
    size: mob.size,
    atkMin: mob.atk_min,
    atkMax: mob.atk_max,
    def: mob.def_base,
    mdef: mob.mdef_base,
    baseExp: mob.base_exp,
    jobExp: mob.job_exp,
    hit100: mob.hit_100,
    flee95: mob.flee_95,
    isBoss: mob.is_boss,
    isMvp: mob.is_mvp,
    variantTier: mob.variant_tier,
    dataSource: mob.data_source,
    // Counted, not copied: the import decides whether a row with no stats but
    // real drops is worth having, and that call needs the numbers first.
    drops: (bundle.drops ?? []).map((d) => ({ name: d.item?.name ?? d.name ?? null, rate: d.rate ?? null })),
    spawnCount: (bundle.spawns ?? []).length,
    spawnMaps: [...new Set((bundle.spawns ?? []).map((s) => s.map?.map_code ?? s.map_code ?? null).filter(Boolean))],
  };
}

async function main() {
  const results = [];
  let failed = 0;
  for (const slug of SLUGS) {
    try {
      const res = await fetch(`https://roz.prontera.info/mobs/${slug}`);
      if (res.ok) {
        const parsed = parseMobPage(await res.text());
        if (parsed) results.push(parsed);
        else {
          failed += 1;
          console.log(`  unreadable: ${slug}`);
        }
      } else {
        failed += 1;
        console.log(`  ${res.status}: ${slug}`);
      }
    } catch (err) {
      failed += 1;
      console.log(`  error on ${slug}: ${err.message}`);
    }
    await new Promise((r) => setTimeout(r, DELAY_MS));
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(results, null, 1));

  const withId = results.filter((r) => r.id != null);
  const withStats = results.filter((r) => r.level != null && r.hp != null);
  console.log(`wrote ${results.length} pages to ${OUT}`);
  console.log(`${withId.length} carry an in-game id, ${withStats.length} carry level and hp`);
  console.log(`${results.filter((r) => r.drops.length > 0).length} list at least one drop`);
  console.log(`${failed} pages could not be read`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
