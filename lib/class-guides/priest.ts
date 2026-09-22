// Priest guide. Drafted 22 Sep 2026 from Downloads/roz-job-guides/priest.md,
// which cites every line to a clip timestamp or a web page. Items and skills
// were checked against the site database; lines the sources disagree on, or
// that only one player's numbers support, say so on the page.
import type { ClassGuide } from './types';

export const priest: ClassGuide = {
  slug: 'priest',
  job: 'Priest',
  jobTh: 'พรีสต์',
  from: 'Acolyte',
  gathered: '22 ก.ย. 2026',
  summary:
    'อาชีพสองของ Acolyte เล่นได้ทั้งสายตี (Duple Light) สายลงดัน และสายซัพพอร์ต เด่นเรื่องเปิดบอททั้งคืนได้เพราะ SP แทบไม่หมด',
  facts: [
    { text: 'เปลี่ยนเป็น Priest ได้ที่ Base Lv 50', cites: [['owner']] },
    { text: 'Job ตันที่ 70 ได้แต้มสกิล 69 แต้ม', cites: [['planner']] },
    {
      text: 'Duple Light, Basilica, Assumptio, Meditation, Cantocandidus, Clementia อยู่ในผังสกิล Priest เลย ได้ตั้งแต่เปลี่ยนอาชีพ ไม่ต้องทำอะไรเพิ่ม',
      cites: [['owner'], ['viva', '04:28'], ['mimiw', '03:53']],
    },
  ],
  path: ['acolyte', 'priest'],
  equipJob: 'Priest',
  route: [
    { range: '1-10', text: 'ทำเควสหลักกับ tutorial ไปก่อน ยังไม่ต้องฟาร์ม', cites: [['kofa', '00:26'], ['yoinoA', '01:12']] },
    { range: '7-18', text: 'Spore ที่ Payon Forest', maps: ['pay_fild08'], monsters: [1014], cites: [['kofa', '00:36'], ['yoinoA', '02:13']] },
    { range: '15-20', text: 'Prontera Sewer 2F ตีได้ทุกตัว และหาเสื้อออปชั่น FLEE กับ HP ไปด้วย', maps: ['prt_sewb2'], monsters: [1051], cites: [['yoinoA', '08:24'], ['yoinoA', '09:18']] },
    { range: '18-25', text: 'Bigfoot ที่ Payon Forest หรือ Creamy กับ Smokie ที่ Gypsy Village (ในคลิปเสียงไม่ชัด น่าจะเป็นแมพนี้)', maps: ['pay_fild07', 'gef_fild05'], monsters: [1060, 1018, 1056], cites: [['kofa', '02:17'], ['yoinoA', '09:39'], ['yoinoA', '10:50']] },
    { range: '25-31', text: 'Elder Willow ที่ Prontera Field หรือ Coco ที่ Geffen Field (ได้ Hood กับ Sandals) ของครบแล้วไป Ant Hell', maps: ['prt_fild10', 'gef_fild02', 'anthell02'], monsters: [1033, 1104, 1095], cites: [['kofa', '02:38'], ['yoinoA', '15:22'], ['yoinoA', '16:55']] },
    { range: '30-40', text: 'Orc Village (ใส่ Orc Lady Card) หรือ Payon Cave: Familiar, Skeleton, Archer Skeleton', maps: ['gef_fild10', 'pay_dun00', 'pay_dun01'], monsters: [1023, 1005, 1076, 1016], cites: [['kofa', '03:02'], ['yoinoA', '22:59']] },
    { range: '40-50', text: 'Orc Underground Cave: Orc Zombie กับ Orc Skeleton คนน้อย บอทหาเป้าง่าย · หรือ Payon Cave 4F (Sohee) แต่มีมอนทำให้เลือดไหล ต้องเฝ้าบอท', maps: ['orcsdun01', 'orcsdun02', 'pay_dun03'], monsters: [1153, 1152, 1170], cites: [['kofa', '03:28'], ['yoinoA', '25:23'], ['yoinoA', '25:47']] },
    { range: '50', text: 'เปลี่ยนเป็น Priest แล้วเก็บเลเวลที่แมพเดิมอีก 1-2 เลเวลเพื่อเอาแต้ม Job', cites: [['owner'], ['viva', '04:28']] },
    { range: '50-60+', text: 'Nordfeld Cave 2F แมพเก็บเลเวลที่ดีที่สุดในแพตช์นี้ ทำเควส Nordfeld ให้จบก่อน จะซื้อ Nordfeld Beer ได้ (ดาเมจใส่ Boulder Dwarf +10%)', maps: ['nrd_dun02'], monsters: [25327], cites: [['yoinoM', '03:27'], ['yoinoM', '03:52'], ['ryan', '00:17']] },
    { range: '60+', text: 'Golem ที่ Fortress Saint Darmain: HP สูงแต่ไม่ตีก่อน เหมาะเปิดบอทหรือพาตัวอื่น', maps: ['cmd_fild06'], monsters: [1040], cites: [['ryan', '02:03']] },
  ],
  routeNotes: [
    { text: 'ติดเลเวล 47-48 ให้กลับไปทำเควสหลักที่ค้าง ได้ EXP หลายล้าน', cites: [['yoinoA', '27:40']] },
    { text: 'ที่ Orc Village ถ้าฆ่า Orc Warrior ครบ 30,000 ตัว ได้ Achievement เป็นหมวก Orc Hero Headdress (STR +2)', cites: [['yoinoA', '26:31']] },
  ],
  gearByLevel: [
    { range: 'ทั้งทาง', slot: 'ออปชั่น', text: 'ของ FLEE ง่ายๆ โดยเฉพาะรองเท้ากับผ้าคลุม ไม่ต้องของแพง ออปชั่นที่คุ้มช่วงต้นคือ Max HP กับ FLEE', cites: [['kofa', '01:01'], ['meta', '03:31']] },
    { range: '15-20', slot: 'เสื้อ', text: 'เสื้อจาก Prontera Sewer 2F ออปชั่น FLEE กับ HP', cites: [['yoinoA', '09:18']] },
    { range: '18-30', slot: 'อาวุธ', text: 'หา Chain ให้ได้เร็วที่สุด ถ้าได้ออปชั่น FLEE ใช้ได้นาน', cites: [['kofa', '02:29']] },
    { range: '20-25', slot: 'ประดับ', text: 'Creamy Card ใช้ Teleport Lv 1 ได้ (ไม่มีกลับเมือง)', items: [4040], cites: [['yoinoA', '10:01']] },
    { range: '25-30', slot: 'หมวก / รองเท้า', text: 'Hood กับ Sandals จาก Coco หาออปชั่น FLEE และ HP/SP', cites: [['kofa', '01:08'], ['yoinoA', '13:45']] },
    { range: '~30', slot: 'อาวุธ', text: 'Andre Card จาก Ant Hell (ATK +20) คลิปเรียกว่าการ์ดมด', items: [4043], cites: [['yoinoA', '16:55']] },
    { range: '32+', slot: 'อาวุธ', text: 'Orc Lady Card สูงสุด 3 ใบ ตี Orc แรงขึ้น ใช้ได้กับ Orc Zombie และ Orc Skeleton ด้วย', items: [4255], cites: [['kofa', '02:52'], ['kofa', '03:45']] },
    { range: '50+', slot: 'ชุด Nordfeld', text: 'ของจาก Nordfeld Cave 2F: หมวกแลกจากเหรียญทองที่มอนชั้น 2 ดรอป เสื้อกับรองเท้าดรอปจาก Boulder Dwarf ออปชั่นที่ต้องหาคือ FLEE, HP, SP ตีบวก 7 ได้จะดีมาก', cites: [['yoinoM', '11:07'], ['yoinoM', '11:42'], ['yoinoM', '13:35']] },
    { range: '50+', slot: 'อาวุธ', text: 'ถ้าฟาร์ม Nordfeld Cave เป็นหลัก ใส่ Boulder Dwarf Squad Leader Card (ดาเมจเวทใส่ Boulder Dwarf +30%) ได้ถึง 3 ใบ', items: [300943], cites: [['yoinoM', '12:48'], ['yoinoM', '13:03']] },
    { range: '50+', slot: 'ผ้าคลุม', text: 'Baby Shark Card (ของกิจกรรม) หรือ Condor Card ถ้าอยากได้ FLEE', items: [300834, 4015], cites: [['yoinoM', '13:28']] },
    { range: '59+', slot: 'แหวน', text: 'แหวนจาก Memorial Dungeon ของ Golden Thief Bug ใส่ 2 วง ดันนี้ต้องไปเป็นปาร์ตี้', cites: [['yoinoM', '13:52']] },
  ],
  strengths: [
    { text: 'ตีธรรมดาแล้ว Duple Light ยิงลูกแสงตามมา ได้ดาเมจทั้งกายภาพและเวท', cites: [['ryan', '01:02'], ['viva', '04:49']] },
    { text: 'SP แทบไม่หมดด้วย Meditation กับ Magnificat เปิดบอททั้งคืนได้', cites: [['viva', '05:34'], ['viva', '10:52']] },
    { text: 'บัฟทั้งปาร์ตี้: Cantocandidus (Increase Agility หมู่) และ Clementia (Blessing หมู่)', cites: [['viva', '05:56'], ['viva', '06:18']] },
    { text: 'TakoyakiCh จัดไว้เทียร์ SS ฝั่ง PvE (ประเมินก่อนอาชีพสองเปิด)', cites: [['tako', '10:29']] },
  ],
  weaknesses: [
    { text: 'Duple Light ตีทีละตัว ไม่มีท่าตีวงกว้าง', cites: [['ryan', '03:34']] },
    { text: 'ช่วงเพิ่งเปลี่ยนอาชีพ SP ไม่พอเปิดบัฟหมู่ครบ', cites: [['viva', '07:02']] },
    { text: 'แต้มไม่พอเอาทุกอย่าง ต้องเลือกระหว่าง Kyrie Eleison กับ Assumptio', cites: [['viva', '07:47']] },
  ],
  builds: [
    {
      id: 'duple-light',
      name: 'สายตี Duple Light (AGI/INT)',
      tag: 'สายหลัก',
      pickIf: 'อยากเปิดบอทเก็บเลเวลหรือฟาร์มคนเดียว',
      idea: {
        text: 'ตีธรรมดาให้เร็วที่สุด เพื่อให้ Duple Light ออกถี่ ดาเมจลูกแสงฝั่งเวทแรงกว่าฝั่งกายภาพ เลยลง INT ด้วย มอนส่วนใหญ่ MDEF ต่ำกว่า DEF จึงคุ้ม',
        cites: [['viva', '08:32'], ['mimiw', '05:35'], ['ryan', '01:47']],
      },
      stats: [
        { who: 'Viva-Tz (Lv 60)', str: 'ที่เหลือ', agi: '70', int: '25', dex: '25', note: 'HIT เสริมจากหมวกออปชั่น HIT +15', cites: [['viva', '08:32'], ['viva', '08:54']] },
        { who: 'MimiwPK (Lv 60)', agi: '70', int: '29', dex: '20', note: 'FLEE ราว 300 ตอนมีบัฟ ถ้ามอนหลบเกิน 300 ให้เพิ่ม DEX', cites: [['mimiw', '00:17'], ['mimiw', '00:47']] },
      ],
      statNotes: [
        { text: 'เน้น ASPD ให้สูงสุด Viva-Tz ตั้งเป้าราว 180 ผู้เล่นไต้หวันถือ 190 เป็นเลขเป้าหมาย', cites: [['ryan', '03:05'], ['viva', '11:33'], ['meta', '01:23']] },
      ],
      skills: [
        { skill: 'Duple Light', level: 10, why: 'เอาก่อนเลย ต้องผ่าน Aspersio 1 (ซึ่งต้อง Aqua Benedicta 1 กับ Impositio Manus 3)', cites: [['viva', '04:28'], ['mimiw', '02:22'], ['ryan', '01:16']] },
        { skill: 'Meditation', level: 10, why: 'Max SP +10% และฟื้น SP เร็วขึ้น', cites: [['viva', '05:11']] },
        { skill: 'Magnificat', level: 5, why: 'ฟื้น SP เพิ่ม', cites: [['viva', '05:34'], ['mimiw', '03:23']] },
        { skill: 'Cantocandidus', level: 3, why: 'AGI มากกว่า Increase Agility ธรรมดา ใช้ SP 240', cites: [['viva', '05:56'], ['viva', '07:02']] },
        { skill: 'Clementia', level: 3, why: 'Blessing แบบหมู่ ใช้ SP 360 ช่วงแรกใช้ Blessing ธรรมดาไปก่อน', cites: [['viva', '06:42'], ['viva', '07:26']] },
        { skill: 'Impositio Manus', level: 5, cites: [['viva', '07:26'], ['mimiw', '03:53']] },
        { skill: 'Aspersio', level: 5, cites: [['viva', '07:47'], ['mimiw', '03:53']] },
        { skill: 'Kyrie Eleison', level: 10, why: 'หรือเลือก Assumptio แทนถ้าแต้มไม่พอ', cites: [['mimiw', '02:52'], ['viva', '08:11'], ['ryan', '02:31']] },
      ],
      skillNotes: [
        { text: 'MimiwPK ต่อด้วย Gloria 5 (LUK +30 ช่วย CRIT และ HIT) กับ Basilica 5 (ตี Shadow/Undead แรงขึ้น)', cites: [['mimiw', '03:23'], ['mimiw', '03:53']] },
        { text: 'ทุกคลิปอัดตอน Job 60 แผนด้านล่างจึงบอกว่าเหลือกี่แต้มถึง Job 70', cites: [['viva', '00:14'], ['mimiw', '00:17']] },
      ],
      plan: {
        picks: {
          acolyte: { 'Increase Agility': 10, Blessing: 10, 'Mace Mastery': 10, Teleport: 2, 'Warp Portal': 4, Pneuma: 1 },
          priest: { 'Duple Light': 10, Meditation: 10, Magnificat: 5, Cantocandidus: 3, Clementia: 3, 'Impositio Manus': 5, Aspersio: 5, Assumptio: 5 },
        },
        basis: { text: 'สกิลที่ Viva-Tz เลือก ทั้งตอน Acolyte และ Priest', cites: [['viva', '01:24'], ['viva', '04:28'], ['viva', '07:47']] },
        leftover: { text: 'แต้มที่เหลือ: คลิปบอกว่าถ้ามีแต้มพอให้เอา Kyrie Eleison 10 (ต้อง Angelus 2 ตอน Acolyte)', cites: [['viva', '08:11'], ['mimiw', '02:52']] },
      },
      gear: [
        { slot: 'อาวุธ', text: 'หนังสือที่ได้จากเควสเปลี่ยนอาชีพ ให้ทั้ง ATK และ MATK แค่นี้ก็พอ', cites: [['ryan', '00:47'], ['mimiw', '06:06']] },
        { slot: 'หมวก', text: 'หมวก Lv 50 ออปชั่น FLEE หรือ HIT', cites: [['mimiw', '04:57'], ['viva', '08:54']] },
        { slot: 'เสื้อ', text: 'เสื้อ Lv 50 ออปชั่นฟื้น SP ใส่ Roda Frog Card', items: [4014], cites: [['mimiw', '04:57'], ['viva', '10:16']] },
        { slot: 'รองเท้า', text: 'รองเท้า Lv 50 ออปชั่น HP กับ FLEE', cites: [['mimiw', '05:35']] },
        { slot: 'ผ้าคลุม', text: 'ออปชั่น HP กับ FLEE ใส่ Shark Family Card เพิ่ม MATK', items: [300835], cites: [['mimiw', '05:35'], ['zixma', '02:26']] },
        { slot: 'ประดับ', text: 'อะไรก็ได้ที่ให้ STR หรือ AGI', cites: [['mimiw', '06:06']] },
        { slot: 'ออปชั่นสุ่ม', text: 'เน้น ASPD: AGI หรือ ASPD %', cites: [['ryan', '03:21']] },
      ],
      play: [
        { text: 'ลำดับบัฟในบอท: Duple Light, Magnificat, Cantocandidus, Clementia, Impositio Manus, Assumptio', cites: [['viva', '09:16']] },
        { text: 'Teleport เมื่อไม่มีการต่อสู้ 3 วินาที หรือโดนดาเมจเกิน 300-500 · Heal เมื่อเลือดต่ำกว่า 80% ไม่ต้องใส่ยา', cites: [['mimiw', '06:50'], ['mimiw', '07:42']] },
      ],
      maps: [
        { text: 'Golem: HP สูงแต่ไม่ตีก่อน เหมาะเปิดบอท', cites: [['ryan', '02:03']] },
        { text: 'Geffen Dungeon (แพตช์ใหม่): มอน HP สูง EXP ดี คาดว่าเข้าทาง Priest (ความเห็น ยังไม่ได้ทดสอบ)', cites: [['farm', '03:28']] },
      ],
      cautions: [
        { text: 'ถ้าเลือกแมพที่มอนแรงเกินของ บอทจะฮีลทั้งคืนจน SP ไม่พอใช้สกิลอื่น', cites: [['viva', '10:52']] },
      ],
    },
    {
      id: 'dungeon',
      name: 'สายลงดัน / Memorial Dungeon',
      pickIf: 'อยากโซโลดันอย่าง Golden Thief Bug',
      idea: {
        text: 'FLEE สูงมาก ยืนใน Safety Wall กับ Sanctuary สู้บอส ใช้ Magnus Exorcismus เคลียร์ไข่ ZixmaOne โซโล GTB ระดับ Hard ได้ที่ Lv 59',
        cites: [['zixma', '00:02'], ['zixma', '00:24'], ['zixma', '05:40']],
      },
      stats: [
        { who: 'ZixmaOne (Lv 59)', note: 'ไม่ได้บอกตัวเลข · FLEE 330 ตอนยืน 340 ตอนมีบัฟ', cites: [['zixma', '00:24'], ['zixma', '02:50']] },
      ],
      skills: [
        { skill: 'Magnus Exorcismus', level: '5-10', why: 'Lv 5 ก็ระเบิดไข่ได้ในครั้งเดียว', cites: [['zixma', '03:16']] },
        { skill: 'Safety Wall', level: 10, why: 'ลดได้แต่ต้องกดบ่อยขึ้น', cites: [['zixma', '03:38']] },
        { skill: 'Sanctuary', level: '6-7', why: 'ถ้าลด Magnus เหลือ 5 ให้เอา Sanctuary 7', cites: [['zixma', '04:01']] },
        { skill: 'Heal', level: 3, why: 'ลดได้ เพราะในดันนี้ไม่ได้ใช้', cites: [['zixma', '02:50']] },
      ],
      plan: {
        picks: {
          acolyte: { Heal: 3 },
          priest: { 'Magnus Exorcismus': 10, 'Safety Wall': 10, Sanctuary: 7 },
        },
        basis: { text: 'เฉพาะสกิลที่ ZixmaOne บอกในคลิป ส่วนแต้มที่เหลือเลือกตามสายตีด้านบนได้', cites: [['zixma', '02:50'], ['zixma', '04:01']] },
      },
      gear: [
        { slot: 'อาวุธ', text: 'หนังสือ (ตีเร็ว) ใส่ Fur Seal Card หรือ Fabre Card', items: [4312, 4002], cites: [['zixma', '01:40'], ['zixma', '02:02']] },
        { slot: 'เสื้อ', text: 'เสื้อ FLEE +13 ตีบวก 9 ใส่ Pupa Card', items: [4003], cites: [['zixma', '01:13']] },
        { slot: 'โล่', text: 'Bigfoot Card (ลดดาเมจจากแมลง 30% เหมาะกับ GTB)', items: [4074], cites: [['zixma', '01:13']] },
        { slot: 'รองเท้า', text: 'ออปชั่น FLEE +15', cites: [['zixma', '02:26']] },
        { slot: 'ประดับ', text: 'Yoyo Card 2 ข้าง', items: [4051], cites: [['zixma', '02:26']] },
      ],
      play: [
        { text: 'เปลี่ยนธาตุอาวุธเป็นไฟ เพราะ GTB ธาตุไฟ ดาเมจที่สะท้อนกลับจะเบาลง ส่วนดาเมจเวทไม่สะท้อน', cites: [['zixma', '04:01'], ['zixma', '04:26']] },
        { text: 'วาง Sanctuary เยื้องตัวไม่ให้บอสยืนทับ และเปิด Safety Wall ตัวเองตลอด', cites: [['zixma', '04:51'], ['zixma', '05:13']] },
      ],
      cautions: [
        { text: 'Safety Wall หลุดแล้วโดนเวทครั้งเดียวตายได้', cites: [['zixma', '06:04']] },
        { text: 'Orc Hero Memorial ระดับ Hard ยากเกินไป ระดับปกติง่ายกว่า GTB มาก', cites: [['zixma', '06:25'], ['zixma', '06:51']] },
      ],
    },
    {
      id: 'matk',
      name: 'สายเวท Duple Light (MATK)',
      pickIf: 'อยากได้ดาเมจลูกแสงสูงสุด ฟาร์ม Nordfeld Cave',
      idea: {
        text: 'Duple Light ฝั่งเวทคูณ 1600% ฝั่งกายภาพ 1000% สายนี้จึงดันฝั่งเวท แต่ยังเน้น AGI ก่อนเพื่อตีให้เร็ว ดาเมจต่อครั้งในคลิปราว 6,000-19,000',
        cites: [['yoinoM', '01:29'], ['yoinoM', '01:48'], ['yoinoM', '19:18']],
      },
      stats: [
        { who: 'Yoino Buten (Lv 60)', str: 'ที่เหลือ', agi: '69', int: '70 (รวมโบนัส)', dex: '30', note: 'AGI 69 ได้ ASPD 179 พอดีตอนใช้ไอเทมบัฟ · DEX 30 ช่วยลดร่าย', cites: [['yoinoM', '09:37'], ['yoinoM', '14:58'], ['yoinoM', '15:38']] },
      ],
      skills: [
        { skill: 'Duple Light', level: 10, why: 'กดอัพตัวนี้ก่อน ระบบจะบังคับอัพทางผ่านให้เอง', cites: [['yoinoM', '06:48']] },
        { skill: 'Clementia', level: 3, why: 'ได้สเตตัสเพิ่ม 1 ทุก 10 Job', cites: [['yoinoM', '07:05'], ['yoinoM', '07:26']] },
        { skill: 'Cantocandidus', level: 3, cites: [['yoinoM', '07:26']] },
        { skill: 'Magnificat', level: 5, why: 'สายนี้ใช้ SP เยอะมาก', cites: [['yoinoM', '07:36']] },
        { skill: 'Assumptio', level: 5, why: 'DEF +250 และรับฮีลมากขึ้น', cites: [['yoinoM', '07:56'], ['yoinoM', '08:04']] },
        { skill: 'Meditation', level: 10, why: 'Max SP +10% ฟื้น SP เร็วขึ้น', cites: [['yoinoM', '08:15'], ['yoinoM', '08:26']] },
      ],
      plan: {
        picks: {
          acolyte: { Blessing: 10, 'Increase Agility': 10, Teleport: 2, 'Warp Portal': 4, Heal: 10, Cure: 1, 'Aqua Benedicta': 1, Angelus: 4 },
          priest: { 'Duple Light': 10, Clementia: 3, Cantocandidus: 3, Magnificat: 5, Assumptio: 5, Meditation: 10 },
        },
        basis: { text: 'สกิลที่ Yoino Buten เลือก ช่วง Acolyte คลิปพูดเร็วและเสียงไม่ชัดบางคำ', cites: [['yoinoM', '05:52'], ['yoinoM', '06:12'], ['yoinoM', '06:22']] },
      },
      gear: [
        { slot: 'อาวุธ', text: 'ฟาร์ม Nordfeld Cave ใส่ Boulder Dwarf Squad Leader Card ได้ถึง 3 ใบ เพราะดาเมจ Duple Light ฝั่งเวทคิดจาก MATK', items: [300943], cites: [['yoinoM', '12:48'], ['yoinoM', '12:56']] },
        { slot: 'หมวก', text: 'หมวกแลกจากเหรียญทองที่มอน Nordfeld Cave 2F ดรอป ออปชั่น FLEE หรือ MATK หรือ INT/AGI', cites: [['yoinoM', '11:07'], ['yoinoM', '11:25']] },
        { slot: 'เสื้อ / รองเท้า', text: 'ดรอปจาก Boulder Dwarf ในชั้น 2 ออปชั่น FLEE, HP, SP ตีบวก 7 ได้จะดีมาก', cites: [['yoinoM', '11:42'], ['yoinoM', '13:35'], ['yoinoM', '13:43']] },
        { slot: 'ผ้าคลุม', text: 'Baby Shark Card (MATK สูง) หรือ Condor Card ถ้า FLEE ยังไม่พอ', items: [300834, 4015], cites: [['yoinoM', '13:28']] },
        { slot: 'แหวน', text: 'แหวนจาก Memorial Dungeon ของ Golden Thief Bug 2 วง', cites: [['yoinoM', '13:52']] },
      ],
      play: [
        { text: 'ลำดับบัฟ: Clementia, Cantocandidus, Magnificat, Duple Light, Assumptio', cites: [['yoinoM', '14:11'], ['yoinoM', '14:22']] },
        { text: 'ตั้งบอทให้ Teleport เมื่อโดนรุมเกิน 10 ตัว หรือโดนดาเมจเกิน 900 · กิน Nordfeld Beer ก่อนเปิดบอท', cites: [['yoinoM', '16:48'], ['yoinoM', '18:13']] },
      ],
    },
    {
      id: 'support',
      name: 'สายซัพพอร์ต',
      pickIf: 'เล่นเป็นไอดีสองคอยบัฟ ฮีล และพาตัวหลักเก็บเลเวล',
      idea: {
        text: 'ลง INT เพื่อฮีลแรงและ SP เยอะ คอยบัฟทั้งปาร์ตี้ Ryan Geldun แนะนำทำไว้เป็นไอดีสองสำหรับลง Memorial Dungeon และพาตัวอื่นเก็บเลเวล',
        cites: [['ryan', '03:34'], ['ryan', '03:50']],
      },
      stats: [
        { who: 'ไกด์บน midgardhub', int: '90-99', vit: '40-60', dex: '60-80', agi: 'ที่เหลือ', note: 'ยังไม่ได้ตรวจว่าเลเวลตันตอนนี้ลงได้ถึงไหม', cites: [['midgard']] },
      ],
      skills: [
        { skill: 'Magnificat', level: 5, cites: [['midgard']] },
        { skill: 'Sanctuary', level: 10, cites: [['midgard']] },
      ],
      skillNotes: [
        { text: 'ไกด์นี้บอกว่า Kyrie Eleison คุ้มกว่า Assumptio สำหรับแทงค์บางแบบ เพราะกันเป็นจำนวนครั้ง ไม่สนว่าดาเมจแรงแค่ไหน', cites: [['midgard']] },
      ],
      missing: 'ยังไม่มีคลิป RO Zero สอนสายนี้โดยตรง ของที่ไกด์ midgardhub แนะนำไม่มีในฐานข้อมูลเกมของเราเลยสักชิ้น จึงไม่ได้ใส่',
    },
    {
      id: 'magnus',
      name: 'สายเวท Magnus Exorcismus',
      pickIf: 'อยากฟาร์มมอนเป็นกลุ่ม',
      idea: { text: 'มีคนพูดถึงว่าเป็นหนึ่งในสายหลักของ Priest ใน Zero', cites: [['round1']] },
      missing: 'คลิปที่สอนสายนี้ไม่มีคำบรรยายให้ดึง ยังไม่มีข้อมูลสกิล สเตตัส หรือของ',
    },
  ],
  gaps: [
    'ทุกคลิปอัดตอน Job 60 แผนสกิลจึงเหลือแต้มที่ยังไม่มีใครบอกว่าควรลงอะไร',
    'ยังไม่รู้ชื่อหนังสือที่ได้จากเควสเปลี่ยนอาชีพ และชื่อชุด Nordfeld ที่คลิปใส่',
    'แมพเก็บเลเวลหลัง Lv 60 มีแค่ Golem กับ Nordfeld Cave',
    'Magnus Exorcismus ตีได้ทุกมอนหรือเฉพาะ Undead/Demon แหล่งข้อมูลยังขัดกัน',
  ],
  sources: {
    viva: { label: 'Viva-Tz', title: 'แนะนำการอัพสกิล สเตตัส Priest บู๊ สาย Duple Light', url: 'https://www.youtube.com/watch?v=3DP9Vk5WftU', kind: 'clip', lang: 'th' },
    mimiw: { label: 'MimiwPK', title: 'Priest "Battle" Duple Light Build Guide', url: 'https://www.youtube.com/watch?v=SQe-i7Bz8cM', kind: 'clip', lang: 'en' },
    ryan: { label: 'Ryan Geldun', title: 'Priests are Overpowered in Ragnarok Zero Global', url: 'https://www.youtube.com/watch?v=xD3-EHWSr9A', kind: 'clip', lang: 'en' },
    zixma: { label: 'ZixmaOne', title: 'Solo Dungeon Guide LV.59 Battle Priest (Hard Difficulty)', url: 'https://www.youtube.com/watch?v=15tX8b5nn24', kind: 'clip', lang: 'en' },
    kofa: { label: 'Kofa Roams', title: 'Acolyte Leveling Guide 1–50', url: 'https://www.youtube.com/watch?v=Jvsh0aTHlOU', kind: 'clip', lang: 'en' },
    yoinoA: { label: 'Yoino Buten', title: 'Acolyte 101 LV.1-50 ความรู้เบื้องต้น', url: 'https://www.youtube.com/watch?v=rnE7mp0yljY', kind: 'clip', lang: 'th' },
    yoinoM: { label: 'Yoino Buten', title: 'Priest Duple Light เวทย์ (MATK) ดาเมจทะลุ 20K!', url: 'https://www.youtube.com/watch?v=cfd-b0ZziGY', kind: 'clip', lang: 'th' },
    tako: { label: 'TakoyakiCh', title: 'จัด Tierlist Class2 ในโลก RO-Zero', url: 'https://www.youtube.com/watch?v=Y7MKIY0KiYo', kind: 'clip', lang: 'th' },
    farm: { label: 'Xiendong', title: 'NEW Farming Spots, Cards & EXP Areas!', url: 'https://www.youtube.com/watch?v=y7ySJekxEAw', kind: 'clip', lang: 'en' },
    meta: { label: 'Xiendong', title: 'Why Taiwan Players Build These Stats', url: 'https://www.youtube.com/watch?v=T5bjOqQomUc', kind: 'clip', lang: 'en' },
    midgard: { label: 'midgardhub', title: 'Priest guide', url: 'https://midgardhub.com/guides/priest', kind: 'web' },
    planner: { label: 'rozeroplanner', title: 'RO Zero skill planner', url: 'https://rozeroplanner.com/', kind: 'web' },
    round1: { label: 'Ryan Geldun (เบต้า)', title: 'Priest builds for Ragnarok Zero Global', url: 'https://www.youtube.com/watch?v=4P_y8nJdTqI', kind: 'clip', lang: 'en' },
    owner: { label: 'ยืนยันในเกม', title: 'เจ้าของเว็บตรวจในเกม 22 ก.ย. 2026', url: '', kind: 'web' },
  },
};
