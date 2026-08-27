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

// Batch 3, part 2: procs written as `Has a chance to ...`, stat lines that
// carry at least one translatable word, recovery items, and set-piece
// conditionals.
const EFFECT_TH_3: Record<string, string> = {
  // Resistance and damage lines that have something to translate. A line whose
  // every token is already English is covered by DEFERRED_RULES instead.
  'Fire-Property/Shadow-Property Resistance -15%.': 'Resistance ธาตุ Fire/Shadow -15%',
  'Ghost-Property/Wind-Property Resistance +20%.': 'Resistance ธาตุ Ghost/Wind +20%',
  'Neutral-Property Resistance +10%, FLEE Rate +10.':
    'Resistance ธาตุ Neutral +10%, อัตรา FLEE +10',
  'Physical Damage Taken from Human/Brute Enemies -30%.':
    'Physical Damage Taken จากศัตรู Human/Brute -30%',
  'Physical Damage to Demi-Human, Brute, Plant, and Insect Monsters +7%.':
    'Physical Damage ต่อมอนสเตอร์ Demi-Human, Brute, Plant และ Insect +7%',
  'HIT +10, FLEE Rate +3.': 'HIT +10, อัตรา FLEE +3',
  'Perfect Dodge +5, FLEE Rate +10.': 'Perfect Dodge +5, อัตรา FLEE +10',
  'INT +2, Unbreakable.': 'INT +2 ไม่แตก',
  'INT +3, DEX +2, Unbreakable.': 'INT +3, DEX +2 ไม่แตก',
  'MDEF +10, Unbreakable.': 'MDEF +10 ไม่แตก',
  'MDEF +3. Cannot be Refined.': 'MDEF +3 ตีบวกไม่ได้',
  'MDEF +7 when refine level is 5 or lower.': 'MDEF +7 เมื่อระดับตีบวก 5 หรือต่ำกว่า',
  'INT +2. If refine level ≥ 9, MSP +150.': 'INT +2 หากระดับตีบวก ≥ 9 จะได้ MSP +150',
  'INT +1. When equipped by Acolyte Class, INT +1 and MDEF +1.':
    'INT +1 เมื่อ Acolyte Class สวมใส่ จะได้ INT +1 และ MDEF +1',
  'M.ATK +2 per refine level.': 'M.ATK +2 ต่อทุกระดับตีบวก',
  'Raises MATK by 4 per shield refine.': 'เพิ่ม MATK 4 ต่อทุกระดับตีบวกของ Shield',
  'HP +150. At +7 refine: HP +150. At +9 refine: HP +250.':
    'HP +150 ตีบวก +7: HP +150 ตีบวก +9: HP +250',
  'LUK and Critical Rate increase with the refine level.':
    'LUK และอัตรา Critical เพิ่มขึ้นตามระดับตีบวก',
  'Prisoner Uniform increases HIT and FLEE based on its refine level.':
    'Prisoner Uniform เพิ่ม HIT และ FLEE ตามระดับตีบวก',
  'Reduces After Attack Delay by 1% per 2 refine levels.':
    'ลดดีเลย์หลังโจมตี 1% ต่อทุก 2 ระดับตีบวก',
  'Reduces Ranged Physical Damage Taken by 5%, and by an additional 1% per armor refine.':
    'ลด Physical Damage Taken จากระยะไกล 5% และลดอีก 1% ต่อทุกระดับตีบวกของ Armor',
  'Reduces physical and magical damage received from Plant Monsters by 3%.':
    'ลดความเสียหายกายภาพและเวทที่ได้รับจากมอนสเตอร์ Plant 3%',
  'Reduces SP cost of skills by 30%.': 'ลด SP ที่สกิลใช้ 30%',
  'Increases resistance to Poison by 30%.': 'เพิ่มความต้านทานต่อ Poison 30%',
  'Grants 50% resistance to the Status Ailment effects of Poison, Curse, Silence, Confusion, and Blind.':
    'ให้ความต้านทาน 50% ต่อสถานะผิดปกติ Poison, Curse, Silence, Confusion และ Blind',
  'Increases ASPD (After Attack Delay -10%), CRIT +5.':
    'เพิ่ม ASPD (ดีเลย์หลังโจมตี -10%), CRIT +5',
  'Increases ASPD (After Attack Delay -8%).': 'เพิ่ม ASPD (ดีเลย์หลังโจมตี -8%)',
  'Increases damage of Holy Cross and Pierce by 10%.':
    'เพิ่มความเสียหายของ Holy Cross และ Pierce 10%',
  'Increases Sonic Blow damage by 20%.': 'เพิ่มความเสียหายของ Sonic Blow 20%',
  'Increases the effectiveness of your [Heal], [Sanctuary], and [Potion Pitcher] by 30%.':
    'เพิ่มประสิทธิภาพของ [Heal], [Sanctuary] และ [Potion Pitcher] 30%',
  'Heal Amount you cast is increased by 5%.': 'ปริมาณ Heal ที่คุณร่ายเพิ่มขึ้น 5%',
  'Movement speed increases while equipped.': 'ความเร็วเคลื่อนที่เพิ่มขึ้นขณะสวมใส่',
  'Grants continuous [Endure] effect.': 'ให้ผลของ [Endure] ตลอดเวลา',
  'Ignores the DEF of Dragon-type monsters.': 'ไม่สนใจ DEF ของมอนสเตอร์ประเภท Dragon',
  'Ignores the DEF of normal monsters.': 'ไม่สนใจ DEF ของมอนสเตอร์ทั่วไป',
  'Normal physical attacks (excluding skills) become 9-cell splash attacks.':
    'การโจมตีกายภาพปกติ (ไม่รวมสกิล) กลายเป็นการโจมตีกระจาย 9 ช่อง',

  // `Has a chance to ...`
  'Has a 1% chance to Freeze yourself when attacking.':
    'มีโอกาส 1% ที่ตัวเองจะติด Freeze เมื่อโจมตี',
  'Has a 3% chance to inflict Blind on the enemy when attacking.':
    'มีโอกาส 3% ทำให้ศัตรูติด Blind เมื่อโจมตี',
  'Has a 5% chance to Freeze the target when attacking.':
    'มีโอกาส 5% ทำให้เป้าหมายติด Freeze เมื่อโจมตี',
  'Has a 5% chance to inflict Stun when attacking. Unbreakable.':
    'มีโอกาส 5% ทำให้ติด Stun เมื่อโจมตี และไม่แตก',
  'Has a 50% chance to inflict Freeze on the enemy when you take physical damage.':
    'มีโอกาส 50% ทำให้ศัตรูติด Freeze เมื่อคุณได้รับความเสียหายกายภาพ',
  'Has a chance to activate [Cloaking] when you take physical damage (cast at your learned skill level).':
    'มีโอกาสเปิด [Cloaking] เมื่อคุณได้รับความเสียหายกายภาพ (ร่ายที่เลเวลสกิลที่คุณเรียนไว้)',
  'Has a chance to activate [Weapon Perfection] Lv.1 when dealing physical attacks.':
    'มีโอกาสเปิด [Weapon Perfection] Lv.1 เมื่อโจมตีกายภาพ',
  'Has a chance to autocast [Envenom] Lv.1 when dealing physical attacks.':
    'มีโอกาสร่าย [Envenom] Lv.1 อัตโนมัติ เมื่อโจมตีกายภาพ',
  'Has a chance to autocast [Heal] Lv.1 on yourself when dealing physical attacks. If you have learned [Heal] Lv.10, Lv.10 is cast instead.':
    'มีโอกาสร่าย [Heal] Lv.1 ใส่ตัวเองอัตโนมัติ เมื่อโจมตีกายภาพ หากเรียน [Heal] Lv.10 ไว้ จะร่าย Lv.10 แทน',
  'Has a chance to autocast [Magnum Break] Lv.10 when dealing physical attacks.':
    'มีโอกาสร่าย [Magnum Break] Lv.10 อัตโนมัติ เมื่อโจมตีกายภาพ',
  'Has a chance to cast [Heal] Lv.3 on yourself when you take physical damage.':
    'มีโอกาสร่าย [Heal] Lv.3 ใส่ตัวเอง เมื่อคุณได้รับความเสียหายกายภาพ',
  'Has a low chance to autocast [Cold Bolt] Lv.3 when dealing physical attacks.':
    'มีโอกาสน้อยที่จะร่าย [Cold Bolt] Lv.3 อัตโนมัติ เมื่อโจมตีกายภาพ',
  'Has a low chance to autocast [Fire Bolt] Lv.3 when dealing physical attacks.':
    'มีโอกาสน้อยที่จะร่าย [Fire Bolt] Lv.3 อัตโนมัติ เมื่อโจมตีกายภาพ',
  'Has a low chance to autocast [Thunderstorm] Lv.3 when attacking.':
    'มีโอกาสน้อยที่จะร่าย [Thunderstorm] Lv.3 อัตโนมัติ เมื่อโจมตี',
  'Has a low chance to cast [Heal] Lv.1 on yourself with melee physical attacks.':
    'มีโอกาสน้อยที่จะร่าย [Heal] Lv.1 ใส่ตัวเอง เมื่อโจมตีกายภาพระยะประชิด',
  'Has a low chance to break the enemy\'s weapon with melee physical attacks.':
    'มีโอกาสน้อยที่จะทำให้อาวุธของศัตรูแตก เมื่อโจมตีกายภาพระยะประชิด',
  'Has a low chance to drain 30% of the target\'s SP when attacking.':
    'มีโอกาสน้อยที่จะดูด SP ของเป้าหมาย 30% เมื่อโจมตี',
  'Has a low chance to inflict Bleeding on the enemy with melee physical attacks.':
    'มีโอกาสน้อยที่จะทำให้ศัตรูติด Bleeding เมื่อโจมตีกายภาพระยะประชิด',
  'Has a low chance to inflict Bleeding on the target when attacking.':
    'มีโอกาสน้อยที่จะทำให้เป้าหมายติด Bleeding เมื่อโจมตี',
  'Has a chance to inflict Blind on the enemy when you take physical damage.':
    'มีโอกาสทำให้ศัตรูติด Blind เมื่อคุณได้รับความเสียหายกายภาพ',
  'Has a chance to inflict Coma on the target.': 'มีโอกาสทำให้เป้าหมายติด Coma',
  'Has a chance to inflict Confusion on the enemy when you take physical damage.':
    'มีโอกาสทำให้ศัตรูติด Confusion เมื่อคุณได้รับความเสียหายกายภาพ',
  'Has a chance to inflict Silence on the enemy when you take physical damage.':
    'มีโอกาสทำให้ศัตรูติด Silence เมื่อคุณได้รับความเสียหายกายภาพ',
  'Has a chance to inflict Silence on the target when attacking.':
    'มีโอกาสทำให้เป้าหมายติด Silence เมื่อโจมตี',
  'Has a chance to inflict Stun, Curse, Silence, Poison, or Bleeding on the target with melee physical attacks.':
    'มีโอกาสทำให้เป้าหมายติด Stun, Curse, Silence, Poison หรือ Bleeding เมื่อโจมตีกายภาพระยะประชิด',
  'Has a chance to transform a monster into another monster.':
    'มีโอกาสแปลงมอนสเตอร์เป็นมอนสเตอร์ตัวอื่น',

  // Drops on kill
  'Has a chance to drop a recovery item each time you kill a monster.':
    'มีโอกาสดรอปไอเทมฟื้นฟูทุกครั้งที่สังหารมอนสเตอร์',
  'Has a chance to drop a Red Potion each time you kill an enemy.':
    'มีโอกาสดรอป Red Potion ทุกครั้งที่สังหารศัตรู',
  'Has a chance to drop Candy or Candy Cane each time you kill a Demi-Human monster.':
    'มีโอกาสดรอป Candy หรือ Candy Cane ทุกครั้งที่สังหารมอนสเตอร์ Demi-Human',
  'Has a chance to drop Meat or Monster\'s Feed each time you kill a Brute monster.':
    'มีโอกาสดรอป Meat หรือ Monster\'s Feed ทุกครั้งที่สังหารมอนสเตอร์ Brute',
  'Has a chance to drop Red Herb, Yellow Herb, or White Herb each time you kill a Plant monster.':
    'มีโอกาสดรอป Red Herb, Yellow Herb หรือ White Herb ทุกครั้งที่สังหารมอนสเตอร์ Plant',
  'Has a low chance to drop a Banana when you kill a monster. Banana recovery rate +100%.':
    'มีโอกาสน้อยที่จะดรอป Banana เมื่อสังหารมอนสเตอร์ และอัตราฟื้นฟูของ Banana +100%',
  'Has a chance to obtain a Gloomy Box each time you kill a Plant monster.':
    'มีโอกาสได้รับ Gloomy Box ทุกครั้งที่สังหารมอนสเตอร์ Plant',
  'Has a chance to obtain a Sunlight Box each time you kill an Angel monster.':
    'มีโอกาสได้รับ Sunlight Box ทุกครั้งที่สังหารมอนสเตอร์ Angel',
  'Has a chance to obtain Crystal Blue each time you kill a Fish-type monster.':
    'มีโอกาสได้รับ Crystal Blue ทุกครั้งที่สังหารมอนสเตอร์ประเภท Fish',

  // `On <event>, N% chance to inflict <status>`
  'On enemy attack, 4% chance to inflict Poison.':
    'เมื่อศัตรูโจมตี มีโอกาส 4% ทำให้ติด Poison',
  'On enemy attack, 5% chance to inflict Confusion.':
    'เมื่อศัตรูโจมตี มีโอกาส 5% ทำให้ติด Confusion',
  'On physical attack, 2% chance to inflict Stun.':
    'เมื่อโจมตีกายภาพ มีโอกาส 2% ทำให้ติด Stun',
  'On physical attack, 5% chance to inflict Blind.':
    'เมื่อโจมตีกายภาพ มีโอกาส 5% ทำให้ติด Blind',
  'On physical attack, 5% chance to inflict Curse.':
    'เมื่อโจมตีกายภาพ มีโอกาส 5% ทำให้ติด Curse',
  'On physical attack, 5% chance to inflict Frozen.':
    'เมื่อโจมตีกายภาพ มีโอกาส 5% ทำให้ติด Frozen',
  'On physical attack, 5% chance to inflict Poison.':
    'เมื่อโจมตีกายภาพ มีโอกาส 5% ทำให้ติด Poison',
  'On physical attack, 5% chance to inflict Silence.':
    'เมื่อโจมตีกายภาพ มีโอกาส 5% ทำให้ติด Silence',
  'On physical attack, 5% chance to inflict Sleep.':
    'เมื่อโจมตีกายภาพ มีโอกาส 5% ทำให้ติด Sleep',
  'On physical attack, 5% chance to inflict Stun.':
    'เมื่อโจมตีกายภาพ มีโอกาส 5% ทำให้ติด Stun',
  'Physical attacks have a 3% chance to inflict Bleeding.':
    'การโจมตีกายภาพมีโอกาส 3% ทำให้ติด Bleeding',
  'Physical attacks have a 5% chance to restore 100 HP every second for 5 seconds.':
    'การโจมตีกายภาพมีโอกาส 5% ฟื้นฟู HP 100 ทุกวินาที เป็นเวลา 5 วินาที',
  'Physical attacks have a chance to autocast Jupitel Thunder Lv.3.':
    'การโจมตีกายภาพมีโอกาสร่าย Jupitel Thunder Lv.3 อัตโนมัติ',
  'Physical attacks have a chance to autocast Sonic Blow Lv.1.':
    'การโจมตีกายภาพมีโอกาสร่าย Sonic Blow Lv.1 อัตโนมัติ',
  'Physical/Magical attacks have a 10% chance to restore 20 SP every second for 7 seconds.':
    'การโจมตีกายภาพ/เวทมีโอกาส 10% ฟื้นฟู SP 20 ทุกวินาที เป็นเวลา 7 วินาที',
  'Physical Damage Taken has a chance to autocast Auto Guard Lv.3.':
    'เมื่อเกิด Physical Damage Taken มีโอกาสร่าย Auto Guard Lv.3 อัตโนมัติ',
  'Physical Damage Taken has a chance to inflict Confusion.':
    'เมื่อเกิด Physical Damage Taken มีโอกาสทำให้ติด Confusion',
  'Physical Damage Taken has a chance to inflict Poison.':
    'เมื่อเกิด Physical Damage Taken มีโอกาสทำให้ติด Poison',
  'Inflicts Stone on enemies with a chance when taking physical damage.':
    'มีโอกาสทำให้ศัตรูติด Stone เมื่อได้รับความเสียหายกายภาพ',

  // Conditionals on stats, learned skills and job class
  'If Auto Guard Lv.10 is learned, Lv.10 is autocast instead.':
    'หากเรียน Auto Guard Lv.10 ไว้ จะร่าย Lv.10 อัตโนมัติแทน',
  'If DEX is 77 or higher, greatly increased chance to inflict Stun.':
    'หาก DEX ตั้งแต่ 77 ขึ้นไป โอกาสทำให้ติด Stun เพิ่มขึ้นมาก',
  'If Double Attack is learned, activation chance follows the learned Double Attack skill level.':
    'หากเรียน Double Attack ไว้ โอกาสทำงานจะอิงตามเลเวลสกิล Double Attack ที่เรียน',
  'If Fire Ball Lv 10 is learned, autocast triggers Fire Ball Lv 10 instead.':
    'หากเรียน Fire Ball Lv 10 ไว้ จะร่าย Fire Ball Lv 10 อัตโนมัติแทน',
  'If Improve Concentration Lv 10 is learned, autocast triggers Improve Concentration Lv 10 instead.':
    'หากเรียน Improve Concentration Lv 10 ไว้ จะร่าย Improve Concentration Lv 10 อัตโนมัติแทน',
  'If INT is 77 or higher, the chance to inflict Stone increases.':
    'หาก INT ตั้งแต่ 77 ขึ้นไป โอกาสทำให้ติด Stone เพิ่มขึ้น',
  'If INT is 99 or higher, chance to autocast Kyrie Eleison increases.':
    'หาก INT ตั้งแต่ 99 ขึ้นไป โอกาสร่าย Kyrie Eleison อัตโนมัติเพิ่มขึ้น',
  'If Jupitel Thunder Lv.10 is learned, Lv.10 is autocast instead.':
    'หากเรียน Jupitel Thunder Lv.10 ไว้ จะร่าย Lv.10 อัตโนมัติแทน',
  'If Quagmire Lv.5 is learned, Lv.5 is cast instead of Lv.1.':
    'หากเรียน Quagmire Lv.5 ไว้ จะร่าย Lv.5 แทน Lv.1',
  'If STR is 77 or higher, the chance to inflict Confusion is higher.':
    'หาก STR ตั้งแต่ 77 ขึ้นไป โอกาสทำให้ติด Confusion สูงขึ้น',
  'If VIT is 77 or higher, the chance to inflict Silence is higher.':
    'หาก VIT ตั้งแต่ 77 ขึ้นไป โอกาสทำให้ติด Silence สูงขึ้น',
  'If the wearer is Assassin, the chance increases.':
    'หากผู้สวมใส่เป็น Assassin โอกาสจะเพิ่มขึ้น',
  'If you have not learned [Cloaking] Lv.3 or higher, it can only activate while next to a wall.':
    'หากยังไม่ได้เรียน [Cloaking] Lv.3 ขึ้นไป จะทำงานได้เฉพาะตอนอยู่ติดกำแพงเท่านั้น',
  'If the set wearer is a Mage Class character, variable cast time -15% and MATK +3%.':
    'หากผู้สวมใส่ชุดเป็น Mage Class จะได้เวลาร่ายแบบแปรผัน -15% และ MATK +3%',
  'If the set wearer is a Merchant Class character, has a chance to drop an Old Purple Box each time you kill a monster, and reflects 20% of single-target offensive magic.':
    'หากผู้สวมใส่ชุดเป็น Merchant Class จะมีโอกาสดรอป Old Purple Box ทุกครั้งที่สังหารมอนสเตอร์ และสะท้อนเวทโจมตีเป้าหมายเดี่ยว 20%',
  'If the set wearer is Archer Class, EXP gained from defeating Brute Monsters +5%, and chance to inflict Coma on Brute enemies when dealing physical damage.':
    'หากผู้สวมใส่ชุดเป็น Archer Class จะได้ EXP จากการสังหารมอนสเตอร์ Brute +5% และมีโอกาสทำให้ศัตรู Brute ติด Coma เมื่อสร้างความเสียหายกายภาพ',

  // SP and HP recovery on kill or on hit
  'Recovers 1 SP per attack.': 'ฟื้นฟู SP 1 ต่อการโจมตี',
  'Recovers 2 SP per attack.': 'ฟื้นฟู SP 2 ต่อการโจมตี',
  'Recovers 5 SP each time you defeat Brute Monsters with melee physical attacks.':
    'ฟื้นฟู SP 5 ทุกครั้งที่สังหารมอนสเตอร์ Brute ด้วยการโจมตีกายภาพระยะประชิด',
  'Recovers 5 SP each time you defeat Dragon Monsters with melee physical attacks.':
    'ฟื้นฟู SP 5 ทุกครั้งที่สังหารมอนสเตอร์ Dragon ด้วยการโจมตีกายภาพระยะประชิด',
  'Recovers 5 SP when defeating Demi-Human Monsters with melee physical attacks.':
    'ฟื้นฟู SP 5 เมื่อสังหารมอนสเตอร์ Demi-Human ด้วยการโจมตีกายภาพระยะประชิด',
  'Recovers 5 SP when defeating Fish Monsters with melee physical attacks.':
    'ฟื้นฟู SP 5 เมื่อสังหารมอนสเตอร์ Fish ด้วยการโจมตีกายภาพระยะประชิด',
  'Recovers 5 SP when defeating Formless Monsters with melee physical attacks.':
    'ฟื้นฟู SP 5 เมื่อสังหารมอนสเตอร์ Formless ด้วยการโจมตีกายภาพระยะประชิด',
  'Recovers 5 SP when defeating Plant Monsters with melee physical attacks.':
    'ฟื้นฟู SP 5 เมื่อสังหารมอนสเตอร์ Plant ด้วยการโจมตีกายภาพระยะประชิด',
  'Recovers 5 SP when defeating Undead Monsters with melee physical attacks.':
    'ฟื้นฟู SP 5 เมื่อสังหารมอนสเตอร์ Undead ด้วยการโจมตีกายภาพระยะประชิด',

  'Heal Lv 3 usable.': 'ใช้ Heal Lv 3 ได้',
  'Pierce Lv 3 usable.': 'ใช้ Pierce Lv 3 ได้',
};

// Consumables and the items that describe what they restore. Effect, not
// flavour: how much HP a fruit gives is a decision a player makes at a vendor.
const EFFECT_TH_4: Record<string, string> = {
  'Recovers about 10% HP.': 'ฟื้นฟู HP ประมาณ 10%',
  'Recovers about 10% SP.': 'ฟื้นฟู SP ประมาณ 10%',
  'Recovers about 500 HP and about 60 SP.': 'ฟื้นฟู HP ประมาณ 500 และ SP ประมาณ 60',
  'Exotic fruit with a sweet taste. Recovers a small amount of HP.':
    'ผลไม้ต่างถิ่นรสหวาน ฟื้นฟู HP เล็กน้อย',
  'Food processed to suit monsters’ taste. Recovers a small amount of HP.':
    'อาหารที่ปรุงให้ถูกปากมอนสเตอร์ ฟื้นฟู HP เล็กน้อย',
  'Food with a unique scent known to restore some SP.':
    'อาหารกลิ่นเฉพาะตัวที่ขึ้นชื่อว่าฟื้นฟู SP ได้บ้าง',
  'Fruit of the Yggdrasil tree, source of another world. After savoring its fantastical, primordial flavor, one finds their life force overflowing. Recovers all of the user\'s HP and SP.':
    'ผลไม้จากต้น Yggdrasil ต้นกำเนิดของอีกโลกหนึ่ง เมื่อได้ลิ้มรสอันวิเศษดั่งปฐมกาล พลังชีวิตจะเอ่อล้น ฟื้นฟู HP และ SP ของผู้ใช้จนเต็ม',
  'Fruit with a tangy and sour flavor. Recovers a small amount of SP.':
    'ผลไม้รสเปรี้ยวจี๊ด ฟื้นฟู SP เล็กน้อย',
  'Fruit with sweet and refreshing aroma. Recovers a small amount of HP.':
    'ผลไม้กลิ่นหอมหวานสดชื่น ฟื้นฟู HP เล็กน้อย',
  'Crustacean with five pairs of legs, turning pink when cooked and very tasty. Recovers a small amount of HP.':
    'สัตว์เปลือกแข็งห้าคู่ขา สุกแล้วเปลี่ยนเป็นสีชมพูและรสชาติดีมาก ฟื้นฟู HP เล็กน้อย',
  'Edible pumpkin. Recovers a small amount of HP.': 'ฟักทองกินได้ ฟื้นฟู HP เล็กน้อย',
  'Leaf of a flower called Hinalle. Its cool, refreshing scent eases pain and restores vitality. Recovers a moderate amount of HP.':
    'ใบของดอกไม้ชื่อ Hinalle กลิ่นเย็นสดชื่นช่วยบรรเทาความเจ็บปวดและคืนความกระปรี้กระเปร่า ฟื้นฟู HP ปานกลาง',
  'Leaves cut and gathered from a plant called Aloe. Recovers a moderate amount of HP.':
    'ใบที่ตัดเก็บมาจากพืชชื่อ Aloe ฟื้นฟู HP ปานกลาง',
  'Lollipop-shaped candy. Recovers about 105 HP.': 'ลูกอมทรงอมยิ้ม ฟื้นฟู HP ประมาณ 105',
  'Mental recovery tonic finely ground from Blue Herb. Recovers about 60 SP.':
    'ยาบำรุงจิตใจที่บดละเอียดจาก Blue Herb ฟื้นฟู SP ประมาณ 60',
  'Recovery tonic finely ground from White Herb. Recovers about 325 HP.':
    'ยาบำรุงที่บดละเอียดจาก White Herb ฟื้นฟู HP ประมาณ 325',
  'Oval fruit that turns yellow and fragrant when ripe. So sour that just thinking about it makes your mouth water! Recovers a small amount of SP.':
    'ผลไม้ทรงรีที่สุกแล้วเปลี่ยนเป็นสีเหลืองและส่งกลิ่นหอม เปรี้ยวขนาดที่แค่นึกถึงก็น้ำลายสอ ฟื้นฟู SP เล็กน้อย',
  'Popular red fruit with a sweet and tangy flavor. Recovers a small amount of SP.':
    'ผลไม้สีแดงยอดนิยม รสหวานอมเปรี้ยว ฟื้นฟู SP เล็กน้อย',
  'Precious herb with a unique scent that refreshes the mind. Recovers a small amount of SP.':
    'สมุนไพรล้ำค่ากลิ่นเฉพาะตัวที่ช่วยให้จิตใจสดชื่น ฟื้นฟู SP เล็กน้อย',
  'Processed and sterilized milk from cows. Commonly used as nutritious food for Kids. Recovers a small amount of HP.':
    'นมวัวผ่านการฆ่าเชื้อ นิยมใช้เป็นอาหารบำรุงสำหรับเด็ก ฟื้นฟู HP เล็กน้อย',
  'Purple root vegetable rich in starch and sweet in flavor, often used as food. Recovers a small amount of HP.':
    'พืชหัวสีม่วงที่อุดมด้วยแป้งและรสหวาน นิยมใช้เป็นอาหาร ฟื้นฟู HP เล็กน้อย',
  'Rare herb known for exceptional wound treatment. Recovers a small amount of HP.':
    'สมุนไพรหายากที่ขึ้นชื่อเรื่องรักษาบาดแผลได้ดีเยี่ยม ฟื้นฟู HP เล็กน้อย',
  'Rare herb known for strong wound treatment. Recovers a small amount of HP.':
    'สมุนไพรหายากที่ขึ้นชื่อเรื่องรักษาบาดแผลได้ดี ฟื้นฟู HP เล็กน้อย',
  'Rare herb known for treating wounds. Recovers a small amount of HP.':
    'สมุนไพรหายากที่ขึ้นชื่อเรื่องรักษาบาดแผล ฟื้นฟู HP เล็กน้อย',
  'Red vegetable with a sweet and unique aroma, often used in cooking. Recovers a small amount of HP.':
    'ผักสีแดงกลิ่นหอมหวานเฉพาะตัว นิยมใช้ประกอบอาหาร ฟื้นฟู HP เล็กน้อย',
  'Potion infused with ingredients that enhance focus. Increases ASPD when consumed. Usable by All Jobs.':
    'ยาที่ผสมส่วนประกอบช่วยเพิ่มสมาธิ ดื่มแล้วเพิ่ม ASPD ใช้ได้ทุกอาชีพ',

  // Weapons and gear whose description is mostly mechanical
  'A composite bow crafted by combining various materials, designed with a focus on increasing damage output.':
    'ธนูคอมโพสิตที่ประกอบจากวัสดุหลายชนิด ออกแบบโดยเน้นเพิ่มความเสียหาย',
  'A small bow that doesn’t deal much damage but is easy to use.':
    'ธนูเล็กที่สร้างความเสียหายไม่มาก แต่ใช้ง่าย',
  'Bow tailored precisely to its user, greatly boosting HIT and overall damage.':
    'ธนูที่ปรับให้เข้ากับผู้ใช้อย่างแม่นยำ เพิ่ม HIT และความเสียหายโดยรวมอย่างมาก',
  'Composite bow modeled after animal horns, known for its high damage and precise accuracy.':
    'ธนูคอมโพสิตที่ทำเลียนแบบเขาสัตว์ ขึ้นชื่อเรื่องความเสียหายสูงและความแม่นยำ',
  'Divine bow imbued with holy power, dealing high damage while drawing out the user’s hidden potential.':
    'ธนูศักดิ์สิทธิ์ที่อาบด้วยพลังบริสุทธิ์ สร้างความเสียหายสูงพร้อมดึงศักยภาพที่ซ่อนอยู่ของผู้ใช้ออกมา',
  'Cloth worn on the hand to make drawing a bowstring easier and increase damage when firing arrows.':
    'ผ้าที่สวมที่มือเพื่อให้ง้างสายธนูง่ายขึ้นและเพิ่มความเสียหายเมื่อยิงธนู',
  'Guard that covers the back of the hand with a hard plate, boosting both protection and damage of each punch.':
    'เกราะป้องกันหลังมือด้วยแผ่นแข็ง เพิ่มทั้งการป้องกันและความเสียหายของหมัดแต่ละหมัด',
  'Dagger forged with lunar energy that absorbs the target’s SP to replenish the wielder’s own.':
    'กริชที่หลอมด้วยพลังจันทรา ดูด SP ของเป้าหมายมาเติมให้ผู้ถือ',
  'Katar infused with the essence of erupting flames, modeled after bursting fire. Occasionally inflicts Silence on enemies with a low chance.':
    'กะตาร์ที่อาบด้วยแก่นเปลวไฟปะทุ ทำเลียนแบบไฟที่ระเบิดออก มีโอกาสน้อยที่จะทำให้ศัตรูติด Silence เป็นครั้งคราว',
  'Glittering claws of Joker leave afterimages that strip everything from enemies. STR +2, Raging Trifecta Blow damage +10%.':
    'กรงเล็บระยิบระยับของ Joker ที่ทิ้งภาพติดตาและปลิดทุกอย่างจากศัตรู STR +2 และความเสียหาย Raging Trifecta Blow +10%',
  'Magic ring that manifests a protective power, greatly reducing damage taken by the wearer.':
    'แหวนเวทที่เรียกพลังปกป้องออกมา ลดความเสียหายที่ผู้สวมใส่ได้รับอย่างมาก',
  'A base item required for setting a trap.': 'ไอเทมพื้นฐานที่ต้องใช้ในการวางกับดัก',
  'A paper blessed by a sublime Priest. Lets you use the Holy-property spell [Heal] at Level 5.':
    'กระดาษที่ได้รับพรจาก Priest ชั้นสูง ใช้เวทธาตุ Holy อย่าง [Heal] ที่ Level 5 ได้',
  'A paper inscribed with a mage\'s spell, made from the essence of ancient magical study. Lets you use the Earth-property spell [Earth Spike] at Level 5.':
    'กระดาษที่จารเวทของนักเวท ทำจากแก่นแห่งวิชาเวทโบราณ ใช้เวทธาตุ Earth อย่าง [Earth Spike] ที่ Level 5 ได้',
  'A paper inscribed with a mage\'s spell, made from the essence of ancient magical study. Lets you use the Fire-property spell [Fire Ball] at Level 5.':
    'กระดาษที่จารเวทของนักเวท ทำจากแก่นแห่งวิชาเวทโบราณ ใช้เวทธาตุ Fire อย่าง [Fire Ball] ที่ Level 5 ได้',
  'Paper containing a mage’s spell, crafted from the essence of ancient arcane studies. Allows the use of Water-Property magic Frost Driver at Lv.5.':
    'กระดาษที่บรรจุเวทของนักเวท ทำจากแก่นแห่งวิชาเวทโบราณ ใช้เวทธาตุ Water อย่าง Frost Driver ที่ Lv.5 ได้',
  'Arrow coated with a toxin that locks the jaw, with a chance to inflict Silence on the target.':
    'ลูกธนูเคลือบพิษที่ทำให้ขากรรไกรค้าง มีโอกาสทำให้เป้าหมายติด Silence',
  'Arrow whose serrated, razor-sharp tip increases CRIT when attacking.':
    'ลูกธนูปลายหยักคมกริบที่เพิ่ม CRIT เมื่อโจมตี',
  'Encyclopedia published by a famous house in Prontera, known for its rock-hard corners. People say it feels like they set 3Carat diamonds into the edges.':
    'สารานุกรมที่จัดพิมพ์โดยสำนักดังใน Prontera ขึ้นชื่อเรื่องมุมที่แข็งราวหิน คนว่ากันว่าเหมือนฝังเพชร 3Carat ไว้ที่ขอบ',
};

// Batch 3, part 3: set bonuses, refine thresholds written as `When refine
// level is ...`, spell scrolls, and the rest of the effect lines.
const EFFECT_TH_5: Record<string, string> = {
  'Reduces Variable Casting Time by 5%.': 'ลด Variable Casting Time 5%',
  'Reflects 30% of all melee physical damage.':
    'สะท้อนความเสียหายกายภาพระยะประชิดทั้งหมด 30%',
  'Reflects 5% of melee physical damage received. DEF +1.':
    'สะท้อนความเสียหายกายภาพระยะประชิดที่ได้รับ 5% และ DEF +1',
  'Resistance to Demon monsters 10%.': 'Resistance ต่อมอนสเตอร์ Demon 10%',
  'Restores 3 SP per hit when striking an enemy.':
    'ฟื้นฟู SP 3 ทุกครั้งที่โจมตีศัตรูเข้าเป้า',
  'Restores all HP and SP upon revival.': 'ฟื้นฟู HP และ SP เต็มเมื่อฟื้นคืนชีพ',
  'Slightly increases ASPD (After Attack Delay decreased).':
    'เพิ่ม ASPD เล็กน้อย (ดีเลย์หลังโจมตีลดลง)',
  'STR +2, Cannot be Refined.': 'STR +2 ตีบวกไม่ได้',
  'Takes 50% additional damage from Ghost-Property attacks.':
    'ได้รับความเสียหายจากการโจมตีธาตุ Ghost เพิ่ม 50%',
  'The [Intimidate] autocast is no longer used.': 'ไม่ร่าย [Intimidate] อัตโนมัติอีกต่อไป',
  'The higher the opponent\'s DEF, the more powerful its damage.':
    'ยิ่ง DEF ของคู่ต่อสู้สูง ความเสียหายยิ่งแรง',
  'The wearer\'s HP does not regenerate naturally and loses 666 HP every 10 seconds.':
    'HP ของผู้สวมใส่ไม่ฟื้นเองตามธรรมชาติ และเสีย HP 666 ทุก 10 วินาที',
  'Upon unequipping, lose 999 HP.': 'เมื่อถอดออก เสีย HP 999',
  'Triggers Auto-Spell Provoke Lv 3 with a certain chance when performing physical attacks.':
    'มีโอกาสร่าย Auto-Spell Provoke Lv 3 เมื่อโจมตีกายภาพ',
  'Using Bash pushes enemies back by 5 cells.': 'ใช้ Bash แล้วผลักศัตรูถอยไป 5 ช่อง',
  'When hitting with Mammonite, knocks enemies back by 5 cells.':
    'เมื่อโจมตีเข้าด้วย Mammonite จะผลักศัตรูถอยไป 5 ช่อง',
  'When attacking, has a low chance to cast [Fire Ball] Lv 3.':
    'เมื่อโจมตี มีโอกาสน้อยที่จะร่าย [Fire Ball] Lv 3',
  'When receiving physical damage, chance to autocast Kyrie Eleison Lv.10.':
    'เมื่อได้รับความเสียหายกายภาพ มีโอกาสร่าย Kyrie Eleison Lv.10 อัตโนมัติ',
  'When drinking juice, HP Heal effect +50%.': 'เมื่อดื่มน้ำผลไม้ ผลการฟื้นฟู HP +50%',
  'When killing a monster, has a chance to drop Steel Arrow.':
    'เมื่อสังหารมอนสเตอร์ มีโอกาสดรอป Steel Arrow',
  'When killing Insect monsters, Apple, Banana, or Carrot Juice may drop with a certain chance.':
    'เมื่อสังหารมอนสเตอร์ Insect มีโอกาสดรอป Apple, Banana หรือ Carrot Juice',
  'When killing Insect monsters, has a chance to obtain the \'Thunder Box\' item.':
    'เมื่อสังหารมอนสเตอร์ Insect มีโอกาสได้รับไอเทม \'Thunder Box\'',
  'When an Acolyte Class attacks Demon or Undead Monsters, CRIT +9.':
    'เมื่อ Acolyte Class โจมตีมอนสเตอร์ Demon หรือ Undead จะได้ CRIT +9',
  'When attacking Brute Monsters, CRIT +7.': 'เมื่อโจมตีมอนสเตอร์ Brute ได้ CRIT +7',
  'When attacking Fish Monsters, CRIT +7.': 'เมื่อโจมตีมอนสเตอร์ Fish ได้ CRIT +7',
  'When equipped by Thief Class, CRIT +4.': 'เมื่อ Thief Class สวมใส่ ได้ CRIT +4',
  'When equipped by Thief Class, FLEE Rate +20.':
    'เมื่อ Thief Class สวมใส่ ได้อัตรา FLEE +20',
  'When equipped by Thief Class, Perfect Dodge +5.':
    'เมื่อ Thief Class สวมใส่ ได้ Perfect Dodge +5',
  'When worn by a Swordsman Class character, Perfect Dodge +3.':
    'เมื่อ Swordsman Class สวมใส่ ได้ Perfect Dodge +3',
  'When worn by a Swordsman Class character, recovery from Red, Yellow, and White Potions +50%.':
    'เมื่อ Swordsman Class สวมใส่ การฟื้นฟูจาก Red, Yellow และ White Potion +50%',
  'When worn by a Novice or Super Novice, has a 20% chance to autocast [Endure] Lv.1 when you take physical damage.':
    'เมื่อ Novice หรือ Super Novice สวมใส่ มีโอกาส 20% ร่าย [Endure] Lv.1 อัตโนมัติ เมื่อได้รับความเสียหายกายภาพ',
  'When worn by a Novice or Super Novice, has a chance to autocast [Increase AGI] Lv.1 when you take physical damage.':
    'เมื่อ Novice หรือ Super Novice สวมใส่ มีโอกาสร่าย [Increase AGI] Lv.1 อัตโนมัติ เมื่อได้รับความเสียหายกายภาพ',
  'When performing physical attacks, has a certain chance to transform into Lunatic for 5 seconds. Movement speed increases during the transformation (does not stack with Increase Agility).':
    'เมื่อโจมตีกายภาพ มีโอกาสแปลงร่างเป็น Lunatic เป็นเวลา 5 วินาที ระหว่างแปลงร่างความเร็วเคลื่อนที่เพิ่มขึ้น (ไม่ซ้อนกับ Increase Agility)',
  'When performing physical attacks, has a certain chance to transform into Smokie for 5 seconds. Movement speed increases during the transformation (does not stack with Increase Agility).':
    'เมื่อโจมตีกายภาพ มีโอกาสแปลงร่างเป็น Smokie เป็นเวลา 5 วินาที ระหว่างแปลงร่างความเร็วเคลื่อนที่เพิ่มขึ้น (ไม่ซ้อนกับ Increase Agility)',

  // Refine thresholds written as a condition rather than `At +N refine`.
  'When refine level is 5 or higher, ATK and MATK increase by 1 per refine level.':
    'เมื่อระดับตีบวก 5 ขึ้นไป ATK และ MATK เพิ่มขึ้น 1 ต่อทุกระดับตีบวก',
  'When refine level is 5 or lower, MDEF +5.': 'เมื่อระดับตีบวก 5 หรือต่ำกว่า ได้ MDEF +5',
  'When refine level is 5 or lower, MDEF +8.': 'เมื่อระดับตีบวก 5 หรือต่ำกว่า ได้ MDEF +8',
  'When refine level is 9 or higher, [Bash] damage +10%.':
    'เมื่อระดับตีบวก 9 ขึ้นไป ความเสียหาย [Bash] +10%',
  'When refine level is 9 or higher, MaxHP +10% and MaxSP +10%.':
    'เมื่อระดับตีบวก 9 ขึ้นไป MaxHP +10% และ MaxSP +10%',
  'When refine level is 9 or higher, MDEF +5.': 'เมื่อระดับตีบวก 9 ขึ้นไป ได้ MDEF +5',
  'When refined to +9 or higher, Neutral-Property Resistance +5% and FLEE Rate +5.':
    'เมื่อตีบวก +9 ขึ้นไป Resistance ธาตุ Neutral +5% และอัตรา FLEE +5',
  'When refinement level is 9 or higher, FLEE +20.': 'เมื่อระดับตีบวก 9 ขึ้นไป ได้ FLEE +20',
  'While using a blunt weapon, increases CRIT by 1 per weapon refine, and at +10 increases Critical Damage by 10%.':
    'ขณะใช้อาวุธทู่ CRIT เพิ่มขึ้น 1 ต่อทุกระดับตีบวกของอาวุธ และที่ +10 เพิ่ม Critical Damage 10%',
  'While using a knuckle, reduces After Attack Delay by 1% per refine, and at +10 increases ASPD by 2.':
    'ขณะใช้นักเกิล ดีเลย์หลังโจมตีลดลง 1% ต่อทุกระดับตีบวก และที่ +10 เพิ่ม ASPD 2',
  'When worn with Prisoner Uniform, ATK +2 per refine level on Prisoner Uniform.':
    'เมื่อสวมใส่คู่กับ Prisoner Uniform ได้ ATK +2 ต่อทุกระดับตีบวกของ Prisoner Uniform',
  'When worn with Shackles, ATK +1 per refine level on Shackles.':
    'เมื่อสวมใส่คู่กับ Shackles ได้ ATK +1 ต่อทุกระดับตีบวกของ Shackles',
  'When equipped with Shackles, ATK +5. Additional ATK increases based on the refine level of Shackles.':
    'เมื่อสวมใส่คู่กับ Shackles ได้ ATK +5 และ ATK เพิ่มเติมตามระดับตีบวกของ Shackles',

  // Card and gear set bonuses
  'When equipped together with Arclouse Card, increases FLEE by 2 per shield refine.':
    'เมื่อสวมใส่คู่กับ Arclouse Card FLEE เพิ่มขึ้น 2 ต่อทุกระดับตีบวกของ Shield',
  'When equipped together with Bathory Card, increases INT by 1 per armor refine.':
    'เมื่อสวมใส่คู่กับ Bathory Card INT เพิ่มขึ้น 1 ต่อทุกระดับตีบวกของ Armor',
  'When equipped together with Black Leather Boots, Flee +10.':
    'เมื่อสวมใส่คู่กับ Black Leather Boots ได้ Flee +10',
  'When equipped together with Crab, Shellfish, and Aster Card, Fish monsters have a chance to drop Sashimi when hunted, and Physical Damage to Water-property Monsters +30%.':
    'เมื่อสวมใส่คู่กับ Crab, Shellfish และ Aster Card มอนสเตอร์ Fish มีโอกาสดรอป Sashimi เมื่อถูกล่า และ Physical Damage ต่อมอนสเตอร์ธาตุ Water +30%',
  'When equipped together with High Orc Card, grants ASPD +2 and ATK +25.':
    'เมื่อสวมใส่คู่กับ High Orc Card ให้ ASPD +2 และ ATK +25',
  'When equipped together with Leg, Zipper Bear, Myst Case, and Baby Leopard Cards:':
    'เมื่อสวมใส่คู่กับ Leg, Zipper Bear, Myst Case และ Baby Leopard Card:',
  'When equipped together with Lude Card, MaxSP +60.':
    'เมื่อสวมใส่คู่กับ Lude Card ได้ MaxSP +60',
  'When equipped together with Luna Bow, DEX +1, SP +50, and SP recovery rate +10%.':
    'เมื่อสวมใส่คู่กับ Luna Bow ได้ DEX +1, SP +50 และอัตราฟื้นฟู SP +10%',
  'When equipped together with Magician Hat, DEX +2, INT +2, and SP recovery rate +5%. MATK increases by 1% per refine.':
    'เมื่อสวมใส่คู่กับ Magician Hat ได้ DEX +2, INT +2 และอัตราฟื้นฟู SP +5% MATK เพิ่มขึ้น 1% ต่อทุกระดับตีบวก',
  'When equipped together with Miyabi Doll, Evil Nymph, Parasite, Harpy, and Bloody Butterfly Cards:':
    'เมื่อสวมใส่คู่กับ Miyabi Doll, Evil Nymph, Parasite, Harpy และ Bloody Butterfly Card:',
  'When equipped together with Ninja Suit, SP consumption -20% and MHP +300.':
    'เมื่อสวมใส่คู่กับ Ninja Suit การใช้ SP -20% และ MHP +300',
  'When equipped together with Penomena Card, increases ASPD by 1 per 2 shield refines.':
    'เมื่อสวมใส่คู่กับ Penomena Card ASPD เพิ่มขึ้น 1 ต่อทุก 2 ระดับตีบวกของ Shield',
  'When equipped together with Permeter, Solider, Freezer, and Heater Cards, the following effects are added:':
    'เมื่อสวมใส่คู่กับ Permeter, Solider, Freezer และ Heater Card จะได้ผลเพิ่มดังนี้:',
  'When equipped together with Quve Card, MaxHP +300.':
    'เมื่อสวมใส่คู่กับ Quve Card ได้ MaxHP +300',
  'When equipped together with The Wanderer, Wild Rose, Shinobi, and Zhu Po Long Cards, the following effects are added:':
    'เมื่อสวมใส่คู่กับ The Wanderer, Wild Rose, Shinobi และ Zhu Po Long Card จะได้ผลเพิ่มดังนี้:',
  'When equipped with Alarm, Clock, and Punk Card, MDEF +3 and DEF +3.':
    'เมื่อสวมใส่คู่กับ Alarm, Clock และ Punk Card ได้ MDEF +3 และ DEF +3',
  'When equipped with Chonchon Card, FLEE Rate +18.':
    'เมื่อสวมใส่คู่กับ Chonchon Card ได้อัตรา FLEE +18',
  'When equipped with Poring Card, FLEE Rate +18.':
    'เมื่อสวมใส่คู่กับ Poring Card ได้อัตรา FLEE +18',
  'When equipped with Rocker Card, FLEE Rate +18.':
    'เมื่อสวมใส่คู่กับ Rocker Card ได้อัตรา FLEE +18',
  'When equipped with Rogue Card, FLEE Rate +18.':
    'เมื่อสวมใส่คู่กับ Rogue Card ได้อัตรา FLEE +18',
  'When equipped with Wolf Card, FLEE Rate +18.':
    'เมื่อสวมใส่คู่กับ Wolf Card ได้อัตรา FLEE +18',
  'When used with Lunatic Card, FLEE Rate +18.':
    'เมื่อใช้คู่กับ Lunatic Card ได้อัตรา FLEE +18',
  'When used with Tarou Card, STR +3.': 'เมื่อใช้คู่กับ Tarou Card ได้ STR +3',
  'When equipped with Claw Card, the reduction becomes -20%.':
    'เมื่อสวมใส่คู่กับ Claw Card การลดจะกลายเป็น -20%',
  'When equipped with Criatura Academy Hat, ATK +5 and MATK +5.':
    'เมื่อสวมใส่คู่กับ Criatura Academy Hat ได้ ATK +5 และ MATK +5',
  'When equipped with Cruiser, Anolian, Alligator, and Dragon Tail Card:':
    'เมื่อสวมใส่คู่กับ Cruiser, Anolian, Alligator และ Dragon Tail Card:',
  'When equipped with Dark Illusion Card, MHP/MSP +20%.':
    'เมื่อสวมใส่คู่กับ Dark Illusion Card ได้ MHP/MSP +20%',
  'When equipped with Joker Card, physical/magical attacks have a chance to transform you into Joker for 7 seconds.':
    'เมื่อสวมใส่คู่กับ Joker Card การโจมตีกายภาพ/เวทมีโอกาสแปลงร่างคุณเป็น Joker เป็นเวลา 7 วินาที',
  'When equipped with Mummy Card, Perfect Hit +20%.':
    'เมื่อสวมใส่คู่กับ Mummy Card ได้ Perfect Hit +20%',
  'When equipped with Owl Baron Card, chance to autocast Lightning Bolt Lv 5 when dealing physical damage.':
    'เมื่อสวมใส่คู่กับ Owl Baron Card มีโอกาสร่าย Lightning Bolt Lv 5 อัตโนมัติ เมื่อสร้างความเสียหายกายภาพ',
  'When equipped with Skeleton Card, greatly increased chance to inflict Sleep.':
    'เมื่อสวมใส่คู่กับ Skeleton Card โอกาสทำให้ติด Sleep เพิ่มขึ้นมาก',
  'When equipped with Steel Arrow, Ranged Weapon Physical Damage +50%.':
    'เมื่อสวมใส่คู่กับ Steel Arrow ได้ Physical Damage ของ Weapon ระยะไกล +50%',
  'When equipped with Triangle Panties, AGI +5, FLEE +10.':
    'เมื่อสวมใส่คู่กับ Triangle Panties ได้ AGI +5, FLEE +10',
  'When equipped with Zealotus Card, ATK +20 and LUK +3.':
    'เมื่อสวมใส่คู่กับ Zealotus Card ได้ ATK +20 และ LUK +3',
  'When Angel’s Blessing, Angel’s Descent, Angel’s Protection, Angel’s Warmth, and Angel’s Kiss are all equipped, HP +900, SP +100,':
    'เมื่อสวมใส่ Angel’s Blessing, Angel’s Descent, Angel’s Protection, Angel’s Warmth และ Angel’s Kiss ครบทุกชิ้น ได้ HP +900, SP +100,',

  // Spell scrolls. One sentence repeated with a different element and skill.
  'Scroll containing a spell crafted from the essence of ancient magical studies. Allows use of the Earth-property magic [Earth Spike] Lv.3.':
    'ม้วนคัมภีร์ที่บรรจุเวทซึ่งสร้างจากแก่นแห่งวิชาเวทโบราณ ใช้เวทธาตุ Earth อย่าง [Earth Spike] Lv.3 ได้',
  'Scroll containing a spell crafted from the essence of ancient magical studies. Allows use of the Fire-property magic [Fire Bolt] Lv.3.':
    'ม้วนคัมภีร์ที่บรรจุเวทซึ่งสร้างจากแก่นแห่งวิชาเวทโบราณ ใช้เวทธาตุ Fire อย่าง [Fire Bolt] Lv.3 ได้',
  'Scroll containing a spell crafted from the essence of ancient magical studies. Allows use of the Fire-property magic Fire Bolt at Lv.5.':
    'ม้วนคัมภีร์ที่บรรจุเวทซึ่งสร้างจากแก่นแห่งวิชาเวทโบราณ ใช้เวทธาตุ Fire อย่าง Fire Bolt ที่ Lv.5 ได้',
  'Scroll containing a spell crafted from the essence of ancient magical studies. Allows use of the Fire-property magic Fire Wall at Lv.5.':
    'ม้วนคัมภีร์ที่บรรจุเวทซึ่งสร้างจากแก่นแห่งวิชาเวทโบราณ ใช้เวทธาตุ Fire อย่าง Fire Wall ที่ Lv.5 ได้',
  'Scroll containing a spell crafted from the essence of ancient magical studies. Allows use of the Ghost-property magic [Soul Strike] Lv.3.':
    'ม้วนคัมภีร์ที่บรรจุเวทซึ่งสร้างจากแก่นแห่งวิชาเวทโบราณ ใช้เวทธาตุ Ghost อย่าง [Soul Strike] Lv.3 ได้',
  'Scroll containing a spell crafted from the essence of ancient magical studies. Allows use of the Ghost-property magic [Soul Strike] Lv.5.':
    'ม้วนคัมภีร์ที่บรรจุเวทซึ่งสร้างจากแก่นแห่งวิชาเวทโบราณ ใช้เวทธาตุ Ghost อย่าง [Soul Strike] Lv.5 ได้',
  'Scroll containing a spell crafted from the essence of ancient magical studies. Allows use of the Water-property magic [Frost Driver] Lv.1.':
    'ม้วนคัมภีร์ที่บรรจุเวทซึ่งสร้างจากแก่นแห่งวิชาเวทโบราณ ใช้เวทธาตุ Water อย่าง [Frost Driver] Lv.1 ได้',
  'Scroll containing a spell crafted from the essence of ancient magical studies. Allows use of the Water-property magic Cold Bolt at Lv.5.':
    'ม้วนคัมภีร์ที่บรรจุเวทซึ่งสร้างจากแก่นแห่งวิชาเวทโบราณ ใช้เวทธาตุ Water อย่าง Cold Bolt ที่ Lv.5 ได้',
  'Scroll containing a spell crafted from the essence of ancient magical studies. Allows use of the Wind-property magic [Lightning Bolt] Lv.3.':
    'ม้วนคัมภีร์ที่บรรจุเวทซึ่งสร้างจากแก่นแห่งวิชาเวทโบราณ ใช้เวทธาตุ Wind อย่าง [Lightning Bolt] Lv.3 ได้',
  'Scroll containing a spell crafted from the essence of ancient magical studies. Allows use of the Wind-property magic Lightning Bolt at Lv.5.':
    'ม้วนคัมภีร์ที่บรรจุเวทซึ่งสร้างจากแก่นแห่งวิชาเวทโบราณ ใช้เวทธาตุ Wind อย่าง Lightning Bolt ที่ Lv.5 ได้',

  // Consumables and gear left over from part 2
  'Ripe fruit picked from the Mastela tree. A vibrant purple fruit with a refreshing taste. Recovers a large amount of HP.':
    'ผลไม้สุกที่เก็บจากต้น Mastela ผลสีม่วงสดรสชาติสดชื่น ฟื้นฟู HP จำนวนมาก',
  'Round orange fruit with refreshing flavor and scent, eaten fresh or used for juice or jam. Recovers a small amount of HP and SP.':
    'ผลไม้ทรงกลมสีส้ม รสและกลิ่นสดชื่น กินสดหรือทำน้ำผลไม้หรือแยมก็ได้ ฟื้นฟู HP และ SP เล็กน้อย',
  'Seed of the Yggdrasil fruit, origin of this world. Gentle, nutty aroma restores one\'s vigor. Recovers half of the user\'s HP and SP.':
    'เมล็ดของผลไม้ Yggdrasil ต้นกำเนิดของโลกนี้ กลิ่นหอมนวลคล้ายถั่วช่วยคืนความกระปรี้กระเปร่า ฟื้นฟู HP และ SP ของผู้ใช้ครึ่งหนึ่ง',
  'Substance collected from honeybees, similar to milk. Known as royal jelly and said to be very nutritious. Cures various Status Ailment (Poison, Curse, Silence, Confusion, Blind) and recovers HP and SP together.':
    'สารที่เก็บจากผึ้ง ลักษณะคล้ายนม รู้จักกันในชื่อนมผึ้งและว่ากันว่ามีคุณค่าทางอาหารสูงมาก รักษาสถานะผิดปกติหลายอย่าง (Poison, Curse, Silence, Confusion, Blind) และฟื้นฟู HP กับ SP ไปพร้อมกัน',
  'Sweet and sticky liquid widely used as food and also medicinal for its high nutritional value. Recovers a small amount of HP and SP.':
    'ของเหลวหวานเหนียวที่ใช้เป็นอาหารอย่างแพร่หลาย และใช้เป็นยาเพราะคุณค่าทางอาหารสูง ฟื้นฟู HP และ SP เล็กน้อย',
  'Sweet and tasty candy. Recovers about 45 HP.': 'ลูกอมรสหวานอร่อย ฟื้นฟู HP ประมาณ 45',
  'Well-cooked meat, looks appetizing. Recovers a small amount of HP.':
    'เนื้อย่างสุกดี ดูน่ากิน ฟื้นฟู HP เล็กน้อย',
  'Staff that converts the user’s mental power into destructive force, guaranteeing fearsome power even with little SP.':
    'คทาที่แปลงพลังจิตของผู้ใช้เป็นแรงทำลาย ให้พลังน่าสะพรึงแม้มี SP น้อย',
  'Strange item that fills you with energy and makes you want to work when equipped.':
    'ไอเทมประหลาดที่เติมพลังให้คุณและทำให้อยากทำงานเมื่อสวมใส่',
  'Unrefined ore containing the metal known as Oridecon, the so-called divine metal. The amount of Oridecon within is small and extremely difficult to refine, making it highly valuable and very rare.':
    'แร่ดิบที่มีโลหะชื่อ Oridecon ซึ่งเรียกกันว่าโลหะแห่งทวยเทพ ปริมาณ Oridecon ในแร่มีน้อยและถลุงยากอย่างยิ่ง จึงมีค่าสูงและหายากมาก',
};

// Batch 4, part 1: flavour text. Proper nouns -- monsters, places, guilds,
// item names -- stay English, because a player matching the page against
// their inventory needs the same string in both places.
const FLAVOUR_TH_2: Record<string, string> = {
  "A baton fitted with a protruding hook, which can be used to disarm an opponent's weapon. Its lethality is low, but it is easy to use.":
    "กระบองที่ติดตะขอยื่นออกมา ใช้ปลดอาวุธคู่ต่อสู้ได้ อานุภาพสังหารต่ำแต่ใช้ง่าย",
  "A bear's foot that has a unique flavor and supposedly has the power to restore male vigor.":
    "อุ้งเท้าหมีรสชาติเฉพาะตัว ว่ากันว่ามีสรรพคุณบำรุงกำลังบุรุษ",
  "A beautiful lock of golden human hair.":
    "ปอยผมมนุษย์สีทองงดงาม",
  "A bird's beak.":
    "จะงอยปากนก",
  "A bird's feather that can be used in decor or in fabric creation.":
    "ขนนกที่ใช้ตกแต่งหรือทำผ้าได้",
  "A birdcage-like cage with a bat trapped inside.":
    "กรงคล้ายกรงนกที่มีค้างคาวติดอยู่ข้างใน",
  "A black cat doll. For some reason, it feels as if it is alive.":
    "ตุ๊กตาแมวดำ ไม่รู้ทำไมถึงรู้สึกเหมือนมันมีชีวิต",
  "A black cloth mask used to cover the face. They say that when worn, even a parent could not recognize their own child.":
    "หน้ากากผ้าสีดำสำหรับปิดหน้า ว่ากันว่าสวมแล้วแม้พ่อแม่ก็จำลูกตัวเองไม่ได้",
  "A black mineral substance that can form steel once it is combined with iron.":
    "แร่สีดำที่เมื่อผสมกับเหล็กแล้วกลายเป็นเหล็กกล้า",
  "A blue-bladed sword imbued with the power of water.":
    "ดาบใบสีน้ำเงินที่อาบด้วยพลังแห่งน้ำ",
  "A blue-green ore imbued with a faint, mesmerizing light.":
    "แร่สีเขียวอมฟ้าที่เปล่งแสงจาง ๆ ชวนต้องมนตร์",
  "A blunt weapon that looks like a single hit could leave your head spinning.":
    "อาวุธทู่ที่ดูแล้วโดนทีเดียวก็หัวหมุน",
  "A bone taken from an undead skeleton.":
    "กระดูกที่เอามาจากโครงกระดูกอันเดด",
  "A bottle of sand that sparkles like the stars and is usually found in witch broom bristles.":
    "ขวดทรายที่เปล่งประกายดั่งดวงดาว มักพบตามขนไม้กวาดของแม่มด",
  "A box that is buried with the dead. It contains precious items pertaining to a dead individual.":
    "หีบที่ฝังไปพร้อมผู้ตาย ภายในบรรจุของมีค่าของผู้ตาย",
  "A braided pigtail that has been cut from the head of a young girl.":
    "เปียถักที่ตัดมาจากศีรษะเด็กหญิง",
  "A broken piece of a shield. It is quite solid and sturdy.":
    "เศษโล่ที่แตกออกมา ยังคงแข็งแรงทนทานอยู่มาก",
  "A broken piece of Dullahan armor. It is very hard.":
    "เศษเกราะของ Dullahan ที่แตกออกมา แข็งมาก",
  "A broken piece of the mask a Tengu wore. It is quite red, and the nose on the mask is especially long and unsightly.":
    "เศษหน้ากากที่ Tengu เคยสวม สีแดงจัด และจมูกบนหน้ากากยาวจนดูไม่งาม",
  "A broken turtle shell. It still sells for a fair price. It seems it was once used in astrology...":
    "กระดองเต่าที่แตกแล้ว ยังขายได้ราคาพอสมควร ดูเหมือนเคยใช้ในการดูดาวมาก่อน...",
  "A bug shell that reflects the colors of the rainbow.":
    "เปลือกแมลงที่สะท้อนสีรุ้ง",
  "A bunch of tough, strong tendons.":
    "มัดเอ็นที่เหนียวและแข็งแรง",
  "A bundle of frog eggs.":
    "กลุ่มไข่กบ",
  "A carnivorous flower with a digestive system that's very much like that of humans.":
    "ดอกไม้กินเนื้อที่มีระบบย่อยอาหารคล้ายมนุษย์มาก",
  "A celestial robe so sheer you can see through it. It is very light and thin, and its fluttering form is beautiful.":
    "อาภรณ์สวรรค์บางจนมองทะลุ เบาและบางมาก ยามพลิ้วไหวงดงามยิ่ง",
  "A ceremonial mask used by an ancient shaman.":
    "หน้ากากพิธีกรรมที่หมอผีโบราณใช้",
  "A chipped, rusted kitchen knife. Here and there are stains of dried blood.":
    "มีดครัวบิ่นและขึ้นสนิม มีคราบเลือดแห้งกระจายอยู่ทั่ว",
  "A Circlet said to be worn by leaders of a certain tribe. The central red gem is rumored to symbolize great authority.":
    "Circlet ที่ว่ากันว่าผู้นำของชนเผ่าหนึ่งสวมใส่ อัญมณีสีแดงตรงกลางลือกันว่าเป็นสัญลักษณ์ของอำนาจอันยิ่งใหญ่",
  "A citrus-colored, bud-shaped stone formed from green live ore.":
    "หินทรงตูมสีส้มอมเหลืองที่เกิดจากแร่ green live",
  "A claw severed from a wolf's paw.":
    "กรงเล็บที่ตัดมาจากอุ้งเท้าหมาป่า",
  "A cloth woven from silk so soft it feels wonderful against the skin.":
    "ผ้าทอจากไหมที่นุ่มจนสัมผัสผิวแล้วรู้สึกดีเหลือเกิน",
  "A clump of monster fur and fuzz that can be used to make thread and fabric.":
    "กระจุกขนมอนสเตอร์ที่ใช้ทำเส้นด้ายและผ้าได้",
  "A collection of thin, long, light dragonfly wings cut and gathered together. It does not look possible to wear them on your back.":
    "ปีกแมลงปอบาง ยาว และเบา ที่ตัดรวบรวมมาไว้ด้วยกัน ดูแล้วคงติดหลังไม่ได้",
  "A common book, but its considerable weight makes it quite painful when used to strike.":
    "หนังสือธรรมดา แต่หนักพอที่จะเจ็บไม่น้อยเมื่อใช้ฟาด",
  "A complete set of corpse's teeth. Well, as complete as it can get.":
    "ชุดฟันศพครบชุด เอาเป็นว่าครบเท่าที่จะครบได้",
  "A crescent-moon-shaped brooch sparkling in gold.":
    "เข็มกลัดทรงจันทร์เสี้ยวเปล่งประกายสีทอง",
  "A cross-shaped bow known for its rapid fire and strong destructive power.":
    "ธนูทรงกากบาทที่ขึ้นชื่อเรื่องยิงรัวและอานุภาพทำลายสูง",
  "A crustacean's claw.":
    "ก้ามของสัตว์เปลือกแข็ง",
  "A crystal made entirely of fine sand.":
    "ผลึกที่เกิดจากเม็ดทรายละเอียดล้วน ๆ",
  "A cubic grain of sand that brightly sparkles.":
    "เม็ดทรายทรงลูกบาศก์ที่เปล่งประกายสดใส",
  "A cuspid pulled out of a cursed orc's mouth.":
    "เขี้ยวที่ถอนมาจากปากออร์คต้องคำสาป",
  "A cuspid wrenched out of from a gruesome orc's jaw.":
    "เขี้ยวที่งัดออกมาจากกรามออร์คน่าขยะแขยง",
  "A cut piece of bamboo. Bamboo is hollow inside, yet famous for growing straight and fast.":
    "ท่อนไม้ไผ่ที่ตัดมา ไผ่กลวงข้างในแต่ขึ้นชื่อเรื่องโตตรงและเร็ว",
  "A dagger with a pitch-black blade.":
    "กริชใบมีดดำสนิท",
  "A dark red, heart-shaped stone formed from red blood ore.":
    "หินทรงหัวใจสีแดงเข้มที่เกิดจากแร่ red blood",
  "A dark-colored Bamboo Hat that hides your eyes when pulled down low.":
    "Bamboo Hat สีเข้มที่กดต่ำแล้วบังตาได้",
  "A dark-colored mask worn by assassins to hide their faces. Putting it on somehow makes your heart feel like it disappears.":
    "หน้ากากสีเข้มที่นักฆ่าสวมปิดหน้า สวมแล้วรู้สึกเหมือนหัวใจหายไปอย่างบอกไม่ถูก",
  "A decaying scale with a horribly offensive odor.":
    "เกล็ดที่กำลังเน่าเปื่อยและส่งกลิ่นเหม็นรุนแรง",
  "A decorative horn broken off a dragon mask. It appears to be carved from wood and painted.":
    "เขาประดับที่หักมาจากหน้ากากมังกร ดูเหมือนแกะจากไม้แล้วทาสี",
  "A decorative stone resembling a cat's eye. It gives off a rare and beautiful light.":
    "หินประดับที่คล้ายตาแมว เปล่งแสงงดงามหาได้ยาก",
  "A deep crimson gemstone that radiates an unknown power.":
    "อัญมณีสีแดงเข้มที่แผ่พลังบางอย่างที่ไม่มีใครรู้จัก",
  "A deep crimson gemstone.":
    "อัญมณีสีแดงเข้ม",
  "A dented cooking pot worn down from years of use. Still usable for meals, and strangely charming in its own way.":
    "หม้อบุบที่ใช้งานมานานปี ยังหุงหาอาหารได้ และมีเสน่ห์ในแบบของมันอย่างประหลาด",
  "A diary kept by a wrongfully imprisoned inmate, filled with notes secretly written out of the guards’ sight.":
    "ไดอารีของนักโทษที่ถูกจองจำอย่างไม่เป็นธรรม เต็มไปด้วยบันทึกที่แอบเขียนลับตาผู้คุม",
  "A doll modeled after a certain girl. It seems to have been made with great care.":
    "ตุ๊กตาที่ทำเลียนแบบเด็กหญิงคนหนึ่ง ดูเหมือนทำขึ้นด้วยความใส่ใจอย่างมาก",
  "A doll modeled after the popular monster Marionette. Wearing it gives a slight chill on top of the head.":
    "ตุ๊กตาที่ทำเลียนแบบมอนสเตอร์ยอดนิยม Marionette สวมแล้วรู้สึกเย็นวาบบนศีรษะเล็กน้อย",
  "A doll that was hung from a rope. Keeping it feels as if it might bring a curse.":
    "ตุ๊กตาที่ถูกแขวนด้วยเชือก เก็บไว้แล้วรู้สึกเหมือนจะนำคำสาปมาให้",
  "A dragon's cuspid that is sharp enough to pierce through dragon scales.":
    "เขี้ยวมังกรที่คมพอจะเจาะทะลุเกล็ดมังกรได้",
  "A dragon's iridescent scale that is tough enough to protect from weather and most forms of harm.":
    "เกล็ดมังกรเหลือบรุ้งที่ทนพอจะกันทั้งดินฟ้าอากาศและภยันตรายเกือบทุกอย่าง",
  "A famous headgear said to have been worn long ago by a heroic woman. Her kick-based fighting once captivated everyone.":
    "เครื่องสวมศีรษะเลื่องชื่อที่ว่ากันว่าวีรสตรีในอดีตเคยสวม ลีลาการต่อสู้ด้วยเท้าของนางเคยตรึงใจผู้คน",
  "A feather that boasts full, lustrous barbs used for making clothes of the highest quality.":
    "ขนนกที่มีแพนขนหนาเป็นเงางาม ใช้ทำเสื้อผ้าคุณภาพสูงสุด",
  "A figure of a hand that contains great religious symbolism.":
    "รูปสลักมือที่แฝงความหมายทางศาสนาอย่างลึกซึ้ง",
  "A flexible, prehensile, and boneless appendage.":
    "รยางค์ไร้กระดูกที่ยืดหยุ่นและใช้จับสิ่งของได้",
  "A fragment of a spear blade that gives off an eerie blue glow.":
    "เศษใบหอกที่เปล่งแสงสีน้ำเงินชวนขนลุก",
  "A fragment of broken stone. It bears a beautiful pattern and is said to sell to stone collectors.":
    "เศษหินที่แตกออกมา มีลวดลายงดงามและว่ากันว่าขายให้นักสะสมหินได้",
  "A freshly cut tongue with a disgusting coating of sticky saliva.":
    "ลิ้นที่เพิ่งถูกตัดมา เคลือบด้วยน้ำลายเหนียวน่าขยะแขยง",
  "A fruit peel known for being slippery when stepped on. Wearing this in battle seems to irritate opponents.":
    "เปลือกผลไม้ที่ขึ้นชื่อว่าเหยียบแล้วลื่น สวมออกรบแล้วดูเหมือนจะกวนประสาทคู่ต่อสู้",
  "A fun lantern made by hollowing out a pumpkin and setting a candle inside, so light shines through its comical face.":
    "โคมสนุก ๆ ที่ทำจากฟักทองคว้านไส้แล้วใส่เทียนไว้ข้างใน แสงจึงลอดออกมาตามหน้าตาตลก ๆ ของมัน",
  "A girl's sock with pretty multicolored stripes.":
    "ถุงเท้าเด็กหญิงลายทางหลากสีน่ารัก",
  "A hammer used blacksmiths for refining.":
    "ค้อนที่ช่างตีเหล็กใช้ตีบวก",
  "A hard and sharp horn.":
    "เขาที่แข็งและแหลมคม",
  "A hard crab shell that smells horrible.":
    "กระดองปูแข็งที่ส่งกลิ่นเหม็นมาก",
  "A hard shell taken from a dead clam.":
    "เปลือกแข็งที่เอามาจากหอยที่ตายแล้ว",
  "A hard shell that's used as protection.":
    "เปลือกแข็งที่ใช้ป้องกันตัว",
  "A hard, spiral shaped shell used by snails.":
    "เปลือกแข็งทรงเกลียวที่หอยทากใช้",
  "A hat modeled after the fierce cat Wild Rose.":
    "หมวกที่ทำเลียนแบบแมวดุร้าย Wild Rose",
  "A hat worn during school graduation ceremonies. Surprisingly firm, and getting struck by its sharp corners is said to bring pain reminiscent of hell.":
    "หมวกที่สวมในพิธีจบการศึกษา แข็งเกินคาด และว่ากันว่าโดนมุมแหลมของมันฟาดแล้วเจ็บราวตกนรก",
  "A Headband that looks like something worn by natives living deep in jungles or remote wilderness.":
    "Headband ที่ดูเหมือนของที่ชนพื้นเมืองในป่าลึกหรือถิ่นทุรกันดารสวมใส่",
  "A headpiece blessed by the guardian angel of Super Novice. Kissing this ornament might feel like receiving an indirect kiss from an angel.":
    "เครื่องสวมศีรษะที่ได้รับพรจากเทวดาผู้พิทักษ์ของ Super Novice จูบเครื่องประดับนี้แล้วอาจรู้สึกเหมือนได้รับจูบทางอ้อมจากเทวดา",
  "A heart constructed entirely out of stone..":
    "หัวใจที่สร้างจากหินล้วน ๆ",
  "A heart that will never stop beating.":
    "หัวใจที่จะไม่มีวันหยุดเต้น",
  "A helmet shaped like a plump, appetizing blue fish. The fishy smell is probably just your imagination.":
    "หมวกทรงปลาสีน้ำเงินอ้วนน่ากิน กลิ่นคาวคงเป็นแค่จินตนาการของคุณ",
  "A helmet worn to prevent worksite accidents. Its rounded design greatly reduces impact and its sturdiness protects the wearer from most hazards.":
    "หมวกที่สวมเพื่อกันอุบัติเหตุในที่ทำงาน ทรงกลมช่วยลดแรงกระแทกได้มาก และความแข็งแรงปกป้องผู้สวมจากอันตรายเกือบทุกอย่าง",
  "A highly valuable token obtainable from the Guild Hideout Dungeon. Used for item exchanges and enchantments.":
    "เหรียญตราล้ำค่าที่ได้จาก Guild Hideout Dungeon ใช้แลกไอเทมและทำ enchant",
  "A hind leg that has been cut from a bug.":
    "ขาหลังที่ตัดมาจากแมลง",
  "A killing whip reinforced with metal beads for greater destructive force, leaving the impression that it could tear off flesh upon impact.":
    "แส้สังหารที่เสริมลูกปัดโลหะเพื่อเพิ่มอานุภาพทำลาย ดูแล้วเหมือนฟาดทีเดียวเนื้อหลุด",
  "A kimono that is old but still quite wearable. Its beautiful pattern and colors captivate any who see it.":
    "กิโมโนเก่าแต่ยังสวมใส่ได้ดี ลวดลายและสีสันงดงามตรึงตาผู้พบเห็น",
  "A kind of small black spirit, with the red ornament on its head as the highlight. Small and cute, it would be popular as a doll.":
    "ภูตดำตัวเล็กชนิดหนึ่ง จุดเด่นคือเครื่องประดับสีแดงบนหัว ตัวเล็กน่ารัก ทำเป็นตุ๊กตาคงขายดี",
  "A knife with unrivaled ability for cutting meat. It is simple to use and widely popular.":
    "มีดที่หั่นเนื้อได้ดีอย่างหาตัวจับยาก ใช้ง่ายและเป็นที่นิยมกว้างขวาง",
  "A large bow that looks difficult to handle.":
    "ธนูขนาดใหญ่ที่ดูใช้ยาก",
  "A large hat worn by a pirate captain. Made oversized to project the captain’s authority, it almost resembles a pirate ship drifting across the sea—though it is quite worn out.":
    "หมวกใบใหญ่ของกัปตันโจรสลัด ทำให้ใหญ่เกินตัวเพื่อแสดงบารมีของกัปตัน ดูเกือบเหมือนเรือโจรสลัดที่ล่องอยู่กลางทะเล แม้จะเก่าไปมากแล้วก็ตาม",
  "A leaf with magical properties. Smokies use this to change form or become invisible.":
    "ใบไม้ที่มีคุณสมบัติเวทมนตร์ Smokie ใช้แปลงร่างหรือล่องหน",
  "A lemon colored ore that contains a pale, greenish light.":
    "แร่สีเลมอนที่ภายในมีแสงเขียวจาง ๆ",
  "A leopard's hide with its spotted pattern well preserved. They say someone once made underwear from it and ruled the jungle.":
    "หนังเสือดาวที่ลายจุดยังคงสมบูรณ์ ว่ากันว่าเคยมีคนเอาไปทำกางเกงในแล้วครองป่าได้",
  "A letter card that seems good for when you first learn your letters. It also seems to be used often for events.":
    "การ์ดตัวอักษรที่ดูเหมาะกับตอนหัดอ่านเขียน และดูเหมือนจะใช้ในอีเวนต์บ่อย ๆ ด้วย",
  "A letter card that seems good for when you first learn your letters. It seems to be used for events.":
    "การ์ดตัวอักษรที่ดูเหมาะกับตอนหัดอ่านเขียน ดูเหมือนจะใช้ในอีเวนต์",
  "A light blue, crystal formed from crystal blue ore.":
    "ผลึกสีฟ้าอ่อนที่เกิดจากแร่ crystal blue",
  "A liquid with interesting characteristics and many possible applications.":
    "ของเหลวที่มีคุณสมบัติน่าสนใจและใช้ประโยชน์ได้หลายทาง",
  "A liquid with unique scientific properties. It's difficult to mix in water and is normally diluted in a solution. Can be diluted to create Counteragent.":
    "ของเหลวที่มีคุณสมบัติทางวิทยาศาสตร์เฉพาะตัว ผสมน้ำยากและปกติต้องเจือจางในสารละลาย เจือจางแล้วใช้ทำ Counteragent ได้",
  "A lock of cut hair with a sleek, glossy shine. Gaze at its luster and your very soul feels like it might slip away.":
    "ปอยผมที่ตัดมา ลื่นเป็นเงางาม จ้องความเงางามของมันแล้วรู้สึกเหมือนวิญญาณจะหลุดลอย",
  "A long cloak made of durable fabric that covers the neck, shoulders, and even the back. It also offers respectable defense.":
    "ผ้าคลุมยาวจากผ้าทนทานที่คลุมทั้งคอ ไหล่ ไปจนถึงหลัง ให้ค่าป้องกันได้พอตัวด้วย",
  "A mace said to be used in a certain sport. Its rounded tip and high-hardness carbon steel raise its lethality.":
    "กระบองที่ว่ากันว่าใช้ในกีฬาชนิดหนึ่ง ปลายมนและเหล็กกล้าคาร์บอนความแข็งสูงยิ่งเพิ่มอานุภาพสังหาร",
  "A malleable, silver-white metal that's very light weight and easy to temper.":
    "โลหะสีขาวเงินที่ตีขึ้นรูปง่าย น้ำหนักเบามากและชุบแข็งง่าย",
  "A manteau so worn out it seems it can no longer be worn.":
    "ผ้าคลุมที่เก่าจนดูเหมือนจะสวมใส่ไม่ได้อีกแล้ว",
  "A marzipan shaped like Poring sits on top.":
    "มาร์ซิแพนทรง Poring วางอยู่ด้านบน",
  "A mask symbolizing Zealotus, the mistress of the Glast Heim Underground Prison. Wearing it gives the unsettling feeling of looking down on humans.":
    "หน้ากากที่เป็นสัญลักษณ์ของ Zealotus เจ้านายแห่ง Glast Heim Underground Prison สวมแล้วรู้สึกชวนอึดอัดราวกับกำลังมองมนุษย์จากเบื้องบน",
  "A mask with a flamboyant pattern, used at festivals.":
    "หน้ากากลายฉูดฉาดที่ใช้ในงานเทศกาล",
  "A miraculous lump of ice that will never melt.":
    "ก้อนน้ำแข็งมหัศจรรย์ที่ไม่มีวันละลาย",
  "A mole's claw that is sturdy enough to dig into the ground.":
    "กรงเล็บตุ่นที่แข็งแรงพอจะขุดลงดินได้",
  "A moustache shaved off an old fairy that has somehow maintained its entire shape and form.":
    "หนวดที่โกนมาจากภูตแก่ ไม่รู้ทำไมถึงยังคงรูปทรงไว้ได้ทั้งชุด",
  "A mysterious necklace that is rumored to possess the power of clairvoyance.":
    "สร้อยคอลึกลับที่ลือกันว่ามีพลังหยั่งรู้",
  "A mysteriously sticky liquid.":
    "ของเหลวเหนียวอย่างลึกลับ",
  "A necklace given by a master once one earns the honor of joining the Assassin Guild.":
    "สร้อยคอที่อาจารย์มอบให้เมื่อได้รับเกียรติเข้าร่วม Assassin Guild",
  "A needle that has snapped and become useless.":
    "เข็มที่หักจนใช้การไม่ได้แล้ว",
  "A one-handed sword popularized by its use by sea adventurers.":
    "ดาบมือเดียวที่นิยมกันขึ้นมาเพราะนักผจญภัยทางทะเลใช้",
  "A one-handed, formal dress sword imbued with fire.":
    "ดาบพิธีการมือเดียวที่อาบด้วยไฟ",
  "A pale green, lightning bolt-shaped stone formed from wind of verdure ore.":
    "หินทรงสายฟ้าสีเขียวอ่อนที่เกิดจากแร่ wind of verdure",
};

// Batch 4, part 2: more flavour text -- monster parts, crafting materials,
// weapons and headgear.
const FLAVOUR_TH_3: Record<string, string> = {
  "A part of a fish's breathing apparatus.":
    "ส่วนหนึ่งของอวัยวะหายใจของปลา",
  "A piece of iron shaped to fit on a horse's hoof for its protection.":
    "แผ่นเหล็กที่ขึ้นรูปให้พอดีกับกีบม้าเพื่อป้องกันกีบ",
  "A piece of nearly transparent fabric.":
    "ผืนผ้าที่เกือบจะโปร่งใส",
  "A piece of steel whose purpose is unknown, though it is clearly used to open and close something.":
    "ชิ้นเหล็กที่ไม่รู้ว่าใช้ทำอะไร แต่ชัดเจนว่าใช้เปิดปิดอะไรบางอย่าง",
  "A piece of wood that looks like it was put out while burning fiercely. No one knows what it is for, but it sells anyway.":
    "ท่อนไม้ที่ดูเหมือนถูกดับตอนกำลังไหม้โชน ไม่มีใครรู้ว่าใช้ทำอะไร แต่ก็ขายได้อยู่ดี",
  "A pinwheel fitted with sharp blades. It appears to be made for killing.":
    "กังหันลมที่ติดใบมีดคม ดูเหมือนทำมาเพื่อสังหาร",
  "A plate baked from yellow clay. It is hard and has a glossy sheen.":
    "จานที่เผาจากดินเหนียวสีเหลือง แข็งและเป็นเงามัน",
  "A portable case with glass panes that allow some contained light to illuminate dark areas.":
    "กล่องพกพาที่มีแผ่นกระจก ให้แสงที่บรรจุไว้ส่องสว่างในที่มืดได้",
  "A potion with a taste somewhere between Red Potion and Blue Potion. Somehow, it reminds you of the Savage roaming the Mjolnir Mountains.":
    "ยาที่รสชาติอยู่กึ่งกลางระหว่าง Red Potion กับ Blue Potion ไม่รู้ทำไมถึงชวนให้นึกถึง Savage ที่เดินอยู่แถบ Mjolnir Mountains",
  "A pouch filled to the brim with Guild Agit Coin.":
    "ถุงที่อัดแน่นไปด้วย Guild Agit Coin",
  "A powder ground from a poisonous toxin. Mixed into water and fed to someone, it would surely cause great suffering.":
    "ผงที่บดจากพิษร้าย ผสมน้ำให้ใครกินคงทรมานไม่น้อย",
  "A prehensile tail from a monkey.":
    "หางลิงที่ใช้เกาะเกี่ยวได้",
  "A premium set of refined cooking instruments. Feels like it could elevate any dish.":
    "ชุดเครื่องครัวชั้นดีที่ประณีต รู้สึกเหมือนจะยกระดับอาหารได้ทุกจาน",
  "A product from the Fantasia Tome Editorial Department’s automaton doll series.":
    "ผลิตภัณฑ์จากซีรีส์ตุ๊กตากลไกของกองบรรณาธิการ Fantasia Tome",
  "A pumpkin with a carved, spooky face.":
    "ฟักทองที่แกะเป็นหน้าตาน่าขนลุก",
  "A putrid, incredibly pungent corpse's nail.":
    "เล็บศพที่เน่าและส่งกลิ่นฉุนอย่างเหลือเชื่อ",
  "A rare, legendary sword in which the soul of a master smith lives on, blending power and beauty.":
    "ดาบในตำนานอันหาได้ยาก ที่วิญญาณของช่างตีดาบผู้ยิ่งใหญ่ยังคงสถิตอยู่ ผสานทั้งพลังและความงาม",
  "A red cloth you can wrap around your neck for warmth.":
    "ผ้าสีแดงที่พันคอไว้ให้อบอุ่นได้",
  "A remarkable whip enhanced with a weighted tip to increase its striking power.":
    "แส้ชั้นเยี่ยมที่เสริมปลายให้หนักขึ้นเพื่อเพิ่มแรงฟาด",
  "A ring placed in a cow's nose so that it can be steered more easily.":
    "ห่วงที่สอดจมูกวัวเพื่อให้บังคับได้ง่ายขึ้น",
  "A root from a tree which can be used to make medicine or rope.":
    "รากไม้ที่ใช้ทำยาหรือทำเชือกได้",
  "A roughly crafted shield made to block simple attacks.":
    "โล่ที่ทำอย่างหยาบ ๆ ไว้กันการโจมตีธรรมดา",
  "A round black pill so bitter-looking you can taste it just by looking.":
    "ยาลูกกลอนสีดำที่ดูขมจนแค่มองก็รู้รส",
  "A round shell that looks like it has been rolled up.":
    "เปลือกทรงกลมที่ดูเหมือนม้วนตัวอยู่",
  "A rounded cloth crown adorned with a jewel on top, radiating a classic sense of dignity.":
    "มงกุฎผ้าทรงมนที่ประดับอัญมณีไว้ด้านบน แผ่ความสง่างามแบบคลาสสิก",
  "A sash said to have been worn by a famous ninja. Its luxurious emblem gives off a mysterious light, as if it holds magical power.":
    "ผ้าคาดเอวที่ว่ากันว่านินจาชื่อดังเคยคาด ตราสัญลักษณ์หรูหราของมันเปล่งแสงลึกลับราวกับมีพลังเวทซ่อนอยู่",
  "A scale that is much sharper than a razor.":
    "เกล็ดที่คมยิ่งกว่ามีดโกนมาก",
  "A self-portrait depicting a young girl. Worn with age, her features are hard to make out, but she seems quite adorable.":
    "ภาพวาดตัวเองของเด็กหญิงคนหนึ่ง เก่าจนหน้าตาดูไม่ค่อยออก แต่ก็ดูน่ารักไม่น้อย",
  "A self-portrait that vividly depicts a distorted expression.":
    "ภาพวาดตัวเองที่ถ่ายทอดสีหน้าบิดเบี้ยวได้อย่างชัดเจน",
  "A set of cooking tools favored by royal court chefs. It feels like it will yield refined dishes.":
    "ชุดเครื่องครัวที่พ่อครัวในราชสำนักนิยมใช้ รู้สึกเหมือนจะทำอาหารได้ประณีต",
  "A set of fat lips cut from a giant deep sea fish.":
    "ริมฝีปากหนาที่ตัดมาจากปลาน้ำลึกยักษ์",
  "A set of hands taken from the face of a clock.":
    "เข็มที่ถอดมาจากหน้าปัดนาฬิกา",
  "A set of long metal rods aligned and fixed together. Found deep underwater, though its purpose remains unknown.":
    "แท่งโลหะยาวที่เรียงและยึดติดกันไว้ พบใต้น้ำลึก แต่ยังไม่รู้ว่าใช้ทำอะไร",
  "A set of tails that used to belong to a nine tailed fox.":
    "หางชุดหนึ่งที่เคยเป็นของจิ้งจอกเก้าหาง",
  "A set of wings cut from a moth.":
    "ปีกที่ตัดมาจากผีเสื้อกลางคืน",
  "A sewing tool used to wind thread for stitching.":
    "อุปกรณ์เย็บผ้าที่ใช้กรอด้ายสำหรับเย็บ",
  "A shard of a broken liquor jar. They say the fragrant, aged scent of liquor on it stirs the hearts of drinkers...":
    "เศษไหเหล้าที่แตก ว่ากันว่ากลิ่นเหล้าบ่มหอมที่ติดอยู่ทำให้นักดื่มใจสั่น...",
  "A sharp claw pulled from a leopard. Being pricked by it would surely sting quite a bit.":
    "กรงเล็บคมที่ดึงมาจากเสือดาว โดนทิ่มคงเจ็บไม่น้อย",
  "A sharp cuspid yanked from some monster's mouth.":
    "เขี้ยวคมที่กระชากมาจากปากมอนสเตอร์ตัวหนึ่ง",
  "A sharp needle from a Muka..":
    "เข็มแหลมจาก Muka",
  "A sharp talon from a bird's foot.":
    "กรงเล็บแหลมจากเท้านก",
  "A sharp, front limb severed from a mantis.":
    "ขาหน้าแหลมคมที่ตัดมาจากตั๊กแตนตำข้าว",
  "A sharp, poisonous fang.":
    "เขี้ยวพิษที่แหลมคม",
  "A sharp, serrated tooth pulled from the mouth of a giant deep sea fish.":
    "ฟันหยักแหลมคมที่ดึงมาจากปากปลาน้ำลึกยักษ์",
  "A shed skin peeling from an earthworm.":
    "คราบที่ลอกออกมาจากไส้เดือน",
  "A shell made from hardened scales that's used as protection.":
    "เปลือกที่เกิดจากเกล็ดแข็งตัว ใช้ป้องกันตัว",
  "A shell that sparkles with dazzling light.":
    "เปลือกที่เปล่งประกายเจิดจ้า",
  "A shimmering, reflective scale.":
    "เกล็ดที่วาววับสะท้อนแสง",
  "A short lock of braided hair.":
    "ปอยผมถักสั้น ๆ",
  "A shuriken that is broken and missing its edge. It is one of the secret weapons said to have been favored by spies of a faraway eastern land.":
    "ชูริเคนที่หักและปลายบิ่น เป็นหนึ่งในอาวุธลับที่ว่ากันว่าสายลับจากดินแดนตะวันออกอันไกลโพ้นนิยมใช้",
  "A simple device made to stir up a breeze. It would be nice to use on a hot day.":
    "อุปกรณ์ง่าย ๆ ที่ทำไว้โบกให้เกิดลม ใช้ในวันที่อากาศร้อนคงดี",
  "A simple knife.":
    "มีดเรียบง่าย",
  "A single scale from a Worm Tail.":
    "เกล็ดหนึ่งชิ้นจาก Worm Tail",
  "A single, functioning cell taken from some monster.":
    "เซลล์ที่ยังทำงานได้หนึ่งเซลล์ ซึ่งเอามาจากมอนสเตอร์ตัวหนึ่ง",
  "A skull-shaped ring whose inner band bears an inscription carved with a sharp blade: 'Even in death, forever...'":
    "แหวนทรงกะโหลกที่ด้านในสลักด้วยใบมีดคมว่า 'แม้ตายไปก็ชั่วนิรันดร์...'",
  "A sky colored ore that glows with the light of the deep ocean depths.":
    "แร่สีฟ้าท้องฟ้าที่เรืองแสงดั่งแสงจากก้นมหาสมุทร",
  "A slightly longer staff designed with power in mind rather than mobility.":
    "คทาที่ยาวกว่าปกติเล็กน้อย ออกแบบโดยเน้นพลังมากกว่าความคล่องตัว",
  "A small one-handed spear that was once also used as a throwing weapon.":
    "หอกมือเดียวขนาดเล็กที่ครั้งหนึ่งเคยใช้เป็นอาวุธขว้างด้วย",
  "A small pouch padded with cotton, made to hold needles.":
    "ถุงเล็กบุสำลี ทำไว้เก็บเข็ม",
  "A small sculpture that serves as the token for every true orc warrior.":
    "รูปสลักเล็ก ๆ ที่เป็นเครื่องหมายของนักรบออร์คแท้ทุกคน",
  "A small stellar crystal, fallen from the heavens.":
    "ผลึกดาวชิ้นเล็กที่ร่วงมาจากฟากฟ้า",
  "A small, pitch-black scrap of cloth. It cannot be seen in dark places.":
    "เศษผ้าชิ้นเล็กสีดำสนิท มองไม่เห็นในที่มืด",
  "A small, sturdy box coated in black lacquer. Said to contain one of the ingredients required to create a God Item.":
    "กล่องเล็กแข็งแรงเคลือบแล็กเกอร์ดำ ว่ากันว่าภายในมีหนึ่งในวัตถุดิบที่ต้องใช้สร้าง God Item",
  "A soft, squishy hat modeled after the hand-shaped mud creature Sting. It seems the creator ignored the wearer’s comfort entirely.":
    "หมวกนุ่มหยุ่นที่ทำเลียนแบบ Sting สัตว์โคลนทรงมือ ดูเหมือนคนทำจะไม่สนใจความสบายของผู้สวมเลยแม้แต่น้อย",
  "A solid, durable shell that's used as protection.":
    "เปลือกแข็งทนทานที่ใช้ป้องกันตัว",
  "A spear made from the corpse of a giant sea beast. Its jagged, saw-like blade can inflict deep wounds.":
    "หอกที่ทำจากซากอสูรทะเลยักษ์ ใบหยักคล้ายเลื่อยของมันสร้างบาดแผลลึกได้",
  "A spear whose curved blade resembles lightning, capable of both slashing and thrusting.":
    "หอกที่ใบโค้งคล้ายสายฟ้า ใช้ได้ทั้งฟันและแทง",
  "A spectacular sword with a blade forged out of meteorite that shines with starlight during the night.":
    "ดาบงามตระการที่ใบหลอมจากอุกกาบาต ยามค่ำคืนจะเปล่งประกายดั่งแสงดาว",
  "A spellbook containing powerful, ancient magic.":
    "ตำราเวทที่บรรจุเวทมนตร์โบราณอันทรงพลัง",
  "A spore discharged from a mushroom.":
    "สปอร์ที่ปล่อยออกมาจากเห็ด",
  "A steamed desert scorpion dish considered one of the four great delicacies of the Sograt Desert, cooked using the heat of the sands.":
    "อาหารแมงป่องทะเลทรายนึ่ง นับเป็นหนึ่งในสี่ของเลิศรสแห่ง Sograt Desert ปรุงด้วยความร้อนจากผืนทราย",
  "A stem from a plant which can be used to make medicine.":
    "ลำต้นของพืชที่ใช้ทำยาได้",
  "A sticky spider's web made of surprisingly strong threadlike fibers.":
    "ใยแมงมุมเหนียวที่ทำจากเส้นใยซึ่งแข็งแรงเกินคาด",
  "A sticky, unpleasant lump of mud.":
    "ก้อนโคลนเหนียวน่ารังเกียจ",
  "A stinger from a hornet or bee.":
    "เหล็กในจากต่อหรือผึ้ง",
  "A stone engraved with ancient hieroglyphs.":
    "หินที่สลักอักษรภาพโบราณ",
  "A stone tablet said to be inscribed with words of wisdom.":
    "แผ่นศิลาที่ว่ากันว่าจารึกถ้อยคำแห่งปัญญาไว้",
  "A string instrument found around Payon, Amatsu, and Louyang. Its playing technique has been lost, and it is said no one can play it properly today.":
    "เครื่องสายที่พบแถบ Payon, Amatsu และ Louyang วิธีบรรเลงสูญหายไปแล้ว ว่ากันว่าทุกวันนี้ไม่มีใครเล่นมันได้อย่างถูกต้อง",
  "A stringed instrument that produces sound by plucking the strings with the fingers.":
    "เครื่องสายที่ให้เสียงด้วยการดีดสายด้วยนิ้ว",
  "A striped uniform worn by prisoners, faintly stained with what looks like old blood.":
    "ชุดลายทางที่นักโทษสวมใส่ มีคราบจาง ๆ ที่ดูเหมือนเลือดเก่า",
  "A sword with a formless blade that seems both to exist and not exist. It attacks and breaks down the target's spirit.":
    "ดาบที่ใบไร้รูปร่าง ดูเหมือนมีอยู่และไม่มีอยู่ในเวลาเดียวกัน มันโจมตีและบั่นทอนจิตวิญญาณของเป้าหมาย",
  "A symbol which represents evil.":
    "สัญลักษณ์ที่แทนความชั่วร้าย",
  "A tail cut off from a dragon that, sadly, will never grow back.":
    "หางที่ตัดมาจากมังกร น่าเสียดายที่มันจะไม่งอกใหม่อีก",
  "A tail severed from a fish.":
    "หางที่ตัดมาจากปลา",
  "A talisman bearing the Taegeuk symbol at its center, ringed by the eight trigrams. In the old days it was used in geomancy and the like.":
    "ยันต์ที่มีสัญลักษณ์ Taegeuk อยู่ตรงกลาง ล้อมด้วยแปดตรีลักษณ์ สมัยก่อนใช้ในวิชาดูฮวงจุ้ยและอื่น ๆ",
  "A thick, sharpened fingernail from an orc.":
    "เล็บหนาที่ลับคมแล้วจากออร์ค",
  "A thin rat's tail.":
    "หางหนูเรียวบาง",
  "A tiger's paw that supposedly has the power to restore male vigor.":
    "อุ้งเท้าเสือที่ว่ากันว่ามีสรรพคุณบำรุงกำลังบุรุษ",
  "A token which shows a knight's loyalty to his lord.":
    "เครื่องหมายที่แสดงความภักดีของอัศวินต่อเจ้านาย",
  "A tough, sharp jaw from an ant.":
    "กรามมดที่แข็งและคม",
  "A tough, woody shelled nut from an oak tree.":
    "ผลเปลือกแข็งเนื้อไม้จากต้นโอ๊ก",
  "A traditional skirt that symbolizes virginity.":
    "กระโปรงตามประเพณีที่เป็นสัญลักษณ์ของความบริสุทธิ์",
  "A treasured T-shirt once worn by a certain witch, featuring a rabbit design she was fond of.":
    "เสื้อยืดล้ำค่าที่แม่มดคนหนึ่งเคยสวม มีลายกระต่ายที่นางชื่นชอบ",
  "A tree trunk of wood that is nice and solid.":
    "ท่อนไม้ที่เนื้อดีและแน่น",
  "A tree trunk of wood that is pretty low quality.":
    "ท่อนไม้ที่คุณภาพค่อนข้างต่ำ",
  "A tree trunk of wood with an excellent grain.":
    "ท่อนไม้ที่ลายเนื้อไม้สวยเยี่ยม",
  "A two-handed axe that demonstrates its true power in group combat.":
    "ขวานสองมือที่แสดงพลังแท้จริงในการรบหมู่",
  "A valuable metal in bullion form. It's used to make coins, jewelry, and gaudy false teeth.":
    "โลหะมีค่าในรูปแท่ง ใช้ทำเหรียญ เครื่องประดับ และฟันปลอมฉูดฉาด",
  "A very light, non-toxic metal used for refining and toughening armor.":
    "โลหะไร้พิษที่เบามาก ใช้ตีบวกและเสริมความทนทานให้เกราะ",
  "A very sturdy helmet made of bone. Though heavy and difficult to wear, its defensive capability is exceptional.":
    "หมวกกระดูกที่แข็งแรงมาก แม้จะหนักและสวมใส่ยาก แต่ความสามารถในการป้องกันนั้นยอดเยี่ยม",
  "A vessel woven from plant stems. After washing it with water, it must be dried in the sun.":
    "ภาชนะที่สานจากลำต้นพืช ล้างน้ำแล้วต้องตากแดดให้แห้ง",
  "A viscous plant substance used in the production of certain types of goods.":
    "สารเหนียวจากพืชที่ใช้ผลิตสินค้าบางประเภท",
  "A vivid red ore that glows from inside with an orange yellow light.":
    "แร่สีแดงสดที่เรืองแสงสีเหลืองส้มออกมาจากภายใน",
  "A weapon said to be made from the claw of Garm, gatekeeper of the underworld. It is always stained with blood.":
    "อาวุธที่ว่ากันว่าทำจากกรงเล็บของ Garm ผู้เฝ้าประตูยมโลก มันเปื้อนเลือดอยู่เสมอ",
  "A weapon so thin and astonishingly sharp it looks able to pry into the gap of any armor.":
    "อาวุธที่บางและคมอย่างน่าทึ่ง ดูเหมือนจะงัดเข้าไปตามช่องว่างของเกราะใดก็ได้",
  "A webbed foot cut from a monster's hind leg.":
    "เท้าพังผืดที่ตัดมาจากขาหลังของมอนสเตอร์",
  "A weird organic clump which is the brain of a Marine Sphere.":
    "ก้อนอินทรีย์ประหลาดซึ่งเป็นสมองของ Marine Sphere",
  "A whip made by twisting several thin whips into one, with an excellent feel as it coils on a strike.":
    "แส้ที่ทำจากแส้เส้นเล็กหลายเส้นบิดรวมกัน สัมผัสยอดเยี่ยมเวลามันพันตัวตอนฟาด",
  "A whip made entirely of iron.":
    "แส้ที่ทำจากเหล็กล้วน",
  "A widely known blessed metal to be used for refining and strengthening a weapon.":
    "โลหะศักดิ์สิทธิ์ที่รู้จักกันแพร่หลาย ใช้ตีบวกและเสริมความแข็งแกร่งให้อาวุธ",
  "A woody stem from a tree that's useful for lumber.":
    "ลำต้นเนื้อไม้ที่ใช้เป็นไม้แปรรูปได้ดี",
  "A worn, tattered page torn from an old book.":
    "หน้ากระดาษเก่าขาดยับที่ฉีกมาจากหนังสือเล่มเก่า",
  "Accessory pinned to clothing that brings out a bright, lively charm.":
    "Accessory ที่กลัดกับเสื้อผ้า ช่วยขับเสน่ห์สดใสมีชีวิตชีวา",
  "Accessory that expresses a whistle in costume form. Said to help relieve stress and calm the mind whenever you blow it.":
    "Accessory ที่ทำนกหวีดออกมาในรูปแบบคอสตูม ว่ากันว่าเป่าทีไรก็ช่วยคลายเครียดและทำให้ใจสงบ",
  "Accessory that, on closer inspection, has a small hole made for inserting something.":
    "Accessory ที่พอดูใกล้ ๆ จะเห็นรูเล็ก ๆ ทำไว้สำหรับเสียบอะไรบางอย่าง",
  "Accessory used to tie and hold hair in place, with a small ribbon on top that emphasizes cuteness.":
    "Accessory ที่ใช้มัดและรวบผมให้อยู่ทรง ด้านบนมีโบว์เล็ก ๆ ที่ขับความน่ารัก",
  "Adorable hairpin shaped after the vibrant wings of a blue butterfly.":
    "กิ๊บติดผมน่ารักทรงปีกผีเสื้อสีน้ำเงินสดใส",
  "Adorable panda-like hat that makes you imagine yourself snacking on bamboo leaves the moment you wear it. Surprisingly popular among women.":
    "หมวกคล้ายแพนด้าน่ารัก สวมปุ๊บก็นึกภาพตัวเองกำลังแทะใบไผ่ ได้รับความนิยมในหมู่ผู้หญิงเกินคาด",
  "Afro-style hat made for cheerful summer days.":
    "หมวกทรงแอฟโฟรที่ทำมาเพื่อวันฤดูร้อนสดใส",
};

// Every dictionary in the file, in one list. A chunk that is declared but
// never listed here seeds nothing and reports nothing -- which is exactly
// what FLAVOUR_TH_3 did until this list replaced a hand-written call per
// dictionary inside main().
// Batch 4, part 3. `Armor gains <element>-Property property.` keeps both the
// equip slot and the element in English, like every other line that names
// them.
const FLAVOUR_TH_4: Record<string, string> = {
  "All-purpose armor cast from solid metal and shaped to fit the wearer.":
    "เกราะอเนกประสงค์ที่หล่อจากโลหะตันและขึ้นรูปให้พอดีกับผู้สวมใส่",
  "All-purpose two-handed sword engineered for reliable use in any situation.":
    "ดาบสองมืออเนกประสงค์ที่ออกแบบให้ใช้ได้อย่างมั่นใจในทุกสถานการณ์",
  "All-weather outfit crafted for travelers.":
    "ชุดที่ทำมาสำหรับนักเดินทาง ใช้ได้ทุกสภาพอากาศ",
  "also known by its nickname, the Magical Triangle Hood.":
    "หรือที่รู้จักกันในชื่อเล่นว่า Magical Triangle Hood",
  "An adventurer's suit that maximizes both defense and comfort.":
    "ชุดนักผจญภัยที่ให้ทั้งการป้องกันและความสบายสูงสุด",
  "An air of desperation can be felt—":
    "สัมผัสได้ถึงความสิ้นหวังที่แผ่ออกมา—",
  "An ancient ring.":
    "แหวนโบราณ",
  "An antenna that is extremely hard and sharply honed. Its pointed tip is polished like a blade.":
    "หนวดที่แข็งมากและลับจนคม ปลายแหลมของมันขัดเงาราวกับใบมีด",
  "An apple loved by Picky Poring.":
    "แอปเปิลที่ Picky Poring ชื่นชอบ",
  "An apron worn by the Alice monster.":
    "ผ้ากันเปื้อนที่มอนสเตอร์ Alice สวมใส่",
  "An electric Guitar designed in the shape of a Phen.":
    "กีตาร์ไฟฟ้าที่ออกแบบเป็นรูปทรง Phen",
  "An emblem given to an orc warrior that is proof of his heroism.":
    "ตราสัญลักษณ์ที่มอบให้นักรบออร์ค เป็นเครื่องพิสูจน์ความกล้าหาญของเขา",
  "An emblem said to be used by those who love to run fast. Just wearing it makes you want to dash off somewhere.":
    "ตราสัญลักษณ์ที่ว่ากันว่าคนรักการวิ่งเร็วใช้กัน แค่สวมก็อยากออกวิ่งไปที่ไหนสักแห่ง",
  "An expensive ring made of gold. Since ancient times, gold has symbolized unchanging love.":
    "แหวนทองราคาแพง ตั้งแต่โบราณกาล ทองเป็นสัญลักษณ์ของรักที่ไม่แปรเปลี่ยน",
  "An impure ore that forms iron after being refined.":
    "แร่ไม่บริสุทธิ์ที่ถลุงแล้วได้เหล็ก",
  "An iron and carbon alloy known for its structural durability.":
    "โลหะผสมเหล็กกับคาร์บอนที่ขึ้นชื่อเรื่องความทนทานของโครงสร้าง",
  "An iron chain so tangled it cannot be undone.":
    "โซ่เหล็กที่พันกันยุ่งจนแก้ไม่ออก",
  "An old rope, rotted and snapped. It feels like it would crumble at a touch.":
    "เชือกเก่าที่ผุและขาด รู้สึกเหมือนแตะแล้วจะยุ่ยทันที",
  "An Old Scroll filled with unfamiliar writing when unrolled.":
    "Old Scroll ที่คลี่ออกมาแล้วเต็มไปด้วยตัวอักษรที่ไม่คุ้นตา",
  "An old, battered frying pan no longer suitable for cooking.":
    "กระทะเก่าบุบจนใช้ทำอาหารไม่ได้แล้ว",
  "An old, rusted shuriken. Shuriken enthusiasts quietly buy them up.":
    "ชูริเคนเก่าขึ้นสนิม พวกคนคลั่งชูริเคนแอบกว้านซื้อกัน",
  "An old, used prison uniform.":
    "ชุดนักโทษเก่าที่ผ่านการใช้งานมาแล้ว",
  "An unpleasantly sticky, translucent green liquid.":
    "ของเหลวสีเขียวโปร่งแสงที่เหนียวจนน่ารำคาญ",
  "Ancient box emitting a mysterious blue glow. Something might be inside when opened.":
    "หีบโบราณที่เปล่งแสงสีน้ำเงินลึกลับ เปิดออกมาอาจมีอะไรอยู่ข้างใน",
  "Animal droppings, dung… Hard to call it by name, so it is simply called Poo Poo Hat.":
    "มูลสัตว์ อุจจาระ… เรียกชื่อตรง ๆ ก็กระดากปาก เลยเรียกกันสั้น ๆ ว่า Poo Poo Hat",
  "Animal droppings… poop… too unspeakable to say aloud, so it’s simply called Poo Poo Hat.":
    "มูลสัตว์… อุจจาระ… พูดออกมาดัง ๆ ก็กระดากเกินไป เลยเรียกกันสั้น ๆ ว่า Poo Poo Hat",
  "Animal hide that can be used in making clothes, coverings or bedding.":
    "หนังสัตว์ที่ใช้ทำเสื้อผ้า ผ้าคลุม หรือเครื่องนอนได้",
  "Antennae that serve as sensory organs for insects.":
    "หนวดที่เป็นอวัยวะรับสัมผัสของแมลง",
  "Apple juice stored in a bottle. Easier to drink and restores better than eating the fruit itself.":
    "น้ำแอปเปิลบรรจุขวด ดื่มง่ายและฟื้นฟูได้ดีกว่ากินผลสด",
  "Apple made famous when a legendary marksman of old shot it cleanly off his son's head.":
    "แอปเปิลที่โด่งดังขึ้นมาเมื่อนักแม่นธนูในตำนานยิงมันหลุดจากหัวลูกชายตัวเองได้อย่างแม่นยำ",
  "Argioph draped over the head, occasionally wriggling intensely.":
    "Argioph ที่คลุมอยู่บนหัว บางครั้งก็ดิ้นแรง",
  "Armor gains Earth-Property property.":
    "Armor ได้คุณสมบัติธาตุ Earth",
  "Armor gains Fire-Property property.":
    "Armor ได้คุณสมบัติธาตุ Fire",
  "Armor gains Poison-Property property.":
    "Armor ได้คุณสมบัติธาตุ Poison",
  "Armor gains Shadow-Property property.":
    "Armor ได้คุณสมบัติธาตุ Shadow",
  "Armor gains Undead property.":
    "Armor ได้คุณสมบัติ Undead",
  "Armor gains Water-Property property.":
    "Armor ได้คุณสมบัติธาตุ Water",
  "Armor gains Wind-Property property.":
    "Armor ได้คุณสมบัติธาตุ Wind",
  "Armor is never destroyed.":
    "Armor ไม่มีวันแตก",
  "Armor once worn by members of the Knight of Honor.":
    "Armor ที่สมาชิกของ Knight of Honor เคยสวมใส่",
  "Arrow carved from solid rock, imbued with the power of earth.":
    "ลูกธนูที่สลักจากหินตัน อาบด้วยพลังแห่งปฐพี",
  "Arrow made of Steel, boasting high attack power.":
    "ลูกธนูที่ทำจาก Steel มีพลังโจมตีสูง",
  "Arrow with an oil-soaked wad wrapped around the tip so it can be lit and fired.":
    "ลูกธนูที่พันปุยชุบน้ำมันไว้ที่ปลาย จุดไฟแล้วยิงได้",
  "Assassination dagger said to have been favored by Assassin Class.":
    "กริชลอบสังหารที่ว่ากันว่า Assassin Class นิยมใช้",
  "Axe said to drive its wielder to seek blood, making them strangely excited and restless in search of enemies.":
    "ขวานที่ว่ากันว่าผลักดันผู้ถือให้กระหายเลือด ตื่นเต้นและกระวนกระวายอย่างประหลาดเพื่อตามหาศัตรู",
  "Axe soaked with blood from countless swings on the battlefield, radiating a murderous aura that terrifies foes facing its edge.":
    "ขวานที่ชุ่มเลือดจากการฟาดนับครั้งไม่ถ้วนในสนามรบ แผ่ไอสังหารที่ทำให้ศัตรูซึ่งเผชิญคมของมันหวาดกลัว",
  "Bandana bearing the skull symbol of sea pirates, said to grant courage to the wearer.":
    "ผ้าโพกที่มีสัญลักษณ์หัวกะโหลกของโจรสลัด ว่ากันว่ามอบความกล้าให้ผู้สวมใส่",
  "Beard that instantly lends a heavy, dignified air to its wearer the moment it is put on.":
    "เคราที่พอสวมปุ๊บก็ทำให้ผู้สวมดูหนักแน่นสง่างามขึ้นทันที",
  "Beautiful cross-shaped ornament blessed by the gods, a rosary.":
    "เครื่องประดับทรงกางเขนอันงดงามที่ได้รับพรจากทวยเทพ หรือลูกประคำ",
  "Beautiful helmet adorned with gemstones; said to excel at defending against magic due to the mysterious resonance between the stones.":
    "หมวกเกราะงดงามที่ประดับด้วยอัญมณี ว่ากันว่าป้องกันเวทได้ดีเยี่ยมเพราะการสั่นพ้องอันลึกลับระหว่างเม็ดหิน",
  "Beautiful wing-shaped hat made by attaching angel feathers to a Headband; the feel of Soft Feather lifts the mood, making movements feel light and cheerful.":
    "หมวกทรงปีกอันงดงามที่ทำโดยติดขนนกเทวดาเข้ากับ Headband สัมผัสของ Soft Feather ช่วยยกอารมณ์ ทำให้เคลื่อนไหวเบาและสดใส",
  "Being made of solid rock, it is naturally heavy—and getting struck by it would make it hard for anyone to stay conscious.":
    "เพราะทำจากหินตัน มันจึงหนักเป็นธรรมดา และโดนมันฟาดเข้าไปคงยากที่ใครจะยังมีสติอยู่",
  "Bell made of gold. Produces an exquisitely clear sound.":
    "ระฆังที่ทำจากทอง ให้เสียงใสกังวานอย่างวิเศษ",
  "Belt worn around the body.":
    "เข็มขัดที่คาดรอบตัว",
  "Best consumed with water to avoid choking.":
    "ควรกินพร้อมน้ำเพื่อไม่ให้ติดคอ",
  "Beverage made from the juice of a fruit called Orange. Monster Drops loves it.":
    "เครื่องดื่มที่ทำจากน้ำของผลไม้ชื่อ Orange มอนสเตอร์ Drops ชอบมาก",
  "Bird perched on a branch, singing happily.":
    "นกที่เกาะอยู่บนกิ่งไม้ ร้องเพลงอย่างมีความสุข",
  "Black blade tainted by darkness, said to repel even light. Only the blade remains, yet it is so sharp that even the slightest touch can cut deeply.":
    "ใบมีดดำที่ถูกความมืดแปดเปื้อน ว่ากันว่าผลักไสแม้กระทั่งแสง เหลือเพียงใบมีด แต่คมจนแค่สัมผัสเบา ๆ ก็บาดลึก",
  "Black butterfly-shaped leather mask that somehow gives off a risqué feeling when you look at it. Likely used to give people a good scare.":
    "หน้ากากหนังทรงผีเสื้อสีดำที่มองแล้วให้ความรู้สึกวาบหวิวอย่างบอกไม่ถูก คงใช้ไว้หลอกคนให้ตกใจเล่น",
  "Black glasses that shield the eyes from harsh light and serve as a universally stylish fashion item.":
    "แว่นดำที่กันแสงจ้าให้ดวงตา และเป็นแฟชั่นที่เข้ากับทุกคน",
  "Black ladle made from a special material, light yet sturdy.":
    "ทัพพีสีดำที่ทำจากวัสดุพิเศษ เบาแต่แข็งแรง",
  "Black-colored dye that is made from a variable mixture of ground herbs.":
    "สีย้อมสีดำที่ทำจากสมุนไพรบดผสมกันในสัดส่วนที่ไม่ตายตัว",
  "Blind individual unable to distinguish objects. Easily deceived due to inability to see.":
    "คนตาบอดที่แยกแยะสิ่งของไม่ได้ ถูกหลอกง่ายเพราะมองไม่เห็น",
  "Blue Fish that shines like the sea. Said to be good for health.":
    "Blue Fish ที่เปล่งประกายดั่งท้องทะเล ว่ากันว่าดีต่อสุขภาพ",
  "Blue headband worn at a slight angle, catching the eye with its pretty shape.":
    "ผ้าคาดผมสีน้ำเงินที่คาดเอียงเล็กน้อย สะดุดตาด้วยทรงที่สวยงาม",
  "Blue pencil chewed so much that bite marks cover its surface.":
    "ดินสอสีน้ำเงินที่ถูกกัดจนรอยฟันเต็มไปทั้งแท่ง",
  "Blue Potion made only from the youngest leaves of organic blue herbs, giving it a refreshing taste.":
    "Blue Potion ที่ทำจากใบอ่อนที่สุดของ blue herb ออร์แกนิกเท่านั้น จึงมีรสสดชื่น",
  "Blue-painted Orc emblem, seemingly indicating higher status among Orcs.":
    "ตราสัญลักษณ์ Orc ที่ทาสีน้ำเงิน ดูเหมือนบ่งบอกสถานะที่สูงกว่าในหมู่ Orc",
  "Blunt weapon formed from several interlinked chains, delivering considerable impact and a strangely satisfying feeling upon strike.":
    "อาวุธทู่ที่เกิดจากโซ่หลายเส้นคล้องต่อกัน ให้แรงกระแทกไม่น้อยและความรู้สึกสะใจอย่างประหลาดเวลาฟาด",
  "Book in which a great sage recorded his enlightenment in the form of a diary.":
    "หนังสือที่ปราชญ์ผู้ยิ่งใหญ่บันทึกการตื่นรู้ของตนไว้ในรูปแบบไดอารี",
  "Book said to be imbued with the dry, cutting gale that carries not a trace of moisture.":
    "หนังสือที่ว่ากันว่าอาบด้วยลมกรรโชกแห้งเฉียบที่ไม่มีความชื้นแม้แต่น้อย",
  "Book said to be imbued with the power of earth that shakes and splits the very ground.":
    "หนังสือที่ว่ากันว่าอาบด้วยพลังปฐพีที่สั่นสะเทือนและแยกผืนดินออกจากกัน",
  "Book said to be imbued with the power of rough waves surging across the great ocean.":
    "หนังสือที่ว่ากันว่าอาบด้วยพลังคลื่นเชี่ยวที่ซัดข้ามมหาสมุทรอันกว้างใหญ่",
  "Book said to contain sacred scripture, its hefty weight allowing it to deliver powerful blows.":
    "หนังสือที่ว่ากันว่าบรรจุคัมภีร์ศักดิ์สิทธิ์ น้ำหนักอันมากของมันทำให้ฟาดได้หนักหน่วง",
  "Book said to contain the blazing heat of the sun, hot enough to melt Steel.":
    "หนังสือที่ว่ากันว่าบรรจุความร้อนแผดเผาของดวงอาทิตย์ ร้อนพอจะหลอม Steel ได้",
  "Boots designed to cover the ankles, crafted with mobility in mind.":
    "รองเท้าบูตที่ออกแบบให้หุ้มข้อเท้า ทำขึ้นโดยคำนึงถึงความคล่องตัว",
  "Bottled black fluid often used as a method of self defence by squid creatures.":
    "ของเหลวสีดำบรรจุขวด ที่พวกหมึกมักใช้ป้องกันตัว",
  "Bottled powder from the wings of a moth.":
    "ผงจากปีกผีเสื้อกลางคืนบรรจุขวด",
  "Bow said to have been favored by hunters. Though difficult to master, its precision and destructive power are more than enough to captivate anyone who learns to use it.":
    "ธนูที่ว่ากันว่าพรานนิยมใช้ แม้จะฝึกให้ชำนาญได้ยาก แต่ความแม่นยำและอานุภาพทำลายของมันก็มากพอจะตรึงใจใครก็ตามที่ใช้เป็น",
  "Bow used by Orc Archer, looking extremely large and powerful.":
    "ธนูที่ Orc Archer ใช้ ดูใหญ่และทรงพลังอย่างยิ่ง",
  "Box containing a gift when opened. What it holds cannot be known until the moment it is opened.":
    "กล่องที่เปิดออกมาแล้วมีของขวัญอยู่ข้างใน จะรู้ว่ามีอะไรก็ต่อเมื่อเปิดเท่านั้น",
  "Bracelet that looks magnificent yet somehow sorrowful. Monster Isis loves it.":
    "กำไลที่ดูงามสง่าแต่ก็แฝงความเศร้าอย่างบอกไม่ถูก มอนสเตอร์ Isis ชอบมาก",
  "Branch of an ancient tree that has gained magical power over countless ages. Its mysterious force can summon a living being.":
    "กิ่งไม้จากต้นไม้โบราณที่สั่งสมพลังเวทมาตลอดกาลอันยาวนาน พลังลึกลับของมันเรียกสิ่งมีชีวิตออกมาได้",
  "Brilliant metal shining with dazzling light. Ancient manuscripts say it appears before one who can change this world’s fate, accompanying their destiny.":
    "โลหะเจิดจ้าที่เปล่งแสงพร่างพราย ตำราโบราณว่ามันจะปรากฏต่อหน้าผู้ที่เปลี่ยนชะตาของโลกนี้ได้ และร่วมทางไปกับชะตาของผู้นั้น",
  "Brings back memories of hot summer days from childhood.":
    "ชวนให้นึกถึงวันฤดูร้อนอันร้อนระอุในวัยเด็ก",
  "Bristly, tough hair cut from a wild boar.":
    "ขนแข็งหยาบที่ตัดมาจากหมูป่า",
  "Broad crescent-shaped sword with a rounded blade.":
    "ดาบทรงจันทร์เสี้ยวใบกว้างที่คมโค้งมน",
  "Broken sword cracked beyond further use. Nearly a piece of scrap Cheol-i.":
    "ดาบหักที่ร้าวจนใช้ต่อไม่ได้ แทบจะเป็นเศษ Cheol-i แล้ว",
  "Brown plant root still covered in soil.":
    "รากพืชสีน้ำตาลที่ยังมีดินติดอยู่",
  "Butterfly wing powder that sparkles in the wind.":
    "ผงปีกผีเสื้อที่เปล่งประกายในสายลม",
  "Can be diluted to create Mixture.":
    "เจือจางแล้วใช้ทำ Mixture ได้",
  "Can be refined into the mineral known as Flame Heart.":
    "ถลุงแล้วได้แร่ที่เรียกว่า Flame Heart",
  "Can be refined into the mineral known as Great Nature.":
    "ถลุงแล้วได้แร่ที่เรียกว่า Great Nature",
  "Can be refined into the mineral known as Mystic Frozen.":
    "ถลุงแล้วได้แร่ที่เรียกว่า Mystic Frozen",
  "Can be refined into the mineral known as Rough Wind.":
    "ถลุงแล้วได้แร่ที่เรียกว่า Rough Wind",
  "Can be refined to obtain pure iron.":
    "ถลุงแล้วได้เหล็กบริสุทธิ์",
  "Can be refined together with iron to produce Steel.":
    "ถลุงร่วมกับเหล็กแล้วได้ Steel",
  "Can be used to craft powerful weapons and armor.":
    "ใช้สร้างอาวุธและเกราะอันทรงพลังได้",
  "Cardigan of the angel in charge of Super Novice. Once worn, the warmth it provides makes it feel like you would not catch a cold even if you slept outdoors.":
    "คาร์ดิแกนของเทวดาผู้ดูแล Super Novice พอสวมแล้วความอบอุ่นที่ได้ทำให้รู้สึกเหมือนนอนกลางแจ้งก็ไม่เป็นหวัด",
  "Carrot shimmering with rainbow colors. Gentle fragrance is captivating. Monster Lunatic loves it.":
    "แครอทที่วาววับด้วยสีรุ้ง กลิ่นหอมอ่อน ๆ ชวนหลงใหล มอนสเตอร์ Lunatic ชอบมาก",
  "Ceremonial sword said to have been used by a spirit priest who guided the dead. Unsuitable to use as an actual weapon.":
    "ดาบพิธีกรรมที่ว่ากันว่านักบวชผู้นำทางดวงวิญญาณเคยใช้ ไม่เหมาะจะใช้เป็นอาวุธจริง",
};

const DICTIONARIES: ReadonlyArray<[Record<string, string>, Kind]> = [
  [EFFECT_TH, 'effect'],
  [EFFECT_TH_2, 'effect'],
  [EFFECT_TH_3, 'effect'],
  [EFFECT_TH_4, 'effect'],
  [EFFECT_TH_5, 'effect'],
  [FLAVOUR_TH, 'flavour'],
  [FLAVOUR_TH_2, 'flavour'],
  [FLAVOUR_TH_3, 'flavour'],
  [FLAVOUR_TH_4, 'flavour'],
];

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

  for (const [map, kind] of DICTIONARIES) add(map, kind);

  const { error } = await db
    .from('item_description_lines')
    .upsert(rows, { onConflict: 'source_line' });
  if (error) throw new Error(`Failed to seed item_description_lines: ${error.message}`);

  console.log(`seeded ${rows.length} lines, covering ${covered} occurrences`);
  const byKind = (k: Kind) =>
    DICTIONARIES.filter(([, kind]) => kind === k).reduce((n, [m]) => n + Object.keys(m).length, 0);
  console.log(`  ${byKind('effect')} effect, ${byKind('flavour')} flavour`);
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
