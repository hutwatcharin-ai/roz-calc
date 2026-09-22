// Acolyte guide. Drafted 22 Sep 2026 from Downloads/roz-job-guides/acolyte.md,
// which cites every line to a clip timestamp or a web page, and checked against
// the Kofa Roams, Viva-Tz and MimiwPK transcripts. Items, monsters and skills
// were checked against the site database; lines the sources disagree on say so.
import type { ClassGuide } from './types';

export const acolyte: ClassGuide = {
  slug: 'acolyte',
  job: 'Acolyte',
  jobTh: 'อโคไลท์',
  from: 'Novice',
  gathered: '22 ก.ย. 2026',
  summary:
    'อาชีพหนึ่งสายพระ ต่อไปเป็น Priest หรือ Monk ช่วง 1-50 ทุกคลิปที่เจอเล่นสายตี AGI มีบัฟตัวเอง Heal และ Teleport ทำให้เปิดบอทเก็บเลเวลได้สบาย',
  facts: [
    { text: 'เปลี่ยนจาก Novice ที่โบสถ์ Prontera ต่อไปเป็น Priest หรือ Monk', cites: [['prontera']] },
    { text: 'Job ตันที่ 50 ได้แต้มสกิล 49 แต้ม', cites: [['owner'], ['planner']] },
    { text: 'เปลี่ยนเป็นอาชีพสองได้ที่ Base Lv 50', cites: [['owner'], ['viva', '02:38'], ['kamon', '00:44']] },
    { text: 'Holy Light เป็นสกิลฟรี ไม่ใช้แต้มสกิล', cites: [['planner'], ['prontera']] },
  ],
  path: ['acolyte'],
  equipJob: 'Acolyte',
  route: [
    { range: '1-10', text: 'ทำเควสหลักกับ tutorial ไปก่อน ยังไม่ต้องฟาร์ม', cites: [['kofa', '00:26'], ['yoinoA', '01:12']] },
    { range: '7-18', text: 'Spore ที่ Payon Forest', maps: ['pay_fild08'], monsters: [1014], cites: [['kofa', '00:36'], ['yoinoA', '02:13']] },
    { range: '15-20', text: 'Prontera Sewer 2F ตีได้ทุกตัว และหาเสื้อออปชั่น FLEE กับ HP ไปด้วย · หรือ Payon Cave ชั้นแรกช่วง 15-25 ก็ได้', maps: ['prt_sewb2', 'pay_dun00'], monsters: [1051], cites: [['yoinoA', '08:24'], ['yoinoA', '09:18'], ['yoinoA', '22:32']] },
    { range: '18-25', text: 'Bigfoot ที่ Payon Forest หรือ Creamy กับ Smokie ที่ Gypsy Village (ในคลิปเสียงไม่ชัด น่าจะเป็นแมพนี้)', maps: ['pay_fild07', 'gef_fild05'], monsters: [1060, 1018, 1056], cites: [['kofa', '02:17'], ['yoinoA', '09:39'], ['yoinoA', '10:50']] },
    { range: '25-31', text: 'Elder Willow ที่ Prontera Field หรือ Coco ที่ Geffen Field (ได้ Hood กับ Sandals) ของครบแล้วไป Ant Hell', maps: ['prt_fild10', 'gef_fild02', 'anthell02'], monsters: [1033, 1104, 1095], cites: [['kofa', '02:38'], ['yoinoA', '15:22'], ['yoinoA', '16:55']] },
    { range: '30-40', text: 'Orc Village (ใส่ Orc Lady Card) หรือ Payon Cave: Familiar, Skeleton, Archer Skeleton', maps: ['gef_fild10', 'pay_dun00', 'pay_dun01'], monsters: [1023, 1005, 1076, 1016], cites: [['kofa', '03:02'], ['yoinoA', '22:59']] },
    { range: '40-50', text: 'Orc Underground Cave: Orc Zombie กับ Orc Skeleton คนน้อย บอทหาเป้าง่าย · หรือ Orc Village ต่อ · หรือ Payon Cave 4F (Sohee) แต่มีมอนทำให้เลือดไหล ต้องเฝ้าบอท', maps: ['orcsdun01', 'orcsdun02', 'gef_fild10', 'pay_dun03'], monsters: [1153, 1152, 1170], cites: [['kofa', '03:28'], ['yoinoA', '25:23'], ['yoinoA', '25:47'], ['yoinoA', '26:11']] },
    { range: '50', text: 'เปลี่ยนเป็นอาชีพสอง หาเควสได้โดยเปิดหน้าต่างเควสแล้วพิมพ์คำว่า "จ๊อบ"', cites: [['owner'], ['kamon', '00:55']] },
  ],
  routeNotes: [
    { text: 'Kofa Roams พักฟาร์มที่ Lv 42 ไปทำเควสหลักก่อน แล้วค่อยกลับมาฟาร์มต่อ', cites: [['kofa', '03:16']] },
    { text: 'ติดเลเวล 47-48 ให้กลับไปทำเควสหลักที่ค้าง ได้ EXP หลายล้าน', cites: [['yoinoA', '27:40'], ['yoinoA', '28:04']] },
    { text: 'Orc Underground Cave มอนเยอะ ถ้าคนน้อยจะอันตราย ข้างนอกชั้น 1 ปลอดภัยกว่า', cites: [['yoinoA', '26:53'], ['yoinoA', '27:15']] },
    { text: 'ที่ Orc Village ถ้าฆ่า Orc Warrior ครบ 30,000 ตัว ได้ Achievement เป็นหมวก Orc Hero Headdress (STR +2) เงื่อนไข 30,000 ตัวมาจากคลิปอย่างเดียว', cites: [['yoinoA', '26:31'], ['db']] },
    { text: 'ใน Payon Cave ให้เลี่ยงมอนธาตุวิญญาณ DEF สูงที่ทำให้ตาบอด (คลิปพูดชื่อไม่ชัด) และอัพ Cure ไว้แก้สถานะก่อนลง', cites: [['yoinoA', '23:20'], ['yoinoA', '24:09']] },
  ],
  gearByLevel: [
    { range: 'ทั้งทาง', slot: 'ออปชั่น', text: 'ของ FLEE ง่ายๆ โดยเฉพาะรองเท้ากับผ้าคลุม ไม่ต้องของแพง ออปชั่นที่คุ้มช่วงต้นคือ Max HP กับ FLEE', cites: [['kofa', '01:01'], ['meta', '03:31']] },
    { range: 'กิจกรรม', slot: 'ผ้าคลุม', text: 'Baby Shark Card ของกิจกรรม บัฟแรงช่วงกิจกรรม แต่เป็นของชั่วคราว ไม่ต้องมีก็เก็บเลเวลตามทางนี้ได้', items: [300834], cites: [['kofa', '01:31'], ['db']] },
    { range: '15-20', slot: 'เสื้อ', text: 'เสื้อจาก Prontera Sewer 2F ออปชั่น FLEE กับ HP', cites: [['yoinoA', '09:18']] },
    { range: '18-30', slot: 'อาวุธ', text: 'หา Chain ให้ได้เร็วที่สุด ถ้าได้ออปชั่น FLEE ใช้ได้นาน', cites: [['kofa', '02:29']] },
    { range: '20-25', slot: 'ประดับ', text: 'Creamy Card ใช้ Teleport Lv 1 ได้ (ไม่มีกลับเมือง) พอมี Teleport เองแล้วขายหรือให้ตัวอื่นใช้', items: [4040], cites: [['yoinoA', '10:01'], ['vivaStart', '24:24'], ['ncz', '08:27']] },
    { range: '25-30', slot: 'หมวก / รองเท้า', text: 'Hood กับ Sandals จาก Coco หาออปชั่น FLEE และ HP/SP', cites: [['kofa', '01:08'], ['yoinoA', '13:45'], ['yoinoA', '15:48']] },
    { range: '~30', slot: 'อาวุธ', text: 'Andre Card จาก Ant Hell (ATK +20) คลิปเรียกว่าการ์ดมด', items: [4043], cites: [['yoinoA', '16:55'], ['db']] },
    { range: '32+', slot: 'อาวุธ', text: 'Orc Lady Card 3 ใบ ตี Orc แรงขึ้น ใช้ได้กับ Orc Zombie และ Orc Skeleton ด้วย · คลิปพูดว่าใส่โล่ แต่ฐานข้อมูลบอกว่าเป็นการ์ดอาวุธ', items: [4255], cites: [['kofa', '02:52'], ['kofa', '03:45'], ['db']] },
  ],
  strengths: [
    { text: 'มีบัฟตัวเองช่วยเก็บเลเวลตั้งแต่ต้น: Increase Agility (ตีเร็ว วิ่งเร็ว) และ Blessing (STR/INT/DEX และ HIT)', cites: [['vivaStart', '17:03'], ['yoinoA', '11:11']] },
    { text: 'มี Teleport กับ Warp Portal ช่วยเดินทางและหามอนตอนเปิดบอท', cites: [['vivaStart', '17:26'], ['yoinoA', '19:35']] },
    { text: 'ใช้ Heal แทนยาได้ ประหยัดเงิน', cites: [['kofa', '03:53'], ['vivaStart', '17:46']] },
    { text: 'ในเซิร์ฟ Zero อาชีพหนึ่งได้ Mace Mastery เพิ่มเข้ามา', cites: [['tako', '10:32']] },
  ],
  weaknesses: [
    { text: 'เลเวลต่ำ SP น้อย ใช้ Heal ได้จำกัด ยังต้องพึ่งยา HP นาน', cites: [['kofa', '01:51'], ['kofa', '03:53']] },
    { text: 'ถ้าไม่เอา Mace Mastery เต็ม ดาเมจน้อย เก็บเลเวลช่วงแรกยาก', cites: [['viva', '02:11']] },
    { text: 'ยังไม่มีคลิป Zero ที่เล่นสาย INT หรือ Holy Light ช่วง 1-50', cites: [['vivaStart', '17:46']] },
  ],
  builds: [
    {
      id: 'battle',
      name: 'สายตี AGI ถือ Mace',
      tag: 'สายหลัก',
      pickIf: 'อยากเปิดบอทเก็บเลเวล 1-50 ให้เร็ว',
      idea: {
        text: 'ลง AGI เป็นหลักเพื่อหลบและตีเร็ว เอา DEX พอให้ตีโดน ใช้บัฟตัวเองกับ Heal ให้บอทยืนได้นาน',
        cites: [['kofa', '00:42'], ['yoinoA', '02:51']],
      },
      stats: [
        { who: 'Kofa Roams', str: 'นิดหน่อย', agi: 'มากที่สุด', dex: '~15 ตั้งแต่ต้น', int: 'เพิ่มช่วงท้าย', note: 'INT ช่วงท้ายเพื่อ SP ใช้ Heal แทนยา', cites: [['kofa', '00:42'], ['kofa', '00:58'], ['kofa', '03:53']] },
        { who: 'Yoino Buten', str: '20 แล้วค่อยเพิ่ม', agi: '~9 ตอนต้น แล้วลงรัวๆ', dex: '20 ก่อน', note: 'ช่วง Coco ถ้าอาวุธไม่มีออปชั่น HIT อาจต้อง DEX ~25', cites: [['yoinoA', '02:51'], ['yoinoA', '03:12'], ['yoinoA', '06:28'], ['yoinoA', '16:33']] },
        { who: 'Xiendong (ทุกอาชีพ)', dex: '~20 ตอนเริ่ม', note: 'แล้วรีเซ็ตก่อนเลเวล 40', cites: [['meta', '06:01']] },
      ],
      statNotes: [
        { text: 'ต้องบาลานซ์ HIT กับ FLEE ให้พอกับมอนในแมพ ไม่งั้นปั๊มยาเยอะ', cites: [['yoinoA', '16:33']] },
        { text: 'รีเซ็ตสเตตัส แหล่งไม่ตรงกัน: Xiendong บอกรีฟรีถึง Lv 40, Yoino Buten บอกว่า NPC รีที่ Payon จะถูกเอาออก 10 ก.ย., Viva-Tz บอกว่ากิจกรรมรีหมดแล้ว ต้องรอรอบใหม่หรือซื้อใน KP Shop', cites: [['meta', '06:24'], ['yoinoA', '00:23'], ['viva', '00:35']] },
      ],
      skills: [
        { skill: 'Increase Agility', level: 10, why: 'ต้องผ่าน Heal 3', cites: [['viva', '01:30'], ['kofa', '02:00']] },
        { skill: 'Blessing', level: 10, why: 'ต้องผ่าน Divine Protection 5', cites: [['viva', '01:36'], ['kofa', '02:00']] },
        { skill: 'Mace Mastery', level: 10, why: 'คลิปบอกว่าดาเมจเพิ่ม 30 และ CRIT +10', cites: [['viva', '01:44']] },
        { skill: 'Teleport', level: 2, why: 'Lv 2 กลับจุดเซฟได้', cites: [['viva', '01:50'], ['ncz', '08:49']] },
        { skill: 'Warp Portal', level: 4, why: 'จำจุดได้ 4 จุด เฉพาะแมพข้างนอก', cites: [['viva', '01:53'], ['yoinoA', '19:58']] },
        { skill: 'Pneuma', level: 1, cites: [['viva', '01:53']] },
        { skill: 'Heal', level: 7, why: 'ที่เหลือลง Heal คลิปบอกได้ถึง Lv 7 ตอน Job 50', cites: [['viva', '01:56']] },
      ],
      skillNotes: [
        { text: 'Kofa Roams เอา Heal 4 ตั้งแต่ต้น แล้วเน้น Teleport, Blessing 10, Increase Agility 10 ก่อน ที่เหลือเลือกเองได้ (เขาเลือก Mace Mastery แต่บอกว่าไม่ใช่คำตอบเดียว)', cites: [['kofa', '01:51'], ['kofa', '02:03']] },
        { text: 'Yoino Buten ไล่ Blessing 5 กับ Increase Agility 5 ก่อน แล้ว Warp Portal ราว Job 35 ถึง Blessing 10 และ Increase Agility 10 แล้วค่อยเก็บสกิลที่เสียงไม่ชัด (น่าจะเป็น Mace Mastery) เต็ม 10', cites: [['yoinoA', '11:34'], ['yoinoA', '19:13'], ['yoinoA', '21:03'], ['yoinoA', '21:45']] },
        { text: 'บางคนเอา Mace Mastery แค่ 1-2 เพื่อเอา Heal 10 ไม่ผิด แต่ Viva-Tz เตือนว่าเก็บเลเวลตอนเป็น Acolyte จะยากเพราะดาเมจน้อย', cites: [['viva', '02:02'], ['viva', '02:11']] },
        { text: 'ถ้าจะไป Priest สาย Duple Light: Mace Mastery ไม่ใช่ทางผ่านของ Duple Light', cites: [['ryan', '01:16']] },
      ],
      plan: {
        picks: {
          acolyte: { 'Increase Agility': 10, Blessing: 10, 'Mace Mastery': 10, Teleport: 2, 'Warp Portal': 4, Pneuma: 1, Heal: 6 },
        },
        basis: {
          text: 'สกิลที่ Viva-Tz เลือก คลิปพูดว่า Heal 7 แต่รวมทางผ่าน (Divine Protection 5, Ruwach 1) แล้วเกิน 49 แต้มไป 1 แต้ม แผนนี้จึงลด Heal เหลือ 6',
          cites: [['viva', '01:30'], ['viva', '01:56'], ['owner']],
        },
      },
      gear: [
        { slot: 'อาวุธ', text: 'Chain ให้ได้เร็วที่สุด ถ้ามีออปชั่น FLEE ใช้ได้นาน · ช่วง 32+ ใส่ Orc Lady Card', items: [4255], cites: [['kofa', '02:29'], ['kofa', '02:52']] },
        { slot: 'หมวก / รองเท้า', text: 'Hood กับ Sandals จาก Coco ออปชั่น FLEE', cites: [['kofa', '01:08']] },
        { slot: 'เสื้อ', text: 'เลือกออปชั่น Max HP', cites: [['vivaStart', '18:50']] },
        { slot: 'ประดับ', text: 'Kofa Roams ใส่เข็มขัด 2 ชิ้นกับการ์ดที่ซับเขียนว่า "cook card" น่าจะเป็น Kukre Card (AGI +2) ยังไม่ยืนยัน', items: [4027], cites: [['kofa', '01:21'], ['db']] },
        { slot: 'อาวุธแคช', text: 'Yoino Buten ใช้อาวุธจากกล่อง Shining M (ราว 3,000 KP) ตั้งแต่ Acolyte ถึง Priest คลิปไม่บอกชื่ออาวุธ', cites: [['yoinoA', '12:19'], ['yoinoA', '12:38']] },
      ],
      play: [
        { text: 'ตั้งบอทให้ร่าย Blessing ก่อน Increase Agility จะได้ไม่ติดร่ายนาน เพราะ DEX ยังน้อย', cites: [['yoinoA', '22:10']] },
        { text: 'Heal อยู่หน้า 3 ของสกิลบอท ตั้งให้ฮีลเมื่อเลือดลดถึงเกณฑ์ ช่วงท้ายซื้อแต่ยา SP แล้วใช้ Heal แทนยา HP', cites: [['ncz', '06:08'], ['kofa', '04:04']] },
        { text: 'ส่องออปชั่นของที่ดรอป: กด Ctrl + คลิกขวา ต้องมีแว่นขยายที่ร้านยาทุกเมือง', cites: [['yoinoA', '17:16'], ['yoinoA', '17:39']] },
      ],
      cautions: [
        { text: 'ตั้งบอทไม่ดีทำให้เปลืองของหรือตาย', cites: [['kofa', '04:14']] },
        { text: 'ทาง Coco กับ Orc Village อันตราย เปิด Increase Agility วิ่งหลบ', cites: [['yoinoA', '14:55'], ['yoinoA', '15:22']] },
        { text: 'Warp Portal จำจุดในดันไม่ได้ (พิมพ์ /memo ที่แมพข้างนอก)', cites: [['yoinoA', '19:35'], ['yoinoA', '19:58']] },
      ],
    },
    {
      id: 'book',
      name: 'สายตี AGI ถือหนังสือ',
      pickIf: 'จะไป Priest สาย Duple Light และไม่ถือ Mace',
      idea: {
        text: 'MimiwPK ถือหนังสือ ไม่ได้ถือ Mace จึงไม่อัพ Mace Mastery (มีผลเฉพาะตอนถือ Mace) เอาแต้มไปลง Angelus ทางผ่าน Kyrie Eleison กับ Demon Bane แทน',
        cites: [['mimiw', '01:49'], ['mimiw', '02:05']],
      },
      skills: [
        { skill: 'Increase Agility', level: 10, cites: [['mimiw', '01:23']] },
        { skill: 'Aqua Benedicta', level: 1, cites: [['mimiw', '01:27']] },
        { skill: 'Angelus', level: 2, why: 'ทางผ่าน Kyrie Eleison ตอนเป็น Priest', cites: [['mimiw', '01:31']] },
        { skill: 'Demon Bane', level: 10, why: 'แต้มที่เหลือลงตัวนี้ ตี Demon กับ Undead แรงขึ้น', cites: [['mimiw', '01:40'], ['mimiw', '01:43']] },
      ],
      skillNotes: [
        { text: 'คลิปชี้หน้าจอสกิลเร็วๆ ส่วนที่เหลือไม่ได้พูดชื่อ (มีคำหนึ่งเสียงไม่ชัด อาจเป็น Pneuma) แผนด้านล่างจึงมีแค่ที่พูดชัด', cites: [['mimiw', '01:18']] },
      ],
      plan: {
        picks: {
          acolyte: { 'Increase Agility': 10, 'Aqua Benedicta': 1, Angelus: 2, 'Demon Bane': 10 },
        },
        basis: { text: 'เฉพาะสกิลที่ MimiwPK พูดชื่อในคลิป', cites: [['mimiw', '01:23'], ['mimiw', '01:40']] },
        leftover: { text: 'แต้มที่เหลือคลิปไม่ได้พูด ถ้าจะเปิดบอทแนะนำ Blessing 10 กับ Teleport 2 ตามสายหลัก', cites: [['kofa', '02:00'], ['viva', '01:36']] },
      },
    },
    {
      id: 'int',
      name: 'สาย INT / Holy Light / ซัพพอร์ต',
      pickIf: 'อยากเล่นสายเวทหรือฮีลตั้งแต่อาชีพหนึ่ง',
      idea: { text: 'Viva-Tz บอกว่าไม่เล่นสายเวท Holy Light เพราะเล่นยากและของซัพพอร์ตน้อย', cites: [['vivaStart', '17:46']] },
      missing: 'ยังไม่เจอคลิปหรือเว็บของ RO Zero ที่เล่น Acolyte สายนี้ช่วง 1-50 จึงยังไม่มีสเตตัส สกิล หรือของ',
    },
  ],
  gaps: [
    'ไม่มีสาย INT, Holy Light หรือซัพพอร์ตเต็มตัวช่วงอาชีพหนึ่ง',
    'ไม่มีตัวเลขสเตตัสตอน Base 50 จากคลิปไหนเลย มีแต่ช่วงเริ่ม',
    'ชื่อมอนบางตัวใน Payon Cave ฟังจากซับไม่ชัด (ตัวที่ทำให้ตาบอดและตัวที่ทำให้เลือดไหล)',
    'ตอนนี้ยังรีเซ็ตสเตตัสฟรีได้ไหม แหล่งข้อมูลขัดกัน',
    'Payon Forest ช่วงต้นคลิปพูดถึงมอนชื่อ Boa ซึ่งไม่มีในฐานข้อมูล อาจเป็น Snake',
  ],
  sources: {
    kofa: { label: 'Kofa Roams', title: 'Acolyte Leveling Guide 1–50', url: 'https://www.youtube.com/watch?v=Jvsh0aTHlOU', kind: 'clip', lang: 'en' },
    yoinoA: { label: 'Yoino Buten', title: 'Acolyte 101 LV.1-50 ความรู้เบื้องต้น', url: 'https://www.youtube.com/watch?v=rnE7mp0yljY', kind: 'clip', lang: 'th' },
    viva: { label: 'Viva-Tz', title: 'แนะนำการอัพสกิล สเตตัส Priest บู๊ สาย Duple Light', url: 'https://www.youtube.com/watch?v=3DP9Vk5WftU', kind: 'clip', lang: 'th' },
    vivaStart: { label: 'Viva-Tz', title: 'เริ่มต้นเล่น Ragnarok Zero อย่างมืออาชีพ คลิปนี้มีคำตอบ', url: 'https://www.youtube.com/watch?v=WGJRg3dQElI', kind: 'clip', lang: 'th' },
    mimiw: { label: 'MimiwPK', title: 'Priest "Battle" Duple Light Build Guide', url: 'https://www.youtube.com/watch?v=SQe-i7Bz8cM', kind: 'clip', lang: 'th' },
    ryan: { label: 'Ryan Geldun', title: 'Priests are Overpowered in Ragnarok Zero Global', url: 'https://www.youtube.com/watch?v=xD3-EHWSr9A', kind: 'clip', lang: 'en' },
    meta: { label: 'Xiendong', title: 'Why Taiwan Players Build These Stats', url: 'https://www.youtube.com/watch?v=T5bjOqQomUc', kind: 'clip', lang: 'en' },
    tako: { label: 'TakoyakiCh', title: 'จัด Tierlist Class2 ในโลก RO-Zero', url: 'https://www.youtube.com/watch?v=Y7MKIY0KiYo', kind: 'clip', lang: 'th' },
    ncz: { label: 'NCZ', title: 'How to Set Up the Bot in Ragnarok Zero: Global', url: 'https://www.youtube.com/watch?v=GQ-RdRIhNP8', kind: 'clip', lang: 'en' },
    kamon: { label: 'KamonWay', title: 'How to Change to Class 2 for Every Job in 3 Minutes', url: 'https://www.youtube.com/watch?v=iTxVgyVGCbc', kind: 'clip', lang: 'en' },
    prontera: { label: 'roz.prontera.info', title: 'Acolyte skills', url: 'https://roz.prontera.info/jobs/acolyte', kind: 'web' },
    planner: { label: 'rozeroplanner', title: 'RO Zero skill planner', url: 'https://rozeroplanner.com/', kind: 'web' },
    db: { label: 'rozerothai.com', title: 'ฐานข้อมูลไอเทมและสกิลของเว็บ', url: 'https://rozerothai.com/', kind: 'web' },
    owner: { label: 'ยืนยันในเกม', title: 'เจ้าของเว็บตรวจในเกม 22 ก.ย. 2026', url: '', kind: 'web' },
  },
};
