// Knight guide. Drafted 22 Sep 2026 from Downloads/roz-job-guides/knight.md and
// swordman.md, which cite every line to a clip timestamp or a web page, and
// re-checked against the clip transcripts. Items, monsters and maps were
// checked against the site database; lines that rest on one player's tests or
// on a guess about what a caption said say so on the page.
import type { ClassGuide } from './types';

export const knight: ClassGuide = {
  slug: 'knight',
  job: 'Knight',
  jobTh: 'ไนท์',
  from: 'Swordman',
  gathered: '22 ก.ย. 2026',
  summary:
    'อาชีพสองของ Swordman สายตีระยะประชิด เลือกได้ทั้ง Clashing Spiral ตีเป้าเดี่ยวเปิดบอทคนเดียว Bowling Bash ตีหมู่เล่นกับปาร์ตี้ และสายคริตีธรรมดา มี Parry ช่วยให้ถึก',
  facts: [
    { text: 'เปลี่ยนเป็น Knight ได้ที่ Base Lv 50', cites: [['owner'], ['kamon', '00:46']] },
    { text: 'Swordman ตัน Job 50 ได้แต้มสกิล 49 แต้ม · Knight ตัน Job 70 ได้ 69 แต้ม', cites: [['owner']] },
    {
      text: 'Clashing Spiral, Parry, Aura Blade, Spear Dynamo, Frenzy อยู่ในผังสกิล Knight เลย ได้ตั้งแต่เปลี่ยนอาชีพ ไม่ต้องทำอะไรเพิ่ม',
      cites: [['owner'], ['tako', '01:23']],
    },
  ],
  path: ['swordsman', 'knight'],
  equipJob: 'Knight',
  route: [
    { range: '1-9', text: 'ทำเควสเนื้อเรื่องช่วงต้นไปก่อน พอเลเวล 9 ให้วาร์ปไป Payon', cites: [['ncz', '01:51'], ['ncz', '02:03']] },
    { range: '9-15', text: 'แมพเห็ดแดงทางขวาของ Payon ตั้งบอทตีได้เลย (ชื่อแมพฟังจากซับอัตโนมัติ น่าจะเป็นแมพ Spore)', maps: ['pay_fild08'], monsters: [1014], cites: [['ncz', '02:40'], ['ncz', '03:15']] },
    { range: '15-20', text: 'Prontera Sewer ชั้น 2 ลงทะเบียนกับ NPC ก่อนเข้า ตั้งบอทตีได้ทุกตัว', maps: ['prt_sewb2'], monsters: [1051], cites: [['ncz', '03:46'], ['ncz', '04:24'], ['ncz', '04:51']] },
    { range: '20-30', text: 'Creamy กับ Smokie แถว Geffen ลุ้น Creamy Card กับเสื้อ แมพยอดฮิต คนเยอะให้ย้าย channel', maps: ['gef_fild05'], monsters: [1018, 1056], cites: [['ncz', '04:59'], ['ncz', '05:43'], ['ncz', '06:26']] },
    { range: '30-35', text: 'Coco ที่ Geffen Field ดรอปรองเท้าแดงกับ Hood · Xiendong บอกว่าช่วง 30-35 เลเวลขึ้นช้าที่สุด', maps: ['gef_fild02'], monsters: [1104], cites: [['ncz', '06:48'], ['ncz', '07:49'], ['xien', '01:40']] },
    { range: '30-40', text: 'Ant Hell ถ้าอยากเก็บเลเวลไวกว่า Coco และได้ลุ้นการ์ดมดราคาดี', maps: ['anthell02'], monsters: [1095], cites: [['ncz', '07:09'], ['ncz', '09:46'], ['ncz', '09:52']] },
    { range: '~40', text: 'แมพที่มี Horn กับ Elder Willow ทางตะวันออกของ Payon คนน้อย EXP ใกล้ Coco ตัวเลเวล 40 เปิดบอทข้ามคืนได้ราว 2 เลเวล ลุ้น Guisarme กับ Partizan ด้วย (คลิปไม่ได้บอกรหัสแมพ ในฐานข้อมูลแมพที่มีทั้งสองตัวคือ pay_fild09)', maps: ['pay_fild09'], monsters: [1128, 1033], cites: [['ryanFarm', '00:09'], ['ryanFarm', '00:30'], ['ryanFarm', '00:38']] },
    { range: '40-50', text: 'Orc Village (EXP เยอะ), Steel Chonchon หรือแมพปลากระดูกแถว Comodo (ชื่อมอนตัวหลังฟังจากซับอัตโนมัติ ยังไม่รู้ว่าตัวไหน)', maps: ['gef_fild10', 'moc_fild13'], monsters: [1023, 1042], cites: [['ncz', '11:02'], ['ncz', '11:16'], ['ncz', '11:57'], ['ncz', '13:01']] },
    { range: '35-50', text: 'ถ้ามีตัว Lv 50 ให้ปาร์ตี้พาเก็บที่ Hode ในทะเลทราย Sograt ปาร์ตี้แชร์ EXP ได้เมื่อเลเวลห่างไม่เกิน 15', maps: ['moc_fild17'], monsters: [1127], cites: [['xien', '02:07'], ['xien', '02:26']] },
    { range: '50', text: 'เปลี่ยนเป็น Knight หา NPC ได้โดยเปิดหน้าต่างเควสแล้วพิมพ์คำว่า "จ๊อบ" หรือกด N แล้วพิมพ์ชื่ออาชีพให้ลูกศรนำทาง', cites: [['owner'], ['kamon', '00:55'], ['xien', '05:41']] },
    { range: '50-60', text: 'Nordfeld Cave 2F ทั้ง Xiendong และ Ryan Geldun (Knight) เก็บเลเวลที่นี่', maps: ['nrd_dun02'], cites: [['xien', '06:12'], ['ryan', '05:53']] },
  ],
  routeNotes: [
    { text: 'วาร์ป Kafra ฟรีถ้าเลเวลยังไม่ถึง 40 เกินแล้วเสียราว 120 zeny', cites: [['ncz', '02:15']] },
    { text: 'รีเซ็ตสเตตัสกับสกิลฟรีจนถึงเลเวล 40 หลังจากนั้นเสียเงินจริง ถ้าจะเปลี่ยนสายให้รีเซ็ตก่อน', cites: [['xien', '02:39'], ['meta', '06:26']] },
    { text: 'EXP ไม่ลดตามส่วนต่างเลเวลกับมอน แต่ดรอปถูกหัก 50% ถ้าห่างเกินราว 19 เลเวล (ผู้เล่นบอก ยังไม่ยืนยัน)', cites: [['ncz', '10:06']] },
  ],
  gearByLevel: [
    { range: 'ทั้งทาง', slot: 'ออปชั่น', text: 'ช่วงต้นหาออปชั่น Max HP กับ FLEE ก่อน ถ้าได้ FLEE ราว 15 ขึ้นไปทุกชิ้น ทำ FLEE 250-300 ได้เร็ว', cites: [['meta', '03:31'], ['meta', '05:50']] },
    { range: '1-40', slot: 'สเตตัส', text: 'ช่วงแรกลง DEX ราว 20 ก่อนให้ตีโดน แล้วค่อยรีเซ็ตฟรีก่อนเลเวล 40', cites: [['meta', '06:13']] },
    { range: '20-30', slot: 'ประดับ', text: 'Creamy Card ใช้ Teleport ได้ ดรอปจาก Creamy', items: [4040], cites: [['ncz', '05:20'], ['ncz', '06:22']] },
    { range: '30-35', slot: 'หมวก / รองเท้า', text: 'Hood กับรองเท้าแดงจาก Coco', items: [480414], cites: [['ncz', '06:51']] },
    { range: '~40', slot: 'อาวุธ', text: 'Guisarme จาก Horn และ Partizan จาก Elder Willow หอกสองมือสำหรับสายหอก', items: [630044, 630035], cites: [['ryanFarm', '00:38']] },
    { range: '50+', slot: 'หมวก', text: 'Nordfeld Platinum Helm ทั้งสองคลิปของ Ryan Geldun ใส่ตัวนี้ แล้วเลือกเอนชานต์ตามสาย (SP/STR หรือ AGI)', items: [401510], cites: [['ryan', '04:59'], ['crit', '03:03']] },
  ],
  strengths: [
    { text: 'Parry Lv 10 กันการโจมตีได้ 50% ของครั้ง ใช้ได้เฉพาะดาบสองมือ ผู้เล่นมองว่าเท่ากับลดดาเมจที่โดนลงครึ่งหนึ่ง', cites: [['wParry'], ['ryan', '06:42']] },
    { text: 'Aura Blade เพิ่ม ATK ตาม Base Level (Lv 5 = Base Level × 8) เพิ่มดาเมจ Clashing Spiral ได้เยอะมาก', cites: [['wAura'], ['ryan', '02:28'], ['ryan', '02:52']] },
    { text: 'Bowling Bash ตีหมู่แรง ถือดาบสองมือแล้วมีมอนรอบตัวเยอะ จำนวนฮิตเพิ่มได้ถึง 5 ฮิต', cites: [['wBB'], ['ryan', '06:57']] },
    { text: 'Charge Attack พุ่งเข้าหามอนได้ไว เหมาะกับบอท (ความเห็นคนทำคลิป อิงจากเซิร์ฟอื่น)', cites: [['tako', '02:11']] },
  ],
  weaknesses: [
    { text: 'TakoyakiCh จัด Knight ไว้เทียร์ต่ำฝั่ง PvE/บอท เพราะเปอร์เซ็นต์สกิลเหมือนเดิม และ Clashing Spiral ไม่ค่อยแรง แต่ถ้า Bowling Bash ถูกปรับให้แรงขึ้นจะเก่งทันที (ประเมินก่อนอาชีพสองเปิด)', cites: [['tako', '01:35'], ['tako', '01:51'], ['tako', '02:06']] },
    { text: 'Bowling Bash ติดคูลดาวน์ 4 วินาที เปิดบอทเจอมอนตัวเดียวจะตีแค่ 3 ฮิตแล้วยืนรอ', cites: [['wBB'], ['ryan', '08:43']] },
    { text: 'สาย Clashing Spiral กิน SP หนัก ต้องพก Cheese เยอะ', cites: [['ryan', '10:23']] },
    { text: 'สายคริยังทำ ASPD ไม่ถึง 190 เพราะของยังไม่มี Ryan Geldun ทำได้ 176', cites: [['crit', '00:28'], ['ryan', '09:43']] },
  ],
  builds: [
    {
      id: 'clashing-spiral',
      name: 'สาย Clashing Spiral (VIT/DEX)',
      tag: 'สายหลัก',
      pickIf: 'อยากเปิดบอทคนเดียวข้ามคืน ตีมอนทีละตัว',
      idea: {
        text: 'ตีมอนให้ตายใน 1-2 ที ดูแลตัวเองได้ เปิดบอทคนเดียวข้ามคืนได้ ไม่ใช้ Bowling Bash เลย ใช้ Parry เต็มกันดาเมจแทน',
        cites: [['ryan', '00:51'], ['ryan', '09:52']],
      },
      stats: [
        { who: 'Ryan Geldun (ราว Lv 55) ตอนทดสอบ', vit: '48', int: '37', dex: '50', agi: '0', note: 'ค่า flat ไม่รวมโบนัส', cites: [['ryan', '04:35'], ['ryan', '02:40']] },
        { who: 'Ryan Geldun ตอนสรุป', vit: '~50', int: '~40', dex: '~50', str: 'บ้าง เพื่อน้ำหนักแบก', cites: [['ryan', '10:04'], ['ryan', '10:42']] },
      ],
      statNotes: [
        { text: 'ไม่ลง AGI เคยลอง AGI 50-60 แล้ว VIT รอดดีกว่า เพราะตีตายใน 1-2 ที เลือดเยอะทำให้ฟื้น HP แบบเปอร์เซ็นต์ได้ผลกว่า', cites: [['ryan', '05:23'], ['ryan', '05:34']] },
        { text: 'DEX ช่วยสองทาง: HIT และลดเวลาร่าย Clashing Spiral (มีทั้งร่ายคงที่และร่ายแปรผัน) ลง DEX ราว 50 แล้วร่ายเร็วขึ้นชัด', cites: [['ryan', '03:30'], ['ryan', '03:53']] },
      ],
      skills: [
        { skill: 'Clashing Spiral', level: 5, why: 'ดาเมจหลัก คลิปสายคริบอกว่าใช้ 15 แต้มรวมทางผ่าน (Pierce 5, Spear Stab 5)', cites: [['ryan', '01:14'], ['crit', '01:24'], ['wCS']] },
        { skill: 'Aura Blade', level: 5, why: 'เพิ่มดาเมจ Clashing Spiral ได้เยอะมาก', cites: [['ryan', '02:52'], ['crit', '01:38']] },
        { skill: 'Parry', level: 10, why: 'ลดดาเมจที่โดนได้ราวครึ่งหนึ่ง', cites: [['ryan', '06:26'], ['ryan', '06:42']] },
        { skill: 'Peco Peco Ride', level: 1, why: 'ขี่ Peco เพื่อเดินไว', cites: [['ryan', '06:14'], ['ryan', '06:21']] },
        { skill: 'Frenzy', level: 1, why: 'คลิปบอกว่าเอาไว้เล่นขำๆ', cites: [['ryan', '10:01']] },
      ],
      skillNotes: [
        { text: 'Clashing Spiral ไม่ค่อยสนใจ STR แต่ขึ้นกับ ATK กับการ์ดเผ่า ส่วน Bowling Bash คูณ STR ตรงๆ (ผู้เล่นทดสอบเอง ไม่ใช่สูตรทางการ)', cites: [['ryan', '02:04'], ['ryan', '02:15']] },
        { text: 'Spear Dynamo: ผู้เล่นรู้สึกว่า ATK% แทบไม่มีผลกับ Clashing Spiral เอาไว้เพื่อ HIT +50 เป็นหลัก เอาหรือไม่แล้วแต่ลง DEX เท่าไร', cites: [['ryan', '03:02'], ['ryan', '03:17']] },
        { text: 'ดาเมจ Clashing Spiral ขึ้นกับน้ำหนักอาวุธ ต้องชั่งระหว่างจำนวนช่องการ์ดกับน้ำหนัก · ค่าตีบวกอาวุธมีผลไหมยังไม่ได้ทดสอบ', cites: [['ryan', '04:06'], ['ryan', '04:21'], ['wCS']] },
        { text: 'คลิปบอกว่าใส่บัฟเต็มเลเวล แต่ไม่ได้บอกทีละสกิล และไม่ได้บอกลำดับอัพก่อนหลัง', cites: [['ryan', '09:52']] },
      ],
      plan: {
        picks: {
          swordsman: { 'Sword Mastery': 1, 'Increase HP Recovery': 5, Bash: 10, Provoke: 5, Berserk: 1, 'HP Recovery While Moving': 1, 'Two Handed Sword Mastery': 10, 'Magnum Break': 5, Endure: 8, 'Spear Mastery': 5 },
          knight: { 'Clashing Spiral': 5, 'Aura Blade': 5, Parry: 10, 'Peco Peco Ride': 1, Frenzy: 1 },
        },
        basis: {
          text: 'ช่วง Knight เป็นสกิลที่ Ryan Geldun บอกในคลิป ช่วง Swordman คลิปไม่ได้บอก จึงใช้บิลด์ "Sword/Knight" ของ Raganoth บน roz.prontera.info ซึ่งครบทางผ่านของทุกสกิลด้านบนพอดี 49 แต้ม (คนละคนกัน)',
          cites: [['ryan', '09:52'], ['ryan', '10:01'], ['bSK']],
        },
        leftover: {
          text: 'แต้มที่เหลือ: คลิปบอกว่าบัฟใส่เต็ม ถ้า DEX ไม่ถึงให้เอา Spear Dynamo 5 (HIT +50)',
          cites: [['ryan', '03:17'], ['ryan', '09:58']],
        },
      },
      gear: [
        { slot: 'ภาพรวม', text: 'ทุกชิ้นเน้น SP รวมได้ 740 SP', cites: [['ryan', '04:54'], ['ryan', '05:17']] },
        { slot: 'หมวก', text: 'Nordfeld Platinum Helm เอนชานต์ SP กับ STR', items: [401510], cites: [['ryan', '04:59']] },
        { slot: 'รองเท้า', text: 'Archeologist\'s Shoes (คลิปมีคำนำหน้า "soul enchanted ancient" ซึ่งไม่เจอในฐานข้อมูล)', items: [470465], cites: [['ryan', '05:06']] },
        { slot: 'เสื้อ', text: 'Silk Robe ออปชั่น SP 2 บรรทัด ใส่ Roda Frog Card', items: [450345, 4014], cites: [['ryan', '05:08']] },
        { slot: 'อาวุธ', text: 'ชั่งช่องการ์ดกับน้ำหนักอาวุธ การ์ดเผ่ามีผลกับ Clashing Spiral', cites: [['ryan', '02:07'], ['ryan', '04:14']] },
      ],
      play: [
        { text: 'SP หมดไวมาก ใส่ของฟื้น SP แล้วพก Cheese เยอะๆ', cites: [['ryan', '10:23'], ['ryan', '10:32']] },
        { text: 'แบ่งแต้มไป STR บ้างแล้วใช้ Gym Membership Card เพิ่มน้ำหนักแบก ให้ได้ราว 7,000 จะพก Cheese ได้พอ', cites: [['ryan', '10:42'], ['ryan', '10:49']] },
      ],
      maps: [
        { text: 'Nordfeld Cave 2F และถ้ำที่คลิปเรียกว่า "North Komodo Cave" (ชื่อฟังไม่ชัด)', cites: [['ryan', '05:53']] },
      ],
      cautions: [
        { text: 'แมพที่มอนตีก่อนและรุมเยอะ ควรใช้บิลด์อื่น', cites: [['ryan', '05:59']] },
      ],
    },
    {
      id: 'bowling-bash',
      name: 'สาย Bowling Bash (STR ตีหมู่)',
      tag: 'ปาร์ตี้',
      pickIf: 'เล่นกับปาร์ตี้ที่มีคนลากมอนมาให้',
      idea: {
        text: 'Bowling Bash ตีหมู่แรงมาก ผู้เล่นมองว่าเป็นสกิลตีหมู่ที่ดีที่สุด ดีกว่า Brandish Spear เพราะถือดาบสองมือแล้วได้ใช้ Parry เหมาะกับปาร์ตี้ที่มีคนลากมอนมาให้',
        cites: [['ryan', '09:03'], ['ryan', '09:24'], ['ryan', '09:28']],
      },
      stats: [
        { who: 'Ryan Geldun', str: '~70', note: 'ลง STR ราว 70 แล้วดาเมจเพิ่มราว 2 เท่าทันที ยังไม่ใส่การ์ดหรือบัฟพิเศษ · สเตตัสอื่นไม่ได้บอก', cites: [['ryan', '07:58'], ['ryan', '08:04']] },
        { who: 'Raganoth "BB/SP Build" (ช่วง Swordman)', str: '43', agi: '40', vit: '1', int: '20', dex: '30', luk: '1', note: 'บิลด์บนเว็บ ไม่มีคำอธิบาย ไม่บอกเลเวล', cites: [['bBB']] },
      ],
      skills: [
        { skill: 'Bowling Bash', level: 10, why: 'ใช้ 25 แต้มรวมทางผ่าน (Counter Attack 5, Two Hand Quicken 10)', cites: [['crit', '01:18'], ['wBB']] },
        { skill: 'Spear Dynamo', level: 5, why: 'จำเป็น 100% เพราะได้ HIT +50 ขณะที่สายนี้ไม่ได้ลง DEX เยอะ', cites: [['ryan', '07:43'], ['ryan', '07:53']] },
      ],
      skillNotes: [
        { text: 'ตอนเล่นสายนี้ Ryan Geldun ลด Parry ลง และไม่ใช้ Clashing Spiral', cites: [['ryan', '06:33']] },
        { text: 'Aura Blade ช่วยน้อยกว่าในสายนี้ ถ้าไม่ได้ดันดาเมจสุดให้เอาแต้มไปลง Parry หรือ Peco Peco Ride แทน', cites: [['ryan', '07:24'], ['ryan', '07:32']] },
        { text: 'ปกติตี 3 ฮิต ถ้ามอนรอบตัวเกิน 5 ตัวตี 5 ฮิต', cites: [['ryan', '06:57'], ['wBB']] },
      ],
      plan: {
        picks: {
          swordsman: { 'Sword Mastery': 1, 'Increase HP Recovery': 5, Bash: 10, Provoke: 5, Berserk: 1, 'HP Recovery While Moving': 1, 'Two Handed Sword Mastery': 10, 'Magnum Break': 5, Endure: 8, 'Fatal Blow': 1, 'Spear Mastery': 5 },
          knight: { 'Bowling Bash': 10, 'Spear Dynamo': 5 },
        },
        basis: {
          text: 'ช่วง Knight มีแค่สองสกิลที่คลิปบอกชัด ช่วง Swordman ใช้ "BB/SP Build" ของ Raganoth บน roz.prontera.info (คนละคนกัน)',
          cites: [['ryan', '07:43'], ['crit', '01:18'], ['bBB']],
        },
        leftover: {
          text: 'แต้มที่เหลือ: Parry หรือ Peco Peco Ride ตามที่คลิปแนะนำ หรือ Aura Blade ถ้าอยากดันดาเมจสุด',
          cites: [['ryan', '07:32'], ['ryan', '07:40']],
        },
      },
      play: [
        { text: 'ต้องลากมอนมารวมก่อนแล้วค่อยตี ผู้เล่นประเมินเองว่าถ้าจัดของเต็มน่าจะตีหมู่ได้ราว 30,000-40,000 ใน Nordfeld Cave', cites: [['ryan', '08:18'], ['ryan', '08:33']] },
      ],
      maps: [
        { text: 'ทดสอบที่ Orc Dungeon มอนรุมไว ใช้ได้ดี · Nordfeld Cave ผู้เล่นบอกว่าใช้ Bowling Bash ได้ไม่คุ้ม', cites: [['ryan', '07:09'], ['ryan', '07:15']] },
      ],
      cautions: [
        { text: 'สายนี้ล้วนๆ ตายแน่ถ้าเปิดบอท เพราะบอทไม่ลากมอน ตีตัวแรกที่เจอ 3 ฮิตแล้วยืนรอคูลดาวน์ 4 วินาที', cites: [['ryan', '08:33'], ['ryan', '08:43']] },
      ],
    },
    {
      id: 'crit-agi',
      name: 'สายคริ AGI ตีธรรมดา',
      pickIf: 'อยากเปิดบอทตีธรรมดา และสลับไปใช้ Clashing Spiral ในดัน',
      idea: {
        text: 'ตีธรรมดาคริติคอล ได้พลังโจมตีจากอาวุธตีบวกสูงกับ Aura Blade แทน STR ตอนนี้ยังเป็นลูกเล่นมากกว่าเพราะของ ASPD ยังไม่มี แต่น่าจะเด่นเมื่อของมา',
        cites: [['crit', '00:04'], ['crit', '00:56'], ['ryan', '09:43']],
      },
      stats: [
        { who: 'Ryan Geldun', agi: '61', dex: '46', luk: '36', str: '0', note: 'ไม่ลงอย่างอื่น · ASPD 176', cites: [['crit', '00:30'], ['crit', '00:38']] },
      ],
      statNotes: [
        { text: 'ไม่ลง STR เพราะ LUK ให้ทั้ง ATK คริ และ perfect dodge', cites: [['crit', '00:46']] },
      ],
      skills: [
        { skill: 'Bowling Bash', level: 10, why: '25 แต้มรวมทางผ่าน ไว้ใช้บ้างเป็นครั้งคราว', cites: [['crit', '01:18'], ['crit', '05:00']] },
        { skill: 'Clashing Spiral', level: 5, why: 'อีก 15 แต้ม ไว้ตีเป้าเดี่ยวใน Memorial Dungeon', cites: [['crit', '01:24']] },
        { skill: 'Peco Peco Ride', level: 1, why: 'คลิปบอกว่าขี่ Peco ใช้ 6 แต้ม', cites: [['crit', '01:33']] },
        { skill: 'Aura Blade', level: 5, why: 'ห้ามขาด', cites: [['crit', '01:38']] },
        { skill: 'Parry', level: 8, why: 'ตัวที่ทำให้รอด ยอมไม่เอา Spear Dynamo กับ Frenzy เพื่อตัวนี้ (ตอน Job 60)', cites: [['crit', '01:43'], ['crit', '02:16']] },
      ],
      skillNotes: [
        { text: 'คลิปอัดตอน Job ตัน 60 แผนตอน Job 70: Parry เต็ม Spear Dynamo เต็ม แล้วเอา Frenzy', cites: [['crit', '01:05'], ['crit', '02:18']] },
      ],
      plan: {
        picks: {
          swordsman: { 'Sword Mastery': 1, 'Increase HP Recovery': 5, Bash: 10, Provoke: 5, Berserk: 1, 'HP Recovery While Moving': 1, 'Two Handed Sword Mastery': 10, 'Magnum Break': 5, Endure: 8, 'Spear Mastery': 5 },
          knight: { 'Bowling Bash': 10, 'Clashing Spiral': 5, 'Peco Peco Ride': 1, 'Aura Blade': 5, Parry: 10, 'Spear Dynamo': 5, Frenzy: 1 },
        },
        basis: {
          text: 'ช่วง Knight เป็นแผน Job 70 ที่ Ryan Geldun บอกไว้ในคลิป ช่วง Swordman คลิปไม่ได้บอก จึงใช้บิลด์ "Sword/Knight" ของ Raganoth บน roz.prontera.info (คนละคนกัน)',
          cites: [['crit', '01:18'], ['crit', '02:18'], ['bSK']],
        },
        leftover: {
          text: 'แต้มที่เหลือ: คลิปนับค่าขี่ Peco เป็น 6 แต้ม แต่ Peco Peco Ride ใช้แค่ 1 แต้ม อีก 5 แต้มน่าจะเป็น Cavalier Mastery (คลิปไม่ได้บอกชื่อ)',
          cites: [['crit', '01:33']],
        },
      },
      gear: [
        { slot: 'อาวุธ', text: 'Bastard Sword +9 ใส่ Sidewinder Card, Soldier Skeleton Card, Hunter Fly Card', items: [600049, 4117, 4086, 27266], cites: [['crit', '02:33']] },
        { slot: 'ผ้าคลุม', text: 'ผ้าคลุมจากกิจกรรม Baby Shark (คลิปไม่ได้บอกชื่อไอเทมตรงๆ) พอกิจกรรมจบคริหายไป 10', cites: [['crit', '02:41'], ['crit', '02:48']] },
        { slot: 'หมวก', text: 'Nordfeld Platinum Helm +7 ใส่การ์ด Boulder Dwarf ตัวที่ให้ AGI (คลิปไม่ได้บอกว่าแบบไหน) เอนชานต์ AGI +3 รวม AGI +6', items: [401510], cites: [['crit', '03:03'], ['crit', '03:12']] },
        { slot: 'เสื้อ', text: 'เกราะ Nordfeld เพื่อ AGI +3 (ยังไม่ยืนยันว่าเป็นชิ้นไหน) · ในอุดมคติตีบวก 9 ออปชั่น FLEE 1 บรรทัด Max HP 2 บรรทัด การ์ดยังไม่ได้เลือก', cites: [['crit', '03:15'], ['crit', '03:21'], ['crit', '03:32']] },
        { slot: 'รองเท้า', text: 'Hill Patrol Boots เพราะมี ASPD +5% ติดมา วางแผนตีบวก 7 เพื่อ FLEE', items: [470466], cites: [['crit', '03:50'], ['crit', '03:58']] },
        { slot: 'ประดับ', text: 'Rosary กับ Clip ใส่การ์ดเทเลพอร์ต · มีเงินค่อยเปลี่ยน Rosary เป็น Subjugation Team\'s Ring ใส่การ์ดที่ฟังได้ว่า "cooker" (เดาว่า Kukre Card ยังไม่ยืนยัน)', items: [2608, 2607, 28539], cites: [['crit', '04:03'], ['crit', '04:06']] },
      ],
      play: [
        { text: 'เปิดบอทฟาร์มทั่วไปได้ดี (นอก Nordfeld) เข้า Memorial Dungeon ให้เปลี่ยนอาวุธแล้วใช้ Clashing Spiral', cites: [['crit', '04:42'], ['crit', '04:52']] },
      ],
      cautions: [
        { text: 'ของคริจากกิจกรรมหายเมื่อกิจกรรมจบ บิลด์จะเสียคริไปเยอะ', cites: [['crit', '02:41']] },
        { text: 'ยังไม่คุ้มเสียช่องไปกับ AGI ไม่กี่แต้ม รอของใหม่ใน 2-3 เดือน', cites: [['crit', '04:17'], ['crit', '04:31']] },
      ],
    },
    {
      id: 'spear-leveling',
      name: 'สายหอกเก็บเลเวล (ช่วง Swordman)',
      pickIf: 'อยากใช้หอกเก็บเลเวลก่อนเปลี่ยนเป็น Knight',
      idea: {
        text: 'บิลด์ "SVD Spear Swordie/Knight Leveling Build" บน roz.prontera.info ใช้หอก Guisarme ชื่อบิลด์บอกว่าต่อเป็น Knight ได้ แต่ไม่มีคำอธิบาย',
        cites: [['bSVD']],
      },
      stats: [
        { who: 'j a s e (บนเว็บ)', str: '80', agi: '1', vit: '20', int: '1', dex: '50', luk: '1', note: 'ไม่บอกเลเวลตัวละคร', cites: [['bSVD']] },
      ],
      skills: [
        { skill: 'Spear Mastery', level: 10, cites: [['bSVD']] },
        { skill: 'Bash', level: 10, cites: [['bSVD']] },
        { skill: 'Increase HP Recovery', level: 10, cites: [['bSVD']] },
        { skill: 'Provoke', level: 5, cites: [['bSVD']] },
        { skill: 'Magnum Break', level: 3, cites: [['bSVD']] },
        { skill: 'Endure', level: 2, cites: [['bSVD']] },
      ],
      skillNotes: [
        { text: 'บิลด์นี้มีแค่ช่วง Swordman ไม่ได้บอกว่าตอนเป็น Knight ลงอะไรต่อ และไม่บอกลำดับอัพ', cites: [['bSVD']] },
      ],
      plan: {
        picks: {
          swordsman: { 'Spear Mastery': 10, Bash: 10, 'Increase HP Recovery': 10, Provoke: 5, 'Magnum Break': 3, Endure: 2, Berserk: 1, 'HP Recovery While Moving': 1, 'Fatal Blow': 1 },
        },
        basis: { text: 'สกิลตามบิลด์ SVD Spear บนเว็บ (Basic Skill, First Aid, Play Dead เป็นของ Novice ไม่ได้นับตรงนี้)', cites: [['bSVD']] },
      },
      gear: [
        { slot: 'อาวุธ', text: 'Guisarme (ดรอปจาก Horn ดูทางเก็บเลเวลช่วง ~40)', items: [630044], cites: [['bSVD'], ['ryanFarm', '00:38']] },
        { slot: 'ชุด', text: 'Hood, Helm, Shoes, Silk Robe ไม่ได้บอกค่าตีบวก การ์ด หรือออปชั่น', items: [480414, 450345], cites: [['bSVD']] },
      ],
    },
    {
      id: 'pierce',
      name: 'สาย Pierce ฟาร์ม ("Eternal Machine")',
      pickIf: 'อยากใช้หอกฟาร์มแบบถึก',
      idea: { text: 'มีบิลด์ Pierce สายฟาร์มชื่อ "Eternal Machine" ติดแท็ก Farming กับ Tank บน midgardhub ดูแค่คำอธิบายสั้นในหน้ารวม', cites: [['midgard']] },
      missing: 'ยังไม่มีข้อมูลสเตตัส สกิล หรือของของสายนี้ และยังไม่มีคลิป RO Zero สอนสายหอกของ Knight',
    },
  ],
  gaps: [
    'คลิป RO Zero ที่สอน Knight มีแค่ของ Ryan Geldun คนเดียว ยังไม่มีคลิปภาษาไทย',
    'ช่วง Swordman ในแผนสกิลใช้บิลด์บนเว็บของผู้เล่นอีกคน ไม่ได้มาจากคลิปเดียวกับช่วง Knight',
    'สาย Clashing Spiral ไม่มีใครบอกลำดับอัพสกิลก่อนหลัง และไม่ได้บอกเลเวลบัฟทีละตัว',
    'ค่าตีบวกอาวุธมีผลกับ Clashing Spiral ไหม ยังไม่มีใครทดสอบ',
    'ยังไม่มีข้อมูลของสวมใส่สาย Bowling Bash และของเฉพาะ Swordman ตามช่วงเลเวล',
    'ยังไม่รู้ว่าเกราะ Nordfeld การ์ด Boulder Dwarf ที่ให้ AGI และแมพ "North Komodo Cave" ในคลิปคือชิ้นไหน/แมพไหน',
    'แมพเก็บเลเวลหลัง Lv 60 ยังไม่มี',
  ],
  sources: {
    ryan: { label: 'Ryan Geldun', title: 'My knight build in Ragnarok Zero Global', url: 'https://www.youtube.com/watch?v=jM7uBvSd66k', kind: 'clip', lang: 'en' },
    crit: { label: 'Ryan Geldun', title: 'Crit-Agi knight build - Ragnarok Zero Global', url: 'https://www.youtube.com/watch?v=hG5zNfxtQQI', kind: 'clip', lang: 'en' },
    ryanFarm: { label: 'Ryan Geldun', title: 'Chill Zeny and Exp farming spot you FORGOT about', url: 'https://www.youtube.com/watch?v=oEPSeeOEGVk', kind: 'clip', lang: 'en' },
    tako: { label: 'TakoyakiCh', title: 'จัด Tierlist Class2 ในโลก RO-Zero', url: 'https://www.youtube.com/watch?v=Y7MKIY0KiYo', kind: 'clip', lang: 'th' },
    kamon: { label: 'KamonWay', title: 'How to Change to Class 2 for Every Job in 3 Minutes', url: 'https://www.youtube.com/watch?v=iTxVgyVGCbc', kind: 'clip', lang: 'th' },
    xien: { label: 'Xiendong', title: 'My Current 1–60 Levelling Roadmap for my New Characters', url: 'https://www.youtube.com/watch?v=7ymM15xvYAY', kind: 'clip', lang: 'en' },
    meta: { label: 'Xiendong', title: 'Why Taiwan Players Build These Stats', url: 'https://www.youtube.com/watch?v=T5bjOqQomUc', kind: 'clip', lang: 'en' },
    ncz: { label: 'NCZ', title: 'Recommended Leveling Maps Lv. 1-50', url: 'https://www.youtube.com/watch?v=IScycVE-tf8', kind: 'clip', lang: 'th' },
    wParry: { label: 'roz.prontera.info', title: 'Parry', url: 'https://roz.prontera.info/skills/parry', kind: 'web' },
    wAura: { label: 'roz.prontera.info', title: 'Aura Blade', url: 'https://roz.prontera.info/skills/aura-blade', kind: 'web' },
    wBB: { label: 'roz.prontera.info', title: 'Bowling Bash', url: 'https://roz.prontera.info/skills/bowling-bash', kind: 'web' },
    wCS: { label: 'roz.prontera.info', title: 'Clashing Spiral', url: 'https://roz.prontera.info/skills/clashing-spiral', kind: 'web' },
    bSK: { label: 'roz.prontera.info', title: 'บิลด์ "Sword/Knight" โดย Raganoth', url: 'https://roz.prontera.info/builds/045c3fe5-f48a-4c89-9561-064e5ecc0abe', kind: 'web' },
    bBB: { label: 'roz.prontera.info', title: 'บิลด์ "BB/SP Build" โดย Raganoth', url: 'https://roz.prontera.info/builds/13c50cce-c5ce-45cb-b327-e1167f788a27', kind: 'web' },
    bSVD: { label: 'roz.prontera.info', title: 'บิลด์ "SVD Spear Swordie/Knight Leveling Build"', url: 'https://roz.prontera.info/builds/18b26b16-4bea-4393-94cc-5eeb50630dfe', kind: 'web' },
    midgard: { label: 'midgardhub', title: 'หน้ารวมบิลด์ Knight', url: 'https://midgardhub.com/', kind: 'web' },
    owner: { label: 'ยืนยันในเกม', title: 'เจ้าของเว็บตรวจในเกม 22 ก.ย. 2026', url: '', kind: 'web' },
  },
};
