// Wizard guide. Drafted 22 Sep 2026 from Downloads/roz-job-guides/wizard.md
// and mage.md (levelling to 50), which cite every line to a clip timestamp or
// a web page. Only one clip was recorded on Global by a Wizard player
// (ZixmaOne, Napalm Vulcan); Ryan Geldun comments on someone else's pre-launch
// footage, and three builds come from roz.prontera.info's planner. Items,
// monsters and skills were checked against the site database.
import type { ClassGuide } from './types';

export const wizard: ClassGuide = {
  slug: 'wizard',
  job: 'Wizard',
  jobTh: 'วิซาร์ด',
  from: 'Mage',
  gathered: '22 ก.ย. 2026',
  summary:
    'อาชีพสองของ Mage สายเวทโจมตี สายหลักตอนนี้คือ Napalm Vulcan คู่กับ Soul Drain ที่ได้ SP คืนทุกครั้งที่ปิดมอน ปล่อยบอททั้งคืนได้โดยไม่ใช้บัฟเงินจริง',
  facts: [
    { text: 'เปลี่ยนเป็น Wizard ได้ที่ Base Lv 50 Job ตันที่ 70 ได้แต้มสกิล 69 แต้ม', cites: [['owner']] },
    {
      text: 'Napalm Vulcan, Mystical Amplification, Soul Drain, Gravitational Field, Ganbantein อยู่ในผังสกิล Wizard เลย ได้ตั้งแต่เปลี่ยนอาชีพ',
      cites: [['owner'], ['tako', '04:50'], ['ryan', '04:06']],
    },
    {
      text: 'Mystical Amplification ใน Zero เป็นบัฟอยู่ได้นาน 5 นาที ไม่ใช่แรงแค่ครั้งถัดไป roz.prontera.info ระบุ MATK +5% ต่อเลเวล (Lv 10 = +50%)',
      cites: [['tako', '05:00'], ['ryan', '05:20'], ['pvMA']],
    },
  ],
  path: ['mage', 'wizard'],
  equipJob: 'Wizard',
  route: [
    { range: '1-20', text: 'ทำเควสหลักไปก่อน เควสให้ตี Baby Poring, งู, Pudding ไล่ไปตามลำดับ', cites: [['mimiw', '01:20'], ['ginger', '00:44'], ['ginger', '01:28']] },
    { range: '~10-50', text: 'Parasite ที่ Kalala Swamp in Umbala ใช้ Earth Spike ตี ฟาร์มยาวได้ถึงเลเวล 50 ตัว Elite (C2 Parasite) ให้ EXP มากกว่ามาก', maps: ['um_fild03'], monsters: [1500, 2720], cites: [['ginger', '02:17'], ['zixma', '02:25'], ['resbakk', '02:47']] },
    { range: '~22-25', text: 'Coco ที่ Geffen Field หา Hood กับ Sandals ใช้ Fire Bolt ตี', maps: ['gef_fild09'], monsters: [1104], cites: [['zixma', '03:33'], ['ginger', '04:09']] },
    { range: 'ช่วงหาเสื้อ', text: 'Creamy หา Silk Robe', maps: ['gef_fild05'], monsters: [1018], cites: [['mimiw', '06:21']] },
    { range: 'หลังได้ของ', text: 'Steel Chonchon ที่ Sograt Desert ขึ้นช้ากว่า Parasite แต่ปล่อยบอทได้ไม่ต้องเฝ้าจอ', maps: ['moc_fild13'], monsters: [1042], cites: [['mimiw', '09:00'], ['ginger', '06:01']] },
    { range: '50', text: 'เปลี่ยนเป็น Wizard ใช้แต้มสกิล Mage ให้หมดก่อนเปลี่ยน', cites: [['owner'], ['kamonC2', '00:44']] },
    { range: '50+', text: 'แมพที่มีงู ZixmaOne ปล่อยบอทสาย Napalm Vulcan ได้ทั้งคืนโดยไม่เปิดบัฟ (คลิปไม่บอกชื่อแมพ)', cites: [['zixmaNV', '03:46'], ['zixmaNV', '07:02']] },
    {
      range: '~60',
      text: 'แมพที่ซับได้ยินว่า "Nort Field" มอนเลเวล 60 กว่า ตีไม่ค่อยแม่น EXP ต่อตัว 30,000-60,000 ต้องตีได้ราว 20,000 ต่อครั้งถึงจะไหว ในฐานข้อมูลเว็บ มอนเลเวลนี้อยู่ที่ Nordfeld Cave 2F (เทียบเอง ยังไม่ยืนยันว่าเป็นแมพในคลิป)',
      maps: ['nrd_dun02'],
      monsters: [25327, 25328],
      cites: [['zixmaNV', '08:41'], ['zixmaNV', '09:16'], ['zixmaNV', '09:51'], ['dbDwarf']],
    },
  ],
  routeNotes: [
    { text: 'Parasite อยู่แถบหนองน้ำฝั่งขวาของแมพ ยืนให้อยู่แนวตรงกับมัน (แนวตั้งหรือแนวนอน) ห้ามยืนเฉียง ไม่งั้นมันตีสวนถึง', cites: [['ginger', '02:34'], ['ginger', '03:18'], ['zixma', '03:10']] },
    { text: 'ก่อนเลเวล 40 รีเซ็ตสกิลกับสเตตัสได้ฟรี ที่ NPC แว่นดำในเมือง', cites: [['ginger', '01:44']] },
    { text: 'ถ้าจะเล่นสาย Napalm Vulcan ให้เก็บสกิลทางผ่านไว้ตั้งแต่ตอน Mage (ดูแผนสกิลในสายด้านล่าง)', cites: [['zixmaNV', '02:12']] },
  ],
  gearByLevel: [
    { range: 'ทั้งทาง', slot: 'อาวุธ', text: 'Shining Metal Staff +7 (สองมือ) จาก Shining Staff Box ในร้านเงินจริง', items: [640073, 200927], cites: [['mimiw', '05:38'], ['zixma', '01:51']] },
    { range: '~20-25', slot: 'เสื้อ', text: 'Silk Robe ดรอปจาก Creamy ออปชั่นที่ควรหา: HP, SP, อัตราฟื้น SP', items: [450345], cites: [['mimiw', '06:21'], ['mimiw', '07:20']] },
    { range: '~22-25', slot: 'ผ้าคลุม / รองเท้า', text: 'Hood กับ Sandals ดรอปจาก Coco หาออปชั่น HP จะได้ไม่โดน Parasite ตีทีเดียวตาย', items: [480414, 470257], cites: [['zixma', '04:07'], ['ginger', '04:18']] },
    { range: 'ช่วงบอท', slot: 'ออปชั่น', text: 'ตอนเปลี่ยนไปปล่อยบอท หาออปชั่น FLEE กับ Max SP แทน', cites: [['zixma', '05:03'], ['zixma', '10:24']] },
    { range: '50', slot: 'อาวุธ', text: 'คทาที่ได้ตอนเปลี่ยนอาชีพ มีอันเดียว ตี +7 ให้ติดแล้ว MATK สูงมาก', cites: [['zixmaNV', '09:30']] },
    { range: '50+', slot: 'เสื้อ', text: 'Nordfeld Soldier\'s Armor มี AGI ติดตัว หาออปชั่น FLEE ตี +9 ได้ FLEE เพิ่ม 10', items: [450588], cites: [['zixmaNV', '04:27'], ['zixmaNV', '04:37']] },
    { range: '50+', slot: 'รองเท้า', text: 'รองเท้าออปชั่น FLEE + HP ซับได้ยินว่า "รองเท้าฮิ้ว" น่าจะเป็น Hill Patrol Boots (ยังไม่ยืนยัน) ถ้าไม่ไหวใช้ Sandals ที่มี FLEE 15 ขึ้นไป', items: [470466, 470257], cites: [['zixmaNV', '05:47'], ['zixmaNV', '06:14']] },
    { range: '~60', slot: 'อาวุธ', text: 'ฟาร์มแมพ Boulder Dwarf ใส่ Boulder Dwarf Squad Leader Card 2 ใบ (ดาเมจเวทใส่ Boulder Dwarf +30%)', items: [300943], cites: [['zixmaNV', '09:37']] },
  ],
  strengths: [
    { text: 'Napalm Vulcan ดาเมจสูง ตีพื้นที่เล็ก 3x3 roz.prontera.info ระบุ Lv 5 = MATK 350% ×5 ฮิต ธาตุ Ghost', cites: [['ryan', '03:46'], ['tako', '05:54'], ['pvNapalm']] },
    { text: 'SP แทบไม่หมด เพราะ Soul Drain คืน SP ทุกครั้งที่ฆ่ามอนด้วยเวท Napalm Vulcan ก็ได้ผลเพราะเป็นสกิลเล็งเป้า', cites: [['tako', '06:13'], ['zixmaNV', '01:04'], ['ryan', '06:32']] },
    { text: 'ปล่อยบอทได้ทั้งวันทั้งคืนโดยไม่ใช้บัฟเงินจริง', cites: [['zixmaNV', '00:03'], ['zixmaNV', '00:25']] },
    { text: 'มีสกิลตีหมู่ เข้าคอนเทนต์ที่ต้องตีมอนเป็นกลุ่มได้ TakoyakiCh จัดไว้เทียร์ S', cites: [['tako', '05:59'], ['tako', '06:10']] },
  ],
  weaknesses: [
    { text: 'Napalm Vulcan มีคูลดาวน์นานกว่า after-cast delay นิดหน่อย กดรัวไม่ได้', cites: [['ryan', '07:03']] },
    { text: 'ต้องปิดมอนให้ได้ ถ้าปิดไม่ได้จะไม่ได้ SP คืน', cites: [['zixmaNV', '10:16']] },
    { text: 'ไม่มีทางฟื้น HP ในตัว ต้องใส่การ์ดที่ให้ใช้ Heal', cites: [['tako', '06:27']] },
    { text: 'Ryan Geldun มองว่าสายเวทช่วงท้ายเกมกินของมาก (ความเห็นจากประสบการณ์เกมอื่น)', cites: [['ryan', '05:58']] },
  ],
  builds: [
    {
      id: 'napalm-vulcan',
      name: 'สาย Napalm Vulcan บอท (AGI/INT)',
      tag: 'สายหลัก',
      pickIf: 'อยากปล่อยบอทเก็บเลเวลทั้งคืนโดยไม่ใช้บัฟเงินจริง',
      idea: {
        text: 'ใช้ Napalm Vulcan ปิดมอนเร็ว ให้ Soul Drain คืน SP ทุกตัวที่ฆ่า และทำ FLEE ให้สูงไว้หลบ ควรปิดมอนให้จบใน 2 ฮิต ถ้าต้อง 3 ฮิตจะเสี่ยง',
        cites: [['zixmaNV', '00:58'], ['zixmaNV', '01:50'], ['zixmaNV', '05:39'], ['zixmaNV', '10:45']],
      },
      stats: [
        { who: 'ZixmaOne', agi: '40', int: '75', dex: 'ไม่ลง', note: 'ซับได้ยินว่า "HI 40" น่าจะเป็น AGI · FLEE 320 ตอนไม่เปิดบัฟ', cites: [['zixmaNV', '01:26'], ['zixmaNV', '01:53']] },
        { who: 'ZixmaOne (ถ้าของยังไม่ดี)', agi: '60-70', int: '40-50', note: 'แลก FLEE กับความแรง ตีมอน 3 ฮิต หรือย้ายแมพ', cites: [['zixmaNV', '01:32']] },
      ],
      statNotes: [
        { text: 'ไม่ต้องลง DEX เพราะสกิลร่ายไวอยู่แล้ว', cites: [['zixmaNV', '02:08']] },
        { text: 'ถ้า FLEE ยังไม่พอ ให้ลดความแรงลงแล้วเพิ่ม AGI แทน', cites: [['zixmaNV', '02:00']] },
      ],
      skills: [
        { skill: 'Napalm Beat', level: 4, why: 'ทางผ่านไป Napalm Vulcan แต่ roz.prontera.info บอกว่าต้อง 5', cites: [['zixmaNV', '02:12'], ['pvNapalm']] },
        { skill: 'Soul Strike', level: 7, why: 'ซับได้ยินไม่ชัด แต่ Soul Drain ต้อง Soul Strike 7 จึงน่าจะเป็นตัวนี้', cites: [['zixmaNV', '02:15'], ['pvSoulDrain']] },
        { skill: 'Increase SP Recovery', level: 10, cites: [['zixmaNV', '02:18']] },
        { skill: 'Napalm Vulcan', level: 5, why: 'สกิลหลักที่ใช้ตี', cites: [['zixmaNV', '02:30'], ['zixmaNV', '02:41']] },
        { skill: 'Mystical Amplification', level: 10, why: 'บัฟเพิ่มความแรงเวท', cites: [['zixmaNV', '02:45']] },
        { skill: 'Soul Drain', level: 10, why: 'ได้ SP คืนเป็นเปอร์เซ็นต์ตอนฆ่ามอน', cites: [['zixmaNV', '02:49']] },
      ],
      skillNotes: [
        { text: 'คลิปใช้แค่ 3 สกิลนี้ในอาชีพสอง ที่เหลืออัพตามใจ เผื่อใช้ใน WoE หรือคอนเทนต์อื่น', cites: [['zixmaNV', '02:57'], ['zixmaNV', '03:01']] },
        { text: 'คลิปไม่ได้บอกเลเวลสกิลอาชีพสอง แผนนี้ใส่เลเวลเต็มตามบิลด์ใน roz.prontera.info ที่เลือก 3 สกิลนี้เต็มเหมือนกัน', cites: [['pvBuild70'], ['pvWoe']] },
      ],
      plan: {
        picks: {
          mage: { 'Napalm Beat': 4, 'Soul Strike': 7, 'Increase SP Recovery': 10 },
          wizard: { 'Napalm Vulcan': 5, 'Mystical Amplification': 10, 'Soul Drain': 10 },
        },
        basis: {
          text: 'สกิลที่ ZixmaOne บอก ช่วง Mage ครบตามคลิป ส่วนเลเวลอาชีพสองคลิปไม่บอก ใส่เต็มไว้ ตัววางแผนจะเพิ่ม Napalm Beat เป็น 5 ตามเงื่อนไขในผังสกิล',
          cites: [['zixmaNV', '02:12'], ['zixmaNV', '02:30'], ['pvNapalm']],
        },
        leftover: { text: 'แต้มที่เหลือ: คลิปบอกให้อัพตามใจ', cites: [['zixmaNV', '02:25'], ['zixmaNV', '03:01']] },
      },
      gear: [
        { slot: 'หมวก', text: 'ออปชั่น FLEE (20 ก็ได้) ได้ SP สูงติดมาด้วย การ์ดที่ใส่ฟังไม่ชัด', cites: [['zixmaNV', '03:22']] },
        { slot: 'อาวุธ', text: 'คทาอันไหนก็ได้ที่มีออปชั่น FLEE (หายาก) ใส่ Fur Seal Card 2 ใบ (FLEE +3 ต่อใบ) ถ้าหาได้ คทาที่ดีที่สุดสำหรับตีงูคือ MATK + FLEE + ตีธาตุ Poison หรือเผ่า Brute', items: [4312], cites: [['zixmaNV', '03:37'], ['zixmaNV', '03:46'], ['zixmaNV', '04:06']] },
        { slot: 'โล่', text: 'โล่ธรรมดาตีบวกนิดหน่อย การ์ดใส่ตามแมพที่ไป', cites: [['zixmaNV', '04:19']] },
        { slot: 'เสื้อ', text: 'Nordfeld Soldier\'s Armor ออปชั่น FLEE ตี +9 รวม FLEE 23 ใส่การ์ดที่ซับได้ยินว่า "ปูA" น่าจะเป็น Pupa Card (ใส่เพื่อบอท ไม่ใช่ PvP)', items: [450588, 4003], cites: [['zixmaNV', '04:27'], ['zixmaNV', '04:43'], ['zixmaNV', '04:57']] },
        { slot: 'ผ้าคลุม', text: 'ออปชั่น FLEE ก่อนแล้วตามด้วย HP ใส่ Shark Family Card ตอนนี้ ภายหลังจะเปลี่ยนเป็นการ์ด FLEE +20 (ชื่อฟังไม่ชัด) เพราะโบนัสกิจกรรมของ Shark Family จะหายไป', items: [300835], cites: [['zixmaNV', '05:02'], ['zixmaNV', '05:15']] },
        { slot: 'รองเท้า', text: 'ออปชั่น FLEE + HP ซับได้ยินว่า "รองเท้าฮิ้ว" น่าจะเป็น Hill Patrol Boots (ยังไม่ยืนยัน) ราคาหลักแสน ตี +7 แล้ว FLEE รวม 25-30 ถ้าไม่ไหวใช้ Sandals ที่มี FLEE 15 ขึ้นไป', items: [470466, 470257], cites: [['zixmaNV', '05:47'], ['zixmaNV', '06:00'], ['zixmaNV', '06:14']] },
        { slot: 'ประดับ', text: 'Creamy Card ไว้ Teleport กับ Vitata Card ไว้ Heal ไม่ต้องใช้ยา', items: [4040, 4053], cites: [['zixmaNV', '06:18'], ['zixmaNV', '06:24']] },
        { slot: 'Special Equipment', text: 'ซับได้ยินว่า "Chaming Link" ใส่ Steel Chonchon Egg Lv.2 (FLEE +9)', items: [313595], cites: [['zixmaNV', '06:34']] },
      ],
      play: [
        { text: 'บอทหน้าสกิลตั้ง Napalm Vulcan ทุก 0.5 วินาที หน้าบัฟตั้ง Mystical Amplification · Heal เมื่อ HP ต่ำกว่า 80%', cites: [['zixmaNV', '07:24'], ['zixmaNV', '07:32'], ['zixmaNV', '07:39']] },
        { text: 'ตั้ง Teleport เมื่อโดนดาเมจเกินค่าที่ตั้ง · ไม่ต้องตีมอนตัวใหญ่ที่ฆ่านาน', cites: [['zixmaNV', '08:32'], ['zixmaNV', '07:08']] },
        { text: 'ระวังเก็บอาวุธเยอะแล้วน้ำหนักเต็ม', cites: [['zixmaNV', '08:10']] },
      ],
      maps: [
        { text: 'แมพที่มีงู: บอทได้ทั้งคืนโดยไม่เปิดบัฟ (คลิปไม่บอกชื่อแมพ)', cites: [['zixmaNV', '03:46'], ['zixmaNV', '07:02']] },
        {
          text: 'แมพ "Nort Field" (น่าจะเป็น Nordfeld Cave 2F): ต้องตีได้ราว 20,000 ต่อครั้ง FLEE 300 ใช้รองเท้า FLEE + ฟื้น SP คทาจากเควสเปลี่ยนอาชีพ +7 ใส่ Boulder Dwarf Squad Leader Card 2 ใบ',
          cites: [['zixmaNV', '09:16'], ['zixmaNV', '09:21'], ['zixmaNV', '09:30'], ['zixmaNV', '09:37'], ['zixmaNV', '09:43']],
        },
      ],
      cautions: [
        { text: 'ที่แมพ Nordfeld ต้องเปิดบัฟ Challenge Drink กับ Small Mana Potion ไม่งั้นปิดมอนไม่ทันแล้วไม่ได้ SP คืน', cites: [['zixmaNV', '10:13'], ['zixmaNV', '10:22'], ['dbDrink']] },
        { text: 'Vitata Card ทำให้ทุกสกิลใช้ SP เพิ่ม 25%', cites: [['dbVitata']] },
        { text: 'เลเวล Napalm Beat ที่ต้องมี คลิปบอก 4 แต่ roz.prontera.info บอก 5 ยังไม่ได้ตรวจในเกม', cites: [['zixmaNV', '02:15'], ['pvNapalm']] },
      ],
    },
    {
      id: 'aoe',
      name: 'สายเวทหมู่ / Memorial Dungeon (Meteor Storm, Storm Gust)',
      pickIf: 'อยากตีมอนเป็นกลุ่มหรือโซโล Memorial Dungeon',
      idea: {
        text: 'จากฟุตเทจผู้เล่นเลเวล 80-86 ที่อัดก่อน Global เปิด (ไม่ใช่เซิร์ฟ Global): ใช้ Storm Gust คู่ Vitata Card ร่ายเสร็จก็ Heal ตัวเอง ใน GTB ใช้ Waterball ตีบอสกับ Lord of Vermilion เคลียร์ไข่ ใน Maya ใช้ Meteor Storm',
        cites: [['ryan', '01:50'], ['ryan', '03:14'], ['ryan', '04:20'], ['ryan', '15:13']],
      },
      stats: [
        { who: 'ฟุตเทจใน Ryan Geldun (Lv 80+)', agi: '70', vit: '30', int: '90', dex: '18', cites: [['ryan', '12:32'], ['ryan', '13:10']] },
      ],
      statNotes: [
        { text: 'Ryan สังเกตว่าคนเล่น Wizard ใน Zero ไม่ค่อยลง DEX น่าจะเพราะของและระบบร่ายแบบ Renewal', cites: [['ryan', '12:36']] },
      ],
      skills: [
        { skill: 'Meteor Storm', level: 10, cites: [['ryan', '12:06']] },
        { skill: 'Storm Gust', level: 10, cites: [['ryan', '12:06']] },
        { skill: 'Waterball', level: 5, cites: [['ryan', '12:06']] },
        { skill: 'Mystical Amplification', level: 'ไม่ระบุ', cites: [['ryan', '12:16']] },
        { skill: 'Soul Drain', level: 'ไม่ระบุ', cites: [['ryan', '12:16']] },
        { skill: 'Napalm Vulcan', level: 'ไม่ระบุ', cites: [['ryan', '12:16']] },
        { skill: 'Quagmire', level: 'ไม่ระบุ', why: 'Ryan บอกว่าเป็นสกิลที่ดี', cites: [['ryan', '12:22']] },
      ],
      skillNotes: [
        { text: 'ในฟุตเทจไม่ได้อัพ Lord of Vermilion', cites: [['ryan', '12:06']] },
        { text: 'Ryan มองว่าสกิลที่สำคัญจริงมีแค่ Storm Gust, Lord of Vermilion, Waterball, Meteor Storm และ Napalm Vulcan', cites: [['ryan', '04:36']] },
      ],
      plan: {
        picks: {
          wizard: { 'Meteor Storm': 10, 'Storm Gust': 10, Waterball: 5 },
        },
        basis: { text: 'เฉพาะ 3 สกิลที่เห็นในฟุตเทจว่าอัพเต็ม', cites: [['ryan', '12:06']] },
        leftover: { text: 'แต้มที่เหลือ: ฟุตเทจอัพ Mystical Amplification, Soul Drain, Napalm Vulcan และ Quagmire ด้วยแต่ไม่เห็นเลเวล', cites: [['ryan', '12:16'], ['ryan', '12:22']] },
      },
      gear: [
        { slot: 'อาวุธ', text: 'Oak Wand +12 ผู้ทำคลิปเรียกว่า "double activated" ในฐานข้อมูลมีทั้งแบบ ★★ และ ★★★ ไม่ยืนยันว่าเป็นแบบไหน', items: [550209, 550210], cites: [['ryan', '12:51']] },
        { slot: 'อาวุธ (อีกชุด)', text: 'คทาสองมือที่ Ryan เดาจากรูปว่าเป็น Staff of Blue Flame (ไม่แน่ใจ)', items: [2049], cites: [['ryan', '10:43'], ['ryan', '11:37']] },
        { slot: 'หมวก', text: 'หมวก +10 ให้ All Stats +3 และลด VCT (ไม่เห็นชื่อ) · อีกชุดใส่ Wanderer\'s Sakkat ที่เพิ่มความเร็วโจมตี Ryan เดาว่าใส่ให้ท่าร่ายเร็วขึ้น', items: [19361], cites: [['ryan', '13:05'], ['ryan', '08:29'], ['ryan', '08:52']] },
        { slot: 'รองเท้า', text: 'Loli Ruri Shoes +9 (FLEE +15 และ +9 ลดดีเลย์หลังตี 7%)', items: [22194], cites: [['ryan', '09:29'], ['ryan', '09:48']] },
        { slot: 'แหวน', text: 'Ryan คิดว่าเป็น Subjugation Team\'s Ring', items: [28539], cites: [['ryan', '10:03']] },
      ],
      play: [
        { text: 'ร่าย Heaven\'s Drive ระหว่างรอ Meteor Storm ตก และซ้อน Meteor Storm ได้', cites: [['ryan', '16:04']] },
        { text: 'มี MDEF จากของและสเตตัสพอที่จะไม่โดนดาเมจจากมอนลูก', cites: [['ryan', '16:48']] },
      ],
      cautions: [
        { text: 'ทั้งหมดมาจากฟุตเทจผู้เล่นอื่นก่อน Global เปิด ไม่รู้ว่าอัดเซิร์ฟไหน ใช้เป็นแนวทางเท่านั้น', cites: [['ryan', '05:47'], ['ryan', '15:13']] },
      ],
    },
    {
      id: 'planner-70',
      name: 'บิลด์ Job 70 จากตัววางแผน',
      pickIf: 'อยากได้แผนสกิลครบทั้ง 49 + 69 แต้ม',
      idea: {
        text: 'บิลด์ "Wizard Lvl 70" ที่ผู้เล่นทำไว้ใน roz.prontera.info ใช้แต้มครบพอดี มีทั้ง Napalm Vulcan, Soul Drain, Meteor Storm, Lord of Vermilion มีแต่สกิล ไม่มีของและสเตตัส ยังไม่มีคลิปทดสอบ',
        cites: [['pvBuild70']],
      },
      skills: [
        { skill: 'Safety Wall', level: 10, cites: [['pvBuild70']] },
        { skill: 'Soul Strike', level: 7, cites: [['pvBuild70']] },
        { skill: 'Napalm Beat', level: 7, cites: [['pvBuild70']] },
        { skill: 'Increase SP Recovery', level: 8, cites: [['pvBuild70']] },
        { skill: 'Lord of Vermilion', level: 10, cites: [['pvBuild70']] },
        { skill: 'Meteor Storm', level: 10, cites: [['pvBuild70']] },
        { skill: 'Soul Drain', level: 10, cites: [['pvBuild70']] },
        { skill: 'Mystical Amplification', level: 10, cites: [['pvBuild70']] },
        { skill: 'Napalm Vulcan', level: 5, cites: [['pvBuild70']] },
        { skill: 'Gravitational Field', level: 5, cites: [['pvBuild70']] },
        { skill: 'Heaven\'s Drive', level: 5, cites: [['pvBuild70']] },
        { skill: 'Jupitel Thunder', level: 5, cites: [['pvBuild70']] },
        { skill: 'Storm Gust', level: 3, cites: [['pvBuild70']] },
      ],
      plan: {
        picks: {
          mage: {
            'Stone Curse': 1, 'Cold Bolt': 5, 'Lightning Bolt': 4, 'Napalm Beat': 7, 'Fire Bolt': 1, Sight: 1, 'Earth Spike': 3,
            'Frost Diver': 1, 'Thunder Storm': 1, 'Soul Strike': 7, 'Energy Coat': 1, 'Increase SP Recovery': 8, 'Safety Wall': 10,
          },
          wizard: {
            'Ice Wall': 1, 'Jupitel Thunder': 5, "Heaven's Drive": 5, Sightrasher: 2, 'Lord of Vermilion': 10, Quagmire: 2, 'Meteor Storm': 10,
            'Stave Crasher': 1, 'Soul Drain': 10, 'Gravitational Field': 5, 'Napalm Vulcan': 5, 'Mystical Amplification': 10, 'Storm Gust': 3,
          },
        },
        basis: { text: 'ครบทุกสกิลตามบิลด์ของ Hustensaft ใน roz.prontera.info', cites: [['pvBuild70']] },
      },
    },
    {
      id: 'fire',
      name: 'บิลด์ INT/DEX จากตัววางแผน',
      pickIf: 'อยากเล่นสาย INT/DEX แบบคลาสสิก เน้นเวทไฟและ Meteor Storm',
      idea: {
        text: 'บิลด์ "Wizard build" ใน roz.prontera.info ลง INT 80 DEX 37 เอาเวทใหญ่หลายตัวเต็ม ยังไม่มีคลิปทดสอบ และหน้าบิลด์แสดงสกิลไม่ครบ',
        cites: [['pvBuildGen']],
      },
      stats: [
        { who: 'roz.prontera.info', int: '80', dex: '37', note: 'ที่เหลือ 1', cites: [['pvBuildGen']] },
      ],
      skills: [
        { skill: 'Fire Bolt', level: 10, cites: [['pvBuildGen']] },
        { skill: 'Fire Wall', level: 10, cites: [['pvBuildGen']] },
        { skill: 'Fire Ball', level: 5, cites: [['pvBuildGen']] },
        { skill: 'Earth Spike', level: 5, cites: [['pvBuildGen']] },
        { skill: 'Increase SP Recovery', level: 5, cites: [['pvBuildGen']] },
        { skill: 'Jupitel Thunder', level: 10, cites: [['pvBuildGen']] },
        { skill: 'Meteor Storm', level: 10, cites: [['pvBuildGen']] },
        { skill: 'Storm Gust', level: 10, cites: [['pvBuildGen']] },
        { skill: 'Mystical Amplification', level: 10, cites: [['pvBuildGen']] },
        { skill: 'Waterball', level: 5, cites: [['pvBuildGen']] },
        { skill: 'Gravitational Field', level: 5, cites: [['pvBuildGen']] },
      ],
      plan: {
        picks: {
          mage: { 'Fire Bolt': 10, 'Fire Wall': 10, 'Fire Ball': 5, 'Earth Spike': 5, 'Increase SP Recovery': 5 },
          wizard: { 'Jupitel Thunder': 10, 'Meteor Storm': 10, 'Storm Gust': 10, 'Mystical Amplification': 10, Waterball: 5, 'Gravitational Field': 5 },
        },
        basis: { text: 'เฉพาะสกิลที่หน้าบิลด์แสดง', cites: [['pvBuildGen']] },
        leftover: { text: 'แต้มที่เหลือในอาชีพสอง: หน้าบิลด์ไม่ได้แสดงครบ ยังไม่รู้ว่าผู้ทำลงอะไร', cites: [['pvBuildGen']] },
      },
    },
    {
      id: 'woe',
      name: 'สาย WoE (จากตัววางแผน)',
      pickIf: 'จะลง War of Emperium',
      idea: {
        text: 'บิลด์ "WOE DEF" ใน roz.prontera.info ลง VIT 17 INT 80 DEX 30 มีทั้งสกิลและของครบ แต่ไม่ได้ระบุออปชั่นสุ่ม ยังไม่มีคลิปทดสอบ',
        cites: [['pvWoe']],
      },
      stats: [
        { who: 'roz.prontera.info', vit: '17', int: '80', dex: '30', cites: [['pvWoe']] },
      ],
      skills: [
        { skill: 'Safety Wall', level: 10, cites: [['pvWoe']] },
        { skill: 'Soul Drain', level: 10, cites: [['pvWoe']] },
        { skill: 'Napalm Vulcan', level: 5, cites: [['pvWoe']] },
        { skill: 'Mystical Amplification', level: 10, cites: [['pvWoe']] },
        { skill: 'Storm Gust', level: 10, cites: [['pvWoe']] },
        { skill: 'Meteor Storm', level: 10, cites: [['pvWoe']] },
        { skill: 'Quagmire', level: 4, cites: [['pvWoe']] },
        { skill: 'Ganbantein', level: 1, cites: [['pvWoe']] },
      ],
      plan: {
        picks: {
          mage: { 'Safety Wall': 10 },
          wizard: { 'Soul Drain': 10, 'Napalm Vulcan': 5, 'Mystical Amplification': 10, 'Storm Gust': 10, 'Meteor Storm': 10, Quagmire: 4, Ganbantein: 1 },
        },
        basis: { text: 'สกิลหลักตามหน้าบิลด์ WOE DEF', cites: [['pvWoe']] },
      },
      gear: [
        { slot: 'หมวก', text: 'Nordfeld Platinum Helm +7 · หมวกกลาง Geek Glasses · หมวกล่าง Poring Village Green Onion (roz.prontera.info เรียก Poring Village Leek)', items: [401510, 2243, 19238], cites: [['pvWoe']] },
        { slot: 'อาวุธ', text: 'Arc Wand +9 ใส่ Boulder Dwarf Squad Leader Card 2 ใบ', items: [300943], cites: [['pvWoe']] },
        { slot: 'โล่', text: 'Silver Guard +9 ใส่ Thara Frog Card', items: [460070, 4058], cites: [['pvWoe']] },
        { slot: 'เสื้อ', text: 'Nordfeld Soldier\'s Armor +9 ใส่ Pupa Card', items: [450588, 4003], cites: [['pvWoe']] },
        { slot: 'ผ้าคลุม', text: 'Subjugation Team\'s Shoulder Belt +9 ใส่ Orc Baby Card', items: [20867, 4375], cites: [['pvWoe']] },
        { slot: 'รองเท้า', text: 'Hill Patrol Boots +9 ใส่ Matyr Card', items: [470466, 4097], cites: [['pvWoe']] },
        { slot: 'แหวน', text: 'Subjugation Team\'s Ring 2 วง ใส่ Smokie Card กับ Zerom Card', items: [28539, 4044, 4064], cites: [['pvWoe']] },
      ],
    },
  ],
  gaps: [
    'ยังไม่มีคลิปสาย Storm Gust / Meteor Storm ที่อัดใน Global จริง สายเวทหมู่มาจากฟุตเทจก่อนเกมเปิด',
    'คลิป Napalm Vulcan ไม่บอกเลเวลสกิลอาชีพสอง และไม่บอกชื่อแมพงูที่ใช้บอท',
    'แมพเก็บเลเวลช่วง 50-70 ยังยืนยันชื่อแมพไม่ได้ ชื่อที่ได้ยินในซับยังคลุมเครือ',
    'Napalm Vulcan ต้อง Napalm Beat 4 หรือ 5 แหล่งข้อมูลยังขัดกัน',
    'ยังไม่มีข้อมูลสาย MVP',
  ],
  sources: {
    zixmaNV: { label: 'ZixmaOne', title: 'Napalm Vulcan Skill Guide - AFK botting with zero cash buffs', url: 'https://www.youtube.com/watch?v=Wmli0mZk-Mo', kind: 'clip', lang: 'th' },
    ryan: { label: 'Ryan Geldun', title: 'Wizard build in Ragnarok Zero Global (ฟุตเทจผู้เล่นอื่นก่อน Global เปิด)', url: 'https://www.youtube.com/watch?v=4tlC9AeA2e0', kind: 'clip', lang: 'en' },
    tako: { label: 'TakoyakiCh', title: 'จัด Tierlist Class2 ในโลก RO-Zero', url: 'https://www.youtube.com/watch?v=Y7MKIY0KiYo', kind: 'clip', lang: 'th' },
    ginger: { label: 'Ginger', title: 'ไกด์เก็บเลเวล Mage | Ragnarok Zero Global', url: 'https://www.youtube.com/watch?v=-lfhb7us4ec', kind: 'clip', lang: 'th' },
    mimiw: { label: 'MimiwPK', title: 'A Step-by-Step Guide for Beginners Playing Mage', url: 'https://www.youtube.com/watch?v=b3Vq6nQMVv4', kind: 'clip', lang: 'en' },
    zixma: { label: 'ZixmaOne', title: 'แนวทางเล่น Mage โผล่มาแปปเดียวเวลอัพรัวๆ', url: 'https://www.youtube.com/watch?v=M1cnBmEKYQw', kind: 'clip', lang: 'th' },
    resbakk: { label: 'Resbakk Gaming', title: 'RAGNAROK ZERO: GLOBAL | BEGINNERS GUIDE', url: 'https://www.youtube.com/watch?v=IKItqq2QXR8', kind: 'clip', lang: 'en' },
    kamonC2: { label: 'KamonWay', title: 'How to Change to Class 2 for Every Job in 3 Minutes', url: 'https://www.youtube.com/watch?v=iTxVgyVGCbc', kind: 'clip', lang: 'en' },
    pvNapalm: { label: 'roz.prontera.info', title: 'Napalm Vulcan', url: 'https://roz.prontera.info/skills/napalm-vulcan', kind: 'web' },
    pvSoulDrain: { label: 'roz.prontera.info', title: 'Soul Drain', url: 'https://roz.prontera.info/skills/soul-drain', kind: 'web' },
    pvMA: { label: 'roz.prontera.info', title: 'Mystical Amplification', url: 'https://roz.prontera.info/skills/mystical-amplification', kind: 'web' },
    pvBuild70: { label: 'roz.prontera.info', title: 'บิลด์ "Wizard Lvl 70" (Hustensaft)', url: 'https://roz.prontera.info/builds/91c9e378-8496-4a21-abe0-0f84c8f01f6c', kind: 'web' },
    pvBuildGen: { label: 'roz.prontera.info', title: 'บิลด์ "Wizard build"', url: 'https://roz.prontera.info/builds/7c648b9a-a160-4a28-bd64-e211d9e8f961', kind: 'web' },
    pvWoe: { label: 'roz.prontera.info', title: 'บิลด์ "WOE DEF"', url: 'https://roz.prontera.info/builds/685d1dd5-5899-404b-8643-9f500bbb6c6e', kind: 'web' },
    dbDwarf: { label: 'rozerothai.com', title: 'ฐานข้อมูลมอนสเตอร์: Boulder Dwarf Hammer (Armored)', url: 'https://rozerothai.com/database/monsters/25327', kind: 'web' },
    dbDrink: { label: 'rozerothai.com', title: 'ฐานข้อมูลไอเทม: Challenge Drink 10ea Box', url: 'https://rozerothai.com/database/items/200893', kind: 'web' },
    dbVitata: { label: 'rozerothai.com', title: 'ฐานข้อมูลการ์ด: Vitata Card', url: 'https://rozerothai.com/database/cards/4053', kind: 'web' },
    owner: { label: 'ยืนยันในเกม', title: 'เจ้าของเว็บตรวจในเกม 22 ก.ย. 2026', url: '', kind: 'web' },
  },
};
