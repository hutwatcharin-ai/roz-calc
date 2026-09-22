// Bard guide. Drafted 22 Sep 2026 from Downloads/roz-job-guides/bard.md and
// archer.md, which cite every line to a clip timestamp or a web page, with the
// two Ryan Geldun transcripts re-read for timestamps. Both Ryan clips were
// filmed before Global opened (one previews KRO Zero, one reviews Taiwan Zero
// footage), so the page says so where it leans on them. Skill names follow the
// site's trees (Magic Strings = Poem of Bragi, and so on); a pairing that only
// comes from reading the skill descriptions is marked as not yet confirmed.
// Clips from other games (Ragnarok Landverse, Project Zero) were left out.
import type { ClassGuide } from './types';

export const bard: ClassGuide = {
  slug: 'bard',
  job: 'Bard',
  jobTh: 'บาร์ด',
  from: 'Archer',
  gathered: '22 ก.ย. 2026',
  summary:
    'อาชีพสองของ Archer ตัวละครชาย เพลงกลายเป็นบัฟหมู่แบบบัฟพระ ร่ายแล้วเดินฟาร์มต่อได้ และยิง Arrow Vulcan ด้วยเครื่องดนตรีได้เลย ยังมีคลิป Zero สอน Bard โดยตรงน้อยมาก',
  facts: [
    { text: 'เปลี่ยนเป็น Bard ได้ที่ Base Lv 50 ตัวละครชายได้ Bard ตัวละครหญิงได้ Dancer', cites: [['owner'], ['ryanBD', '00:02']] },
    { text: 'Job ตันที่ 70 ได้แต้มสกิล 69 แต้ม', cites: [['owner'], ['planner']] },
    {
      text: 'Arrow Vulcan, Marionette Control, Tarot Card of Fate, Hermode\'s Rod และ Sheltering Bliss อยู่ในผังสกิล Bard เลย ได้ตั้งแต่เปลี่ยนอาชีพ',
      cites: [['db'], ['tako', '00:05']],
    },
    {
      text: 'เพลงกลายเป็นบัฟหมู่แบบบัฟพระ ร่ายครั้งเดียวทุกคนในระยะได้บัฟติดตัวราว 3 นาที ไม่ต้องยืนในวง และมีผลกับตัวผู้ร่ายด้วย',
      cites: [['ryanBD', '04:20'], ['ryanBD', '04:39'], ['ryanBD', '07:02'], ['ryanAV', '06:09']],
    },
  ],
  path: ['archer', 'bard'],
  equipJob: 'Bard',
  route: [
    { range: '1-9', text: 'ทำเควสเนื้อเรื่องช่วงต้นไปก่อน พอเลเวล 9 ให้วาร์ปไป Payon', cites: [['ncz', '01:51'], ['ncz', '02:05']] },
    { range: '9-15', text: 'แมพเห็ดแดงข้าง Payon ตั้งบอทตีได้เลย (ชื่อแมพฟังจากซับอัตโนมัติ น่าจะเป็นแมพ Spore)', maps: ['pay_fild08'], monsters: [1014], cites: [['ncz', '02:40'], ['ncz', '03:15']] },
    { range: '15-20', text: 'Prontera Sewer ชั้น 2 ตั้งบอทตีได้ทุกตัว', maps: ['prt_sewb2'], monsters: [1051], cites: [['ncz', '04:19'], ['ncz', '04:24']] },
    { range: '20-30', text: 'Creamy กับ Smokie แถว Geffen ลุ้น Creamy Card กับเสื้อ คนเยอะให้ย้าย channel', maps: ['gef_fild05'], monsters: [1018, 1056], cites: [['ncz', '04:59'], ['ncz', '05:43'], ['ncz', '06:22']] },
    { range: '30-35', text: 'Coco ที่ Geffen Field ตั้งบอทตีได้ทุกตัว', maps: ['gef_fild02'], monsters: [1104], cites: [['ncz', '06:51'], ['ncz', '07:49'], ['xroad', '01:34']] },
    { range: '30-40', text: 'Ant Hell ถ้าอยากเก็บเลเวลไวกว่า Coco และได้ลุ้นการ์ดมด', maps: ['anthell02'], monsters: [1095], cites: [['ncz', '06:56'], ['ncz', '07:12'], ['ncz', '09:46']] },
    { range: '40-50', text: 'Orc Village, Steel Chonchon หรือแมพปลากระดูกแถว Comodo (ชื่อมอนตัวหลังฟังจากซับอัตโนมัติ ยังไม่รู้ว่าตัวไหน)', maps: ['gef_fild10', 'moc_fild13'], monsters: [1023, 1042], cites: [['ncz', '10:58'], ['ncz', '11:50'], ['ncz', '12:52'], ['ncz', '13:38']] },
    { range: '50', text: 'เปลี่ยนเป็น Bard', cites: [['owner']] },
    { range: '50+', text: 'ยังไม่มีคลิปบอกแมพเก็บเลเวลของ Bard · Ryan Geldun ลองตัว Dancer ตี Sohee ที่ Payon Cave 4F (อัดก่อน Global เปิด)', maps: ['pay_dun03'], monsters: [1170], cites: [['ryanBD', '06:01']] },
  ],
  routeNotes: [
    { text: 'อีกทางหนึ่ง: Xiendong ตั้งบอทที่ Poison Spore ไปถึงราวเลเวล 30-35 แล้วย้ายไป Coco', cites: [['xroad', '01:12'], ['xroad', '01:40']] },
    { text: 'วาร์ป Kafra ฟรีถ้าเลเวลต่ำกว่า 40', cites: [['onenight', '09:03'], ['ncz', '02:20']] },
    {
      text: 'รีสกิลและรีสเตตัสฟรีได้ที่ NPC ในกำแพงเมือง Prontera ถ้าเลเวลยังไม่เกิน 40 เลย 40 แล้ว Xiendong บอกว่าต้องเสียเงิน อีกคลิปบอกแค่ว่ารีไม่ได้ สองคลิปพูดไม่ตรงกัน',
      cites: [['reset', '00:04'], ['reset', '01:07'], ['xroad', '02:39']],
    },
  ],
  gearByLevel: [
    { range: 'ทั้งทาง', slot: 'ลูกธนู', text: 'Silver Arrow ซื้อได้ที่ร้าน NPC ใน Payon แต่แพงกว่าร้านที่ผู้เล่นตั้งขาย ซองหนึ่งมี 500 ดอก', items: [1751, 12009], cites: [['onenight', '09:10'], ['onenight', '09:37'], ['onenight', '10:00']] },
    { range: '30+', slot: 'หมวก', text: 'Apple of Archer ให้ DEX +3 build Bard บน prontera ก็ใส่', items: [2285], cites: [['db'], ['pbard']] },
    { range: '33+', slot: 'อาวุธ', text: 'ธนูระดับ 3 ช่วง Archer: Gakkung Bow (ATK 100) หรือ Arbalest (ATK 90, DEX +2)', items: [700084, 700113], cites: [['db']] },
    { range: '33+', slot: 'ออปชั่นธนู', text: 'หา ATK ให้สูง (สูงสุด 30) ตามด้วยสเตตัสรองที่ build ใช้ บรรทัดที่ 3 หาดาเมจต่อเผ่า Insect, Demi-Human หรือ Brute', cites: [['hbow', '00:19'], ['hbow', '00:29']] },
    { range: '50+', slot: 'หมวก / รองเท้า', text: 'Binoculars กับ Guard\'s Boots ใน build Bard บน prontera ต้องเลเวล 50', items: [2296, 470464], cites: [['pbard'], ['db']] },
  ],
  strengths: [
    { text: 'ร่ายเพลงบัฟปาร์ตี้ครั้งเดียว แล้วเดินฟาร์มต่อพร้อมปาร์ตี้ได้เลย ไม่ต้องยืนนิ่งแบบ Classic', cites: [['ryanBD', '04:47'], ['ryanBD', '05:01']] },
    { text: 'ยิง Arrow Vulcan ด้วยเครื่องดนตรีได้ ไม่ต้องสลับไปถือธนู ลงทุนอาวุธชิ้นเดียวพอ', cites: [['ryanAV', '05:46'], ['db']] },
    { text: 'TakoyakiCh บอกว่า Arrow Vulcan แรงถึง 3,000% และจัด Bard/Dancer ไว้ระหว่าง S กับ SS (ให้ S+)', cites: [['tako', '09:20'], ['tako', '10:13']] },
    { text: 'Ryan Geldun มองว่า Bard เป็นอาชีพซัพพอร์ตที่ดีที่สุดตัวหนึ่ง', cites: [['ryanBD', '00:11']] },
  ],
  weaknesses: [
    { text: 'Arrow Vulcan มีคูลดาวน์ ต้องตั้งบอทให้ใช้สลับกับสกิลอื่น', cites: [['tako', '09:38'], ['tako', '09:42']] },
    { text: 'ไม่ได้ลง STR จึงน้ำหนักเกินง่าย', cites: [['ryanBD', '07:26']] },
    { text: 'ถ้าจะเล่นสายยิงธนู ต้องแย่งธนูดีๆ กับ Hunter', cites: [['ryanBD', '06:30']] },
    {
      text: 'Ryan คาดว่าจะมี Bard มากกว่า Dancer ถ้าอยากเล่นสายเพลงจริงๆ ให้คิดถึง Dancer ด้วย เพราะปาร์ตี้ต้องการตัวไปเล่นเพลงคู่ (คาดการณ์ก่อนเซิร์ฟเปิด)',
      cites: [['ryanBD', '08:33'], ['ryanBD', '08:45']],
    },
  ],
  builds: [
    {
      id: 'arrow-vulcan',
      name: 'สายยิง Arrow Vulcan (INT/DEX)',
      tag: 'สายหลัก',
      pickIf: 'อยากตีเองได้ด้วย ไม่ใช่แค่บัฟ',
      idea: {
        text: 'ยิง Arrow Vulcan ด้วยเครื่องดนตรี และลง INT เพราะ Melody Strike ดาเมจเพิ่มตาม INT build นี้มาจาก MrRegenbogen บน prontera ชื่อ "Arrow Vulcan Demi-Human"',
        cites: [['pbard'], ['db']],
      },
      stats: [
        { who: 'MrRegenbogen บน prontera', str: '1', agi: '1', vit: '1', int: '58', dex: '65', luk: '1', cites: [['pbard']] },
      ],
      statNotes: [
        { text: 'Melody Strike ดาเมจเพิ่มตาม INT ส่วน Arrow Vulcan ขึ้นกับสเตตัสไหน ฐานข้อมูลไม่ได้บอก', cites: [['db']] },
      ],
      skills: [
        { skill: 'Double Strafe', level: 10, why: 'ช่วง Archer', cites: [['pbard'], ['pother']] },
        { skill: "Owl's Eye", level: 10, cites: [['pbard'], ['pother']] },
        { skill: 'Arrow Shower', level: 9, why: 'Arrow Vulcan ต้องมี Arrow Shower 5 กับ Double Strafe 5', cites: [['pbard'], ['db']] },
        { skill: "Vulture's Eye", level: 10, cites: [['pbard'], ['pother']] },
        { skill: 'Improve Concentration', level: 10, cites: [['pbard'], ['pother']] },
        { skill: 'Music Lessons', level: 10, why: 'ช่วง Bard', cites: [['pbard']] },
        { skill: 'Melody Strike', level: 5, why: 'ยิง 2 ครั้งด้วยเครื่องดนตรี และเป็นเงื่อนไขของ Arrow Vulcan', cites: [['pbard'], ['db']] },
        { skill: 'Arrow Vulcan', level: 10, why: 'สกิลหลักของ build', cites: [['pbard']] },
        { skill: 'Magic Strings', level: 10, why: 'Poem of Bragi เดิม', cites: [['pbard'], ['planner']] },
        { skill: 'Impressive Riff', level: 9, why: 'เพิ่ม ASPD ให้ปาร์ตี้', cites: [['pbard'], ['db']] },
        { skill: 'Acoustic Rhythm', level: 5, cites: [['pbard']] },
        { skill: 'Mental Sensing', level: 5, why: 'เพิ่ม EXP ปาร์ตี้', cites: [['pbard'], ['db']] },
        { skill: 'Unchained Serenade', level: 3, cites: [['pbard']] },
        { skill: 'Amp', level: 1, cites: [['pbard']] },
        { skill: 'Encore', level: 1, cites: [['pbard']] },
      ],
      skillNotes: [
        { text: 'build นี้บอกแค่ยอดสุดท้าย ไม่ได้บอกลำดับการอัพ ลำดับข้างบนเรียงตามที่ build แสดง', cites: [['pbard']] },
        {
          text: 'ฐานข้อมูลใส่เงื่อนไข Arrow Vulcan ทั้ง Melody Strike (Bard) และ Slinging Arrow (Dancer) แต่ build นี้ไม่มี Slinging Arrow ก็ได้ Arrow Vulcan 10 จึงน่าจะใช้ตัวใดตัวหนึ่งตามอาชีพ (อนุมานเอง)',
          cites: [['db'], ['pbard']],
        },
      ],
      plan: {
        picks: {
          archer: { 'Double Strafe': 10, "Owl's Eye": 10, 'Arrow Repel': 1, 'Arrow Shower': 9, "Vulture's Eye": 10, 'Arrow Crafting': 1, 'Improve Concentration': 10 },
          bard: { Amp: 1, 'Music Lessons': 10, 'Unchained Serenade': 3, Encore: 1, 'Melody Strike': 5, 'Impressive Riff': 9, 'Magic Strings': 10, 'Acoustic Rhythm': 5, 'Mental Sensing': 5, 'Arrow Vulcan': 10 },
        },
        basis: {
          text: 'สกิลทั้งหมดของ build MrRegenbogen ช่วง Archer ตรงกับอีก build บน prontera ทุกตัว (Arrow Repel กับ Arrow Crafting เป็นสกิลเควส ไม่กินแต้ม)',
          cites: [['pbard'], ['pother'], ['planner']],
        },
        leftover: { text: 'ช่วง Bard ใช้ 59 แต้ม build ไม่ได้บอกว่าอีก 10 แต้มลงอะไร', cites: [['pbard']] },
      },
      gear: [
        { slot: 'อาวุธ', text: 'Lute ตีบวก 9 ใส่ Boulder Dwarf Captain Card 2 ใบ (ตี Boulder Dwarf +30%) กับ Hydra Card 1 ใบ (ตี Demi-Human +20%)', items: [300944, 4035], cites: [['pbard'], ['db']] },
        { slot: 'โล่', text: 'Silver Guard ใส่ Thara Frog Card (ลดดาเมจจาก Demi-Human 30%)', items: [460070, 4058], cites: [['pbard'], ['db']] },
        { slot: 'หมวก', text: 'บน Apple of Archer · กลาง Binoculars (Lv 50) · ล่าง Grampa Beard', items: [2285, 2296, 2241], cites: [['pbard'], ['db']] },
        { slot: 'เสื้อ', text: 'Tights ใส่ Sandman Card', items: [4101], cites: [['pbard']] },
        { slot: 'ผ้าคลุม', text: 'Muffler ไม่ใส่การ์ด', cites: [['pbard']] },
        { slot: 'รองเท้า', text: 'Guard\'s Boots (Lv 50)', items: [470464], cites: [['pbard'], ['db']] },
        { slot: 'ประดับ', text: 'Earring 2 ชิ้น (INT +2 ต่อชิ้น)', items: [2602], cites: [['pbard'], ['db']] },
        { slot: 'ลูกธนู', text: 'Fire Arrow', items: [1752], cites: [['pbard']] },
      ],
      cautions: [
        { text: 'ต้องถือเครื่องดนตรีถึงจะใช้ Arrow Vulcan และ Melody Strike ได้', cites: [['db']] },
        { text: 'Arrow Vulcan มีคูลดาวน์ ตั้งบอทให้ใช้สลับกับสกิลอื่น', cites: [['tako', '09:38']] },
      ],
    },
    {
      id: 'autocast',
      name: 'สาย ASPD + อาวุธออโต้แคสต์ Arrow Vulcan',
      pickIf: 'อยากเปิดบอทตีธรรมดาเร็วๆ ให้อาวุธยิง Arrow Vulcan เอง',
      idea: {
        text: 'จากภาพ Taiwan Zero แทบทุกคนเล่นแบบเดียวกัน คือเพิ่มความเร็วโจมตีให้สุด แล้วให้อาวุธออโต้แคสต์ Arrow Vulcan ตอนตีธรรมดา ใช้กับ Bard ได้เพราะสองอาชีพแทบเหมือนกัน ต่างแค่ Bard ถือเครื่องดนตรี',
        cites: [['ryanAV', '00:34'], ['ryanAV', '00:39'], ['ryanAV', '01:52']],
      },
      statNotes: [
        { text: 'ผู้เล่น Taiwan ตั้งเป้า ASPD 190 (เป้าของทุกอาชีพ ไม่ได้เจาะจง Bard)', cites: [['xmeta', '01:25']] },
        { text: 'ยังไม่มีตัวเลขสเตตัสของ Bard สายนี้ ตัวอย่าง AGI 85 ในคลิปเป็นของ Dancer', cites: [['ryanAV', '11:48']] },
      ],
      gear: [
        { slot: 'อาวุธ', text: 'คลิปพูดถึงแต่แส้ของ Dancer เครื่องดนตรีที่ออโต้แคสต์ Arrow Vulcan ได้ยังไม่มีข้อมูล', cites: [['ryanAV', '00:47']] },
        {
          slot: 'อาวุธ',
          text: 'Oriental Lute เพิ่มดาเมจ Arrow Vulcan และ Melody Strike 10% แต่ต้องเลเวล 65 ตอนอัดคลิปเลเวลตันยังอยู่ที่ 60 และ NCZ บอกว่าแผนจะขึ้นเป็น 70 ในเดือนตุลาคม',
          items: [1918],
          cites: [['db'], ['xroad', '06:17'], ['ncz', '00:18']],
        },
        { slot: 'หมวก', text: 'Sakkat (AGI +1) build สาย ASPD แทบทุกตัวใส่', items: [2280], cites: [['ryanAV', '13:02'], ['db']] },
      ],
      play: [
        { text: 'Bard ในคลิปของน้อยกว่า ดาเมจจึงไม่สูงเท่า แต่ยังเล่นได้จริง', cites: [['ryanAV', '02:26']] },
      ],
      cautions: [
        { text: 'คลิปนี้รีวิวภาพจาก Taiwan Zero ก่อน Global เปิด และของในภาพเป็นระดับท้ายเกม', cites: [['ryanAV', '01:39'], ['ryanAV', '14:06']] },
      ],
    },
    {
      id: 'support',
      name: 'สายซัพพอร์ต (Magic Strings / Impressive Riff)',
      pickIf: 'อยากเป็นตัวบัฟให้ปาร์ตี้',
      idea: {
        text: 'ร่ายเพลงบัฟปาร์ตี้แล้วเดินฟาร์มต่อ Ryan บอกว่า Bard ได้บัฟที่ดีกว่า Dancer จาก Poem of Bragi (Magic Strings)',
        cites: [['ryanBD', '05:01'], ['ryanBD', '08:29']],
      },
      stats: [
        { who: 'ไกด์บน midgardhub', int: '90-99', dex: '70-80', vit: '50-70', agi: 'ที่เหลือ', note: 'INT ลดดีเลย์หลังร่าย สำคัญที่สุดกับ Bragi · ไกด์อาจเขียนจากความรู้ Classic และเลเวลตันตอนนี้อาจลงไม่ถึง', cites: [['midgard']] },
      ],
      skills: [
        { skill: 'Magic Strings', level: 10, why: 'Poem of Bragi เดิม', cites: [['midgard'], ['planner']] },
        { skill: 'Impressive Riff', level: 10, why: 'ไกด์เรียก Assassin Cross of Sunset เทียบชื่อจากคำอธิบาย (เพิ่ม ASPD ปาร์ตี้) ยังไม่มีแหล่งยืนยันคู่ชื่อ', cites: [['midgard'], ['db']] },
      ],
      skillNotes: [
        {
          text: 'ค่าของ Magic Strings ต่างกันตามแหล่ง: Ryan บอกว่าลดดีเลย์หลังร่ายเหลือ 30% ไม่ใช่เกือบเต็มแบบ Classic · rozeroplanner บอกว่าลดเวลาร่ายและ SP 3-30% ตามเลเวลสกิล DEX และ INT · ฐานข้อมูลเราไม่ได้บอกตัวเลข',
          cites: [['ryanAV', '07:01'], ['planner'], ['db']],
        },
        { text: 'Amp ลด SP การแสดง 40% · Encore ร่ายเพลงล่าสุดซ้ำด้วย SP ครึ่งเดียว', cites: [['db'], ['ryanBD', '02:28']] },
        {
          text: 'เพลงคู่ (Battle Theme, Harmonic Lick, Mental Sensing, Acoustic Rhythm) ต้องมี Bard กับ Dancer ห่างกันไม่เกิน 9x9 ช่อง ร่ายแล้วติดสถานะหลังเล่นคู่ 10 วินาที',
          cites: [['db']],
        },
        {
          text: 'Mental Sensing (Mr. Kim A Rich Man เดิม) ฐานข้อมูลจัดเป็นเพลงคู่ แต่ Ryan พูดเหมือนร่ายคนเดียวได้และเพิ่ม EXP ปาร์ตี้ 60% สองแหล่งขัดกัน ให้เชื่อฐานข้อมูลไว้ก่อน',
          cites: [['db'], ['ryanBD', '01:38']],
        },
      ],
      plan: {
        picks: {
          bard: { 'Magic Strings': 10, 'Impressive Riff': 10 },
        },
        basis: { text: 'เฉพาะสองสกิลหลักที่ไกด์ midgardhub บอก ช่วง Archer กับแต้มที่เหลือไกด์ไม่ได้บอก', cites: [['midgard']] },
      },
      play: [
        { text: 'ค่าบัฟของเพลงคิดตอนร่าย ถ้ามีบัฟเพิ่ม INT ให้รอบัฟขึ้นก่อนค่อยร่าย', cites: [['midgard']] },
      ],
      cautions: [
        { text: 'ของที่ไกด์ midgardhub แนะนำส่วนใหญ่ไม่มีในฐานข้อมูลเกมเรา มีแค่ Raydric Card กับ Elder Willow Card', cites: [['midgard'], ['db']] },
      ],
    },
    {
      id: 'melody-strike',
      name: 'สาย Melody Strike งบน้อย',
      pickIf: 'อยากยิง Melody Strike เป็นหลัก',
      idea: { text: 'Melody Strike ยิงธนู 2 ครั้งด้วยเครื่องดนตรี ดาเมจเพิ่มตาม INT', cites: [['db']] },
      missing: 'คลิปที่สอนสายนี้ดึงคำบรรยายไม่ได้ และเป็นเซิร์ฟ Project Zero ซึ่งเป็นเกมอื่น ยังไม่มีข้อมูลสกิล สเตตัส หรือของ',
    },
  ],
  gaps: [
    'ยังไม่มีคลิป Zero สอน Bard โดยตรง คลิปของ Ryan ทั้งสองอัดก่อน Global เปิด',
    'ยังไม่มีลำดับอัพสกิลทีละเลเวล build บน prontera บอกแค่ยอดสุดท้าย',
    'ยังไม่มีแมพเก็บเลเวลหลัง Lv 50 สำหรับ Bard',
    'ชื่อสกิลบางตัว (Impressive Riff, Perfect Tablature, Melody Strike, Amp ฯลฯ) เทียบกับชื่อ Classic จากคำอธิบายเท่านั้น ยังไม่มีแหล่งเขียนคู่ชื่อไว้',
    'เครื่องดนตรีที่ออโต้แคสต์ Arrow Vulcan ได้ ยังไม่รู้ว่าชิ้นไหน',
  ],
  sources: {
    ryanBD: { label: 'Ryan Geldun', title: 'Dancer & Bard in Ragnarok Zero Global', url: 'https://www.youtube.com/watch?v=KEIXN24Rh-I', kind: 'clip', lang: 'en' },
    ryanAV: { label: 'Ryan Geldun', title: 'Autocast ArrowVulcan - Dancer and Bard build Ragnarok Zero Global', url: 'https://www.youtube.com/watch?v=DOl7pNPuBJU', kind: 'clip', lang: 'en' },
    tako: { label: 'TakoyakiCh', title: 'จัด Tierlist Class2 ในโลก RO-Zero', url: 'https://www.youtube.com/watch?v=Y7MKIY0KiYo', kind: 'clip', lang: 'th' },
    xmeta: { label: 'Xiendong', title: 'Why Taiwan Players Build These Stats', url: 'https://www.youtube.com/watch?v=T5bjOqQomUc', kind: 'clip', lang: 'en' },
    xroad: { label: 'Xiendong', title: 'My Current 1–60 Levelling Roadmap', url: 'https://www.youtube.com/watch?v=7ymM15xvYAY', kind: 'clip', lang: 'en' },
    ncz: { label: 'NCZ', title: 'Recommended Leveling Maps Lv. 1-50', url: 'https://www.youtube.com/watch?v=IScycVE-tf8', kind: 'clip', lang: 'th' },
    onenight: { label: 'OneNightsz', title: 'Ragnarok Zero Global มือใหม่ | รีสเตตัส หาเงิน ตั้งบอท และเรื่องสำคัญที่ต้องรู้!', url: 'https://www.youtube.com/watch?v=4D5XxK_NfjQ', kind: 'clip', lang: 'th' },
    reset: { label: 'แชงค์888', title: 'Ragnarok Zero: How to Free Reset Skills and Stats Before Level 40', url: 'https://www.youtube.com/watch?v=lRGGsRGUKYY', kind: 'clip', lang: 'th' },
    hbow: { label: 'hellyy', title: 'Hunter Guide | Best Bows, Cards & Affixes', url: 'https://www.youtube.com/watch?v=fGg65Z7MOq0', kind: 'clip', lang: 'en' },
    pbard: { label: 'roz.prontera.info', title: 'Arrow Vulcan Demi-Human (Bard) โดย MrRegenbogen', url: 'https://roz.prontera.info/builds/b68ace02-f33d-4643-97c0-ae1e26b6562a', kind: 'web' },
    pother: { label: 'roz.prontera.info', title: 'build สาย Arrow Vulcan อีกตัว', url: 'https://roz.prontera.info/builds/82bb8683-1a36-405f-8a49-58f8b08c0fec', kind: 'web' },
    midgard: { label: 'midgardhub', title: 'Bard & Dancer guide', url: 'https://midgardhub.com/guides/bard', kind: 'web' },
    db: { label: 'rozerothai.com', title: 'ฐานข้อมูลสกิลและไอเทม', url: 'https://rozerothai.com/database/skills', kind: 'web' },
    planner: { label: 'rozeroplanner', title: 'RO Zero skill planner', url: 'https://rozeroplanner.com/', kind: 'web' },
    owner: { label: 'ยืนยันในเกม', title: 'เจ้าของเว็บตรวจในเกม 22 ก.ย. 2026', url: '', kind: 'web' },
  },
};
