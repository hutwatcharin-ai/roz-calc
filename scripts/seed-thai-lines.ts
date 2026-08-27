// Seeds the whole-line dictionary: effect and flavour sentences translated as
// one unit, because their meaning does not decompose into reusable terms.
//
// The term dictionary (`seed-thai-terms.ts`) handles anything shaped
// `Name : Value` or `Stat +N`, where the value passes through untouched. What
// is left is prose, and prose has to be translated sentence by sentence.
//
// Keys are the source line EXACTLY as the game writes it, including curly
// quotes and em dashes. A key that matches nothing is reported at the end
// rather than silently doing nothing -- a mistyped dash is invisible otherwise.
//
// Run it with:  npx tsx scripts/seed-thai-lines.ts
// It reads and writes the live database, so NEXT_PUBLIC_SUPABASE_URL and
// SUPABASE_SERVICE_ROLE_KEY must already be in the environment -- nothing here
// loads `.env.local`. In bash:  set -a && . ./.env.local && set +a

import { supabaseAdmin } from '../lib/supabase';
import { fetchAllRows } from '../lib/fetch-all-rows';
import { classifyLine } from '../lib/item-description-th';

type Kind = 'effect' | 'flavour';

// Lines that change what a player does: costs, restrictions, procs.
const EFFECT_TH: Record<string, string> = {
  // Approved in the spec's reference table (section 7). Copied verbatim -- these
  // are the standard the rest of the translation is measured against.
  'Can be sold to the Collector.': 'ขายให้ Collector ได้',
  'Unbreakable.': 'ไม่แตก',
  'Cannot be Refined.': 'ตีบวกไม่ได้',
  'Used for Hair Styling.': 'ใช้เปลี่ยนทรงผม',

  // "Never breaks." is a second English wording of "Unbreakable." The Thai is
  // the same on purpose: one mechanic, one rendering.
  'Never breaks.': 'ไม่แตก',

  'Can be sold to the Collector for a good price.': 'ขายให้ Collector ได้ราคาดี',
  'Event monsters and slave monsters cannot be tamed.':
    'มอนสเตอร์อีเวนต์และมอนสเตอร์ลูกสมุนจับเป็นสัตว์เลี้ยงไม่ได้',
  'Casting cannot be interrupted.': 'ร่ายเวทแล้วไม่ถูกขัดจังหวะ',
  'Chance to inflict Stun when receiving physical damage.':
    'มีโอกาสทำให้ติด Stun เมื่อได้รับความเสียหายกายภาพ',
  'Consumes 1 SP per attack.': 'ใช้ SP 1 หน่วยต่อการโจมตี',
  'Loses 5 SP when unequipped.': 'เสีย SP 5 เมื่อถอดออก',
  'Losing the equipment subtracts 5 SP.': 'เมื่อถอดอุปกรณ์ออก จะเสีย SP 5',
  'SP -5 when unequipped.': 'SP -5 เมื่อถอดออก',
  'INT +1, Unbreakable.': 'INT +1 ไม่แตก',
  'INT +3, Unbreakable.': 'INT +3 ไม่แตก',
  'STR +10, Unbreakable.': 'STR +10 ไม่แตก',
  '(*Note* No effect in WoE, PvP, or non-town fields.)':
    '(*หมายเหตุ* ไม่มีผลใน WoE, PvP และสนามนอกเมือง)',
  'Usable only in WoE areas, PvP areas, and towns.':
    'ใช้ได้เฉพาะในพื้นที่ WoE, PvP และในเมือง',
};

// Lines that describe the item without changing a decision. Wrong flavour text
// costs a reader nothing but atmosphere, which is why the spec translates it
// last -- but these particular ones repeat, so they are cheap coverage.
const FLAVOUR_TH: Record<string, string> = {
  // Approved in the spec's reference table (section 7), verbatim.
  'Spear made for hunting fish, distinguished by its three-pronged head.':
    'หอกล่าปลา จุดเด่นคือหัวสามง่าม',
  'Ore infused with magical power. When magic is cast, it shatters by taking the spell’s backlash in the caster’s place.':
    'แร่ที่อัดแน่นด้วยพลังเวท เมื่อมีการร่ายเวท มันจะแตกสลายเพื่อรับแรงสะท้อนแทนผู้ร่าย',
  'As its name suggests, crescent scythe with a sinister curved blade like a half moon. One hit makes it hard to avoid Critical Wounds.':
    'เคียวจันทร์เสี้ยวสมชื่อ ใบมีดโค้งน่าสะพรึงดั่งจันทร์ครึ่งดวง โดนทีเดียวก็ยากจะเลี่ยงบาดแผลฉกรรจ์',

  'A fragment of the Sacred Relic—Sigrun\'s Wings of Eternity.':
    'ชิ้นส่วนของวัตถุศักดิ์สิทธิ์ Sigrun\'s Wings of Eternity',
  // Curly quotes in the source become plain ones in the translation, per the
  // spec's punctuation rule.
  'Crafted by the Dwarven artisan ‘Brukk’.': 'รังสรรค์โดยช่างฝีมือ Dwarf นาม \'Brukk\'',
  'Fragment discovered in Poring Village.': 'ชิ้นส่วนที่ค้นพบใน Poring Village',
  'A small crystallization created by some monsters.':
    'ผลึกเล็ก ๆ ที่มอนสเตอร์บางชนิดสร้างขึ้น',
  'Gemstone that shines with a transparent, shimmering light.':
    'อัญมณีที่เปล่งประกายใสระยิบระยับ',
  'A colorful, jagged hat reminiscent of what a jester might wear.':
    'หมวกหลากสีขอบหยัก ชวนให้นึกถึงหมวกตัวตลกในราชสำนัก',
  'A famed sword said to be able to cut even flowing water. Legend says its edge is so keen that slicing the air draws out water.':
    'ดาบเลื่องชื่อที่ว่ากันว่าตัดได้แม้สายน้ำที่กำลังไหล ตำนานว่าคมกริบถึงขั้นฟันอากาศแล้วมีน้ำไหลออกมา',
  'A helmet shaped like the horns of a mountain goat. The moment it is worn, the user becomes the center of attention and feels a sense of pride. Holds strong religious symbolism.':
    'หมวกเกราะทรงเขาแพะภูเขา ทันทีที่สวมใส่ ผู้สวมจะกลายเป็นจุดสนใจและรู้สึกภาคภูมิ แฝงความหมายทางศาสนาอย่างแรงกล้า',
  'A mask equipped with a filter that removes harmful air, allowing you to breathe fresh air at all times—though it can feel a bit stifling.':
    'หน้ากากที่ติดตัวกรองอากาศพิษ ใช้หายใจเอาอากาศบริสุทธิ์ได้ตลอดเวลา แม้จะอึดอัดอยู่บ้าง',
  'A metal that can be used to strengthen and upgrade weapons.':
    'โลหะที่ใช้เสริมความแข็งแกร่งและยกระดับอาวุธได้',
  'A small flower petal held gently in the mouth. Sit quietly with it, and the world may look a little brighter.':
    'กลีบดอกไม้เล็ก ๆ ที่คาบไว้เบา ๆ ในปาก นั่งนิ่ง ๆ กับมัน แล้วโลกอาจดูสดใสขึ้นอีกนิด',
  'Armor constructed by fastening together metal plates.':
    'Armor ที่ประกอบขึ้นจากแผ่นโลหะยึดต่อกัน',
  'Axe designed so that anyone can use it easily.': 'ขวานที่ออกแบบมาให้ใครก็ใช้ได้ง่าย',
  'Axe used by the orc tribe.': 'ขวานที่เผ่า Orc ใช้',
  'Claws said to leave a devastating wound, as if bitten by a tiger, with a single strike.':
    'กรงเล็บที่ว่ากันว่าฟันครั้งเดียวก็ทิ้งบาดแผลสาหัสราวกับถูกเสือกัด',
  'Clothing made of pure cotton, providing a fresh, pleasant feeling when worn.':
    'เสื้อผ้าจากฝ้ายแท้ สวมใส่แล้วรู้สึกสดชื่นสบายตัว',
  'Coiled form makes it look ready to strike at any moment.':
    'ลำตัวที่ขดอยู่ทำให้ดูเหมือนพร้อมพุ่งเข้าใส่ได้ทุกเมื่อ',
  'Hat filled with the serpent’s power among the twelve zodiac animals.':
    'หมวกที่อัดแน่นด้วยพลังของงู หนึ่งในสิบสองนักษัตร',
  'Hat once worn by Bongun, featuring a half-torn talisman on the front. Surprisingly sturdy, and the torn charm even helps keep it out of the wearer’s line of sight.':
    'หมวกที่ Bongun เคยสวมใส่ ด้านหน้ามียันต์ขาดครึ่ง ทนทานเกินคาด และยันต์ที่ขาดยังช่วยไม่ให้บังสายตาผู้สวมด้วย',
  'Hat roughly woven from reeds or bamboo, traditionally worn to shield from sun and rain.':
    'หมวกสานหยาบจากต้นกกหรือไม้ไผ่ แต่โบราณสวมใส่กันแดดกันฝน',
  'Hat worn by monster Munak. Large brim decorated with mysterious talismans and what seems to be Braided Hair.':
    'หมวกที่มอนสเตอร์ Munak สวมใส่ ปีกกว้างประดับยันต์ลึกลับและสิ่งที่ดูเหมือน Braided Hair',
  'Mace with multiple heads, making it feel like being struck by several maces at once.':
    'กระบองหลายหัว ตีทีเดียวเหมือนโดนกระบองหลายอันพร้อมกัน',
  'Mask with eyes and mouth shaped the same, giving a perfectly blank, detached expression. Suits those moments when you are forced to listen to a painfully unfunny joke.':
    'หน้ากากที่ตากับปากเป็นรูปเดียวกัน ให้สีหน้าว่างเปล่าไร้อารมณ์อย่างสมบูรณ์ เหมาะกับตอนที่ต้องทนฟังมุกที่ไม่ตลกเอาเสียเลย',
  'Simple design offering excellent practicality and mobility.':
    'ดีไซน์เรียบง่าย ใช้งานจริงได้ดีและเคลื่อนไหวคล่องตัว',
  'Staff said to possess innate magical power.': 'คทาที่ว่ากันว่ามีพลังเวทในตัวเอง',
  'Stories tell of a traveler from the East who wore such a hat while composing poetry across the land.':
    'เล่าขานกันว่ามีนักเดินทางจากตะวันออกสวมหมวกแบบนี้ แต่งบทกวีไปทั่วแผ่นดิน',
  'Sunglasses with a unique shape that draws everyone’s attention.':
    'แว่นกันแดดทรงแปลกตาที่ดึงสายตาทุกคน',
  'Used to tie and hold hair in place, with a small ribbon on top to add extra cuteness.':
    'ใช้มัดและรวบผมให้อยู่ทรง ด้านบนมีโบว์เล็ก ๆ เพิ่มความน่ารัก',
  // "Earth" here is the planet, not the element. The glossary checker cannot
  // tell them apart, so this line carries an acknowledged exemption listed in
  // ACKNOWLEDGED_EXEMPTIONS in scripts/check-thai-glossary.ts.
  'Some say the design is inspired by the eyes of intelligent beings living beyond Earth.':
    'บางคนว่าดีไซน์นี้ได้แรงบันดาลใจจากดวงตาของสิ่งมีชีวิตทรงปัญญาที่อยู่นอกโลก',
};

// Deliberately left English, with the reason. A row that cannot pass the gate
// is worse than no row: it makes the gate the thing people learn to ignore.
export const DEFERRED: Record<string, string> = {
  'LUK +2, MDEF +5.':
    'every token is a stat abbreviation, so any faithful translation contains no Thai at all',
};

async function main(): Promise<void> {
  const db = supabaseAdmin();

  const { data: itemRows, error: itemsError } = await fetchAllRows<{ description: string | null }>(
    (from, to) => db.from('items').select('description').order('id').range(from, to),
  );
  if (itemsError) throw new Error(`Failed to read items: ${itemsError.message}`);

  // Count how often each prose line actually occurs, so a key that matches
  // nothing is reported instead of quietly seeding a row nobody reaches.
  const occurrences = new Map<string, number>();
  for (const row of itemRows ?? []) {
    for (const raw of (row.description ?? '').split('\n')) {
      const classified = classifyLine(raw);
      if (!classified) continue;
      occurrences.set(classified.source, (occurrences.get(classified.source) ?? 0) + 1);
    }
  }

  const rows: { source_line: string; thai_line: string; kind: Kind }[] = [];
  const orphans: string[] = [];
  let covered = 0;

  function add(map: Record<string, string>, kind: Kind) {
    for (const [source, thai] of Object.entries(map)) {
      const n = occurrences.get(source) ?? 0;
      if (n === 0) {
        orphans.push(`${kind}: ${source}`);
        continue;
      }
      covered += n;
      rows.push({ source_line: source, thai_line: thai, kind });
    }
  }

  add(EFFECT_TH, 'effect');
  add(FLAVOUR_TH, 'flavour');

  const { error } = await db
    .from('item_description_lines')
    .upsert(rows, { onConflict: 'source_line' });
  if (error) throw new Error(`Failed to seed item_description_lines: ${error.message}`);

  console.log(`seeded ${rows.length} lines, covering ${covered} occurrences`);
  console.log(`  ${Object.keys(EFFECT_TH).length} effect, ${Object.keys(FLAVOUR_TH).length} flavour`);
  console.log(`deliberately deferred: ${Object.keys(DEFERRED).length}`);
  for (const [line, why] of Object.entries(DEFERRED)) console.log(`  ${line}\n    ${why}`);

  if (orphans.length > 0) {
    console.log(`\nKEYS THAT MATCH NO LINE IN THE DATA: ${orphans.length}`);
    for (const o of orphans) console.log(`  ${o}`);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
