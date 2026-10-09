// Crusader guide. Drafted 22 Sep 2026 from Downloads/roz-job-guides/crusader.md
// and swordman.md (levelling route to Lv 50), which cite every line to a clip
// timestamp or a web page. RO Zero Crusader material is thin: only one clip
// teaches a build, so the other builds carry the skill's web data and say
// plainly that no Zero guide exists yet. Classic RO clips were left out.
import type { ClassGuide } from './types';

export const crusader: ClassGuide = {
  slug: 'crusader',
  job: 'Crusader',
  jobTh: 'ครูเซเดอร์',
  from: 'Swordman',
  gathered: '9 ต.ค. 2026',
  summary:
    'อาชีพสองของ Swordman สายถึกถือโล่ ท่าหลักที่มีคนสอนใน Zero คือ Rapid Smiting ที่แรงตามโล่ ถึกพอเปิดบอทได้ไม่เปลืองยา ข้อมูลสายอื่นยังมีน้อยมาก',
  facts: [
    { text: 'เปลี่ยนเป็น Crusader ได้ที่ Base Lv 50', cites: [['owner'], ['kamon', '00:46']] },
    { text: 'Swordman Job ตันที่ 50 ได้แต้มสกิล 49 แต้ม · Crusader Job ตันที่ 70 ได้ 69 แต้ม', cites: [['owner'], ['planner']] },
    {
      text: 'Rapid Smiting, Cannon Spear, Holy Cross, Grand Cross อยู่ในผังสกิล Crusader เลย ได้ตั้งแต่เปลี่ยนอาชีพ ส่วน Paladin ยังไม่เปิด',
      cites: [['owner'], ['pJob']],
    },
  ],
  path: ['swordsman', 'crusader'],
  equipJob: 'Crusader',
  route: [
    { range: '1-9', text: 'ทำเควสเนื้อเรื่องช่วงต้นไปก่อน พอเลเวล 9 ให้วาร์ปไป Payon', cites: [['ncz', '01:51'], ['ncz', '02:05']] },
    { range: '9-15', text: 'แมพเห็ดแดงข้าง Payon (เลี้ยวขวาออกจากเมือง) มอนเลือดน้อย ตั้งบอทตีได้เลย', maps: ['pay_fild08'], monsters: [1014], cites: [['ncz', '02:40'], ['ncz', '03:15']] },
    { range: '15-20', text: 'Prontera Sewer ชั้น 2 ตั้งบอทตีได้ทุกตัว', maps: ['prt_sewb2'], monsters: [1051], cites: [['ncz', '04:19'], ['ncz', '04:51']] },
    { range: '20-30', text: 'Creamy กับ Smokie แถว Geffen ลุ้น Creamy Card กับเสื้อ แมพยอดฮิต คนเยอะให้ย้าย channel', maps: ['gef_fild05'], monsters: [1018, 1056], cites: [['ncz', '04:59'], ['ncz', '05:43'], ['ncz', '06:22']] },
    { range: '1-30', text: 'หรือแบบ Xiendong: ปล่อยบอทตี Poison Spore ตั้งแต่ต้นจนถึงราว Lv 30 บางทีถึง 35 (คลิปไม่ได้บอกชื่อแมพ)', monsters: [1077], cites: [['xroad', '01:12']] },
    { range: '30-35', text: 'Coco ที่ Geffen Field ดรอปรองเท้าแดงกับ Hood ช่วงนี้เลเวลขึ้นช้าที่สุด', maps: ['gef_fild02'], monsters: [1104], cites: [['ncz', '06:48'], ['xroad', '01:32'], ['xroad', '01:44']] },
    { range: '30-40', text: 'Ant Hell ตีได้ทุกตัว ได้ลุ้นการ์ดมดราคาดี', maps: ['anthell02'], monsters: [1095], cites: [['ncz', '09:30'], ['ncz', '09:46']] },
    { range: '~40', text: 'แมพที่สองทางตะวันออกของ Payon มี Horn กับ Elder Willow คนน้อย EXP ใกล้ Coco ตัว Lv 40 เปิดบอทข้ามคืนได้ราว 2 เลเวล และลุ้นหอก Guisarme กับ Partizan', maps: ['pay_fild09'], monsters: [1128, 1033], cites: [['ryanFarm', '00:09'], ['ryanFarm', '00:30'], ['ryanFarm', '00:36']] },
    { range: '35-50', text: 'ถ้ามีตัว Lv 50 ให้ปาร์ตี้พาเก็บที่ Hode ในทะเลทราย Sograt ปาร์ตี้แชร์ EXP ได้เมื่อเลเวลห่างไม่เกิน 15', maps: ['moc_fild17'], monsters: [1127], cites: [['xroad', '02:07'], ['xroad', '02:26']] },
    { range: '40-50', text: 'Orc Village (EXP เยอะ) หรือ Steel Chonchon ที่ Sograt Desert หรือแมพปลากระดูกแถว Comodo (ชื่อมอนฟังจากซับอัตโนมัติไม่ชัด)', maps: ['gef_fild10', 'moc_fild13'], monsters: [1023, 1042], cites: [['ncz', '11:02'], ['ncz', '11:50'], ['ncz', '12:52'], ['ncz', '13:38']] },
    { range: '50', text: 'เปลี่ยนเป็น Crusader', cites: [['owner'], ['kamon', '02:11']] },
    { range: '50-60', text: 'หลังเปลี่ยนอาชีพสอง Xiendong เก็บเลเวลที่ Nordfeld Cave 2F จนถึง Lv 60', maps: ['nrd_dun02'], cites: [['xroad', '06:12'], ['xroad', '06:21']] },
  ],
  routeNotes: [
    { text: 'รีเซ็ตสเตตัสและสกิลฟรีจนถึง Lv 40 หลังจากนั้นต้องเสียเงินจริง ถ้าจะลงสาย Crusader ให้รีเซ็ตให้ตรงสายก่อนถึง 40', cites: [['xroad', '02:39'], ['meta', '06:26']] },
    { text: 'ช่วงแรกลง DEX ราว 20 ก่อนเพื่อให้ตีโดน แล้วค่อยรีเซ็ตฟรีก่อน Lv 40', cites: [['meta', '06:13']] },
    { text: 'วาร์ป Kafra ฟรีถ้าเลเวลต่ำกว่า 40 เกินแล้วเสียราว 120 zeny', cites: [['ncz', '02:15']] },
    { text: 'EXP ไม่ลดตามส่วนต่างเลเวลกับมอน แต่อัตราดรอปถูกหักถ้าเลเวลห่างเกินราว 19', cites: [['ncz', '10:01'], ['ncz', '10:14']] },
  ],
  gearByLevel: [
    { range: 'ทั้งทาง', slot: 'ออปชั่น', text: 'ช่วงต้นเซิร์ฟเก็บออปชั่น Max HP กับ FLEE ก่อน ถ้าได้ FLEE ราว 15 ขึ้นไปทุกชิ้นเกราะ ทำ FLEE 250-300 ได้เร็ว', cites: [['meta', '03:31'], ['meta', '05:50']] },
    { range: '20-30', slot: 'ประดับ', text: 'Creamy Card ดรอปจาก Creamy ที่แมพแถว Geffen', items: [4040], cites: [['ncz', '05:17'], ['ncz', '06:22']] },
    { range: '30-35', slot: 'ผ้าคลุม / รองเท้า', text: 'Hood กับรองเท้าแดงจาก Coco', items: [480414], cites: [['ncz', '06:51']] },
    { range: '~40', slot: 'อาวุธ', text: 'หอก Guisarme กับ Partizan ดรอปที่แมพ Horn และ Elder Willow ตะวันออกของ Payon', cites: [['ryanFarm', '00:36']] },
    { range: 'หลังอัปเดตพีระมิด', slot: 'รองเท้า', text: 'Matyr Card หรือ Verit Card (Verit ได้ HP น้อยกว่าแต่ได้ SP ด้วย)', items: [4097, 4107], cites: [['farm', '00:22'], ['farm', '01:08']] },
  ],
  strengths: [
    { text: 'Rapid Smiting แรงมาก Lv 5 คูณ ATK 2600% และแรงขึ้นอีกตามค่าตีบวก น้ำหนักโล่ และ Base Level', cites: [['tako', '03:37'], ['pRapid']] },
    { text: 'ถึก ตั้งบอทแล้วไม่ต้องกินยาเยอะ มี Spear Quicken สกิลฟื้น HP และ Heal', cites: [['tako', '04:01'], ['tako', '04:14']] },
    { text: 'TakoyakiCh จัดไว้เทียร์สูงสำหรับการบอท (ซับอัตโนมัติจับเป็น "TS" น่าจะหมายถึงเทียร์ S · ประเมินก่อนอาชีพสองเปิด)', cites: [['tako', '04:31']] },
  ],
  weaknesses: [
    { text: 'Rapid Smiting ตีทีละตัว', cites: [['tako', '03:59']] },
    { text: 'สาย Rapid Smiting ใช้สกิลตลอด ต้องดูแล SP ให้ดี', cites: [['hoo', '00:38'], ['hoo', '00:57']] },
    { text: 'ถ้าตั้งให้บอทฮีลเอง SP อาจไม่พอ', cites: [['tako', '04:24']] },
    { text: 'Cannon Spear คริคิดแค่ครึ่งเดียว TakoyakiCh มองว่าไม่น่าแรง', cites: [['tako', '03:03'], ['pCannon']] },
  ],
  builds: [
    {
      id: 'rapid-smiting',
      name: 'สายโล่ Rapid Smiting (STR/DEX/INT)',
      tag: 'สายหลัก',
      pickIf: 'อยากเปิดบอทเก็บเลเวลถึง 60 ด้วยท่าที่แรงที่สุดตอนนี้',
      idea: {
        text: 'ใช้ Rapid Smiting เป็นดาเมจหลัก ดาเมจขึ้นกับน้ำหนักและค่าตีบวกของโล่ ยิ่งโล่หนักและบวกสูงยิ่งแรง',
        cites: [['hoo', '01:46'], ['tako', '03:50'], ['pRapid']],
      },
      stats: [
        {
          who: 'ZixmaOne (สายดันเจี้ยน หลบ)',
          str: '50',
          agi: '66',
          vit: '11',
          int: '10',
          dex: '37',
          luk: '1',
          note: 'Ryan Geldun อ่านจากหน้าสเตตัสในคลิปของ ZixmaOne ไม่ได้บอกเลเวล · HP 6,700 SP 746 HIT 306 FLEE 330',
          cites: [['ryanZixma', '02:06'], ['ryanZixma', '04:15'], ['ryanZixma', '04:30'], ['ryanZixma', '05:15'], ['ryanZixma', '05:44']],
        },
        { who: 'Hoo Hoo (ใกล้ Lv 60)', str: 'หลัก', dex: 'หลัก', int: 'หลัก', vit: 'ยังไม่ลง', note: 'คลิปไม่ได้บอกตัวเลข · จะเริ่มลง VIT เมื่อแต้มเยอะขึ้น', cites: [['hoo', '02:02'], ['hoo', '02:42'], ['hoo', '02:58']] },
        {
          who: 'Hoo Hoo ไลฟ์ (Lv 50-51 รีสเตตัส)',
          str: '69-70',
          dex: '30',
          note: 'เลเวลต่อไปจะลง INT ทั้งหมด · ได้ HIT 299 ตอนบัฟครบ · ฟังจากซับอัตโนมัติภาษาตากาล็อก ตัวเลขอาจเพี้ยน',
          cites: [['hooLive', '1:04:48'], ['hooLive', '1:04:54'], ['hooLive', '1:10:07'], ['hooLive2', '2:23:34']],
        },
      ],
      statNotes: [
        { text: 'STR เพิ่ม ATK ดิบ เป็นดาเมจหลัก · DEX เพิ่ม HIT และลดเวลาร่ายนิดหน่อย · INT เพื่อ SP ให้กด Rapid Smiting ได้ต่อเนื่อง', cites: [['hoo', '02:08'], ['hoo', '02:23'], ['hoo', '02:33']] },
        { text: 'ใน Zero คนเรียกสกิลนี้ว่า Shield Chain ด้วย คลิปที่พูดถึง Shield Chain ใช้กับสายนี้ได้', cites: [['zixmaSC', '00:52'], ['ryanZixma', '01:03']] },
        { text: 'ZixmaOne ลง AGI เยอะไว้หลบตอนลงดันเจี้ยน ถ้าไป WoE ให้ลด AGI ไปลง VIT · ในดันเจี้ยนอาจต้องมี DEX ถึงราว 50 เพราะยังตีวืดไข่บอสกับลูกน้อง', cites: [['zixmaSC', '01:17'], ['zixmaSC', '01:27'], ['zixmaSC', '01:55']] },
        { text: 'Richmore แบ่งแบบนี้: STR หลัก DEX พอให้ตีโดนและร่ายเร็วขึ้น ที่เหลือ VIT · โซโล GTB Memorial ตีได้ราว 29,000', cites: [['richSC', '00:44'], ['richSC', '01:10']] },
        { text: 'WoE หรือ PvP: Xiendong อยากได้ HIT อย่างน้อย 350 (ดีสุด 350-450) เพราะหลายคน FLEE 300-400 แล้ว', cites: [['xienSader', '05:03'], ['xienSader', '05:15'], ['xienSader', '05:45']] },
      ],
      skills: [
        { skill: 'Rapid Smiting', level: 5, why: 'เอาเต็มก่อน เป็นดาเมจหลัก ต้องผ่าน Shield Boomerang 5', cites: [['hoo', '03:28'], ['pRapid']] },
        { skill: 'Faith', level: 10, why: 'HP เพิ่ม ช่วยให้รอดตอนเจอมอนแรง', cites: [['hoo', '03:32']] },
        { skill: 'Guard', level: 10, why: 'Lv 10 กันได้ราว 30% ต้องใส่โล่', cites: [['hoo', '03:45'], ['pGuard']] },
      ],
      skillNotes: [
        { text: 'สกิล Swordman คลิปขึ้นบนจอให้กดหยุดดู ไม่ได้พูดออกมา จึงยังไม่มีข้อมูล', cites: [['hoo', '03:12']] },
      ],
      plan: {
        picks: {
          crusader: { 'Rapid Smiting': 5, Faith: 10, Guard: 10 },
        },
        basis: { text: 'เฉพาะสกิล Crusader ที่ Hoo Hoo บอกในคลิป สกิลที่ต้องผ่านทางระบบเติมให้เอง ส่วนสกิล Swordman คลิปไม่ได้พูด', cites: [['hoo', '03:21'], ['hoo', '03:12']] },
        leftover: { text: 'แต้มที่เหลือ: คนทำคลิปเองก็ยังไม่ได้ใช้ ยังเลือกอยู่ว่าอะไรคุ้มที่สุด', cites: [['hoo', '03:57']] },
      },
      gear: [
        { slot: 'หมวก', text: 'หมวก Nordfeld ออปชั่น ATK +30 (คลิปไม่ได้บอกว่ารุ่น Platinum หรือ Onyx) ใส่ Gem Poring Card เพิ่มดาเมจ', items: [300938], cites: [['hoo', '00:21'], ['hoo', '00:26']] },
        { slot: 'เสื้อ', text: 'Nordfeld Soldier\'s Armor ออปชั่นฟื้น SP กับ Max SP ใส่ Roda Frog Card (HP และ SP)', items: [450588, 4014], cites: [['hoo', '00:30'], ['hoo', '00:43']] },
        { slot: 'รองเท้า', text: 'Archeologist\'s Shoes เพื่อฟื้น SP', items: [470465], cites: [['hoo', '00:50']] },
        { slot: 'ผ้าคลุม', text: 'Hood ออปชั่น FLEE หรือผ้าคลุมอะไรก็ได้ที่ FLEE ดี ใส่ Baby Shark Card เพิ่มพลังโจมตี', items: [480414, 300834], cites: [['hoo', '01:04'], ['hoo', '01:11']] },
        { slot: 'ประดับ', text: 'ใช้ของที่มีไปก่อน วางแผนเปลี่ยนเป็น Subjugation Team\'s Ring', items: [28539], cites: [['hoo', '01:16'], ['hoo', '01:23']] },
        { slot: 'อาวุธ', text: 'Saber ใส่ Hydra Card 2 ใบ ตี Demi-Human แรงขึ้น เข้ากับแมพที่คลิปเก็บเลเวล', items: [500090, 4035], cites: [['hoo', '01:29']] },
        { slot: 'โล่', text: 'Hoo Hoo แนะนำตีบวก +9 ขึ้นไป ยิ่งหนักยิ่งแรง แต่คนอื่นลองแล้วต่างกันน้อย: ZixmaOne โล่ +0 กับ +7 ดาเมจแทบเท่ากัน โล่หนัก 30 ได้ราว 18k หนัก 130 ได้ 18-19k · Hoo Hoo เองในไลฟ์ +9 กับ +0 ต่างแค่ราว 200', cites: [['hoo', '01:41'], ['zixmaSC', '07:20'], ['zixmaSC', '08:22'], ['xienSader', '03:02'], ['hooLive', '1:01:23']] },
        { slot: 'อาวุธ (ขนาดมอน)', text: 'Rapid Smiting โดนโทษขนาดอาวุธ: ดาบตีมอนเล็ก/กลาง/ใหญ่ 75/100/75% มีดตี 100/75/50% · ธาตุอาวุธและการ์ดตีเผ่า ธาตุ ระยะไกล มีผลด้วย', cites: [['zixmaSC', '04:33'], ['zixmaSC', '05:35'], ['zixmaSC', '06:35']] },
      ],
      maps: [
        { text: 'คลิปเก็บเลเวลที่แมพที่มีมอน Demi-Human แต่ไม่ได้บอกชื่อแมพ', cites: [['hoo', '01:34']] },
      ],
      cautions: [
        { text: 'คนทำคลิปบอกเองว่ายังทดสอบบิลด์นี้อยู่ และขอคำแนะนำจากคนเล่น Crusader', cites: [['hoo', '04:18'], ['hoo', '04:28']] },
      ],
    },
    {
      id: 'crit-test',
      name: 'สายคริถือหอก (บิลด์ทดลอง)',
      pickIf: 'อยากลองสายคริ ใช้เป็นตัวอย่างการแบ่งสเตตัสกับของ',
      idea: {
        text: 'บิลด์ที่ผู้เล่นลงไว้บนเว็บ ชื่อ "Test Crit" ลง STR, AGI, LUK ใช้หอก Trident ใส่ Soldier Skeleton Card 3 ใบ ไม่มีคำอธิบายหรือสกิล',
        cites: [['belmee']],
      },
      stats: [
        { who: 'BELMEE (บิลด์บนเว็บ)', str: '54', agi: '50', vit: '1', int: '1', dex: '1', luk: '41', note: 'ไม่ได้บอกเลเวลตัวละคร', cites: [['belmee']] },
      ],
      gear: [
        { slot: 'อาวุธ', text: 'Trident (3 ช่อง) ใส่ Soldier Skeleton Card 3 ใบ', items: [4086], cites: [['belmee']] },
        { slot: 'หมวก', text: 'Hair Brush · หัวล่าง Poring Village Green Onion', items: [5444, 19238], cites: [['belmee']] },
        { slot: 'เสื้อ', text: 'Nordfeld Soldier\'s Armor +9', items: [450588], cites: [['belmee']] },
        { slot: 'รองเท้า', text: 'Hill Patrol Boots +7 ใส่ Sohee Card', items: [470466, 4100], cites: [['belmee']] },
        { slot: 'ผ้าคลุม', text: 'Muffler ใส่ Baby Shark Card', items: [300834], cites: [['belmee']] },
        { slot: 'ประดับ', text: 'Clip ใส่ Creamy Card กับ Subjugation Team\'s Ring', items: [2607, 4040, 28539], cites: [['belmee']] },
      ],
      cautions: [
        { text: 'ชื่อบิลด์บอกว่าเป็นการทดสอบ ไม่มีสกิล ออปชั่นสุ่ม หรือผลลัพธ์ให้ดู', cites: [['belmee']] },
      ],
    },
    {
      id: 'holy-cross',
      name: 'สาย Holy Cross',
      pickIf: 'อยากตีธาตุ Holy ใส่ Undead กับ Demon',
      idea: {
        text: 'Holy Cross ธาตุ Holy ไม่มีร่าย ไม่มีคูลดาวน์ ถ้าใช้หอกดาเมจเป็นสองเท่า และแรงขึ้นตาม VIT ต้องผ่าน Demon Bane',
        cites: [['pHoly']],
      },
      missing: 'คลิป Zero ของสายนี้ไม่มีคำบรรยายให้ดึง ยังไม่มีข้อมูลสเตตัส สกิล หรือของใน Zero',
    },
    {
      id: 'grand-cross',
      name: 'สาย Grand Cross',
      pickIf: 'อยากตีมอนรอบตัวเป็นกลุ่ม',
      idea: {
        text: 'Grand Cross ตีธาตุ Holy เป็นรูปกากบาทรอบตัว คิดทั้ง ATK และ MATK แต่เสีย HP 20% ทุกครั้ง ต้องผ่าน Holy Cross 6 และ Faith 10',
        cites: [['pGrand']],
      },
      missing: 'คลิป Grand Cross ที่เจอเป็นเซิร์ฟ Pre-Renewal และมีแต่เพลง ยังไม่มีข้อมูลสเตตัส สกิล หรือของใน Zero',
    },
    {
      id: 'cannon-spear',
      name: 'สายหอก Cannon Spear',
      pickIf: 'อยากใช้หอกตีเป็นพื้นที่',
      idea: {
        text: 'Cannon Spear ตีเป็นพื้นที่ แรงขึ้นตาม STR ต้องใช้หอกและผ่าน Spear Quicken 10 คริคิดแค่ครึ่งเดียว TakoyakiCh มองว่าไม่น่าแรงเท่า Rapid Smiting (ประเมินก่อนอาชีพสองเปิด)',
        cites: [['pCannon'], ['tako', '03:03'], ['tako', '03:43']],
      },
      cautions: [
        { text: 'Zatoshi ลองสาย Cannon Spear ได้แค่ราว 2,000-3,000 ต่อฮิต ขณะที่ Shield Chain เดิมตีได้ราว 8,600 สุดท้ายรีสเตตัสกลับไปสายโล่ (ซับไทยอัตโนมัติ)', cites: [['zatoshi', '03:21'], ['zatoshi', '04:14'], ['zatoshi', '05:02']] },
      ],
      missing: 'ยังไม่มีคลิป Zero สอนสายนี้ ยังไม่มีข้อมูลสเตตัส สกิล หรือของ',
    },
  ],
  gaps: [
    'มีคลิป Zero ที่สอน Crusader จริงแค่คลิปเดียว (Hoo Hoo) และคลิปนั้นไม่บอกตัวเลขสเตตัส',
    'ยังไม่รู้ว่าสาย Rapid Smiting ควรอัพสกิล Swordman อะไร คลิปโชว์บนจอแต่ไม่ได้พูด',
    'สาย Holy Cross, Grand Cross, Cannon Spear และสายซัพพอร์ต (Sacrifice, Defending Aura) ยังไม่มีคลิป Zero ที่ถอดคำบรรยายได้',
    'ยังไม่รู้ชื่อแมพที่ Hoo Hoo ใช้เก็บเลเวล และแมพหลัง Lv 60',
  ],
  sources: {
    hoo: { label: 'Hoo Hoo', title: 'LEVEL 60 CRUSADER GUIDE! RAPID SMITING BUILD | STATS, SKILLS & GEAR', url: 'https://www.youtube.com/watch?v=4LBX4Up3rGc', kind: 'clip', lang: 'en' },
    tako: { label: 'TakoyakiCh', title: 'จัด Tierlist Class2 ในโลก RO-Zero', url: 'https://www.youtube.com/watch?v=Y7MKIY0KiYo', kind: 'clip', lang: 'th' },
    kamon: { label: 'KamonWay', title: 'How to Change to Class 2 for Every Job in 3 Minutes', url: 'https://www.youtube.com/watch?v=iTxVgyVGCbc', kind: 'clip', lang: 'th' },
    ncz: { label: 'NCZ', title: 'Recommended Leveling Maps Lv. 1-50', url: 'https://www.youtube.com/watch?v=IScycVE-tf8', kind: 'clip', lang: 'th' },
    xroad: { label: 'Xiendong', title: 'My Current 1–60 Levelling Roadmap for my New Characters', url: 'https://www.youtube.com/watch?v=7ymM15xvYAY', kind: 'clip', lang: 'en' },
    meta: { label: 'Xiendong', title: 'Why Taiwan Players Build These Stats', url: 'https://www.youtube.com/watch?v=T5bjOqQomUc', kind: 'clip', lang: 'en' },
    farm: { label: 'Xiendong', title: 'NEW Farming Spots, Cards & EXP Areas!', url: 'https://www.youtube.com/watch?v=y7ySJekxEAw', kind: 'clip', lang: 'en' },
    ryanFarm: { label: 'Ryan Geldun', title: 'Chill Zeny and Exp farming spot you FORGOT about', url: 'https://www.youtube.com/watch?v=oEPSeeOEGVk', kind: 'clip', lang: 'en' },
    pJob: { label: 'roz.prontera.info', title: 'Crusader', url: 'https://roz.prontera.info/jobs/crusader', kind: 'web' },
    pRapid: { label: 'roz.prontera.info', title: 'Rapid Smiting', url: 'https://roz.prontera.info/skills/rapid-smiting', kind: 'web' },
    pCannon: { label: 'roz.prontera.info', title: 'Cannon Spear', url: 'https://roz.prontera.info/skills/cannon-spear', kind: 'web' },
    pHoly: { label: 'roz.prontera.info', title: 'Holy Cross', url: 'https://roz.prontera.info/skills/holy-cross', kind: 'web' },
    pGrand: { label: 'roz.prontera.info', title: 'Grand Cross', url: 'https://roz.prontera.info/skills/grand-cross', kind: 'web' },
    pGuard: { label: 'roz.prontera.info', title: 'Guard', url: 'https://roz.prontera.info/skills/guard', kind: 'web' },
    belmee: { label: 'roz.prontera.info', title: 'บิลด์ Test Crit โดย BELMEE', url: 'https://roz.prontera.info/builds/2d4d38b0-5d56-4397-bf46-917d784539ee', kind: 'web' },
    ryanZixma: { label: 'Ryan Geldun', title: 'Shield Chain Crusader in Ragnarok Zero Global - by ZixmaOne', url: 'https://www.youtube.com/watch?v=U6s8iuCE0ks', kind: 'clip', lang: 'en' },
    zixmaSC: { label: 'ZixmaOne', title: 'Ragnarok Zero: Crusader Shield Chain Build Guide', url: 'https://www.youtube.com/watch?v=Xy0eqqerh-s', kind: 'clip', lang: 'th' },
    richSC: { label: 'Richmore Gaming', title: '29K SHIELD CHAIN! Crusader SOLO GTB Memorial', url: 'https://www.youtube.com/watch?v=lECtrCWXphQ', kind: 'clip', lang: 'en' },
    xienSader: { label: 'Xiendong', title: 'So, This Is What Crusader Can REALLY Do?', url: 'https://www.youtube.com/watch?v=QSrhfRD2cuo', kind: 'clip', lang: 'en' },
    hooLive: { label: 'Hoo Hoo', title: '[ROZ Global] BUILDING MY CRUSADER! LEVELING + SHIELD REFINE (ไลฟ์)', url: 'https://www.youtube.com/watch?v=1BOReJCRq4o', kind: 'clip', lang: 'en' },
    hooLive2: { label: 'Hoo Hoo', title: '[ROZ Global] BUILDING MY CRUSADER! (ไลฟ์ ตอน 2)', url: 'https://www.youtube.com/watch?v=1GzYgaidAwY', kind: 'clip', lang: 'en' },
    zatoshi: { label: 'Zatoshi', title: 'Ragnarok Zero: Global ไลฟ์ Cannon Spear', url: 'https://www.youtube.com/watch?v=o0AjhRlHDqc', kind: 'clip', lang: 'th' },
    planner: { label: 'rozeroplanner', title: 'RO Zero skill planner', url: 'https://rozeroplanner.com/', kind: 'web' },
    owner: { label: 'ยืนยันในเกม', title: 'เจ้าของเว็บตรวจในเกม 22 ก.ย. 2026', url: '', kind: 'web' },
  },
};
