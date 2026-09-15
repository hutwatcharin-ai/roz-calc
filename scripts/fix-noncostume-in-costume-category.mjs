// scripts/fix-noncostume-in-costume-category.mjs
//
// Boxes, buffs, potions and tickets from the cash shop were imported under
// "Costume Equipment" and showed up on /database/costumes with no position
// (owner spotted it, 15 Sep 2026). A row is moved only when its name carries
// no costume marker AND prontera's item page files it under a non-costume
// type; the new category comes from that page, so nothing is guessed.
//
// Usage: node scripts/fix-noncostume-in-costume-category.mjs          (dry run)
//        node scripts/fix-noncostume-in-costume-category.mjs --apply
import fs from 'node:fs';
import readline from 'node:readline';

const APPLY = process.argv.includes('--apply');

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split(/\r?\n/).filter((l) => l.includes('=')).map((l) => {
    const i = l.indexOf('=');
    return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')];
  }),
);
const BASE = `${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1`;
const HEADERS = { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` };

// prontera's type label -> our items.category value.
const CATEGORY_MAP = {
  'Package/Box': 'Package/Box',
  Consumable: 'Consumable / Recovery',
  Enchantment: 'Enchantment',
  Material: 'Material',
  Etc: 'Other',
  Other: 'Other',
};

// "Costume Mystery Wing Box" or "Costume Change Ticket" are not costumes: a
// container or ticket word overrides the costume marker.
const COSTUME_MARKER = /costume|\(bound\)|\[bound\]/i;
const CONTAINER_WORD = /\b(box|ticket|package|coupon|injector)\b/i;
const looksLikeCostume = (name) => COSTUME_MARKER.test(name) && !CONTAINER_WORD.test(name);

async function pronteraTypes() {
  const types = new Map();
  const rl = readline.createInterface({ input: fs.createReadStream('docs/prontera-export/data/items.jsonl', 'utf8') });
  for await (const line of rl) {
    const d = JSON.parse(line);
    const m = /\/items\/.*-(\d+)$/.exec(d.url ?? '');
    if (!m) continue;
    const id = Number(m[1]);
    // "<Name> <Type> ID <id>" sits right after the breadcrumb.
    const t = d.text ?? '';
    const at = t.indexOf(` ID ${id} `);
    if (at < 0) continue;
    const before = t.slice(Math.max(0, at - 80), at);
    const hit = Object.keys(CATEGORY_MAP).concat(['Costume', 'Headgear', 'Garment', 'Shield', 'Weapon', 'Accessory'])
      .filter((k) => before.endsWith(` ${k}`))
      .sort((a, b) => b.length - a.length)[0];
    types.set(id, hit ?? null);
  }
  return types;
}

const rows = [];
for (let from = 0; ; from += 1000) {
  const r = await fetch(`${BASE}/items?select=id,name_en,weapon_type&category=eq.Costume%20Equipment&order=id`, {
    headers: { ...HEADERS, Range: `${from}-${from + 999}` },
  });
  const page = await r.json();
  rows.push(...page);
  if (page.length < 1000) break;
}

const types = await pronteraTypes();
const moves = [];
const unresolved = [];
for (const row of rows) {
  if (looksLikeCostume(row.name_en) || row.weapon_type) continue;
  const type = types.get(row.id);
  const target = type ? CATEGORY_MAP[type] : undefined;
  if (target) moves.push({ ...row, type, target });
  else unresolved.push({ ...row, type: type ?? 'not on prontera' });
}

// Not on prontera, so no type label to read. Moved by what their own
// description says they do (15 Sep 2026); left in place if the row changed.
const MANUAL = [
  { id: 106248, name: 'Costume Change Ticket (2nd Job) Box', target: 'Package/Box', why: '"When used, you can obtain the change coupon"' },
  { id: 1002639, name: 'Costume Change Ticket', target: 'Other', why: '"A change ticket ... each change consumes 1 coupon"' },
  { id: 310074, name: 'Resist: Critical Lv.1', target: 'Enchantment', why: '"Siege-Exclusive Option" enchant, like the rest of Enchantment' },
];
for (const manual of MANUAL) {
  const at = unresolved.findIndex((u) => u.id === manual.id && u.name_en === manual.name);
  if (at < 0) continue;
  unresolved.splice(at, 1);
  moves.push({ id: manual.id, name_en: manual.name, type: `manual: ${manual.why}`, target: manual.target });
}

console.log(`costume-category rows: ${rows.length}`);
console.log(`to move: ${moves.length}`);
for (const m of moves) console.log(`  ${m.id} | ${m.name_en} | prontera ${m.type} -> ${m.target}`);
console.log(`left alone (no costume marker, but no non-costume type found): ${unresolved.length}`);
for (const u of unresolved) console.log(`  ${u.id} | ${u.name_en} | ${u.type}`);

if (!APPLY) {
  console.log('\ndry run -- pass --apply to write');
  process.exit(0);
}

let written = 0;
for (const m of moves) {
  const r = await fetch(`${BASE}/items?id=eq.${m.id}&category=eq.Costume%20Equipment`, {
    method: 'PATCH',
    headers: { ...HEADERS, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify({ category: m.target }),
  });
  const out = await r.json();
  if (!r.ok || out.length !== 1) throw new Error(`id ${m.id}: ${r.status} ${JSON.stringify(out)}`);
  written += 1;
}
console.log(`\nwrote ${written}/${moves.length}`);
