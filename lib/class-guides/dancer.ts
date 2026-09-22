// Dancer guide. Drafted 22 Sep 2026 from Downloads/roz-job-guides/dancer.md
// and archer.md, which cite every line to a clip timestamp or a web page. Both
// Ryan Geldun clips were filmed before Global opened (one reviews Taiwan Zero
// footage), and no Zero clip gives a Dancer skill order: the only plan is the
// Ov3rhead build on roz.prontera.info. Clips from other games (The New World,
// Ragnarok M, Landverse) were left out.
import type { ClassGuide } from './types';

export const dancer: ClassGuide = {
  slug: 'dancer',
  job: 'Dancer',
  jobTh: 'แดนเซอร์',
  from: 'Archer',
  gathered: '22 ก.ย. 2026',
  summary:
    'อาชีพสองของ Archer ตัวละครหญิง ใช้แส้ สกิลตีหลักคือ Arrow Vulcan กับ Slinging Arrow และมีบัฟเต้นให้ทั้งปาร์ตี้ เป็นคู่กระจกของ Bard',
  facts: [
    { text: 'เปลี่ยนเป็น Dancer ได้ที่ Base Lv 50 (ตัวละครหญิง ตัวละครชายจะเป็น Bard)', cites: [['owner'], ['ryanBD', '00:02']] },
    { text: 'Job ตันที่ 70 ได้แต้มสกิล 69 แต้ม', cites: [['owner'], ['planner']] },
    {
      text: 'Arrow Vulcan, Marionette Control, Tarot Card of Fate, Hermode\'s Rod และ Sheltering Bliss อยู่ในผังสกิล Dancer เลย ได้ตั้งแต่เปลี่ยนอาชีพ',
      cites: [['owner'], ['db'], ['tako', '00:05']],
    },
  ],
  path: ['archer', 'dancer'],
  equipJob: 'Dancer',
  route: [
    { range: '1-9', text: 'ทำเควสเนื้อเรื่องช่วงต้นไปก่อน พอเลเวล 9 ให้วาร์ปไป Payon', cites: [['ncz', '01:51'], ['ncz', '02:05']] },
    { range: '9-15', text: 'แมพเห็ดแดงข้าง Payon ตั้งบอทตีได้เลย (ชื่อแมพฟังจากซับอัตโนมัติ น่าจะเป็นแมพ Spore)', maps: ['pay_fild08'], monsters: [1014], cites: [['ncz', '02:40'], ['ncz', '03:15']] },
    { range: '15-20', text: 'Prontera Sewer ชั้น 2 ตั้งบอทตีได้ทุกตัว', maps: ['prt_sewb2'], monsters: [1051], cites: [['ncz', '04:19'], ['ncz', '04:24']] },
    { range: '20-30', text: 'Creamy กับ Smokie แถว Geffen ลุ้น Creamy Card กับเสื้อ คนเยอะให้ย้าย channel', maps: ['gef_fild05'], monsters: [1018, 1056], cites: [['ncz', '04:59'], ['ncz', '05:43'], ['ncz', '06:22']] },
    { range: '30-35', text: 'Coco ที่ Geffen Field ตั้งบอทตีได้ทุกตัว', maps: ['gef_fild02'], monsters: [1104], cites: [['ncz', '06:51'], ['xroad', '01:34']] },
    { range: '30-40', text: 'Ant Hell ถ้าอยากเก็บเลเวลไวกว่า Coco และได้ลุ้นการ์ดมด', maps: ['anthell02'], monsters: [1095], cites: [['ncz', '06:56'], ['ncz', '07:12']] },
    { range: '40-50', text: 'Orc Village หรือ Steel Chonchon', maps: ['gef_fild10', 'moc_fild13'], monsters: [1023, 1042], cites: [['ncz', '10:58'], ['ncz', '11:50'], ['ncz', '12:52']] },
    { range: '50', text: 'เปลี่ยนเป็น Dancer', cites: [['owner']] },
    {
      range: '50-60',
      text: 'Nordfeld Cave 2F ต้องเลเวล 50 ถึงเข้าได้ Xiendong บอกว่าเป็นทางเก็บเลเวลที่เร็วที่สุดทางหนึ่งเมื่อถึงเลเวลนี้ (ไม่ได้เจาะจง Dancer)',
      maps: ['nrd_dun02'],
      monsters: [25327],
      cites: [['xfarm', '04:14'], ['xfarm', '04:23']],
    },
  ],
  routeNotes: [
    { text: 'ยังไม่มีแมพเก็บเลเวลเฉพาะ Dancer ใน Ryan Geldun ทดสอบตีมอน Sohee ด้วยแส้ธรรมดา', cites: [['ryanBD', '06:01']] },
    { text: 'อีกทางหนึ่ง: Xiendong ตั้งบอทที่ Poison Spore ไปถึงราวเลเวล 30-35 แล้วย้ายไป Coco', cites: [['xroad', '01:12']] },
    { text: 'วาร์ป Kafra ฟรีถ้าเลเวลต่ำกว่า 40 และรีสกิลรีสเตตัสฟรีได้ถ้าเลเวลยังไม่เกิน 40', cites: [['onenight', '09:03'], ['ncz', '02:20'], ['reset', '00:04']] },
    { text: 'ช่วงเริ่มเล่นลง DEX ราว 20 ก่อนให้ตีโดน แล้วค่อยรีสเตตัสฟรีก่อนเลเวล 40', cites: [['xmeta', '06:15'], ['xmeta', '06:26']] },
  ],
  gearByLevel: [
    { range: '1-50', slot: 'ลูกธนู', text: 'Silver Arrow ซื้อได้ที่ร้าน NPC ใน Payon แต่แพงกว่าร้านผู้เล่น ซองหนึ่งมี 500 ดอก', items: [1751, 12009], cites: [['onenight', '09:10'], ['onenight', '09:37']] },
    { range: '30+', slot: 'หมวก', text: 'Apple of Archer ให้ DEX +3 build Dancer บนเว็บก็ใส่ตัวนี้', items: [2285], cites: [['db'], ['pdancer']] },
    { range: '33-50', slot: 'อาวุธ', text: 'ช่วง Archer: Gakkung Bow (ATK 100) หรือ Arbalest (ATK 90, DEX +2) ต้องเลเวล 33', items: [700084, 700113], cites: [['db'], ['hbow', '02:28']] },
    { range: '33-50', slot: 'ออปชั่นธนู', text: 'หา ATK ให้สูง (สูงสุด 30) ตามด้วยสเตตัสรอง บรรทัดที่ 3 หาดาเมจต่อเผ่า Insect, Demi-Human หรือ Brute', cites: [['hbow', '00:19'], ['hbow', '00:29']] },
    { range: '50+', slot: 'อาวุธ', text: 'Dancer Guild Rope แส้ ATK 135 ต้องเลเวล 50 มี 2 ช่อง', items: [26205], cites: [['db'], ['pdancer']] },
  ],
  strengths: [
    { text: 'Arrow Vulcan แรงถึง 3,000%', cites: [['tako', '09:25']] },
    { text: 'ใช้แส้ชิ้นเดียวได้ทั้งตีและเต้น ไม่ต้องลงทุนสองอาวุธแบบสมัยก่อนที่ต้องมีธนูไว้ยิง Double Strafe', cites: [['ryanAV', '05:46']] },
    { text: 'บัฟเต้นทำงานแบบบัฟ Priest ร่ายแล้วทุกคนรอบตัวได้บัฟ อยู่ราว 3 นาที โดนตัวเองด้วย ร่ายเสร็จเดินไปฟาร์มต่อได้เลย', cites: [['ryanBD', '04:25'], ['ryanBD', '04:39'], ['ryanBD', '07:10'], ['ryanAV', '06:26']] },
    { text: 'หาปาร์ตี้ง่าย เพราะสกิลคู่ต้องใช้ Dancer และน่าจะมี Bard มากกว่า Dancer', cites: [['ryanBD', '08:33']] },
    { text: 'TakoyakiCh จัดไว้ S+ (กลางระหว่าง S กับ SS) ฝั่ง PvE ประเมินก่อนอาชีพสองเปิด', cites: [['tako', '10:13']] },
  ],
  weaknesses: [
    { text: 'Ryan Geldun บอกว่าดาเมจไม่ได้ทำลายสถิติ บทบาทหลักคือบัฟ (ขัดกับภาพ Dancer ของเต็มในอีกคลิปของเขา ความต่างน่าจะมาจากของที่ใส่)', cites: [['ryanBD', '01:11'], ['ryanBD', '05:56']] },
    { text: 'ไม่ลง STR จึงน้ำหนักเกินง่าย', cites: [['ryanBD', '07:26']] },
    { text: 'Arrow Vulcan มีคูลดาวน์ ต้องใช้สลับกับสกิลอื่น', cites: [['tako', '09:38']] },
  ],
  builds: [
    {
      id: 'aspd-autocast',
      name: 'สาย Arrow Vulcan ออโต้แคสต์ (AGI)',
      tag: 'ภาพจากไต้หวัน',
      pickIf: 'มีแส้ที่ออโต้แคสต์ Arrow Vulcan และอยากตีธรรมดาเปิดบอท',
      idea: {
        text: 'ดัน ASPD ให้สุด แล้วให้แส้ออโต้แคสต์ Arrow Vulcan ทุกครั้งที่ตีธรรมดา build นี้ขึ้นกับอาวุธเป็นหลัก',
        cites: [['ryanAV', '00:39'], ['ryanAV', '01:27'], ['ryanAV', '04:06']],
      },
      stats: [
        { who: 'Dancer ของเต็มในไต้หวัน (คลิป Ryan Geldun)', agi: '85', dex: '30', note: 'แทบลง AGI ทั้งหมด DEX แค่พอให้ตีโดน ATK ได้จากแส้ที่ตีบวกสูง', cites: [['ryanAV', '11:48'], ['ryanAV', '11:56']] },
      ],
      statNotes: [
        { text: 'Ryan คิดว่าเธอไม่ได้เก็บเลเวลด้วยสเตตัสแบบนี้ ช่วงแรกต้องใช้ DEX เพิ่ม ATK', cites: [['ryanAV', '11:56'], ['ryanAV', '12:16']] },
        { text: 'ผู้เล่นไต้หวันตั้งเป้า ASPD 190 ทุกอาชีพ', cites: [['xmeta', '01:25']] },
      ],
      skillNotes: [
        { text: 'แส้ออโต้แคสต์ Arrow Vulcan ตามเลเวลที่เรียนไว้ คลิปไม่ได้บอกลำดับสกิล', cites: [['ryanAV', '00:53']] },
      ],
      gear: [
        {
          slot: 'อาวุธ',
          text: 'Ryan เรียกว่า two-star wire whip ตีบวก 9 แล้วมีโอกาสออโต้แคสต์ Arrow Vulcan · ฐานข้อมูลเรามี ★ Wire Whip แต่คำอธิบายไม่มีออโต้แคสต์ และไม่มีตัวสองดาว ยังไม่ยืนยันใน Global',
          items: [580092],
          cites: [['ryanAV', '00:47'], ['db']],
        },
        { slot: 'หมวก', text: 'Sakkat (AGI +1) สาย ASPD แทบทุก build ใส่ตัวนี้', items: [2280], cites: [['ryanAV', '13:02'], ['db']] },
        { slot: 'อื่นๆ', text: 'คนส่วนใหญ่ไม่ค่อยใช้ของจาก Memorial Dungeon ขั้นสูง Ryan เดาว่าตีบวกต้องลุ้นมาก', cites: [['ryanAV', '13:12'], ['ryanAV', '13:24']] },
      ],
      play: [
        { text: 'ในภาพ เธอเปิดบอทสู้บอส instance และโดน silence ก็ยังตีได้เพราะเป็นออโต้แคสต์', cites: [['ryanAV', '03:22'], ['ryanAV', '07:27']] },
      ],
      maps: [
        { text: 'ในคลิป: Orc instance (มี Wizard ช่วยตีต้นไม้) Maya instance GTB instance และสตรีมฟาร์ม Toy Factory', cites: [['ryanAV', '02:48'], ['ryanAV', '04:37'], ['ryanAV', '07:43'], ['ryanAV', '11:34']] },
      ],
      cautions: [
        { text: 'ทั้งหมดเป็นภาพจากเซิร์ฟไต้หวัน คลิปอัดก่อน Global เปิด', cites: [['ryanAV', '14:10']] },
        { text: 'ที่ว่าเป็นโหมดยาก Ryan เดาเอาจากภาพ ไม่ได้ยืนยัน', cites: [['ryanAV', '03:53'], ['ryanAV', '07:26']] },
      ],
    },
    {
      id: 'int-dex',
      name: 'สาย Arrow Vulcan INT/DEX',
      tag: 'build บนเว็บ',
      pickIf: 'อยากตีด้วยสกิล Arrow Vulcan และ Slinging Arrow ด้วยของหาง่าย',
      idea: {
        text: 'build ของ Ov3rhead บน roz.prontera.info ที่ Base/Job 60 ลง INT กับ DEX ต่างจากสาย AGI ชัดเจน ยังสรุปไม่ได้ว่าแบบไหนดีกว่า',
        cites: [['pdancer']],
      },
      stats: [
        { who: 'Ov3rhead (60/60)', str: '1', agi: '1', vit: '1', int: '50', dex: '72', luk: '1', cites: [['pdancer']] },
      ],
      statNotes: [
        { text: 'ฐานข้อมูลบอกว่า Slinging Arrow แรงขึ้นตาม INT ส่วน Arrow Vulcan ขึ้นกับอะไร ฐานข้อมูลไม่ได้บอก', cites: [['db']] },
      ],
      skills: [
        { skill: 'Double Strafe', level: 10, cites: [['pdancer']] },
        { skill: "Owl's Eye", level: 10, cites: [['pdancer']] },
        { skill: "Vulture's Eye", level: 10, cites: [['pdancer']] },
        { skill: 'Improve Concentration', level: 10, cites: [['pdancer']] },
        { skill: 'Arrow Shower', level: 9, why: 'Arrow Vulcan ต้อง Arrow Shower 5 กับ Double Strafe 5', cites: [['pdancer'], ['db']] },
        { skill: 'Arrow Repel', level: 1, why: 'สกิลเควส ไม่กินแต้ม', cites: [['pdancer'], ['db']] },
        { skill: 'Arrow Crafting', level: 1, why: 'สกิลเควส ไม่กินแต้ม', cites: [['pdancer'], ['db']] },
        { skill: 'Amp', level: 1, cites: [['pdancer']] },
        { skill: 'Dance Lessons', level: 3, cites: [['pdancer']] },
        { skill: 'Slinging Arrow', level: 1, why: 'ทางผ่านไป Arrow Vulcan', cites: [['pdancer'], ['db']] },
        { skill: 'Arrow Vulcan', level: 10, cites: [['pdancer']] },
      ],
      skillNotes: [
        { text: 'build นี้ไม่ได้บอกลำดับการอัพ รายการด้านบนคือสกิลที่ลงไว้ทั้งหมด', cites: [['pdancer']] },
      ],
      plan: {
        picks: {
          archer: { 'Double Strafe': 10, "Owl's Eye": 10, 'Arrow Repel': 1, 'Arrow Shower': 9, "Vulture's Eye": 10, 'Arrow Crafting': 1, 'Improve Concentration': 10 },
          dancer: { Amp: 1, 'Dance Lessons': 3, 'Slinging Arrow': 1, 'Arrow Vulcan': 10 },
        },
        basis: {
          text: 'สกิลที่ build ของ Ov3rhead ลงไว้ ช่วง Archer บวกกันได้ 51 แต่ Arrow Repel กับ Arrow Crafting เป็นสกิลเควสไม่กินแต้ม จึงพอดี 49',
          cites: [['pdancer'], ['planner'], ['db']],
        },
        leftover: { text: 'build นี้อยู่ที่ Job 60 แต้มที่เหลือถึง Job 70 ยังไม่มีใครบอกว่าควรลงอะไร', cites: [['pdancer']] },
      },
      gear: [
        { slot: 'อาวุธ', text: 'Dancer Guild Rope ใส่ Archer Skeleton Card (ดาเมจระยะไกล +10%)', items: [26205, 4094], cites: [['pdancer'], ['db']] },
        { slot: 'โล่', text: 'Silver Guard ใส่ Thara Frog Card (ลดดาเมจจาก Demi-Human 30%)', items: [460070, 4058], cites: [['pdancer'], ['db']] },
        { slot: 'หมวก', text: 'หัวบน Apple of Archer (DEX +3) · หัวกลาง Binoculars (DEX +1 ต้องเลเวล 50) · หัวล่าง Gangster Mask', items: [2285, 2296, 2265], cites: [['pdancer'], ['db']] },
        { slot: 'เสื้อ', text: 'Tights ใส่ Anolian Card (มีโอกาสออโต้แคสต์ Improve Concentration เมื่อโดนตี)', items: [4234], cites: [['pdancer'], ['db']] },
        { slot: 'ผ้าคลุม', text: 'Muffler ใส่ Raydric Card (ต้านธาตุ Neutral 20%)', items: [4133], cites: [['pdancer'], ['db']] },
        { slot: 'รองเท้า', text: 'Boots ใส่ Verit Card (MHP/MSP +8%)', items: [470230, 4107], cites: [['pdancer'], ['db']] },
        { slot: 'ประดับ', text: 'Bow Thimble [1] ใส่ Zerom Card (DEX +3) 2 ข้าง · แต่ Bow Thimble ต้องเลเวล 65 ถ้ายังไม่ถึงต้องใส่อย่างอื่นแทน', items: [2671, 4064], cites: [['pdancer'], ['db']] },
        { slot: 'ลูกธนู', text: 'Fire Arrow', items: [1752], cites: [['pdancer']] },
      ],
    },
    {
      id: 'slinging',
      name: 'สาย Slinging Arrow (แส้ธรรมดา)',
      pickIf: 'ยังไม่มีของดี อยากมีสกิลตีเสริมตอนสู้บอส',
      idea: {
        text: 'Slinging Arrow สมัยก่อนแรงเท่าตีธรรมดา ตอนนี้ทำดาเมจได้จริง ยิงโดน 2 ครั้ง ยิ่ง ATK สูงยิ่งแรง',
        cites: [['ryanBD', '03:16'], ['ryanBD', '03:42'], ['ryanAV', '05:05']],
      },
      skillNotes: [
        { text: 'Ryan ทดสอบกับ Rope ธรรมดากับ Silver Arrow ไม่แรงมาก แต่ช่วยเติม DPS ตอนตีบอสใน Memorial Dungeon', cites: [['ryanBD', '03:55'], ['ryanBD', '04:06']] },
        { text: 'แส้ธรรมดาน่าจะตีได้ราว 2K ส่วนของเต็มในภาพไต้หวันตีได้ราว 9K', cites: [['ryanAV', '05:34']] },
      ],
      cautions: [
        { text: 'ถ้าสลับไปถือธนูเล่น Double Strafe กับ AGI น่าจะฆ่าเร็วกว่า แต่ต้องแย่งธนูดีกับ Hunter ส่วนแส้หาง่ายกว่า', cites: [['ryanBD', '06:19'], ['ryanBD', '06:30']] },
      ],
      missing: 'ยังไม่มีคลิปบอกสเตตัส ลำดับสกิล หรือของของสายนี้โดยตรง',
    },
    {
      id: 'support',
      name: 'สายซัพพอร์ต (เต้นบัฟ)',
      pickIf: 'เล่นปาร์ตี้ คอยบัฟ SP คริ HIT ให้ทุกคน',
      idea: {
        text: 'ร่ายบัฟเต้น 1 ตัวที่เหมาะกับปาร์ตี้ แล้วเดินฟาร์มไปพร้อมปาร์ตี้ได้เลย ไม่ต้องยืนนิ่งเหมือนสมัยก่อน',
        cites: [['ryanBD', '01:17'], ['ryanBD', '04:20'], ['ryanBD', '05:01']],
      },
      skillNotes: [
        { text: 'Gypsy\'s Kiss: คลิปเรียกบัฟ Service for You ซึ่งน่าจะเป็นตัวนี้ (ยังไม่ยืนยัน) เพิ่ม Max SP ตัวเองและปาร์ตี้ ลด SP ที่ใช้ Ryan บอก +20% ส่วน rozeroplanner บอกสูงสุด +40% ยังไม่ตรงกัน', cites: [['ryanBD', '01:25'], ['ryanBD', '04:39'], ['planner']] },
        { text: 'Lady Luck (คลิปเรียก Fortune\'s Kiss): เพิ่ม CRIT และ Critical Damage', cites: [['ryanBD', '01:34'], ['db']] },
        { text: 'Focus Ballet (ชื่อเก่า Humming): เพิ่ม HIT', cites: [['ryanAV', '06:17'], ['db'], ['planner']] },
        { text: 'Mental Sensing (คลิปเรียก Mr. Kim A Rich Man): Ryan บอก EXP ปาร์ตี้ +60% แต่ฐานข้อมูลบอกว่าเป็นสกิลคู่ ต้องมี Bard อยู่ในระยะ ยังไม่ได้ทดสอบ', cites: [['ryanBD', '01:38'], ['db']] },
        { text: 'Amp ลด SP ของการแสดงครั้งถัดไป · Encore ร่ายเพลงหรือท่าเต้นล่าสุดซ้ำโดยใช้ SP ครึ่งเดียว', cites: [['ryanBD', '01:53'], ['ryanBD', '02:28'], ['db']] },
        { text: 'Dance Lessons เพิ่ม Max SP และ CRIT (ATK กับ CRIT ได้เฉพาะตอนถือแส้) เหมาะกับสายคริตีธรรมดา ซึ่ง Ryan ไม่แนะนำ', cites: [['ryanBD', '02:52'], ['db']] },
        { text: 'Dazzler (ชื่อเก่า Scream) สตันมอนและผู้เล่น ส่วนใหญ่ใช้ PvP ฐานข้อมูลบอกว่ามีโอกาสโดนเพื่อนในปาร์ตี้ด้วย', cites: [['ryanBD', '02:41'], ['db']] },
        { text: 'midgardhub พูดถึงสาย Gypsy Kiss Control ไว้ แต่ไม่มีรายละเอียด', cites: [['midgard']] },
      ],
      play: [
        { text: 'บัฟเต้นโดนตัวเองด้วย ต่างจากสมัยก่อนที่เพลงไม่โดนคนร่าย', cites: [['ryanBD', '07:02']] },
      ],
      cautions: [
        { text: 'Ryan จำได้ลางๆ ว่า Zero มีกติกา EXP ปาร์ตี้ ถ้ายืนเฉยนานหรืออยู่ห่างหัวปาร์ตี้อาจไม่ได้ EXP แต่เขาเองก็ไม่แน่ใจ', cites: [['ryanBD', '07:50'], ['ryanBD', '08:05']] },
      ],
      missing: 'ยังไม่มีคลิป RO Zero บอกสเตตัสและลำดับสกิลของสายนี้',
    },
  ],
  gaps: [
    'คลิปหลักทั้งสองของ Ryan Geldun อัดก่อน Global เปิด คลิปหนึ่งเป็นภาพจากไต้หวัน',
    'ยังไม่มีคลิป Zero บอกลำดับสกิล Dancer แผนสกิลมาจาก build บนเว็บที่อยู่แค่ Job 60',
    'แส้ที่ออโต้แคสต์ Arrow Vulcan ยังไม่พบในฐานข้อมูล Global',
    'ชื่อบัฟ Service for You ยังไม่รู้ว่าตรงกับสกิลไหน และค่า Gypsy\'s Kiss กับ Mental Sensing แหล่งข้อมูลยังขัดกัน',
    'สาย AGI กับสาย INT/DEX ยังสรุปไม่ได้ว่าแบบไหนดีกว่า',
    'ยังไม่มีแมพเก็บเลเวลเฉพาะ Dancer คลิปเก็บเลเวล Dancer สาย Arrow Vulcan ดึงคำบรรยายไม่ได้',
  ],
  sources: {
    ryanAV: { label: 'Ryan Geldun', title: 'Autocast ArrowVulcan - Dancer and Bard build Ragnarok Zero Global', url: 'https://www.youtube.com/watch?v=DOl7pNPuBJU', kind: 'clip', lang: 'en' },
    ryanBD: { label: 'Ryan Geldun', title: 'Dancer & Bard in Ragnarok Zero Global', url: 'https://www.youtube.com/watch?v=KEIXN24Rh-I', kind: 'clip', lang: 'en' },
    tako: { label: 'TakoyakiCh', title: 'จัด Tierlist Class2 ในโลก RO-Zero', url: 'https://www.youtube.com/watch?v=Y7MKIY0KiYo', kind: 'clip', lang: 'th' },
    xmeta: { label: 'Xiendong', title: 'Why Taiwan Players Build These Stats', url: 'https://www.youtube.com/watch?v=T5bjOqQomUc', kind: 'clip', lang: 'en' },
    xroad: { label: 'Xiendong', title: 'My Current 1–60 Levelling Roadmap', url: 'https://www.youtube.com/watch?v=7ymM15xvYAY', kind: 'clip', lang: 'en' },
    xfarm: { label: 'Xiendong', title: 'NEW Farming Spots, Cards & EXP Areas!', url: 'https://www.youtube.com/watch?v=y7ySJekxEAw', kind: 'clip', lang: 'en' },
    ncz: { label: 'NCZ', title: 'Recommended Leveling Maps Lv. 1-50', url: 'https://www.youtube.com/watch?v=IScycVE-tf8', kind: 'clip', lang: 'th' },
    onenight: { label: 'OneNightsz', title: 'Ragnarok Zero Global มือใหม่ | รีสเตตัส หาเงิน ตั้งบอท และเรื่องสำคัญที่ต้องรู้!', url: 'https://www.youtube.com/watch?v=4D5XxK_NfjQ', kind: 'clip', lang: 'th' },
    reset: { label: 'แชงค์888', title: 'Ragnarok Zero: How to Free Reset Skills and Stats Before Level 40', url: 'https://www.youtube.com/watch?v=lRGGsRGUKYY', kind: 'clip', lang: 'th' },
    hbow: { label: 'hellyy', title: 'Hunter Guide | Best Bows, Cards & Affixes', url: 'https://www.youtube.com/watch?v=fGg65Z7MOq0', kind: 'clip', lang: 'en' },
    pdancer: { label: 'roz.prontera.info', title: 'Dancer Arrow Vulcan 60/60 By Ov3rhead', url: 'https://roz.prontera.info/builds/82bb8683-1a36-405f-8a49-58f8b08c0fec', kind: 'web' },
    midgard: { label: 'midgardhub', title: 'Bard guide', url: 'https://midgardhub.com/guides/bard', kind: 'web' },
    db: { label: 'rozerothai.com', title: 'ฐานข้อมูลสกิลและไอเทม', url: 'https://rozerothai.com/database/skills', kind: 'web' },
    planner: { label: 'rozeroplanner', title: 'RO Zero skill planner', url: 'https://rozeroplanner.com/', kind: 'web' },
    owner: { label: 'ยืนยันในเกม', title: 'เจ้าของเว็บตรวจในเกม 22 ก.ย. 2026', url: '', kind: 'web' },
  },
};
