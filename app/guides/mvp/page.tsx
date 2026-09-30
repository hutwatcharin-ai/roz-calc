// app/guides/mvp/page.tsx
//
// MVP raids and the Hidden Realm PvP maps, one page (owner, 30 Sep 2026: the
// two are thin apart and both are "where do I go to fight bosses and
// players"). Ordered by what a player does: how to get in, which MVPs are
// out, what drops, then the PvP maps.
//
// Sources, strongest first:
//   - Global play: the daily quest at Eden Group, the red portal, the yellow
//     PvP portal and who gets a box -- clips from Global, in docs/GAME_MODEL.md
//     (MVP Raid). Written as fact.
//   - Our data: which MVPs exist (monsters.is_mvp), where they live (the b_*
//     habitat maps in monster_spawns) and whether that map is out yet
//     (data/map-availability.json). Box and fragment names are our items rows.
//   - midgardhub's MVP and PvP-map guides, which say they are adapted from
//     Taiwan patch notes and that Global may differ. Anything taken only from
//     there sits under a line saying so. Numbers rewritten, not quoted.
//
// No respawn times: no source has Global numbers (checked 30 Sep 2026), and
// the owner cut the "not known yet" section rather than show it.

import type { Metadata } from 'next';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import Caveat from '@/components/Caveat';
import JsonLd from '@/components/JsonLd';
import { breadcrumbJsonLd } from '@/lib/jsonld';
import { supabaseBrowser } from '@/lib/supabase';
import availability from '@/data/map-availability.json';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'ล่า MVP Ragnarok Zero — เข้า MVP Raid ยังไง ได้อะไร + แมพ PVP Hidden Realm',
  description:
    'วิธีเข้า MVP Raid ใน Ragnarok Zero Global รับเควสที่ Eden Group เข้าประตูแดง ใครตีโดนก็ได้กล่อง · รายชื่อ MVP ที่เปิดแล้ว · กล่อง Subjugation, Energy Fragment, Blacksmith Blessing · แมพ PVP Hidden Realm ใช้กุญแจจาก Cash Shop EXP และดรอป +10%',
};

const CLOSED = (availability as { maps: Record<string, { when: string }> }).maps;

// Hidden Realm maps, grouped the way a player thinks of them. From
// midgardhub's PvP-map guide (read 30 Sep 2026).
const PVP_MAPS: { group: string; codes: string[] }[] = [
  { group: 'ดันเจี้ยน', codes: ['iz_dun00', 'iz_dun01', 'iz_dun02', 'iz_dun03', 'iz_dun04', 'pay_dun00', 'pay_dun01', 'pay_dun02', 'pay_dun03', 'pay_dun04', 'gef_dun00', 'gef_dun01', 'gef_dun02', 'orcsdun01', 'orcsdun02', 'mjo_dun01', 'mjo_dun02', 'mjo_dun03', 'beach_dun', 'beach_dun2', 'beach_dun3', 'treasure01', 'treasure02', 'anthell01', 'anthell02', 'prt_maze01', 'prt_maze03'] },
  { group: 'พีระมิดกับสฟิงซ์', codes: ['moc_pryd01', 'moc_pryd02', 'moc_pryd03', 'moc_pryd04', 'moc_pryd05', 'moc_pryd06', 'in_sphinx1', 'in_sphinx2', 'in_sphinx3', 'in_sphinx4', 'in_sphinx5'] },
  { group: 'ท่อระบายน้ำ Prontera', codes: ['prt_sewb1', 'prt_sewb2', 'prt_sewb3', 'prt_sewb4'] },
  { group: 'ทุ่ง', codes: ['gef_fild04', 'gef_fild05', 'gef_fild10', 'gef_fild11', 'pay_fild01', 'pay_fild03', 'pay_fild04', 'pay_fild08', 'prt_fild02', 'prt_fild07', 'prt_fild08', 'prt_fild11', 'moc_fild12', 'moc_fild16', 'moc_fild18', 'cmd_fild02'] },
];

type Mvp = { id: number; name: string; level: number; image: string | null; open: boolean };

async function loadMvps(): Promise<Mvp[]> {
  const { data } = await supabaseBrowser()
    .from('monsters')
    .select('id, name_en, level, image_url, monster_spawns(map_code)')
    .eq('is_mvp', true)
    .order('level');
  return ((data ?? []) as unknown as { id: number; name_en: string; level: number; image_url: string | null; monster_spawns: { map_code: string }[] }[])
    .filter((m) => m.monster_spawns.length > 0) // no habitat map at all: not in the game yet
    .map((m) => ({
      id: m.id,
      name: m.name_en,
      level: m.level,
      image: m.image_url,
      open: m.monster_spawns.some((s) => !CLOSED[s.map_code]),
    }));
}

function MvpCard({ m }: { m: Mvp }) {
  return (
    <Link href={`/database/monsters/${m.id}`} className="chiplink" style={{ opacity: m.open ? 1 : 0.7 }}>
      <img src={m.image ?? `/images/monsters/${m.id}.gif`} alt="" width={32} height={32} style={{ imageRendering: 'pixelated', objectFit: 'contain' }} loading="lazy" />
      <span>
        {m.name} <span className="muted">Lv {m.level}</span>
      </span>
    </Link>
  );
}

export default async function MvpGuidePage() {
  const mvps = await loadMvps();
  const open = mvps.filter((m) => m.open);
  const later = mvps.filter((m) => !m.open);
  const pvpCount = PVP_MAPS.reduce((n, g) => n + g.codes.length, 0);

  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'หน้าแรก', path: '/' },
          { name: 'ไกด์', path: '/guides' },
          { name: 'ล่า MVP + แมพ PVP', path: '/guides/mvp' },
        ])}
      />
      <PageHeader title="ล่า MVP + แมพ PVP" />
      <p className="muted" style={{ marginTop: -6, marginBottom: 16, maxWidth: '70ch' }}>
        MVP ในเซิร์ฟนี้ไม่ได้เดินอยู่ในแมพปกติ ต้องเข้า<strong>แมพของ MVP</strong>ผ่านประตูแดง ·
        ตีโดนนิดเดียวก็ได้ของ ไม่ต้องแย่งลาสต์ฮิต · ข้ามไป <a href="#pvp">แมพ PVP Hidden Realm</a>
      </p>

      <section className="card card--cyan">
        <h2 className="section-title">เข้า MVP Raid ยังไง</h2>
        <ol style={{ margin: 0, paddingInlineStart: 22 }}>
          <li style={{ marginBottom: 6 }}>
            <strong>รับเควสรายวันที่ Eden Group</strong> (ทางเข้าอยู่ข้างคาฟ่าทุกเมือง) คุยกับ NPC ที่มีเมฆ daily quest
            ปกติเปิดให้ล่าพร้อมกัน 2 ตัว หมุนเปลี่ยนไป
          </li>
          <li style={{ marginBottom: 6 }}>
            <strong>ไปแมพที่ MVP ตัวนั้นเคยเกิด</strong> จะมี<strong>ประตูแดง</strong>พาเข้าแมพของ MVP ·
            ในนั้นมีประตูขาวไว้กลับ และ<strong>ประตูเหลือง</strong>พาไปแมพเดียวกันแบบเปิด PvP (ใช้ Fly Wing กับ Teleport ไม่ได้)
          </li>
          <li style={{ marginBottom: 6 }}>
            <strong>ช่วยกันตี</strong> MVP แรง เล่นคนเดียวไม่ค่อยไหว · ทำดาเมจนิดเดียว หรืออยู่ปาร์ตี้เดียวกับคนที่ตี ก็นับว่าเควสผ่าน
          </li>
          <li>
            <strong>ตายแล้วเก็บของ</strong> MVP ดรอปกล่องรางวัล เก็บได้ถ้าทำดาเมจถึง และมีเศษพลังงานกระจายทั้งแมพ ใครอยู่ก็เก็บได้ ·
            กลับไปส่งเควสที่ Eden Group
          </li>
        </ol>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 className="section-title">MVP ที่มีตอนนี้ ({open.length} ตัว)</h2>
        <p className="muted" style={{ marginTop: 4 }}>กดดูค่าสถานะ ธาตุ และของดรอปของแต่ละตัว</p>
        <div className="chips" style={{ marginTop: 10, gap: 8 }}>
          {open.map((m) => <MvpCard key={m.id} m={m} />)}
        </div>
        {later.length > 0 && (
          <>
            <h3 className="section-title" style={{ fontSize: 15, marginTop: 18 }}>
              ยังไม่เปิด ({later.length} ตัว) <span className="tag tag--unknown">ยังไม่เปิด</span>
            </h3>
            <p className="muted" style={{ marginTop: 4 }}>แมพของตัวเหล่านี้ยังไม่เปิดบน Global</p>
            <div className="chips" style={{ marginTop: 10, gap: 8 }}>
              {later.map((m) => <MvpCard key={m.id} m={m} />)}
            </div>
          </>
        )}
      </section>

      <section className="card" style={{ marginTop: 24 }}>
        <h2 className="section-title">ได้อะไร</h2>
        <ul style={{ margin: 0, paddingInlineStart: 22 }}>
          <li style={{ marginBottom: 6 }}>
            <strong>Subjugation Reward Box ของ MVP ตัวนั้น</strong> เช่น{' '}
            <Link href="/database/items/105468">[Golden Thief Bug] Subjugation Reward Box (Normal)</Link> ·
            มีสองแบบ Normal กับ Advanced · ข้างในมี <Link href="/database/items/6635">Blacksmith Blessing</Link>
            ซึ่งกันของแตกตอนตีบวก เป็นของที่คนมาล่า MVP กันมากที่สุด
          </li>
          <li style={{ marginBottom: 6 }}>
            <strong>Energy Fragment ของ MVP ตัวนั้น</strong> เช่น{' '}
            <Link href="/database/items/1002385">[Golden Thief Bug] Energy Fragment</Link> ตกระหว่างสู้ ใครอยู่ในแมพก็เก็บได้
          </li>
          <li>แมพแบบ PvP (ประตูเหลือง) ดรอปกล่องต่างจากแมพปกติ</li>
        </ul>
        <p className="muted" style={{ marginTop: 12, marginBottom: 6, fontSize: 13 }}>
          ส่วนนี้มาจากแพตช์ไต้หวัน Global อาจต่าง:
        </p>
        <ul className="muted" style={{ margin: 0, paddingInlineStart: 22, fontSize: 13 }}>
          <li>กล่องแบบ Advanced ได้ Blacksmith Blessing ง่ายกว่าแบบ Normal</li>
          <li>Energy Fragment เอาไปแลกเป็น Blacksmith Blessing ได้</li>
          <li>แมพแบบ PvP มีเศษ Essence ของ MVP ตกมากกว่าแมพปกติราว 3 เท่า</li>
          <li>
            ตุ๊กตาต่อสู้ เช่น <Link href="/database/items/1002358">Battle Golden Thief Bug Doll</Link> เอาไปให้ Combat Doll Judge ใน Eden Group
            รับรางวัลได้วันละครั้งต่อตัวละคร โดยตุ๊กตาไม่หาย
          </li>
        </ul>
      </section>

      <section id="pvp" style={{ marginTop: 28, scrollMarginTop: 90 }}>
        <h2 className="section-title">แมพ PVP Hidden Realm</h2>
        <p style={{ marginTop: 6, maxWidth: '70ch' }}>
          แมพเวอร์ชันเปิด PvP ของแมพปกติ {pvpCount} แมพ ต้องมี<strong>กุญแจ Key to the Hidden World</strong> ติดตัว แล้วคุยกับ{' '}
          <strong>Mysterious Guide</strong> (NPC ใส่หน้ากากยิ้ม ค้นชื่อใน Navigator ได้)
        </p>
        <ul style={{ margin: '8px 0 0', paddingInlineStart: 22 }}>
          <li>
            <strong>กุญแจได้จาก Cash Shop</strong>{' '}
            <Link href="/database/items/200888">Hidden World Key Gift Box</Link> 4,000 KP · ในกล่องเป็นกุญแจใช้ได้ 30 วัน ผูกกับตัวละคร
          </li>
          <li>กดใช้กุญแจได้บัฟ <strong>EXP +10% และดรอป +10%</strong> อยู่ได้ 12 ชั่วโมง แต่ใช้ได้เฉพาะตอนอยู่ในแมพนี้ ออกจากแมพแล้วหาย</li>
          <li>มอนเยอะขึ้นและเกิดเร็วขึ้น 1.5 เท่าของแมพปกติ</li>
          <li><strong>ทุกคนที่ไม่ใช่ปาร์ตี้ กิลด์ หรือพันธมิตรเป็นศัตรู</strong></li>
          <li>รีเซ็ตทุกวัน ทุกคนถูกส่งกลับแมพปกติ · หลุดหรือออกเกมแล้วเข้าใหม่จะกลับมาจุดเซฟ</li>
        </ul>
        {PVP_MAPS.map((g) => (
          <p key={g.group} style={{ marginTop: 10, marginBottom: 0, fontSize: 14 }}>
            <strong>{g.group}:</strong>{' '}
            <span className="muted mono" style={{ fontSize: 13 }}>{g.codes.join(' · ')}</span>
          </p>
        ))}
      </section>

      <Caveat label="เชื่อได้แค่ไหน">
        ขั้นตอนเข้า MVP Raid ประตูแดง ประตูเหลือง และใครได้กล่อง มาจากคลิปผู้เล่นเซิร์ฟ Global ·
        รายชื่อ MVP และชื่อกล่องมาจากข้อมูลเกมในฐานข้อมูลเรา · กุญแจและบัฟมาจากคำอธิบายไอเทมใน Cash Shop · รายชื่อแมพ PVP และส่วนที่เขียนว่ามาจากไต้หวัน
        มาจากไกด์ของ midgardhub ที่แปลจากแพตช์ไต้หวันเอง (อ่าน 30 ก.ย. 2026) · ถ้าในเกมไม่ตรงบอกได้
      </Caveat>

      <p className="muted" style={{ marginTop: 16 }}>
        ดูต่อ: <Link href="/tools/refine">ตีบวก</Link> · <Link href="/guides/woe">สงครามกิลด์ (WoE)</Link> ·{' '}
        <Link href="/database/monsters?mvp=1">มอน MVP ทั้งหมด</Link>
      </p>
    </main>
  );
}
