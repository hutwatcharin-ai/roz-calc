// Builds data/mob-skills.json: the attack skills each monster casts on the
// player, for the bot model's damage (lib/farm-engine/bot-session). Owner,
// 19 Oct 2026: "monsters do land hits sometimes -- 5 potions an hour is
// impossible". Normal hits alone, against a high-FLEE character, floor at
// 5%; many monsters' skills either ignore FLEE or are magic.
//
//   node scripts/build-mob-skills.mjs <mob_skill_db.txt> <skill_db.yml> <re/mob_db.yml> <npc-skills-dir> <farm-data.json>
//
// All four sources are rAthena's (github.com/rathena/rathena master):
//   db/re/mob_skill_db.txt      who casts what, at which level, how often
//   db/re/skill_db.yml          Weapon or Magic, IgnoreFlee/IgnoreDefense, hit count
//   db/re/mob_db.yml            Attack / Attack2 (MATK) / Int / Level, for magic damage
//   src/map/skills/npc/*.cpp    the NPC_ skills' damage ratios (base_skillratio)
// Classic RO values, none measured in Zero; the page says so.
//
// Output, per monster id: [[kind, ratioPct, hits, ratePer10000, delayMs, hitBonusPct, share], ...]
//   kind      0 weapon, FLEE applies   1 weapon, ignores FLEE
//             2 weapon, always critical (ignores FLEE and DEF)   3 magic (ignores FLEE and DEF)
//   ratioPct  damage ratio, 100 = one normal hit; non-NPC skills default to 100 per hit
//   hits      damage multiplier from the hit count (a negative count only splits the number on screen)
//   share     part of a fight the condition holds: 1, or X/100 for "my HP below X%"
// and magic[id] = MATK / ATK in rAthena's table, to scale Zero's ATK into a
// magic hit: (Attack2 + 1.5 Int + Level/4) / Attack, renewal's monster MATK
// less its DEX/LUK terms.

import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [skillDbTxt, skillYml, mobYml, npcDir, farmPath] = process.argv.slice(2);
if (!farmPath) throw new Error('usage: build-mob-skills.mjs <mob_skill_db.txt> <skill_db.yml> <mob_db.yml> <npc-skills-dir> <farm-data.json>');

const farm = JSON.parse(readFileSync(farmPath, 'utf8'));
const wanted = new Set(Object.keys(farm.monsters).map(Number));

// --- skill_db.yml: type, flags, hit count per level ------------------------
const skills = new Map();
let cur = null;
let inHits = false;
let lastLevel = null;
for (const line of readFileSync(skillYml, 'utf8').split(/\r?\n/)) {
  let m;
  if (/^  - Id: /.test(line)) {
    cur = { hits: {}, hitDefault: 1 };
    inHits = false;
  } else if (!cur) continue;
  else if ((m = line.match(/^    Name: (\S+)/))) skills.set(m[1], (cur.name = m[1], cur));
  else if ((m = line.match(/^    Type: (\w+)/))) cur.type = m[1];
  else if ((m = line.match(/^    TargetType: (\w+)/))) cur.target = m[1];
  else if (/^      IgnoreFlee: true/.test(line)) cur.ignoreFlee = true;
  else if (/^      IgnoreDefense: true/.test(line)) cur.ignoreDef = true;
  else if ((m = line.match(/^    HitCount: (-?\d+)/))) cur.hitDefault = Number(m[1]);
  else if (/^    HitCount:\s*$/.test(line)) inHits = true;
  else if (inHits && (m = line.match(/^      - Level: (\d+)/))) lastLevel = Number(m[1]);
  else if (inHits && (m = line.match(/^        Count: (-?\d+)/))) cur.hits[lastLevel] = Number(m[1]);
  else if (/^    \S/.test(line)) inHits = false;
}

// --- NPC_ damage ratios from the skill implementations ----------------------
const ratio = new Map();
for (const f of readdirSync(npcDir).filter((x) => x.endsWith('.cpp'))) {
  const src = readFileSync(join(npcDir, f), 'utf8');
  const name = src.match(/SkillImpl\((NPC_[A-Z0-9_]+)\)/)?.[1];
  const body = src.match(/calculateSkillRatio[^{]*\{([^}]*)\}/)?.[1];
  if (!name || !body) continue;
  const lines = body.split('\n').map((l) => l.replace(/\/\/.*$/, '').trim()).filter(Boolean);
  // Only the plain one-liners: "base_skillratio += <expr in skill_lv>;".
  if (lines.length !== 1) continue;
  const m = lines[0].match(/^base_skillratio \+= (.+);$/);
  if (!m || !/^[-+*/()%\d\sskill_lv]+$/.test(m[1])) continue;
  ratio.set(name, new Function('skill_lv', `return 100 + (${m[1]});`));
}

// --- mob_db.yml: ATK, MATK, INT, level ---------------------------------------
const mobs = new Map();
let mob = null;
for (const line of readFileSync(mobYml, 'utf8').split(/\r?\n/)) {
  let m;
  if ((m = line.match(/^  - Id: (\d+)/))) mobs.set(Number(m[1]), (mob = {}));
  else if (mob && (m = line.match(/^    (Level|Attack|Attack2|Int): (\d+)/))) mob[m[1]] = Number(m[2]);
}

// --- mob_skill_db.txt --------------------------------------------------------
// MobID,Info,State,SkillID,SkillLv,Rate,CastTime,Delay,Cancelable,Target,ConditionType,ConditionValue,...
const STATES = new Set(['attack', 'angry', 'berserk']);
const out = {};
const magic = {};
const unknownRatio = new Set();
for (const line of readFileSync(skillDbTxt, 'utf8').split(/\r?\n/)) {
  if (!line || line.startsWith('//')) continue;
  const f = line.split(',');
  const id = Number(f[0]);
  if (!wanted.has(id)) continue;
  const name = f[1].split('@')[1];
  const s = skills.get(name);
  if (!s || f[9] !== 'target' || (s.type !== 'Weapon' && s.type !== 'Magic')) continue;
  // Casters throw bolts while closing in too; melee skills need the target in reach.
  if (!STATES.has(f[2]) && !(f[2] === 'chase' && s.type === 'Magic')) continue;
  const cond = f[10];
  let share;
  if (cond === 'always' || cond === 'attackpcgt' || cond === 'attackpcge') share = 1;
  else if (cond === 'myhpltmaxrate') share = Math.min(1, Number(f[11]) / 100);
  else continue;
  const lv = Number(f[4]);
  const count = s.hits[lv] ?? s.hits[Math.max(...Object.keys(s.hits).map(Number).filter((k) => k <= lv), 0)] ?? s.hitDefault;
  const hits = count > 0 ? count : 1;
  let pct = 100;
  if (ratio.has(name)) pct = ratio.get(name)(lv);
  else if (name.startsWith('NPC_')) unknownRatio.add(name);
  const kind = s.type === 'Magic' ? 3 : name === 'NPC_CRITICALSLASH' ? 2 : s.ignoreFlee ? 1 : 0;
  // NPC_ attribute and status attacks hit 20% more often (modifyHitRate).
  const hitBonus = kind === 0 && name.startsWith('NPC_') && name.endsWith('ATTACK') ? 20 : 0;
  (out[id] ??= []).push([kind, Math.round(pct), hits, Number(f[5]), Number(f[7]), hitBonus, share]);
  const r = mobs.get(id);
  if (kind === 3 && r?.Attack) magic[id] = Math.round(((r.Attack2 ?? 0) + 1.5 * (r.Int ?? 0) + (r.Level ?? 0) / 4) / r.Attack * 100) / 100;
}

writeFileSync(
  'data/mob-skills.json',
  JSON.stringify({
    _meta: {
      how: 'node scripts/build-mob-skills.mjs <mob_skill_db.txt> <skill_db.yml> <re/mob_db.yml> <src/map/skills/npc> <farm-data.json>',
      skills: '[kind (0 weapon, 1 weapon ignoring FLEE, 2 always critical, 3 magic), ratio %, hits, rate /10000 per attack, cooldown ms, hit bonus %, share of fight] from rAthena re mob_skill_db + skill_db + src/map/skills/npc. Classic RO values, not measured in Zero.',
      magic: 'MATK / ATK from rAthena re mob_db: (Attack2 + 1.5 Int + Level/4) / Attack.',
      built: new Date().toISOString().slice(0, 10),
    },
    skills: out,
    magic,
  }),
);
console.log(`monsters with attack skills ${Object.keys(out).length}/${wanted.size}; NPC_ skills without a parsed ratio (100% used): ${[...unknownRatio].join(' ')}`);
