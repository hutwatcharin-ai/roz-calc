// Rogue guide. Drafted 22 Sep 2026 from Downloads/roz-job-guides/rogue.md and
// thief.md (levelling route and the Thief half of each skill plan), which cite
// every line to a clip timestamp or a web page. Items, monsters and skills were
// checked against the site database with .check-names.mjs; items with several
// ids of the same name (Gladius, Damascus, Gakkung Bow, Arbalest) are named in
// text only. The bow build comes from a clip recorded on a test server before
// Zero Global opened, so the page says so and quotes no numbers from it.
import type { ClassGuide } from './types';

export const rogue: ClassGuide = {
  slug: 'rogue',
  job: 'Rogue',
  jobTh: 'โร้ก',
  from: 'Thief',
  gathered: '22 ก.ย. 2026',
  summary:
    'อาชีพสองของ Thief สายหลักใน Zero คือ Shadow Spell ก๊อป Meteor Storm มาร่ายเองตอนตีปกติ เปิดบอทได้ทั้งวันโดยไม่ใช้ยาบัฟแคช ส่วนสายธนูยังมีแค่คลิปจากเซิร์ฟทดสอบ',
  facts: [
    { text: 'เปลี่ยนเป็น Rogue ได้ที่ Base Lv 50', cites: [['owner']] },
    { text: 'Job ตันที่ 70 ได้แต้มสกิล 69 แต้ม (ตอนเป็น Thief ได้ 49 แต้ม)', cites: [['owner']] },
    {
      text: 'Plagiarism, Preserve, Shadow Spell และ Triangle Shot อยู่ในผังสกิล Rogue เลย ได้ตั้งแต่เปลี่ยนอาชีพ',
      cites: [['owner'], ['pJob'], ['tako', '18:37']],
    },
    { text: 'ผังสกิล Rogue มีทั้งหมด 23 สกิล', cites: [['pJob']] },
  ],
  path: ['thief', 'rogue'],
  equipJob: 'Rogue',
  route: [
    { range: '1-25', text: 'Zeztz อยู่แมพเห็ดแดงข้างเมือง Payon ยาวถึง Lv 25 (NCZ บอกว่าอยู่ได้ราว Lv 15)', cites: [['zeztz', '06:46'], ['ncz', '02:40']] },
    { range: '1-30', text: 'หรือแบบ Xiendong: ปล่อยบอทตี Poison Spore ตั้งแต่ต้นจนถึงราว Lv 30 บางทีถึง 35 (คลิปไม่ได้บอกชื่อแมพ)', monsters: [1077], cites: [['xien', '01:12']] },
    { range: '30-35', text: 'Coco ที่ Geffen Field ดรอปรองเท้าแดงกับ Hood · หรือไปถ้ำมด ช่วงนี้เลเวลขึ้นช้าที่สุด', maps: ['gef_fild02'], monsters: [1104], cites: [['xien', '01:32'], ['xien', '01:40'], ['ncz', '06:48']] },
    { range: '35-50', text: 'ถ้ามีตัว Lv 50 ให้ปาร์ตี้พาเก็บที่ Hode ในทะเลทราย Sograt ปาร์ตี้แชร์ EXP ได้เมื่อเลเวลห่างไม่เกิน 15', maps: ['moc_fild17'], monsters: [1127], cites: [['xien', '02:07']] },
    { range: '35-50', text: 'ถ้าเล่นตัวเดียว: ถ้ำมดแบบชิลไม่เปลืองยา หรือแมพที่ซับฟังเป็น "warrior" ถ้ายอมเปลืองยา อยู่ได้ถึง 45-50', cites: [['zeztz', '06:58']] },
    { range: '40-50', text: 'Steel Chonchon ที่ Sograt Desert มอนเยอะมาก Xiendong แนะนำให้เอา Thief กับ Mage ที่สร้างคู่กันมาเก็บที่นี่ด้วยกัน', maps: ['moc_fild13'], monsters: [1042], cites: [['ncz', '13:01'], ['xien', '05:17']] },
    { range: '45-50', text: 'แบบชิล: Zeztz ไปแมพแมวน้ำ (น่าจะเป็น Fur Seal ที่ Comodo) · แบบเร่ง: เติม full buff จาก Cash Shop แล้วไปแมพหมูหรือแมพที่ซับฟังเป็น "BL King" ราว 15 ชม.', maps: ['cmd_fild02'], monsters: [1317], cites: [['zeztz', '07:11'], ['zeztz', '07:20']] },
    { range: '50', text: 'เปลี่ยนเป็น Rogue', cites: [['owner']] },
    { range: '50-60', text: 'หลังเปลี่ยนเป็น Rogue แล้ว Xiendong อยู่ Nordfeld Cave 2F จนถึง Lv 60', maps: ['nrd_dun02'], cites: [['xien', '06:12']] },
  ],
  routeNotes: [
    { text: 'Thief เก็บเลเวลคนเดียวยาก Xiendong แนะนำให้สร้าง Mage คู่กันไปตั้งแต่ต้น แล้วเก็บเลเวลด้วยกัน', cites: [['xien', '04:35']] },
    { text: 'รีเซ็ตสเตตัสและสกิลได้ฟรีจนถึง Lv 40 หลังจากนั้นต้องเสียเงินจริง', cites: [['xien', '02:39']] },
  ],
  gearByLevel: [
    { range: 'ทั้งทาง', slot: 'ออปชั่น', text: 'ระบบออปชั่นสุ่มทำให้ FLEE 250-300 ได้ตั้งแต่ต้นเกม ถ้าได้ FLEE ราว 15 ขึ้นไปจากเกราะแต่ละชิ้น', cites: [['meta', '03:33'], ['meta', '06:59']] },
    { range: '30-35', slot: 'หมวก / รองเท้า', text: 'Hood กับรองเท้าแดงจาก Coco', items: [480414], cites: [['ncz', '06:48']] },
    { range: '50+', slot: 'อาวุธ', text: 'มีดเลเวล 3 ตีบวกสูงๆ ทุก +1 ได้ทั้ง ATK และ MATK', cites: [['mimiw', '03:24']] },
    { range: '50+', slot: 'เสื้อ', text: 'Nordfeld Soldier\'s Armor ให้ AGI 3 กับ DEX 3 ตี +7/+9 ได้ HIT/FLEE เพิ่ม', items: [450588], cites: [['zeztz', '03:31']] },
    { range: '50+', slot: 'หมวก', text: 'หมวกแลกหินเหลือง 300 ก้อนในปราสาท หินได้จากแมพที่ซับฟังเป็น "น็อตเฟล ชั้น 2"', cites: [['zeztz', '01:18']] },
  ],
  strengths: [
    { text: 'สาย Shadow Spell เปิดบอทได้ทั้งวันโดยไม่ใช้ยาบัฟแคช', cites: [['zixma', '00:07']] },
    { text: 'Meteor Storm ที่ Shadow Spell ร่ายออกมาไม่กิน SP และตีวืดก็ยังร่ายออก', cites: [['zixma', '09:47'], ['mimiw', '01:21']] },
    { text: 'TakoyakiCh มองว่าสายธนูเก่ง เพราะมี Triangle Shot และก๊อปสกิลตีสามทีมาใช้กับการตีปกติได้ (ประเมินก่อนอาชีพสองเปิด)', cites: [['tako', '18:37']] },
  ],
  weaknesses: [
    { text: 'ต้องหาคนร่ายสกิลให้ก๊อป: เข้าแมพที่ PK ได้ แล้วนัดให้ Wizard ร่าย Meteor Storm ใส่ตัวเอง', cites: [['zixma', '06:17'], ['zeztz', '08:03']] },
    { text: 'ถ้าร่าย Shadow Spell ใหม่แล้วโดนขัด บอทจะอยู่แบบไม่มีบัฟจนถึงรอบถัดไป', cites: [['zixma', '08:24']] },
    { text: 'สายธนูน้ำหนักเต็มเร็ว (คลิปจากเซิร์ฟทดสอบ)', cites: [['ryan', '02:09'], ['ryan', '13:40']] },
    { text: 'TakoyakiCh คิดว่าสาย Shadow Spell ไม่น่าเก่งเท่าไหร่ ขัดกับคลิปที่เล่นจริงหลังอาชีพสองเปิด (ZixmaOne, Zeztz)', cites: [['tako', '18:53'], ['zixma', '00:02'], ['zeztz', '05:39']] },
  ],
  builds: [
    {
      id: 'shadow-spell',
      name: 'สาย Shadow Spell (Meteor Storm)',
      tag: 'สายหลัก',
      pickIf: 'อยากเปิดบอทเก็บเลเวลทั้งวันโดยไม่ใช้ยาบัฟแคช',
      idea: {
        text: 'ก๊อป Meteor Storm จาก Wizard แล้วล็อกไว้ด้วย Preserve จากนั้น Shadow Spell จะร่าย Meteor Storm ให้เองขณะตีปกติ ยิ่งตีเร็วยิ่งร่ายบ่อย',
        cites: [['zixma', '00:02'], ['zeztz', '05:39'], ['mimiw', '00:47']],
      },
      stats: [
        { who: 'ZixmaOne (Lv 53)', agi: '60', int: '10', dex: 'ที่เหลือ', note: 'จะอัพ DEX ถึง 50 แล้วค่อยเติม AGI', cites: [['zixma', '03:11']] },
        { who: 'Zeztz', agi: '70', int: '40', dex: '28', note: 'ไม่บัฟ ได้ HIT 289, FLEE 366, ASPD 170', cites: [['zeztz', '05:15'], ['zeztz', '04:57']] },
        { who: 'MimiwPK', agi: '80', int: 'ที่เหลือ', dex: 'ไม่อัพ', cites: [['mimiw', '00:47']] },
        { who: 'xFENIRx (เว็บ)', str: '1', agi: '57', vit: '1', int: '37', dex: '40', luk: '1', cites: [['pFenir']] },
      ],
      statNotes: [
        { text: 'แหล่งไม่ตรงกันเรื่อง DEX: MimiwPK บอกว่าไม่ต้องอัพ เพราะตีวืดก็ยังร่าย ส่วน ZixmaOne บอกว่าต้องมีพอให้ตีโดน เพราะ Hunter Fly Card ดูดเลือดได้เฉพาะตอนตีโดน', cites: [['mimiw', '01:21'], ['zixma', '03:55']] },
        { text: 'INT ให้ MATK และช่วยฟื้น SP · AGI ให้ ASPD และ FLEE', cites: [['zixma', '03:11'], ['zeztz', '05:15']] },
      ],
      skills: [
        { skill: 'Plagiarism', level: 10, why: 'สกิลก๊อป ต้องเต็มก่อนถึงจะอัพ Preserve กับ Shadow Spell ได้', cites: [['zeztz', '05:39'], ['zixma', '06:10'], ['pPreserve']] },
        { skill: 'Preserve', level: 1, why: 'ล็อกสกิลที่ก๊อปไว้ไม่ให้หาย', cites: [['mimiw', '02:09'], ['zeztz', '05:39']] },
        { skill: 'Shadow Spell', level: 10, why: 'สกิลหลัก ร่ายสกิลที่ก๊อปมาขณะตีปกติ', cites: [['mimiw', '02:13'], ['zeztz', '05:39']] },
        { skill: "Vulture's Eye", level: 10, why: 'MimiwPK เก็บไว้เผื่อไปเล่นสายธนู', cites: [['mimiw', '02:35']] },
        { skill: 'Gank', level: 10, why: 'ตีปกติมีโอกาสขโมยของ ZixmaOne ไม่อัพเพราะของขยะเต็มกระเป๋า', cites: [['mimiw', '02:52'], ['zixma', '04:51']] },
      ],
      skillNotes: [
        { text: 'ตอนเป็น Thief ทั้งสามแหล่งเอา Double Attack, Improve Dodge, Sword Mastery, Steal เต็ม แล้วเก็บ Hiding กับ Detoxify', cites: [['zeztz', '05:29'], ['mimiw', '01:41'], ['pFenir']] },
        { text: 'Zeztz เอาแค่ Plagiarism, Preserve, Shadow Spell เต็ม ส่วนที่เหลือให้เลือกเอง · xFENIRx บนเว็บลง Gank 10, Back Stab 4, Stalk 2, Sightless Mind 5, Snatch 5', cites: [['zeztz', '05:39'], ['pFenir']] },
        { text: 'Gank 10 ทำให้ขโมยติดถี่ขึ้นถึง 20% ของขยะเข้ากระเป๋าเร็ว', cites: [['zixma', '10:42']] },
      ],
      plan: {
        picks: {
          thief: { 'Double Attack': 10, 'Improve Dodge': 10, 'Sword Mastery': 10, Steal: 10, Detoxify: 1, Hiding: 5 },
          rogue: { Plagiarism: 10, Preserve: 1, 'Shadow Spell': 10, "Vulture's Eye": 10, Gank: 10 },
        },
        basis: { text: 'สกิลที่ MimiwPK เลือก ทั้งตอน Thief และ Rogue (Hiding ใช้แต้มที่เหลือตามคลิป ได้ 5 เท่ากับของ Zeztz)', cites: [['mimiw', '01:41'], ['mimiw', '02:09'], ['zeztz', '05:29']] },
        leftover: { text: 'แต้มที่เหลือ: MimiwPK บอกว่าจะลง Triangle Shot ก็ได้ เผื่อเล่นสายธนู (ต้องมี Double Strafe 7 ก่อน)', cites: [['mimiw', '03:14'], ['pTri']] },
      },
      gear: [
        { slot: 'อาวุธ', text: 'Gladius หรือ Damascus ตี +7 ขึ้นไป ทุก +1 เพิ่ม MATK ออปชั่นที่ดีที่สุดคือ ASPD หรือ FLEE · Gladius มี 3 ช่อง Damascus มี 2 ช่อง', cites: [['zixma', '01:07'], ['zeztz', '02:15'], ['zeztz', '02:35']] },
        { slot: 'การ์ดอาวุธ', text: 'Hunter Fly Card 2 ใบ ดูดเลือด ช่องที่ 3 ของ Gladius ใส่การ์ดชนะเผ่ามอนในแมพนั้น', items: [27266], cites: [['zeztz', '02:15'], ['zixma', '03:55'], ['zeztz', '02:35']] },
        { slot: 'หมวก', text: 'ออปชั่น FLEE หรือ MATK ตามแมพ อย่างละราว 20 · MimiwPK เลือก HP + MATK หรือ HP + FLEE', cites: [['zeztz', '01:18'], ['zixma', '00:57'], ['mimiw', '04:41']] },
        { slot: 'ปาก', text: 'ของปากจากดัน Poring (ดันรายวัน) มีหรือไม่มีก็ได้', cites: [['zeztz', '02:04']] },
        { slot: 'เสื้อ', text: 'Nordfeld Soldier\'s Armor ออปชั่น HP ก่อน แล้วค่อย FLEE', items: [450588], cites: [['zeztz', '03:31'], ['zixma', '02:52'], ['mimiw', '04:08']] },
        { slot: 'ผ้าคลุม', text: 'ออปชั่น FLEE + HP ใส่ Baby Shark Card (EXP กับดรอป +7% ของกิจกรรม) หรือ Shark Family Card (MATK)', items: [300834, 300835], cites: [['zeztz', '03:14'], ['mimiw', '04:25'], ['zixma', '01:49']] },
        { slot: 'รองเท้า', text: 'ออปชั่น FLEE กับ ASPD · Zeztz ใช้ "รองเท้าดำ" ลด After Attack Delay 5% (คลิปไม่ได้บอกชื่อ)', cites: [['zixma', '02:15'], ['zeztz', '04:07']] },
        { slot: 'ประดับ', text: 'Clip ใส่การ์ด Teleport กับ Clip ใส่ Yoyo Card · MimiwPK ใส่การ์ด Teleport กับการ์ด Heal (น่าจะเป็น Vitata Card)', items: [2607, 4051, 4053], cites: [['zixma', '02:08'], ['mimiw', '04:55']] },
        { slot: 'Special', text: 'ไข่ Chonchon เพิ่ม FLEE', items: [313592, 313593], cites: [['zixma', '03:03']] },
      ],
      play: [
        { text: 'วิธีก๊อป: ปิด Preserve ก่อน ให้ Wizard ร่าย Meteor Storm Lv 10 ใส่ตัวเราในแมพที่ PK ได้ แล้วกด Preserve ล็อก จะมีไอคอนรูปคนที่แถบบัฟ', cites: [['mimiw', '05:12'], ['zixma', '06:36'], ['zixma', '06:48']] },
        { text: 'เข้าแมพ PK: ซื้อ Key to the Hidden World จาก Cash Shop ใช้แล้วได้แหวน คุย NPC เลือก Channel Y หรือ Z · หรือแมพ Field Boss แต่มีแก๊งดักฆ่า', cites: [['zeztz', '08:11'], ['zeztz', '09:06']] },
        { text: 'ตั้งบอท: ใส่ Preserve กับ Shadow Spell ในหน้าสกิล แล้วเลือก Meteor Storm · ติ๊กโจมตีปกติในหน้าแรก', cites: [['zixma', '07:24'], ['zeztz', '06:22'], ['mimiw', '06:38']] },
        { text: 'ระยะวนร่าย Shadow Spell: ZixmaOne ตั้ง 120 วินาที (ค่าเริ่มต้น 60 ถี่ไปจน SP หมด) Zeztz ตั้ง 290 วินาที', cites: [['zixma', '07:53'], ['zeztz', '06:31']] },
        { text: 'ก่อนเปิดบอทให้กด Shadow Spell เองหนึ่งครั้ง · ZixmaOne ใช้แค่ยาเขียว', cites: [['mimiw', '07:25'], ['zixma', '05:58']] },
      ],
      maps: [
        { text: 'ZixmaOne บอทที่แมพ "งูดำ" ต้องมี FLEE 339 ถึงหลบได้ 95% (ยังไม่รู้ชื่อมอน)', cites: [['zixma', '04:26'], ['zixma', '10:20']] },
        { text: 'หลังเปลี่ยนเป็น Rogue Xiendong อยู่ Nordfeld Cave 2F ถึง Lv 60', cites: [['xien', '06:12']] },
      ],
      cautions: [
        { text: 'ถ้าอัพ Gank สูง ขยะเข้ากระเป๋าเร็ว ตอนนอนให้ตั้งบอทไม่ต้องเก็บของ', cites: [['zixma', '10:42']] },
        { text: 'แมพที่มอนตีแม่น เสี่ยงโดนขัดตอนร่าย Shadow Spell', cites: [['zixma', '08:22']] },
        { text: 'ถ้า Preserve ล็อกอยู่ จะก๊อปสกิลใหม่ไม่ได้', cites: [['zixma', '06:48'], ['mimiw', '05:33']] },
      ],
    },
    {
      id: 'bow',
      name: 'สายธนูตีปกติ (เซิร์ฟทดสอบ)',
      pickIf: 'อยากลองสายธนูฟาร์มต้นเกม และรับได้ว่ายังไม่มีคนยืนยันใน Zero',
      idea: {
        text: 'ก๊อปสกิลตีสามที (Triple Attack) มาใช้กับธนู และใส่ Sidewinder Card ให้ Double Attack 10 ที่เรียนตอน Thief ทำงานกับธนู คลิปนี้อัดบนเซิร์ฟทดสอบก่อน Zero เปิด ไม่มีออปชั่นสุ่ม ใช้ได้แค่เป็นแนวคิด',
        cites: [['ryan', '00:24'], ['ryan', '03:45'], ['ryan', '00:10'], ['ryan', '03:38']],
      },
      stats: [
        { who: 'Ryan Geldun (เซิร์ฟทดสอบ Lv 90+)', str: '31', agi: '90', vit: '50', int: '0', dex: '80', luk: '0', note: 'STR ไว้แบกของ', cites: [['ryan', '06:07']] },
      ],
      skills: [
        { skill: 'Plagiarism', level: 10, why: 'แต้มส่วนใหญ่หมดไปกับการไปให้ถึงสกิลนี้', cites: [['ryan', '00:44']] },
        { skill: "Vulture's Eye", level: 10, cites: [['ryan', '00:55']] },
        { skill: 'Double Strafe', level: 5, cites: [['ryan', '00:58']] },
        { skill: 'Sightless Mind', level: 5, why: 'ใช้บ่อย เพราะเปลี่ยนธาตุตามลูกธนูได้ · Back Stab อัพแค่เป็นทางผ่าน', cites: [['ryan', '07:33'], ['ryan', '08:03']] },
      ],
      skillNotes: [
        { text: 'สกิลตีสามทีที่ก๊อปมาไม่มีในผังสกิล Rogue ต้องให้คนอื่นร่ายใส่', cites: [['ryan', '00:24']] },
      ],
      plan: {
        picks: {
          thief: { 'Double Attack': 10 },
          rogue: { Plagiarism: 10, "Vulture's Eye": 10, 'Double Strafe': 5, 'Sightless Mind': 5 },
        },
        basis: { text: 'สกิลที่ Ryan Geldun พูดในคลิป ตอน Thief คลิปบอกแค่ Double Attack 10', cites: [['ryan', '00:44'], ['ryan', '03:45'], ['ryan', '07:33']] },
      },
      gear: [
        { slot: 'อาวุธ', text: 'Gakkung Bow +8 หรือ Arbalest ใส่ Sidewinder Card กับ Cruiser Card · ถ้าเน้นอึดเปลี่ยน Sidewinder เป็น Hunter Fly Card', items: [4117, 4297, 27266], cites: [['ryan', '02:51'], ['ryan', '08:45']] },
        { slot: 'หมวก / เสื้อ', text: 'เซ็ตการ์ด Hunter: หมวกใส่ Mystcase Card เสื้อ Chain Mail หรือ Cotton Shirt ใส่ Anolian Card', items: [4206, 4234], cites: [['ryan', '01:28'], ['ryan', '02:07']] },
        { slot: 'รองเท้า', text: 'ออปชั่นฟื้น SP ใส่ Merman Card', items: [4199], cites: [['ryan', '04:40']] },
        { slot: 'ผ้าคลุม', text: 'Dragon Tail Card', items: [4178], cites: [['ryan', '04:59']] },
        { slot: 'ประดับ', text: 'Clip หรือ Belt ใส่ Alligator Card หรือ Cookie Card หรือ Glove ใส่ Zerom Card', items: [4252, 4293, 4064], cites: [['ryan', '05:17']] },
      ],
      maps: [
        { text: 'ในคลิปลองที่ Niflheim field, Sograt Desert, Luoyang, Pyramid บนเซิร์ฟทดสอบ ยังไม่ได้ยืนยันว่าแมพไหนเปิดใน Zero', cites: [['ryan', '08:25']] },
      ],
      cautions: [
        { text: 'น้ำหนักเต็มเร็ว และ SP หมดถ้าใช้ Sightless Mind เยอะ', cites: [['ryan', '13:40'], ['ryan', '18:30']] },
        { text: 'ผู้ทำคลิปบอกว่าเป็น build ฟาร์มต้นเกมเท่านั้น', cites: [['ryan', '01:16']] },
      ],
    },
    {
      id: 'triangle-shot',
      name: 'สาย Triangle Shot',
      pickIf: 'อยากเล่นธนูด้วยสกิลยิงของ Rogue เอง',
      idea: {
        text: 'Triangle Shot ใช้ลูกธนู 3 ลูกต่อครั้ง ดาเมจเพิ่มตาม Base Lv และ AGI ต้องมี Double Strafe 7 ก่อน TakoyakiCh มองว่าเก่ง',
        cites: [['pTri'], ['tako', '19:01']],
      },
      missing: 'ยังไม่มีคลิปรีวิวสายนี้ใน Zero ยังไม่มีข้อมูลสเตตัส สกิล หรือของ',
    },
    {
      id: 'divest',
      name: 'สาย Divest / PK',
      pickIf: 'อยากกวนผู้เล่นด้วยการถอดของ',
      idea: { text: 'Xiendong มีแผนจะลองทำ FLEE ราว 400 แล้วถอดของผู้เล่น แต่ยังเป็นแค่ไอเดีย', cites: [['xienSD', '08:46']] },
      missing: 'ยังไม่มีใครทำจริงให้ดู ยังไม่มีข้อมูลสเตตัส สกิล หรือของ',
    },
  ],
  gaps: [
    'ยังไม่มีคลิปพิสูจน์สายธนู (สกิลตีสามทีที่ก๊อปมา หรือ Triangle Shot) ใน Zero จริง',
    'ชื่อแมพ "งูดำ" ชื่อการ์ดรองเท้าที่ซับฟังเป็น "เมลติ" และชื่อรองเท้าดำของ Zeztz',
    'ชื่อแหวนและของกิจกรรมที่ Zeztz ใส่ ซับฟังไม่ชัดและหาไม่เจอในฐานข้อมูล',
    'แมพเก็บเลเวลหลัง Lv 60 ยังไม่มีใครบอก',
  ],
  sources: {
    zixma: { label: 'ZixmaOne', title: 'Ragnarok Zero: Shadow Spell build guide, AFK farming without cash buffs', url: 'https://www.youtube.com/watch?v=IStS-5Rp_aM', kind: 'clip', lang: 'th' },
    zeztz: { label: 'Zeztz', title: 'Rogue Autospell Guide: Everything You Need to Know in One Video', url: 'https://www.youtube.com/watch?v=UAUVtB-au3g', kind: 'clip', lang: 'th' },
    mimiw: { label: 'MimiwPK', title: 'Rogue Shadow Spell Build Review', url: 'https://www.youtube.com/watch?v=vOahEuyan_4', kind: 'clip', lang: 'th' },
    tako: { label: 'TakoyakiCh', title: 'จัด Tierlist Class2 ในโลก RO-Zero', url: 'https://www.youtube.com/watch?v=Y7MKIY0KiYo', kind: 'clip', lang: 'th' },
    xien: { label: 'Xiendong', title: 'My Current 1–60 Levelling Roadmap for my New Characters', url: 'https://www.youtube.com/watch?v=7ymM15xvYAY', kind: 'clip', lang: 'en' },
    xienSD: { label: 'Xiendong', title: 'SOUL DESTROYER Assassin Starts Weak… Until This Happens', url: 'https://www.youtube.com/watch?v=CDwTVgVPv4g', kind: 'clip', lang: 'en' },
    meta: { label: 'Xiendong', title: 'Why Taiwan Players Build These Stats', url: 'https://www.youtube.com/watch?v=T5bjOqQomUc', kind: 'clip', lang: 'en' },
    ncz: { label: 'NCZ', title: 'Recommended Leveling Maps Lv. 1-50', url: 'https://www.youtube.com/watch?v=IScycVE-tf8', kind: 'clip', lang: 'th' },
    ryan: { label: 'Ryan Geldun (เซิร์ฟทดสอบ)', title: 'Broken or Balanced? My Rogue Build for Ragnarok Zero', url: 'https://www.youtube.com/watch?v=f7yN49Xpn7s', kind: 'clip', lang: 'en' },
    pJob: { label: 'roz.prontera.info', title: 'Rogue skills', url: 'https://roz.prontera.info/jobs/rogue', kind: 'web' },
    pFenir: { label: 'roz.prontera.info', title: 'Rogue build โดย xFENIRx', url: 'https://roz.prontera.info/builds/ae2f254c-b304-4688-aef9-6451d83769ec', kind: 'web' },
    pPreserve: { label: 'roz.prontera.info', title: 'Preserve', url: 'https://roz.prontera.info/skills/preserve', kind: 'web' },
    pTri: { label: 'roz.prontera.info', title: 'Triangle Shot', url: 'https://roz.prontera.info/skills/triangle-shot', kind: 'web' },
    owner: { label: 'ยืนยันในเกม', title: 'เจ้าของเว็บตรวจในเกม 22 ก.ย. 2026', url: '', kind: 'web' },
  },
};
