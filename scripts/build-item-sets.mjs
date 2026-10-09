// Builds data/item-sets.json: every equipment/card/stone set and its bonus
// (owner, 30 Sep 2026).
//
// Sources:
//   - rozerodb's Item Sets page (docs/rozerodb-export, 52 sets): pieces with
//     item ids, and the bonus in English.
//   - prontera's Item Sets page (read 30 Sep 2026) lists the same 52 plus two
//     Nordfeld helm + Gem Poring Card sets. Those two are added by hand, and
//     the Gem Poring Card's own item text states the bonus, so they are not
//     single-source.
//   - One set neither site lists, written by hand from the MDEF Stone
//     (Lower)'s item text.
// The Thai bonus lines below are written here from the English, one per set.
// A set whose Thai line is missing fails the build rather than shipping
// English.
//
// Piece names and categories come from our items table so they link; a
// piece id we do not hold fails the build too.
//
// Run: node scripts/build-item-sets.mjs

import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const root = process.cwd();
const env = Object.fromEntries(
  fs.readFileSync(path.join(root, '.env.local'), 'utf8').split(/\r?\n/).filter((l) => l.includes('=') && !l.startsWith('#'))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')]; }),
);
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const TH = {
  'Advanced Guild Set (Plate Armor)': 'ในเขตสงครามกิลด์: HP +2000 · รับดาเมจจากผู้เล่น −9%',
  'Advanced Guild Set (Robe)': 'ในเขตสงครามกิลด์: HP +1600 · รับดาเมจจากผู้เล่น −7%',
  'Advanced Guild Set (Suit)': 'ในเขตสงครามกิลด์: HP +1800 · รับดาเมจจากผู้เล่น −8%',
  'Ancient Mummy & Mummy Card': 'Perfect Hit +20',
  'Basic Guild Set (Plate Armor)': 'ในเขตสงครามกิลด์: HP +900 · รับดาเมจจากผู้เล่น −8%',
  'Basic Guild Set (Robe)': 'ในเขตสงครามกิลด์: HP +700 · รับดาเมจจากผู้เล่น −6%',
  'Basic Guild Set (Suit)': 'ในเขตสงครามกิลด์: HP +800 · รับดาเมจจากผู้เล่น −7%',
  'Cramp & Tarou Card': 'STR +3',
  'Critical Stones (Upper, Middle & Lower)': 'ดาเมจคริ +6%',
  'Critical Stones (Upper, Middle, Lower & Garment)': 'CRIT +10',
  'Dark Lord & Dark Illusion Card': 'MaxHP +20% · MaxSP +20%',
  'Dragon Fly & Chonchon Card': 'FLEE +18',
  'Eclipse & Lunatic Card': 'FLEE +18',
  'Erzsebet & Bathory Card': 'INT +1 ต่อขั้นตีบวก',
  'Expedition Set (Magic)': 'MATK +20 · ร่ายแปรผัน −5% · ร่ายคงที่ −5%',
  'Expedition Set (Physical)': 'ATK +20 · ร่ายคงที่ −5% · ดีเลย์หลังโจมตี −5%',
  'Extra Joker & Joker Card': 'ตีหรือร่ายเวทมีโอกาสแปลงร่างเป็น Joker 7 วินาที ระหว่างนั้น ATK +70 MATK +70 แต่เสีย HP 77 และ SP 7 ทุกวินาที',
  'Fei-chai & Morroc Card + Fei-chai Egg Lv.1': 'ดีเลย์หลังโจมตี −5%',
  'Fei-chai & Morroc Card + Fei-chai Egg Lv.2': 'ดีเลย์หลังโจมตี −10%',
  'Injustice & Zealotus Card': 'ATK +20 · LUK +3',
  'Jeniffer & Penomena Card': 'ASPD +1 ทุก 2 ขั้นตีบวก',
  'Mastering & Poring Card': 'FLEE +18',
  'Merman, Cruiser, Anolian, Alligator & Dragon Tail Card': 'DEX +3 · AGI +5 · ดาเมจระยะไกล +20% · Perfect Hit +20 · Bard: ตีกายภาพมีโอกาสทำให้มอนเผ่า Brute โคม่า · Sniper: EXP +5% จากมอนเผ่า Brute',
  'Orc Archer Bow & Steel Arrow': 'ดาเมจระยะไกล +50%',
  'Orc General & High Orc Card': 'ASPD +2 · ATK +25',
  'Owl Duke & Owl Baron Card': 'ตีกายภาพมีโอกาสร่าย Lightning Bolt Lv 5 เอง',
  'Picky Poring Card & Criatura Academy Hat': 'ATK +5 · MATK +5',
  'Pocket Watch Headgear & Alarm Card': 'MaxHP +1000',
  'Pocket Watch Headgear & Clock Card': 'MaxSP +100 · DEF +20',
  "Prisoner's Diary & Prisoner's Uniform": 'ตีปกติมีโอกาสเล็กน้อยได้ CRIT +30% นาน 6 วินาที',
  'Shibasays × Beach City Card + Fei-chai Egg Lv.1': 'Blitz Beat มีโอกาสต่ำได้ LUK +60 นาน 3 วินาที',
  'Shibasays × Beach City Card + Fei-chai Egg Lv.2': 'Blitz Beat มีโอกาสสูงได้ LUK +60 นาน 3 วินาที',
  'Shibasays × Beach City Card + Tai-zi Egg Lv.1': 'Blitz Beat มีโอกาสต่ำได้ LUK +60 นาน 3 วินาที',
  'Shibasays × Beach City Card + Tai-zi Egg Lv.2': 'Blitz Beat มีโอกาสสูงได้ LUK +60 นาน 3 วินาที',
  'Shibasays × Border City Card + Fei-chai Egg Lv.1': 'ตีกายภาพมีโอกาสต่ำได้ ATK +60 นาน 3 วินาที แต่เสีย HP 50 ต่อวินาที',
  'Shibasays × Border City Card + Fei-chai Egg Lv.2': 'ตีกายภาพมีโอกาสสูงได้ ATK +60 นาน 3 วินาที แต่เสีย HP 50 ต่อวินาที',
  'Shibasays × Border City Card + Tai-zi Egg Lv.1': 'ตีกายภาพมีโอกาสต่ำได้ ATK +60 นาน 3 วินาที แต่เสีย HP 50 ต่อวินาที',
  'Shibasays × Border City Card + Tai-zi Egg Lv.2': 'ตีกายภาพมีโอกาสสูงได้ ATK +60 นาน 3 วินาที แต่เสีย HP 50 ต่อวินาที',
  'Shibasays × Glast Heim Card + Fei-chai Egg Lv.1': 'ตีหรือร่ายเวทมีโอกาสต่ำได้ ATK +40 และ MATK +40 นาน 3 วินาที',
  'Shibasays × Glast Heim Card + Fei-chai Egg Lv.2': 'ตีหรือร่ายเวทมีโอกาสสูงได้ ATK +40 และ MATK +40 นาน 3 วินาที',
  'Shibasays × Glast Heim Card + Tai-zi Egg Lv.1': 'ตีหรือร่ายเวทมีโอกาสต่ำได้ ATK +40 และ MATK +40 นาน 3 วินาที',
  'Shibasays × Glast Heim Card + Tai-zi Egg Lv.2': 'ตีหรือร่ายเวทมีโอกาสสูงได้ ATK +40 และ MATK +40 นาน 3 วินาที',
  'Shibasays × Mountain City Card + Tai-zi Egg Lv.1': 'ดาเมจคริ +9%',
  'Shibasays × Mountain City Card + Tai-zi Egg Lv.2': 'ดาเมจคริ +18%',
  'Sieglouse & Arclouse Card': 'FLEE +2 ต่อขั้นตีบวก',
  'Skel Prisoner & Skeleton Card': 'โดนตีกายภาพแล้วมีโอกาสทำให้ศัตรูหลับสูงขึ้นมาก',
  "Subjugation Team's Set": 'ATK +15 · MATK +15 · ดีเลย์หลังโจมตี −3% · ร่ายแปรผัน −5%',
  "Tower Keeper's Income & Tower Keeper Card": 'ร่ายแปรผัน −15%',
  'Tower Keeper, Alarm, Clock & Punk Card': 'DEF +3 · MDEF +3',
  'Vagabond Wolf & Wolf Card': 'FLEE +18',
  'Variable Casting Stones (Upper, Middle & Lower)': 'ร่ายแปรผัน −6%',
  'Vocal & Rocker Card': 'FLEE +18',
};

// Not on rozerodb. Pieces by our item ids.
const EXTRA = [
  { name: 'Nordfeld Onyx Helm & Gem Poring Card', ids: [401509, 300938], bonus_th: 'ATK +1 และ MATK +1 ต่อขั้นตีบวกของหมวก', sources: ['prontera', 'item text'] },
  { name: 'Nordfeld Platinum Helm & Gem Poring Card', ids: [401510, 300938], bonus_th: 'ATK +1 และ MATK +1 ต่อขั้นตีบวกของหมวก', sources: ['prontera', 'item text'] },
  { name: 'DEF Stone (Middle) & MDEF Stone (Lower)', ids: [25001, 25014], bonus_th: 'HIT +5 · FLEE +5', sources: ['item text'] },
  // Read from the client's Thai item text, 7 Oct 2026, while checking
  // rozeroplanner's set list (its numbers are not used: it gives Toad + Roda
  // Frog MaxHP +300 where the card says FLEE +18).
  { name: 'Pantie & Undershirt', ids: [2339, 2522], bonus_th: 'AGI +5 · FLEE +10', sources: ['item text'] },
  { name: 'Gentleman Staff & Magician Hat', ids: [1629, 5045], bonus_th: 'DEX +2 · INT +2 · ฟื้น SP เร็วขึ้น 5%', sources: ['item text'] },
  { name: 'Toad & Roda Frog Card', ids: [4306, 4014], bonus_th: 'FLEE +18', sources: ['item text'] },
  // The Water +30% in Crab Card's text is this set's, not the card's: one
  // Crab Card alone gives ATK +5 in game (owner, 8 Oct 2026), and
  // ratemyserver's combo 162 scripts bAddEle,Ele_Water,30 on the three (9 Oct).
  { name: 'Crab, Aster & Shell Fish Card', ids: [4153, 4247, 4273], bonus_th: 'ดาเมจกายภาพต่อมอนธาตุน้ำ +30% · ฆ่ามอนเผ่าปลามีโอกาส 30% ได้ Raw Fish', sources: ['item text', 'ratemyserver'] },
  { name: 'Change STR (Middle) & (Lower)', ids: [25003, 25012], bonus_th: 'INT +3 · DEX +3', sources: ['item text'] },
  { name: 'Change INT (Middle) & (Lower)', ids: [25005, 25013], bonus_th: 'DEX +3 · VIT +3', sources: ['item text'] },
  { name: 'Change DEX (Middle) & (Lower)', ids: [25007, 25010], bonus_th: 'VIT +3 · AGI +3', sources: ['item text'] },
  { name: 'Change VIT (Middle) & (Lower)', ids: [25006, 25008], bonus_th: 'AGI +3 · LUK +3', sources: ['item text'] },
  { name: 'Change AGI (Middle) & (Lower)', ids: [25004, 25009], bonus_th: 'LUK +3 · STR +3', sources: ['item text'] },
  { name: 'Change LUK (Middle) & (Lower)', ids: [25002, 25011], bonus_th: 'STR +3 · INT +3', sources: ['item text'] },
  { name: 'STR +3 INT -3 & STR +3 DEX -3', ids: [29014, 29015], bonus_th: 'DEX +3 · INT +3', sources: ['item text'] },
  { name: 'INT +3 DEX -3 & INT +3 VIT -3', ids: [29016, 29017], bonus_th: 'DEX +3 · VIT +3', sources: ['item text'] },
  { name: 'DEX +3 VIT -3 & DEX +3 AGI -3', ids: [29018, 29019], bonus_th: 'VIT +3 · AGI +3', sources: ['item text'] },
  { name: 'VIT +3 AGI -3 & VIT +3 LUK -3', ids: [29020, 29021], bonus_th: 'AGI +3 · LUK +3', sources: ['item text'] },
  { name: 'AGI +3 LUK -3 & AGI +3 STR -3', ids: [29022, 29023], bonus_th: 'LUK +3 · STR +3', sources: ['item text'] },
  { name: 'LUK +3 STR -3 & LUK +3 INT -3', ids: [29024, 29025], bonus_th: 'STR +3 · INT +3', sources: ['item text'] },
  { name: 'MDEF +4 & DEF +20', ids: [29033, 29026], bonus_th: 'HIT +5 · FLEE +5', sources: ['item text'] },
  { name: 'Variable Cast Reduction (Upper, Middle & Lower)', ids: [29156, 29157, 29158], bonus_th: 'ลดร่ายแปรผันเพิ่มอีก 6%', sources: ['item text'] },
  { name: 'Prison Uniform & Shackles', ids: [15040, 2408], bonus_th: 'ATK +5 และ ATK เพิ่มตามขั้นตีบวกของ Shackles', sources: ['item text'] },
];

function parseRozerodb() {
  const line = fs.readFileSync(path.join(root, 'docs/rozerodb-export/data/guides.jsonl'), 'utf8').split('\n').find((l) => l.includes('"slug":"item-sets"'));
  const text = JSON.parse(line).text;
  const body = text.slice(text.indexOf('Reset Item Set ') + 'Reset '.length, text.indexOf(' RO ZERO DATABASE ·'));
  return body.split(/(?:^| )Item Set /).filter(Boolean).map((chunk) => {
    const [head, bonus] = chunk.split(' Set Bonus ');
    const ids = [...head.matchAll(/# (\d+)/g)].map((m) => Number(m[1]));
    // The set's name is everything before the first piece, and the first piece
    // starts right after it; rozerodb gives no separator, so take the name
    // from TH's keys.
    const name = Object.keys(TH).find((k) => head.startsWith(k + ' '));
    if (!name) throw new Error(`no Thai line for set: ${head.slice(0, 80)}`);
    return { name, ids, bonus_en: bonus.trim(), bonus_th: TH[name], sources: ['rozerodb', 'prontera'] };
  });
}

function kindOf(pieces) {
  if (pieces.every((p) => /Stone \(|^Change |Cast Reduction|^(STR|AGI|VIT|INT|DEX|LUK|DEF|MDEF) \+\d/.test(p.name))) return 'stone';
  if (pieces.some((p) => /Egg Lv/.test(p.name))) return 'pet';
  if (pieces.every((p) => p.category === 'Card')) return 'card';
  return 'gear';
}

const sets = [...parseRozerodb(), ...EXTRA];
const allIds = [...new Set(sets.flatMap((s) => s.ids))];
const { data, error } = await db.from('items').select('id, name_en, category, icon_url').in('id', allIds);
if (error) throw error;
const byId = new Map(data.map((r) => [r.id, r]));
const missing = allIds.filter((id) => !byId.has(id));
if (missing.length) throw new Error(`piece ids not in items: ${missing.join(', ')}`);

const out = sets.map((s) => {
  const pieces = s.ids.map((id) => ({ id, name: byId.get(id).name_en, category: byId.get(id).category, icon: byId.get(id).icon_url ?? `/images/items/${id}.gif` }));
  return { name: s.name, kind: kindOf(pieces), pieces, bonus: s.bonus_th, sources: s.sources };
}).sort((a, b) => a.name.localeCompare(b.name));

fs.writeFileSync(
  path.join(root, 'data/item-sets.json'),
  JSON.stringify({
    _meta: {
      what: 'Item sets: wear every piece to get the bonus. Thai bonus lines written in scripts/build-item-sets.mjs.',
      sources: 'rozerodb Item Sets (docs/rozerodb-export) + prontera Item Sets (read 2026-09-30) + item text for the Gem Poring Card and MDEF Stone (Lower)',
      regenerate: 'node scripts/build-item-sets.mjs',
    },
    sets: out,
  }, null, 2) + '\n',
);
const kinds = out.reduce((m, s) => ({ ...m, [s.kind]: (m[s.kind] ?? 0) + 1 }), {});
console.log(`${out.length} sets`, kinds);
