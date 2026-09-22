// Assassin guide. Drafted 22 Sep 2026 from Downloads/roz-job-guides/assassin.md
// and thief.md (1st-job route and skills), which cite every line to a clip
// timestamp or a web page. Items, monsters and skills were checked against the
// site database with .check-names.mjs; items with several ids of the same name
// (Jur, Jamadhar, Token of Siegfried, Chonchon eggs) are named in text only.
// The Ryan Geldun crit clip was recorded on a pre-launch test server, not Zero,
// and the page says so wherever it is used.
import type { ClassGuide } from './types';

export const assassin: ClassGuide = {
  slug: 'assassin',
  job: 'Assassin',
  jobTh: 'แอสซาซิน',
  from: 'Thief',
  gathered: '22 ก.ย. 2026',
  summary:
    'อาชีพสองของ Thief สายตีกายภาพ ถืออาวุธได้สองมือ มี Soul Destroyer, Meteor Assault และ EDP ตั้งแต่เปลี่ยนอาชีพ เด่นเรื่อง PK และลงดันเดี่ยวสาย FLEE แต่ต้องลงทุนเยอะ',
  facts: [
    { text: 'เปลี่ยนเป็น Assassin ได้ที่ Base Lv 50', cites: [['owner'], ['kamonC', '00:44']] },
    { text: 'ตอน Thief Job ตันที่ 50 ได้แต้มสกิล 49 แต้ม · ตอน Assassin Job ตันที่ 70 ได้ 69 แต้ม', cites: [['owner']] },
    {
      text: 'Soul Destroyer, Meteor Assault, Enchant Deadly Poison (EDP) และ Advanced Katar Mastery อยู่ในผังสกิล Assassin เลย ได้ตั้งแต่เปลี่ยนอาชีพ',
      cites: [['owner'], ['pJob'], ['tako', '00:05']],
    },
    { text: 'ถืออาวุธได้สองชิ้น (มือขวากับมือซ้าย) ช่องการ์ดจึงเพิ่มตามอาวุธที่ถือ', cites: [['xsd', '04:44']] },
  ],
  path: ['thief', 'assassin'],
  equipJob: 'Assassin',
  route: [
    { range: '1-15', text: 'แมพเห็ดแดงข้างเมือง Payon มอนเลือดน้อย อยู่ได้ถึงราว Lv 15 · Zeztz อยู่แมพเห็ดแดงยาวถึง Lv 25', cites: [['ncz', '02:40'], ['ncz', '03:12'], ['zeztz', '06:46']] },
    { range: '1-30', text: 'หรือแบบ Xiendong: ปล่อยบอทตี Poison Spore ตั้งแต่ต้นจนถึงราว Lv 30 บางทีถึง 35 (คลิปไม่ได้บอกชื่อแมพ)', monsters: [1077], cites: [['xien', '01:12']] },
    { range: '30-35', text: 'Coco ที่ Geffen Field ดรอปรองเท้าแดงกับ Hood · หรือไปถ้ำมด ช่วงนี้เลเวลขึ้นช้าที่สุด', maps: ['gef_fild02'], monsters: [1104], cites: [['xien', '01:32'], ['xien', '01:40'], ['ncz', '06:48']] },
    { range: '35-50', text: 'ถ้ามีตัว Lv 50 ให้ปาร์ตี้พาเก็บที่ Hode ในทะเลทราย Sograt ปาร์ตี้แชร์ EXP ได้เมื่อเลเวลห่างไม่เกิน 15', maps: ['moc_fild17'], monsters: [1127], cites: [['xien', '02:07']] },
    { range: '35-50', text: 'ถ้าเล่นตัวเดียว: ถ้ำมดแบบชิลไม่เปลืองยา หรือแมพที่ซับฟังเป็น "warrior" ถ้ายอมเปลืองยา อยู่ได้ถึง 45-50', cites: [['zeztz', '06:58']] },
    { range: '40-50', text: 'Steel Chonchon ที่ Sograt Desert มอนเยอะมาก Xiendong แนะนำให้เอา Thief กับ Mage ที่สร้างคู่กันมาเก็บที่นี่ด้วยกัน', maps: ['moc_fild13'], monsters: [1042], cites: [['ncz', '13:01'], ['xien', '05:17']] },
    { range: '50', text: 'เปลี่ยนเป็น Assassin', cites: [['owner'], ['kamonC', '00:44']] },
    { range: '50-60', text: 'ยังไม่มีคลิปบอกแมพของ Assassin โดยตรง ตัว Thief ของ Xiendong (ที่ไปเป็น Rogue) อยู่ Nordfeld Cave 2F จนถึง Lv 60', maps: ['nrd_dun02'], cites: [['xien', '06:12']] },
  ],
  routeNotes: [
    { text: 'Thief เก็บเลเวลคนเดียวยาก Xiendong แนะนำให้สร้าง Mage คู่กันไปตั้งแต่ต้น แล้วเก็บเลเวลด้วยกัน', cites: [['xien', '04:35']] },
    { text: 'รีเซ็ตสเตตัสและสกิลได้ฟรีจนถึง Lv 40 หลังจากนั้นต้องเสียเงินจริง ถ้าจะเปลี่ยนสายให้รีเซ็ตก่อน', cites: [['xien', '02:39'], ['meta', '06:26']] },
  ],
  gearByLevel: [
    { range: 'ทั้งทาง', slot: 'ออปชั่น', text: 'ระบบออปชั่นสุ่มทำให้ FLEE 250-300 ได้ตั้งแต่ต้นเกม ถ้าได้ FLEE ราว 15 ขึ้นไปจากเกราะแต่ละชิ้น', cites: [['meta', '03:33'], ['meta', '06:59']] },
    { range: '30-35', slot: 'หมวก / รองเท้า', text: 'Hood กับรองเท้าแดงจาก Coco', items: [480414], cites: [['ncz', '06:48']] },
    { range: 'ช่วง Thief', slot: 'การ์ด', text: 'Soldier Skeleton Card ฟาร์มได้ตั้งแต่เป็น Thief ส่วน Sidewinder Card หาไม่ยาก เก็บไว้ใส่ Katar สายคริ (คลิปอัดบนเซิร์ฟทดสอบก่อน Zero เปิด)', items: [4086, 4117], cites: [['ryan', '04:10']] },
  ],
  strengths: [
    { text: 'ได้สกิลแรงๆ อย่าง EDP และ Advanced Katar Mastery ใช้ตั้งแต่อาชีพสอง ในเว็บ AKM เพิ่มดาเมจ 12% (Lv 1) ถึง 20% (Lv 5)', cites: [['tako', '17:01'], ['pAKM']] },
    { text: 'EDP เพิ่มดาเมจ Soul Destroyer ได้มากจากการทดสอบของ Xiendong', cites: [['xsd', '07:21']] },
    { text: 'Cloaking ซ่อนตัวรอจังหวะได้ เหมาะกับแมพ PK', cites: [['xsd', '00:39']] },
    { text: 'ลงดันเดี่ยวได้ที่ Lv 59 ทั้ง Golden Thief Bug ระดับ Hard และ Orc Hero ระดับปกติ', cites: [['zixma', '00:06']] },
    { text: 'TakoyakiCh จัดไว้เทียร์สูงฝั่ง PvE ซับฟังเหมือน S หรือ SS ถ้าของเยอะ (ประเมินก่อนอาชีพสองเปิด)', cites: [['tako', '18:09']] },
  ],
  weaknesses: [
    { text: 'Soul Destroyer กิน SP เยอะมาก ดาเมจช่วงแรกยังไม่แรง Xiendong ไม่แนะนำให้เป็นตัวฟาร์มตัวแรก', cites: [['xsd', '01:03'], ['xsd', '01:44']] },
    { text: 'EDP ต้องคราฟต์ขวดยาเอง อัตราสำเร็จต่ำ Xiendong มีวัตถุดิบ 68 ครั้ง ได้ขวดราว 30 กว่าขวด ในเว็บ EDP ใช้ Poison Bottle 1 ขวดต่อครั้ง', cites: [['xsd', '07:31'], ['pEDP']] },
    { text: 'ต้องใช้งบเยอะและมีเงื่อนไขเยอะ ทั้งเรื่องยาและของ', cites: [['tako', '17:57']] },
  ],
  builds: [
    {
      id: 'crit-katar',
      name: 'สายคริ Katar (Sonic Blow)',
      tag: 'สายตี',
      pickIf: 'อยากตีคริด้วย Katar และมีของสายคริอยู่แล้ว',
      idea: {
        text: 'ถือ Katar ใส่การ์ดคริ ให้ Double Attack ออกคริ ผู้ทำคลิปเองบอกว่ายังไม่รู้ว่าใน Zero Double Attack คริได้ไหม คลิปนี้อัดบนเซิร์ฟทดสอบก่อนเปิด ไม่ใช่ Zero ใช้ได้แค่เป็นแนวคิด',
        cites: [['ryan', '00:02'], ['ryan', '01:01'], ['ryan', '05:21']],
      },
      stats: [
        { who: 'naxchefkoch บนเว็บ (60/60)', str: '32', agi: '65', vit: '1', int: '1', dex: '23', luk: '33', cites: [['pNax']] },
        { who: 'Ryan Geldun (Lv 94 เซิร์ฟทดสอบ)', str: '60', agi: '85', note: 'ที่เหลือแบ่ง DEX / LUK / VIT โดย LUK 62 ได้ CRIT 80 · ASPD 179', cites: [['ryan', '01:20'], ['ryan', '01:47']] },
      ],
      statNotes: [
        { text: 'Ryan Geldun บอกว่ายังต้องมี DEX ให้ตีโดน แต่ Xiendong บอกว่าคริโดนเสมอไม่สน FLEE สองแหล่งขัดกัน ต้องลองในเกม', cites: [['ryan', '01:39'], ['meta', '02:59']] },
        { text: 'ถ้า Double Attack คริไม่ได้ใน Zero ให้ใส่ Soldier Skeleton Card 3 ใบ แล้วย้ายแต้ม LUK ไป VIT หรือ AGI', cites: [['ryan', '05:36']] },
      ],
      skills: [
        { skill: 'Katar Mastery', level: 10, cites: [['pNax']] },
        { skill: 'Sonic Blow', level: 10, cites: [['pNax']] },
        { skill: 'Enchant Poison', level: 10, cites: [['pNax']] },
        { skill: 'Create Deadly Poison', level: 1, why: 'ทางไป EDP', cites: [['pNax']] },
        { skill: 'Enchant Deadly Poison', level: 5, cites: [['pNax']] },
        { skill: 'Grimtooth', level: 5, cites: [['pNax']] },
        { skill: 'Cloaking', level: 2, why: 'ทางผ่านไป Grimtooth', cites: [['pNax']] },
      ],
      skillNotes: [
        { text: 'ช่วง Thief ชุดนี้เอา Double Attack 10, Steal 10, Envenom 10, Improve Dodge 10, Hiding 8, Detoxify 1', cites: [['pNax'], ['pNaxT']] },
        { text: 'ชุดนี้ไม่ได้อัพ Advanced Katar Mastery ในเว็บ AKM ต้องมี Katar Mastery 7 กับ Double Attack 5 ก่อน', cites: [['pNax'], ['pAKM']] },
        { text: 'หน้า build ไม่มีคำอธิบายว่าทำไมเลือกแบบนี้', cites: [['pNax']] },
      ],
      plan: {
        picks: {
          thief: { 'Double Attack': 10, Steal: 10, Envenom: 10, 'Improve Dodge': 10, Hiding: 8, Detoxify: 1 },
          assassin: { 'Katar Mastery': 10, Cloaking: 2, 'Enchant Poison': 10, 'Sonic Blow': 10, 'Create Deadly Poison': 1, Grimtooth: 5, 'Enchant Deadly Poison': 5 },
        },
        basis: { text: 'ชุดของ naxchefkoch บนเว็บ roz.prontera.info (ตัว 60/60 จึงยังเหลือแต้มถึง Job 70)', cites: [['pNax'], ['pNaxT']] },
      },
      gear: [
        { slot: 'อาวุธ', text: 'naxchefkoch ใช้ Jamadhar +5 · Ryan Geldun ใช้ Jur +6 (ดรอปจาก Martin) ใส่ Soldier Skeleton Card 2 ใบ กับ Sidewinder Card 1 ใบ', items: [4086, 4117], cites: [['pNax'], ['ryan', '00:41'], ['ryan', '00:49']] },
        { slot: 'เสื้อ', text: 'Undershirt กับ Pantie (ชุดคู่ ได้ AGI +5 FLEE +10) หรือใช้ Undershirt ที่มีช่องใส่ Whisper Card', items: [2522, 2339, 4102], cites: [['ryan', '01:56']] },
        { slot: 'ประดับ', text: 'Brooch 2 ชิ้น (AGI +2 ต่อชิ้น) · naxchefkoch ใช้ Rosary 2 ชิ้น', items: [2605, 2608], cites: [['ryan', '02:16'], ['pNax']] },
        { slot: 'หมวก', text: 'Angel Wing หรือ Apple of Archer (DEX +2)', items: [2254, 2285], cites: [['ryan', '02:41']] },
      ],
      cautions: [
        { text: 'ตัวเลขในคลิป Ryan Geldun มาจากตัว Lv 94 บนเซิร์ฟทดสอบ ไม่ใช่ Zero ห้ามเอาไปเทียบดาเมจ', cites: [['ryan', '00:02'], ['ryan', '04:52']] },
      ],
    },
    {
      id: 'soul-destroyer-pk',
      name: 'สาย Soul Destroyer (STR สาย PK)',
      pickIf: 'อยากเล่นแมพ PK ซ่อนตัวแล้วเข้าตีเอง',
      idea: {
        text: 'Xiendong ทำตัวนี้เพื่อ PK ใช้ Cloaking ซ่อนตัว ดูจังหวะแล้วเข้าตีด้วย Soul Destroyer ผลทดสอบของเขาคือดาเมจมาจาก ATK (STR กับอาวุธ) เป็นหลัก INT เพิ่มน้อยมาก',
        cites: [['xsd', '00:39'], ['xsd', '02:08'], ['xsd', '03:34'], ['xsd', '05:10']],
      },
      statNotes: [
        { text: 'คลิปไม่ได้บอกตัวเลขสเตตัส บอกแค่ว่า STR เพิ่มดาเมจชัดเจน ส่วน INT ถึงคำอธิบายสกิลจะเขียนถึงก็เพิ่มน้อย', cites: [['xsd', '02:18'], ['xsd', '02:35']] },
        { text: 'HIT 300 กับ DEX 50 ยังตีผู้เล่นบางคนไม่โดน เพราะหลายคนทำ FLEE ราว 350 ไว้ลง Memorial Dungeon เป้าของเขาคือ HIT อย่างน้อย 400 และ FLEE ตัวเองราว 350', cites: [['xsd', '05:37'], ['xsd', '06:04']] },
        { text: 'ใส่ของครบแล้ว FLEE ขึ้นไปราว 300 ตั้งแต่ยังไม่ได้แจกสเตตัสดีๆ', cites: [['xsd', '08:27']] },
      ],
      skills: [
        { skill: 'Soul Destroyer', level: 'ไม่ได้บอก', why: 'สกิลหลัก ในเว็บใช้ SP 60 ทุกเลเวล ดาเมจ ATK 150% ถึง 1500% ระยะ 4 ช่อง', cites: [['xsd', '01:01'], ['pSD']] },
        { skill: 'Cloaking', level: 'ไม่ได้บอก', why: 'ซ่อนตัวรอจังหวะ', cites: [['xsd', '00:39']] },
        { skill: 'Enchant Deadly Poison', level: 'ไม่ได้บอก', why: 'เพิ่มดาเมจ Soul Destroyer ได้มาก', cites: [['xsd', '07:21']] },
      ],
      skillNotes: [
        { text: 'ในเว็บ Soul Destroyer ต้องมี Envenom 5, Cloaking 3, Double Attack 5, Enchant Poison 6 ก่อน', cites: [['pSD']] },
        { text: 'คลิปไม่ได้บอกลำดับหรือเลเวลสกิล จึงไม่มีแผนแต้ม', cites: [['xsd', '01:01']] },
      ],
      gear: [
        { slot: 'อาวุธสองมือ', text: 'Hydra Card 4 ใบ (ชนะ Demi-Human ไว้ PK) กับ Archer Skeleton Card 4 ใบ (Soul Destroyer นับเป็นการตีกายภาพระยะไกล)', items: [4035, 4094], cites: [['xsd', '04:24'], ['xsd', '04:55']] },
        { slot: 'ธาตุ', text: 'ใช้ธาตุชนะเป้าได้ เช่นตีหุ่นธาตุดินด้วยตัวแปลงธาตุไฟ ดาเมจขึ้น การ์ดชนะเผ่าก็ใช้ได้', items: [12114], cites: [['xsd', '03:52'], ['xsd', '04:13']] },
      ],
      cautions: [
        { text: 'ตอนนี้ไม่มีรีเซ็ตสเตตัสไม่จำกัดแล้ว จะสลับไปลง DEX/LUK เพื่อคราฟต์ EDP แล้วสลับกลับไม่ได้ ตัวสาย STR จึงคราฟต์ติดยาก', cites: [['xsd', '07:53']] },
      ],
    },
    {
      id: 'flee-dungeon',
      name: 'สาย Soul Destroyer + Meteor Assault (FLEE ลงดันเดี่ยว)',
      tag: 'ลงดัน',
      pickIf: 'อยากโซโล Memorial Dungeon อย่าง Golden Thief Bug กับ Orc Hero',
      idea: {
        text: 'ใช้แค่สองสกิล Soul Destroyer กับ Meteor Assault ใส่ของ FLEE เกือบทั้งตัว ZixmaOne ลง Golden Thief Bug ระดับ Hard กับ Orc Hero ระดับปกติได้ที่ Lv 59',
        cites: [['zixma', '00:06'], ['zixma', '00:53'], ['zixma', '02:56']],
      },
      stats: [
        { who: 'ZixmaOne (Lv 59)', note: 'ไม่ได้บอกตัวเลข ซับฟังว่าแบ่งเฉลี่ย STR / AGI / VIT / INT / DEX ไม่ลง LUK (ฟังไม่ชัด)', cites: [['zixma', '00:28'], ['zixma', '00:39']] },
      ],
      statNotes: [
        { text: 'Golden Thief Bug ต้องการ FLEE ราว 350 ขึ้นไป ลงแบบปกติ FLEE 320-330 ก็ผ่าน ไม่ต้องใช้ยาบัฟหรือ EDP', cites: [['zixma', '03:02'], ['zixma', '04:29']] },
        { text: 'ระดับ Hard ใช้บัฟยาและอาหารจน FLEE ถึง 400 หลบ Golden Thief Bug ได้ 95% ตัวสุดท้ายคือ Challenge Drink', cites: [['zixma', '03:46'], ['zixma', '04:01']] },
      ],
      skills: [
        { skill: 'Soul Destroyer', level: 'ไม่ได้บอก', why: 'ใช้ตีบอส Golden Thief Bug', cites: [['zixma', '00:53'], ['zixma', '04:47']] },
        { skill: 'Meteor Assault', level: 'ไม่ได้บอก', why: 'ตีรอบตัว ใช้เคลียร์ดอกไม้พร้อมบอส Orc Hero ในเว็บดาเมจ ATK 320% ถึง 1400% ในพื้นที่ 5x5', cites: [['zixma', '00:53'], ['zixma', '08:28'], ['pMA']] },
      ],
      skillNotes: [
        { text: 'คลิปโชว์หน้าสกิลบนจอแต่ไม่ได้พูดเลเวล จึงไม่มีแผนแต้ม', cites: [['zixma', '00:46']] },
        { text: 'ในเว็บ Meteor Assault ต้องมี Soul Destroyer 1, Sonic Blow 5, Righthand Mastery 3, Katar Mastery 5 ก่อน', cites: [['pMA']] },
      ],
      gear: [
        { slot: 'หมวก', text: 'หมวกออปชั่น FLEE อะไรก็ได้', cites: [['zixma', '01:16']] },
        { slot: 'มือขวา', text: 'ออปชั่น ATK 30 หรือ HIT เยอะๆ · ดัน Orc Hero ใช้อาวุธ ATK สูง ใส่การ์ด 3 ใบ (ซับฟังไม่ชัด อาจเป็น Hydra Card)', cites: [['zixma', '01:29'], ['zixma', '07:21']] },
        { slot: 'มือซ้าย', text: 'อาวุธ 4 ช่องอะไรก็ได้ ใส่ Caramel Card 4 ใบ', items: [4063], cites: [['zixma', '01:45'], ['zixma', '01:59']] },
        { slot: 'เสื้อ', text: 'เสื้อ FLEE +9 ถ้า FLEE เกินแล้วใช้เสื้อ +9 ของ Assassin ที่ได้ ATK 30', cites: [['zixma', '02:14'], ['zixma', '03:17']] },
        { slot: 'ผ้าคลุม', text: 'Baby Shark ใส่การ์ดกันแมลง (ซับไม่ชัดว่าเป็นกระเป๋าหรือการ์ด)', cites: [['zixma', '02:31']] },
        { slot: 'รองเท้า', text: 'ออปชั่น FLEE 15 ตีบวก 7 ได้ FLEE อีก 15 รวม 30', cites: [['zixma', '02:42']] },
        { slot: 'ประดับ', text: 'Clip ใส่ Yoyo Card ทั้งสองชิ้น', items: [2607, 4051], cites: [['zixma', '02:47']] },
        { slot: 'Special', text: 'ไข่ตระกูล Chonchon FLEE +9 (ซับฟังไม่ชัด น่าจะเป็น Steel Chonchon)', cites: [['zixma', '02:52']] },
      ],
      play: [
        { text: 'เก็บหินด้วยสกิลเก็บหิน แล้วใช้ Stone Fling ปาไข่ โดนแน่ ดีกว่าปามีดตอน HIT ต่ำ', cites: [['zixma', '05:09']] },
        { text: 'ตายแล้วฟื้น EDP ไม่หาย แต่ธาตุอาวุธต้องใส่ใหม่ · ควรพก Token of Siegfried เพราะโดนตีทีเดียวอาจตาย', cites: [['zixma', '04:18'], ['zixma', '03:28']] },
        { text: 'สู้บอส Golden Thief Bug ไม่ถึง 30 วินาที เลือด 5,000 โดน Magnum Break ของบอสแล้วไม่ตาย', cites: [['zixma', '06:35']] },
        { text: 'Orc Hero ระดับปกติ: ลากบอสไปตีพร้อมดอกไม้ด้วย Meteor Assault ปกติไม่ต้องบัฟ', cites: [['zixma', '08:01'], ['zixma', '08:28']] },
      ],
      cautions: [
        { text: 'Orc Hero ระดับ Hard ยังทำไม่ได้ ดอกไม้เยอะและเลือดหนาเกิน', cites: [['zixma', '09:01']] },
        { text: 'สองแหล่งไม่ตรงกัน: Xiendong ว่า Soul Destroyer ไม่ต้องการ HIT มากเมื่อตีมอน ส่วน ZixmaOne บอกว่า HIT ตัวเองน้อยเลยต้องปาหินแทนมีด', cites: [['xsd', '05:22'], ['zixma', '05:14']] },
      ],
    },
    {
      id: 'farm',
      name: 'สายบอทฟาร์ม',
      pickIf: 'อยากเปิดบอทเก็บเลเวลหรือเก็บเงิน',
      idea: { text: 'Xiendong ไม่แนะนำ Soul Destroyer เป็นสายฟาร์มหลักช่วงต้น เพราะกิน SP เยอะและดาเมจช่วงแรกยังไม่แรง', cites: [['xsd', '01:03']] },
      missing: 'ยังไม่มีคลิป Zero สอน Assassin สายบอทฟาร์มหรือบอกแมพเก็บเลเวลหลังเปลี่ยนอาชีพ',
    },
  ],
  gaps: [
    'ยังไม่มีคลิป Zero บอกลำดับอัพสกิลพร้อมเลเวลของ Assassin มีแค่ build บนเว็บ',
    'ใน Zero Double Attack ออกคริได้หรือไม่',
    'สายสองมือ (Righthand/Lefthand Mastery), Grimtooth และ Venom Splasher ยังไม่มีข้อมูล',
    'แมพเก็บเลเวลของ Assassin หลัง Lv 50',
  ],
  sources: {
    xsd: { label: 'Xiendong', title: 'SOUL DESTROYER Assassin Starts Weak… Until This Happens', url: 'https://www.youtube.com/watch?v=CDwTVgVPv4g', kind: 'clip', lang: 'en' },
    zixma: { label: 'ZixmaOne', title: 'Solo Dungeon Guide LV.59 Assassin, pop some boosters and the boss is down in no time', url: 'https://www.youtube.com/watch?v=ixu3LjxM81c', kind: 'clip', lang: 'th' },
    ryan: { label: 'Ryan Geldun (เซิร์ฟทดสอบ)', title: 'Unstoppable DPS: How to Build the Perfect Crit Assassin (RO Zero)', url: 'https://www.youtube.com/watch?v=DRW52BenrkM', kind: 'clip', lang: 'en' },
    tako: { label: 'TakoyakiCh', title: 'จัด Tierlist Class2 ในโลก RO-Zero', url: 'https://www.youtube.com/watch?v=Y7MKIY0KiYo', kind: 'clip', lang: 'th' },
    meta: { label: 'Xiendong', title: 'Why Taiwan Players Build These Stats', url: 'https://www.youtube.com/watch?v=T5bjOqQomUc', kind: 'clip', lang: 'en' },
    xien: { label: 'Xiendong', title: 'My Current 1–60 Levelling Roadmap for my New Characters', url: 'https://www.youtube.com/watch?v=7ymM15xvYAY', kind: 'clip', lang: 'en' },
    kamonC: { label: 'KamonWay', title: 'How to Change to Class 2 for Every Job in 3 Minutes', url: 'https://www.youtube.com/watch?v=iTxVgyVGCbc', kind: 'clip', lang: 'en' },
    zeztz: { label: 'Zeztz', title: 'Rogue Autospell Guide: Everything You Need to Know in One Video', url: 'https://www.youtube.com/watch?v=UAUVtB-au3g', kind: 'clip', lang: 'th' },
    ncz: { label: 'NCZ', title: 'Recommended Leveling Maps Lv. 1-50', url: 'https://www.youtube.com/watch?v=IScycVE-tf8', kind: 'clip', lang: 'th' },
    pJob: { label: 'roz.prontera.info', title: 'Assassin skills', url: 'https://roz.prontera.info/jobs/assassin', kind: 'web' },
    pNax: { label: 'roz.prontera.info', title: 'Crit Assassin (60/60) โดย naxchefkoch', url: 'https://roz.prontera.info/builds/3c81f46f-49b6-41e9-936f-8ba688192817', kind: 'web' },
    pNaxT: { label: 'roz.prontera.info', title: 'Thief (50/50) (Pre CritAssa) โดย naxchefkoch', url: 'https://roz.prontera.info/builds/0fff49d5-10a7-46a1-a691-78e2488c6a3f', kind: 'web' },
    pSD: { label: 'roz.prontera.info', title: 'Soul Destroyer', url: 'https://roz.prontera.info/skills/soul-destroyer', kind: 'web' },
    pMA: { label: 'roz.prontera.info', title: 'Meteor Assault', url: 'https://roz.prontera.info/skills/meteor-assault', kind: 'web' },
    pEDP: { label: 'roz.prontera.info', title: 'Enchant Deadly Poison', url: 'https://roz.prontera.info/skills/enchant-deadly-poison', kind: 'web' },
    pAKM: { label: 'roz.prontera.info', title: 'Advanced Katar Mastery', url: 'https://roz.prontera.info/skills/advanced-katar-mastery', kind: 'web' },
    owner: { label: 'ยืนยันในเกม', title: 'เจ้าของเว็บตรวจในเกม 22 ก.ย. 2026', url: '', kind: 'web' },
  },
};
