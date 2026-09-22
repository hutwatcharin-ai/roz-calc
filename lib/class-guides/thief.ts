// Thief guide. Drafted 22 Sep 2026 from Downloads/roz-job-guides/thief.md,
// which cites every line to a clip timestamp or a web page. Items, monsters
// and skills were checked against the site database with .check-names.mjs;
// items with several ids of the same name (Damascus, Jamadhar, Jur, Small Mana
// Potion) are named in text only.
import type { ClassGuide } from './types';

export const thief: ClassGuide = {
  slug: 'thief',
  job: 'Thief',
  jobTh: 'ทีฟ',
  from: 'Novice',
  gathered: '22 ก.ย. 2026',
  summary:
    'อาชีพหนึ่งสายหลบและตีสองที ทางผ่านไป Assassin หรือ Rogue มีสายบอท Steal ขโมยของโดยไม่ต้องตีมอน ส่วนสายตีเก็บเลเวลคนเดียวยังไม่มีคลิปสอนตรงๆ',
  facts: [
    { text: 'เปลี่ยนอาชีพสอง (Assassin หรือ Rogue) ได้ที่ Base Lv 50', cites: [['owner'], ['kamonC', '00:44']] },
    { text: 'Job ตันที่ 50 ได้แต้มสกิล 49 แต้ม', cites: [['owner']] },
    {
      text: 'ใน Zero ผังสกิล Thief มี Sword Mastery ด้วย รวม 11 สกิล ในนั้นเป็นสกิลเควส 4 ตัว (Sand Attack, Stone Fling, Back Slide, Find Stone)',
      cites: [['pJob'], ['tako', '16:39']],
    },
    { text: 'รีเซ็ตสเตตัสและสกิลได้ฟรีจนถึง Lv 40 หลังจากนั้นต้องเสียเงินจริง ถ้าจะเปลี่ยนสายให้รีเซ็ตก่อน', cites: [['xien', '02:39'], ['meta', '06:26']] },
  ],
  path: ['thief'],
  equipJob: 'Thief',
  route: [
    { range: '1-15', text: 'แมพเห็ดแดงข้างเมือง Payon (วาร์ปไป Payon แล้วเลี้ยวขวา) มอนเลือดน้อย อยู่ได้ถึงราว Lv 15 · Zeztz อยู่แมพเห็ดแดงยาวถึง Lv 25', cites: [['ncz', '02:40'], ['ncz', '03:12'], ['zeztz', '06:46']] },
    { range: '1-30', text: 'หรือแบบ Xiendong: ปล่อยบอทตี Poison Spore ตั้งแต่ต้นจนถึงราว Lv 30 บางทีถึง 35 (คลิปไม่ได้บอกชื่อแมพ)', monsters: [1077], cites: [['xien', '01:12']] },
    { range: '30-35', text: 'Coco ที่ Geffen Field ดรอปรองเท้าแดงกับ Hood · หรือไปถ้ำมด ช่วงนี้เลเวลขึ้นช้าที่สุด', maps: ['gef_fild02'], monsters: [1104], cites: [['xien', '01:32'], ['xien', '01:40'], ['ncz', '06:48']] },
    { range: '35-50', text: 'ถ้ามีตัว Lv 50 ให้ปาร์ตี้พาเก็บที่ Hode ในทะเลทราย Sograt ปาร์ตี้แชร์ EXP ได้เมื่อเลเวลห่างไม่เกิน 15', maps: ['moc_fild17'], monsters: [1127], cites: [['xien', '02:07']] },
    { range: '35-50', text: 'ถ้าเล่นตัวเดียว: ถ้ำมดแบบชิลไม่เปลืองยา หรือแมพที่ซับฟังเป็น "warrior" ถ้ายอมเปลืองยา อยู่ได้ถึง 45-50', cites: [['zeztz', '06:58']] },
    { range: '40-50', text: 'Steel Chonchon ที่ Sograt Desert มอนเยอะมาก Xiendong แนะนำให้เอา Thief กับ Mage ที่สร้างคู่กันมาเก็บที่นี่ด้วยกัน', maps: ['moc_fild13'], monsters: [1042], cites: [['ncz', '13:01'], ['xien', '05:17']] },
    { range: '45-50', text: 'เร่งเลเวล: เติม full buff จาก Cash Shop แล้วไปแมพหมูหรือแมพที่ซับฟังเป็น "BL King" ราว 15 ชม. จาก 45 ถึง 50', cites: [['zeztz', '07:20']] },
    { range: '50-60', text: 'หลังเปลี่ยนอาชีพสอง Xiendong อยู่ Nordfeld Cave 2F จนถึง Lv 60', maps: ['nrd_dun02'], cites: [['xien', '06:12'], ['owner']] },
  ],
  routeNotes: [
    { text: 'Thief เก็บเลเวลคนเดียวยาก Xiendong แนะนำให้สร้าง Mage คู่กันไปตั้งแต่ต้น แล้วเก็บเลเวลด้วยกัน', cites: [['xien', '04:35']] },
    { text: 'ทำเควสแรกๆ ให้จบก่อน ได้ Fly Wing กับ Butterfly Wing ฟรี ซึ่งในร้าน NPC ค่อนข้างแพง', cites: [['xien', '00:39']] },
  ],
  gearByLevel: [
    { range: 'ทั้งทาง', slot: 'ออปชั่น', text: 'ระบบออปชั่นสุ่มทำให้ FLEE 250-300 ได้ตั้งแต่ต้นเกม ถ้าได้ FLEE ราว 15 ขึ้นไปจากเกราะแต่ละชิ้น', cites: [['meta', '03:33'], ['meta', '06:59']] },
    { range: '30-35', slot: 'หมวก / รองเท้า', text: 'Hood กับรองเท้าแดงจาก Coco', items: [480414], cites: [['ncz', '06:48']] },
  ],
  strengths: [
    { text: 'หลบเก่ง คลิปไทยยกให้เป็นอาชีพที่หลบเก่งจริงๆ (ผู้พูดอธิบายจากเซิร์ฟคลาสสิก ยังไม่ได้ทดสอบใน Zero)', cites: [['viva', '20:09']] },
    { text: 'TakoyakiCh มองว่าตอนเป็นอาชีพหนึ่ง Thief ค่อนข้างโกง เพราะมีทั้งหลบ Double Attack และใช้มีดตีแรงขึ้น', cites: [['tako', '16:39']] },
    { text: 'สาย Steal บอทขโมยของได้ทั้งชั่วโมงโดยไม่ต้องตีมอน ลงทุนน้อย', cites: [['zixma', '00:10']] },
  ],
  weaknesses: [
    { text: 'เก็บเลเวลคนเดียวยาก', cites: [['xien', '04:35']] },
    { text: 'ช่วง Lv 30-35 เลเวลขึ้นช้าที่สุด', cites: [['xien', '01:40']] },
  ],
  builds: [
    {
      id: 'steal',
      name: 'สาย Steal (บอทขโมยของ)',
      tag: 'ทุนต่ำ',
      pickIf: 'อยากได้ของเลเวล 50 จากบอทโดยไม่ต้องตีมอน',
      idea: {
        text: 'บอทใช้ Steal อย่างเดียว ไม่ตีมอน อยู่แมพเลเวล 50 เก็บของเลเวล 50 ข้อเสียคือเลือกไม่ได้ว่าจะได้ชิ้นไหน และออปชั่นสุ่ม 2-3 แถวแบบเลือกไม่ได้',
        cites: [['zixma', '00:10'], ['zixma', '00:58'], ['zixma', '01:09']],
      },
      stats: [
        { who: 'ZixmaOne', dex: '70 กว่า', int: '25', note: 'ไม่ได้บอกค่า STR, AGI, VIT, LUK', cites: [['zixma', '01:30']] },
      ],
      statNotes: [
        { text: 'DEX คือค่าหลักที่ทำให้ขโมยติดง่าย ค่า HIT ไม่เกี่ยว', cites: [['zixma', '01:43']] },
        { text: 'INT ใส่พอประมาณเพื่อให้ Max SP สูงขึ้นและฟื้น SP ได้', cites: [['zixma', '01:35']] },
      ],
      skills: [
        { skill: 'Steal', level: 10, why: 'อัพอย่างเดียว สกิลอื่นไม่ได้ใช้เลย', cites: [['zixma', '02:04']] },
      ],
      plan: {
        picks: { thief: { Steal: 10 } },
        basis: { text: 'ZixmaOne อัพแค่ Steal 10 แต้มที่เหลือคลิปไม่ได้บอก', cites: [['zixma', '02:04']] },
      },
      gear: [
        { slot: 'อาวุธ', text: 'อะไรก็ได้ ยิ่งเพิ่ม DEX ยิ่งดี เช่นมีด 4 ช่องใส่การ์ด DEX +1 ครบ 4 ใบ (คลิปไม่ได้บอกชื่อการ์ด)', cites: [['zixma', '02:17']] },
        { slot: 'หมวก', text: 'หมวกออปชั่น SP (ชื่อหมวกซับฟังไม่ชัด)', cites: [['zixma', '02:37']] },
        { slot: 'เสื้อ', text: 'เสื้อออปชั่น SP ใส่ Roda Frog Card หรือหาเสื้อออปชั่น SP ถูกๆ แทน', items: [4014], cites: [['zixma', '02:41'], ['zixma', '02:47']] },
        { slot: 'รองเท้า', text: 'รองเท้าออปชั่น SP', cites: [['zixma', '02:52']] },
        { slot: 'ประดับ', text: 'Clip ใส่การ์ด Teleport (คลิปไม่ได้บอกชื่อการ์ด)', cites: [['zixma', '03:00']] },
        { slot: 'ผ้าคลุม', text: 'Baby Shark Bag ได้ SP ราว 100 กว่า', items: [480824], cites: [['zixma', '03:03']] },
        { slot: 'Special', text: 'Charming Ring ใส่ Baby Desert Wolf Egg ได้ SP 50 ถ้าเป็น Lv.2 ได้มากกว่านี้', items: [313600, 313601], cites: [['zixma', '03:23']] },
      ],
      play: [
        { text: 'ปิดการโจมตีปกติ ใส่ Steal ไว้ในหน้าสกิลของบอท', cites: [['zixma', '04:21']] },
        { text: 'ติ๊ก Teleport เมื่อกำจัดเป้าไม่ได้ภายใน 4 วินาที ผู้ทำคลิปบอกว่าข้อนี้สำคัญ', cites: [['zixma', '03:56']] },
        { text: 'เลือกขโมยแค่ 3 ชนิดมอนในแมพ ไม่เลือกมอนที่เหมือนต้นไม้ และตั้งจุดน้ำหนักไว้', cites: [['zixma', '04:08'], ['zixma', '04:53']] },
        { text: 'กด Small Mana Potion ไปเรื่อยๆ ไม่งั้น SP ฟื้นไม่ทัน', cites: [['zixma', '00:40'], ['zixma', '05:18']] },
      ],
      maps: [
        { text: 'แมพเลเวล 50 จากคลิปเก่าของช่อง คลิปนี้ไม่ได้บอกชื่อแมพ', cites: [['zixma', '00:23']] },
      ],
      cautions: [
        { text: 'ขโมยตัวไหนสำเร็จแล้วจะขโมยตัวนั้นซ้ำไม่ได้ จนกว่ามันจะตายแล้วเกิดใหม่', cites: [['zixma', '05:31']] },
      ],
    },
    {
      id: 'pre-assassin',
      name: 'เตรียมไป Crit Assassin',
      pickIf: 'จะเปลี่ยนเป็น Assassin สายคริ',
      idea: {
        text: 'ชุดสกิลและสเตตัสจากหน้า build บนเว็บ roz.prontera.info ชื่อ "Thief (50/50) (Pre CritAssa)" ในหน้าไม่มีคำอธิบาย การ์ด หรือออปชั่น',
        cites: [['pNax'], ['pKirito']],
      },
      stats: [
        { who: 'naxchefkoch (Thief 50/50)', str: '31', agi: '61', vit: '1', int: '1', dex: '23', luk: '2', cites: [['pNax']] },
        { who: 'kirito1990 (หน้าเว็บระบุ Assassin 50/50)', str: '25', agi: '60', vit: '11', int: '1', dex: '26', luk: '1', cites: [['pKirito']] },
      ],
      statNotes: [
        { text: 'การโจมตีคริติคอลโดนเสมอ ไม่สนค่า FLEE ของเป้า', cites: [['meta', '02:59']] },
      ],
      skills: [
        { skill: 'Double Attack', level: 10, cites: [['pNax'], ['pKirito']] },
        { skill: 'Improve Dodge', level: 10, cites: [['pNax'], ['pKirito']] },
        { skill: 'Steal', level: 10, cites: [['pNax'], ['pKirito']] },
        { skill: 'Envenom', level: '8-10', why: 'naxchefkoch 10, kirito1990 8', cites: [['pNax'], ['pKirito']] },
        { skill: 'Hiding', level: '8-10', why: 'naxchefkoch 8, kirito1990 10', cites: [['pNax'], ['pKirito']] },
        { skill: 'Detoxify', level: 1, cites: [['pNax'], ['pKirito']] },
      ],
      skillNotes: [
        { text: 'ชุดของ kirito1990 มีสกิล Assassin ติดมาด้วย (Righthand Mastery, Lefthand Mastery, Katar Mastery, Cloaking, Venom Knife) น่าจะเป็นตัว Assassin เลเวล 50 ไม่ใช่ Thief ล้วน', cites: [['pKirito']] },
      ],
      plan: {
        picks: { thief: { 'Double Attack': 10, 'Improve Dodge': 10, Steal: 10, Envenom: 10, Hiding: 8, Detoxify: 1 } },
        basis: { text: 'ชุดของ naxchefkoch ใช้ครบ 49 แต้มพอดี', cites: [['pNax']] },
      },
      gear: [
        { slot: 'อาวุธ', text: 'naxchefkoch ใช้ Damascus +5 · kirito1990 ใช้ Jamadhar +5 (Katar ของ Assassin)', cites: [['pNax'], ['pKirito']] },
        { slot: 'อื่นๆ', text: 'kirito1990 ใส่ Hill Patrol Boots, ผ้าคลุม Hood และ Venom Knife (กระสุน)', items: [470466, 480414, 1771], cites: [['pKirito']] },
        { slot: 'การ์ด', text: 'Soldier Skeleton Card ฟาร์มได้ตั้งแต่เป็น Thief ส่วน Sidewinder Card หาไม่ยาก และอาวุธ Jur ได้จาก Martin (คลิปอัดบนเซิร์ฟทดสอบก่อน Zero เปิด)', items: [4086, 4117], cites: [['ryanCrit', '04:10']] },
      ],
    },
    {
      id: 'pre-rogue',
      name: 'เตรียมไป Rogue สาย Shadow Spell',
      pickIf: 'จะเปลี่ยนเป็น Rogue สาย Shadow Spell',
      idea: {
        text: 'สามแหล่งเลือกสกิลตอนเป็น Thief แทบตรงกัน: Double Attack, Improve Dodge, Sword Mastery, Steal เต็ม แล้วเก็บ Hiding กับ Detoxify',
        cites: [['zeztz', '05:29'], ['mimiw', '01:41'], ['pFenir']],
      },
      skills: [
        { skill: 'Sword Mastery', level: 10, why: 'ซับฟังเป็น "SW" และ "source matter"', cites: [['zeztz', '05:29'], ['mimiw', '01:41'], ['pFenir']] },
        { skill: 'Improve Dodge', level: 10, cites: [['zeztz', '05:29'], ['mimiw', '01:41'], ['pFenir']] },
        { skill: 'Double Attack', level: 10, cites: [['zeztz', '05:29'], ['mimiw', '01:41'], ['pFenir']] },
        { skill: 'Steal', level: 10, cites: [['zeztz', '05:29'], ['mimiw', '01:41'], ['pFenir']] },
        { skill: 'Hiding', level: 5, why: 'MimiwPK ลงแต้มที่เหลือทั้งหมดที่นี่', cites: [['zeztz', '05:29'], ['mimiw', '01:54'], ['pFenir']] },
        { skill: 'Detoxify', level: 1, why: 'ไว้แก้พิษ', cites: [['zeztz', '05:29'], ['mimiw', '01:54'], ['pFenir']] },
        { skill: 'Envenom', level: 3, why: 'ทางผ่านไป Detoxify', cites: [['zeztz', '05:29'], ['pFenir']] },
      ],
      plan: {
        picks: { thief: { 'Sword Mastery': 10, 'Improve Dodge': 10, 'Double Attack': 10, Steal: 10, Hiding: 5, Detoxify: 1, Envenom: 3 } },
        basis: { text: 'ชุดของ Zeztz ตรงกับ xFENIRx บนเว็บ ใช้ครบ 49 แต้ม', cites: [['zeztz', '05:29'], ['pFenir']] },
      },
      maps: [
        { text: 'เส้นทางเก็บเลเวลของ Zeztz อยู่ในหัวข้อเส้นทางด้านบน', cites: [['zeztz', '06:46']] },
      ],
    },
    {
      id: 'solo',
      name: 'สายตีเก็บเลเวล (AGI / Crit / Envenom)',
      pickIf: 'อยากเล่น Thief ตีมอนเก็บเลเวลเอง',
      idea: { text: 'Xiendong บอกว่า Thief เก็บเลเวลคนเดียวยาก เลยแนะนำให้สร้าง Mage คู่กัน', cites: [['xien', '04:35']] },
      missing: 'ยังไม่มีคลิปไหนสอนสาย Thief ล้วนแบบตีมอนเก็บเลเวล ทั้งสเตตัส สกิล และของ',
    },
  ],
  gaps: [
    'ยังไม่มีคลิปสอนสาย Thief ตีมอนเก็บเลเวลตัวเดียว',
    'ชื่อการ์ด DEX +1 การ์ด Teleport และชื่อแมพ Steal เลเวล 50 ของ ZixmaOne',
    'อัตราสำเร็จของ Steal ใน Zero',
    'ชื่อแมพที่ซับฟังไม่ชัดในเส้นทางของ Zeztz ("ฟุ", "warrior", "BL King")',
  ],
  sources: {
    zixma: { label: 'ZixmaOne', title: 'Ragnarok Zero: Steal-build Thief, easy botting on a budget', url: 'https://www.youtube.com/watch?v=NzMCuFotCac', kind: 'clip', lang: 'th' },
    xien: { label: 'Xiendong', title: 'My Current 1–60 Levelling Roadmap for my New Characters', url: 'https://www.youtube.com/watch?v=7ymM15xvYAY', kind: 'clip', lang: 'en' },
    meta: { label: 'Xiendong', title: 'Why Taiwan Players Build These Stats', url: 'https://www.youtube.com/watch?v=T5bjOqQomUc', kind: 'clip', lang: 'en' },
    tako: { label: 'TakoyakiCh', title: 'จัด Tierlist Class2 ในโลก RO-Zero', url: 'https://www.youtube.com/watch?v=Y7MKIY0KiYo', kind: 'clip', lang: 'th' },
    viva: { label: 'Viva-Tz', title: 'เริ่มต้นเล่น Ragnarok Zero อย่างมืออาชีพ คลิปนี้มีคำตอบ', url: 'https://www.youtube.com/watch?v=WGJRg3dQElI', kind: 'clip', lang: 'th' },
    kamonC: { label: 'KamonWay', title: 'How to Change to Class 2 for Every Job in 3 Minutes', url: 'https://www.youtube.com/watch?v=iTxVgyVGCbc', kind: 'clip', lang: 'en' },
    zeztz: { label: 'Zeztz', title: 'Rogue Autospell Guide: Everything You Need to Know in One Video', url: 'https://www.youtube.com/watch?v=UAUVtB-au3g', kind: 'clip', lang: 'th' },
    mimiw: { label: 'MimiwPK', title: 'Rogue Shadow Spell Build Review', url: 'https://www.youtube.com/watch?v=vOahEuyan_4', kind: 'clip', lang: 'th' },
    ncz: { label: 'NCZ', title: 'Recommended Leveling Maps Lv. 1-50', url: 'https://www.youtube.com/watch?v=IScycVE-tf8', kind: 'clip', lang: 'th' },
    ryanCrit: { label: 'Ryan Geldun (เซิร์ฟทดสอบ)', title: 'How to Build the Perfect Crit Assassin (RO Zero)', url: 'https://www.youtube.com/watch?v=DRW52BenrkM', kind: 'clip', lang: 'en' },
    pJob: { label: 'roz.prontera.info', title: 'Thief skills', url: 'https://roz.prontera.info/jobs/thief', kind: 'web' },
    pNax: { label: 'roz.prontera.info', title: 'Thief (50/50) (Pre CritAssa) โดย naxchefkoch', url: 'https://roz.prontera.info/builds/0fff49d5-10a7-46a1-a691-78e2488c6a3f', kind: 'web' },
    pKirito: { label: 'roz.prontera.info', title: 'Thief (50/50) (Pre CritAssa) โดย kirito1990', url: 'https://roz.prontera.info/builds/ffafd0c2-4cd8-4999-baab-eaa6cb49ddda', kind: 'web' },
    pFenir: { label: 'roz.prontera.info', title: 'Rogue build โดย xFENIRx', url: 'https://roz.prontera.info/builds/ae2f254c-b304-4688-aef9-6451d83769ec', kind: 'web' },
    owner: { label: 'ยืนยันในเกม', title: 'เจ้าของเว็บตรวจในเกม 22 ก.ย. 2026', url: '', kind: 'web' },
  },
};
