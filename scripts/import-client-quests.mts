// Quests the live client lists that our quests table lacks (owner, 15 Oct
// 2026): the 1 Oct events (Kumamon, The Legend of Amon Ra, The Baphomet Cult)
// and the 15 Oct ones (the two MVP raids, Guild Hall of Fame). Input is the
// client's OngoingQuestInfoList_thTH / _enUS entries, decoded to JSON by the
// scratch step that compares them with the 22 Sep client:
//   { "<quest id>": { th: {Title, Summary, Description}, en: {...} } }
//
//   set -a; . ./.env.local; set +a
//   npx tsx scripts/import-client-quests.mts <quests.json>            (dry run)
//   npx tsx scripts/import-client-quests.mts <quests.json> --apply
//
// Skipped: the "[รอ]" waiting copies and one-line notices (harvest done,
// collab over) -- a page each would say nothing.
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const [file, flag] = process.argv.slice(2);
const apply = flag === '--apply';
type Text = { Title?: string; Summary?: string; Description?: Record<string, string> };
const src = JSON.parse(readFileSync(file, 'utf8')) as Record<string, { th: Text; en: Text | null }>;
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

// Client markup to plain text: <NAVI>[Apep]<INFO>...</INFO></NAVI> -> Apep, colour codes out.
const plain = (s: string) =>
  s.replace(/<(NAVI|ITEM)>\[([^\]]*)\]<INFO>[^<]*<\/INFO><\/\1>/g, '$2').replace(/\^[0-9a-fA-F]{6}/g, '').trim();
const lines = (t: Text | null) => Object.keys(t?.Description ?? {}).sort((a, b) => +a - +b).map((k) => plain(t!.Description![k])).filter((l) => l && l !== '_');
const ZONE: Record<string, [string, string]> = {
  prontera: ['prontera', 'Prontera'], prt_in: ['prontera', 'Prontera'], moc_ruins: ['morocc-ruins', 'Morocc Ruins'],
  moc_fild19: ['morocc-region', 'Morocc Region'], prt_church: ['other', 'Prt_church'],
  moc_pryd06: ['other', 'Pyramid'], prt_maze03: ['other', 'Labyrinth Forest'], clb_kuma: ['other', 'Kumamoto Farm'],
};
const NOTICE = /สำเร็จ$|สิ้นสุดแล้ว$|เอฟเฟกต์$/;

const { data: have } = await db.from('quests').select('id').in('id', Object.keys(src).map(Number));
const known = new Set((have ?? []).map((r) => r.id));
const rows = [];
for (const [id, { th, en }] of Object.entries(src)) {
  const title = th.Title ?? '';
  if (known.has(Number(id)) || title.startsWith('[รอ]') || NOTICE.test(title)) continue;
  const raw = Object.values(th.Description ?? {}).join(' ');
  // The Guild Hall of Fame quests name no place; all are Liechtenauer's
  // (prontera 155 307, the official event page).
  const navi = raw.match(/<INFO>([a-z0-9_]+),(\d+),(\d+)/) ?? (id.startsWith('12000') ? [null, 'prontera', '155', '307'] : null);
  const map = navi?.[1] ?? null;
  const [town_key, zone] = (map && ZONE[map]) ?? ['other', null];
  const sum = `${th.Summary ?? ''} ${en?.Summary ?? ''}`;
  const type = /รายวัน|daily/i.test(title) ? 'kill' : /กำจัด|defeat|hunt/i.test(sum) ? 'kill' : /รวบรวม|ส่งมอบ|collect|deliver/i.test(sum) ? 'fetch' : 'story';
  rows.push({
    id: Number(id),
    name: plain(en?.Title ?? title),
    name_th: plain(title),
    objective: en?.Summary ? plain(en.Summary) : null,
    objective_th: th.Summary ? plain(th.Summary) : null,
    description: lines(en).join('\n') || null,
    description_th: lines(th).join('\n') || null,
    map_code: map,
    coord_x: navi ? Number(navi[2]) : null,
    coord_y: navi ? Number(navi[3]) : null,
    zone,
    town_key,
    type,
  });
}
for (const r of rows) console.log(r.id, r.type, r.map_code ?? '-', r.name_th, '|', r.objective_th);
console.log(`${rows.length} to add`);
if (apply && rows.length) {
  const { error } = await db.from('quests').insert(rows);
  if (error) throw error;
  console.log('inserted');
}
