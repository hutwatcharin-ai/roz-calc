// Resolves every crawled quest page's __NUXT_DATA__ payload into the quest
// object prontera's own app renders from. quest_id_ingame matches our own
// quests.id exactly (checked: quest 22207 is "A Fine Sombrero" on both
// sites) -- so joining needs no name-matching, just an id lookup.
import fs from 'node:fs';
import path from 'node:path';
import { resolvePayload } from './resolve-lib.mjs';

const SRC = path.resolve('prontera-export', 'data', 'quests.jsonl');
const OUT = path.resolve('prontera-export', 'quests-summary.json');

const lines = fs.readFileSync(SRC, 'utf8').trim().split('\n');
const quests = [];
const skipped = [];

for (const line of lines) {
  const rec = JSON.parse(line);
  if (rec.slug === 'quests' || rec.slug === 'by-level') continue; // list/tool shells
  if (rec.status !== 200) { skipped.push({ url: rec.url, reason: `status ${rec.status}` }); continue; }
  if (!rec.nuxt_data) { skipped.push({ url: rec.url, reason: 'no nuxt_data' }); continue; }
  let root;
  try {
    root = resolvePayload(rec.nuxt_data);
  } catch (e) {
    skipped.push({ url: rec.url, reason: `resolve failed: ${e.message}` });
    continue;
  }
  const key = Object.keys(root.data ?? {}).find((k) => k.startsWith('quest-'));
  const q = key ? root.data[key]?.quest : null;
  if (!q) { skipped.push({ url: rec.url, reason: 'no quest object in payload' }); continue; }

  quests.push({
    quest_id_ingame: q.quest_id_ingame ?? null,
    slug: q.slug,
    name: q.name,
    quest_type: q.quest_type,
    min_base_level: q.min_base_level,
    min_job_level: q.min_job_level,
    start_map_slug: q.start_map?.slug ?? null,
    start_map_name: q.start_map?.name ?? null,
    start_location_hint: q.start_location_hint ?? null,
    start_npc_name: q.start_npc ?? null,
    start_npc_slug: q.start_npc_ref?.slug ?? null,
    base_exp_reward: q.base_exp_reward,
    job_exp_reward: q.job_exp_reward,
    zeny_reward: q.zeny_reward,
    is_repeatable: q.is_repeatable ?? null,
    eligible_classes: q.eligible_classes ?? [],
    rewards: (q.rewards ?? []).map((r) => ({
      quantity: r.quantity,
      reward_kind: r.reward_kind,
      item_slug: r.item?.slug ?? null,
      item_name: r.item?.name ?? null,
    })),
  });
}

const withId = quests.filter((q) => q.quest_id_ingame != null);
const withRewardData = withId.filter((q) => q.rewards.length > 0 || q.base_exp_reward != null || q.job_exp_reward != null || q.zeny_reward != null);

fs.writeFileSync(OUT, JSON.stringify({
  source: 'https://roz.prontera.info',
  extracted_at: new Date().toISOString(),
  count: quests.length,
  with_quest_id: withId.length,
  with_any_reward_data: withRewardData.length,
  skipped_count: skipped.length,
  quests,
  skipped,
}, null, 2), 'utf8');

console.log(`${quests.length} quests (${withId.length} with a matchable id, ${withRewardData.length} carry reward data), ${skipped.length} skipped -> ${OUT}`);
