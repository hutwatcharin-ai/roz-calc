// Mage guide. Drafted 22 Sep 2026 from Downloads/roz-job-guides/mage.md,
// which cites every line to a clip timestamp or a web page. Items, monsters and
// skills were checked against the site database; names the clips only mumble
// are left without an id and say so on the page.
import type { ClassGuide } from './types';

export const mage: ClassGuide = {
  slug: 'mage',
  job: 'Mage',
  jobTh: 'เมจ',
  from: 'Novice',
  gathered: '22 ก.ย. 2026',
  summary:
    'อาชีพหนึ่งสายเวท เก็บเลเวลเร็วด้วย Earth Spike ใส่ Parasite ตัวบางแต่ปล่อยบอทได้ทั้งวันถ้าทำ FLEE กับการฟื้น SP ให้พอ ต่อไปเป็น Wizard หรือ Sage',
  facts: [
    { text: 'เปลี่ยนอาชีพสองได้ที่ Base Lv 50 ใช้แต้มสกิลให้หมดก่อนเปลี่ยน', cites: [['owner'], ['kamonC2', '00:44'], ['kamonC2', '00:51']] },
    { text: 'Job ตันที่ 50 ได้แต้มสกิล 49 แต้ม', cites: [['owner']] },
    {
      text: 'Mage ใน Zero มี Earth Spike ในผังสกิลเลย (ปกติเป็นสกิลอาชีพสอง) จึงมีเวทครบ 4 ธาตุ ดิน น้ำ ลม ไฟ',
      cites: [['kamonB', '00:54'], ['tako', '04:39']],
    },
  ],
  path: ['mage'],
  equipJob: 'Mage',
  route: [
    { range: '1-20', text: 'ทำเควสหลักไปก่อน เควสให้ตี Baby Poring, งู, Pudding ไล่ไปตามลำดับ', cites: [['mimiw', '01:20'], ['ginger', '00:44'], ['ginger', '01:28']] },
    { range: '~10-50', text: 'Parasite ที่ Kalala Swamp in Umbala ใช้ Earth Spike ตี ฟาร์มยาวได้ถึงเลเวล 50 ตัว Elite (C2 Parasite) ให้ EXP มากกว่ามาก', maps: ['um_fild03'], monsters: [1500, 2720], cites: [['ginger', '02:17'], ['zixma', '02:25'], ['resbakk', '02:47']] },
    { range: '~22-25', text: 'Coco ที่ Geffen Field หา Hood กับ Sandals ใช้ Fire Bolt ตี', maps: ['gef_fild09'], monsters: [1104], cites: [['zixma', '03:33'], ['ginger', '04:09']] },
    { range: 'ช่วงหาเสื้อ', text: 'Creamy หา Silk Robe MimiwPK ไปแมพที่ออกทางซ้ายของ Geffen แล้วขึ้นวาร์ปด้านบน', maps: ['gef_fild05'], monsters: [1018], cites: [['mimiw', '06:21']] },
    { range: 'หลังได้ของ', text: 'Steel Chonchon ที่ Sograt Desert ขึ้นช้ากว่า Parasite แต่ปล่อยบอทได้ไม่ต้องเฝ้าจอ', maps: ['moc_fild13'], monsters: [1042], cites: [['mimiw', '09:00'], ['ginger', '06:01'], ['ginger', '06:13']] },
    { range: '50', text: 'เปลี่ยนเป็น Wizard หรือ Sage ดูตำแหน่ง NPC จากหน้าเควสโดยค้นคำว่า "จ๊อบ"', cites: [['owner'], ['kamonC2', '00:44'], ['kamonC2', '00:55']] },
  ],
  routeNotes: [
    { text: 'Parasite อยู่แถบหนองน้ำฝั่งขวาของแมพ ฝั่งซ้ายมีน้อย ทางไป: จาก Prontera วาร์ปไป Morroc, Comodo, Umbala แล้วลง 2 แมพ ออกขวา 1 แมพ', cites: [['ginger', '02:34'], ['zixma', '01:02']] },
    { text: 'ยืนให้อยู่แนวตรงกับ Parasite (แนวตั้งหรือแนวนอน) ห้ามยืนเฉียง ไม่งั้นมันตีสวนถึง', cites: [['ginger', '03:18'], ['zixma', '03:10']] },
    { text: 'ช่วงเลเวล ~10 อย่าเพิ่งตี Parasite ตัว Elite เพราะติดแคปเลเวล ตั้งแต่ ~25 ขึ้นไปค่อยตี', cites: [['ginger', '03:11'], ['ginger', '05:27']] },
    { text: 'ก่อนเลเวล 40 รีเซ็ตสกิลกับสเตตัสได้ฟรี ที่ NPC แว่นดำในเมือง เข้าแมพพิเศษแล้วคุยกับ MC เสื้อชมพู เลือกข้อ 2', cites: [['ginger', '01:44'], ['ginger', '01:58']] },
    { text: 'Xiendong แนะนำทำ Mage คู่กับตัวที่เก็บเลเวลยาก (เช่น Thief) แล้วให้ Mage ช่วยเก็บเลเวลที่ Steel Chonchon', cites: [['roadmap', '04:33']] },
  ],
  gearByLevel: [
    { range: 'ทั้งทาง', slot: 'อาวุธ', text: 'Shining Metal Staff +7 (สองมือ) จาก Shining Staff Box ในร้านเงินจริง ราคาราว 3,000 MATK ราว 105 ในกล่องเลือกได้ระหว่างไม้เท้ากับคทาสองมือ ตัวสองมือแรงกว่า', items: [640073, 200927], cites: [['mimiw', '05:38'], ['mimiw', '05:50'], ['zixma', '01:51'], ['zixma', '02:05']] },
    { range: '~20-25', slot: 'เสื้อ', text: 'Silk Robe ดรอปจาก Creamy ออปชั่นที่ควรหา: HP, SP, อัตราฟื้น SP', items: [450345], cites: [['mimiw', '06:21'], ['mimiw', '07:20']] },
    { range: '~22-25', slot: 'ผ้าคลุม / รองเท้า', text: 'Hood กับ Sandals ดรอปจาก Coco ของแสงม่วงมีออปชั่น 3 แถว หาออปชั่น HP 1-2 แถว จะได้ไม่โดน Parasite ตีทีเดียวตาย', items: [480414, 470257], cites: [['zixma', '04:07'], ['mimiw', '10:34'], ['ginger', '04:18'], ['zixma', '04:19']] },
    { range: 'ช่วงบอท', slot: 'ออปชั่น', text: 'ตอนเปลี่ยนไปปล่อยบอท ZixmaOne หาออปชั่น FLEE กับ Max SP แทน', cites: [['zixma', '05:03'], ['zixma', '10:24']] },
  ],
  strengths: [
    { text: 'เก็บเลเวลเร็ว หลายคลิปใช้ Earth Spike ตี Parasite (ธาตุลม) ยาวถึงเลเวล 40-50', cites: [['ginger', '02:12'], ['zixma', '02:25'], ['resbakk', '02:47']] },
    { text: 'ตีมอนตายในทีเดียวได้ง่าย และปล่อยบอทฟาร์มของได้', cites: [['zixma', '00:10']] },
    { text: 'ปล่อยบอทได้ 24 ชม. ไม่ต้องใช้ยาหรือบัฟ ถ้า FLEE กับการฟื้น SP สูงพอ', cites: [['pop', '00:09']] },
    { text: 'เวทไม่ต้องสนใจค่า FLEE ของมอน', cites: [['meta', '04:59']] },
  ],
  weaknesses: [
    { text: 'ตัวบาง ช่วงเลเวล ~25 HP ราว 300 แต่ Parasite ตีครั้งละราว 400-500 โดนทีเดียวตาย', cites: [['ginger', '04:36']] },
    { text: 'ตายแล้วเสีย EXP 10% (มีไอเทมเงินจริงลดเหลือ 5% นาน 30 วัน)', cites: [['ginger', '04:31'], ['ginger', '07:56']] },
    { text: 'อาวุธธรรมดาไม่ตีบวกตีเบา ต้องใช้คทา +7 ถึงจะฟาร์มได้เร็ว', cites: [['zixma', '02:16']] },
    { text: 'น้ำหนักเกิน 70-75% SP ฟื้นไม่ทัน บอทจะเริ่มตาย', cites: [['zixma', '08:02'], ['pop', '07:10']] },
  ],
  builds: [
    {
      id: 'earth-spike',
      name: 'สาย Earth Spike เก็บเลเวล',
      tag: 'สายหลัก',
      pickIf: 'อยากเก็บเลเวลให้ถึง 50 เร็วที่สุด เล่นมือหรือเฝ้าบอท',
      idea: {
        text: 'ใช้ Earth Spike (ธาตุดิน) ตีมอนธาตุลม EXP สูงอย่าง Parasite ช่วงเลเวล 10 กว่า ฆ่าตัวเดียวได้ EXP เกิน 1 เลเวล ทางอื่นอย่าง Fire Wall กับ Fire Ball ใส่ Orc Warrior ผู้ทำคลิปลองแล้วช้ากว่า',
        cites: [['ginger', '02:12'], ['ginger', '03:45'], ['ginger', '05:09']],
      },
      stats: [
        { who: 'ZixmaOne (ช่วงแรก)', int: 'เน้นก่อน', cites: [['zixma', '04:01']] },
        { who: 'MimiwPK', int: 'ที่เหลือ', dex: '30', note: 'DEX 30 ก่อนเพื่อลดเวลาร่าย', cites: [['mimiw', '08:24']] },
        { who: 'Ginger (Lv 50)', int: '65', dex: '34', cites: [['ginger', '06:39']] },
        { who: 'ZixmaOne (หลัง Lv 37)', agi: 'ลง', int: 'ลง', note: 'รีสเตตัสเป็น AGI + INT เพื่อเปลี่ยนไปปล่อยบอท AGI ไว้หลบ INT ไว้ตีแรงและเพิ่ม Max SP', cites: [['zixma', '04:47']] },
      ],
      statNotes: [
        { text: 'แหล่งขัดกันเรื่อง DEX: MimiwPK ให้ลง 30 แต่ PoP Chanal ว่าในเวอร์ชันนี้ DEX ลดร่ายได้น้อย', cites: [['mimiw', '08:24'], ['pop', '01:30']] },
      ],
      skills: [
        { skill: 'Fire Bolt', level: 4, why: 'ช่วงทำเควสหลัก ได้แต้มแรกก็อัพตัวนี้', cites: [['ginger', '00:50'], ['ginger', '01:38']] },
        { skill: 'Lightning Bolt', level: '2-3', why: 'ไม่บังคับ ช่วยให้ทำเควส Pudding เร็วขึ้น', cites: [['ginger', '01:30']] },
        { skill: 'Stone Curse', level: 1, why: 'Job ~7 ไปรีเซ็ตสกิลฟรี แล้วลงตัวนี้เป็นทางผ่าน', cites: [['ginger', '01:54'], ['ginger', '02:12']] },
        { skill: 'Earth Spike', level: 5, why: 'สกิลหลักใช้ตี Parasite', cites: [['ginger', '02:12'], ['zixma', '02:25']] },
        { skill: 'Increase SP Recovery', level: 10, cites: [['ginger', '03:50']] },
        { skill: 'Fire Bolt', level: 4, why: 'กลับมาอัพให้ถึง 4 ไว้ตี Coco (ธาตุดิน) หาของ', cites: [['ginger', '04:09'], ['zixma', '03:52']] },
        { skill: 'Energy Coat', level: 1, why: 'ลดดาเมจ ถ้า HP น้อยแล้วกลัวโดนทีเดียวตาย', cites: [['ginger', '02:41'], ['zixma', '04:34']] },
      ],
      skillNotes: [
        { text: 'ก่อนเปลี่ยนอาชีพ ใช้แต้ม Basic Skill ให้ครบเลเวล 9', cites: [['mimiw', '02:10']] },
        { text: 'ZixmaOne ลง Earth Spike ตั้งแต่ Job ต่ำๆ แล้วใช้กับ Parasite ตั้งแต่ต้น', cites: [['zixma', '02:25']] },
      ],
      plan: {
        picks: {
          mage: { 'Stone Curse': 1, 'Earth Spike': 5, 'Increase SP Recovery': 10, 'Fire Bolt': 4, 'Energy Coat': 1 },
        },
        basis: { text: 'สกิลที่ Ginger ลงหลังรีเซ็ตสกิลฟรี ไม่นับ Lightning Bolt ที่ใช้แค่ช่วงทำเควส', cites: [['ginger', '02:12'], ['ginger', '03:50'], ['ginger', '02:41']] },
        leftover: { text: 'แต้มที่เหลือ: ถ้ารู้แล้วว่าจะไปอาชีพสองสายไหน ดูสกิลที่ต้องเตรียมในสายด้านล่าง', cites: [['zixmaNV', '02:12'], ['kanda', '01:41']] },
      },
      gear: [
        { slot: 'อาวุธ', text: 'Shining Metal Staff +7 (ในคลิป Ginger เรียกว่า Shining Star)', items: [640073], cites: [['ginger', '02:48'], ['mimiw', '05:38']] },
        { slot: 'ผ้าคลุม', text: 'Hood ออปชั่น HP แถวเดียวก็ได้ HP เพิ่มเกือบ 500', items: [480414], cites: [['ginger', '04:46']] },
        { slot: 'ของเงินจริง', text: 'Ginger ใช้ Essential Package (EXP +10% ดรอป +10% 30 วัน), Small Mana Potion, Premium Course Meal และ Challenge Drink ผู้ทำคลิปบอกว่าลดร่าย 30% แต่ในฐานข้อมูลลดแค่ fixed cast 30%', items: [200893], cites: [['ginger', '06:54'], ['ginger', '07:35'], ['ginger', '07:47'], ['ginger', '08:22'], ['dbDrink']] },
      ],
      play: [
        { text: 'ตั้งบอทที่ Coco ใช้ Fire Bolt Lv 2 ไม่ใช่ 4-5 เพราะร่ายไว ลงก่อนได้สิทธิ์เก็บของแม้มีคนมาแจม', cites: [['zixma', '06:41'], ['zixma', '08:58']] },
        { text: 'ถ้าตั้งบอทให้ตีธรรมดาตอน SP หมด บอทจะเข้าไปเคาะมอนด้วยคทา ควรติ๊กปิด', cites: [['kamonB', '14:46']] },
      ],
      maps: [
        { text: 'Parasite: Lv 98 ธาตุลม HP 20,097 ตัว Elite (C2 Parasite) HP 200,970 EXP 154,590 เทียบตัวปกติ 12,058', cites: [['dbParasite'], ['dbC2']] },
        { text: 'Steel Chonchon ถ้าตีไม่ตายในทีเดียวจะเรียกพวกมารุม', cites: [['mimiw', '09:41']] },
      ],
      cautions: [
        { text: 'คลิปของ Ginger อัดช่วงทดสอบก่อนเกมเปิดจริง ไอเทมบัฟตอนเปิดจริงอาจต่างไป', cites: [['ginger', '02:48'], ['ginger', '06:52']] },
        { text: 'ZixmaOne ตี Parasite ถึงเลเวล 37 ใช้เวลาราว 3 ชม. โดยมีบัฟเงินจริง', cites: [['zixma', '04:47'], ['zixma', '05:47']] },
      ],
    },
    {
      id: 'flee-bot',
      name: 'สาย FLEE บอท 24 ชม.',
      pickIf: 'อยากปล่อยบอทหาของทั้งวันโดยไม่ใช้ยาหรือบัฟ',
      idea: {
        text: 'สองค่าหลักคือ FLEE กับการฟื้น SP ตัวผู้ทำคลิปมี FLEE ราว 270 Max SP 1,038 โดยไม่เปิดบัฟ อัตราฟื้น SP 77% เขาคิดว่า 70% ก็พอ',
        cites: [['pop', '01:06'], ['pop', '05:22'], ['pop', '05:31']],
      },
      stats: [
        { who: 'PoP Chanal', agi: '~40', int: '~50 (หรือ 60)', dex: '15', note: 'อนาคตอาจไม่ลง DEX เลย ย้ายไป INT หรือ AGI', cites: [['pop', '01:18'], ['pop', '01:30']] },
      ],
      skills: [
        { skill: 'Increase SP Recovery', level: 10, why: 'สกิลหลักของสายนี้ ผู้ทำคลิปบอกว่าฟื้น SP 30 + 2% ของ Max SP', cites: [['pop', '01:44'], ['pop', '02:30']] },
        { skill: 'Fire Bolt', level: 8, why: 'ใช้ตั้งบอท ปิดมอนได้ใน 2 ฮิตและประหยัด SP ที่สุด', cites: [['pop', '06:26']] },
        { skill: 'Energy Coat', level: 1, why: 'ใช้เป็นบัฟ', cites: [['pop', '06:44']] },
      ],
      skillNotes: [
        { text: 'สกิลอื่นเลือกตามแมพ: ตีมอนธาตุน้ำใช้สกิลธาตุลม ตีมอนธาตุดินใช้สกิลธาตุไฟ รีสกิลได้ด้วยไอเทมราคาไม่ถึง 100', cites: [['pop', '02:02'], ['pop', '02:14']] },
      ],
      plan: {
        picks: {
          mage: { 'Increase SP Recovery': 10, 'Fire Bolt': 8, 'Energy Coat': 1 },
        },
        basis: { text: 'สกิลที่ PoP Chanal บอกในคลิป ที่เหลือเขาให้เลือกตามแมพที่จะฟาร์ม', cites: [['pop', '01:44'], ['pop', '06:26'], ['pop', '06:44']] },
      },
      gear: [
        { slot: 'หมวก', text: 'Nordfeld Platinum Helm ผู้ทำคลิปว่าดีที่สุดในแพตช์นี้ ตี +7 ได้ HP/SP เพิ่ม ออปชั่น Max SP กับ FLEE', items: [401510], cites: [['pop', '02:55']] },
        { slot: 'เสื้อ', text: 'Nordfeld Mantle ออปชั่น Max HP, Max SP และอัตราฟื้น SP ควรหาให้ได้ 40% ขึ้นไป', items: [450587], cites: [['pop', '03:23']] },
        { slot: 'อาวุธ', text: 'คทาออปชั่น MATK กับ FLEE ชื่อการ์ดในคลิปฟังไม่ชัด การ์ดใส่ตามเผ่ามอนที่ไปฟาร์ม', cites: [['pop', '03:43'], ['pop', '03:55']] },
        { slot: 'ผ้าคลุม', text: 'ออปชั่น Max HP กับ FLEE ใส่ Shark Family Card (MATK ตามเลเวล ช่วงกิจกรรมมีโบนัสเพิ่มที่จะหายไปเมื่อจบกิจกรรม)', items: [300835], cites: [['pop', '04:09'], ['pop', '04:14'], ['dbShark']] },
        { slot: 'รองเท้า', text: 'รองเท้าเลเวล 50 (ไม่บอกชื่อ) ออปชั่น Max SP กับ FLEE ใส่ Sohee Card', items: [4100], cites: [['pop', '04:33']] },
        { slot: 'ประดับ', text: 'Clip จากแพ็กเริ่มต้นใน Cash Shop การ์ดที่ใส่ฟังไม่ชัด น่าจะเป็น Vitata Card กับ Creamy Card (ยังไม่ยืนยัน)', cites: [['pop', '04:51'], ['pop', '05:03']] },
        { slot: 'แหวน', text: 'แหวน FLEE +9 ฟังไม่ชัด น่าจะเป็น Steel Chonchon Egg Lv.2 (ยังไม่ยืนยัน)', cites: [['pop', '05:16']] },
      ],
      play: [
        { text: 'ตั้ง Teleport เมื่อมีมอน 2 ตัวขึ้นไปตี, โดนดาเมจเกิน 300, หรือฆ่ามอนไม่ได้ใน 10 วินาที', cites: [['pop', '05:57'], ['pop', '06:02'], ['pop', '06:13']] },
        { text: 'ตั้งให้ตีแค่มอนตัวที่ต้องการ SP จะฟื้นทัน · ตั้ง Heal ที่ 70% · ใช้ Teleport เป็นสกิลเคลื่อนที่ ไม่ใส่บัฟ', cites: [['pop', '06:20'], ['pop', '06:48'], ['pop', '06:59']] },
        { text: 'ถ้าบอทข้ามคืน ให้เก็บเฉพาะอาวุธที่มีออปชั่น 3 แถวขึ้นไป น้ำหนักจะได้ไม่เต็ม', cites: [['pop', '07:29']] },
      ],
      maps: [
        { text: 'Sandman ที่ Sograt Desert (moc_fild16, moc_fild17) ผู้ทำคลิปพูดถึงอีกแมพหนึ่งด้วยแต่ชื่อฟังไม่ชัด', cites: [['pop', '00:25']] },
        { text: 'อาวุธออปชั่นดีขายได้ราว 300,000 ถึง 4-5 ล้าน (ราคาที่ผู้ทำคลิปคาดเอง)', cites: [['pop', '08:06']] },
      ],
      cautions: [
        { text: 'ตายได้กรณีเดียวคือน้ำหนักเกิน 75% ทำให้ SP ฟื้นไม่ทัน', cites: [['pop', '07:10']] },
      ],
    },
    {
      id: 'to-wizard',
      name: 'เตรียมไป Wizard (Napalm Vulcan)',
      pickIf: 'จะเปลี่ยนเป็น Wizard แล้วเล่นสาย Napalm Vulcan ปล่อยบอท',
      idea: {
        text: 'ตั้งแต่ตอน Mage ต้องเก็บสกิลทางผ่านไว้ให้ครบ ตอนเปลี่ยนอาชีพจะได้ใช้สกิลหลักของสายนี้ได้ทันที',
        cites: [['zixmaNV', '02:12']],
      },
      skills: [
        { skill: 'Napalm Beat', level: 4, why: 'roz.prontera.info บอกว่า Napalm Vulcan ต้อง Napalm Beat 5 ขัดกับคลิป', cites: [['zixmaNV', '02:12'], ['pvNapalm']] },
        { skill: 'Soul Strike', level: 7, why: 'ซับได้ยินไม่ชัด แต่ Soul Drain ต้อง Soul Strike 7 กับ Increase SP Recovery 5 จึงน่าจะเป็นตัวนี้', cites: [['zixmaNV', '02:12'], ['pvSoulDrain']] },
        { skill: 'Increase SP Recovery', level: 10, cites: [['zixmaNV', '02:12']] },
      ],
      plan: {
        picks: {
          mage: { 'Napalm Beat': 4, 'Soul Strike': 7, 'Increase SP Recovery': 10 },
        },
        basis: { text: 'สกิลที่ ZixmaOne บอกให้เตรียมไว้ตั้งแต่อาชีพหนึ่ง ที่เหลือเขาบอกว่าอัพอะไรก็ได้', cites: [['zixmaNV', '02:12'], ['zixmaNV', '02:25']] },
        leftover: { text: 'ถ้าจะให้ชัวร์เรื่อง Napalm Vulcan ให้อัพ Napalm Beat เป็น 5 ตามที่ roz.prontera.info ระบุ', cites: [['pvNapalm']] },
      },
      cautions: [
        { text: 'เลเวล Napalm Beat ที่ต้องมี คลิปบอก 4 แต่ roz.prontera.info บอก 5 ยังไม่ได้ตรวจในเกม', cites: [['zixmaNV', '02:12'], ['pvNapalm']] },
      ],
    },
    {
      id: 'to-sage',
      name: 'เตรียมไป Sage (Spell Fist)',
      pickIf: 'จะเปลี่ยนเป็น Sage แล้วเล่นสาย Spell Fist',
      idea: {
        text: 'Spell Fist ใช้บอลต์ที่ร่าย จึงต้องมีบอลต์ทั้ง 3 ธาตุไว้เปลี่ยนธาตุตามมอน',
        cites: [['khun', '01:24'], ['xiendongSF', '02:24']],
      },
      skills: [
        { skill: 'Fire Bolt', level: 10, cites: [['kanda', '01:41']] },
        { skill: 'Cold Bolt', level: 10, cites: [['kanda', '01:41']] },
        { skill: 'Lightning Bolt', level: 10, cites: [['kanda', '01:41']] },
        { skill: 'Increase SP Recovery', level: 'ไม่ระบุ', cites: [['kanda', '01:48']] },
      ],
      plan: {
        picks: {
          mage: { 'Fire Bolt': 10, 'Cold Bolt': 10, 'Lightning Bolt': 10 },
        },
        basis: { text: 'บอลต์ 3 ธาตุ เลเวล 10 ตามที่กานดาอัพ', cites: [['kanda', '01:41']] },
        leftover: { text: 'แต้มที่เหลือ: กานดาอัพ Increase SP Recovery ด้วยแต่ไม่ได้บอกเลเวล และบอกว่า 49 แต้มยังเหลือ เขาไม่ลง Safety Wall เพราะใช้แค่ตอนลงดัน', cites: [['kanda', '01:48'], ['kanda', '02:07'], ['kanda', '02:12']] },
      },
    },
  ],
  gaps: [
    'ยังไม่มีข้อมูลสาย Mage ที่เน้นปาร์ตี้หรือ MVP',
    'ยังไม่มีตารางว่า Increase SP Recovery ใน Zero ฟื้น SP เท่าไร มีแค่คำพูดของ PoP Chanal',
    'ชื่อของที่ฟังจากเสียงไม่ออก: การ์ดคทาของ PoP Chanal, รองเท้าเลเวล 50, แมพบอทอีกแมพหนึ่ง',
    'Napalm Vulcan ต้อง Napalm Beat 4 หรือ 5 แหล่งข้อมูลยังขัดกัน',
  ],
  sources: {
    ginger: { label: 'Ginger', title: 'ไกด์เก็บเลเวล Mage | Ragnarok Zero Global', url: 'https://www.youtube.com/watch?v=-lfhb7us4ec', kind: 'clip', lang: 'th' },
    mimiw: { label: 'MimiwPK', title: 'A Step-by-Step Guide for Beginners Playing Mage', url: 'https://www.youtube.com/watch?v=b3Vq6nQMVv4', kind: 'clip', lang: 'en' },
    zixma: { label: 'ZixmaOne', title: 'แนวทางเล่น Mage โผล่มาแปปเดียวเวลอัพรัวๆ', url: 'https://www.youtube.com/watch?v=M1cnBmEKYQw', kind: 'clip', lang: 'th' },
    pop: { label: 'PoP Chanal', title: 'แนวทางการเล่น Mage สาย Flee บอทได้ 24ชม แบบไม่ต้องมียาบัฟ', url: 'https://www.youtube.com/watch?v=YWeBYoLWfws', kind: 'clip', lang: 'th' },
    zixmaNV: { label: 'ZixmaOne', title: 'Napalm Vulcan Skill Guide - AFK botting with zero cash buffs', url: 'https://www.youtube.com/watch?v=Wmli0mZk-Mo', kind: 'clip', lang: 'th' },
    khun: { label: 'KhunLoong', title: 'Sage Spell Fist แรงแค่ไหน!? เปิด Stat + Skill + ของ', url: 'https://www.youtube.com/watch?v=sNvrdKJx6Q4', kind: 'clip', lang: 'th' },
    kanda: { label: 'กานดา', title: 'Sage Spell Fist 10k Damage Build Review: Budget-Friendly Edition', url: 'https://www.youtube.com/watch?v=Geid427xJ70', kind: 'clip', lang: 'th' },
    xiendongSF: { label: 'Xiendong', title: "I Tested SAGE Spell Fist… Here's How It REALLY Works", url: 'https://www.youtube.com/watch?v=hW7_te2pH7s', kind: 'clip', lang: 'en' },
    meta: { label: 'Xiendong', title: 'Why Taiwan Players Build These Stats', url: 'https://www.youtube.com/watch?v=T5bjOqQomUc', kind: 'clip', lang: 'en' },
    roadmap: { label: 'Xiendong', title: 'My Current 1–60 Levelling Roadmap for my New Characters', url: 'https://www.youtube.com/watch?v=7ymM15xvYAY', kind: 'clip', lang: 'en' },
    resbakk: { label: 'Resbakk Gaming', title: 'RAGNAROK ZERO: GLOBAL | BEGINNERS GUIDE', url: 'https://www.youtube.com/watch?v=IKItqq2QXR8', kind: 'clip', lang: 'en' },
    kamonB: { label: 'KamonWay', title: "Ragnarok Zero: Global (ROZG) Beginner's Guide", url: 'https://www.youtube.com/watch?v=_8VlLdO7TXw', kind: 'clip', lang: 'en' },
    kamonC2: { label: 'KamonWay', title: 'How to Change to Class 2 for Every Job in 3 Minutes', url: 'https://www.youtube.com/watch?v=iTxVgyVGCbc', kind: 'clip', lang: 'en' },
    tako: { label: 'TakoyakiCh', title: 'จัด Tierlist Class2 ในโลก RO-Zero', url: 'https://www.youtube.com/watch?v=Y7MKIY0KiYo', kind: 'clip', lang: 'th' },
    pvNapalm: { label: 'roz.prontera.info', title: 'Napalm Vulcan', url: 'https://roz.prontera.info/skills/napalm-vulcan', kind: 'web' },
    pvSoulDrain: { label: 'roz.prontera.info', title: 'Soul Drain', url: 'https://roz.prontera.info/skills/soul-drain', kind: 'web' },
    dbParasite: { label: 'rozerothai.com', title: 'ฐานข้อมูลมอนสเตอร์: Parasite', url: 'https://rozerothai.com/database/monsters/1500', kind: 'web' },
    dbC2: { label: 'rozerothai.com', title: 'ฐานข้อมูลมอนสเตอร์: C2 Parasite', url: 'https://rozerothai.com/database/monsters/2720', kind: 'web' },
    dbDrink: { label: 'rozerothai.com', title: 'ฐานข้อมูลไอเทม: Challenge Drink 10ea Box', url: 'https://rozerothai.com/database/items/200893', kind: 'web' },
    dbShark: { label: 'rozerothai.com', title: 'ฐานข้อมูลการ์ด: Shark Family Card', url: 'https://rozerothai.com/database/cards/300835', kind: 'web' },
    owner: { label: 'ยืนยันในเกม', title: 'เจ้าของเว็บตรวจในเกม 22 ก.ย. 2026', url: '', kind: 'web' },
  },
};
