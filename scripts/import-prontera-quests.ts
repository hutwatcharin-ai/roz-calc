// Imports what prontera.info knows about our quests that our own source does
// not: the item rewards, and the map coordinates of the NPC a quest starts at.
//
// Sources (both produced by docs/prontera-export/*.mjs out of the crawled
// pages' Nuxt payloads):
//   docs/prontera-export/quests-summary.json  quest_id_ingame -> rewards[]
//   docs/prontera-export/npcs-summary.json    npc slug -> map_navi_code, x, y
//
// The join is exact, not fuzzy: quest_id_ingame equals our quests.id, and an
// NPC's map_navi_code equals our map_code (both rAthena-style, e.g. "prt_in").
// Nothing is matched by name.
//
// Coordinates are only ever written into a NULL -- a quest that already has a
// coordinate keeps it, because our own import wrote those from the source we
// trust first.
//
// Note on EXP and Zeny: the export carries base_exp_reward/job_exp_reward/
// zeny_reward fields, and every one of the 827 quests has them null. The
// columns exist on our side; nothing fills them until a source actually has
// the numbers. They are not written here, and not guessed.
//
// Run:  npx tsx scripts/import-prontera-quests.ts [--dry]

import * as fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const QUESTS_FILE = 'docs/prontera-export/quests-summary.json';
const NPCS_FILE = 'docs/prontera-export/npcs-summary.json';
const CHUNK = 300;

interface ExportedReward {
  quantity: number | null;
  reward_kind: string | null;
  item_slug: string | null;
  item_name: string | null;
}

interface ExportedQuest {
  quest_id_ingame: number | null;
  slug: string;
  name: string | null;
  start_npc_slug: string | null;
  rewards: ExportedReward[];
}

interface ExportedNpc {
  slug: string;
  name: string | null;
  map_navi_code: string | null;
  x: number | null;
  y: number | null;
}

async function main(): Promise<void> {
  const dry = process.argv.includes('--dry');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  const db = createClient(url, key);

  const quests = (JSON.parse(fs.readFileSync(QUESTS_FILE, 'utf8')).quests ?? []) as ExportedQuest[];
  const npcs = (JSON.parse(fs.readFileSync(NPCS_FILE, 'utf8')).npcs ?? []) as ExportedNpc[];
  const npcBySlug = new Map(npcs.map((n) => [n.slug, n]));

  const { data: ourQuests, error: questsError } = await db
    .from('quests')
    .select('id, map_code, coord_x, coord_y');
  if (questsError) throw new Error(`quests read failed: ${questsError.message}`);
  const ours = new Map((ourQuests ?? []).map((q) => [q.id, q]));

  // --- item rewards ---
  const rewardRows: Record<string, unknown>[] = [];
  let rewardQuestsMatched = 0;
  let rewardQuestsUnknown = 0;
  for (const quest of quests) {
    if (quest.rewards.length === 0) continue;
    if (quest.quest_id_ingame === null || !ours.has(quest.quest_id_ingame)) {
      rewardQuestsUnknown += 1;
      continue;
    }
    rewardQuestsMatched += 1;
    for (const reward of quest.rewards) {
      // No slug means no key to deduplicate on; the row would multiply on
      // every re-run.
      if (!reward.item_slug) continue;
      rewardRows.push({
        quest_id: quest.quest_id_ingame,
        item_slug: reward.item_slug,
        item_name: reward.item_name,
        quantity: reward.quantity,
        reward_kind: reward.reward_kind,
        source: 'prontera.info',
      });
    }
  }

  // --- coordinate gap fill ---
  const coordUpdates: { id: number; map_code: string; coord_x: number; coord_y: number }[] = [];
  let noNpc = 0;
  let npcWithoutCoords = 0;
  for (const quest of quests) {
    if (quest.quest_id_ingame === null) continue;
    const mine = ours.get(quest.quest_id_ingame);
    if (!mine) continue;
    if (mine.coord_x !== null && mine.coord_y !== null) continue;
    if (!quest.start_npc_slug) {
      noNpc += 1;
      continue;
    }
    const npc = npcBySlug.get(quest.start_npc_slug);
    if (!npc || npc.map_navi_code === null || npc.x === null || npc.y === null) {
      npcWithoutCoords += 1;
      continue;
    }
    coordUpdates.push({ id: quest.quest_id_ingame, map_code: npc.map_navi_code, coord_x: npc.x, coord_y: npc.y });
  }

  console.log(`export: ${quests.length} quests, ${npcs.length} NPCs`);
  console.log(`item rewards: ${rewardRows.length} rows across ${rewardQuestsMatched} quests (${rewardQuestsUnknown} quests we do not have)`);
  console.log(`coordinates to fill: ${coordUpdates.length} (skipped ${noNpc} with no start NPC recorded, ${npcWithoutCoords} whose NPC has no coordinates)`);

  if (dry) {
    console.log('dry run, nothing written');
    return;
  }

  for (let i = 0; i < rewardRows.length; i += CHUNK) {
    const { error } = await db
      .from('quest_rewards')
      .upsert(rewardRows.slice(i, i + CHUNK), { onConflict: 'quest_id,item_slug' });
    if (error) throw new Error(`quest_rewards upsert failed at ${i}: ${error.message}`);
  }
  console.log(`wrote ${rewardRows.length} reward rows`);

  for (const update of coordUpdates) {
    const { error } = await db
      .from('quests')
      .update({ map_code: update.map_code, coord_x: update.coord_x, coord_y: update.coord_y })
      .eq('id', update.id)
      // Guard against a race with another writer: still only fills a NULL.
      .is('coord_x', null);
    if (error) throw new Error(`quest ${update.id} coordinate update failed: ${error.message}`);
  }
  console.log(`filled ${coordUpdates.length} quest coordinates`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
