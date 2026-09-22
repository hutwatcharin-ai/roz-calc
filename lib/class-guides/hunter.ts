// Hunter guide. Drafted 22 Sep 2026 from Downloads/roz-job-guides/hunter.md
// and archer.md, which cite every line to a clip timestamp or a web page. No
// Zero clip gives a skill order step by step: the Focused Arrow Strike plan
// holds only the skills and levels the clips name, and the page adds the
// prerequisites. A Hunter clip filmed on another server (Ragnarok Gravity) was
// left out.
import type { ClassGuide } from './types';

export const hunter: ClassGuide = {
  slug: 'hunter',
  job: 'Hunter',
  jobTh: 'ฮันเตอร์',
  from: 'Archer',
  gathered: '22 ก.ย. 2026',
  summary:
    'อาชีพสองของ Archer สายฟาร์มยิงไกล สกิลหลักคือ Focused Arrow Strike ยิงเป้าเดียวแล้วดาเมจกระจายรอบตัว ติดคริได้ ทุกคลิป Zero เล่นสายนี้',
  facts: [
    { text: 'เปลี่ยนเป็น Hunter ได้ที่ Base Lv 50', cites: [['owner']] },
    { text: 'Job ตันที่ 70 ได้แต้มสกิล 69 แต้ม', cites: [['owner'], ['planner']] },
    {
      text: 'Focused Arrow Strike, Falcon Eyes, Wind Walker และ Falcon Assault อยู่ในผังสกิล Hunter เลย ได้ตั้งแต่เปลี่ยนอาชีพ',
      cites: [['owner'], ['hskill', '00:57'], ['vrvsch', '01:37']],
    },
  ],
  path: ['archer', 'hunter'],
  equipJob: 'Hunter',
  route: [
    { range: '1-9', text: 'ทำเควสเนื้อเรื่องช่วงต้นไปก่อน พอเลเวล 9 ให้วาร์ปไป Payon', cites: [['ncz', '01:51'], ['ncz', '02:05']] },
    { range: '9-15', text: 'แมพเห็ดแดงข้าง Payon ตั้งบอทตีได้เลย (ชื่อแมพฟังจากซับอัตโนมัติ น่าจะเป็นแมพ Spore)', maps: ['pay_fild08'], monsters: [1014], cites: [['ncz', '02:40'], ['ncz', '03:15']] },
    { range: '15-20', text: 'Prontera Sewer ชั้น 2 ตั้งบอทตีได้ทุกตัว', maps: ['prt_sewb2'], monsters: [1051], cites: [['ncz', '04:19'], ['ncz', '04:24']] },
    { range: '20-30', text: 'Creamy กับ Smokie แถว Geffen ลุ้น Creamy Card กับเสื้อ คนเยอะให้ย้าย channel', maps: ['gef_fild05'], monsters: [1018, 1056], cites: [['ncz', '04:59'], ['ncz', '05:43'], ['ncz', '06:22']] },
    { range: '30-35', text: 'Coco ที่ Geffen Field ตั้งบอทตีได้ทุกตัว', maps: ['gef_fild02'], monsters: [1104], cites: [['ncz', '06:51'], ['xroad', '01:34']] },
    { range: '30-40', text: 'Ant Hell ถ้าอยากเก็บเลเวลไวกว่า Coco และได้ลุ้นการ์ดมด', maps: ['anthell02'], monsters: [1095], cites: [['ncz', '06:56'], ['ncz', '07:12']] },
    { range: '40-50', text: 'Orc Village หรือ Steel Chonchon', maps: ['gef_fild10', 'moc_fild13'], monsters: [1023, 1042], cites: [['ncz', '10:58'], ['ncz', '11:50'], ['ncz', '12:52']] },
    { range: '50', text: 'เปลี่ยนเป็น Hunter', cites: [['owner']] },
    {
      range: '50-60',
      text: 'Nordfeld Cave 2F ต้องเลเวล 50 ถึงเข้าได้ Xiendong เก็บที่นี่จนถึง 60 VRVSCH ก็ถ่ายคลิปที่นี่ แต่บอกว่าคนเยอะมาก มอนน้อย',
      maps: ['nrd_dun02'],
      monsters: [25327],
      cites: [['xfarm', '04:18'], ['xroad', '06:12'], ['vrvsch', '00:02'], ['vrvsch', '11:27']],
    },
  ],
  routeNotes: [
    { text: 'อีกทางหนึ่ง: Xiendong ตั้งบอทที่ Poison Spore ไปถึงราวเลเวล 30-35 แล้วย้ายไป Coco ช่วง 30-35 ช้าที่สุด', cites: [['xroad', '01:12'], ['xroad', '01:40']] },
    { text: 'วาร์ป Kafra ฟรีถ้าเลเวลต่ำกว่า 40', cites: [['onenight', '09:03'], ['ncz', '02:20']] },
    { text: 'แมพเก็บเลเวลตั้งแต่ราว 33 ส่วนใหญ่เป็นมอนเผ่า Insect, Demi-Human และ Brute ทำธนูแยกตามเผ่าไว้', cites: [['hbow', '00:19']] },
  ],
  gearByLevel: [
    { range: 'ทั้งทาง', slot: 'ลูกธนู', text: 'Silver Arrow ซื้อได้ที่ร้าน NPC ใน Payon แต่แพงกว่าร้านผู้เล่น ซองหนึ่งมี 500 ดอก', items: [1751, 12009], cites: [['onenight', '09:10'], ['onenight', '09:37']] },
    { range: '30+', slot: 'หมวก', text: 'Apple of Archer ให้ DEX +3', items: [2285], cites: [['db']] },
    { range: '33+', slot: 'อาวุธ', text: 'Gakkung Bow (ATK 100) แรงสุดตอนนี้ ออปชั่นได้ 3 บรรทัด ส่วน Arbalest (ATK 90) ได้แค่ 2 บรรทัด', items: [700084, 700113], cites: [['hbow', '02:28'], ['hbow', '02:36'], ['db']] },
    { range: '33+', slot: 'ออปชั่นธนู', text: 'หา ATK ให้สูง (สูงสุด 30) ตามด้วยสเตตัสรองที่ build ใช้ บรรทัดที่ 3 หาดาเมจต่อเผ่า Insect, Demi-Human หรือ Brute', cites: [['hbow', '00:29']] },
    { range: '33+', slot: 'การ์ดธนู', text: 'แยกธนูตามเผ่า: Goblin Card 2 ใบตี Brute, Caramel Card 2 ใบตี Insect, Hydra Card 2 ใบตี Demi-Human', items: [4060, 4063, 4035], cites: [['hbow', '00:58'], ['db']] },
    { range: '50+', slot: 'ผ้าคลุม', text: 'Baby Shark Card (EXP +15% ช่วงอีเวนต์) VRVSCH บอกว่าช่วยเก็บเลเวลถึง 60', items: [300834], cites: [['vrvsch', '09:38'], ['db']] },
  ],
  strengths: [
    { text: 'Focused Arrow Strike ตีเป็นวง 5×5 และติดคริได้ hellyy บอกว่าทำให้เก็บเลเวลถึง 60 ง่ายมาก', cites: [['hskill', '01:00'], ['hskill', '01:50'], ['vrvsch', '02:04']] },
    { text: 'Wind Walker เพิ่มความเร็วเดินและ FLEE ให้ทั้งปาร์ตี้', cites: [['hskill', '01:04'], ['vrvsch', '04:24']] },
    { text: 'ดาเมจเหยี่ยวลดด้วยอะไรไม่ได้เลย รวมถึงตอน PvP และ WoE', cites: [['hskill', '00:46']] },
    { text: 'ใช้พาตัวเลเวลต่ำในปาร์ตี้เก็บเลเวลได้', cites: [['shank', '05:03']] },
    { text: 'TakoyakiCh จัดไว้เทียร์ SS ฝั่ง PvE: ตีแรง ตีไกล เดินไว ทำคริง่าย', cites: [['tako', '08:11'], ['tako', '09:02']] },
  ],
  weaknesses: [
    { text: 'เปลือง SP มาก ต้องกินยาพอสมควร Focused Arrow Strike ใช้ SP 24', cites: [['shank', '04:28'], ['shank', '04:44']] },
    { text: 'Falcon Eyes ใช้ SP 40 และอยู่แค่ราว 30 วินาที ต้องกดบ่อย', cites: [['vrvsch', '03:56']] },
    { text: 'Focused Arrow Strike ต้องชาร์จ (มีเวลาร่าย)', cites: [['vrvsch', '03:25']] },
  ],
  builds: [
    {
      id: 'fas',
      name: 'สาย Focused Arrow Strike (คริ)',
      tag: 'สายหลัก',
      pickIf: 'อยากฟาร์มและเก็บเลเวลเร็ว ตั้งบอทได้',
      idea: {
        text: 'ใช้ Focused Arrow Strike เป็นสกิลตีหมู่หลัก เปิดบัฟ Improve Concentration กับ Falcon Eyes และ Wind Walker ไว้เดินไว เซิร์ฟนี้มอนเลือดเยอะ ตีธรรมดาต้องราว 10 ครั้งถึงเท่า Focused Arrow Strike ครั้งเดียว',
        cites: [['vrvsch', '01:37'], ['shank', '01:28'], ['vrvsch', '16:28']],
      },
      statNotes: [
        {
          text: 'DEX คือสเตตัสหลักของดาเมจ: hellyy ทดสอบโดยเปิดแค่ Improve Concentration กับ Falcon Eyes ได้ DEX 92 ตี 23,737 ส่วน DEX 1 ยังตีได้ราว 12,400 อาวุธและของยังสำคัญที่สุด',
          cites: [['hskill', '01:43'], ['hskill', '02:00'], ['hskill', '02:18']],
        },
        { text: 'build AGI/DEX ตีได้น้อยกว่า DEX ล้วนนิดเดียว ส่วน build Falconer กับ AGI ล้วนตีได้น้อยกว่าชัดเจน', cites: [['hskill', '02:05']] },
        {
          text: 'CRIT ที่ต้องทำ แต่ละคลิปไม่ตรงกัน: VRVSCH คำนวณว่า CRIT ราว 66 บวกโบนัสอีกครึ่งหนึ่งจะคริแทบทุกนัด TakoyakiCh บอกราว 80 แชงค์888 บอกราว 50',
          cites: [['vrvsch', '02:48'], ['tako', '08:42'], ['shank', '01:51']],
        },
        { text: 'ถ้าไม่คริ ดาเมจต่อ Willow ต่ำลงราว 25%', cites: [['hskill', '02:28']] },
        { text: 'FLEE: แชงค์888 ทำราว 300 เลยแทบไม่โดนตี Xiendong บอกว่าช่วงต้นทำ 250-300 ได้ไม่ยาก เพราะออปชั่นบนของมี FLEE ชิ้นละ 15 ขึ้นไป', cites: [['shank', '00:10'], ['shank', '05:14'], ['xmeta', '03:34'], ['xmeta', '06:59']] },
        { text: 'ยังไม่มีคลิปโชว์ตัวเลขสเตตัสครบทุกตัว VRVSCH บอกแค่ว่าลงแบบบ้าเลือดและคิดจะลด DEX กับ AGI ลงบ้าง', cites: [['vrvsch', '11:03']] },
      ],
      skills: [
        { skill: 'Improve Concentration', level: 10, why: 'บัฟ AGI กับ DEX และเป็นเงื่อนไขของ Focused Arrow Strike', cites: [['shank', '01:28'], ['db']] },
        { skill: 'Focused Arrow Strike', level: 5, why: 'สกิลตีหลัก คลิปบอกดาเมจสูงสุด ATK 1,800% ซึ่งคือ Lv 5', cites: [['vrvsch', '01:55'], ['tako', '08:36'], ['db']] },
        { skill: 'Falcon Eyes', level: 10, why: 'อัพเต็ม 10: HIT +30%, ดาเมจ +20%, CRIT +10', cites: [['vrvsch', '03:41'], ['hskill', '01:23']] },
        { skill: 'Wind Walker', level: '?', why: 'เดินไวและเพิ่ม FLEE คลิปไม่บอกเลเวล', cites: [['vrvsch', '04:24'], ['shank', '02:02']] },
      ],
      skillNotes: [
        { text: 'คลิปไม่ได้บอกลำดับทีละขั้น บอกแค่ว่าใช้จริง 4 สกิลนี้', cites: [['vrvsch', '01:37'], ['shank', '01:28']] },
        { text: 'Beastbane เพิ่มดาเมจต่อ Brute กับ Insect ซึ่งเป็นมอนส่วนใหญ่ในแมพเก็บเลเวล (โยงจากสองคลิป ไม่มีคลิปไหนแนะนำตรงๆ)', cites: [['hskill', '00:20'], ['hbow', '00:19']] },
      ],
      plan: {
        picks: {
          archer: { 'Improve Concentration': 10 },
          hunter: { 'Focused Arrow Strike': 5, 'Falcon Eyes': 10 },
        },
        basis: {
          text: 'เฉพาะสกิลและเลเวลที่คลิปบอก ส่วนสกิลที่เป็นเงื่อนไขหน้าเว็บเติมให้เอง',
          cites: [['vrvsch', '01:55'], ['vrvsch', '03:41'], ['shank', '01:28']],
        },
        leftover: {
          text: 'แต้มที่เหลือ: ทั้งสองคลิปอัพ Wind Walker ไว้ (ต้อง Improve Concentration 9) แต่ไม่บอกเลเวล ที่เหลือจากนั้นยังไม่มีคลิปบอก',
          cites: [['vrvsch', '04:24'], ['shank', '02:02'], ['db']],
        },
      },
      gear: [
        { slot: 'อาวุธ', text: 'Gakkung Bow ดีที่สุดตอนนี้ ออปชั่นบรรทัดบนหา ATK ให้มากที่สุด บรรทัดล่างหาดาเมจต่อ Demi-Human ถ้าฟาร์ม Nordfeld Cave บรรทัดกลางหา Earth +8 หรือ Critical Damage +8% เพราะ Focused Arrow Strike ติดคริ', items: [700084], cites: [['hbow', '02:28'], ['vrvsch', '06:55'], ['vrvsch', '07:18']] },
        { slot: 'การ์ดธนู', text: 'แชงค์888 ใส่ Caramel Card ตีแมลง ส่วน Goblin Card 2 ใบตีมอน Brute แรงกว่า Archer Skeleton Card 2 ใบราว 9-10%', items: [4063, 4060, 4094], cites: [['shank', '00:53'], ['hbow', '01:12']] },
        { slot: 'หมวก', text: 'VRVSCH ใส่หมวกที่เรียกว่า Platinum ออปชั่น FLEE หรือ ATK ก็ได้ ฐานข้อมูลมี Nordfeld Platinum Helm แต่ยังไม่รู้ว่าเป็นชิ้นเดียวกันไหม', items: [401510], cites: [['vrvsch', '04:56'], ['db']] },
        { slot: 'เสื้อ', text: 'VRVSCH ทำ 2 ตัว: ตัวบอทออปชั่น SP +41% ตัวเล่นมือออปชั่น AGI +3 / DEX +3 ถ้าได้ลดเวลาร่ายด้วยจะดีมาก', cites: [['vrvsch', '05:34'], ['vrvsch', '06:35']] },
        { slot: 'รองเท้า', text: 'ตัวบอท: FLEE 15 กับดาเมจต่อ Demi-Human และการ์ดฟื้น SP (ชื่อฟังไม่ชัด) ตีบวกถึง +7 ได้ลดดาเมจธาตุดินอีก 5%', cites: [['vrvsch', '08:02'], ['vrvsch', '08:27']] },
        { slot: 'ผ้าคลุม', text: 'ออปชั่นลดเวลาร่ายแปรผัน -10% หรือ FLEE ถ้าเน้นฟาร์ม ใส่ Baby Shark Card (ของช่วงอีเวนต์)', items: [300834], cites: [['vrvsch', '09:09'], ['vrvsch', '09:38'], ['shank', '00:34']] },
        { slot: 'ประดับ', text: 'ข้างหนึ่งเป็นประดับ Teleport (VRVSCH ได้จากกล่อง Shining Archer ใน KP Shop) อีกข้างใส่ Wormtail Card (DEX +2)', items: [490975, 4034], cites: [['vrvsch', '09:56'], ['vrvsch', '10:15'], ['shank', '01:04']] },
        { slot: 'ของเสริม', text: 'ยา CRIT +30 จากร้านเงินจริง ติดคริง่ายขึ้นมาก', cites: [['vrvsch', '13:15']] },
      ],
      play: [
        { text: 'บัฟที่ตั้งในบอท: Improve Concentration, Falcon Eyes และ Wind Walker', cites: [['shank', '02:27']] },
        { text: 'เวลาร่ายของ Focused Arrow Strike ลดได้ แต่ VRVSCH แนะนำให้หาของเร่ง SP ก่อน', cites: [['vrvsch', '03:28']] },
      ],
      maps: [
        { text: 'Nordfeld Cave 2F: หาของดาเมจต่อ Demi-Human ไว้ฟาร์มที่นี่', cites: [['vrvsch', '06:59']] },
        { text: 'Payon Cave 4F (Sohee): VRVSCH ตีได้ราว 26,000 ต่อนัด Sohee เลือดราว 6,000 จึงตายนัดเดียว', cites: [['vrvsch', '15:21'], ['vrvsch', '15:49']] },
      ],
      cautions: [
        { text: 'ถ้าไม่ใช้ยาปั๊ม แชงค์888 ก็ไม่แน่ใจว่าจะพอ SP ได้อย่างไร', cites: [['shank', '04:32']] },
      ],
    },
    {
      id: 'falconer',
      name: 'สายเหยี่ยว (Blitz Beat / Falcon Assault)',
      pickIf: 'อยากใช้เหยี่ยวเป็นดาเมจหลัก',
      idea: {
        text: 'ดาเมจเหยี่ยวลดด้วยอะไรไม่ได้ และออกเท่ากันทุกครั้ง Blitz Beat ติดเองตอนตีธรรมดา ยิ่ง LUK สูงยิ่งออกบ่อย Falcon Assault ดาเมจเพิ่มตาม AGI และ Base Level',
        cites: [['hskill', '00:34'], ['hskill', '00:46'], ['hskill', '02:44'], ['hskill', '02:49']],
      },
      statNotes: [
        { text: 'ผลทดสอบ Falcon Assault ที่ Lv 60: AGI 92 ได้ 9,715 ส่วน AGI 1 กับ DEX 92 ได้ราว 6,900 build AGI/DEX กับ AGI ล้วนต่างกันแค่ราว 400', cites: [['hskill', '02:55'], ['hskill', '03:07']] },
      ],
      cautions: [
        { text: 'คลิปประเมินไม่ตรงกัน: VRVSCH บอกว่าสายเหยี่ยวในเซิร์ฟนี้ใช้ไม่ได้เพราะมอนเลือดเยอะ TakoyakiCh บอกว่า Falcon Assault ไม่ค่อยแรง hellyy ทดสอบให้ดูเฉยๆ ไม่ได้ตัดสิน', cites: [['vrvsch', '14:05'], ['vrvsch', '16:23'], ['tako', '08:28']] },
      ],
      missing: 'ยังไม่มีคลิป Zero บอกลำดับสกิล สเตตัสจริง หรือของของสายนี้',
    },
    {
      id: 'trap',
      name: 'สายวางกับดัก',
      pickIf: 'อยากเล่นกับดัก',
      idea: { text: 'ผังสกิลมีกับดักครบ เช่น Land Mine, Anklesnare, Sandman, Claymore Trap, Freezing Trap แต่บางตัวไม่มีคำอธิบายในฐานข้อมูล', cites: [['db']] },
      missing: 'ยังไม่มีคลิป Zero หรือ build บนเว็บพูดถึงสายนี้',
    },
  ],
  gaps: [
    'ยังไม่มีคลิป Zero บอกลำดับอัพสกิลทีละขั้นและตัวเลขสเตตัสครบ',
    'Wind Walker ควรอัพกี่เลเวล และแต้มที่เหลือควรลงอะไร',
    'ค่า CRIT ที่พอให้ Focused Arrow Strike คริทุกนัด แต่ละคลิปบอกไม่ตรงกัน',
    'สายเหยี่ยวและสายกับดักยังไม่มีข้อมูลพอทำไกด์',
    'ยังไม่มีข้อมูล build สำหรับล่า MVP รู้แค่ว่าต้องหาออปชั่นดาเมจต่อบอส',
  ],
  sources: {
    hskill: { label: 'hellyy', title: 'Hunter Skill Guide & Damage Test | AGI/DEX vs Falconer Builds', url: 'https://www.youtube.com/watch?v=aKUY2E5-_EU', kind: 'clip', lang: 'en' },
    hbow: { label: 'hellyy', title: 'Hunter Guide | Best Bows, Cards & Affixes', url: 'https://www.youtube.com/watch?v=fGg65Z7MOq0', kind: 'clip', lang: 'en' },
    vrvsch: { label: 'VRVSCH', title: 'Ragnarok Zero Global: INSANE Focus Hunter Build Review!!', url: 'https://www.youtube.com/watch?v=R0RJRtGS75c', kind: 'clip', lang: 'th' },
    shank: { label: 'แชงค์888', title: 'Ragnarok Zero Hunter Focus Arrow Strike Build: Gear and Stats', url: 'https://www.youtube.com/watch?v=fwomJmqy0i4', kind: 'clip', lang: 'th' },
    tako: { label: 'TakoyakiCh', title: 'จัด Tierlist Class2 ในโลก RO-Zero', url: 'https://www.youtube.com/watch?v=Y7MKIY0KiYo', kind: 'clip', lang: 'th' },
    xmeta: { label: 'Xiendong', title: 'Why Taiwan Players Build These Stats', url: 'https://www.youtube.com/watch?v=T5bjOqQomUc', kind: 'clip', lang: 'en' },
    xroad: { label: 'Xiendong', title: 'My Current 1–60 Levelling Roadmap', url: 'https://www.youtube.com/watch?v=7ymM15xvYAY', kind: 'clip', lang: 'en' },
    xfarm: { label: 'Xiendong', title: 'NEW Farming Spots, Cards & EXP Areas!', url: 'https://www.youtube.com/watch?v=y7ySJekxEAw', kind: 'clip', lang: 'en' },
    ncz: { label: 'NCZ', title: 'Recommended Leveling Maps Lv. 1-50', url: 'https://www.youtube.com/watch?v=IScycVE-tf8', kind: 'clip', lang: 'th' },
    onenight: { label: 'OneNightsz', title: 'Ragnarok Zero Global มือใหม่ | รีสเตตัส หาเงิน ตั้งบอท และเรื่องสำคัญที่ต้องรู้!', url: 'https://www.youtube.com/watch?v=4D5XxK_NfjQ', kind: 'clip', lang: 'th' },
    db: { label: 'rozerothai.com', title: 'ฐานข้อมูลสกิลและไอเทม', url: 'https://rozerothai.com/database/skills', kind: 'web' },
    planner: { label: 'rozeroplanner', title: 'RO Zero skill planner', url: 'https://rozeroplanner.com/', kind: 'web' },
    owner: { label: 'ยืนยันในเกม', title: 'เจ้าของเว็บตรวจในเกม 22 ก.ย. 2026', url: '', kind: 'web' },
  },
};
