// Swordman guide. Drafted 22 Sep 2026 from Downloads/roz-job-guides/swordman.md,
// which cites every line to a clip timestamp or a web page. No RO Zero clip
// teaches Swordman directly, so the builds come from player builds posted on
// roz.prontera.info (stats and skills only, no text), and the route and early
// gear come from general levelling clips. Items, monsters and maps were
// checked against the site database; equipment whose name matches several
// items in the database is named in text only.
import type { ClassGuide } from './types';

export const swordsman: ClassGuide = {
  slug: 'swordsman',
  job: 'Swordman',
  jobTh: 'สวอร์ดแมน',
  from: 'Novice',
  gathered: '22 ก.ย. 2026',
  summary:
    'อาชีพหนึ่งสายนักดาบ เป็นทางผ่านไป Knight หรือ Crusader ยังไม่มีคลิป RO Zero สอนเล่นโดยตรง ไกด์นี้จึงรวมบิลด์ที่ผู้เล่นลงไว้ กับเส้นทางเก็บเลเวลจากคลิปทั่วไป ควรวางสกิลให้ตรงกับสายขั้น 2 ที่จะไป',
  facts: [
    { text: 'เปลี่ยนจาก Novice ได้ที่ Job Lv 10 ขึ้นไป ที่ Swordman Guild ใน Izlude', cites: [['jobs']] },
    { text: 'Job ตันที่ 50 ได้แต้มสกิล 49 แต้ม', cites: [['owner'], ['planner']] },
    { text: 'เปลี่ยนเป็น Knight หรือ Crusader ได้ที่ Base Lv 50', cites: [['owner'], ['kamon', '00:46'], ['kamon', '02:11'], ['xroad', '05:23']] },
    {
      text: 'Spear Mastery อยู่ในผังสกิล Swordman ของ Zero เลย คลิปจัดเทียร์บอกว่าขั้น 1 ไม่มีอะไรเปลี่ยน นอกจากเพิ่มสกิลหอกเข้ามา (คำบรรยายอัตโนมัติไม่ชัด)',
      cites: [['jobs'], ['tako', '01:14']],
    },
  ],
  path: ['swordsman'],
  equipJob: 'Swordman',
  route: [
    { range: '1-9', text: 'ทำเควสเนื้อเรื่องตอนเริ่มเกม จะได้เลเวลมาถึงราว 9', cites: [['ncz', '01:51'], ['ncz', '02:01']] },
    { range: '9-15', text: 'Spore ที่ Payon Forest (ออกจาก Payon เลี้ยวขวา) มอนเลือดน้อย ถ้าคนเยอะให้ย้าย channel', maps: ['pay_fild08'], monsters: [1014], cites: [['ncz', '02:30'], ['ncz', '03:12'], ['ncz', '03:22']] },
    { range: '15-20', text: 'Prontera Sewer 2F ต้องลงทะเบียนกับ NPC หน้าท่อก่อน', maps: ['prt_sewb2'], monsters: [1051], cites: [['ncz', '03:41'], ['ncz', '04:21']] },
    { range: '20-30', text: 'Creamy กับ Smokie ที่ Gypsy Village ฝั่งซ้ายของ Geffen', maps: ['gef_fild05'], monsters: [1018, 1056], cites: [['ncz', '05:03'], ['ncz', '05:52']] },
    { range: '30-35', text: 'Coco ที่ Geffen Field ดรอป Hood กับรองเท้าแดง เลือดเยอะกว่ามด', maps: ['gef_fild02'], monsters: [1104], cites: [['ncz', '06:51'], ['ncz', '07:12'], ['xroad', '01:32']] },
    { range: '30-40', text: 'Ant Hell ตีได้ทุกตัว การ์ดมดขายได้ราคาดี', maps: ['anthell02'], monsters: [1095], cites: [['ncz', '07:01'], ['ncz', '09:41']] },
    { range: '~40', text: 'แมพเสริมสายหอก: สองแมพทางตะวันออกของ Payon มี Horn กับ Elder Willow คนน้อย EXP ใกล้ Coco ตัวเลเวล 40 เปิดบอทข้ามคืนได้ราว 2 เลเวล', maps: ['pay_fild09'], monsters: [1128, 1033], cites: [['chill', '00:09'], ['chill', '00:21'], ['chill', '00:30']] },
    { range: '40-50', text: 'Steel Chonchon (ดรอปของขายได้ราคาดี) หรือ Orc Village (ของไม่หรูแต่ EXP เยอะ) หรือแมพ "ปลากระดูก" ทางขวาของ Comodo (ชื่อมอนฟังไม่ชัด)', maps: ['gef_fild10'], monsters: [1042, 1023], cites: [['ncz', '11:02'], ['ncz', '11:20'], ['ncz', '13:01']] },
    { range: '50', text: 'เปลี่ยนเป็น Knight หรือ Crusader แล้วไป Nordfeld Cave 2F จนถึงเลเวลตัน', maps: ['nrd_dun02'], cites: [['owner'], ['xroad', '06:12']] },
  ],
  routeNotes: [
    { text: 'อีกเส้นทางหนึ่ง: Poison Spore ถึงราว 30-35 แล้ว Coco ถึง 35 จากนั้นเข้าปาร์ตี้กับตัวหลักเลเวล 50 ให้ช่วยดัน (แชร์ EXP ได้ถ้าเลเวลห่างไม่เกิน 15)', cites: [['xroad', '01:12'], ['xroad', '02:07']] },
    { text: 'Kafra วาร์ปฟรีถ้าเลเวลต่ำกว่า 40 เกินแล้วเสียราว 120 zeny', cites: [['ncz', '02:10'], ['ncz', '02:30']] },
    { text: 'ตีมอนต่างเลเวลเยอะ EXP ไม่ลด แต่ดรอปถูกหัก 50% ถ้าห่างเกินราว 19 เลเวล', cites: [['ncz', '10:12']] },
    { text: 'รีเซ็ตสเตตัสและสกิลฟรีจนถึงเลเวล 40 หลังจากนั้นต้องจ่ายเงินจริง รีเซ็ตที่ NPC ใน Payon', cites: [['xroad', '02:35'], ['knight', '01:36']] },
    { text: 'เล่นเป็นปาร์ตี้เก็บเลเวลเร็วกว่าโซโล่', cites: [['resbakk', '01:30']] },
  ],
  gearByLevel: [
    { range: 'ทั้งทาง', slot: 'ออปชั่น', text: 'ช่วงแรกเก็บออปชั่น Max HP กับ FLEE ก่อน ถ้าได้ FLEE ราว 15 ทุกชิ้น บวก FLEE บนอาวุธ จะได้ FLEE 250-300 เร็ว', cites: [['meta', '05:35'], ['meta', '03:31'], ['meta', '06:31']] },
    { range: 'ทั้งทาง', slot: 'ตีบวก', text: 'ไอเทมหลายชิ้นปลดโบนัสที่ +7 และ +9', cites: [['meta', '07:31']] },
    { range: '30-35', slot: 'ผ้าคลุม / รองเท้า', text: 'Hood กับรองเท้าแดงจาก Coco', items: [480414], cites: [['ncz', '06:51']] },
    { range: '~40', slot: 'อาวุธ', text: 'Guisarme กับ Partizan ดรอปที่แมพ Horn/Elder Willow ตะวันออกของ Payon (Guisarme คืออาวุธในบิลด์หอกด้านล่าง)', cites: [['chill', '00:36'], ['build1']] },
    { range: '~40', slot: 'การ์ด', text: 'Horn Card กับ Elder Willow Card ดรอปที่แมพเดียวกัน', items: [4045, 4052], cites: [['chill', '00:44']] },
    { range: '50+', slot: 'รองเท้า', text: 'Matyr Card หรือ Verit Card (Verit ให้ HP 8% น้อยกว่า Matyr 2% แต่ได้ SP ด้วย) มอนมาจากแมพพีระมิดในอัปเดตที่คลิปพูดถึงล่วงหน้า', items: [4097, 4107], cites: [['farm', '00:01'], ['farm', '01:01']] },
    { range: '50+', slot: 'การ์ด', text: 'Mummy Card เพิ่ม HIT ช่วยตีมอนที่ FLEE สูง', items: [4106], cites: [['farm', '02:28']] },
  ],
  strengths: [
    { text: 'Bash Lv 10 แรง 400% และเพิ่ม HIT 50% ตั้งแต่ Lv 6 มีโอกาสทำให้ Stun ถ้าเรียน Fatal Blow แล้ว (หน้าเว็บเตือนว่าค่าดึงมาจากอีกภูมิภาค)', cites: [['bash']] },
    { text: 'มีทั้งสายดาบสองมือและสายหอกในผังเดียว เตรียมสกิลไป Knight ได้ทั้งสองแบบ', cites: [['jobs'], ['bowling'], ['clashing']] },
    { text: 'เว็บเรียกว่าอาชีพแทงค์สายประชิด', cites: [['jobs']] },
  ],
  weaknesses: [
    { text: 'วางสกิลผิดสายขั้น 2 แล้วแก้ยาก เพราะหลังเลเวล 40 รีเซ็ตต้องเสียเงินจริง', cites: [['xroad', '02:35']] },
    { text: 'ยังไม่มีคลิป RO Zero ที่เล่าจุดแข็งจุดอ่อนของ Swordman โดยตรง', cites: [['tako', '01:14']] },
  ],
  builds: [
    {
      id: 'spear',
      name: 'สายหอกเก็บเลเวล (STR/DEX)',
      tag: 'สายหอก',
      pickIf: 'จะไป Knight สายหอก เปิดบอทเก็บเลเวล',
      idea: {
        text: 'บิลด์ "SVD Spear Swordie/Knight Leveling Build" ที่ผู้เล่นลงไว้ ถือหอก Guisarme ลง Spear Mastery เต็ม ชื่อบิลด์บอกว่าต่อเป็น Knight ได้ ไม่มีคำอธิบายเพิ่ม',
        cites: [['build1']],
      },
      stats: [
        { who: 'j a s e (ไม่บอกเลเวล)', str: '80', agi: '1', vit: '20', int: '1', dex: '50', luk: '1', cites: [['build1']] },
      ],
      skills: [
        { skill: 'Spear Mastery', level: 10, cites: [['build1']] },
        { skill: 'Bash', level: 10, cites: [['build1']] },
        { skill: 'Increase HP Recovery', level: 10, cites: [['build1']] },
        { skill: 'Provoke', level: 5, cites: [['build1']] },
        { skill: 'Magnum Break', level: 3, cites: [['build1']] },
        { skill: 'Endure', level: 2, cites: [['build1']] },
        { skill: 'Berserk', level: 1, why: 'สกิลเควส', cites: [['build1'], ['jobs']] },
        { skill: 'HP Recovery While Moving', level: 1, why: 'สกิลเควส', cites: [['build1'], ['jobs']] },
        { skill: 'Fatal Blow', level: 1, why: 'สกิลเควส ทำให้ Bash Lv 6 ขึ้นไปทำ Stun ได้', cites: [['build1'], ['bash']] },
      ],
      skillNotes: [
        { text: 'หน้าบิลด์ไม่ได้บอกลำดับอัพ ลำดับด้านบนเป็นแค่รายการ', cites: [['build1']] },
        { text: 'ไป Knight: Spear Dynamo ต้อง Spear Mastery 5 กับ Increase HP Recovery 5 ส่วน Clashing Spiral ต้อง Spear Mastery 5 บิลด์นี้ครบทั้งสองแล้ว', cites: [['dynamo'], ['clashing']] },
      ],
      plan: {
        picks: {
          swordsman: { 'Spear Mastery': 10, Bash: 10, 'Increase HP Recovery': 10, Provoke: 5, 'Magnum Break': 3, Endure: 2, Berserk: 1, 'HP Recovery While Moving': 1, 'Fatal Blow': 1 },
        },
        basis: { text: 'สกิลตามหน้าบิลด์ ส่วน Basic Skill, First Aid, Play Dead เป็นสกิล Novice ไม่นับแต้มของ Swordman', cites: [['build1']] },
        leftover: { text: 'หน้าบิลด์ลงแต้มไม่ครบ 49 ไม่ได้บอกว่าแต้มที่เหลือลงอะไร', cites: [['build1']] },
      },
      gear: [
        { slot: 'อาวุธ', text: 'Guisarme ดรอปที่แมพ Horn/Elder Willow ตะวันออกของ Payon', cites: [['build1'], ['chill', '00:36']] },
        { slot: 'หมวก', text: 'Helm', cites: [['build1']] },
        { slot: 'เสื้อ', text: 'Silk Robe', cites: [['build1']] },
        { slot: 'ผ้าคลุม', text: 'Hood', items: [480414], cites: [['build1']] },
        { slot: 'รองเท้า', text: 'Shoes', cites: [['build1']] },
      ],
      cautions: [
        { text: 'หน้าบิลด์ไม่บอกค่าตีบวก การ์ด ออปชั่นสุ่ม เลเวลตัวละคร หรือแมพ', cites: [['build1']] },
      ],
    },
    {
      id: 'agi-2h',
      name: 'สายดาบสองมือ AGI',
      tag: 'สายดาบสองมือ',
      pickIf: 'จะไป Knight ถือดาบสองมือ ตีเร็ว',
      idea: {
        text: 'บิลด์ "AGI Swordsman" ที่ผู้เล่นลงไว้ ลง AGI เป็นหลัก ถือ Two-Handed Sword เอา Two Handed Sword Mastery กับ Magnum Break เต็ม ไม่มีคำอธิบายเพิ่ม',
        cites: [['build2']],
      },
      stats: [
        { who: 'Zokaro (ไม่บอกเลเวล)', str: '23', agi: '62', vit: '6', int: '1', dex: '27', luk: '1', cites: [['build2']] },
      ],
      skills: [
        { skill: 'Two Handed Sword Mastery', level: 10, cites: [['build2']] },
        { skill: 'Bash', level: 10, cites: [['build2']] },
        { skill: 'Magnum Break', level: 10, cites: [['build2']] },
        { skill: 'Increase HP Recovery', level: 10, cites: [['build2']] },
        { skill: 'Provoke', level: 5, cites: [['build2']] },
        { skill: 'Endure', level: 3, cites: [['build2']] },
        { skill: 'Sword Mastery', level: 1, cites: [['build2']] },
        { skill: 'Berserk', level: 1, cites: [['build2']] },
        { skill: 'HP Recovery While Moving', level: 1, cites: [['build2']] },
        { skill: 'Fatal Blow', level: 1, cites: [['build2']] },
      ],
      skillNotes: [
        { text: 'หน้าบิลด์ไม่ได้บอกลำดับอัพ', cites: [['build2']] },
        { text: 'ไป Knight: Aura Blade ต้อง Magnum Break 5 กับ Two Handed Sword Mastery 5 · Parry ต้อง Two Handed Sword Mastery 10 กับ Provoke 5 บิลด์นี้ครบแล้ว', cites: [['aura'], ['parry']] },
      ],
      plan: {
        picks: {
          swordsman: { 'Two Handed Sword Mastery': 10, Bash: 10, 'Magnum Break': 10, 'Increase HP Recovery': 10, Provoke: 5, Endure: 3, 'Sword Mastery': 1, Berserk: 1, 'HP Recovery While Moving': 1, 'Fatal Blow': 1 },
        },
        basis: { text: 'สกิลตามหน้าบิลด์ของ Zokaro (Basic Skill เป็นของ Novice ไม่นับ)', cites: [['build2']] },
      },
      gear: [
        { slot: 'อาวุธ', text: 'Two-Handed Sword', cites: [['build2']] },
        { slot: 'หมวก', text: 'Angel Wing', items: [2254], cites: [['build2']] },
        { slot: 'เสื้อ', text: 'ใส่ Pupa Card', items: [4003], cites: [['build2']] },
        { slot: 'ผ้าคลุม', text: 'Muffler ใส่ Whisper Card', items: [4102], cites: [['build2']] },
        { slot: 'รองเท้า', text: 'Boots ใส่ Matyr Card', items: [470230, 4097], cites: [['build2']] },
        { slot: 'ประดับ', text: 'Brooch 2 ชิ้น', items: [2605], cites: [['build2']] },
      ],
      cautions: [
        { text: 'หน้าบิลด์ไม่บอกค่าตีบวก ออปชั่นสุ่ม หรือเลเวลตัวละคร', cites: [['build2']] },
      ],
    },
    {
      id: 'bowling-bash',
      name: 'เตรียม Bowling Bash (BB/SP)',
      tag: 'เตรียม Knight',
      pickIf: 'จะไป Knight ใช้ Bowling Bash ตีหมู่ และเก็บ Spear Mastery ไว้ด้วย',
      idea: {
        text: 'บิลด์ "BB/SP Build" ที่ผู้เล่นลงไว้ ลงสกิลให้ครบเงื่อนไข Bowling Bash และเก็บ Spear Mastery 5 ไว้ด้วย ผู้เล่น Knight คนหนึ่งบอกว่าตีหมู่ Bowling Bash ดีกว่า Brandish Spear เพราะถือดาบสองมือแล้วได้ใช้ Parry',
        cites: [['build3'], ['knight', '09:25']],
      },
      stats: [
        { who: 'Raganoth (ไม่บอกเลเวล)', str: '43', agi: '40', vit: '1', int: '20', dex: '30', luk: '1', cites: [['build3']] },
      ],
      skills: [
        { skill: 'Bash', level: 10, why: 'เงื่อนไข Bowling Bash', cites: [['build3'], ['bowling']] },
        { skill: 'Two Handed Sword Mastery', level: 10, why: 'Bowling Bash ต้อง 5 ส่วน Parry ต้อง 10', cites: [['build3'], ['bowling'], ['parry']] },
        { skill: 'Endure', level: 8, cites: [['build3']] },
        { skill: 'Magnum Break', level: 5, why: 'Bowling Bash ต้อง 3 ส่วน Aura Blade ต้อง 5', cites: [['build3'], ['bowling'], ['aura']] },
        { skill: 'Increase HP Recovery', level: 5, why: 'Spear Dynamo ต้อง 5', cites: [['build3'], ['dynamo']] },
        { skill: 'Spear Mastery', level: 5, why: 'Spear Dynamo กับ Clashing Spiral ต้อง 5', cites: [['build3'], ['dynamo'], ['clashing']] },
        { skill: 'Provoke', level: 5, why: 'Parry ต้อง 5', cites: [['build3'], ['parry']] },
        { skill: 'Sword Mastery', level: 1, cites: [['build3']] },
        { skill: 'Berserk', level: 1, cites: [['build3']] },
        { skill: 'HP Recovery While Moving', level: 1, cites: [['build3']] },
        { skill: 'Fatal Blow', level: 1, cites: [['build3']] },
      ],
      skillNotes: [
        { text: 'Bowling Bash ยังต้อง Counter Attack 5 กับ Two Hand Quicken 10 ของ Knight ด้วย', cites: [['bowling']] },
        { text: 'หน้าบิลด์ไม่ได้บอกลำดับอัพ', cites: [['build3']] },
      ],
      plan: {
        picks: {
          swordsman: { Bash: 10, 'Two Handed Sword Mastery': 10, Endure: 8, 'Magnum Break': 5, 'Increase HP Recovery': 5, 'Spear Mastery': 5, Provoke: 5, 'Sword Mastery': 1, Berserk: 1, 'HP Recovery While Moving': 1, 'Fatal Blow': 1 },
        },
        basis: { text: 'สกิลตามหน้าบิลด์ของ Raganoth (Basic Skill, First Aid, Play Dead เป็นของ Novice ไม่นับ)', cites: [['build3']] },
      },
      missing: 'หน้าบิลด์ไม่ได้ใส่ของไว้ และไม่มีคำอธิบาย',
    },
    {
      id: 'sword-knight',
      name: 'Sword/Knight (INT ผสม)',
      pickIf: 'อยากได้บิลด์ที่มีของครบ ถือดาบสองมือไป Knight',
      idea: {
        text: 'บิลด์ "Sword/Knight" ของผู้เล่นคนเดียวกับบิลด์ BB/SP สกิลเกือบเหมือนกัน แต่ลง INT มากกว่าและใส่ของไว้ด้วย',
        cites: [['build4'], ['build3']],
      },
      stats: [
        { who: 'Raganoth (ไม่บอกเลเวล)', str: '33', agi: '38', vit: '1', int: '30', dex: '27', luk: '1', cites: [['build4']] },
      ],
      skills: [
        { skill: 'Bash', level: 10, cites: [['build4']] },
        { skill: 'Two Handed Sword Mastery', level: 10, cites: [['build4']] },
        { skill: 'Endure', level: 8, cites: [['build4']] },
        { skill: 'Magnum Break', level: 5, cites: [['build4']] },
        { skill: 'Increase HP Recovery', level: 5, cites: [['build4']] },
        { skill: 'Spear Mastery', level: 5, cites: [['build4']] },
        { skill: 'Provoke', level: 5, cites: [['build4']] },
        { skill: 'Sword Mastery', level: 1, cites: [['build4']] },
        { skill: 'Berserk', level: 1, cites: [['build4']] },
        { skill: 'HP Recovery While Moving', level: 1, cites: [['build4']] },
      ],
      skillNotes: [
        { text: 'ต่างจากบิลด์ BB/SP แค่ไม่มี Fatal Blow และไม่ได้บอกลำดับอัพ', cites: [['build4'], ['build3']] },
      ],
      plan: {
        picks: {
          swordsman: { Bash: 10, 'Two Handed Sword Mastery': 10, Endure: 8, 'Magnum Break': 5, 'Increase HP Recovery': 5, 'Spear Mastery': 5, Provoke: 5, 'Sword Mastery': 1, Berserk: 1, 'HP Recovery While Moving': 1 },
        },
        basis: { text: 'สกิลตามหน้าบิลด์ของ Raganoth (Basic Skill เป็นของ Novice ไม่นับ)', cites: [['build4']] },
      },
      gear: [
        { slot: 'อาวุธ', text: '+4 Two-Handed Sword', cites: [['build4']] },
        { slot: 'หมวก', text: 'Hat ใส่ Willow Card', items: [4010], cites: [['build4']] },
        { slot: 'เสื้อ', text: 'Jacket ใส่ Roda Frog Card', items: [450347, 4014], cites: [['build4']] },
        { slot: 'ผ้าคลุม', text: '+4 Muffler ใส่ Condor Card', items: [4015], cites: [['build4']] },
        { slot: 'รองเท้า', text: '+4 Shoes', cites: [['build4']] },
      ],
      cautions: [
        { text: 'หน้าบิลด์ไม่บอกออปชั่นสุ่ม เลเวลตัวละคร หรือเหตุผลที่ลง INT', cites: [['build4']] },
      ],
    },
    {
      id: 'crusader',
      name: 'เตรียมไป Crusader',
      pickIf: 'จะเปลี่ยนเป็น Crusader',
      idea: {
        text: 'สกิลหลักของ Crusader อย่าง Rapid Smiting กับ Cannon Spear ใช้สกิลของ Crusader เองเป็นเงื่อนไข (Shield Boomerang 5, Spear Quicken 10)',
        cites: [['rapid'], ['cannon']],
      },
      missing: 'ยังไม่มีคลิปหรือบิลด์ที่บอกว่าช่วง Swordman ควรลงอะไรเพื่อไป Crusader และหน้าเว็บที่ดึงมาไม่ได้บอกสกิล Swordman ที่ Crusader ต้องใช้',
    },
  ],
  gaps: [
    'ยังไม่มีคลิป RO Zero สอนเล่น Swordman โดยตรง บิลด์ทั้งหมดมาจากหน้าบิลด์ที่ไม่มีคำอธิบาย ไม่บอกเลเวล และไม่บอกลำดับอัพ',
    'ยังไม่รู้ว่าช่วง Swordman ควรลงสกิลอะไรเพื่อไป Crusader',
    'ค่า Bash บนเว็บดึงมาจากอีกภูมิภาค อาจไม่ตรงกับ Zero หลังแพตช์',
    'แมพ "ปลากระดูก" ทางขวาของ Comodo ยังไม่รู้ชื่อมอนและรหัสแมพ',
    'ของเฉพาะ Swordman ตามช่วงเลเวลยังไม่มีข้อมูล',
  ],
  sources: {
    jobs: { label: 'roz.prontera.info', title: 'Swordsman', url: 'https://roz.prontera.info/jobs/swordsman', kind: 'web' },
    bash: { label: 'roz.prontera.info', title: 'Bash', url: 'https://roz.prontera.info/skills/bash', kind: 'web' },
    build1: { label: 'roz.prontera.info (j a s e)', title: 'SVD Spear Swordie/Knight Leveling Build', url: 'https://roz.prontera.info/builds/18b26b16-4bea-4393-94cc-5eeb50630dfe', kind: 'web' },
    build2: { label: 'roz.prontera.info (Zokaro)', title: 'AGI Swordsman', url: 'https://roz.prontera.info/builds/5d13ff7f-5bfe-49c6-8c7c-33d6d94142d2', kind: 'web' },
    build3: { label: 'roz.prontera.info (Raganoth)', title: 'BB/SP Build', url: 'https://roz.prontera.info/builds/13c50cce-c5ce-45cb-b327-e1167f788a27', kind: 'web' },
    build4: { label: 'roz.prontera.info (Raganoth)', title: 'Sword/Knight', url: 'https://roz.prontera.info/builds/045c3fe5-f48a-4c89-9561-064e5ecc0abe', kind: 'web' },
    bowling: { label: 'roz.prontera.info', title: 'Bowling Bash', url: 'https://roz.prontera.info/skills/bowling-bash', kind: 'web' },
    parry: { label: 'roz.prontera.info', title: 'Parry', url: 'https://roz.prontera.info/skills/parry', kind: 'web' },
    aura: { label: 'roz.prontera.info', title: 'Aura Blade', url: 'https://roz.prontera.info/skills/aura-blade', kind: 'web' },
    dynamo: { label: 'roz.prontera.info', title: 'Spear Dynamo', url: 'https://roz.prontera.info/skills/spear-dynamo', kind: 'web' },
    clashing: { label: 'roz.prontera.info', title: 'Clashing Spiral', url: 'https://roz.prontera.info/skills/clashing-spiral', kind: 'web' },
    rapid: { label: 'roz.prontera.info', title: 'Rapid Smiting', url: 'https://roz.prontera.info/skills/rapid-smiting', kind: 'web' },
    cannon: { label: 'roz.prontera.info', title: 'Cannon Spear', url: 'https://roz.prontera.info/skills/cannon-spear', kind: 'web' },
    ncz: { label: 'NCZ', title: 'Recommended Leveling Maps Lv. 1-50', url: 'https://www.youtube.com/watch?v=IScycVE-tf8', kind: 'clip', lang: 'th' },
    xroad: { label: 'Xiendong', title: 'My Current 1–60 Levelling Roadmap for my New Characters', url: 'https://www.youtube.com/watch?v=7ymM15xvYAY', kind: 'clip', lang: 'en' },
    meta: { label: 'Xiendong', title: 'Why Taiwan Players Build These Stats', url: 'https://www.youtube.com/watch?v=T5bjOqQomUc', kind: 'clip', lang: 'en' },
    farm: { label: 'Xiendong', title: 'NEW Farming Spots, Cards & EXP Areas!', url: 'https://www.youtube.com/watch?v=y7ySJekxEAw', kind: 'clip', lang: 'en' },
    chill: { label: 'Ryan Geldun', title: 'Chill Zeny and Exp farming spot you FORGOT about', url: 'https://www.youtube.com/watch?v=oEPSeeOEGVk', kind: 'clip', lang: 'en' },
    knight: { label: 'Ryan Geldun', title: 'My knight build in Ragnarok Zero Global', url: 'https://www.youtube.com/watch?v=jM7uBvSd66k', kind: 'clip', lang: 'en' },
    kamon: { label: 'KamonWay', title: 'How to Change to Class 2 for Every Job in 3 Minutes', url: 'https://www.youtube.com/watch?v=iTxVgyVGCbc', kind: 'clip', lang: 'th' },
    tako: { label: 'TakoyakiCh', title: 'จัด Tierlist Class2 ในโลก RO-Zero', url: 'https://www.youtube.com/watch?v=Y7MKIY0KiYo', kind: 'clip', lang: 'th' },
    resbakk: { label: 'Resbakk Gaming', title: 'RAGNAROK ZERO: GLOBAL | BEGINNERS GUIDE', url: 'https://www.youtube.com/watch?v=IKItqq2QXR8', kind: 'clip', lang: 'en' },
    planner: { label: 'rozeroplanner', title: 'RO Zero skill planner', url: 'https://rozeroplanner.com/', kind: 'web' },
    owner: { label: 'ยืนยันในเกม', title: 'เจ้าของเว็บตรวจในเกม 22 ก.ย. 2026', url: '', kind: 'web' },
  },
};
