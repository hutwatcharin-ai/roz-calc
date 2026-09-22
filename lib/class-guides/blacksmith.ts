// Blacksmith guide. Drafted 22 Sep 2026 from Downloads/roz-job-guides/blacksmith.md
// (and merchant.md for the road to Lv 50), which cite every line to a clip
// timestamp or a web page, and checked again against the transcripts in
// Downloads/yt-research/roz-jobs. Items, monsters and skills were checked
// against the site database. Two of Ryan Geldun's clips show footage recorded
// before Global opened (inferred Taiwan Zero); those builds say so on the page.
// The skill tree spells two Blacksmith skills with a trailing space
// ("Axe Mastery ", "Axe Tornado "); the names below follow the tree exactly.
import type { ClassGuide } from './types';

export const blacksmith: ClassGuide = {
  slug: 'blacksmith',
  job: 'Blacksmith',
  jobTh: 'แบล็คสมิธ',
  from: 'Merchant',
  gathered: '22 ก.ย. 2026',
  summary:
    'อาชีพสองสายกายภาพของ Merchant เล่นได้ทั้งตีธรรมดาสายคริ ลากมอนตีหมู่ด้วย Axe Tornado และปาขวานไกลด้วย Axe Boomerang มี Ore Discovery ไว้เปิดบอทหาแร่หาเงิน',
  facts: [
    { text: 'เปลี่ยนเป็น Blacksmith ได้ที่ Base Lv 50', cites: [['owner']] },
    { text: 'Job ตันที่ 70 ได้แต้มสกิล 69 แต้ม', cites: [['owner']] },
    {
      text: 'Axe Tornado, Axe Boomerang และ Shattering Strike อยู่ในผังสกิล Blacksmith เลย ได้ตั้งแต่เปลี่ยนอาชีพ ผู้เล่นใช้กันจริงบน Global แล้ว',
      cites: [['owner'], ['xaxe', '00:02'], ['ore', '00:22'], ['boom', '02:13']],
    },
    { text: 'Axe Tornado Lv 5 แรง 4,300% ATK ใช้ 45 SP ต้องถือขวาน ดาเมจเพิ่มตาม Base Lv กับ VIT', cites: [['pat'], ['xaxe', '00:17'], ['xaxe', '01:43']] },
  ],
  path: ['merchant', 'blacksmith'],
  equipJob: 'Blacksmith',
  route: [
    { range: '1-9', text: 'เดินเควสเนื้อเรื่องไปก่อน จะได้ราว Lv 7-9 แล้วตีมอนรอบแมพต่ออีกนิด', cites: [['ncz', '01:56'], ['nottwice', '00:08']] },
    { range: '9-15', text: 'Spore ที่ Payon Forest (คลิปเรียกแมพเห็ดแดง) มอนเลือดน้อย เปิดบอทได้', maps: ['pay_fild08'], monsters: [1014], cites: [['ncz', '02:40'], ['ncz', '03:15']] },
    { range: '10-20', text: 'Thief Bug ที่ Prontera Sewer 2F (NotTwice เรียกแมงสาบ) หา Jacket ออปชั่นเลือดกับหลบไปด้วย', maps: ['prt_sewb2'], monsters: [1051], cites: [['ncz', '04:24'], ['nottwice', '00:20']] },
    { range: '20-30', text: 'Creamy กับ Smokie ที่ Gypsy Village ใกล้ Geffen แมพยอดฮิต คนเยอะก็ย้าย channel', maps: ['gef_fild05'], monsters: [1018, 1056], cites: [['ncz', '04:59'], ['ncz', '06:26']] },
    { range: '20+', text: 'หรือ Coco หาผ้าคลุมกับรองเท้าออปชั่นเลือดกับหลบ สนแค่สองค่านี้', maps: ['gef_fild02'], monsters: [1104], cites: [['nottwice', '01:46']] },
    { range: '30-40', text: 'Coco ที่ Geffen Field (เลือดเยอะกว่า) หรือ Ant Hell (มดเลือดน้อยกว่า การ์ดมดขายได้ราคา)', maps: ['gef_fild02', 'anthell02'], monsters: [1104, 1095], cites: [['ncz', '06:48'], ['ncz', '07:06'], ['ncz', '09:44']] },
    { range: '30-35', text: 'Goblin ลากมาตีหมู่ ตีสลับกับมอนที่ดรอปดาบเพื่อหาดาบดีๆ 1-2 เล่ม (ชื่อมอนไม่ชัด)', maps: ['gef_fild11'], monsters: [1122], cites: [['nottwice', '03:52'], ['nottwice', '04:01']] },
    { range: '40-50', text: 'Orc Village EXP เยอะ อยู่ยาวถึง Lv 50 ได้ · หรือ Steel Chonchon ถ้าอยากได้ของดรอปไปขาย', maps: ['gef_fild10'], monsters: [1023, 1042], cites: [['ncz', '11:02'], ['ncz', '11:57'], ['ncz', '13:26'], ['xdemi', '04:36']] },
    { range: 'ทางเลือก', text: 'Horn กับ Elder Willow สองแมพทางตะวันออกของ Payon คนน้อย EXP ใกล้เคียง Coco ดรอป Guisarme กับ Partizan', maps: ['pay_fild09'], monsters: [1128, 1033], cites: [['ryanZeny', '00:01'], ['ryanZeny', '00:36']] },
    { range: '50', text: 'เปลี่ยนเป็น Blacksmith ได้ Axe Tornado กับ Axe Boomerang ทันที', cites: [['owner']] },
    { range: '50+', text: 'Nordfeld Cave 2F: Ryan Geldun เห็นคนใช้ Axe Tornado ทำดาเมจสูงมากที่แมพนี้ · Xiendong ลากมอนแถว Nordfeld (คลิปเรียก North Field)', maps: ['nrd_dun02'], monsters: [25327], cites: [['ore', '00:12'], ['xaxe', '01:21'], ['xaxe', '07:50']] },
  ],
  routeNotes: [
    { text: 'รีเซ็ตสเตตัสและสกิลฟรีได้ถ้ายังไม่เกิน Lv 40 NPC อยู่ในกำแพงเมือง Prontera หลัง 40 ต้องเสียเงิน', cites: [['shank', '00:04'], ['shank', '00:57'], ['road', '02:31']] },
    { text: 'ช่วงแรกลง DEX ราว 20 ให้ตีโดนก่อน แล้วค่อยรีเซ็ตฟรีก่อน Lv 40', cites: [['meta', '06:01']] },
    { text: 'ตอนเป็น Merchant ไม่ต้องลง DEX ก็ตี Cart Revolution โดน แต่พอเป็น Blacksmith แล้ว Axe Tornado ต้องใช้ HIT ต้องกลับมาลง DEX', cites: [['xaxe', '01:06'], ['xaxe', '01:12']] },
    { text: 'ฆ่า Orc ครบราว 30,000 ตัวได้ Achievement เป็นหมวก Orc Hero Headdress (STR +2)', cites: [['xdemi', '04:46']] },
  ],
  gearByLevel: [
    { range: 'ทั้งทาง', slot: 'ออปชั่น', text: 'ออปชั่นที่คุ้มช่วงต้นคือ Max HP กับ FLEE ถ้าได้ FLEE ราว 15 ขึ้นไปทุกชิ้นจะถึง FLEE 250-300 ได้เร็ว', cites: [['meta', '05:46'], ['meta', '03:31']] },
    { range: '10+', slot: 'เสื้อ', text: 'Jacket จาก Thief Bug ออปชั่นเลือดกับหลบ', cites: [['nottwice', '00:20']] },
    { range: 'ช่วงแรก', slot: 'อาวุธ', text: 'Hammer ใช้ยาวๆ ลาก Spore ตีหมู่ ขยะที่ได้พอค่ายา', cites: [['nottwice', '00:37'], ['nottwice', '00:48']] },
    { range: '20+', slot: 'ผ้าคลุม / รองเท้า', text: 'จาก Coco ออปชั่นเลือดกับหลบ', cites: [['nottwice', '01:46']] },
    { range: '30-35', slot: 'อาวุธ / โล่', text: 'ดาบที่ดรอปแถว Goblin ใส่การ์ดสำหรับตี Goblin 2 ใบ โล่ดรอปง่ายที่ Goblin ใส่การ์ด 1 ใบ ซื้อได้ราว 20k', cites: [['nottwice', '04:28'], ['nottwice', '04:41']] },
    { range: '40-50', slot: 'อาวุธ', text: 'ขวานที่ดรอปแถว Goblin หาออปชั่น ATK บรรทัดบนกับ FLEE (+20 ยิ่งดี) ใส่ Caramel Card 2 ใบ ราวใบละ 20-30k', items: [4063], cites: [['nottwice', '07:16'], ['nottwice', '07:34']] },
    { range: '50+', slot: 'อาวุธ', text: 'สาย Axe Tornado: ขวานสองมือดีที่สุดเท่าที่ Xiendong ลอง เช่น Buster', items: [620033], cites: [['xaxe', '00:55']] },
  ],
  strengths: [
    { text: 'Ore Discovery ทำให้ฆ่ามอนตัวไหนก็มีโอกาสน้อยๆ ได้แร่หายาก เช่น Emperium, Oridecon, Elunium, Gold เหมาะเป็นตัวบอทหาเงิน 24 ชม.', cites: [['ore', '00:56'], ['ore', '01:42']] },
    { text: 'แบกของได้เยอะและมีรถเข็น เปิดบอทแล้วแวะเช็คแค่ราวทุก 6 ชม.', cites: [['ore', '01:48']] },
    { text: 'Shattering Strike Lv 10 เพิ่มดาเมจ 1,000 กับทุกการโจมตี รวมตีธรรมดา และเพิ่มตาม LUK อีก อยู่ได้ 120 วินาที ไม่มีคูลดาวน์', cites: [['ore', '00:22'], ['pss']] },
    { text: 'Weapon Perfection ลบโทษขนาดอาวุธ ขวานตีมอนเล็กได้ใกล้เคียงมอนใหญ่', cites: [['xaxe', '05:54'], ['xaxe', '06:19']] },
    { text: 'TakoyakiCh จัดไว้เทียร์ SS (บอกว่าเผลอๆ 3S) เพราะมีบัฟเยอะและ Axe Tornado แรง ประเมินจากรายชื่อสกิลบน midgardhub ก่อนเซิร์ฟเปิด', cites: [['tako', '00:47'], ['tako', '14:14'], ['tako', '15:18']] },
  ],
  weaknesses: [
    { text: 'Axe Tornado กิน SP เยอะ ต้องซื้อยา SP ตลอด เป็นการเล่นที่ค่อนข้างแพง', cites: [['xaxe', '02:18']] },
    { text: 'Axe Tornado ต้องใช้ HIT สูง ต่างจาก Cart Revolution ตอนเป็น Merchant', cites: [['xaxe', '01:06']] },
    { text: 'Axe Tornado ติดคูลดาวน์ กดรัวไม่ได้ ต้องลากมอนมารวมก่อนค่อยกด', cites: [['xaxe', '03:13'], ['xaxe', '03:28']] },
    { text: 'สายคริที่เน้นตีธรรมดา จะได้ Axe Tornado อ่อน', cites: [['ore', '01:58']] },
  ],
  builds: [
    {
      id: 'axe-tornado',
      name: 'สาย Axe Tornado ลากมอนตีหมู่ (STR/DEX)',
      tag: 'สายหลัก',
      pickIf: 'ชอบเล่นมือ ลากมอนมารวมแล้วตีทีเดียว',
      idea: {
        text: 'ลากมอนมารวมกันแล้วกด Axe Tornado ทีเดียว ต่อยอดสไตล์ลากมอนตั้งแต่ตอนเป็น Merchant ไม่พึ่ง FLEE เพราะโดนรุมหลายตัว',
        cites: [['xaxe', '03:28'], ['xaxe', '04:00'], ['xaxe', '08:57']],
      },
      stats: [
        { who: 'Xiendong', str: 'ที่เหลือ', agi: 'ไม่ลง', vit: '~20', int: '~20', dex: 'จน HIT ราว 270 (ไม่นับบัฟ)', note: 'ตัวเลข DEX ที่ลงจริงตกหล่นในคลิป', cites: [['xaxe', '01:26'], ['xaxe', '02:05'], ['xaxe', '02:33'], ['xaxe', '02:41'], ['xaxe', '04:28']] },
      ],
      statNotes: [
        { text: 'DEX ลงจนตีมอนในแมพโดนสม่ำเสมอ แล้วเอาแต้มที่เหลือไปที่อื่น', cites: [['xaxe', '01:34']] },
        { text: 'เคยลอง VIT 50 ขึ้นไป ดาเมจเพิ่มไม่มาก เลยเหลือราว 20 · INT ราว 20 ไว้เพิ่ม SP', cites: [['xaxe', '01:57'], ['xaxe', '02:08'], ['xaxe', '02:33']] },
        { text: 'STR ช่วยทั้ง ATK และน้ำหนักแบก แต่เคยลองลง STR กับ DEX ล้วนแล้วรู้สึกว่าไม่คุ้ม', cites: [['xaxe', '02:41'], ['xaxe', '02:56']] },
      ],
      skills: [
        { skill: 'Axe Tornado ', level: 'ไม่ระบุ', why: 'สกิลหลัก Lv 5 แรง 4,300% ATK ต้องมี Axe Mastery 1 ก่อน คลิปไม่ได้บอกว่าลงกี่เลเวล', cites: [['xaxe', '00:17'], ['pat']] },
        { skill: 'Weapon Perfection', level: 'ไม่ระบุ', why: 'ลบโทษขนาดอาวุธ ขวานตีมอนเล็กได้แรงขึ้น', cites: [['xaxe', '05:54'], ['xaxe', '06:19']] },
      ],
      skillNotes: [
        { text: 'คลิปไม่ได้บอกเลเวลหรือลำดับอัพสกิล จึงยังไม่มีแผนแต้ม', cites: [['xaxe', '05:50']] },
      ],
      gear: [
        { slot: 'อาวุธ', text: 'ขวานสองมือดีที่สุดเท่าที่ลอง เช่น Buster', items: [620033], cites: [['xaxe', '00:55']] },
        { slot: 'การ์ดอาวุธ', text: 'การ์ดเพิ่มดาเมจตามเผ่าใช้กับ Axe Tornado ได้ ทดสอบ Hydra Card กับหุ่น Demi-Human แล้วดาเมจขึ้นจริง', items: [4035], cites: [['xaxe', '07:52'], ['xaxe', '08:41']] },
        { slot: 'ของใช้', text: 'Elemental Converter (Fire) ซื้อจากตลาด เปลี่ยนอาวุธเป็นธาตุไฟ 30 นาที ตีเป้าธาตุดินแรงขึ้น แต่ตีเป้าธาตุน้ำเบาลง', items: [12114], cites: [['xaxe', '07:08'], ['xaxe', '07:38']] },
      ],
      play: [
        { text: 'วิ่งรวบมอนให้ได้กลุ่มใหญ่ แล้วกด Axe Tornado ทีเดียว ตอนไม่อยู่หน้าจอ Xiendong สลับไปเปิดบอทตัวอื่นแทน', cites: [['xaxe', '09:16'], ['xaxe', '09:28']] },
      ],
      maps: [
        { text: 'แถว Nordfeld (คลิปเรียก North Field)', cites: [['xaxe', '01:21'], ['xaxe', '07:50']] },
        { text: 'Nordfeld Cave 2F: Ryan Geldun เห็นคนใช้ Axe Tornado ทำดาเมจสูงมาก', cites: [['ore', '00:12']] },
      ],
      cautions: [
        { text: 'คูลดาวน์ Axe Tornado: คลิปพูดว่าราว 8 วินาทีตอนหนึ่ง และ 2 วินาทีอีกตอน ส่วนเว็บระบุ 2,000 ms', cites: [['xaxe', '03:13'], ['xaxe', '08:55'], ['pat']] },
        { text: 'ผู้ทำคลิปยังไม่อยากใช้ Axe Tornado เปิดบอทเต็มตัวเพราะติดคูลดาวน์', cites: [['xaxe', '08:48']] },
      ],
    },
    {
      id: 'ore-discovery',
      name: 'ตัวบอทหาเงิน Ore Discovery (คริ + Shattering Strike)',
      tag: 'บอทหาเงิน',
      pickIf: 'อยากได้ตัวเปิดบอททิ้งไว้ หาแร่ขายทั้งวัน',
      idea: {
        text: 'ตีธรรมดาสายคริ ใช้ Shattering Strike เพิ่มดาเมจทุกฮิต ฆ่ามอนที่ตีทีเดียวตายให้ได้มากที่สุดต่อชั่วโมง เพื่อลุ้นแร่จาก Ore Discovery',
        cites: [['ore', '00:22'], ['ore', '00:50'], ['ore', '01:17']],
      },
      statNotes: [
        { text: 'คลิปไม่ได้บอกตัวเลขสเตตัส บอกแค่ว่าเน้นคริ ใช้ LUK และไม่ได้ลง STR สูงแบบสาย Axe Tornado', cites: [['ore', '00:30'], ['ore', '02:15']] },
      ],
      skills: [
        { skill: 'Shattering Strike', level: 10, why: 'ดาเมจเพิ่ม 1,000 ทุกการโจมตี ใช้ 45 SP อยู่ได้ 120 วินาที', cites: [['ore', '00:22'], ['pss']] },
        { skill: 'Ore Discovery', level: 1, why: 'ฆ่ามอนแล้วมีโอกาสได้แร่หายาก', cites: [['ore', '00:56']] },
        { skill: 'Cart Boost', level: 1, why: 'วิ่งเร็ว เจอมอนได้มากขึ้นต่อชั่วโมง', cites: [['ore', '01:21']] },
        { skill: 'Adrenaline Rush', level: 'ไม่ระบุ', why: 'ใช้ SP กับแค่ 3 สกิล: Cart Boost, Shattering Strike, Adrenaline Rush', cites: [['ore', '01:27']] },
      ],
      plan: {
        picks: {
          merchant: { 'Cart Boost': 1 },
          blacksmith: { 'Shattering Strike': 10, 'Ore Discovery': 1 },
        },
        basis: {
          text: 'สกิลที่ Ryan Geldun บอกในคลิป Adrenaline Rush ไม่ได้บอกเลเวล ในแผนได้ Lv 3 มาเพราะเป็นทางผ่านของ Power Thrust',
          cites: [['ore', '00:22'], ['ore', '01:21']],
        },
        leftover: { text: 'แต้มที่เหลือ: คลิปไม่ได้บอก ผู้ทำคลิปขอให้คนดูแนะนำในคอมเมนต์', cites: [['ore', '02:30']] },
      },
      gear: [
        { slot: 'อาวุธ', text: 'ตอนถ่ายคลิปใช้ Orcish Axe ไม่ตีบวก ใส่ Soldier Skeleton Card 2 ใบ', items: [4086], cites: [['ore', '00:38']] },
        { slot: 'อาวุธ (อยากได้)', text: 'ถ้ามีโอกาสจะใส่ Hunter Fly Card กับ Sidewinder Card เพิ่ม', items: [27266, 4117], cites: [['ore', '00:45']] },
      ],
      play: [
        { text: 'ใช้ SP กับแค่ Cart Boost, Shattering Strike, Adrenaline Rush เปิดบอททิ้งไว้ ราวทุก 6 ชม. แวะเอาของเข้าคลังหรือใส่รถเข็น', cites: [['ore', '01:21'], ['ore', '01:48']] },
      ],
      maps: [
        { text: 'คลิปไม่ได้บอกแมพ บอกแค่ให้ไปฟาร์มมอนที่ตีทีเดียวตาย', cites: [['ore', '00:50']] },
      ],
      cautions: [
        { text: 'ผู้ทำคลิปยังไม่ได้จับเวลาหรือคำนวณว่าได้แร่เท่าไหร่ต่อชั่วโมง', cites: [['ore', '01:32']] },
        { text: 'สายนี้ Axe Tornado ทำได้ราว 10,000 ไม่ค่อยได้ใช้', cites: [['ore', '02:02'], ['ore', '02:26']] },
      ],
    },
    {
      id: 'axe-boomerang',
      name: 'สาย Axe Boomerang บอทฟาร์มการ์ด (STR/INT)',
      tag: 'บอทฟาร์ม',
      pickIf: 'อยากเปิดบอทฟาร์มการ์ดหรือของมีออปชั่นในแมพที่มอนไม่โหด',
      idea: {
        text: 'ปาขวานไกลได้เร็วและรัว ใช้ SP แค่ 14 ขวานไปถึงมอนก่อนคนอื่น เหมาะเปิดบอทฟาร์มการ์ดในแมพที่มอนเลือดไม่เยอะ',
        cites: [['boom', '00:03'], ['boom', '00:41'], ['boom', '03:12']],
      },
      stats: [
        { who: 'แชงค์888', str: '40', int: '65', note: 'สเตตัสอื่นไม่ได้บอก', cites: [['boom', '01:53']] },
      ],
      statNotes: [
        { text: 'ปา 2-3 ชั่วโมงแล้ว SP ยังไม่หมด ถ้าคิดว่า INT เยอะไปให้ลด INT แล้วไปเพิ่ม STR ให้แรงขึ้น', cites: [['boom', '03:24'], ['boom', '03:45']] },
      ],
      skills: [
        { skill: 'Axe Mastery', level: 10, why: 'คลิปพูดว่า "ขวานเต็ม" ไม่ชัดว่าหมายถึงของ Merchant หรือของ Blacksmith (ในผังมีทั้งสองตัว)', cites: [['boom', '02:01']] },
        { skill: 'Cart Boost', level: 1, why: 'รถเข็นวิ่งเร็ว', cites: [['boom', '02:06']] },
        { skill: 'Axe Boomerang', level: 'ไม่ระบุ', why: 'สกิลหลัก Lv 5 แรง 500% + น้ำหนักขวาน ใช้ 14 SP ระยะ 9 ต้องมี Axe Mastery 1 ก่อน', cites: [['boom', '02:13'], ['pab']] },
        { skill: 'Power Thrust', level: 'ไม่ระบุ', why: 'คลิปเน้นว่าสำคัญที่สุด', cites: [['boom', '02:16']] },
        { skill: 'Shattering Strike', level: 'ไม่ระบุ', why: 'เพิ่มดาเมจ', cites: [['boom', '02:23']] },
        { skill: 'Crazy Uproar', level: 1, why: 'บัฟเพิ่ม STR (คลิปเรียกสกิลตะโกน) ได้จากเควส', cites: [['boom', '02:51'], ['pmerchant']] },
      ],
      skillNotes: [
        { text: 'คลิปไล่ชื่อสกิลให้ดู ไม่ได้บอกเลเวลส่วนใหญ่ จึงยังไม่มีแผนแต้ม', cites: [['boom', '02:01']] },
      ],
      gear: [
        { slot: 'อาวุธ', text: 'ขวานน้ำหนักเยอะจะปาแรง (คลิปพูด 220) ใส่ Archer Skeleton Card ในคลิปใช้ขวาน +5', items: [4094], cites: [['boom', '01:24'], ['boom', '01:30'], ['boom', '05:36']] },
        { slot: 'เสื้อ', text: 'ออปชั่น SP (ตัวเลขในคลิปไม่ชัดว่าเป็นค่าอะไร) ใส่การ์ดกบเขียว น่าจะเป็น Roda Frog Card', items: [4014], cites: [['boom', '00:53'], ['boom', '01:01']] },
        { slot: 'รองเท้า', text: 'ออปชั่น SP Recovery 20% ใส่ Sohee Card หรือการ์ดอีกใบที่ชื่อไม่ชัด', items: [4100], cites: [['boom', '01:09'], ['boom', '01:14']] },
        { slot: 'หมวก', text: 'การ์ดเพิ่ม Max SP', cites: [['boom', '01:33']] },
        { slot: 'ไม่ชัด', text: 'ช่องที่คลิปเรียกว่า "เข็มขัด" ใส่ Baby Shark Card ได้ ยังไม่ยืนยันว่าเป็นช่องไหน', items: [300834], cites: [['boom', '01:39']] },
      ],
      play: [
        { text: 'ตั้งบอทให้ใช้ Axe Boomerang ทุก 0.6 วินาที บัฟที่ตั้งไว้: Power Thrust, Shattering Strike, Crazy Uproar, Cart Boost', cites: [['boom', '02:32'], ['boom', '02:44']] },
      ],
      maps: [
        { text: 'แมพไหนก็ได้ที่อยากได้การ์ดหรือแร่ ขอให้มอนไม่โหดมาก', cites: [['boom', '02:58'], ['boom', '03:57']] },
      ],
      cautions: [
        { text: 'คลิปบอกว่ารีสกิลรีสเตตัสฟรีได้ถึง "วันที่ 10" เป็นช่วงเวลาจำกัด ตอนนี้อาจหมดแล้ว', cites: [['boom', '05:13']] },
      ],
    },
    {
      id: 'crit-str1',
      name: 'ตีธรรมดาสายคริ STR 1',
      tag: 'ฟุตเทจ Zero ไต้หวัน',
      pickIf: 'อยากเปิดบอทตีธรรมดา แทบไม่ใช้ยา',
      idea: {
        text: 'ตัวละคร Lv 60 เปิดบอทตีธรรมดาสายคริ ลง STR 1 ฟุตเทจนี้อัดก่อน Global เปิด (อนุมานว่าเป็น Zero ไต้หวัน) Ryan Geldun นำมารีวิว',
        cites: [['rbuild', '00:11'], ['rbuild', '00:36'], ['rbuild', '04:27'], ['ralch', '00:12']],
      },
      stats: [
        { who: 'ผู้เล่นในฟุตเทจ (Lv 60)', str: '1', agi: '48 (พื้นฐาน)', dex: '1', note: 'มี INT ด้วย ผู้รีวิวไม่รู้ว่าลงไว้ทำอะไร', cites: [['rbuild', '00:36'], ['rbuild', '03:53'], ['rbuild', '04:14']] },
      ],
      statNotes: [
        { text: 'ลง DEX 1 ได้เพราะคริผ่านการเช็ค HIT อีกคลิปก็บอกว่าคริโดนเสมอ ไม่สน FLEE ของเป้า', cites: [['rbuild', '03:56'], ['meta', '02:49']] },
      ],
      gear: [
        { slot: 'หมวก', text: 'หวีที่ให้ CRIT +6 (หาชื่อในฐานข้อมูลไม่เจอ)', cites: [['rbuild', '00:42']] },
        { slot: 'เสื้อ', text: 'Silk Robe ใส่ Pupa Card ออปชั่น FLEE +15 กับ Max HP (ผู้รีวิวบอกว่าค่าสูงสุดของออปชั่นนี้คือ 350)', items: [450345, 4003], cites: [['rbuild', '00:59'], ['rbuild', '01:10'], ['rbuild', '01:21']] },
        { slot: 'ผ้าคลุม / รองเท้า', text: 'ของธรรมดา ออปชั่น HP กับ FLEE', cites: [['rbuild', '00:59']] },
        { slot: 'อาวุธ', text: 'Orcish Axe ใส่ Sidewinder Card กับ Hunter Fly Card (ผู้รีวิวเดาว่ามี Soldier Skeleton Card ด้วย)', items: [4117, 27266, 4086], cites: [['rbuild', '02:01'], ['rbuild', '03:22']] },
      ],
      play: [
        { text: 'ตี Stalactic Golem ได้เกือบ 2,000 ต่อฮิต ถ้าคริได้ราว 2,500 แล้วไปเปิดบอทต่อที่ Geffen Dungeon', cites: [['rbuild', '02:16'], ['rbuild', '02:24'], ['rbuild', '02:32']] },
        { text: 'Hunter Fly Card ดูดเลือด บวกกับ FLEE สูง จึงแทบไม่ต้องใช้ยา', cites: [['rbuild', '03:44']] },
      ],
      cautions: [
        { text: 'ฟุตเทจนี้อัดก่อน Global เปิด ตัวเลขอาจไม่ตรงกับเซิร์ฟ Global', cites: [['rbuild', '04:27']] },
      ],
    },
    {
      id: 'tornado-endgame',
      name: 'Axe Tornado ช่วง Lv 90+',
      tag: 'ฟุตเทจ Zero ไต้หวัน',
      pickIf: 'อยากดูว่าสาย Axe Tornado ไปได้ไกลแค่ไหนเมื่อเลเวลสูง',
      idea: {
        text: 'ฟุตเทจสตรีมตัวละคร Lv 92 ใช้ Axe Tornado ตีหมู่ ผู้รีวิวนำมาให้ดูว่าอาชีพนี้ไปได้ไกลแค่ไหน อัดก่อน Global เปิด (อนุมานว่าเป็น Zero ไต้หวัน)',
        cites: [['rbuild', '04:38'], ['rbuild', '06:01'], ['ralch', '00:12']],
      },
      stats: [
        { who: 'ผู้เล่นในฟุตเทจ (Lv 92)', str: '90', vit: '65', dex: '30', luk: '50', note: 'HP 18,000', cites: [['rbuild', '08:06'], ['rbuild', '08:22'], ['rbuild', '08:28']] },
      ],
      gear: [
        { slot: 'อาวุธ', text: 'ขวาน double-edged ที่เพิ่มดาเมจกายภาพตามค่าตีบวก (ยังไม่ยืนยันว่าเป็นชิ้นไหนในฐานข้อมูล)', cites: [['rbuild', '04:57'], ['rbuild', '05:07']] },
        { slot: 'เสื้อ', text: 'Steel Chainmail ที่ activate แล้ว ได้ Max HP ตามค่าตีบวก', items: [450528], cites: [['rbuild', '05:16'], ['rbuild', '05:19']] },
        { slot: 'รองเท้า', text: 'รองเท้าที่ activate แล้ว ได้ Max HP', cites: [['rbuild', '05:30'], ['rbuild', '05:34']] },
        { slot: 'ผ้าคลุม', text: 'Regia Hunting Manteau', items: [20945], cites: [['rbuild', '05:48']] },
        { slot: 'อาวุธสำรอง', text: 'มีสลับไปใช้ขวานสองมือที่ให้ DEF กับ CRIT', cites: [['rbuild', '07:43'], ['rbuild', '07:48']] },
      ],
      play: [
        { text: 'ตีหมู่ได้ 40,000-50,000 ต่อฮิต · ในอินสแตนซ์ Maya ได้ราว 70,000 ต่อฮิต', cites: [['rbuild', '06:20'], ['rbuild', '09:02']] },
      ],
      cautions: [
        { text: 'ผู้รีวิวบอกเองว่าทุกอาชีพน่าจะลงอินสแตนซ์เดี่ยวได้เมื่อถึง Lv 90', cites: [['rbuild', '08:53'], ['rbuild', '09:06']] },
      ],
    },
  ],
  gaps: [
    'ยังไม่มีคลิปไหนบอกลำดับและเลเวลสกิลครบทั้งผัง แผนแต้มมีแค่สายหาเงิน Ore Discovery',
    'สาย Axe Tornado ยังไม่มีตัวเลขสเตตัสและเลเวลสกิลที่พูดออกมาในคลิป',
    'คูลดาวน์ Axe Tornado คลิปพูดขัดกันเอง (8 วินาที กับ 2 วินาที)',
    'Axe Mastery ในผังมีทั้งของ Merchant และของ Blacksmith ยังไม่รู้ว่าต่างกันอย่างไร',
    'ยังไม่มีข้อมูล Blacksmith เรื่องเล่นปาร์ตี้ ตี MVP และแมพเก็บเลเวลหลัง Lv 50 ที่นอกจาก Nordfeld',
    'Power Swing, Maximum Power-Thrust, Dubious Salesmanship ยังไม่มีคลิปพูดถึงใน Zero',
  ],
  sources: {
    xaxe: { label: 'Xiendong', title: 'BLACKSMITH Axe Tornado Looks OP… But How Does It REALLY Work?', url: 'https://www.youtube.com/watch?v=IneQBTIHGqk', kind: 'clip', lang: 'en' },
    ore: { label: 'Ryan Geldun', title: 'Ultimate zeny farmer - Blacksmith ore discovery build', url: 'https://www.youtube.com/watch?v=tAl895J-t2U', kind: 'clip', lang: 'en' },
    rbuild: { label: 'Ryan Geldun', title: 'Blacksmith build Ragnarok Zero Global', url: 'https://www.youtube.com/watch?v=77QmiZ_aypU', kind: 'clip', lang: 'en' },
    ralch: { label: 'Ryan Geldun', title: 'Alchemist build for Ragnarok Zero Global', url: 'https://www.youtube.com/watch?v=4398SVd-VN0', kind: 'clip', lang: 'en' },
    boom: { label: 'แชงค์888', title: 'Ragnarok Zero Blacksmith Axe Boomerang Build: AFK Card Farming Guide', url: 'https://www.youtube.com/watch?v=rjApT8c93hU', kind: 'clip', lang: 'th' },
    tako: { label: 'TakoyakiCh', title: 'จัด Tierlist Class2 ในโลก RO-Zero', url: 'https://www.youtube.com/watch?v=Y7MKIY0KiYo', kind: 'clip', lang: 'th' },
    meta: { label: 'Xiendong', title: 'Why Taiwan Players Build These Stats', url: 'https://www.youtube.com/watch?v=T5bjOqQomUc', kind: 'clip', lang: 'en' },
    road: { label: 'Xiendong', title: 'My Current 1–60 Levelling Roadmap for my New Characters', url: 'https://www.youtube.com/watch?v=7ymM15xvYAY', kind: 'clip', lang: 'en' },
    xdemi: { label: 'Xiendong', title: 'I Tried Building My Merchant Around Demi-Human Affixes and Cards', url: 'https://www.youtube.com/watch?v=me-Q_z1ExSM', kind: 'clip', lang: 'en' },
    nottwice: { label: 'NotTwice', title: 'Guide เก็บเลเวลพ่อค้า 1-50', url: 'https://www.youtube.com/watch?v=3vv3ikWgOgU', kind: 'clip', lang: 'th' },
    ncz: { label: 'NCZ', title: 'Recommended Leveling Maps Lv. 1-50', url: 'https://www.youtube.com/watch?v=IScycVE-tf8', kind: 'clip', lang: 'th' },
    ryanZeny: { label: 'Ryan Geldun', title: 'Chill Zeny and Exp farming spot you FORGOT about', url: 'https://www.youtube.com/watch?v=oEPSeeOEGVk', kind: 'clip', lang: 'en' },
    shank: { label: 'แชงค์888', title: 'How to Free Reset Skills and Stats Before Level 40', url: 'https://www.youtube.com/watch?v=lRGGsRGUKYY', kind: 'clip', lang: 'th' },
    pat: { label: 'roz.prontera.info', title: 'Axe Tornado', url: 'https://roz.prontera.info/skills/axe-tornado', kind: 'web' },
    pss: { label: 'roz.prontera.info', title: 'Shattering Strike', url: 'https://roz.prontera.info/skills/shattering-strike', kind: 'web' },
    pab: { label: 'roz.prontera.info', title: 'Axe Boomerang', url: 'https://roz.prontera.info/skills/axe-boomerang', kind: 'web' },
    pmerchant: { label: 'roz.prontera.info', title: 'Merchant skills', url: 'https://roz.prontera.info/jobs/merchant', kind: 'web' },
    owner: { label: 'ยืนยันในเกม', title: 'เจ้าของเว็บตรวจในเกม 22 ก.ย. 2026', url: '', kind: 'web' },
  },
};
