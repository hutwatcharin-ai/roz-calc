// Sage guide. Drafted 22 Sep 2026 from Downloads/roz-job-guides/sage.md and
// mage.md (the 1st job, for the levelling route and the Mage half of each
// plan), which cite every line to a clip timestamp or a web page. Items,
// monsters and skills were checked against the site database; names the clips
// only mumble are left without an id and say so on the page.
import type { ClassGuide } from './types';

export const sage: ClassGuide = {
  slug: 'sage',
  job: 'Sage',
  jobTh: 'เซจ',
  from: 'Mage',
  gathered: '22 ก.ย. 2026',
  summary:
    'อาชีพสองของ Mage สายเวทผสมตีธรรมดา จุดเด่นคือ Spell Fist เก็บบอลต์ไว้ที่หมัด แล้วตีธรรมดามีโอกาสออกดาเมจเวทครั้งละหมื่นขึ้นไป ปล่อยบอทได้ทั้งคืนโดยไม่ใช้ยา',
  facts: [
    { text: 'เปลี่ยนเป็น Sage ได้ที่ Base Lv 50 ที่ Professor Academy แถว Juno', cites: [['owner'], ['kamonC2', '01:29']] },
    { text: 'Job ตันที่ 70 ได้แต้มสกิล 69 แต้ม', cites: [['owner']] },
    {
      text: 'Spell Fist, Double Bolt, Indulge อยู่ในผังสกิล Sage เลย ได้ตั้งแต่เปลี่ยนอาชีพ ไม่ต้องทำอะไรเพิ่ม',
      cites: [['owner'], ['kanda', '02:29']],
    },
    {
      text: 'ชื่อสกิลในเกมกับที่คนเรียก: Hindsight คือ Auto Spell, Double Bolt คือ Lucky Cast หรือ Double Cast, Study คือ Advanced Book',
      cites: [['xiendongSF', '05:13'], ['vcartz', '00:28'], ['kanda', '03:48'], ['kanda', '04:03']],
    },
  ],
  path: ['mage', 'sage'],
  equipJob: 'Sage',
  route: [
    { range: '1-20', text: 'ทำเควสหลักไปก่อน เควสให้ตี Baby Poring, งู, Pudding ไล่ไปตามลำดับ', cites: [['mimiw', '01:20'], ['ginger', '00:44']] },
    { range: '~10-50', text: 'Parasite ที่ Kalala Swamp in Umbala ใช้ Earth Spike ตี ฟาร์มยาวได้ถึงเลเวล 50 ตัว Elite (C2 Parasite) ให้ EXP มากกว่ามาก', maps: ['um_fild03'], monsters: [1500, 2720], cites: [['ginger', '02:17'], ['zixma', '02:25'], ['resbakk', '02:47']] },
    { range: '~22-25', text: 'Coco ที่ Geffen Field หา Hood กับ Sandals ใช้ Fire Bolt ตี', maps: ['gef_fild09'], monsters: [1104], cites: [['zixma', '03:33'], ['ginger', '04:09']] },
    { range: 'ช่วงหาเสื้อ', text: 'Creamy หา Silk Robe MimiwPK ไปแมพที่ออกทางซ้ายของ Geffen แล้วขึ้นวาร์ปด้านบน', maps: ['gef_fild05'], monsters: [1018], cites: [['mimiw', '06:21']] },
    { range: 'หลังได้ของ', text: 'Steel Chonchon ที่ Sograt Desert ขึ้นช้ากว่า Parasite แต่ปล่อยบอทได้ไม่ต้องเฝ้าจอ', maps: ['moc_fild13'], monsters: [1042], cites: [['mimiw', '09:00'], ['ginger', '06:13']] },
    { range: '50', text: 'เปลี่ยนเป็น Sage ใช้แต้มสกิล Mage ให้หมดก่อนเปลี่ยน', cites: [['owner'], ['kamonC2', '00:51'], ['kamonC2', '01:29']] },
    { range: 'Job 1-22', text: 'เก็บ Job แบบเล่นเหมือน Mage ไปก่อน พอ Job 22 จะอัพ Spell Fist 10 ได้', cites: [['kanda', '02:29']] },
    { range: '50-60', text: 'Nordfeld Cave 2F ดันที่ดรอปของเซ็ต Lv 50 และการ์ด Boulder Dwarf คนเยอะมาก ต้องใช้ใบวาร์ปหลายใบกว่าจะเข้าได้', maps: ['nrd_dun02'], monsters: [25327, 25328], cites: [['khun', '09:01'], ['kandaAFK', '08:35'], ['khun', '12:42']] },
    { range: 'หลังได้ Spell Fist', text: 'Sandman ที่ Sograt Desert กานดาต่อยทีเดียวตาย', maps: ['moc_fild16', 'moc_fild17'], monsters: [1165], cites: [['kanda', '06:26']] },
  ],
  routeNotes: [
    { text: 'ยืนให้อยู่แนวตรงกับ Parasite (แนวตั้งหรือแนวนอน) ห้ามยืนเฉียง ไม่งั้นมันตีสวนถึง', cites: [['ginger', '03:18'], ['zixma', '03:10']] },
    { text: 'ก่อนเลเวล 40 รีเซ็ตสกิลกับสเตตัสได้ฟรี', cites: [['ginger', '01:44']] },
    { text: 'Sandman ในฐานข้อมูลมี HP 11,933 มากกว่าที่ผู้ทำคลิปกะไว้ (8,000-10,000)', cites: [['dbSandman'], ['kanda', '06:26']] },
  ],
  gearByLevel: [
    { range: '1-50', slot: 'อาวุธ', text: 'Shining Metal Staff +7 (สองมือ) จาก Shining Staff Box ในร้านเงินจริง ราคาราว 3,000 MATK ราว 105', items: [640073, 200927], cites: [['mimiw', '05:38'], ['mimiw', '05:50'], ['zixma', '02:05']] },
    { range: '~20-25', slot: 'เสื้อ', text: 'Silk Robe ดรอปจาก Creamy ออปชั่นที่ควรหา: HP, SP, อัตราฟื้น SP', items: [450345], cites: [['mimiw', '06:21'], ['mimiw', '07:20']] },
    { range: '~22-25', slot: 'ผ้าคลุม / รองเท้า', text: 'Hood กับ Sandals ดรอปจาก Coco หาออปชั่น HP 1-2 แถว จะได้ไม่โดน Parasite ตีทีเดียวตาย', items: [480414, 470257], cites: [['zixma', '04:07'], ['ginger', '04:18'], ['zixma', '04:19']] },
    { range: '50+', slot: 'อาวุธ', text: 'หนังสือที่แจกตอนเปลี่ยนอาชีพ ไม่มีออปชั่นสุ่ม ตอนนี้ยังไม่มีหนังสือดรอป หนังสือที่ NPC ใน Prontera ขายบวกแค่ ATK ไม่บวก MATK', cites: [['vcartz', '02:09'], ['vcartz', '02:16'], ['kanda', '06:43']] },
    { range: '50+', slot: 'ชุด Nordfeld', text: 'KhunLoong ใส่ของ Nordfeld ออปชั่น 3 แถวกับ HP ได้มาจาก Nordfeld Cave 2F', cites: [['khun', '04:29'], ['khun', '09:01']] },
    { range: '59+', slot: 'แผนต่อไป', text: 'KhunLoong จะหาเสื้อที่ดรอปจาก Memorial ของ Orc ตี +9 ลุ้นออปชั่นดาเมจบอลต์ 20% และผ้าคลุมจากดัน (FLEE 10 ลดดาเมจไร้ธาตุ) ชื่อของยังไม่รู้', cites: [['khun', '14:05'], ['khun', '15:13']] },
  ],
  strengths: [
    { text: 'ตีธรรมดาติด Spell Fist ครั้งละราว 10,000 ขึ้นไป', cites: [['vcartz', '00:10'], ['kanda', '00:02']] },
    { text: 'SP กับ HP แทบไม่หมด ใช้ Indulge แลก HP เป็น SP แล้ว Heal จากการ์ดคืน HP บอทได้ทั้งคืนไม่ใช้ยา', cites: [['vcartz', '00:52'], ['khun', '01:46'], ['kandaAFK', '01:23']] },
    { text: 'ต่อยแต่ละหมัดไม่เสีย SP เสียแค่ตอนกด Spell Fist 76 SP', cites: [['kanda', '01:19']] },
    { text: 'Spell Fist เป็นเวท ไม่สน FLEE ของมอน ผู้เล่นไต้หวันทดสอบว่าตีธรรมดาพลาดก็ยังมีโอกาสติด', cites: [['xiendongSF', '03:19']] },
    { text: 'TakoyakiCh จัดไว้เทียร์ SS', cites: [['tako', '07:48']] },
  ],
  weaknesses: [
    { text: 'Spell Fist ติดแค่ 50% ไม่ได้ติดทุกหมัด กานดามองว่าโดนเนิร์ฟ ต้องทำ ASPD สูง (TakoyakiCh บอกว่าทุกหมัดเป็นเวท ขัดกัน ตารางสกิลบอก 50%)', cites: [['kanda', '02:47'], ['tako', '07:36'], ['pvSpellFist']] },
    { text: 'อาวุธน้อย มีแค่หนังสือแจกที่ไม่มีออปชั่น อัปเดตหน้า Mimic จะดรอปหนังสือ 3 ช่อง แต่เกิดน้อย น่าจะแพง', cites: [['vcartz', '02:09'], ['kandaAFK', '05:59'], ['farm', '01:41']] },
    { text: 'ยังไม่มีการ์ดเพิ่มดาเมจเวททั่วไป มีแค่การ์ดเฉพาะ Boulder Dwarf', cites: [['kandaAFK', '06:06']] },
    { text: 'น้ำหนักน้อย พกยาได้ไม่มาก', cites: [['orcHero', '03:25'], ['kandaAFK', '10:43']] },
    { text: 'ยังไม่มีไอคอนบัฟ Spell Fist ดูเวลาที่เหลือไม่ได้', cites: [['xiendongSF', '01:09']] },
  ],
  builds: [
    {
      id: 'spell-fist',
      name: 'สาย Spell Fist AGI บอท',
      tag: 'สายหลัก',
      pickIf: 'อยากปล่อยบอทเก็บเลเวลหรือฟาร์ม Boulder Dwarf ทั้งคืน',
      idea: {
        text: 'ร่ายบอลต์แล้วกด Spell Fist ระหว่างร่าย เก็บบอลต์ไว้ที่หมัด จากนั้นตีธรรมดาให้เร็วที่สุด เพื่อให้ Spell Fist (50%) กับ Hindsight (20%) ติดบ่อย เป้า ASPD ราว 190 FLEE ราว 300 ขึ้นไป ดาเมจในคลิปราว 10,000-19,000 ต่อครั้ง',
        cites: [['xiendongSF', '00:18'], ['xiendongSF', '05:18'], ['xiendongSF', '04:52'], ['vcartz', '05:30'], ['vcartz', '06:20']],
      },
      stats: [
        { who: 'VCartz', agi: '50-60 (บางคน 80)', int: '30-50', dex: '1 (หรือ 10-20)', note: 'ต่อมาสรุปว่า AGI 60-80 อีกค่า 40-50 ซับไม่ชัดว่าเป็น INT หรือ DEX', cites: [['vcartz', '01:08']] },
        { who: 'KhunLoong (Lv 60)', agi: '92', note: 'INT ฟังไม่ชัด · FLEE 311 รวมของ · ASPD 177 ตอนกินยาเขียว', cites: [['khun', '00:24']] },
        { who: 'กานดา', agi: '84', int: '29', note: 'ASPD 177 ตอนกินยาเขียว 188 ตอนบัฟเต็มและมี AGI Up จาก Priest', cites: [['kandaAFK', '01:43'], ['kandaAFK', '01:54']] },
        { who: 'Xiendong', agi: 'เน้น', int: 'เน้น', dex: 'แทบไม่ต้อง', cites: [['xiendongSF', '04:19']] },
      ],
      statNotes: [
        { text: 'ไม่ต้องลง DEX เพราะ Spell Fist เป็นดาเมจเวท ผู้เล่นไต้หวันหลายคนแทบไม่ลงเลย', cites: [['vcartz', '01:33'], ['xiendongSF', '04:04']] },
        { text: 'AGI ช่วงหลังใช้ 10-11 แต้มต่อ 1 หน่วย KhunLoong เลยหา AGI จากของแทน', cites: [['khun', '06:11']] },
      ],
      skills: [
        { skill: 'Spell Fist', level: 10, why: 'เก็บ Job ถึง 22 แล้วอัพตัวนี้ก่อน ระบบจะให้อัพทางผ่านจนครบ', cites: [['kanda', '02:29'], ['kanda', '02:37']] },
        { skill: 'Hindsight', level: 10, why: 'ในคลิปเรียก Auto Spell ตีธรรมดามีโอกาสร่ายบอลต์ให้เอง', cites: [['kanda', '03:42'], ['xiendongSF', '05:13'], ['pvHindsight']] },
        { skill: 'Double Bolt', level: 5, why: 'ตอน Hindsight ติด บอลต์มีโอกาส 80% ออก 2 ครั้ง', cites: [['kanda', '03:48'], ['pvDoubleBolt']] },
        { skill: 'Study', level: 10, why: 'ในคลิปเรียก Advanced Book ได้ ASPD 5% กานดามองว่าไม่สำคัญมาก', cites: [['kanda', '04:03'], ['khun', '02:00']] },
        { skill: 'Free Cast', level: 6, why: 'เดินระหว่างร่ายได้ KhunLoong อัพแค่ 6', cites: [['khun', '01:43'], ['tako', '07:21']] },
        { skill: 'Indulge', level: 'ไม่ระบุ', why: 'แลก HP เป็น SP ใช้คู่กับ Heal จากการ์ด บอทได้ทั้งคืน', cites: [['khun', '01:46'], ['vcartz', '00:52'], ['pvIndulge']] },
        { skill: 'Endow Blaze', level: 5, why: 'ดาเมจเวทไฟ +5% ใช้ในบอทได้', cites: [['khun', '02:04']] },
        { skill: 'Volcano', level: 5, why: 'วางพื้นไฟ ใช้ตอนลงดันเล่นมือ ไม่ใช้ในบอท', cites: [['khun', '02:08'], ['khun', '02:23']] },
      ],
      skillNotes: [
        { text: 'ตอน Mage: บอลต์ 3 ธาตุไว้ใช้กับมอนต่างธาตุ กานดาอัพถึง 10 ทั้ง 3 ตัว กับ Increase SP Recovery และ Stone Curse 1 · KhunLoong ลง Safety Wall 6 กับ Sight 1 ด้วย ส่วนกานดาไม่ลง Safety Wall เพราะใช้แค่ตอนลงดัน', cites: [['khun', '01:24'], ['kanda', '01:41'], ['kanda', '01:52'], ['kanda', '02:12']] },
        { text: 'กานดา (คลิปบอท) ไม่ลง Endow แต่เอา Deluge 5 กับ Volcano 5 ไว้สู้บอส และยังอัพ Double Bolt ไม่ถึง 5 เพราะแต้มไม่พอ', cites: [['kandaAFK', '02:32'], ['kandaAFK', '02:35']] },
        { text: 'Endow เปลี่ยนธาตุแค่ส่วนดาเมจกายภาพ กานดาวัดได้เพิ่มแค่ 2% (12,800 เป็น 13,300) เลยไม่ใส่ในบอท KhunLoong วัดได้ราว 5%', cites: [['kanda', '04:20'], ['kandaAFK', '04:53'], ['khun', '03:05']] },
      ],
      plan: {
        picks: {
          mage: { 'Fire Bolt': 10, 'Cold Bolt': 10, 'Lightning Bolt': 10, 'Stone Curse': 1 },
          sage: { 'Spell Fist': 10, Hindsight: 10, 'Double Bolt': 5, Study: 10, 'Free Cast': 6, 'Endow Blaze': 5, Volcano: 5 },
        },
        basis: { text: 'ช่วง Mage ตามที่กานดาอัพ ช่วง Sage ตามที่ KhunLoong อัพตอน Job 60 (Cast Cancel เป็นทางผ่าน)', cites: [['kanda', '01:41'], ['khun', '01:32'], ['khun', '01:43']] },
        leftover: { text: 'แต้มที่เหลือ: KhunLoong กับ VCartz เอา Indulge ด้วยแต่ไม่บอกเลเวล ต้องมี Increase SP Recovery 1 ตอน Mage และ Magic Rod 1 ตอน Sage กานดาก็อัพ Increase SP Recovery แต่ไม่บอกเลเวล', cites: [['khun', '01:43'], ['vcartz', '00:52'], ['kanda', '01:48']] },
      },
      gear: [
        { slot: 'อาวุธ', text: 'หนังสือที่แจกตอนเปลี่ยนอาชีพ (ไม่มีออปชั่น)', cites: [['vcartz', '02:09'], ['kanda', '06:43']] },
        { slot: 'การ์ดอาวุธ', text: 'ฟาร์ม Boulder Dwarf ใส่ Boulder Dwarf Squad Leader Card (ดาเมจเวทใส่ Boulder Dwarf +30%) ราวใบละ 1M · ฟาร์มข้างนอกใส่การ์ดอาวุธ AGI +1 (ชื่อฟังไม่ชัด)', items: [300943], cites: [['khun', '04:50'], ['kandaAFK', '06:11'], ['kandaAFK', '08:49'], ['kandaAFK', '06:14']] },
        { slot: 'การ์ดอาวุธ', text: 'Sidewinder Card เบิ้ล 7% แต่กานดากับ KhunLoong มองว่ายังไม่คุ้ม เพราะต้องติดเบิ้ลในหมัดที่ติด Spell Fist ด้วย', items: [4117], cites: [['kanda', '06:52'], ['kanda', '07:03'], ['khun', '04:59']] },
        { slot: 'หมวก', text: 'หมวก Lv 50 ออปชั่น AGI 3 ใส่ Boulder Dwarf Siege Trooper Card (AGI เพิ่มตามการตีบวก) KhunLoong วางแผนตี +9', items: [300942], cites: [['kandaAFK', '03:14'], ['khun', '13:53']] },
        { slot: 'เสื้อ', text: 'ออปชั่น FLEE การ์ดเสื้อ: กานดาใส่การ์ด AGI +1 (ฟังไม่ชัด น่าจะเป็น ThiefBug Card) หรือ Pupa Card เพื่อ HP', items: [4016, 4003], cites: [['vcartz', '02:27'], ['kandaAFK', '03:43'], ['khun', '06:31']] },
        { slot: 'ผ้าคลุม', text: 'ออปชั่น FLEE หรือ HP ใส่ Shark Family Card', items: [300835], cites: [['khun', '05:28'], ['kandaAFK', '03:50']] },
        { slot: 'รองเท้า', text: 'ออปชั่น FLEE กับ Max SP/HP ใส่ Sohee Card หรือการ์ด AGI (ชื่อฟังไม่ชัด)', items: [4100], cites: [['khun', '05:57'], ['khun', '06:02'], ['kandaAFK', '03:52']] },
        { slot: 'ประดับ', text: 'Creamy Card (Teleport) กับ Vitata Card (Heal) ใช้คู่กับ Indulge', items: [4040, 4053], cites: [['vcartz', '00:58'], ['khun', '01:55'], ['tako', '06:27']] },
        { slot: 'แหวนพิเศษ', text: 'แหวน FLEE +9 ฟังไม่ชัด น่าจะเป็น Taming Ring ใส่ Steel Chonchon Egg Lv.2 (ยังไม่ยืนยัน)', cites: [['kandaAFK', '04:18']] },
      ],
      play: [
        { text: 'ต้องมีบอลต์ร่ายก่อน Spell Fist เสมอ ตั้ง Fire Bolt ทุก 100-150 วินาที (Spell Fist อยู่ 300 วินาที) กานดาตั้ง 100 ถ้าพลาดจะได้ไม่ยืนเฉยนาน', cites: [['xiendongSF', '07:07'], ['kandaAFK', '07:24'], ['vcartz', '03:29'], ['khun', '09:42']] },
        { text: 'บัฟอื่นในบอท: Hindsight ทุก 120-390 วินาที, Double Bolt 90 วินาที, Indulge 30-60 วินาที, Energy Coat 300 วินาที, Heal ที่ 85% และต้องติ๊กตีธรรมดา', cites: [['vcartz', '03:29'], ['khun', '09:42'], ['kandaAFK', '07:46']] },
        { text: 'Teleport เมื่อโดนรุม 3 ตัวขึ้นไป, โดนดาเมจเกิน 400-500 หรือฆ่ามอนไม่ได้ใน 10-15 วินาที', cites: [['vcartz', '02:54'], ['khun', '09:17'], ['kandaAFK', '07:00']] },
        { text: 'อย่าตี Shining Plant เพราะดรอปสมุนไพรทำให้น้ำหนักเกิน', cites: [['vcartz', '03:17'], ['khun', '09:42']] },
      ],
      maps: [
        { text: 'Nordfeld Cave 2F: KhunLoong บอทข้ามคืนได้การ์ดวันละ 1-3 ใบ กานดาบอท 2 วันได้การ์ด Boulder Dwarf 2 ใบ ดาเมจในคลิป 17,000-23,000', cites: [['khun', '13:33'], ['kandaAFK', '08:55'], ['kandaAFK', '09:27']] },
        { text: 'Sandman: ต่อยทีเดียวตาย', cites: [['kanda', '06:26']] },
      ],
      cautions: [
        { text: 'ร่ายบอลต์แล้วโดนขัด จะกด Spell Fist ไม่ทัน', cites: [['khun', '10:02']] },
        { text: 'Heal ตอนเลือดต่ำอาจไม่ทัน ตั้งยาดักไว้ด้วย', cites: [['vcartz', '04:26']] },
        { text: 'น้ำหนักเกิน 70% ยังบอทได้ แต่เกิน 90% จะใช้สกิลไม่ได้', cites: [['kandaAFK', '01:31']] },
        { text: 'บางครั้งตั้งบอทแล้วค้าง ต้องออกเกมเข้าใหม่', cites: [['kanda', '05:33']] },
      ],
    },
    {
      id: 'memorial',
      name: 'สายลง Memorial Dungeon (Orc Hero)',
      pickIf: 'อยากโซโลดันรายวันอย่าง Orc Hero',
      idea: {
        text: 'FLEE สูงจนมอนตีพลาดเกือบหมด ตอนเคลียร์มอนตั้ง Hindsight เป็น Heaven\'s Drive เพื่อตีหมู่ ตอนสู้ Orc Hero เปลี่ยนเป็น Fire Ball ตีเป้าเดียว บอสตายในราว 5 นาที',
        cites: [['orcHero', '00:39'], ['orcHero', '01:01'], ['orcHero', '01:56'], ['orcHero', '05:40']],
      },
      stats: [
        { who: 'Xiendong', note: 'ไม่ได้บอกค่าสเตตัส · FLEE เกิน 350 ผู้เล่นไต้หวันถือ 350 เป็นเป้า', cites: [['orcHero', '00:43']] },
      ],
      skills: [
        { skill: "Heaven's Drive", level: 5, why: 'เคลียร์มอนหมู่และดอกทานตะวันที่ฮีลบอส มี Lv 3 ไว้ใช้ใน GTB Memorial ด้วย', cites: [['orcHero', '02:20'], ['orcHero', '02:36']] },
        { skill: 'Safety Wall', level: 10, why: 'กันได้ราว 11 ครั้ง นับเฉพาะครั้งที่ตีโดน จึงเข้ากับสาย FLEE ยืนร่ายในนี้ได้ไม่โดนขัด', cites: [['orcHero', '03:51'], ['orcHero', '03:01']] },
        { skill: 'Hindsight', level: 'ไม่ระบุ', why: 'เปลี่ยนสกิลที่ออกตามช่วงของดัน', cites: [['orcHero', '01:01'], ['orcHero', '01:56']] },
      ],
      skillNotes: [
        { text: 'กานดาเลือก Deluge 5 กับ Volcano 5 และบอลต์น้ำกับไฟ ไว้สู้บอส Orc กับ Golden Thief Bug', cites: [['kandaAFK', '02:14'], ['kandaAFK', '02:38']] },
      ],
      plan: {
        picks: {
          mage: { 'Safety Wall': 10 },
          sage: { "Heaven's Drive": 5 },
        },
        basis: { text: 'เฉพาะสกิลที่ Xiendong บอกเลเวลในคลิป ส่วนแต้มที่เหลือเลือกตามสาย Spell Fist ด้านบนได้', cites: [['orcHero', '02:36'], ['orcHero', '03:55']] },
      },
      gear: [
        { slot: 'โล่', text: 'Thara Frog Card (ลดดาเมจจาก Demi-Human 30%) เพราะ Orc Hero เป็น Demi-Human และบางสกิลไม่สน FLEE ชื่อโล่ในคลิปหาไม่เจอในฐานข้อมูล', items: [4058], cites: [['orcHero', '04:28']] },
      ],
      play: [
        { text: 'ใช้ธาตุไฟในดันนี้', cites: [['orcHero', '00:56']] },
        { text: 'ร่ายไม่ให้โดนขัด: ใช้บัฟจาก Cash Shop หรือกิจกรรม หรือยืนใน Safety Wall · ตอนหยิบยาจากคลังก็เปิด Safety Wall ไว้ก่อน', cites: [['orcHero', '02:48'], ['orcHero', '03:39']] },
      ],
      cautions: [
        { text: 'เข้าได้ที่ Lv 59-60 วันละครั้ง ถ้าตายในดันจะเสียสิทธิ์ของวันนั้น', cites: [['orcHero', '00:05'], ['orcHero', '04:19']] },
      ],
    },
    {
      id: 'autobolt',
      name: 'สาย AutoBolt INT (บิลด์ในเว็บวางแผน)',
      pickIf: 'อยากได้แผนสกิลครบทั้งสองอาชีพที่ลง INT มากกว่าสายหลัก',
      idea: {
        text: 'บิลด์ "Sage | AutoBolt (60/60)" บน roz.prontera.info ลง INT มากกว่า AGI ยังไม่มีคลิปทดสอบ',
        cites: [['pvBuild']],
      },
      stats: [
        { who: 'roz.prontera.info (Lv 60)', str: '1', agi: '44', vit: '1', int: '71', dex: '20', luk: '1', cites: [['pvBuild']] },
      ],
      skills: [
        { skill: 'Study', level: 10, cites: [['pvBuild']] },
        { skill: 'Free Cast', level: 10, cites: [['pvBuild']] },
        { skill: 'Hindsight', level: 10, cites: [['pvBuild']] },
        { skill: 'Double Bolt', level: 5, cites: [['pvBuild']] },
        { skill: 'Spell Fist', level: 10, cites: [['pvBuild']] },
        { skill: "Heaven's Drive", level: 5, cites: [['pvBuild']] },
      ],
      plan: {
        picks: {
          mage: { 'Cold Bolt': 10, 'Lightning Bolt': 10, 'Fire Bolt': 10, 'Napalm Beat': 4, 'Earth Spike': 5, 'Soul Strike': 8, 'Stone Curse': 1, Sight: 1, 'Energy Coat': 1 },
          sage: {
            Study: 10, 'Free Cast': 10, Hindsight: 10, 'Double Bolt': 5, 'Spell Fist': 10, "Heaven's Drive": 5,
            'Cast Cancel': 1, Foresight: 1, 'Fiber Lock': 1, Sense: 1,
            'Elemental Change - Water': 1, 'Elemental Change - Wind': 1, 'Elemental Change - Ground': 1, 'Elemental Change - Fire': 1,
            'Create Elemental Converter': 1,
          },
        },
        basis: { text: 'สกิลตามบิลด์บน roz.prontera.info ครบทุกตัว บิลด์นี้ทำไว้ที่ Job 60', cites: [['pvBuild']] },
      },
      gear: [
        { slot: 'หมวก', text: 'Sakkat กับ Cigarette', items: [2280, 2267], cites: [['pvBuild']] },
        { slot: 'อาวุธ', text: 'Book +5 ใส่ Female ThiefBug Card 3 ใบ (AGI +1 FLEE +1)', items: [540106, 4026], cites: [['pvBuild']] },
        { slot: 'เสื้อ', text: 'Jacket ใส่ ThiefBug Card (AGI +1)', items: [450347, 4016], cites: [['pvBuild']] },
        { slot: 'ผ้าคลุม', text: 'Hood ใส่ Condor Card', items: [480414, 4015], cites: [['pvBuild']] },
        { slot: 'รองเท้า', text: 'Sandals ใส่ Male ThiefBug Card (AGI +2)', items: [4050], cites: [['pvBuild']] },
        { slot: 'ประดับ', text: 'Brooch 2 ชิ้น', items: [2605], cites: [['pvBuild']] },
      ],
      cautions: [
        { text: 'บิลด์นี้ไม่ระบุออปชั่นสุ่ม และยังไม่มีคลิปเล่นจริง', cites: [['pvBuild']] },
      ],
    },
  ],
  gaps: [
    'ยังไม่รู้ว่าควรลง Indulge กี่เลเวล ทุกคลิปพูดถึงแต่ไม่มีใครบอกเลข',
    'ยังไม่รู้ชื่อหนังสือ 3 ช่องที่ Mimic จะดรอป และค่าสเตตัสของมัน',
    'ยังไม่มีข้อมูลสาย Sage ซัพพอร์ตปาร์ตี้ (Dispell, Land Protector, Deluge/Volcano ให้ทีม) และยังไม่มีคลิปทดสอบ Soul Siphon, Mind Breaker, Foresight',
    'INT ของ KhunLoong ฟังไม่ชัด และชื่อการ์ดหลายใบในคลิปถอดจากเสียงไม่ได้',
    'Spell Fist ติดทุกหมัดหรือ 50% คลิปยังขัดกัน',
  ],
  sources: {
    vcartz: { label: 'VCartz', title: 'แนะนำ Sage สาย Spell Fist ทุบแรง ไม่เสียปั้ม บอทสบาย', url: 'https://www.youtube.com/watch?v=JTLOxGApbaI', kind: 'clip', lang: 'th' },
    kanda: { label: 'กานดา', title: 'Sage Spell Fist 10k Damage Build Review: Budget-Friendly Edition', url: 'https://www.youtube.com/watch?v=Geid427xJ70', kind: 'clip', lang: 'th' },
    kandaAFK: { label: 'กานดา', title: 'Sage AFK Botting Guide: All Night, No Deaths, No Potions Needed', url: 'https://www.youtube.com/watch?v=L0yksGUDggM', kind: 'clip', lang: 'th' },
    khun: { label: 'KhunLoong', title: 'Sage Spell Fist แรงแค่ไหน!? เปิด Stat + Skill + ของ', url: 'https://www.youtube.com/watch?v=sNvrdKJx6Q4', kind: 'clip', lang: 'th' },
    xiendongSF: { label: 'Xiendong', title: "I Tested SAGE Spell Fist… Here's How It REALLY Works", url: 'https://www.youtube.com/watch?v=hW7_te2pH7s', kind: 'clip', lang: 'en' },
    orcHero: { label: 'Xiendong', title: 'Before You Enter Orc Hero Memorial Dungeon… WATCH THIS', url: 'https://www.youtube.com/watch?v=2ruDzxsgJJU', kind: 'clip', lang: 'en' },
    farm: { label: 'Xiendong', title: 'NEW Farming Spots, Cards & EXP Areas!', url: 'https://www.youtube.com/watch?v=y7ySJekxEAw', kind: 'clip', lang: 'en' },
    tako: { label: 'TakoyakiCh', title: 'จัด Tierlist Class2 ในโลก RO-Zero', url: 'https://www.youtube.com/watch?v=Y7MKIY0KiYo', kind: 'clip', lang: 'th' },
    kamonC2: { label: 'KamonWay', title: 'How to Change to Class 2 for Every Job in 3 Minutes', url: 'https://www.youtube.com/watch?v=iTxVgyVGCbc', kind: 'clip', lang: 'en' },
    ginger: { label: 'Ginger', title: 'ไกด์เก็บเลเวล Mage | Ragnarok Zero Global', url: 'https://www.youtube.com/watch?v=-lfhb7us4ec', kind: 'clip', lang: 'th' },
    mimiw: { label: 'MimiwPK', title: 'A Step-by-Step Guide for Beginners Playing Mage', url: 'https://www.youtube.com/watch?v=b3Vq6nQMVv4', kind: 'clip', lang: 'en' },
    zixma: { label: 'ZixmaOne', title: 'แนวทางเล่น Mage โผล่มาแปปเดียวเวลอัพรัวๆ', url: 'https://www.youtube.com/watch?v=M1cnBmEKYQw', kind: 'clip', lang: 'th' },
    resbakk: { label: 'Resbakk Gaming', title: 'RAGNAROK ZERO: GLOBAL | BEGINNERS GUIDE', url: 'https://www.youtube.com/watch?v=IKItqq2QXR8', kind: 'clip', lang: 'en' },
    pvSpellFist: { label: 'roz.prontera.info', title: 'Spell Fist', url: 'https://roz.prontera.info/skills/spell-fist', kind: 'web' },
    pvHindsight: { label: 'roz.prontera.info', title: 'Hindsight', url: 'https://roz.prontera.info/skills/hindsight', kind: 'web' },
    pvDoubleBolt: { label: 'roz.prontera.info', title: 'Double Bolt', url: 'https://roz.prontera.info/skills/double-bolt', kind: 'web' },
    pvIndulge: { label: 'roz.prontera.info', title: 'Indulge', url: 'https://roz.prontera.info/skills/indulge', kind: 'web' },
    pvBuild: { label: 'roz.prontera.info', title: 'Sage | AutoBolt (60/60)', url: 'https://roz.prontera.info/builds/fb3976df-84ac-4b21-a975-0c7d76beb6ef', kind: 'web' },
    dbSandman: { label: 'rozerothai.com', title: 'ฐานข้อมูลมอนสเตอร์: Sandman', url: 'https://rozerothai.com/database/monsters/1165', kind: 'web' },
    owner: { label: 'ยืนยันในเกม', title: 'เจ้าของเว็บตรวจในเกม 22 ก.ย. 2026', url: '', kind: 'web' },
  },
};
