// Archer guide. Drafted 22 Sep 2026 from Downloads/roz-job-guides/archer.md,
// which cites every line to a clip timestamp or a web page. No Zero clip
// teaches an Archer skill order, so the two plans come from the skill tree's
// prerequisites (Hunter path) and from two published builds (Bard/Dancer path);
// the page says so on each. A Hunter clip filmed on another server (Ragnarok
// Gravity) was left out.
import type { ClassGuide } from './types';

export const archer: ClassGuide = {
  slug: 'archer',
  job: 'Archer',
  jobTh: 'อาร์เชอร์',
  from: 'Novice',
  gathered: '22 ก.ย. 2026',
  summary:
    'อาชีพแรกสายยิงธนูระยะไกล ตั้งบอทเก็บเลเวลได้สบาย เป็นทางผ่านไป Hunter หรือ Bard/Dancer ยังไม่มีคลิป Zero สอนลำดับอัพสกิล Archer โดยตรง',
  facts: [
    { text: 'เปลี่ยนเป็น Archer ได้ที่ Archer Guild ใน Archer Village ใกล้ Payon', cites: [['pjobs']] },
    { text: 'Job ตันที่ 50 ได้แต้มสกิล 49 แต้ม', cites: [['owner'], ['planner']] },
    {
      text: 'ที่ Base Lv 50 ไปต่อได้ทั้ง Hunter และ Bard (ตัวละครชาย) หรือ Dancer (ตัวละครหญิง)',
      cites: [['owner'], ['ryanBD', '00:02']],
    },
  ],
  path: ['archer'],
  equipJob: 'Archer',
  route: [
    { range: '1-9', text: 'ทำเควสเนื้อเรื่องช่วงต้นไปก่อน พอเลเวล 9 ให้วาร์ปไป Payon', cites: [['ncz', '01:51'], ['ncz', '02:05']] },
    { range: '9-15', text: 'แมพเห็ดแดงข้าง Payon ตั้งบอทตีได้เลย (ชื่อแมพฟังจากซับอัตโนมัติ น่าจะเป็นแมพ Spore)', maps: ['pay_fild08'], monsters: [1014], cites: [['ncz', '02:40'], ['ncz', '03:15']] },
    { range: '15-20', text: 'Prontera Sewer ชั้น 2 ตั้งบอทตีได้ทุกตัว', maps: ['prt_sewb2'], monsters: [1051], cites: [['ncz', '04:19'], ['ncz', '04:24']] },
    { range: '20-30', text: 'Creamy กับ Smokie แถว Geffen ลุ้น Creamy Card กับเสื้อ แมพยอดฮิต คนเยอะให้ย้าย channel', maps: ['gef_fild05'], monsters: [1018, 1056], cites: [['ncz', '04:59'], ['ncz', '05:43'], ['ncz', '06:22']] },
    { range: '30-35', text: 'Coco ที่ Geffen Field ตั้งบอทตีได้ทุกตัว', maps: ['gef_fild02'], monsters: [1104], cites: [['ncz', '06:51'], ['ncz', '07:49'], ['xroad', '01:34']] },
    { range: '30-40', text: 'Ant Hell ถ้าอยากเก็บเลเวลไวกว่า Coco และได้ลุ้นการ์ดมดราคาดี', maps: ['anthell02'], monsters: [1095], cites: [['ncz', '06:56'], ['ncz', '07:12'], ['ncz', '09:46']] },
    { range: '40-50', text: 'Orc Village, Steel Chonchon หรือแมพปลากระดูกแถว Comodo (ชื่อมอนตัวหลังฟังจากซับอัตโนมัติ ยังไม่รู้ว่าตัวไหน)', maps: ['gef_fild10', 'moc_fild13'], monsters: [1023, 1042], cites: [['ncz', '10:58'], ['ncz', '11:50'], ['ncz', '12:52'], ['ncz', '13:38']] },
    { range: '50', text: 'เปลี่ยนเป็นอาชีพสองได้ (Hunter, Bard หรือ Dancer)', cites: [['owner']] },
  ],
  routeNotes: [
    { text: 'อีกทางหนึ่ง: Xiendong ตั้งบอทที่ Poison Spore ไปถึงราวเลเวล 30-35 แล้วย้ายไป Coco ช่วง 30-35 เป็นช่วงที่ช้าที่สุด', cites: [['xroad', '01:12'], ['xroad', '01:40']] },
    { text: 'วาร์ป Kafra ฟรีถ้าเลเวลต่ำกว่า 40', cites: [['onenight', '09:03'], ['ncz', '02:20']] },
    { text: 'EXP ไม่ลดตามส่วนต่างเลเวล แต่อัตราดรอปโดนหักราว 50% ถ้าเลเวลห่างมอนมาก (มาจากคลิปเดียว)', cites: [['ncz', '10:04']] },
    {
      text: 'รีสกิลและรีสเตตัสฟรีได้ที่ NPC ในกำแพงเมือง Prontera ถ้าเลเวลยังไม่เกิน 40 เลย 40 แล้ว Xiendong บอกว่าต้องเสียเงิน อีกคลิปบอกแค่ว่ารีไม่ได้ สองคลิปพูดไม่ตรงกัน',
      cites: [['reset', '00:04'], ['reset', '01:07'], ['xroad', '02:39']],
    },
  ],
  gearByLevel: [
    { range: 'ทั้งทาง', slot: 'ลูกธนู', text: 'Silver Arrow ซื้อได้ที่ร้าน NPC ใน Payon แต่แพงกว่าร้านที่ผู้เล่นตั้งขาย ซองหนึ่งมี 500 ดอก', items: [1751, 12009], cites: [['onenight', '09:10'], ['onenight', '09:37'], ['onenight', '10:00']] },
    { range: '30+', slot: 'หมวก', text: 'Apple of Archer ให้ DEX +3 build Bard และ Dancer บน prontera ก็ใส่', items: [2285], cites: [['db'], ['pbard']] },
    { range: '33+', slot: 'อาวุธ', text: 'ธนูระดับ 3: Gakkung Bow (ATK 100) หรือ Arbalest (ATK 90, DEX +2) Archer ใส่ได้ทั้งคู่', items: [700084, 700113], cites: [['db']] },
    {
      range: '33+',
      slot: 'ออปชั่นธนู',
      text: 'หา ATK ให้สูง (สูงสุด 30) ตามด้วยสเตตัสรองที่ build ใช้ ถ้าได้บรรทัดที่ 3 ให้หาดาเมจต่อเผ่า Insect, Demi-Human หรือ Brute เพราะแมพเก็บเลเวลตั้งแต่ราว 33 เป็นมอนสามเผ่านี้เยอะ',
      cites: [['hbow', '00:19'], ['hbow', '00:29']],
    },
  ],
  strengths: [
    { text: 'ยิงได้จากระยะไกล', cites: [['pjobs']] },
    { text: 'ตั้งบอทได้สบาย บอทเปิดซองธนูให้เองเมื่อลูกหมด แค่มีซองในกระเป๋า (ต้องติ๊กให้ใช้ไอเทมอัตโนมัติ)', cites: [['onenight', '10:23'], ['kamon', '14:11']] },
  ],
  weaknesses: [
    { text: 'สกิลของ Archer แรงแค่ราว 1 ใน 10 ของสกิล Hunter (จากคลิปทดสอบดาเมจของ Hunter)', cites: [['hskill', '03:19']] },
    { text: 'ต้องซื้อลูกธนูตลอด ลูกธนูหนักดอกละ 0.1 ถ้าแกะซองทิ้งไว้เยอะตัวจะหนัก', cites: [['onenight', '10:37'], ['onenight', '10:40']] },
  ],
  builds: [
    {
      id: 'to-hunter',
      name: 'ทางผ่านไป Hunter (Focused Arrow Strike)',
      tag: 'สายหลัก',
      pickIf: 'จะไปต่อเป็น Hunter',
      idea: {
        text: 'Hunter ใน Zero ใช้หลักๆ Focused Arrow Strike, Falcon Eyes และ Wind Walker และเปิด Improve Concentration เป็นบัฟ ช่วง Archer จึงเก็บสกิลที่เป็นเงื่อนไขของสามสกิลนี้ให้ครบ',
        cites: [['vrvsch', '01:37'], ['shank', '01:28']],
      },
      stats: [
        { who: 'Luki build บน prontera (ยังไม่จบ)', agi: '17', int: '10', dex: '30', note: 'ที่เหลือ 1 · ใช้ Great Bow · เป็น build กลางทาง ไม่ได้บอกว่าจะไปอาชีพไหน', cites: [['pluki']] },
      ],
      statNotes: [
        { text: 'ช่วงเริ่มเล่นลง DEX ราว 20 ก่อนให้ตีโดน แล้วค่อยรีสเตตัสฟรีก่อนเลเวล 40', cites: [['xmeta', '06:15'], ['xmeta', '06:26']] },
        { text: 'สัดส่วนสุดท้ายดูหน้า Hunter DEX เพิ่มดาเมจ Focused Arrow Strike ชัดเจน', cites: [['hskill', '02:00']] },
      ],
      skills: [
        { skill: "Owl's Eye", level: 10, why: 'DEX +10 และเป็นเงื่อนไขของ Falcon Eyes', cites: [['db']] },
        { skill: "Vulture's Eye", level: 10, why: 'ระยะยิงกับ HIT และเป็นเงื่อนไขของ Double Strafe กับ Falcon Eyes', cites: [['db']] },
        { skill: 'Improve Concentration', level: 10, why: 'บัฟ AGI/DEX และเป็นเงื่อนไขของ Focused Arrow Strike กับ Falcon Eyes', cites: [['db'], ['vrvsch', '01:37']] },
        { skill: 'Double Strafe', level: 5, why: 'เงื่อนไขของ Focused Arrow Strike', cites: [['db']] },
      ],
      skillNotes: [
        { text: 'rozeroplanner คำนวณว่า Improve Concentration Lv 10 เพิ่ม AGI และ DEX 12%', cites: [['planner']] },
      ],
      plan: {
        picks: {
          archer: { "Owl's Eye": 10, "Vulture's Eye": 10, 'Improve Concentration': 10, 'Double Strafe': 5 },
        },
        basis: { text: 'ไม่ใช่คำแนะนำจากคลิป คำนวณจากเงื่อนไขสกิล Hunter ในฐานข้อมูลเว็บ รวม 35 แต้ม', cites: [['db']] },
        leftover: { text: 'อีก 14 แต้มยังไม่มีคลิป Zero บอกว่าควรลงที่ไหน', cites: [['db']] },
      },
      cautions: [
        { text: 'build Luki มี Double Strafe 5 ทั้งที่ Vulture\'s Eye แค่ 9 แต่ฐานข้อมูลเราบอกว่าต้องมี Vulture\'s Eye 10 ก่อน ยังไม่รู้ว่าอันไหนตรงกับเกม', cites: [['pluki'], ['db']] },
      ],
    },
    {
      id: 'to-bard-dancer',
      name: 'ทางผ่านไป Bard / Dancer (Arrow Vulcan)',
      pickIf: 'จะไปต่อเป็น Bard หรือ Dancer',
      idea: {
        text: 'Arrow Vulcan ต้องมี Arrow Shower 5 กับ Double Strafe 5 จากช่วง Archer ช่วงนี้จึงเก็บสกิลยิงไว้ให้ครบ',
        cites: [['db']],
      },
      skills: [
        { skill: 'Double Strafe', level: 10, cites: [['pbard'], ['pdancer']] },
        { skill: "Owl's Eye", level: 10, cites: [['pbard'], ['pdancer']] },
        { skill: 'Arrow Repel', level: 1, cites: [['pbard'], ['pdancer']] },
        { skill: 'Arrow Shower', level: 9, cites: [['pbard'], ['pdancer']] },
        { skill: "Vulture's Eye", level: 10, cites: [['pbard'], ['pdancer']] },
        { skill: 'Arrow Crafting', level: 1, cites: [['pbard'], ['pdancer']] },
        { skill: 'Improve Concentration', level: 10, cites: [['pbard'], ['pdancer']] },
      ],
      skillNotes: [
        { text: 'สเตตัส ของ และแมพหลังเปลี่ยนอาชีพ ดูหน้า Bard และ Dancer', cites: [['ryanBD', '00:02']] },
      ],
      plan: {
        picks: {
          archer: { 'Double Strafe': 10, "Owl's Eye": 10, 'Arrow Repel': 1, 'Arrow Shower': 9, "Vulture's Eye": 10, 'Arrow Crafting': 1, 'Improve Concentration': 10 },
        },
        basis: {
          text: 'สกิล Archer ของ build Bard และ Dancer บน prontera ที่ลงเหมือนกันทุกตัว บวกกันได้ 51 แต่ Arrow Repel กับ Arrow Crafting เป็นสกิลเควสที่ไม่กินแต้ม จึงพอดี 49',
          cites: [['pbard'], ['pdancer'], ['planner'], ['db']],
        },
      },
    },
    {
      id: 'arrow-shower',
      name: 'สาย Arrow Shower ฟาร์มเป็นกลุ่ม',
      pickIf: 'อยากดึงมอนเป็นกลุ่มแล้วยิงวงกว้าง',
      idea: { text: 'มีคลิปสอนยิง Arrow Shower ดึงมอนที่ Orc เพื่อเก็บเลเวลไว', cites: [['mob']] },
      missing: 'คลิปนี้ไม่มีคำบรรยายให้ดึง ยังไม่มีข้อมูลสกิล สเตตัส หรือของ',
    },
  ],
  gaps: [
    'ยังไม่มีคลิป Zero สอนลำดับอัพสกิล Archer โดยตรง แผนสาย Hunter มาจากเงื่อนไขสกิล ไม่ใช่คำแนะนำของผู้เล่น',
    'แต้มที่เหลือ 14 แต้มในทางผ่าน Hunter ยังไม่มีใครบอกว่าควรลงอะไร',
    'ยังไม่มีข้อมูลการเล่นปาร์ตี้และ MVP ช่วงอาชีพแรก',
    'Double Strafe ต้อง Vulture\'s Eye 10 จริงไหม build บนเว็บอื่นกับฐานข้อมูลเราไม่ตรงกัน',
  ],
  sources: {
    ncz: { label: 'NCZ', title: 'Recommended Leveling Maps Lv. 1-50', url: 'https://www.youtube.com/watch?v=IScycVE-tf8', kind: 'clip', lang: 'th' },
    onenight: { label: 'OneNightsz', title: 'Ragnarok Zero Global มือใหม่ | รีสเตตัส หาเงิน ตั้งบอท และเรื่องสำคัญที่ต้องรู้!', url: 'https://www.youtube.com/watch?v=4D5XxK_NfjQ', kind: 'clip', lang: 'th' },
    kamon: { label: 'KamonWay', title: "Ragnarok Zero: Global (ROZG) Beginner's Guide", url: 'https://www.youtube.com/watch?v=_8VlLdO7TXw', kind: 'clip', lang: 'th' },
    hskill: { label: 'hellyy', title: 'Hunter Skill Guide & Damage Test | AGI/DEX vs Falconer Builds', url: 'https://www.youtube.com/watch?v=aKUY2E5-_EU', kind: 'clip', lang: 'en' },
    hbow: { label: 'hellyy', title: 'Hunter Guide | Best Bows, Cards & Affixes', url: 'https://www.youtube.com/watch?v=fGg65Z7MOq0', kind: 'clip', lang: 'en' },
    vrvsch: { label: 'VRVSCH', title: 'Ragnarok Zero Global: INSANE Focus Hunter Build Review!!', url: 'https://www.youtube.com/watch?v=R0RJRtGS75c', kind: 'clip', lang: 'th' },
    shank: { label: 'แชงค์888', title: 'Ragnarok Zero Hunter Focus Arrow Strike Build: Gear and Stats', url: 'https://www.youtube.com/watch?v=fwomJmqy0i4', kind: 'clip', lang: 'th' },
    reset: { label: 'แชงค์888', title: 'Ragnarok Zero: How to Free Reset Skills and Stats Before Level 40', url: 'https://www.youtube.com/watch?v=lRGGsRGUKYY', kind: 'clip', lang: 'th' },
    ryanBD: { label: 'Ryan Geldun', title: 'Dancer & Bard in Ragnarok Zero Global', url: 'https://www.youtube.com/watch?v=KEIXN24Rh-I', kind: 'clip', lang: 'en' },
    xmeta: { label: 'Xiendong', title: 'Why Taiwan Players Build These Stats', url: 'https://www.youtube.com/watch?v=T5bjOqQomUc', kind: 'clip', lang: 'en' },
    xroad: { label: 'Xiendong', title: 'My Current 1–60 Levelling Roadmap', url: 'https://www.youtube.com/watch?v=7ymM15xvYAY', kind: 'clip', lang: 'en' },
    mob: { label: 'YouTube', title: 'Archer Guide – How to Mob with Arrow Shower | Fast Leveling at Orcs', url: 'https://www.youtube.com/watch?v=kOvpkWSdcP0', kind: 'clip', lang: 'en' },
    pjobs: { label: 'roz.prontera.info', title: 'Jobs', url: 'https://roz.prontera.info/jobs', kind: 'web' },
    pluki: { label: 'roz.prontera.info', title: 'Luki build (Archer)', url: 'https://roz.prontera.info/builds/7f95d684-cb37-404c-a228-0ef6ffe1fd63', kind: 'web' },
    pbard: { label: 'roz.prontera.info', title: 'build Bard/Dancer', url: 'https://roz.prontera.info/builds/82bb8683-1a36-405f-8a49-58f8b08c0fec', kind: 'web' },
    pdancer: { label: 'roz.prontera.info', title: 'build Bard/Dancer (ตัวที่สอง)', url: 'https://roz.prontera.info/builds/b68ace02-f33d-4643-97c0-ae1e26b6562a', kind: 'web' },
    db: { label: 'rozerothai.com', title: 'ฐานข้อมูลสกิลและไอเทม', url: 'https://rozerothai.com/database/skills', kind: 'web' },
    planner: { label: 'rozeroplanner', title: 'RO Zero skill planner', url: 'https://rozeroplanner.com/', kind: 'web' },
    owner: { label: 'ยืนยันในเกม', title: 'เจ้าของเว็บตรวจในเกม 22 ก.ย. 2026', url: '', kind: 'web' },
  },
};
