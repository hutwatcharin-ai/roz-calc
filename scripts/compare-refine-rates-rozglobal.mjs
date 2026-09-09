// Diffs our refine table against the mirrored French guide's copy of it.
//
// This is the third independent transcription of the same official page.
// scripts/compare-refine-rates.ts already diffs all 200 success cells against
// rozerodb's, and that comparison earned its keep: it caught four cells where
// our first transcription read armour's special column as 18 instead of 8.
// roz-global.info transcribed the same page separately, in French, and also
// publishes the ATK/MATK and DEF bonus per level -- which our table derives
// from formula, so a disagreement there would mean the formula is wrong, not
// just a digit.
//
// Nothing is written. It prints what disagrees and exits non-zero if anything
// does.
//
// Run:  node scripts/compare-refine-rates-rozglobal.mjs

import fs from 'node:fs';
import path from 'node:path';

const TABLES = path.join(process.cwd(), 'docs', 'rozglobal-export', 'tables.json');

// The guide's five tables, in the order the page prints them, mapped to our
// gear keys. Table 0 on that page is the ore/fee list, not a rate table.
const TABLE_FOR = { armour: 1, weapon1: 2, weapon2: 3, weapon3: 4, weapon4: 5 };

function loadOurs() {
  // Read the module's literals rather than importing it: this script is plain
  // node, and the point is to compare digits with the file as written. Split
  // on the gear key and stop at the closing bracket, so no regex has to carry
  // escapes through a shell.
  const source = fs.readFileSync(path.join(process.cwd(), 'lib', 'refine-table.ts'), 'utf8');
  const chance = {};
  for (const gear of Object.keys(TABLE_FOR)) {
    const after = source.split(`${gear}: [`)[1];
    if (after === undefined) throw new Error(`no REFINE_CHANCE block for ${gear}`);
    const block = after.split(']')[0];
    chance[gear] = [...block.matchAll(/normal: (\d+), special: (\d+)/g)].map((m) => ({
      normal: Number(m[1]),
      special: Number(m[2]),
    }));
  }
  const numbers = (key) => {
    const after = source.split(`export const ${key}`)[1];
    if (after === undefined) throw new Error(`no ${key} in refine-table.ts`);
    return after;
  };
  const arrayAfter = (text, key) => {
    const block = text.split(`${key}: [`)[1].split(']')[0];
    return block.split(',').map((n) => Number(n.trim()));
  };
  const atk = {};
  const atkBonus = {};
  const atkSource = numbers('WEAPON_ATK:');
  const bonusSource = numbers('WEAPON_ATK_BONUS:');
  for (const gear of ['weapon1', 'weapon2', 'weapon3', 'weapon4']) {
    atk[gear] = arrayAfter(atkSource, gear);
    atkBonus[gear] = arrayAfter(bonusSource, gear);
  }
  const defBlock = numbers('ARMOUR_DEF: number[] =').split('[')[1].split(']')[0];
  const armourDef = defBlock.split(',').map((n) => Number(n.trim()));
  return { chance, atk, atkBonus, armourDef };
}

function guideRows(tables, index) {
  const rows = tables['raffinage.html'][index].rows ?? tables['raffinage.html'][index];
  // Row 0 is the header the crawler kept as a row.
  return rows.slice(1).map((row) => ({
    level: Number(row[0]),
    normal: Number(row[1].replace('%', '')),
    special: Number(row[2].replace('%', '')),
    bonus: Number(row[3]),
    // "-" until the level where high-refine bonuses start.
    bonusMax: row[4] === undefined || row[4] === '-' ? 0 : Number(row[4]),
  }));
}

function main() {
  const tables = JSON.parse(fs.readFileSync(TABLES, 'utf8'));
  const { chance: ours, atk, atkBonus, armourDef } = loadOurs();
  const problems = [];
  let compared = 0;

  for (const [gear, index] of Object.entries(TABLE_FOR)) {
    const theirs = guideRows(tables, index);
    for (const row of theirs) {
      // Their "Niveau 1" is the +0 -> +1 step, which is our index 0.
      const mine = ours[gear][row.level - 1];
      if (!mine) {
        problems.push(`${gear} +${row.level}: they have a row, we stop at +${ours[gear].length}`);
        continue;
      }
      compared += 2;
      if (mine.normal !== row.normal) problems.push(`${gear} +${row.level} normal: ours ${mine.normal}%, guide ${row.normal}%`);
      if (mine.special !== row.special) problems.push(`${gear} +${row.level} special: ours ${mine.special}%, guide ${row.special}%`);
    }
    if (theirs.length !== ours[gear].length) {
      problems.push(`${gear}: guide has ${theirs.length} levels, we have ${ours[gear].length}`);
    }

    // The bonus columns are the stronger half of this comparison: our numbers
    // are produced by formula in lib/refine-table.test.ts, so a mismatch here
    // means the formula is wrong rather than a digit being mistyped.
    for (const row of theirs) {
      compared += gear === 'armour' ? 1 : 2;
      if (gear === 'armour') {
        if (armourDef[row.level - 1] !== row.bonus) {
          problems.push(`armour +${row.level} DEF: ours ${armourDef[row.level - 1]}, guide ${row.bonus}`);
        }
        continue;
      }
      if (atk[gear][row.level - 1] !== row.bonus) {
        problems.push(`${gear} +${row.level} ATK: ours ${atk[gear][row.level - 1]}, guide ${row.bonus}`);
      }
      if (atkBonus[gear][row.level - 1] !== row.bonusMax) {
        problems.push(`${gear} +${row.level} high-refine bonus: ours ${atkBonus[gear][row.level - 1]}, guide ${row.bonusMax}`);
      }
    }
  }

  console.log(`${compared} cells compared against roz-global.info (success chances, ATK/MATK and DEF per level)`);
  if (problems.length === 0) {
    console.log('every cell agrees');
    return;
  }
  for (const line of problems) console.log(`  ${line}`);
  process.exitCode = 1;
}

main();
