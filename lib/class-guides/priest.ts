// Priest guide. Drafted 22 Sep 2026 from Downloads/roz-job-guides/priest.md,
// which cites every line to a clip timestamp or a web page. Items and skills
// were checked against the site database; lines the sources disagree on, or
// that only one player's numbers support, say so on the page.
import type { ClassGuide } from './types';

export const priest: ClassGuide = {
  slug: 'priest',
  job: 'Priest',
  jobTh: 'พรีสต์',
  from: 'Acolyte',
  gathered: '22 ก.ย. 2026',
  summary:
    'อาชีพสองของ Acolyte เล่นได้ทั้งสายตี (Duple Light) สายลงดัน และสายซัพพอร์ต เด่นเรื่องเปิดบอททั้งคืนได้เพราะ SP แทบไม่หมด',
  facts: [
    { text: 'เปลี่ยนเป็น Priest ได้ที่ Base Lv 50', cites: [['owner']] },
    { text: 'Job ตันที่ 70 ได้แต้มสกิล 69 แต้ม', cites: [['planner']] },
    {
      text: 'Duple Light, Basilica, Assumptio, Meditation, Cantocandidus, Clementia อยู่ในผังสกิล Priest เลย ได้ตั้งแต่เปลี่ยนอาชีพ ไม่ต้องทำอะไรเพิ่ม',
      cites: [['owner'], ['viva', '04:28'], ['mimiw', '03:53']],
    },
  ],
  strengths: [
    { text: 'ตีธรรมดาแล้ว Duple Light ยิงลูกแสงตามมา ได้ดาเมจทั้งกายภาพและเวท', cites: [['ryan', '01:02'], ['viva', '04:49']] },
    { text: 'SP แทบไม่หมดด้วย Meditation กับ Magnificat เปิดบอททั้งคืนได้', cites: [['viva', '05:34'], ['viva', '10:52']] },
    { text: 'บัฟทั้งปาร์ตี้: Cantocandidus (Increase Agility หมู่) และ Clementia (Blessing หมู่)', cites: [['viva', '05:56'], ['viva', '06:18']] },
    { text: 'TakoyakiCh จัดไว้เทียร์ SS ฝั่ง PvE (ประเมินก่อนอาชีพสองเปิด)', cites: [['tako', '10:29']] },
  ],
  weaknesses: [
    { text: 'Duple Light ตีทีละตัว ไม่มีท่าตีวงกว้าง', cites: [['ryan', '03:34']] },
    { text: 'ช่วงเพิ่งเปลี่ยนอาชีพ SP ไม่พอเปิดบัฟหมู่ครบ', cites: [['viva', '07:02']] },
    { text: 'แต้มไม่พอเอาทุกอย่าง ต้องเลือกระหว่าง Kyrie Eleison กับ Assumptio', cites: [['viva', '07:47']] },
  ],
  builds: [
    {
      id: 'duple-light',
      name: 'สายตี Duple Light (AGI/INT)',
      tag: 'สายหลัก',
      pickIf: 'อยากเปิดบอทเก็บเลเวลหรือฟาร์มคนเดียว',
      idea: {
        text: 'ตีธรรมดาให้เร็วที่สุด เพื่อให้ Duple Light ออกถี่ ดาเมจลูกแสงฝั่งเวทแรงกว่าฝั่งกายภาพ เลยลง INT ด้วย มอนส่วนใหญ่ MDEF ต่ำกว่า DEF จึงคุ้ม',
        cites: [['viva', '08:32'], ['mimiw', '05:35'], ['ryan', '01:47']],
      },
      stats: [
        { who: 'Viva-Tz (Lv 60)', str: 'ที่เหลือ', agi: '70', int: '25', dex: '25', note: 'HIT เสริมจากหมวกออปชั่น HIT +15', cites: [['viva', '08:32'], ['viva', '08:54']] },
        { who: 'MimiwPK (Lv 60)', agi: '70', int: '29', dex: '20', note: 'FLEE ราว 300 ตอนมีบัฟ ถ้ามอนหลบเกิน 300 ให้เพิ่ม DEX', cites: [['mimiw', '00:17'], ['mimiw', '00:47']] },
      ],
      statNotes: [
        { text: 'เน้น ASPD ให้สูงสุด Viva-Tz ตั้งเป้าราว 180 ผู้เล่นไต้หวันถือ 190 เป็นเลขเป้าหมาย', cites: [['ryan', '03:05'], ['viva', '11:33'], ['meta', '01:23']] },
      ],
      skills: [
        { skill: 'Duple Light', level: 10, why: 'เอาก่อนเลย ต้องผ่าน Aspersio 1 (ซึ่งต้อง Aqua Benedicta 1 กับ Impositio Manus 3)', cites: [['viva', '04:28'], ['mimiw', '02:22'], ['ryan', '01:16']] },
        { skill: 'Meditation', level: 10, why: 'Max SP +10% และฟื้น SP เร็วขึ้น', cites: [['viva', '05:11']] },
        { skill: 'Magnificat', level: 5, why: 'ฟื้น SP เพิ่ม', cites: [['viva', '05:34'], ['mimiw', '03:23']] },
        { skill: 'Cantocandidus', level: 3, why: 'AGI มากกว่า Increase Agility ธรรมดา ใช้ SP 240', cites: [['viva', '05:56'], ['viva', '07:02']] },
        { skill: 'Clementia', level: 3, why: 'Blessing แบบหมู่ ใช้ SP 360 ช่วงแรกใช้ Blessing ธรรมดาไปก่อน', cites: [['viva', '06:42'], ['viva', '07:26']] },
        { skill: 'Impositio Manus', level: 5, cites: [['viva', '07:26'], ['mimiw', '03:53']] },
        { skill: 'Aspersio', level: 5, cites: [['viva', '07:47'], ['mimiw', '03:53']] },
        { skill: 'Kyrie Eleison', level: 10, why: 'หรือเลือก Assumptio แทนถ้าแต้มไม่พอ', cites: [['mimiw', '02:52'], ['viva', '08:11'], ['ryan', '02:31']] },
      ],
      skillNotes: [
        { text: 'MimiwPK ต่อด้วย Gloria 5 (LUK +30 ช่วย CRIT และ HIT) กับ Basilica 5 (ตี Shadow/Undead แรงขึ้น)', cites: [['mimiw', '03:23'], ['mimiw', '03:53']] },
        { text: 'ทุกคลิปอัดตอน Job 60 ชุดสกิลนี้จึงใช้ราว 59 แต้ม อีก 10 แต้มถึง Job 70 ยังไม่มีใครทำคลิป', cites: [['viva', '00:14'], ['mimiw', '00:17']] },
      ],
      gear: [
        { slot: 'อาวุธ', text: 'หนังสือที่ได้จากเควสเปลี่ยนอาชีพ ให้ทั้ง ATK และ MATK แค่นี้ก็พอ', cites: [['ryan', '00:47'], ['mimiw', '06:06']] },
        { slot: 'หมวก', text: 'หมวก Lv 50 ออปชั่น FLEE หรือ HIT', cites: [['mimiw', '04:57'], ['viva', '08:54']] },
        { slot: 'เสื้อ', text: 'เสื้อ Lv 50 ออปชั่นฟื้น SP ใส่ Roda Frog Card', items: [4014], cites: [['mimiw', '04:57'], ['viva', '10:16']] },
        { slot: 'รองเท้า', text: 'รองเท้า Lv 50 ออปชั่น HP กับ FLEE', cites: [['mimiw', '05:35']] },
        { slot: 'ผ้าคลุม', text: 'ออปชั่น HP กับ FLEE ใส่ Shark Family Card เพิ่ม MATK', items: [300835], cites: [['mimiw', '05:35'], ['zixma', '02:26']] },
        { slot: 'ประดับ', text: 'อะไรก็ได้ที่ให้ STR หรือ AGI', cites: [['mimiw', '06:06']] },
        { slot: 'ออปชั่นสุ่ม', text: 'เน้น ASPD: AGI หรือ ASPD %', cites: [['ryan', '03:21']] },
      ],
      play: [
        { text: 'ลำดับบัฟในบอท: Duple Light, Magnificat, Cantocandidus, Clementia, Impositio Manus, Assumptio', cites: [['viva', '09:16']] },
        { text: 'Teleport เมื่อไม่มีการต่อสู้ 3 วินาที หรือโดนดาเมจเกิน 300-500 · Heal เมื่อเลือดต่ำกว่า 80% ไม่ต้องใส่ยา', cites: [['mimiw', '06:50'], ['mimiw', '07:42']] },
      ],
      maps: [
        { text: 'Golem: HP สูงแต่ไม่ตีก่อน เหมาะเปิดบอท', cites: [['ryan', '02:03']] },
        { text: 'Geffen Dungeon (แพตช์ใหม่): มอน HP สูง EXP ดี คาดว่าเข้าทาง Priest (ความเห็น ยังไม่ได้ทดสอบ)', cites: [['farm', '03:28']] },
      ],
      cautions: [
        { text: 'ถ้าเลือกแมพที่มอนแรงเกินของ บอทจะฮีลทั้งคืนจน SP ไม่พอใช้สกิลอื่น', cites: [['viva', '10:52']] },
      ],
    },
    {
      id: 'dungeon',
      name: 'สายลงดัน / Memorial Dungeon',
      pickIf: 'อยากโซโลดันอย่าง Golden Thief Bug',
      idea: {
        text: 'FLEE สูงมาก ยืนใน Safety Wall กับ Sanctuary สู้บอส ใช้ Magnus Exorcismus เคลียร์ไข่ ZixmaOne โซโล GTB ระดับ Hard ได้ที่ Lv 59',
        cites: [['zixma', '00:02'], ['zixma', '00:24'], ['zixma', '05:40']],
      },
      stats: [
        { who: 'ZixmaOne (Lv 59)', note: 'ไม่ได้บอกตัวเลข · FLEE 330 ตอนยืน 340 ตอนมีบัฟ', cites: [['zixma', '00:24'], ['zixma', '02:50']] },
      ],
      skills: [
        { skill: 'Magnus Exorcismus', level: '5-10', why: 'Lv 5 ก็ระเบิดไข่ได้ในครั้งเดียว', cites: [['zixma', '03:16']] },
        { skill: 'Safety Wall', level: 10, why: 'ลดได้แต่ต้องกดบ่อยขึ้น', cites: [['zixma', '03:38']] },
        { skill: 'Sanctuary', level: '6-7', why: 'ถ้าลด Magnus เหลือ 5 ให้เอา Sanctuary 7', cites: [['zixma', '04:01']] },
        { skill: 'Heal', level: 3, why: 'ลดได้ เพราะในดันนี้ไม่ได้ใช้', cites: [['zixma', '02:50']] },
      ],
      gear: [
        { slot: 'อาวุธ', text: 'หนังสือ (ตีเร็ว) ใส่ Fur Seal Card หรือ Fabre Card', items: [4312, 4002], cites: [['zixma', '01:40'], ['zixma', '02:02']] },
        { slot: 'เสื้อ', text: 'เสื้อ FLEE +13 ตีบวก 9 ใส่ Pupa Card', items: [4003], cites: [['zixma', '01:13']] },
        { slot: 'โล่', text: 'Bigfoot Card (ลดดาเมจจากแมลง 30% เหมาะกับ GTB)', items: [4074], cites: [['zixma', '01:13']] },
        { slot: 'รองเท้า', text: 'ออปชั่น FLEE +15', cites: [['zixma', '02:26']] },
        { slot: 'ประดับ', text: 'Yoyo Card 2 ข้าง', items: [4051], cites: [['zixma', '02:26']] },
      ],
      play: [
        { text: 'เปลี่ยนธาตุอาวุธเป็นไฟ เพราะ GTB ธาตุไฟ ดาเมจที่สะท้อนกลับจะเบาลง ส่วนดาเมจเวทไม่สะท้อน', cites: [['zixma', '04:01'], ['zixma', '04:26']] },
        { text: 'วาง Sanctuary เยื้องตัวไม่ให้บอสยืนทับ และเปิด Safety Wall ตัวเองตลอด', cites: [['zixma', '04:51'], ['zixma', '05:13']] },
      ],
      cautions: [
        { text: 'Safety Wall หลุดแล้วโดนเวทครั้งเดียวตายได้', cites: [['zixma', '06:04']] },
        { text: 'Orc Hero Memorial ระดับ Hard ยากเกินไป ระดับปกติง่ายกว่า GTB มาก', cites: [['zixma', '06:25'], ['zixma', '06:51']] },
      ],
    },
    {
      id: 'support',
      name: 'สายซัพพอร์ต',
      pickIf: 'เล่นเป็นไอดีสองคอยบัฟ ฮีล และพาตัวหลักเก็บเลเวล',
      idea: {
        text: 'ลง INT เพื่อฮีลแรงและ SP เยอะ คอยบัฟทั้งปาร์ตี้ Ryan Geldun แนะนำทำไว้เป็นไอดีสองสำหรับลง Memorial Dungeon และพาตัวอื่นเก็บเลเวล',
        cites: [['ryan', '03:34'], ['ryan', '03:50']],
      },
      stats: [
        { who: 'ไกด์บน midgardhub', int: '90-99', vit: '40-60', dex: '60-80', agi: 'ที่เหลือ', note: 'ยังไม่ได้ตรวจว่าเลเวลตันตอนนี้ลงได้ถึงไหม', cites: [['midgard']] },
      ],
      skills: [
        { skill: 'Magnificat', level: 5, cites: [['midgard']] },
        { skill: 'Sanctuary', level: 10, cites: [['midgard']] },
      ],
      skillNotes: [
        { text: 'ไกด์นี้บอกว่า Kyrie Eleison คุ้มกว่า Assumptio สำหรับแทงค์บางแบบ เพราะกันเป็นจำนวนครั้ง ไม่สนว่าดาเมจแรงแค่ไหน', cites: [['midgard']] },
      ],
      missing: 'ยังไม่มีคลิป RO Zero สอนสายนี้โดยตรง ของที่ไกด์ midgardhub แนะนำไม่มีในฐานข้อมูลเกมของเราเลยสักชิ้น จึงไม่ได้ใส่',
    },
    {
      id: 'magnus',
      name: 'สายเวท Magnus Exorcismus',
      pickIf: 'อยากฟาร์มมอนเป็นกลุ่ม',
      idea: { text: 'มีคนพูดถึงว่าเป็นหนึ่งในสายหลักของ Priest ใน Zero', cites: [['round1']] },
      missing: 'คลิปที่สอนสายนี้ไม่มีคำบรรยายให้ดึง ยังไม่มีข้อมูลสกิล สเตตัส หรือของ',
    },
  ],
  gaps: [
    'ยังไม่มีชุดสกิลครบ 69 แต้ม (Job 70) ทุกคลิปอัดตอน Job 60',
    'ยังไม่รู้ชื่อหนังสือที่ได้จากเควสเปลี่ยนอาชีพ',
    'ยังไม่มีแมพเก็บเลเวลช่วง 50-70 แบบเป็นขั้น',
    'Magnus Exorcismus ตีได้ทุกมอนหรือเฉพาะ Undead/Demon แหล่งข้อมูลยังขัดกัน',
  ],
  sources: {
    viva: { label: 'Viva-Tz', title: 'แนะนำการอัพสกิล สเตตัส Priest บู๊ สาย Duple Light', url: 'https://www.youtube.com/watch?v=3DP9Vk5WftU', kind: 'clip', lang: 'th' },
    mimiw: { label: 'MimiwPK', title: 'Priest "Battle" Duple Light Build Guide', url: 'https://www.youtube.com/watch?v=SQe-i7Bz8cM', kind: 'clip', lang: 'en' },
    ryan: { label: 'Ryan Geldun', title: 'Priests are Overpowered in Ragnarok Zero Global', url: 'https://www.youtube.com/watch?v=xD3-EHWSr9A', kind: 'clip', lang: 'en' },
    zixma: { label: 'ZixmaOne', title: 'Solo Dungeon Guide LV.59 Battle Priest (Hard Difficulty)', url: 'https://www.youtube.com/watch?v=15tX8b5nn24', kind: 'clip', lang: 'en' },
    tako: { label: 'TakoyakiCh', title: 'จัด Tierlist Class2 ในโลก RO-Zero', url: 'https://www.youtube.com/watch?v=Y7MKIY0KiYo', kind: 'clip', lang: 'th' },
    farm: { label: 'Xiendong', title: 'NEW Farming Spots, Cards & EXP Areas!', url: 'https://www.youtube.com/watch?v=y7ySJekxEAw', kind: 'clip', lang: 'en' },
    meta: { label: 'Xiendong', title: 'Why Taiwan Players Build These Stats', url: 'https://www.youtube.com/watch?v=T5bjOqQomUc', kind: 'clip', lang: 'en' },
    midgard: { label: 'midgardhub', title: 'Priest guide', url: 'https://midgardhub.com/guides/priest', kind: 'web' },
    planner: { label: 'rozeroplanner', title: 'RO Zero skill planner', url: 'https://rozeroplanner.com/', kind: 'web' },
    round1: { label: 'Ryan Geldun (เบต้า)', title: 'Priest builds for Ragnarok Zero Global', url: 'https://www.youtube.com/watch?v=4P_y8nJdTqI', kind: 'clip', lang: 'en' },
    owner: { label: 'ยืนยันในเกม', title: 'เจ้าของเว็บตรวจในเกม 22 ก.ย. 2026', url: '', kind: 'web' },
  },
};
