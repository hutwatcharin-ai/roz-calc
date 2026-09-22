// Monk guide. Drafted 22 Sep 2026 from Downloads/roz-job-guides/monk.md and,
// for the 1-50 part, acolyte.md, checked against the Ryan Geldun and
// TakoyakiCh transcripts. There is no Monk guide clip for Zero Global yet: the
// only Zero footage is Taiwan-server play that Ryan Geldun reacts to, so the
// page says plainly where a build has no skill order or stats. Clips that turn
// out to be classic RO or another game (NCZ ROC, Landverse, GGT) are left out.
import type { ClassGuide } from './types';

export const monk: ClassGuide = {
  slug: 'monk',
  job: 'Monk',
  jobTh: 'มังค์',
  from: 'Acolyte',
  gathered: '22 ก.ย. 2026',
  summary:
    'อาชีพสองของ Acolyte สายหมัดกับลูกแก้ว มีสองแนวที่เห็นในฟุตเทจเซิร์ฟไต้หวัน: Guillotine Fist ตีบอสทีเดียวจบ กับสายคอมโบเปิดบอทเก็บเลเวล ยังไม่มีคลิปไกด์ของ Global',
  facts: [
    { text: 'เปลี่ยนเป็น Monk ได้ที่ Base Lv 50', cites: [['owner'], ['kamon', '00:44']] },
    { text: 'Job ตันที่ 70 ได้แต้มสกิล 69 แต้ม (ตอน Acolyte Job ตัน 50 ได้ 49 แต้ม)', cites: [['owner']] },
    {
      text: 'Guillotine Fist, Zen และ Rising Dragon อยู่ในผังสกิล Monk เลย ได้ตั้งแต่เปลี่ยนอาชีพ ไม่ต้องทำอะไรเพิ่ม',
      cites: [['owner'], ['tako', '12:05']],
    },
    { text: 'อาชีพถัดไปคือ Champion ซึ่งยังไม่เปิด', cites: [['prontera']] },
  ],
  path: ['acolyte', 'monk'],
  equipJob: 'Monk',
  route: [
    { range: '1-10', text: 'ทำเควสหลักกับ tutorial ไปก่อน ยังไม่ต้องฟาร์ม', cites: [['kofa', '00:26'], ['yoinoA', '01:12']] },
    { range: '7-18', text: 'Spore ที่ Payon Forest', maps: ['pay_fild08'], monsters: [1014], cites: [['kofa', '00:36'], ['yoinoA', '02:13']] },
    { range: '15-20', text: 'Prontera Sewer 2F ตีได้ทุกตัว และหาเสื้อออปชั่น FLEE กับ HP ไปด้วย · หรือ Payon Cave ชั้นแรกก็ได้', maps: ['prt_sewb2', 'pay_dun00'], monsters: [1051], cites: [['yoinoA', '08:24'], ['yoinoA', '09:18'], ['yoinoA', '22:32']] },
    { range: '18-25', text: 'Bigfoot ที่ Payon Forest หรือ Creamy กับ Smokie ที่ Gypsy Village (ในคลิปเสียงไม่ชัด น่าจะเป็นแมพนี้)', maps: ['pay_fild07', 'gef_fild05'], monsters: [1060, 1018, 1056], cites: [['kofa', '02:17'], ['yoinoA', '09:39'], ['yoinoA', '10:50']] },
    { range: '25-31', text: 'Elder Willow ที่ Prontera Field หรือ Coco ที่ Geffen Field (ได้ Hood กับ Sandals) ของครบแล้วไป Ant Hell', maps: ['prt_fild10', 'gef_fild02', 'anthell02'], monsters: [1033, 1104, 1095], cites: [['kofa', '02:38'], ['yoinoA', '15:22'], ['yoinoA', '16:55']] },
    { range: '30-40', text: 'Orc Village (ใส่ Orc Lady Card) หรือ Payon Cave: Familiar, Skeleton, Archer Skeleton', maps: ['gef_fild10', 'pay_dun00', 'pay_dun01'], monsters: [1023, 1005, 1076, 1016], cites: [['kofa', '03:02'], ['yoinoA', '22:59']] },
    { range: '40-50', text: 'Orc Underground Cave: Orc Zombie กับ Orc Skeleton คนน้อย บอทหาเป้าง่าย · หรือ Payon Cave 4F (Sohee) แต่มีมอนทำให้เลือดไหล ต้องเฝ้าบอท', maps: ['orcsdun01', 'orcsdun02', 'pay_dun03'], monsters: [1153, 1152, 1170], cites: [['kofa', '03:28'], ['yoinoA', '25:23'], ['yoinoA', '25:47']] },
    { range: '50', text: 'เปลี่ยนเป็น Monk หาเควสได้โดยเปิดหน้าต่างเควสแล้วพิมพ์คำว่า "จ๊อบ"', cites: [['owner'], ['kamon', '00:55']] },
    { range: '50+', text: 'ยังไม่มีคลิปที่บอกแมพเก็บเลเวลของ Monk ใน Global ฟุตเทจไต้หวันเปิดบอทสายคอมโบที่ Toy Factory ตอน Lv 71', cites: [['ryanM', '03:32'], ['ryanM', '03:37']] },
  ],
  routeNotes: [
    { text: 'ช่วง 1-50 ทุกคลิปที่เจอเล่น Acolyte สายตี AGI ทางนี้มาจากคลิป Acolyte ที่จะไป Priest ใช้กับ Monk ได้เพราะเป็นอาชีพหนึ่งเดียวกัน', cites: [['kofa', '00:42'], ['yoinoA', '02:51']] },
    { text: 'ติดเลเวล 47-48 ให้กลับไปทำเควสหลักที่ค้าง ได้ EXP หลายล้าน', cites: [['yoinoA', '27:40']] },
    { text: 'ที่ Orc Village ถ้าฆ่า Orc Warrior ครบ 30,000 ตัว ได้ Achievement เป็นหมวก Orc Hero Headdress (STR +2)', cites: [['yoinoA', '26:31']] },
  ],
  gearByLevel: [
    { range: 'ทั้งทาง', slot: 'ออปชั่น', text: 'ของ FLEE ง่ายๆ โดยเฉพาะรองเท้ากับผ้าคลุม ไม่ต้องของแพง ออปชั่นที่คุ้มช่วงต้นคือ Max HP กับ FLEE', cites: [['kofa', '01:01'], ['meta', '03:31']] },
    { range: '15-20', slot: 'เสื้อ', text: 'เสื้อจาก Prontera Sewer 2F ออปชั่น FLEE กับ HP', cites: [['yoinoA', '09:18']] },
    { range: '18-30', slot: 'อาวุธ', text: 'หา Chain ให้ได้เร็วที่สุด ถ้าได้ออปชั่น FLEE ใช้ได้นาน', items: [1519], cites: [['kofa', '02:29']] },
    { range: '20-25', slot: 'ประดับ', text: 'Creamy Card ใช้ Teleport Lv 1 ได้ (ไม่มีกลับเมือง)', items: [4040], cites: [['yoinoA', '10:01']] },
    { range: '25-30', slot: 'หมวก / รองเท้า', text: 'Hood กับ Sandals จาก Coco หาออปชั่น FLEE และ HP/SP', cites: [['kofa', '01:08'], ['yoinoA', '13:45']] },
    { range: '~30', slot: 'อาวุธ', text: 'Andre Card จาก Ant Hell (ATK +20) คลิปเรียกว่าการ์ดมด', items: [4043], cites: [['yoinoA', '16:55']] },
    { range: '32+', slot: 'อาวุธ', text: 'Orc Lady Card สูงสุด 3 ใบ ตี Orc แรงขึ้น ใช้ได้กับ Orc Zombie และ Orc Skeleton ด้วย', items: [4255], cites: [['kofa', '02:52'], ['kofa', '03:45']] },
    { range: '50+', slot: 'อาวุธ', text: 'ฟุตเทจไต้หวัน: สาย Guillotine Fist ถือ Chain +9 ที่ activate แล้ว สายคอมโบถือ Studded Knuckles ที่ activate แล้ว', items: [1519], cites: [['ryanM', '02:20'], ['ryanM', '03:45']] },
  ],
  strengths: [
    { text: 'Guillotine Fist ดาเมจช็อตเดียวสูงมาก ฟุตเทจไต้หวันตีบอส Memorial Dungeon และ Golden Thief Bug ใน Memorial ตายในทีเดียว (มีบัฟ Priest, Lex Aeterna และอาหารครบ)', cites: [['ryanM', '00:44'], ['ryanM', '01:07'], ['ryanM', '02:51']] },
    { text: 'สายคอมโบเปิดบอทได้ ของไม่ต้องแพง ดาเมจต่อชุดราว 10,000', cites: [['ryanM', '03:32'], ['ryanM', '03:51'], ['ryanM', '04:13']] },
    { text: 'Ryan Geldun ดูฟุตเทจแล้วเห็นว่า Throw Spirit Sphere ใน Zero ร่ายเร็ว และใช้ลูกแก้วแค่ลูกเดียว', cites: [['ryanM', '07:43'], ['ryanM', '07:58']] },
    { text: 'มีลูกแก้วเยอะ TakoyakiCh เห็นว่าเหมาะกับกิลด์วอ (ความเห็นก่อนอาชีพสองเปิด)', cites: [['tako', '12:21']] },
  ],
  weaknesses: [
    { text: 'ไม่มีท่าตีวงกว้าง ตีทีละตัว', cites: [['ryanM', '04:44']] },
    { text: 'คอมโบต้องรอ Raging Trifecta Blow ออกก่อนถึงจะต่อได้', cites: [['ryanM', '04:20']] },
    {
      text: 'TakoyakiCh จัดเทียร์ B ฝั่ง PvE: อาชีพสองเพิ่มมาน้อย คอมโบน่าจะสู้สกิลอาชีพอื่นไม่ได้ Throw Spirit Sphere ตีเป้าเดียวและร่ายช้า และไม่แน่ใจว่าบอทจะใช้ Snap ได้ฉลาด ถ้าเทียบเรื่องเปิดบอท Priest เก่งกว่า',
      cites: [['tako', '12:08'], ['tako', '12:39'], ['tako', '12:47'], ['tako', '13:04'], ['tako', '13:21']],
    },
    { text: 'เรื่องความเร็วร่าย Throw Spirit Sphere สองคลิปขัดกัน: TakoyakiCh ประเมินจากข้อมูลสกิลก่อนเปิด ส่วน Ryan Geldun ดูจากฟุตเทจจริง', cites: [['tako', '12:39'], ['ryanM', '07:43']] },
  ],
  builds: [
    {
      id: 'guillotine',
      name: 'สาย Guillotine Fist ล่าบอส',
      tag: 'ตีบอส',
      pickIf: 'อยากตีบอส Memorial Dungeon ให้จบในทีเดียว',
      idea: {
        text: 'เข้า Fury แล้วใช้ Guillotine Fist เท SP กับลูกแก้วทั้งหมด ดาเมจขึ้นกับ SP ที่ใช้ Rising Dragon เพิ่ม Max SP (ฟุตเทจมี Max SP ราว 2,500) และคงสถานะ Fury ไว้',
        cites: [['db'], ['ryanM', '03:03'], ['ryanM', '03:11']],
      },
      stats: [
        { who: 'ไกด์บน midgardhub', str: '99', int: '70-80', dex: '50-60', vit: 'ที่เหลือ', note: 'STR ดาเมจ, INT เพิ่ม SP, DEX ลดร่าย · ยังไม่ได้ตรวจว่าเลเวลตันตอนนี้ลงได้ถึงไหม', cites: [['midgard']] },
      ],
      statNotes: [
        { text: 'ฟุตเทจไต้หวันไม่ได้โชว์สเตตัสของสายนี้', cites: [['ryanM', '01:56']] },
      ],
      skills: [
        { skill: 'Guillotine Fist', level: 'คลิปไม่บอก', why: 'ใช้ได้เฉพาะตอนติด Fury · ต้องผ่าน Throw Spirit Sphere 3 กับ Fury 3', cites: [['ryanM', '00:52'], ['db']] },
        { skill: 'Fury', level: 'คลิปไม่บอก', why: 'จุดลูกแก้ว 5 ลูก เพิ่ม CRIT', cites: [['db']] },
        { skill: 'Zen', level: 1, why: 'เรียกลูกแก้วได้ทันที และเป็นทางผ่านของ Rising Dragon', cites: [['tako', '12:13'], ['db']] },
        { skill: 'Rising Dragon', level: 'คลิปไม่บอก', why: 'ฟุตเทจเปิดไว้ตอนตีบอส', cites: [['ryanM', '03:03']] },
      ],
      skillNotes: [
        { text: 'ฟุตเทจไม่ได้โชว์ผังสกิล จึงยังไม่มีลำดับอัพหรือเลเวลสกิลจากคลิป ลิสต์ด้านบนคือสกิลที่เห็นใช้', cites: [['ryanM', '01:45']] },
        { text: 'ทางผ่านตามฐานข้อมูล: Iron Fists (ต้อง Demon Bane ตอน Acolyte) ไป Summon Spirit Sphere, Occult Impaction, Throw Spirit Sphere 3 อีกทางคือ Spiritual Sphere Absorption ไป Fury 3 แล้ว Zen ไป Rising Dragon', cites: [['db']] },
        { text: 'ไกด์ midgardhub เขียนว่า "Asura Strike Lv 10" แต่ใน Zero สกิลนี้ชื่อ Guillotine Fist และตันที่ Lv 5 ไกด์นั้นยังบอกให้เอา Mental Sensing ซึ่งไม่อยู่ในผัง Monk จึงไม่ได้ใช้ส่วนนี้', cites: [['midgard'], ['prontera'], ['db']] },
      ],
      gear: [
        { slot: 'อาวุธ', text: 'Chain +9 ที่ activate แล้ว', items: [1519], cites: [['ryanM', '02:20']] },
        { slot: 'โล่', text: 'Silver Guard', items: [460070], cites: [['ryanM', '02:26']] },
        { slot: 'เสื้อ / รองเท้า', text: 'ของธรรมดา ผู้พูดบอกว่าไม่ได้ยากเกินหา', cites: [['ryanM', '02:26'], ['ryanM', '02:31']] },
        { slot: 'หมวก', text: 'ผู้พูดไม่รู้ว่าเป็นหมวกอะไร และบอกว่าหมวกอาจเป็นตัวสำคัญของบิลด์', cites: [['ryanM', '02:13']] },
      ],
      play: [
        { text: 'ฟุตเทจยิง Throw Spirit Sphere ใส่ Skeleton ได้ราว 25,000 ตอนเปิดคลิป ก่อนเข้าบอส', cites: [['ryanM', '01:17'], ['ryanM', '01:30']] },
        { text: 'ผู้พูดประมาณว่า Guillotine Fist ออกราว 2.5 ล้านใส่บอส Memorial Dungeon', cites: [['ryanM', '09:46']] },
      ],
      cautions: [
        { text: 'ดาเมจในฟุตเทจมีบัฟ Priest, Lex Aeterna และอาหาร (ผู้พูดเดาว่าราว +7 ทุกสเตตัส) ไม่ใช่ดาเมจตัวเปล่า', cites: [['ryanM', '01:04'], ['ryanM', '03:03']] },
        { text: 'หลังใช้ Guillotine Fist สถานะ Fury หายและฟื้น SP ไม่ได้ช่วงหนึ่ง', cites: [['db']] },
      ],
    },
    {
      id: 'combo',
      name: 'สายคอมโบ เปิดบอท',
      tag: 'เก็บเลเวล',
      pickIf: 'อยากเปิดบอทฟาร์มด้วยของไม่แพง',
      idea: {
        text: 'ตีธรรมดาให้ Raging Trifecta Blow ออก แล้วต่อ Raging Quadruple Blow กับ Raging Thrust ดาเมจก้อนใหญ่อยู่ที่ท่าปิด ยิ่งตีเร็วยิ่งคอมโบได้หลายรอบ',
        cites: [['ryanM', '03:58'], ['ryanM', '06:00'], ['ryanM', '06:12']],
      },
      stats: [
        { who: 'ผู้เล่นไต้หวัน (Lv 71)', str: '53', agi: '80', vit: '1', int: '14', dex: '20', luk: '1', note: 'ค่าพื้นฐานไม่รวมโบนัส · DEX น้อยแล้วพึ่ง Blessing ให้ตีโดน', cites: [['ryanM', '06:37'], ['ryanM', '06:49']] },
      ],
      skills: [
        { skill: 'Raging Trifecta Blow', level: 'คลิปไม่บอก', why: 'ตีปกติมีโอกาสออกเอง ในฟุตเทจราว 1,500', cites: [['ryanM', '04:04']] },
        { skill: 'Raging Quadruple Blow', level: 'คลิปไม่บอก', why: 'ในฟุตเทจราว 4,500', cites: [['ryanM', '04:07']] },
        { skill: 'Raging Thrust', level: 'คลิปไม่บอก', why: 'ท่าปิด จอสั่นตอนออก ราว 4,500 อีกคนออกถึงราว 12,000', cites: [['ryanM', '03:58'], ['ryanM', '04:09'], ['ryanM', '09:27']] },
        { skill: 'Throw Spirit Sphere', level: '3 (คาด)', why: 'ใช้สลับกับคอมโบตอนเปิดบอท ดาเมจราว 5,500', cites: [['ryanM', '07:16'], ['ryanM', '07:36']] },
      ],
      skillNotes: [
        { text: 'ฟุตเทจไม่ได้โชว์ผังสกิล ยังไม่มีลำดับอัพหรือเลเวลสกิลจากคลิป', cites: [['ryanM', '08:34']] },
        { text: 'ทางผ่านตามฐานข้อมูล: Raging Trifecta Blow ต้อง Iron Fists 5 · Raging Quadruple Blow ต้อง Raging Trifecta Blow 5 · Raging Thrust ต้อง Raging Quadruple Blow 3', cites: [['db']] },
      ],
      gear: [
        { slot: 'อาวุธ', text: 'Studded Knuckles ที่ activate แล้ว ชิ้นอื่นเป็นของธรรมดาไม่ได้ activate', cites: [['ryanM', '03:45'], ['ryanM', '03:51']] },
      ],
      play: [
        { text: 'ดาเมจรวมราว 10,000-11,000 ต่อชุด ถ้าตีเร็วคอมโบได้หลายรอบ', cites: [['ryanM', '04:13'], ['ryanM', '06:06']] },
      ],
      maps: [
        { text: 'Toy Factory (ฟุตเทจไต้หวัน Lv 71) แมพสำหรับ Global ยังไม่มีข้อมูล', cites: [['ryanM', '03:32']] },
      ],
      cautions: [
        { text: 'ไต้หวันคนเยอะจนไม่มีท่าวงกว้างก็ไม่เสียเปรียบ ถ้า Global คนน้อย การรวมมอนอาจคุ้มกว่า (ความเห็นก่อนเปิดเซิร์ฟ)', cites: [['ryanM', '04:44'], ['ryanM', '05:03']] },
        { text: 'ปัญหาเหมือนอาชีพสายประชิดทั่วไป', cites: [['ryanM', '09:35']] },
      ],
    },
    {
      id: 'throw',
      name: 'สาย Throw Spirit Sphere',
      pickIf: 'อยากยิงลูกแก้วจากระยะไกล',
      idea: {
        text: 'Throw Spirit Sphere ขว้างลูกแก้วตีระยะไกล ใช้ลูกแก้วลูกเดียวต่อครั้ง TakoyakiCh บอกว่ามีลูกแก้วได้ถึง 15 ลูก',
        cites: [['db'], ['ryanM', '07:58'], ['tako', '12:39']],
      },
      play: [
        { text: 'ในฟุตเทจใช้เสริมทั้งสาย Guillotine Fist (ราว 25,000 ใส่ Skeleton) และสายคอมโบ (ราว 5,500)', cites: [['ryanM', '01:30'], ['ryanM', '07:36']] },
      ],
      missing: 'ยังไม่มีคลิปที่เล่นสายนี้เป็นหลัก และสองคลิปขัดกันเรื่องความเร็วร่าย จึงยังไม่มีสเตตัส สกิล หรือของ',
    },
    {
      id: 'tank',
      name: 'สายแทงค์ / Mental Strength / Root',
      pickIf: 'อยากยืนรับดาเมจหรือตรึงเป้าหมาย',
      idea: { text: 'Mental Strength ลดดาเมจที่รับ 90% แต่ใช้สกิลไม่ได้และเดินช้า Root ตรึงเป้าหมาย', cites: [['db']] },
      missing: 'ยังไม่เจอคลิปหรือเว็บของ RO Zero ที่เล่นสายนี้',
    },
  ],
  gaps: [
    'ยังไม่มีคลิปไกด์ Monk ของ Zero Global เลย มีแค่ฟุตเทจเซิร์ฟไต้หวันกับเทียร์ลิสต์ก่อนอาชีพสองเปิด',
    'ไม่มีลำดับอัพสกิลหรือเลเวลสกิล ทั้งตอน Acolyte และ Monk จึงยังไม่มีแผนแต้มสกิล',
    'ไม่มีสเตตัสสาย Guillotine Fist จากคลิป และไม่มีแมพเก็บเลเวลหลัง Lv 50 ของ Global',
    'ไกด์ midgardhub ใช้ชื่อสกิลและไอเทมที่ไม่มีใน Zero (Asura Strike Lv 10, Eden Mace III, Shadow Monk Glove ฯลฯ) จึงไม่ได้ใส่',
    'ยังไม่มีข้อมูลออปชั่นสุ่มที่ควรหาสำหรับ Monk',
  ],
  sources: {
    ryanM: { label: 'Ryan Geldun', title: 'Monk builds in Ragnarok Zero Global', url: 'https://www.youtube.com/watch?v=N9LLirzXjfg', kind: 'clip', lang: 'en' },
    tako: { label: 'TakoyakiCh', title: 'จัด Tierlist Class2 ในโลก RO-Zero', url: 'https://www.youtube.com/watch?v=Y7MKIY0KiYo', kind: 'clip', lang: 'th' },
    kamon: { label: 'KamonWay', title: 'How to Change to Class 2 for Every Job in 3 Minutes', url: 'https://www.youtube.com/watch?v=iTxVgyVGCbc', kind: 'clip', lang: 'en' },
    kofa: { label: 'Kofa Roams', title: 'Acolyte Leveling Guide 1–50', url: 'https://www.youtube.com/watch?v=Jvsh0aTHlOU', kind: 'clip', lang: 'en' },
    yoinoA: { label: 'Yoino Buten', title: 'Acolyte 101 LV.1-50 ความรู้เบื้องต้น', url: 'https://www.youtube.com/watch?v=rnE7mp0yljY', kind: 'clip', lang: 'th' },
    meta: { label: 'Xiendong', title: 'Why Taiwan Players Build These Stats', url: 'https://www.youtube.com/watch?v=T5bjOqQomUc', kind: 'clip', lang: 'en' },
    midgard: { label: 'midgardhub', title: 'Monk guide', url: 'https://midgardhub.com/guides/monk', kind: 'web' },
    prontera: { label: 'roz.prontera.info', title: 'Monk skills', url: 'https://roz.prontera.info/jobs/monk', kind: 'web' },
    db: { label: 'rozerothai.com', title: 'ฐานข้อมูลไอเทมและสกิลของเว็บ', url: 'https://rozerothai.com/', kind: 'web' },
    owner: { label: 'ยืนยันในเกม', title: 'เจ้าของเว็บตรวจในเกม 22 ก.ย. 2026', url: '', kind: 'web' },
  },
};
