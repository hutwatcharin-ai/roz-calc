// Skill damage formulas, hit counts and timings for the build simulator, from
// Landgris's RO Calculator in ROZ Global mode (owner, 15 Oct 2026: "follow
// theirs"). Reads the research export the owner keeps at
// C:\Users\ASUS\landgris-research (data/skills_zero.json with the Global
// overrides applied, and cast / delay / cooldown per level taken from the Zero
// client's skilldelaylist.lua) and writes data/zero-skills.json keyed by the
// English skill name our planner data uses.
//
//   node scripts/import-zero-skills.mjs [path-to-landgris-research]
//
// Formulas are rewritten into the expression language lib/build-calc's
// evalRatio understands (lower-case names, floor, ?:). A name the simulator
// cannot fill (shield weight, current SP...) is kept and listed in `needs`.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.argv[2] ?? 'C:/Users/ASUS/landgris-research';
const rows = JSON.parse(readFileSync(join(root, 'export/skills-global-effective-by-level.json'), 'utf8'));
const names = JSON.parse(readFileSync(join(root, 'export/skillTranslations.json'), 'utf8'));
const ours = JSON.parse(readFileSync('data/build-skills.json', 'utf8')).attacks;
const ourNames = new Set(Object.values(ours).flat().map((a) => a.n.toLowerCase()));

const ELEMENTS = ['neutral', 'fire', 'water', 'wind', 'earth', 'poison', 'holy', 'shadow', 'ghost', 'undead'];
const TYPES = ['atk', 'matk', 'breath', 'trap', 'mixed', 'falcon'];
// Their variable names, ours. BLV is Base Level, but the calculator pins it to
// 100 below Lv 100, so in Zero every "*BLV/100" is x1.
const VARS = {
  SLV: 'slv', BLV: '100', STR: 'str', AGI: 'agi', VIT: 'vit', INT: 'int', DEX: 'dex', LUK: 'luk',
  ESIZE: 'esize', CRW: 'cart_weight', Mhp: 'max_hp', CSP: 'cur_sp', SHW: 'shield_weight', SRL: 'shield_refine',
  WGT: 'weapon_weight', EVit: 'target_vit',
};
// Weapon checks WPT(Bows) become wpt_bows (1 when held, else 0).
function convert(expr) {
  let e = String(expr ?? '').trim();
  if (e === '') return '0';
  e = e.replace(/WPT\((\w+)\)/g, (_, w) => `wpt_${w.toLowerCase()}`);
  e = e.replace(/DOWN\(/g, 'floor(');
  e = e.replace(/\b([A-Za-z]+)\b/g, (w) => VARS[w] ?? w);
  return e;
}
const needsOf = (e) => [...new Set((e.match(/[a-z_]+/g) ?? []).filter((w) => /^(cart_weight|max_hp|cur_sp|shield_weight|shield_refine|weapon_weight|target_vit)$/.test(w)))];

// Their ids under the names our planner data uses (iRO English). Matched by
// id, never by their English label: several differ (Raid is Sightless Mind,
// Finger Offensive is Throw Spirit Sphere) and the bolts have no label at all.
const OUR_NAME = {
  MG_FIREBOLT: 'Fire Bolt', MG_COLDBOLT: 'Cold Bolt', MG_LIGHTNINGBOLT: 'Lightning Bolt',
  AS_GRIMTOOTH: 'Grimtooth', AS_SPLASHER: 'Venom Splasher', RG_BACKSTAP: 'Back Stab', RG_RAID: 'Sightless Mind',
  AC_DOUBLE: 'Double Strafe', WZ_HEAVENDRIVE: "Heaven's Drive", WZ_JUPITEL: 'Jupitel Thunder',
  WZ_VERMILION: 'Lord of Vermilion', HW_NAPALMVULCAN: 'Napalm Vulcan', HW_GRAVITATION: 'Gravitational Field',
  PR_MAGNUS: 'Magnus Exorcismus', MO_CHAINCOMBO: 'Raging Quadruple Blow', MO_COMBOFINISH: 'Raging Thrust',
  CH_TIGERFIST: 'Glacier Fist', CH_CHAINCRUSH: 'Chain Crush Combo', MO_FINGEROFFENSIVE: 'Throw Spirit Sphere',
  MO_TRIPLEATTACK: 'Raging Trifecta Blow', MO_EXTREMITYFIST: 'Guillotine Fist', WZ_METEOR: 'Meteor Storm',
  BA_MUSICALSTRIKE: 'Melody Strike', ASC_BREAKER: 'Soul Destroyer', HT_BLASTMIN: 'Blast Mine',
  SN_FALCONASSAULT: 'Falcon Assault', LK_SPIRALPIERCE: 'Clashing Spiral', PA_SACRIFICE: 'Sacrifice',
  PA_SHIELDCHAIN: 'Rapid Smiting', SN_SHARPSHOOTING: 'Focused Arrow Strike', CR_ACIDDEMONSTRATION: 'Acid Bomb',
  AB_DUPLELIGHT: 'Duple Light',
};

const out = {};
for (const { skill: s } of rows) {
  const id = s.id.replace(/\(.*\)$/, '');
  const variant = s.id.match(/\((.*)\)$/)?.[1] ?? null;
  if (id.startsWith('GS_') || id.startsWith('NJ_')) continue; // no Gunslinger or Ninja in Zero yet
  const en = OUR_NAME[id] ?? names[id]?.en ?? names[s.id]?.en;
  if (!en) continue;
  const key = variant ? `${en} (${variant})` : en;
  const e = (out[key] ??= {
    id: s.id,
    type: TYPES[s.DamageTypeIdx] ?? 'atk',
    f: convert(s.formula),
    hits: convert(s.hitnumber),
    el: ELEMENTS[s.elemental] ?? 'neutral',
    ranged: !!s.ranged,
    crit: !!s.critical,
    ignoreDefSoftOnly: !!s.transWeaponDEF,
    lv: [],
  });
  // [fct, vct, cooldown, global delay] in seconds; an expression stays a string.
  const t = (v) => (typeof v === 'number' ? v : Number.isFinite(Number(v)) && v !== '' ? Number(v) : convert(v));
  e.lv[s.level - 1] = [t(s.FCT), t(s.VCT), t(s.CD), t(s.GCD)];
}
for (const e of Object.values(out)) {
  const n = [...needsOf(e.f), ...needsOf(e.hits)];
  if (n.length) e.needs = [...new Set(n)];
}
const matched = Object.keys(out).filter((k) => ourNames.has(k.toLowerCase()));
writeFileSync(
  'data/zero-skills.json',
  JSON.stringify(
    {
      _meta: {
        what: "Attack skill formulas (damage %, hit count: negative = the total shown as n hits), element and timings [fct, vct, cooldown, delay] seconds per level, as Landgris's RO Calculator runs ROZ Global (landgris.github.io/ROCalculator/?zero, repo commit b29699b, read 15 Oct 2026). Timings come from the Zero client's skilldelaylist.lua. Not checked in game by us.",
        made: 'scripts/import-zero-skills.mjs',
      },
      skills: out,
    },
    null,
    1,
  ) + '\n',
);
console.log(`${Object.keys(out).length} skills, ${matched.length} match a planner attack`);
console.log('not in our planner:', Object.keys(out).filter((k) => !ourNames.has(k.toLowerCase())).join(', '));
