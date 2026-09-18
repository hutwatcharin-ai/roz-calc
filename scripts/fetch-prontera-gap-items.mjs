// Fetches the 54 item ids that a second database (roz.prontera.info) lists
// but ours does not -- found 14 Sep 2026 by diffing its /items sitemap
// against our own items table (98.7% already overlapped; this is the gap).
//
// Its robots.txt allows /items/ (only /api/ is disallowed). The page embeds
// its data as a Nuxt __NUXT_DATA__ payload (devalue's reference-array
// format: each slot is a primitive, an array of refs, or a {key: ref}
// object; a two-element ["XReactive", ref] tags a wrapped ref and is
// unwrapped rather than treated as a two-item array). That is read directly
// instead of scraping rendered text, so there is no brittle regex over HTML.
//
// Fetching and importing are separate on purpose, same as
// fetch/import-rozerodb-items.ts: this writes a file that can be inspected
// before anything touches the database.
//
// Run it with:
//   node scripts/fetch-prontera-gap-items.mjs
// Writes data/raw/prontera-gap-items.json. Import with
// scripts/import-prontera-gap-items.mjs.

import fs from 'node:fs';
import path from 'node:path';
import { resolveNuxtData } from './prontera-nuxt.mjs';

export { resolveNuxtData };

const OUT = path.join(process.cwd(), 'data', 'raw', 'prontera-gap-items.json');
const DELAY_MS = 300;

// Slugs come straight from https://roz.prontera.info/__sitemap__/items.xml,
// filtered on 14 Sep 2026 to the ids not present in our own items table.
const SLUGS = [
  'guild-flame-red-1003110',
  'guild-flame-blue-1003111',
  'guild-flame-green-1003112',
  'guild-flame-yellow-1003113',
  'scribbled-diary-fragment-1003217',
  'character-slot-expansion-card-103307',
  'event-selection-event-participation-reward-108000',
  'event-selection-event-score-reward-30-000-points-108001',
  'event-selection-event-score-reward-40-000-points-108002',
  'event-selection-event-score-reward-50-000-points-108003',
  'event-selection-event-1st-place-reward-108004',
  'event-selection-event-2nd-place-reward-108005',
  'event-selection-event-3rd-place-reward-108006',
  'event-treasure-hunt-card-box-108018',
  'event-reward-package-ii-108056',
  'event-reward-package-i-108057',
  'special-buff-selection-box-108083',
  'abyss-scroll-108084',
  'event-boarding-halter-box-7-days-108118',
  'battle-pass-box-108137',
  'guild-parma-1270260',
  'enriched-elunium-box-10-201076',
  'enriched-oridecon-box-10-201077',
  'character-slot-expansion-card-box-201078',
  'premium-buff-box-201079',
  'special-limited-package-i-201082',
  'special-limited-package-ii-201083',
  'gym-membership-package-201084',
  'invent-expand-package-201085',
  'special-recovery-package-201086',
  'special-buff-package-201087',
  'growth-elixir-package-201088',
  'hd-elunium-package-201089',
  'hd-oridecon-package-201090',
  'enriched-elunium-package-201091',
  'enriched-oridecon-package-201092',
  'premium-hd-elunium-package-201093',
  'premium-hd-oridecon-package-201094',
  'premium-enriched-elunium-package-201095',
  'premium-enriched-oridecon-package-201096',
  'abyss-scroll-box-201097',
  'abyss-scroll-box-10-201098',
  'premium-costume-box-201099',
  'special-costume-box-201100',
  'costume-gabriel-s-wings-20530',
  'costume-rune-helm-31160',
  'costume-little-mermaid-31672',
  'costume-rune-helm-bound-401536',
  'costume-released-ground-410081',
  'costume-released-ground-bound-410711',
  'costume-temari-candy-hair-420241',
  'costume-little-mermaid-bound-420967',
  'costume-temari-candy-hair-bound-420968',
  'costume-gabriel-s-wings-bound-480859',
];

export function parseItemPage(html) {
  const m = /<script[^>]*id="__NUXT_DATA__"[^>]*>([\s\S]*?)<\/script>/.exec(html);
  if (!m) return null;
  const data = JSON.parse(m[1]);
  const root = resolveNuxtData(data);
  const key = Object.keys(root.data ?? {}).find((k) => k.startsWith('item-') && k.endsWith('-en'));
  if (!key) return null;
  const bundle = root.data[key];
  const item = bundle?.item;
  if (!item?.item_id_ingame) return null;
  return {
    id: item.item_id_ingame,
    name: item.name,
    description: item.description,
    category: bundle.categories?.[0]?.name ?? null,
    equipSlot: item.equip_slot,
    weaponType: item.weapon_type,
    atk: item.physical_attack,
    requiredLevel: item.min_level,
    slots: item.slots,
    weight: item.weight,
    buy: item.buy_price,
    sell: item.sell_price,
  };
}

async function main() {
  const existing = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : [];
  const have = new Set(existing.map((i) => i.id));
  const todo = SLUGS.filter((s) => !have.has(Number(s.match(/-(\d+)$/)?.[1])));
  console.log(`${existing.length} already fetched, ${todo.length} to go`);

  let failed = 0;
  const results = [...existing];
  for (const slug of todo) {
    try {
      const res = await fetch(`https://roz.prontera.info/items/${slug}`);
      if (res.ok) {
        const parsed = parseItemPage(await res.text());
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

  fs.writeFileSync(OUT, JSON.stringify(results, null, 1));
  console.log(`wrote ${results.length} items to ${OUT}`);
  console.log(`${failed} pages could not be read or parsed`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
