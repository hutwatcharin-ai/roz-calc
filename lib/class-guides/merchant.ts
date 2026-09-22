// Merchant guide. Drafted 22 Sep 2026 from Downloads/roz-job-guides/merchant.md,
// which cites every line to a clip timestamp or a web page, and checked again
// against the transcripts in Downloads/yt-research/roz-jobs. Items, monsters
// and skills were checked against the site database. Monster names the Thai
// auto-captions garble are kept as "ชื่อไม่ชัด" and get no id.
import type { ClassGuide } from './types';

export const merchant: ClassGuide = {
  slug: 'merchant',
  job: 'Merchant',
  jobTh: 'เมอร์แชนท์',
  from: 'Novice',
  gathered: '22 ก.ย. 2026',
  summary:
    'อาชีพหนึ่งสายค้าขายและรถเข็น ใน Zero มี Cart Revolution ตีหมู่ได้ตั้งแต่อาชีพหนึ่ง เก็บเลเวลแบบลากมอนได้ และมีไว้ขายของแพงซื้อของถูก ไปต่อได้เป็น Blacksmith หรือ Alchemist',
  facts: [
    { text: 'เปลี่ยนอาชีพจาก Novice ที่ Merchant Guild เมือง Alberta', cites: [['pjobs']] },
    { text: 'Job ตันที่ 50 ได้แต้มสกิล 49 แต้ม · เปลี่ยนเป็นอาชีพสองได้ที่ Base Lv 50', cites: [['owner']] },
    { text: 'ไปต่อได้ 2 ทาง คือ Blacksmith หรือ Alchemist', cites: [['pmerchant']] },
    { text: 'Crazy Uproar, Change Cart และ Cart Revolution ได้จากเควส ไม่ต้องใช้แต้มสกิล', cites: [['pmerchant']] },
  ],
  path: ['merchant'],
  equipJob: 'Merchant',
  route: [
    { range: '1-9', text: 'เดินเควสเนื้อเรื่องไปก่อน จะได้ราว Lv 7-9 แล้วตีมอนรอบแมพต่ออีกนิด', cites: [['ncz', '01:56'], ['nottwice', '00:08']] },
    { range: '9-15', text: 'Spore ที่ Payon Forest (คลิปเรียกแมพเห็ดแดง) มอนเลือดน้อย เปิดบอทได้', maps: ['pay_fild08'], monsters: [1014], cites: [['ncz', '02:40'], ['ncz', '03:15']] },
    { range: '10-20', text: 'Thief Bug ที่ Prontera Sewer 2F (NotTwice เรียกแมงสาบ) หา Jacket ออปชั่นเลือดกับหลบไปด้วย', maps: ['prt_sewb2'], monsters: [1051], cites: [['ncz', '04:24'], ['nottwice', '00:20']] },
    { range: '20-30', text: 'Creamy กับ Smokie ที่ Gypsy Village ใกล้ Geffen แมพยอดฮิต คนเยอะก็ย้าย channel', maps: ['gef_fild05'], monsters: [1018, 1056], cites: [['ncz', '04:59'], ['ncz', '06:26']] },
    { range: '20+', text: 'หรือ Coco หาผ้าคลุมกับรองเท้าออปชั่นเลือดกับหลบ สนแค่สองค่านี้', maps: ['gef_fild02'], monsters: [1104], cites: [['nottwice', '01:46']] },
    { range: '30-40', text: 'Coco ที่ Geffen Field (เลือดเยอะกว่า) หรือ Ant Hell (มดเลือดน้อยกว่า การ์ดมดขายได้ราคา)', maps: ['gef_fild02', 'anthell02'], monsters: [1104, 1095], cites: [['ncz', '06:48'], ['ncz', '07:06'], ['ncz', '09:44']] },
    { range: '30-35', text: 'Goblin ลากมาตีหมู่ ตีสลับกับมอนที่ดรอปดาบเพื่อหาดาบดีๆ 1-2 เล่ม (ชื่อมอนไม่ชัด)', maps: ['gef_fild11'], monsters: [1122], cites: [['nottwice', '03:52'], ['nottwice', '04:01']] },
    { range: '40-50', text: 'Orc Village EXP เยอะ อยู่ยาวถึง Lv 50 ได้ · หรือ Steel Chonchon ถ้าอยากได้ของดรอปไปขาย', maps: ['gef_fild10'], monsters: [1023, 1042], cites: [['ncz', '11:02'], ['ncz', '11:57'], ['ncz', '13:26'], ['xdemi', '04:36']] },
    { range: '40-50', text: 'NotTwice ลาก "หนอนแดง" (ชื่อไม่ชัด) ได้ราว 16,000 EXP ต่อตัว เปิดคูณ EXP ได้ 20,000-22,000 เขาบอกว่าไม่มีที่ไหนดีกว่าแล้วในช่วงนี้', cites: [['nottwice', '07:12'], ['nottwice', '08:04']] },
    { range: 'ทางเลือก', text: 'Horn กับ Elder Willow สองแมพทางตะวันออกของ Payon คนน้อย EXP ใกล้เคียง Coco ดรอป Guisarme กับ Partizan', maps: ['pay_fild09'], monsters: [1128, 1033], cites: [['ryan', '00:01'], ['ryan', '00:36']] },
  ],
  routeNotes: [
    { text: 'ใน Zero ไม่มีการหัก EXP เมื่อเลเวลห่างจากมอน มีแค่อัตราดรอปที่ลดลงเมื่อห่างมาก คนส่วนใหญ่ไม่ข้ามแมพเพราะเปลืองยา', cites: [['ncz', '09:59'], ['ncz', '10:31']] },
    { text: 'รีเซ็ตสเตตัสและสกิลฟรีได้ถ้ายังไม่เกิน Lv 40 NPC อยู่ในกำแพงเมือง Prontera หลัง 40 ต้องเสียเงิน', cites: [['shank', '00:04'], ['shank', '00:57'], ['road', '02:31']] },
    { text: 'ช่วงแรกลง DEX ราว 20 ให้ตีโดนก่อน แล้วค่อยรีเซ็ตฟรีก่อน Lv 40', cites: [['meta', '06:01']] },
    { text: 'ฆ่า Orc ครบราว 30,000 ตัวได้ Achievement เป็นหมวก Orc Hero Headdress (STR +2)', cites: [['xdemi', '04:46']] },
    { text: 'NotTwice เทียบจากเว็บมอนสเตอร์ว่า EXP ต่อ HP เฉลี่ยราว 0.6 เกือบทุกเลเวล ทำดาเมจได้เท่าไหร่ก็ได้ EXP ใกล้กัน', cites: [['nottwice', '09:46'], ['nottwice', '09:56']] },
  ],
  gearByLevel: [
    { range: 'ทั้งทาง', slot: 'ออปชั่น', text: 'ออปชั่นที่คุ้มช่วงต้นคือ Max HP กับ FLEE ถ้าได้ FLEE ราว 15 ขึ้นไปทุกชิ้นจะถึง FLEE 250-300 ได้เร็ว', cites: [['meta', '05:46'], ['meta', '03:31']] },
    { range: '10+', slot: 'เสื้อ', text: 'Jacket จาก Thief Bug ออปชั่นเลือดกับหลบ', cites: [['nottwice', '00:20']] },
    { range: 'ช่วงแรก', slot: 'อาวุธ', text: 'Hammer ใช้ยาวๆ ลาก Spore ตีหมู่ ขยะที่ได้พอค่ายา', cites: [['nottwice', '00:37'], ['nottwice', '00:48']] },
    { range: '20+', slot: 'ผ้าคลุม / รองเท้า', text: 'จาก Coco ออปชั่นเลือดกับหลบ', cites: [['nottwice', '01:46']] },
    { range: '30-35', slot: 'อาวุธ / โล่', text: 'ดาบที่ดรอปแถว Goblin ใส่การ์ดสำหรับตี Goblin 2 ใบ โล่ดรอปง่ายที่ Goblin ใส่การ์ด 1 ใบ ซื้อได้ราว 20k', cites: [['nottwice', '04:28'], ['nottwice', '04:41']] },
    { range: '40-50', slot: 'อาวุธ', text: 'ขวานที่ดรอปแถว Goblin หาออปชั่น ATK บรรทัดบนกับ FLEE (+20 ยิ่งดี) ใส่ Caramel Card 2 ใบ ราวใบละ 20-30k', items: [4063], cites: [['nottwice', '07:16'], ['nottwice', '07:34']] },
  ],
  strengths: [
    { text: 'เก่งตั้งแต่อาชีพหนึ่ง ไม่ต้องรอเปลี่ยนคลาส ต่างจากภาคเก่าที่พ่อค้าแทบไม่มีสกิลเพิ่มดาเมจ', cites: [['tako', '13:41']] },
    { text: 'มี Cart Boost รถเข็นวิ่งเร็วตั้งแต่อาชีพหนึ่ง กันผลลดความเร็วอย่าง Decrease Agility ได้ด้วย (ต้องมี Pushcart ก่อน ใช้ 20 SP)', cites: [['tako', '13:47'], ['kamon', '01:06'], ['pcartboost']] },
    { text: 'Cart Revolution ตีโดนเป้าและมอนรอบตัว 3x3 ช่อง ผู้เล่นรู้สึกว่าไม่พลาดแม้ไม่มี DEX (เขาบอกเองว่าอาจเข้าใจกลไกผิด)', cites: [['pcartrev'], ['xdemi', '00:48'], ['xaxe', '01:04']] },
    { text: 'Overcharge ขายของแพงขึ้น Discount ซื้อของ NPC ถูกลง ผู้เล่นแนะนำให้มีพ่อค้าไว้ขายขยะและซื้อยา', cites: [['viva', '29:15']] },
  ],
  weaknesses: [
    { text: 'สาย Cart Revolution ที่ไม่พึ่ง FLEE เปลืองยา HP และของฟื้น SP อย่าง Cheese มาก', cites: [['xdemi', '05:34']] },
    { text: 'ช่วงแรกตัวยังไม่เก่ง ลากได้แค่ทีละ 3-4 ตัว ถ้ามีงบซื้อบัฟหรือยาจะง่ายขึ้น', cites: [['nottwice', '01:04'], ['nottwice', '01:27']] },
  ],
  builds: [
    {
      id: 'demi-human',
      name: 'สาย Cart Revolution ต้าน Demi-Human (STR/VIT)',
      tag: 'สายหลัก',
      pickIf: 'อยากเล่นมือลากมอน Goblin / Orc หรือเข้าแมพ PK',
      idea: {
        text: 'ใช้ Cart Revolution เป็นสกิลหลัก ลากมอนมารวมแล้วตีทีเดียว ซ้อนของลดดาเมจจาก Demi-Human จนถึกพอสู้ Goblin Leader ได้ ใช้ได้ทั้งฟาร์ม Goblin/Orc และแมพ PK',
        cites: [['xdemi', '00:48'], ['xdemi', '01:43'], ['xdemi', '05:21'], ['xdemi', '00:01']],
      },
      stats: [
        { who: 'Xiendong', str: 'เน้น', vit: 'เน้น', agi: 'ไม่ลง (กำลังคิดใส่ 20-30)', dex: 'ไม่ลง', note: 'ตัวเลขจริงโชว์บนจอ ไม่ได้พูดในคลิป', cites: [['xdemi', '01:18'], ['xdemi', '02:02']] },
      ],
      statNotes: [
        { text: 'ไม่ลง DEX เพราะรู้สึกว่า Cart Revolution ไม่พลาด ไม่ลง AGI เพราะโดนรุมหลายตัว FLEE ก็ลดลงอยู่ดี แต่ AGI ช่วงค่าต่ำใช้แต้มน้อย ใส่ 20-30 อาจคุ้ม', cites: [['xdemi', '01:18'], ['xdemi', '01:49'], ['xdemi', '02:05']] },
      ],
      skills: [
        { skill: 'Cart Revolution', level: 1, why: 'สกิลหลักของสายนี้ ได้จากเควส ตีหมู่ 3x3 ช่อง', cites: [['xdemi', '00:48'], ['pmerchant'], ['pcartrev']] },
      ],
      skillNotes: [
        { text: 'คลิปไม่ได้บอกเลเวลสกิลอื่น', cites: [['xdemi', '00:48']] },
        { text: 'Cart Revolution Lv 1 แรง 150% ATK ดาเมจเพิ่มตามน้ำหนักในรถเข็น ใช้ 12 SP', cites: [['pcartrev']] },
        { text: 'สกิลตีอีกตัวคือ Mammonite: Lv 10 แรง 600% ATK ใช้ 5 SP และเสีย 1,000z ต่อครั้ง', cites: [['pmammonite']] },
      ],
      gear: [
        { slot: 'หมวก', text: 'Poo Poo Hat ลดดาเมจจาก Demi-Human 10%', items: [2289], cites: [['xdemi', '02:32']] },
        { slot: 'เสื้อ', text: 'Chain Mail ออปชั่น Demi-Human ใส่ Pupa Card เพิ่ม HP', items: [4003], cites: [['xdemi', '02:45']] },
        { slot: 'อาวุธ', text: 'ดาบออปชั่น Demi-Human ใส่ Hydra Card 2 ใบ', items: [4035], cites: [['xdemi', '02:55']] },
        { slot: 'โล่', text: 'ใส่ Thara Frog Card ออปชั่น Demi-Human', items: [4058], cites: [['xdemi', '03:02']] },
        { slot: 'ผ้าคลุม', text: 'ออปชั่น Demi-Human ใส่การ์ดจากกิจกรรมที่แจกฟรีถึง 30 ก.ย. (คลิปไม่ได้บอกชื่อการ์ด)', cites: [['xdemi', '03:06']] },
        { slot: 'รองเท้า', text: 'ออปชั่นลดดาเมจ Demi-Human ยังไม่ใส่การ์ด', cites: [['xdemi', '03:39']] },
        { slot: 'ประดับ', text: 'การ์ดเพิ่มหลบ 2 ข้าง (ซับอ่านชื่อได้ไม่ชัด ระบุการ์ดไม่ได้)', cites: [['xdemi', '03:55']] },
      ],
      play: [
        { text: 'วนรอบจุดที่ Goblin เยอะ ดึงมารวมกันแล้วกด Cart Revolution ไม่ใช้บัฟก็ฟาร์มได้', cites: [['xdemi', '05:01'], ['xdemi', '05:14']] },
        { text: 'ไม่ใส่ Creamy Card เพราะเก็บเลเวลในแมพ PK ซึ่งห้ามวาร์ป ผู้ทำคลิปบอกว่าแมพ PK มอนเกิดเร็วและเยอะกว่า (EXP +10% เป็นคำบอกต่อ ยังไม่ยืนยัน)', cites: [['xdemi', '04:02'], ['xdemi', '04:14']] },
      ],
      maps: [
        { text: 'Goblin และ Orc Village (Orc ก็เป็น Demi-Human) อยู่ Orc ยาวถึง Lv 50 ได้', cites: [['xdemi', '04:26'], ['xdemi', '04:40']] },
      ],
      cautions: [
        { text: 'ในแมพ PK ใช้ Teleport กับ Butterfly Wing ไม่ได้ ยาหมดกลางดงมอนคือตาย เสีย EXP 10%', cites: [['xdemi', '05:51']] },
        { text: 'ฆ่าผู้เล่นผิดคนอาจติดสถานะ wanted แล้วโดนทั้งกิลด์ตาม', cites: [['xdemi', '00:35']] },
        { text: 'ใส่ชุดต้าน Demi-Human ครบแล้วยังโดน Mage ใช้ Earth Spike เกือบตายในทีเดียว', cites: [['xdemi', '07:46']] },
      ],
    },
    {
      id: 'mob-leveling',
      name: 'เก็บเลเวล 1-50 แบบลากมอน (เล่นมือ)',
      pickIf: 'อยากเล่นมือเก็บเลเวลเร็ว และหาเงินค่ายาจากขยะไปด้วย',
      idea: {
        text: 'ลากมอนมาเป็นแถวแล้วใช้สกิลผลักตีหมู่ (จากบริบทน่าจะเป็น Cart Revolution) เงินจากขายขยะพอจ่ายค่ายา',
        cites: [['nottwice', '00:45'], ['nottwice', '01:27']],
      },
      skillNotes: [
        { text: 'คลิปไม่ได้บอกทั้งเลเวลสกิลและสเตตัส ดูเส้นทางเก็บเลเวลกับของตามเลเวลด้านบน', cites: [['nottwice', '00:05']] },
      ],
      play: [
        { text: 'สกิลผลักมอนไปทางซ้ายของแมพเสมอ ลากเสร็จให้หมุนกล้องกลับให้ตรงกับแมพ', cites: [['nottwice', '02:04'], ['nottwice', '02:24']] },
        { text: 'ลากมอนมาเป็นเส้นตรงไว้ทางซ้ายของตัวเรา ตีแล้วมอนกระเด็นชนกัน จะทยอยเข้ามาตีไม่พร้อมกัน', cites: [['nottwice', '02:30'], ['nottwice', '02:58']] },
        { text: 'แมพที่มอนไม่ตีก่อน: ตีแล้วเดิน มอนจะไม่ตาม ได้ราว 7,000 EXP ต่อตัวตอนเปิดคูณ แต่ขยะถูก ไม่พอค่ายา (ชื่อแมพไม่ชัด)', cites: [['nottwice', '05:04'], ['nottwice', '06:19']] },
      ],
      cautions: [
        { text: 'ช่วง 40 แรกๆ ที่ "หนอนแดง" ยังยาก ลากทีละ 1-2 ตัวก่อน ถ้าขวานมี FLEE จะลากได้ 4-6 ตัว', cites: [['nottwice', '07:28'], ['nottwice', '07:44']] },
      ],
    },
    {
      id: 'trader',
      name: 'ตัวค้าขาย Discount / Overcharge',
      tag: 'ตัวเสริม',
      pickIf: 'อยากมีไอดีไว้ขายขยะแพงและซื้อยาถูก',
      idea: {
        text: 'มีพ่อค้าไว้ขายขยะแพงขึ้นด้วย Overcharge และซื้อของ NPC ถูกลงด้วย Discount',
        cites: [['viva', '29:15']],
      },
      skills: [
        { skill: 'Discount', level: 10, why: 'ซื้อของ NPC ถูกลง ต้อง Enlarge Weight Limit ก่อน', cites: [['viva', '29:15'], ['pmerchant'], ['hoohoo', '01:23']] },
        { skill: 'Overcharge', level: 10, why: 'ขายของให้ NPC แพงขึ้น ต้อง Discount ก่อน', cites: [['viva', '29:15'], ['pmerchant'], ['hoohoo', '01:23']] },
      ],
      skillNotes: [
        { text: 'ตัวอย่างราคา: Horn ขาย NPC ได้ราว 43z ก่อนคิด Overcharge', cites: [['ryan', '00:48']] },
        { text: 'ยังไม่มีแหล่งไหนบอกเปอร์เซ็นต์ลด/เพิ่มราคาต่อเลเวลใน Zero', cites: [['pmerchant']] },
      ],
    },
    {
      id: 'hoohoo',
      name: 'แจกสกิลแบบ Hoo Hoo (ก่อนไป Alchemist)',
      pickIf: 'จะไปต่อ Alchemist และอยากได้สกิลค้าขายครบ',
      idea: {
        text: 'ยังไม่มีคลิปสอน Merchant ล้วน นี่คือสกิลช่วงพ่อค้าจากบิลด์ Alchemist ที่ Hoo Hoo แชร์ เน้นสกิลค้าขายกับรถเข็น',
        cites: [['hoohoo', '01:13']],
      },
      skills: [
        { skill: 'Enlarge Weight Limit', level: 10, cites: [['hoohoo', '01:21']] },
        { skill: 'Discount', level: 10, cites: [['hoohoo', '01:23']] },
        { skill: 'Overcharge', level: 10, cites: [['hoohoo', '01:23']] },
        { skill: 'Pushcart', level: 10, why: 'เดินเร็วขึ้น ไม่ติดโทษความเร็วตอนลากรถเข็น', cites: [['hoohoo', '01:23'], ['hoohoo', '01:26']] },
        { skill: 'Axe Mastery', level: 'ไม่ระบุ', why: 'คลิปไม่ได้บอกเลเวล', cites: [['hoohoo', '01:31']] },
      ],
      skillNotes: [
        { text: 'Basic Skill 9 ที่คลิปพูดถึงเป็นสกิลของ Novice ไม่นับในแต้ม Merchant', cites: [['hoohoo', '01:16']] },
        { text: 'ไม่อัพ Cart Boost', cites: [['hoohoo', '01:48']] },
        { text: 'Hoo Hoo บอกว่าเปลี่ยนจากขวานมาใช้ดาบแล้ว ZixmaOne ก็บอกว่าใส่ดาบแล้วได้ ATK จาก Mastery เต็ม 30 แต่คำอธิบายสกิลในฐานข้อมูลเขียนว่าเพิ่ม ATK เมื่อใช้ขวาน ยังไม่ยืนยันว่าได้ผลกับดาบ', cites: [['hoohoo', '01:36'], ['zixma', '02:40']] },
      ],
      plan: {
        picks: {
          merchant: { 'Enlarge Weight Limit': 10, Discount: 10, Overcharge: 10, Pushcart: 10 },
        },
        basis: { text: 'สกิลที่ Hoo Hoo บอกเลเวลในคลิป ส่วน Axe Mastery ไม่ได้บอกเลเวลจึงไม่ได้ใส่ในแผน', cites: [['hoohoo', '01:13'], ['hoohoo', '01:31']] },
        leftover: { text: 'แต้มที่เหลือ: คลิปเอาไปลง Axe Mastery แต่ไม่ได้บอกกี่เลเวล', cites: [['hoohoo', '01:31']] },
      },
    },
    {
      id: 'bomber',
      name: 'แจกสกิลแบบ Bomber Alche (aLiSTs)',
      pickIf: 'จะไปต่อ Alchemist และอยากได้ Axe Mastery ด้วย',
      idea: {
        text: 'บิลด์ Alchemist ที่ผู้เล่น aLiSTs แชร์บน roz.prontera.info ช่วงพ่อค้าเก็บสกิลค้าขาย รถเข็น และ Axe Mastery 8',
        cites: [['pbuild']],
      },
      skills: [
        { skill: 'Enlarge Weight Limit', level: 10, cites: [['pbuild']] },
        { skill: 'Axe Mastery', level: 8, cites: [['pbuild']] },
        { skill: 'Crazy Uproar', level: 1, cites: [['pbuild']] },
        { skill: 'Item Appraisal', level: 1, cites: [['pbuild']] },
        { skill: 'Discount', level: 7, cites: [['pbuild']] },
        { skill: 'Pushcart', level: 10, cites: [['pbuild']] },
        { skill: 'Change Cart', level: 1, cites: [['pbuild']] },
        { skill: 'Overcharge', level: 10, cites: [['pbuild']] },
        { skill: 'Vending', level: 1, cites: [['pbuild']] },
        { skill: 'Cart Revolution', level: 1, cites: [['pbuild']] },
        { skill: 'Cart Boost', level: 1, cites: [['pbuild']] },
      ],
      skillNotes: [
        { text: 'บิลด์นี้ลง Basic Skill 8 กับ First Aid 1 ด้วย ซึ่งเป็นสกิลของ Novice ไม่นับในแต้ม Merchant', cites: [['pbuild']] },
      ],
      plan: {
        picks: {
          merchant: {
            'Enlarge Weight Limit': 10, 'Axe Mastery': 8, 'Crazy Uproar': 1, 'Item Appraisal': 1, Discount: 7,
            Pushcart: 10, 'Change Cart': 1, Overcharge: 10, Vending: 1, 'Cart Revolution': 1, 'Cart Boost': 1,
          },
        },
        basis: { text: 'สกิลช่วงพ่อค้าตามบิลด์ Bomber Alche ของ aLiSTs', cites: [['pbuild']] },
      },
    },
  ],
  gaps: [
    'ยังไม่มีคลิปหรือเว็บที่ให้ลำดับสกิล Merchant ล้วน แผนสกิลมาจากบิลด์ที่ไปต่อ Alchemist',
    'ตัวเลขสเตตัสของทุกสายโชว์บนจอเท่านั้น ไม่มีใครพูดเป็นตัวเลข',
    'ชื่อมอนหลายตัวในคลิป NotTwice ระบุไม่ได้ เช่น "หนอนแดง" และมอนที่ดรอปดาบแถว Goblin',
    'Axe Mastery ได้ผลกับดาบหรือไม่ แหล่งข้อมูลยังขัดกัน',
    'ยังไม่มีข้อมูลเฉพาะอาชีพหนึ่งเรื่องเล่นปาร์ตี้ เปิดบอท หรือตี MVP',
  ],
  sources: {
    xdemi: { label: 'Xiendong', title: 'I Tried Building My Merchant Around Demi-Human Affixes and Cards', url: 'https://www.youtube.com/watch?v=me-Q_z1ExSM', kind: 'clip', lang: 'en' },
    xaxe: { label: 'Xiendong', title: 'BLACKSMITH Axe Tornado Looks OP… But How Does It REALLY Work?', url: 'https://www.youtube.com/watch?v=IneQBTIHGqk', kind: 'clip', lang: 'en' },
    meta: { label: 'Xiendong', title: 'Why Taiwan Players Build These Stats', url: 'https://www.youtube.com/watch?v=T5bjOqQomUc', kind: 'clip', lang: 'en' },
    road: { label: 'Xiendong', title: 'My Current 1–60 Levelling Roadmap for my New Characters', url: 'https://www.youtube.com/watch?v=7ymM15xvYAY', kind: 'clip', lang: 'en' },
    nottwice: { label: 'NotTwice', title: 'Guide เก็บเลเวลพ่อค้า 1-50', url: 'https://www.youtube.com/watch?v=3vv3ikWgOgU', kind: 'clip', lang: 'th' },
    tako: { label: 'TakoyakiCh', title: 'จัด Tierlist Class2 ในโลก RO-Zero', url: 'https://www.youtube.com/watch?v=Y7MKIY0KiYo', kind: 'clip', lang: 'th' },
    kamon: { label: 'KamonWay', title: "Ragnarok Zero: Global (ROZG) Beginner's Guide", url: 'https://www.youtube.com/watch?v=_8VlLdO7TXw', kind: 'clip', lang: 'th' },
    viva: { label: 'Viva-Tz', title: 'เริ่มต้นเล่น Ragnarok Zero อย่างมืออาชีพ คลิปนี้มีคำตอบ', url: 'https://www.youtube.com/watch?v=WGJRg3dQElI', kind: 'clip', lang: 'th' },
    hoohoo: { label: 'Hoo Hoo', title: '70K ACID BOMB?! HOW TO 1-HIT MOBS | ALCHEMIST BUILD GUIDE', url: 'https://www.youtube.com/watch?v=rQ6OgslruGA', kind: 'clip', lang: 'en' },
    zixma: { label: 'ZixmaOne', title: 'Alchemist Acid Demonstration Build – 1-Hit KO!', url: 'https://www.youtube.com/watch?v=GOjBmjDcxbg', kind: 'clip', lang: 'th' },
    shank: { label: 'แชงค์888', title: 'How to Free Reset Skills and Stats Before Level 40', url: 'https://www.youtube.com/watch?v=lRGGsRGUKYY', kind: 'clip', lang: 'th' },
    ncz: { label: 'NCZ', title: 'Recommended Leveling Maps Lv. 1-50', url: 'https://www.youtube.com/watch?v=IScycVE-tf8', kind: 'clip', lang: 'th' },
    ryan: { label: 'Ryan Geldun', title: 'Chill Zeny and Exp farming spot you FORGOT about', url: 'https://www.youtube.com/watch?v=oEPSeeOEGVk', kind: 'clip', lang: 'en' },
    pjobs: { label: 'roz.prontera.info', title: 'Jobs', url: 'https://roz.prontera.info/jobs', kind: 'web' },
    pmerchant: { label: 'roz.prontera.info', title: 'Merchant skills', url: 'https://roz.prontera.info/jobs/merchant', kind: 'web' },
    pcartrev: { label: 'roz.prontera.info', title: 'Cart Revolution', url: 'https://roz.prontera.info/skills/cart-revolution', kind: 'web' },
    pmammonite: { label: 'roz.prontera.info', title: 'Mammonite', url: 'https://roz.prontera.info/skills/mammonite', kind: 'web' },
    pcartboost: { label: 'roz.prontera.info', title: 'Cart Boost', url: 'https://roz.prontera.info/skills/cart-boost', kind: 'web' },
    pbuild: { label: 'roz.prontera.info', title: 'Bomber Alche (aLiSTs)', url: 'https://roz.prontera.info/builds/4e87429f-a7e5-49a2-8f73-9ef872882869', kind: 'web' },
    owner: { label: 'ยืนยันในเกม', title: 'เจ้าของเว็บตรวจในเกม 22 ก.ย. 2026', url: '', kind: 'web' },
  },
};
