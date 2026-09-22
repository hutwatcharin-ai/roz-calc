// Alchemist guide. Drafted 22 Sep 2026 from Downloads/roz-job-guides/alchemist.md
// (and merchant.md for the Lv 1-50 route and the Merchant half of each skill
// plan), both of which cite every line to a clip timestamp or a web page, and
// checked again against the transcripts in Downloads/yt-research/roz-jobs.
// Items, monsters and skills were checked against the site database. Clips call
// the main skill "Acid Demonstration"; the database and roz.prontera.info name
// it Acid Bomb, so this page does too. Lines from Ryan Geldun's Alchemist clip
// are Taiwan Zero footage and say so.
import type { ClassGuide } from './types';

export const alchemist: ClassGuide = {
  slug: 'alchemist',
  job: 'Alchemist',
  jobTh: 'อัลเคมิสต์',
  from: 'Merchant',
  gathered: '22 ก.ย. 2026',
  summary:
    'อาชีพสองของ Merchant เล่นได้สองแบบ: ปา Acid Bomb ให้มอนตายในทีเดียว (แรงมากแต่ค่าขวดแพง) หรือเลี้ยง Homunculus กับเรียกพืชมาช่วยสู้',
  facts: [
    { text: 'เปลี่ยนเป็น Alchemist ได้ที่ Base Lv 50 · Job ตันที่ 70 ได้แต้มสกิล 69 แต้ม', cites: [['owner']] },
    {
      text: 'Acid Bomb, Bomb, Summon Flora และ Call Homunculus อยู่ในผังสกิล Alchemist เลย ได้ตั้งแต่เปลี่ยนอาชีพ ไม่ต้องทำอะไรเพิ่ม',
      cites: [['owner'], ['pjob']],
    },
    {
      text: 'Acid Bomb ใช้ Bottle Grenade 1 ขวดกับ Acid Bottle 1 ขวดต่อครั้ง ซื้อจาก NPC ได้ ไม่ต้องทำเอง (คลิปเรียกสกิลนี้ว่า Acid Demonstration)',
      cites: [['pacidbomb'], ['xpoke', '01:19'], ['zixma', '07:49']],
    },
  ],
  path: ['merchant', 'alchemist'],
  equipJob: 'Alchemist',
  route: [
    { range: '1-9', text: 'เดินเควสเนื้อเรื่องไปก่อน สามเควสแรกให้ Fly Wing กับ Butterfly Wing ฟรี', cites: [['ncz', '01:56'], ['road', '00:39'], ['road', '00:48']] },
    { range: '9-15', text: 'Spore ที่ Payon Forest (คลิปเรียกแมพเห็ดแดง) มอนเลือดน้อย เปิดบอทได้', maps: ['pay_fild08'], monsters: [1014], cites: [['ncz', '02:40'], ['ncz', '03:15']] },
    { range: '10-20', text: 'Thief Bug ที่ Prontera Sewer 2F หา Jacket ออปชั่นเลือดกับหลบไปด้วย', maps: ['prt_sewb2'], monsters: [1051], cites: [['ncz', '04:24'], ['nottwice', '00:20']] },
    { range: '20-30', text: 'Creamy กับ Smokie ที่ Gypsy Village ใกล้ Geffen แมพยอดฮิต คนเยอะก็ย้าย channel', maps: ['gef_fild05'], monsters: [1018, 1056], cites: [['ncz', '04:59'], ['ncz', '06:26']] },
    { range: 'ถึง 30-35', text: 'Xiendong ตั้งบอทตัวใหม่ทุกตัวที่ Poison Spore ไปจนราว Lv 30 บางทีถึง 35', maps: ['mjolnir_06'], monsters: [1077], cites: [['road', '01:12'], ['road', '01:23']] },
    { range: '30-35', text: 'Coco ที่ Geffen Field (ได้ผ้าคลุมกับรองเท้า) หรือ Ant Hell ช่วงนี้ Xiendong บอกว่าช้าที่สุด ต้องอดทน', maps: ['gef_fild02', 'anthell02'], monsters: [1104, 1095], cites: [['road', '01:32'], ['road', '01:40'], ['ncz', '06:48'], ['ncz', '07:06']] },
    { range: '35-50', text: 'Hode ที่ Sograt Desert ให้ตัว Lv 50 พาเก็บ ปาร์ตี้แชร์ EXP ได้ถ้าเลเวลห่างกันไม่เกิน 15', maps: ['moc_fild17'], monsters: [1127], cites: [['road', '02:04'], ['road', '02:11'], ['road', '02:26']] },
    { range: '40-50', text: 'ถ้าเล่นคนเดียว: Orc Village EXP เยอะ อยู่ยาวถึง Lv 50 ได้ · หรือ Steel Chonchon ถ้าอยากได้ของดรอปไปขาย', maps: ['gef_fild10', 'moc_fild13'], monsters: [1023, 1042], cites: [['ncz', '11:02'], ['ncz', '13:26'], ['xdemi', '04:36']] },
    { range: '50', text: 'เปลี่ยนเป็น Alchemist หา NPC ไม่เจอให้กด N แล้วพิมพ์ชื่ออาชีพ จะมีลูกศรนำทาง', cites: [['owner'], ['road', '05:23'], ['road', '05:43']] },
    { range: '50-60', text: 'Nordfeld Cave 2F Xiendong อยู่ที่นี่จนถึง Lv 60 · ZixmaOne ปา Acid Bomb คนเดียวจาก 50 ถึง 60 ในราวครึ่งวัน', maps: ['nrd_dun02'], cites: [['road', '06:12'], ['zixma', '00:44'], ['zixma', '00:56']] },
  ],
  routeNotes: [
    { text: 'รีเซ็ตสเตตัสและสกิลฟรีได้ถ้ายังไม่เกิน Lv 40 NPC อยู่ในกำแพงเมือง Prontera หลัง 40 ต้องเสียเงินจริง', cites: [['shank', '00:04'], ['shank', '00:57'], ['road', '02:37']] },
    { text: 'ช่วงแรกลง DEX ราว 20 ให้ตีโดนก่อน แล้วค่อยรีเซ็ตฟรีก่อน Lv 40', cites: [['meta', '06:01']] },
    { text: 'ฆ่า Orc ครบราว 30,000 ตัวได้ Achievement เป็นหมวก Orc Hero Headdress (STR +2)', cites: [['xdemi', '04:46']] },
  ],
  gearByLevel: [
    { range: 'ทั้งทาง', slot: 'ออปชั่น', text: 'ออปชั่นที่คุ้มช่วงต้นคือ Max HP กับ FLEE ถ้าได้ FLEE ราว 15 ขึ้นไปทุกชิ้นจะถึง FLEE 250-300 ได้เร็ว', cites: [['meta', '05:46'], ['meta', '03:31']] },
    { range: '10+', slot: 'เสื้อ', text: 'Jacket จาก Thief Bug ออปชั่นเลือดกับหลบ', cites: [['nottwice', '00:20']] },
    { range: 'ช่วงแรก', slot: 'อาวุธ', text: 'Hammer ใช้ยาวๆ ลาก Spore ตีหมู่ ขยะที่ได้พอค่ายา', cites: [['nottwice', '00:37'], ['nottwice', '00:48']] },
    { range: '20+', slot: 'ผ้าคลุม / รองเท้า', text: 'จาก Coco ออปชั่นเลือดกับหลบ', cites: [['nottwice', '01:46']] },
    { range: '40-50', slot: 'อาวุธ', text: 'ขวานออปชั่น ATK บรรทัดบนกับ FLEE (+20 ยิ่งดี) ใส่ Caramel Card 2 ใบ', items: [4063], cites: [['nottwice', '07:16'], ['nottwice', '07:34']] },
    { range: '50+', slot: 'ของสิ้นเปลือง', text: 'Bottle Grenade กับ Acid Bottle ซื้อจาก NPC ในอาคารเปลี่ยนอาชีพที่ Aldebaran (มุมซ้ายล่างของเมือง) เดินลงชั้นล่าง ไม่ต้องขึ้นชั้นเปลี่ยนคลาส', items: [7135, 7136], cites: [['zixma', '07:40'], ['zixma', '07:45']] },
    { range: '50+', slot: 'อาวุธ', text: 'หาออปชั่น HIT บนอาวุธ ถ้าได้ HIT +20 จะไม่ต้องลง DEX เพื่อ HIT ทั้งหมด', cites: [['xpoke', '02:55'], ['zixma', '08:55']] },
  ],
  strengths: [
    { text: 'Acid Bomb แรงพอฆ่ามอนในทีเดียว คลิปไทยตีได้ 50,000-70,000 คลิปอังกฤษราว 60,000', cites: [['zixma', '07:16'], ['hoohoo', '00:22']] },
    { text: 'ฆ่าในทีเดียวเลยแทบไม่โดนตี ไม่ต้องพึ่ง HP กับ FLEE มาก เก็บเลเวลคนเดียวได้ไม่ต้องตั้งปาร์ตี้', cites: [['zixma', '04:48'], ['zixma', '07:28']] },
    { text: 'Homunculus ได้ EXP ส่วนหนึ่งทุกครั้งที่เราฆ่ามอน ไม่ต้องปล่อยให้มันตีเองเหมือนภาคเก่า', cites: [['ryan', '00:47'], ['xpoke', '08:18']] },
    { text: 'TakoyakiCh มองว่าน่าจะเป็นอาชีพล่าบอสที่เก่งที่สุด เพราะบอส VIT สูง (ประเมินก่อนอาชีพสองเปิด)', cites: [['tako', '15:44']] },
  ],
  weaknesses: [
    { text: 'ค่าขวดแพง: Bottle Grenade 171z กับ Acid Bottle 95z รวม 266z ต่อการปาหนึ่งครั้ง ราคานี้คือตอนมี Discount เต็มแล้ว', cites: [['zixma', '08:05'], ['zixma', '08:20'], ['hoohoo', '02:57']] },
    { text: 'Acid Bomb ต้องใช้ HIT เยอะ ลง DEX แล้วยังพลาดอยู่', cites: [['xpoke', '02:38'], ['zixma', '01:54']] },
    { text: 'ถ้าเอาไปเปิดบอทฟาร์ม ดาเมจต้องพึ่ง Homunculus TakoyakiCh จึงยังไม่จัดเทียร์ให้', cites: [['tako', '15:58'], ['tako', '16:11']] },
  ],
  builds: [
    {
      id: 'acid-bomb',
      name: 'สาย Acid Bomb ฆ่าในทีเดียว (STR/INT/DEX)',
      tag: 'สายหลัก',
      pickIf: 'มีงบค่าขวด อยากเก็บเลเวลคนเดียวให้เร็วที่สุด',
      idea: {
        text: 'ปาเป้าเดี่ยวให้ตายในทีเดียว เลยแทบไม่โดนตี ไม่ต้องห่วง HP กับ FLEE ทำ SP ให้พอแล้ววนใช้แค่ยา SP เล็ก ZixmaOne เรียกว่าสายเปย์',
        cites: [['zixma', '00:34'], ['zixma', '04:48'], ['hoohoo', '04:11']],
      },
      stats: [
        { who: 'ZixmaOne', str: 'หลัก', int: 'รอง', dex: 'ให้ HIT ถึง', note: 'ไม่ได้บอกตัวเลข · STR ให้ ATK, INT เป็นตัวคูณรองและเพิ่ม Max SP', cites: [['zixma', '01:24'], ['zixma', '01:37'], ['zixma', '01:54']] },
        { who: 'Hoo Hoo', str: 'หลัก', int: 'เพิ่ม SP', dex: 'HIT + ร่ายเร็ว', note: 'ไม่ได้บอกตัวเลข', cites: [['hoohoo', '00:34'], ['hoohoo', '00:42'], ['hoohoo', '00:56']] },
        { who: 'aLiSTs (บิลด์บนเว็บ)', str: '83', agi: '1', vit: '50', int: '40', dex: '76', luk: '1', note: 'ยังไม่ได้ตรวจว่าเลเวลตันตอนนี้ลงได้ถึงไหม', cites: [['pbuild']] },
        { who: 'MrRegenbogen (บิลด์บนเว็บ)', str: '70', agi: '1', vit: '1', int: '29', dex: '20', luk: '1', cites: [['pbuild2']] },
      ],
      statNotes: [
        { text: 'DEX ช่วยลดเวลาร่าย (variable cast) ของ Acid Bomb ด้วย', cites: [['zixma', '02:10'], ['hoohoo', '00:59']] },
        {
          text: 'แหล่งข้อมูลยังขัดกันว่า Acid Bomb แรงตามอะไร: เว็บบอกว่าตาม INT ผู้ใช้ VIT เป้าหมาย และ Base Lv แต่ Xiendong ทดสอบแล้วรู้สึกว่า INT กับ VIT มีผลน้อยกว่าภาคเก่า ATK อาวุธ ธาตุ และขนาดมอนมีผลมากกว่า',
          cites: [['pacidbomb'], ['xpoke', '01:42'], ['xpoke', '02:02'], ['xpoke', '02:14']],
        },
        { text: 'Xiendong บอกว่าสกิลทำงานเหมือนสกิลกายภาพระยะไกล การ์ดเพิ่มดาเมจระยะไกลอย่าง Archer Skeleton Card และการ์ดเผ่าหรือขนาดช่วยได้', cites: [['xpoke', '03:15'], ['xpoke', '03:32']] },
      ],
      skills: [
        { skill: 'Potion Research', level: 5, why: 'Hoo Hoo ลง 5 บิลด์บนเว็บลง 10', cites: [['hoohoo', '02:02'], ['pbuild']] },
        { skill: 'Prepare Potion', level: 5, why: 'Hoo Hoo ลง 5 บิลด์บนเว็บลง 10', cites: [['hoohoo', '02:04'], ['pbuild']] },
        { skill: 'Bomb', level: 5, why: 'ทางผ่านไป Acid Bomb', cites: [['hoohoo', '02:08'], ['pacidbomb']] },
        { skill: 'Acid Terror', level: 5, why: 'ทางผ่านไป Acid Bomb', cites: [['hoohoo', '02:08'], ['pacidbomb']] },
        { skill: 'Acid Bomb', level: 10, why: 'สกิลหลัก Hoo Hoo อัพตัวนี้ก่อนเลยแต่ไม่ได้บอกเลเวล บิลด์บนเว็บทั้งสองลง 10', cites: [['hoohoo', '01:57'], ['zixma', '02:51'], ['pbuild'], ['pbuild2']] },
        { skill: 'Aid Potion', level: 'ตามชอบ', why: 'ปายาฮีล Homunculus ให้มันแทงค์ ZixmaOne ก็อัพตัวนี้ (ซับเรียกชื่อเก่า Potion Pitcher)', cites: [['hoohoo', '02:13'], ['zixma', '03:08']] },
        { skill: 'Vaporize', level: 1, cites: [['hoohoo', '02:24']] },
        { skill: 'Call Homunculus', level: 1, cites: [['hoohoo', '02:24'], ['zixma', '02:59']] },
        { skill: 'Homunculus Resurrection', level: 'ไม่ระบุ', cites: [['hoohoo', '02:24']] },
      ],
      skillNotes: [
        { text: 'Acid Bomb Lv 1-10 แรง 400%-4,000% ATK ใช้ 50 SP ร่าย 1,000 ms คูลดาวน์ 500 ms ระยะ 9 ต้องมี Bomb 5 กับ Acid Terror 5 ก่อน', cites: [['pacidbomb']] },
        { text: 'ช่วง Merchant ของ Hoo Hoo: Enlarge Weight Limit 10, Discount 10, Overcharge 10, Pushcart 10 และ Axe Mastery (ไม่บอกเลเวล) ไม่เอา Cart Boost', cites: [['hoohoo', '01:19'], ['hoohoo', '01:23'], ['hoohoo', '01:31'], ['hoohoo', '01:46']] },
        { text: 'ช่วง Merchant ของ ZixmaOne: Discount กับ Overcharge เต็ม มีรถเข็น Enlarge Weight Limit เต็ม และสกิล Mastery เต็ม (ซับไม่ชัด น่าจะเป็น Axe Mastery)', cites: [['zixma', '02:30'], ['zixma', '02:36']] },
        { text: 'ทั้งสองคลิปบอกว่าใส่ดาบแล้วได้ ATK จาก Mastery เต็ม แต่คำอธิบาย Axe Mastery ในฐานข้อมูลเขียนว่าเพิ่ม ATK เมื่อใช้ขวาน ยังไม่ยืนยันว่าได้ผลกับดาบ', cites: [['hoohoo', '01:36'], ['zixma', '02:40']] },
      ],
      plan: {
        picks: {
          merchant: {
            'Enlarge Weight Limit': 10, 'Axe Mastery': 8, 'Crazy Uproar': 1, 'Item Appraisal': 1, Discount: 7,
            Pushcart: 10, 'Change Cart': 1, Overcharge: 10, Vending: 1, 'Cart Revolution': 1, 'Cart Boost': 1,
          },
          alchemist: {
            'Potion Research': 10, Bioethics: 1, 'Prepare Potion': 10, Vaporize: 1, Bomb: 5, 'Acid Terror': 5,
            'Call Homunculus': 1, 'Acid Bomb': 10, 'Homunculus Resurrection': 5,
          },
        },
        basis: {
          text: 'บิลด์ Bomber Alche ของ aLiSTs บนเว็บ เพราะเป็นแหล่งเดียวที่บอกเลเวลครบทุกสกิล (คลิปไม่ได้บอกเลเวลบางตัว) บิลด์นี้ลง Basic Skill 8 กับ First Aid 1 ของ Novice ด้วย ซึ่งไม่นับในแต้มนี้',
          cites: [['pbuild'], ['hoohoo', '01:13']],
        },
        leftover: { text: 'แต้มที่เหลือ: Hoo Hoo เอาไปลง Aid Potion ไว้ฮีล Homunculus เลเวลตามชอบ', cites: [['hoohoo', '02:13']] },
      },
      gear: [
        { slot: 'หมวก', text: 'หมวก Nordfeld ที่ให้ Max SP กับ ATK +20 (คลิปไม่บอกรุ่น ค่าพื้นฐานในฐานข้อมูลไม่มี ATK น่าจะมาจากออปชั่น) ZixmaOne ใช้หมวกที่มี ATK', cites: [['hoohoo', '05:36'], ['zixma', '03:33']] },
        { slot: 'หัวกลาง', text: 'Masquerade เพิ่มดาเมจใส่ Demi-Human เพราะมอนแมพที่ Hoo Hoo ฟาร์มเป็น Demi-Human', items: [2291], cites: [['hoohoo', '03:24']] },
        { slot: 'เสื้อ', text: 'Nordfeld Mantle (Max HP, Max SP, ฟื้น SP 10%) ตีบวก 9 ได้ฟื้น SP รวมราว 30% ออปชั่น SP, variable cast, SP ใส่ Roda Frog Card · ZixmaOne ใช้เสื้อออปชั่น SP 2 แถวกับ Roda Frog Card', items: [450587, 4014], cites: [['hoohoo', '03:46'], ['hoohoo', '04:01'], ['hoohoo', '04:36'], ['zixma', '03:48']] },
        { slot: 'โล่', text: 'Thara Frog Card เปลี่ยนตามแมพได้', items: [4058], cites: [['zixma', '03:56']] },
        { slot: 'รองเท้า', text: 'ออปชั่น Max HP กับ FLEE ใส่ Sohee Card (Max SP 15%, ฟื้น SP 3%) · ZixmaOne แนะนำให้หาออปชั่น SP แทน HP', items: [4100], cites: [['hoohoo', '04:45'], ['hoohoo', '05:53'], ['zixma', '04:23'], ['zixma', '09:16']] },
        { slot: 'ผ้าคลุม', text: 'ตัวไหนก็ได้ขอให้ใส่ Baby Shark Card (ATK)', items: [300834], cites: [['hoohoo', '05:23'], ['zixma', '05:10']] },
        { slot: 'ประดับ', text: 'Shining Clip (Max HP 3%, Max SP) ใส่ Creamy Card ไว้วาร์ป Hoo Hoo ยังลังเลระหว่าง Creamy Card, Earring, Mantis Card', items: [490975, 4040, 4079], cites: [['hoohoo', '05:03'], ['hoohoo', '05:14'], ['zixma', '05:16']] },
        { slot: 'อาวุธ', text: 'Saber ออปชั่น ATK และ HIT ใส่ Boulder Dwarf Captain Card 2 ใบกับ Hydra Card 1 ใบ (การ์ดชนิดเดียวกันใบที่ 3 ได้ผลแค่ครึ่ง ผู้พูดไม่แน่ใจ) · ในฐานข้อมูล Captain Card เพิ่มดาเมจเฉพาะกับมอน Boulder Dwarf', items: [300944, 4035], cites: [['hoohoo', '06:01'], ['hoohoo', '06:14'], ['hoohoo', '06:21'], ['zixma', '09:04']] },
        { slot: 'ยาบัฟ', text: 'ZixmaOne ใช้ยา HP, Challenge Drink (ATK), converter ธาตุไฟ และยา SP ถ้าฆ่าในทีเดียวได้แล้วไม่ต้องใช้ยา HP ก็ได้', items: [23605], cites: [['zixma', '06:26'], ['zixma', '06:39']] },
      ],
      play: [
        { text: 'ตั้งบอท: มอนเป้าหมาย 3 ตัว หน้าสกิลแรกตั้ง Acid Bomb หน้าสองตั้ง Cart Boost กับอีกสกิลที่ซับไม่ชัด เคลื่อนที่ด้วย Teleport อย่างเดียว', cites: [['zixma', '05:43'], ['zixma', '05:49'], ['zixma', '05:53'], ['zixma', '06:23']] },
        { text: 'เปลี่ยนธาตุ Acid Bomb ด้วย converter เช่น มอนธาตุดินให้ใช้ธาตุไฟ Xiendong เห็นว่าธาตุเป็นวิธีเพิ่มดาเมจที่ชัดที่สุด', cites: [['zixma', '07:02'], ['xpoke', '04:02'], ['xpoke', '04:08']] },
        { text: 'ZixmaOne ใช้ราว 1,200 ขวดต่อชั่วโมง ตัวละครแบกได้ราว 3,000 ขวด คือต้องกลับไปเติมทุก 2 ชั่วโมงเศษ', cites: [['zixma', '08:38'], ['zixma', '08:42']] },
        { text: 'Hoo Hoo มองว่าค่าขวดแพง แต่ถูกกว่าเสีย Cheese กับยาส้มเพราะโดนตีในระยะยาว', cites: [['hoohoo', '03:00'], ['hoohoo', '03:10']] },
      ],
      maps: [
        { text: 'Hoo Hoo ฟาร์มแถว Nordfeld ที่มอนเป็น Demi-Human (Boulder Dwarf) จึงเลือกของเพิ่มดาเมจ Demi-Human ZixmaOne ไม่ได้บอกแมพ', cites: [['hoohoo', '03:28'], ['hoohoo', '06:29']] },
      ],
      cautions: [
        { text: 'ขึ้น Lv 50 ใหม่ๆ Max SP กับ INT ยังน้อย อาจต้องพึ่งของฟื้น SP ไปช่วงหนึ่ง', cites: [['zixma', '06:06']] },
        { text: 'มอนบางตัว DEF สูงจนต้องปา 2 ครั้ง ถ้าต้องปา 2 ครั้ง SP จะเริ่มไม่พอ', cites: [['zixma', '06:46'], ['zixma', '07:11']] },
        { text: 'การ์ดอาวุธที่ ZixmaOne พูดถึงซับเขียนไม่ชัด น่าจะเป็น Boulder Dwarf Captain Card แบบเดียวกับ Hoo Hoo แต่ยังไม่ยืนยัน และการ์ดนี้ได้ผลเฉพาะกับ Boulder Dwarf', cites: [['zixma', '09:04']] },
      ],
    },
    {
      id: 'homunculus',
      name: 'สาย Homunculus + Summon Flora',
      pickIf: 'อยากมีคู่หูช่วยแทงค์และตี หรือเตรียมไว้ลงดันเจี้ยน',
      idea: {
        text: 'ใช้ Homunculus เป็นคู่หูหลักที่ทั้งแทงค์และทำดาเมจ แล้วเรียก Parasite ด้วย Summon Flora มาเป็นตัวยิงระยะไกลเสริม Xiendong เปรียบว่าเหมือนเล่นโปเกมอน ผู้เล่นไต้หวันใช้ Homunculus ช่วยเคลียร์ Memorial Dungeon',
        cites: [['xpoke', '00:13'], ['xpoke', '00:31'], ['xpoke', '09:52'], ['xpoke', '10:03']],
      },
      statNotes: [
        { text: 'ยังไม่มีข้อมูลสเตตัสสำหรับสายเลี้ยง Homunculus ล้วน', cites: [['xpoke', '08:45']] },
        { text: 'ตอนคราฟต์ อัตราสำเร็จขึ้นกับ DEX, LUK และ INT Xiendong สลับไปใช้สเตตัสชุดคราฟต์ชั่วคราวตอนที่รีเซ็ตยังฟรี และวางแผนแยกตัวคราฟต์ไว้หนึ่งตัว', cites: [['xpoke', '06:43'], ['xpoke', '06:59'], ['xpoke', '07:16']] },
      ],
      skills: [
        { skill: 'Summon Flora', level: 4, why: 'หยุดที่ 4 เพื่อเรียก Parasite', cites: [['xpoke', '09:37'], ['xpoke', '09:43'], ['pbuild3']] },
        { skill: 'Call Homunculus', level: 1, cites: [['hoohoo', '02:24']] },
        { skill: 'Homunculus Resurrection', level: 'ไม่ระบุ', cites: [['hoohoo', '02:24']] },
        { skill: 'Aid Potion', level: 'ตามชอบ', why: 'ปายาฮีล Homunculus ให้มันแทงค์', cites: [['zixma', '03:08'], ['hoohoo', '02:13']] },
      ],
      skillNotes: [
        { text: 'ยังไม่มีคลิปบอกเลเวลสกิลฝั่ง Homunculus ละเอียด', cites: [['xpoke', '08:45']] },
      ],
      plan: {
        picks: {
          alchemist: { 'Summon Flora': 4, 'Call Homunculus': 1 },
        },
        basis: { text: 'เฉพาะสกิลที่คลิปบอกเลเวล ส่วนแต้มที่เหลือเลือกตามสาย Acid Bomb ด้านบนได้', cites: [['xpoke', '09:37'], ['hoohoo', '02:24']] },
      },
      gear: [
        { slot: 'วัตถุดิบ Embryo', text: 'คราฟต์ด้วย Prepare Potion: Potion Creation Guide (ซื้อครั้งเดียว ไม่หาย) Yggdrasil Dew, Glass Tube, Seed of Life อย่างละ 1 และ Medicine Bowl (คลิปเรียก Mortar Bowl) ส่วนใหญ่ซื้อจาก NPC ได้ หรือซื้อ Embryo จากตลาดเลย', items: [7142, 7144, 25405, 7143, 7140, 7134], cites: [['xpoke', '05:58'], ['xpoke', '06:08'], ['xpoke', '06:15'], ['xpoke', '06:24'], ['xpoke', '06:29']] },
        { slot: 'Plant Bottle', text: 'ไม่มีขายที่ NPC ต้องคราฟต์เอง: Maneater Blossom (ดรอปจาก Flora) กับ Empty Bottle และ Medicine Bowl', items: [7137, 1032, 713, 7134], cites: [['xpoke', '09:13'], ['xpoke', '09:21'], ['xpoke', '09:29']] },
        { slot: 'ผ้าคลุม', text: 'Subjugation Team\'s Shoulder Belt ตีบวก 9 (ฟุตเทจ Zero ไต้หวัน ชื่อในฐานข้อมูลที่ใกล้สุด)', items: [20867], cites: [['ryan', '02:57']] },
        { slot: 'แหวน', text: 'Subjugation Team\'s Ring จาก instance ช่วงต้น และ Taming Ring (ฟุตเทจ Zero ไต้หวัน)', items: [28539, 24966], cites: [['ryan', '02:59'], ['ryan', '04:25']] },
        { slot: 'อาวุธ', text: 'Ring Pommel Saber ที่ activate แล้ว ให้ ATK, HP และ HIT การ์ดอาจเป็น Hydra Card ผู้รีวิวเดาเอา (ฟุตเทจ Zero ไต้หวัน)', items: [4035], cites: [['ryan', '03:09'], ['ryan', '04:09']] },
        { slot: 'รองเท้า', text: 'ออปชั่น Max HP กับ FLEE (ฟุตเทจ Zero ไต้หวัน)', cites: [['ryan', '03:28']] },
      ],
      play: [
        { text: 'Homunculus ที่ได้เป็นแบบสุ่ม ต้องทำ Embryo หลายลูก Xiendong อยากได้ Vanilmirth เพราะเห็นผู้เล่นไต้หวันใช้บ่อยในดันเจี้ยน แต่เขาเองยังไม่ยืนยันว่าดีที่สุด', cites: [['xpoke', '07:29'], ['xpoke', '07:41'], ['xpoke', '07:52']] },
        { text: 'ฮีล Homunculus ด้วยการปายาเหลืองใส่', cites: [['xpoke', '09:59']] },
        { text: 'ชุบ Homunculus ได้ภายใน 30 นาที ใช้ Seed of Life ซับตรงนี้ไม่ชัด', cites: [['zixma', '07:56']] },
      ],
      maps: [
        { text: 'ฟุตเทจ Zero ไต้หวัน: Alchemist Lv 63 กับ Vanilmirth Lv 66 ยิงรัวเหมือนปืนกลทั้งที่ Homunculus ยังไม่มี SP ใช้สกิล', cites: [['ryan', '01:22'], ['ryan', '01:37'], ['ryan', '02:07']] },
        { text: 'ฟุตเทจ Zero ไต้หวัน: Alchemist Lv 80 ลง Orc Dungeon instance คนเดียว HP ราว 10,000 Homunculus ตีได้ราว 5,000 ต่อลูก', cites: [['ryan', '02:45'], ['ryan', '04:31'], ['ryan', '04:48']] },
      ],
      cautions: [
        { text: 'Xiendong ยังไม่ได้ทดสอบ Homunculus ใน Memorial Dungeon จริง', cites: [['xpoke', '08:45']] },
        { text: 'สกิลทำลายหรือป้องกันอุปกรณ์เหมาะกับ PvP และ Guild War มากกว่า คลิปยังไม่ได้ทดสอบ', cites: [['xpoke', '10:17']] },
      ],
    },
    {
      id: 'acid-terror',
      name: 'ตัวพาเก็บเลเวลด้วย Acid Terror',
      tag: 'ตัวเสริม',
      pickIf: 'มีตัว Alchemist ไว้พาตัวอื่นเก็บเลเวล และอยากประหยัดค่าขวด',
      idea: {
        text: 'Xiendong ใช้ Alchemist ตัวฟาร์มพาตัวอื่นที่ Hode โดยใช้ Acid Terror แทน Acid Bomb เพราะ Acid Bomb แพงกว่ามาก และอยู่แมพนี้จนตัวที่พาถึง Lv 50',
        cites: [['road', '04:08'], ['road', '04:14'], ['road', '04:24']],
      },
      skills: [
        { skill: 'Acid Terror', level: 5, why: 'Lv 5 แรง 1,000% ใช้ 15 SP ร่าย 1,000 ms ใช้ Acid Bottle 1 ขวด ต้องมี Prepare Potion 5 ก่อน', cites: [['pacidterror'], ['road', '04:14']] },
      ],
      skillNotes: [
        { text: 'คลิปไม่ได้บอกเลเวลสกิลอื่นและสเตตัส', cites: [['road', '04:14']] },
      ],
      gear: [
        { slot: 'อาวุธ', text: 'Hode เป็นมอนขนาดกลางธาตุดิน Xiendong จึงใช้ดาบมือเดียวและเปลี่ยนเป็นธาตุไฟ พอย้ายแมพก็เปลี่ยนการ์ดให้ตรงกับมอนในแมพใหม่', cites: [['xpoke', '03:52'], ['xpoke', '04:02'], ['xpoke', '04:56']] },
      ],
      maps: [
        { text: 'Hode ที่ Sograt Desert ใช้พาตัวที่ยังเข้า Nordfeld Cave 2F ไม่ได้ให้ถึง Lv 50 ปาร์ตี้แชร์ EXP ได้ถ้าเลเวลห่างกันไม่เกิน 15', cites: [['xpoke', '04:29'], ['road', '02:07'], ['road', '02:26']] },
      ],
    },
    {
      id: 'hybrid',
      name: 'Alchi Hybrid (AGI)',
      pickIf: 'อยากลองบิลด์ AGI ที่มีทั้ง Acid Bomb และ Summon Flora',
      idea: {
        text: 'มีแค่บิลด์เดียวบนเว็บของผู้เล่น Baaldrock ไม่มีคำอธิบาย ไม่มีของสวมใส่ ไม่มีแมพ',
        cites: [['pbuild3']],
      },
      stats: [
        { who: 'Baaldrock (บิลด์บนเว็บ)', str: '40', agi: '56', vit: '1', int: '1', dex: '20', luk: '1', cites: [['pbuild3']] },
      ],
      skills: [
        { skill: 'Potion Research', level: 10, cites: [['pbuild3']] },
        { skill: 'Prepare Potion', level: 10, cites: [['pbuild3']] },
        { skill: 'Aid Potion', level: 1, cites: [['pbuild3']] },
        { skill: 'Bomb', level: 5, cites: [['pbuild3']] },
        { skill: 'Acid Terror', level: 5, cites: [['pbuild3']] },
        { skill: 'Summon Flora', level: 4, cites: [['pbuild3']] },
        { skill: 'Call Homunculus', level: 1, cites: [['pbuild3']] },
        { skill: 'Acid Bomb', level: 10, cites: [['pbuild3']] },
        { skill: 'Homunculus Resurrection', level: 5, cites: [['pbuild3']] },
      ],
      skillNotes: [
        { text: 'ช่วง Merchant บิลด์นี้ลง Axe Mastery 10, Vending 10 และ Discount 10 แต่ Pushcart แค่ 5 กับ Overcharge 3 (Basic Skill 9 เป็นของ Novice ไม่นับ)', cites: [['pbuild3']] },
      ],
      plan: {
        picks: {
          merchant: {
            'Enlarge Weight Limit': 10, 'Axe Mastery': 10, 'Crazy Uproar': 1, Discount: 10, Pushcart: 5,
            'Change Cart': 1, Overcharge: 3, Vending: 10, 'Cart Revolution': 1, 'Cart Boost': 1,
          },
          alchemist: {
            'Potion Research': 10, Bioethics: 1, 'Prepare Potion': 10, Vaporize: 1, 'Aid Potion': 1, Bomb: 5,
            'Acid Terror': 5, 'Summon Flora': 4, 'Call Homunculus': 1, 'Acid Bomb': 10, 'Homunculus Resurrection': 5,
          },
        },
        basis: { text: 'สกิลตามบิลด์ Alchi Hybrid ของ Baaldrock ทั้งช่วง Merchant และ Alchemist', cites: [['pbuild3']] },
      },
    },
  ],
  gaps: [
    'ไม่มีคลิปไหนพูดตัวเลขสเตตัส ตัวเลขที่มีมาจากบิลด์บนเว็บ',
    'Acid Bomb แรงตาม INT/VIT แค่ไหนใน Zero แหล่งข้อมูลยังขัดกัน',
    'Axe Mastery ได้ผลกับดาบหรือไม่ คลิปกับฐานข้อมูลขัดกัน',
    'สาย Homunculus ยังไม่มีเลเวลสกิลและสเตตัส ข้อมูลผลลัพธ์ส่วนใหญ่มาจากฟุตเทจ Zero ไต้หวัน และไม่มี Vanilmirth ในฐานข้อมูลเรา',
    'ยังไม่มีคลิปบอกแมพเก็บเลเวลหลัง Lv 60',
  ],
  sources: {
    zixma: { label: 'ZixmaOne', title: 'Alchemist Acid Demonstration Build – 1-Hit KO!', url: 'https://www.youtube.com/watch?v=GOjBmjDcxbg', kind: 'clip', lang: 'th' },
    hoohoo: { label: 'Hoo Hoo', title: '70K ACID BOMB?! HOW TO 1-HIT MOBS | ALCHEMIST BUILD GUIDE', url: 'https://www.youtube.com/watch?v=rQ6OgslruGA', kind: 'clip', lang: 'en' },
    xpoke: { label: 'Xiendong', title: 'This Class Has Its Own Pokémon?! | Alchemist', url: 'https://www.youtube.com/watch?v=8tw1gOEFxcA', kind: 'clip', lang: 'en' },
    road: { label: 'Xiendong', title: 'My Current 1–60 Levelling Roadmap for my New Characters', url: 'https://www.youtube.com/watch?v=7ymM15xvYAY', kind: 'clip', lang: 'en' },
    ryan: { label: 'Ryan Geldun', title: 'Alchemist build for Ragnarok Zero Global (ฟุตเทจ Zero ไต้หวัน)', url: 'https://www.youtube.com/watch?v=4398SVd-VN0', kind: 'clip', lang: 'en' },
    tako: { label: 'TakoyakiCh', title: 'จัด Tierlist Class2 ในโลก RO-Zero', url: 'https://www.youtube.com/watch?v=Y7MKIY0KiYo', kind: 'clip', lang: 'th' },
    xdemi: { label: 'Xiendong', title: 'I Tried Building My Merchant Around Demi-Human Affixes and Cards', url: 'https://www.youtube.com/watch?v=me-Q_z1ExSM', kind: 'clip', lang: 'en' },
    meta: { label: 'Xiendong', title: 'Why Taiwan Players Build These Stats', url: 'https://www.youtube.com/watch?v=T5bjOqQomUc', kind: 'clip', lang: 'en' },
    nottwice: { label: 'NotTwice', title: 'Guide เก็บเลเวลพ่อค้า 1-50', url: 'https://www.youtube.com/watch?v=3vv3ikWgOgU', kind: 'clip', lang: 'th' },
    ncz: { label: 'NCZ', title: 'Recommended Leveling Maps Lv. 1-50', url: 'https://www.youtube.com/watch?v=IScycVE-tf8', kind: 'clip', lang: 'th' },
    shank: { label: 'แชงค์888', title: 'How to Free Reset Skills and Stats Before Level 40', url: 'https://www.youtube.com/watch?v=lRGGsRGUKYY', kind: 'clip', lang: 'th' },
    pjob: { label: 'roz.prontera.info', title: 'Alchemist skills', url: 'https://roz.prontera.info/jobs/alchemist', kind: 'web' },
    pacidbomb: { label: 'roz.prontera.info', title: 'Acid Bomb', url: 'https://roz.prontera.info/skills/acid-bomb', kind: 'web' },
    pacidterror: { label: 'roz.prontera.info', title: 'Acid Terror', url: 'https://roz.prontera.info/skills/acid-terror', kind: 'web' },
    pbuild: { label: 'roz.prontera.info', title: 'Bomber Alche (aLiSTs)', url: 'https://roz.prontera.info/builds/4e87429f-a7e5-49a2-8f73-9ef872882869', kind: 'web' },
    pbuild2: { label: 'roz.prontera.info', title: 'Bomber Alche (MrRegenbogen)', url: 'https://roz.prontera.info/builds/26358502-4166-486d-b97a-175175ae1b69', kind: 'web' },
    pbuild3: { label: 'roz.prontera.info', title: 'Alchi Hybrid (Baaldrock)', url: 'https://roz.prontera.info/builds/d82795f7-cd6e-47a9-b7f5-cdd4da2cbcce', kind: 'web' },
    owner: { label: 'ยืนยันในเกม', title: 'เจ้าของเว็บตรวจในเกม 22 ก.ย. 2026', url: '', kind: 'web' },
  },
};
