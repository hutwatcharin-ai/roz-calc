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
  add(EFFECT_TH_3, 'effect');
  add(EFFECT_TH_4, 'effect');
  add(FLAVOUR_TH, 'flavour');

  const { error } = await db
    .from('item_description_lines')
    .upsert(rows, { onConflict: 'source_line' });
  if (error) throw new Error(`Failed to seed item_description_lines: ${error.message}`);

  console.log(`seeded ${rows.length} lines, covering ${covered} occurrences`);
  console.log(
    `  ${Object.keys(EFFECT_TH).length + Object.keys(EFFECT_TH_2).length + Object.keys(EFFECT_TH_3).length + Object.keys(EFFECT_TH_4).length} effect, ` +
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
