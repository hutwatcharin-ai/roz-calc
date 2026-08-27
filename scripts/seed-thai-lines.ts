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

// Classes of line deliberately left English, with the reason. A row that cannot
// pass the glossary gate is worse than no row: it makes the gate the thing
// people learn to ignore.
export const DEFERRED_RULES: ReadonlyArray<{ rule: string; why: string }> = [
  {
    rule: 'a line made only of stat abbreviations, numbers and punctuation',
    why:
      'every token already stays English by the glossary, so a faithful ' +
      'translation contains no Thai at all -- `AGI +1, FLEE +10.`, ' +
      '`DEF +5, MDEF +5.`, `LUK +2, MDEF +5.` and about thirty more',
  },
  {
    rule: 'a costume tag: `[Costume] <item name>`',
    why: 'the tag and the item name are both proper nouns the game prints in English',
  },
];

// Batch 3: effect lines that occur once. Fewer readers per line than batch 2,
// but these are the lines that change what a player equips, so they come
// before flavour text.
const EFFECT_TH_2: Record<string, string> = {
  '(However, the Critical Rate increase applies only up to refine level +10.)':
    '(แต่การเพิ่มอัตรา Critical มีผลถึงระดับตีบวก +10 เท่านั้น)',

  // `[Skill] can be used.` The game is not consistent about writing the level
  // as `Lv.3` or `3Lv`; the Thai keeps whichever form the source used.
  '[Bash] skill Lv.5 can be used.': 'ใช้สกิล [Bash] Lv.5 ได้',
  '[Cloaking] 1Lv can be used.': 'ใช้ [Cloaking] 1Lv ได้',
  '[Cold Bolt] Lv.3 can be used.': 'ใช้ [Cold Bolt] Lv.3 ได้',
  '[Cure] Lv.1 can be used.': 'ใช้ [Cure] Lv.1 ได้',
  '[Detoxify] 1Lv can be used.': 'ใช้ [Detoxify] 1Lv ได้',
  '[Discount] Lv.5 can be used.': 'ใช้ [Discount] Lv.5 ได้',
  '[Double Attack] Lv.1 can be used.': 'ใช้ [Double Attack] Lv.1 ได้',
  '[Envenom] 3Lv can be used.': 'ใช้ [Envenom] 3Lv ได้',
  '[Fire Bolt] Lv.3 can be used.': 'ใช้ [Fire Bolt] Lv.3 ได้',
  '[Heal]  Lv.1 can be used.': 'ใช้ [Heal] Lv.1 ได้',
  '[Hiding] 1Lv can be used.': 'ใช้ [Hiding] 1Lv ได้',
  '[Magnum Break] 3Lv can be used.': 'ใช้ [Magnum Break] 3Lv ได้',
  '[Sight] Lv.1 can be used.': 'ใช้ [Sight] Lv.1 ได้',
  '[Steal] Lv.1 can be used.': 'ใช้ [Steal] Lv.1 ได้',
  '[Teleport] 1Lv can be used.': 'ใช้ [Teleport] 1Lv ได้',
  'Able to use Cure Lv 1.': 'ใช้ Cure Lv 1 ได้',
  'Able to use Heal Lv 1.': 'ใช้ Heal Lv 1 ได้',
  'at Lv.3.': 'ที่ Lv.3',

  // `[Skill] damage +N%.`
  '[Arrow Vulcan] and [Musical Strike] damage +10%.':
    'ความเสียหาย [Arrow Vulcan] และ [Musical Strike] +10%',
  '[Fire Bolt], [Cold Bolt], and [Lightning Bolt] damage +10%.':
    'ความเสียหาย [Fire Bolt], [Cold Bolt] และ [Lightning Bolt] +10%',
  '[Fire Wall] damage +5%.': 'ความเสียหาย [Fire Wall] +5%',
  '[Frost Diver] damage +5%.': 'ความเสียหาย [Frost Diver] +5%',
  '[Mammonite] damage +20%.': 'ความเสียหาย [Mammonite] +20%',
  '[Shield Charge] and [Shield Boomerang] damage +10%.':
    'ความเสียหาย [Shield Charge] และ [Shield Boomerang] +10%',
  '[Throw Huuma Shuriken] damage +30%.': 'ความเสียหาย [Throw Huuma Shuriken] +30%',
  'Damage of Storm Gust, Frost Nova, and Frost Driver +10%.':
    'ความเสียหายของ Storm Gust, Frost Nova และ Frost Driver +10%',

  // Chance-to-inflict and chance-to-proc
  '0.5% chance to be inflicted with Blind yourself when attacking.':
    'มีโอกาส 0.5% ที่ตัวเองจะติด Blind เมื่อโจมตี',
  '5% chance to inflict Blind on the enemy when attacking.':
    'มีโอกาส 5% ทำให้ศัตรูติด Blind เมื่อโจมตี',
  '5% chance to inflict Stun when attacking.': 'มีโอกาส 5% ทำให้ติด Stun เมื่อโจมตี',
  'Chance to inflict Curse on the attacker when receiving physical damage.':
    'มีโอกาสทำให้ผู้โจมตีติด Curse เมื่อได้รับความเสียหายกายภาพ',
  'Chance to inflict Frozen when receiving physical damage.':
    'มีโอกาสทำให้ติด Frozen เมื่อได้รับความเสียหายกายภาพ',
  'Chance to inflict Petrify on the attacker when taking physical damage.':
    'มีโอกาสทำให้ผู้โจมตีติด Petrify เมื่อได้รับความเสียหายกายภาพ',
  'Chance to inflict Silence when receiving physical damage.':
    'มีโอกาสทำให้ติด Silence เมื่อได้รับความเสียหายกายภาพ',
  'Chance to inflict Sleep when receiving physical damage.':
    'มีโอกาสทำให้ติด Sleep เมื่อได้รับความเสียหายกายภาพ',
  'Casts Frost Driver Lv 3 with a chance when performing physical attacks.':
    'มีโอกาสร่าย Frost Driver Lv 3 เมื่อโจมตีกายภาพ',
  'Casts Quagmire Lv.1 when taking physical damage.':
    'ร่าย Quagmire Lv.1 เมื่อได้รับความเสียหายกายภาพ',
  'Chance to auto-cast [Meteor Storm] Lv.5 when receiving physical damage.':
    'มีโอกาสร่าย [Meteor Storm] Lv.5 อัตโนมัติ เมื่อได้รับความเสียหายกายภาพ',
  'Chance to autocast Bash Lv.1 when dealing physical damage.':
    'มีโอกาสร่าย Bash Lv.1 อัตโนมัติ เมื่อสร้างความเสียหายกายภาพ',
  'Chance to autocast Fire Ball Lv.3 when dealing physical damage.':
    'มีโอกาสร่าย Fire Ball Lv.3 อัตโนมัติ เมื่อสร้างความเสียหายกายภาพ',
  'Chance to autocast Impositio Manus Lv.3 on self when dealing physical damage.':
    'มีโอกาสร่าย Impositio Manus Lv.3 ใส่ตัวเองอัตโนมัติ เมื่อสร้างความเสียหายกายภาพ',
  'Chance to autocast Improve Concentration Lv.1 when receiving physical damage.':
    'มีโอกาสร่าย Improve Concentration Lv.1 อัตโนมัติ เมื่อได้รับความเสียหายกายภาพ',
  'Chance to autocast Lex Aeterna Lv.1 on the target when dealing physical damage.':
    'มีโอกาสร่าย Lex Aeterna Lv.1 ใส่เป้าหมายอัตโนมัติ เมื่อสร้างความเสียหายกายภาพ',
  'Chance to autocast Sight Lv.1 when receiving physical attacks.':
    'มีโอกาสร่าย Sight Lv.1 อัตโนมัติ เมื่อได้รับการโจมตีกายภาพ',
  'Chance to autocast Signum Crucis Lv.5 when receiving physical damage.':
    'มีโอกาสร่าย Signum Crucis Lv.5 อัตโนมัติ เมื่อได้รับความเสียหายกายภาพ',
  'Chance to autocast Snatch Lv.1 when dealing physical damage.':
    'มีโอกาสร่าย Snatch Lv.1 อัตโนมัติ เมื่อสร้างความเสียหายกายภาพ',

  // Chance-to-obtain on kill. `defeating` is locked to สังหาร.
  'Chance to obtain Gasping Box when defeating Demi-Human Monsters.':
    'มีโอกาสได้รับ Gasping Box เมื่อสังหารมอนสเตอร์ Demi-Human',
  'Chance to obtain gemstones when defeating monsters.':
    'มีโอกาสได้รับ gemstone เมื่อสังหารมอนสเตอร์',
  'Chance to obtain Gift Box when defeating monsters.':
    'มีโอกาสได้รับ Gift Box เมื่อสังหารมอนสเตอร์',
  'Chance to obtain Giggling Box when defeating Undead Monsters.':
    'มีโอกาสได้รับ Giggling Box เมื่อสังหารมอนสเตอร์ Undead',
  'Chance to obtain Green Live when defeating Plant Monsters.':
    'มีโอกาสได้รับ Green Live เมื่อสังหารมอนสเตอร์ Plant',
  'Chance to obtain Jellopy or Large Jellopy when defeating monsters.':
    'มีโอกาสได้รับ Jellopy หรือ Large Jellopy เมื่อสังหารมอนสเตอร์',
  'Chance to obtain Old Blue Box when defeating monsters.':
    'มีโอกาสได้รับ Old Blue Box เมื่อสังหารมอนสเตอร์',
  'Chance to obtain Red Blood when defeating Brute Monsters.':
    'มีโอกาสได้รับ Red Blood เมื่อสังหารมอนสเตอร์ Brute',
  'Chance to obtain Vengeful Box when defeating Demon Monsters.':
    'มีโอกาสได้รับ Vengeful Box เมื่อสังหารมอนสเตอร์ Demon',
  'Drops Fruit Mix with a chance when defeating Formless Monsters.':
    'มีโอกาสดรอป Fruit Mix เมื่อสังหารมอนสเตอร์ Formless',
  'Drops sushi or sashimi with a chance when defeating Fish Monsters.':
    'มีโอกาสดรอปซูชิหรือซาชิมิ เมื่อสังหารมอนสเตอร์ Fish',
  '50% chance to drop Meat when a Brute monster dies.':
    'มีโอกาส 50% ดรอป Meat เมื่อมอนสเตอร์ Brute ตาย',

  // Extra damage against a group
  '10% extra damage to Boss monsters.': 'ความเสียหายต่อมอนสเตอร์ Boss เพิ่ม 10%',
  '3% extra damage to Demi-Human monsters.': 'ความเสียหายต่อมอนสเตอร์ Demi-Human เพิ่ม 3%',
  'Additional 20% damage to Human-type enemies.': 'ความเสียหายต่อศัตรูประเภทมนุษย์ เพิ่ม 20%',
  'Additional 7% damage to Earth, Water, Fire, and Wind-property Monsters.':
    'ความเสียหายต่อมอนสเตอร์ธาตุ Earth, Water, Fire และ Wind เพิ่ม 7%',
  'Deals additional 5% damage to Holy-property Monsters.':
    'สร้างความเสียหายต่อมอนสเตอร์ธาตุ Holy เพิ่ม 5%',
  'CRIT +7 when attacking Formless Monsters.': 'CRIT +7 เมื่อโจมตีมอนสเตอร์ Formless',
  'CRIT +7 when attacking Undead Monsters.': 'CRIT +7 เมื่อโจมตีมอนสเตอร์ Undead',
  'CRIT +20, additional CRIT based on pure LUK.':
    'CRIT +20 และได้ CRIT เพิ่มตามค่า LUK ล้วน',
  'Critical Damage +10%. When attacking Brute Monsters, CRIT +7.':
    'Critical Damage +10% เมื่อโจมตีมอนสเตอร์ Brute ได้ CRIT +7',
  'Critical +3. ASPD increased (after-attack delay -3%).':
    'Critical +3 ASPD เพิ่มขึ้น (ดีเลย์หลังโจมตี -3%)',
  'ASPD increased (after-attack delay -5%).': 'ASPD เพิ่มขึ้น (ดีเลย์หลังโจมตี -5%)',
  'ASPD increases (After Attack Delay -15%).': 'ASPD เพิ่มขึ้น (ดีเลย์หลังโจมตี -15%)',
  'Every 2 refine levels increase ASPD (After Attack Delay -1%).':
    'ทุก 2 ระดับตีบวก เพิ่ม ASPD (ดีเลย์หลังโจมตี -1%)',

  // Refine thresholds. `refine` is locked to ตีบวก.
  'At +7 refine, additional +5% damage to Meteor Storm and Fire Pillar.':
    'ตีบวก +7: ความเสียหาย Meteor Storm และ Fire Pillar เพิ่มอีก +5%',
  'At +9 refine, additional +5% damage to Meteor Storm and Fire Pillar.':
    'ตีบวก +9: ความเสียหาย Meteor Storm และ Fire Pillar เพิ่มอีก +5%',
  'At +7 refine, additional +5% damage to Storm Gust, Frost Nova, and Frost Driver.':
    'ตีบวก +7: ความเสียหาย Storm Gust, Frost Nova และ Frost Driver เพิ่มอีก +5%',
  'At +9 refine, additional +5% damage to Storm Gust, Frost Nova, and Frost Driver.':
    'ตีบวก +9: ความเสียหาย Storm Gust, Frost Nova และ Frost Driver เพิ่มอีก +5%',
  'At +7 refine, Heal effect +12%.': 'ตีบวก +7: ผลของ Heal +12%',
  'At +7 refine, Raging Quadruple Blow damage +15%.':
    'ตีบวก +7: ความเสียหาย Raging Quadruple Blow +15%',
  'At +7 refine: additional MATK +2.': 'ตีบวก +7: MATK +2 เพิ่มเติม',
  'At +7 refine: Additional MHP +20 per level of Faith.':
    'ตีบวก +7: MHP +20 เพิ่มเติม ต่อทุกเลเวลของ Faith',
  'At +9 refine: Additional MHP +30 per level of Faith.':
    'ตีบวก +9: MHP +30 เพิ่มเติม ต่อทุกเลเวลของ Faith',
  'At +7 refine: additionally increases damage of Holy Cross and Pierce by 5%.':
    'ตีบวก +7: เพิ่มความเสียหายของ Holy Cross และ Pierce อีก 5%',
  'At +9 refine: additionally increases damage of Holy Cross and Pierce by 10%.':
    'ตีบวก +9: เพิ่มความเสียหายของ Holy Cross และ Pierce อีก 10%',
  'At +7 refine: increases Critical Damage by 15%.':
    'ตีบวก +7: เพิ่ม Critical Damage 15%',
  'At +7, increases Critical Damage by 10%.': 'ตีบวก +7: เพิ่ม Critical Damage 10%',
  'At +9, increases Critical Damage by an additional 10%.':
    'ตีบวก +9: เพิ่ม Critical Damage อีก 10%',
  'At +9 refine: additionally increases Critical Damage by 15%, ASPD +1.':
    'ตีบวก +9: เพิ่ม Critical Damage อีก 15% และ ASPD +1',
  'At +7 refine: MHP +75, MSP +25.': 'ตีบวก +7: MHP +75, MSP +25',
  'At +9 refine: MHP +75, MSP +25.': 'ตีบวก +9: MHP +75, MSP +25',
  'At +7 refine: Physical Damage to Undead Monsters +5%.':
    'ตีบวก +7: Physical Damage ต่อมอนสเตอร์ Undead +5%',
  'At +9 refine: ASPD +1, Physical Damage to Undead Monsters +10%.':
    'ตีบวก +9: ASPD +1 และ Physical Damage ต่อมอนสเตอร์ Undead +10%',
  'At +9 refine, Magnus Exorcismus damage +20%.':
    'ตีบวก +9: ความเสียหาย Magnus Exorcismus +20%',
  'At +9 refine, Raging Thrust damage +15%.':
    'ตีบวก +9: ความเสียหาย Raging Thrust +15%',
  'At +9 refine: additional Variable Casting Time -1%, Fire Magical Damage +1%.':
    'ตีบวก +9: Variable Casting Time -1% และความเสียหายเวทธาตุ Fire +1% เพิ่มเติม',
  'DEF +2 and MDEF +3 when refine level is 5 or lower.':
    'DEF +2 และ MDEF +3 เมื่อระดับตีบวก 5 หรือต่ำกว่า',

  // Refine tools
  'Can refine armor.': 'ใช้ตีบวก Armor ได้',
  'Can refine Lv.1 weapons.': 'ใช้ตีบวกอาวุธ Lv.1 ได้',
  'Can refine Lv.2 weapons.': 'ใช้ตีบวกอาวุธ Lv.2 ได้',
  'Can refine Lv.3 and Lv.4 weapons.': 'ใช้ตีบวกอาวุธ Lv.3 และ Lv.4 ได้',

  // Costs and penalties
  'Consumes 1 SP per hit.': 'ใช้ SP 1 หน่วยต่อการโจมตีที่เข้าเป้า',
  'Consumes 2 SP per attack.': 'ใช้ SP 2 หน่วยต่อการโจมตี',
  'All DEF of the wearer reduced to 1/3.': 'DEF ทั้งหมดของผู้สวมใส่ลดเหลือ 1/3',
  'All defense is reduced to 1/2 while equipped.':
    'ค่าป้องกันทั้งหมดลดเหลือ 1/2 ขณะสวมใส่',
  'DEF of equipped armor is reduced to 1/3.':
    'DEF ของ Armor ที่สวมใส่ลดเหลือ 1/3',
  'Chance to reduce enemy SP on hit. When equipped by Sage, restores 1 SP each time a physical attack hits a monster.':
    'มีโอกาสลด SP ศัตรูเมื่อโจมตีเข้า เมื่อ Sage สวมใส่ จะฟื้นฟู SP 1 หน่วยทุกครั้งที่โจมตีกายภาพเข้ามอนสเตอร์',

  // Fragments the game wraps mid-sentence. Translated as the fragment they are,
  // because that is what the page shows on its own line.
  'and when taking physical damage, has a low chance to auto-cast [Assumptio] Lv 1 on the wearer.':
    'และเมื่อได้รับความเสียหายกายภาพ มีโอกาสน้อยที่จะร่าย [Assumptio] Lv 1 ใส่ผู้สวมใส่อัตโนมัติ',

  // Boxes and quivers
  'A box containing 10 WoE Blue Potion.': 'กล่องบรรจุ WoE Blue Potion 10 ชิ้น',
  'A box containing 30 WoE White Potion.': 'กล่องบรรจุ WoE White Potion 30 ชิ้น',
  'A box containing 50 WoE Violet Potion.': 'กล่องบรรจุ WoE Violet Potion 50 ชิ้น',
  'Arrow Quiver containing 500 crystal Arrow.': 'กระบอกลูกธนูบรรจุ crystal Arrow 500 ดอก',
  'Contains all Lv.6 cooking recipes.': 'บรรจุสูตรอาหาร Lv.6 ทั้งหมด',
  'Contains all Lv.7 cooking recipes.': 'บรรจุสูตรอาหาร Lv.7 ทั้งหมด',
  'Contains all Lv.9 cooking recipes.': 'บรรจุสูตรอาหาร Lv.9 ทั้งหมด',
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
  add(EFFECT_TH_2, 'effect');
  add(FLAVOUR_TH, 'flavour');

  const { error } = await db
    .from('item_description_lines')
    .upsert(rows, { onConflict: 'source_line' });
  if (error) throw new Error(`Failed to seed item_description_lines: ${error.message}`);

  console.log(`seeded ${rows.length} lines, covering ${covered} occurrences`);
  console.log(
    `  ${Object.keys(EFFECT_TH).length + Object.keys(EFFECT_TH_2).length} effect, ` +
      `${Object.keys(FLAVOUR_TH).length} flavour`,
  );
  console.log(`deferred classes: ${DEFERRED_RULES.length}`);
  for (const d of DEFERRED_RULES) console.log(`  ${d.rule}\n    ${d.why}`);

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
