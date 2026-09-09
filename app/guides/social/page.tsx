// app/guides/social/page.tsx
//
// The bonuses that are not gear: joining a clan, resetting stats, marrying.
//
// One page rather than three because each of them is a handful of facts, and
// three pages of a handful each would compete with one another for the same
// searches. They share a shape too: every one of them is a small permanent
// change to a character that a player decides once.
//
// The marriage section describes something that is not on Global yet, and
// says so at the top of the section rather than in a footnote -- a reader who
// goes looking for the wedding NPC today will not find it.
import Link from 'next/link';
import type { Metadata } from 'next';
import PageHeader from '@/components/PageHeader';
import Caveat from '@/components/Caveat';
import JsonLd from '@/components/JsonLd';
import { breadcrumbJsonLd } from '@/lib/jsonld';
import { naviCommand } from '@/lib/rozglobal-guides';
import {
  CLANS,
  CLAN_CAPACITY,
  CLAN_MASTER_SPOT,
  FREE_RESET_MAX_LEVEL,
  MARRIAGE_MIN_LEVEL,
  MARRIAGE_SKILLS,
  resetCost,
} from '@/lib/social-bonuses';

export const metadata: Metadata = {
  title: 'รีเซ็ตสเตตัส แคลน และแต่งงาน Ragnarok Zero — ราคาและโบนัส',
  description:
    'รีเซ็ตสเตตัสกับสกิลใน Ragnarok Zero Global ราคาเท่าไหร่ ฟรีถึงเลเวลไหน · แคลนทั้ง 4 ให้สเตตัสอะไรบ้าง หัวหน้าแคลนอยู่ตรงไหน · ระบบแต่งงานและสกิลของคู่ พร้อมสถานะว่ายังไม่เปิดในเซิร์ฟโกลบอล',
};

/** Reference levels for the reset price, so the rule has numbers next to it. */
const RESET_EXAMPLES = [FREE_RESET_MAX_LEVEL, 50, 60, 70, 80, 99];

export default function SocialGuidePage() {
  const navi = naviCommand(CLAN_MASTER_SPOT.map, CLAN_MASTER_SPOT.x, CLAN_MASTER_SPOT.y);

  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'หน้าแรก', path: '/' },
          { name: 'ไกด์', path: '/guides' },
          { name: 'แคลน รีเซ็ตสเตตัส แต่งงาน', path: '/guides/social' },
        ])}
      />
      <PageHeader title="รีเซ็ตสเตตัส แคลน และแต่งงาน" />
      <p className="muted" style={{ marginTop: -6, marginBottom: 18, maxWidth: '70ch' }}>
        โบนัสถาวรเล็กๆ ที่ไม่ได้มาจากของสวมใส่ — ตัดสินใจครั้งเดียวแล้วติดตัวไป
      </p>

      <section className="card card--yellow">
        <h2 className="section-title">รีเซ็ตสเตตัสกับสกิล เสียเท่าไหร่</h2>
        <p style={{ marginTop: 6, maxWidth: '70ch' }}>
          <strong>ฟรีจนถึงเลเวล {FREE_RESET_MAX_LEVEL}</strong> · เกินจากนั้นคิด{' '}
          <strong>เลเวลละ 1 Zelstar</strong> (Zelstar ซื้อในร้านค้าออนไลน์) — คุยกับ NPC <strong>Hypnotist</strong>
        </p>
        <div className="recipe__scroll" style={{ marginTop: 12 }}>
          <table className="data-table recipe">
            <thead>
              <tr>
                <th>เลเวลฐาน</th>
                <th className="num">ค่ารีเซ็ต</th>
              </tr>
            </thead>
            <tbody>
              {RESET_EXAMPLES.map((level) => (
                <tr key={level}>
                  <td data-label="เลเวล">{level}</td>
                  <td data-label="ค่ารีเซ็ต" className="num">
                    {resetCost(level) === 0 ? 'ฟรี' : `${resetCost(level)} Zelstar`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="muted" style={{ marginTop: 10, fontSize: 13 }}>
          ไกด์ต้นทางไล่ทีละเลเวล 41-99 ทุกแถวตรงกับกติกานี้ ไม่มีขั้นบันไดหรือส่วนลด
        </p>
      </section>

      <section style={{ marginTop: 26 }}>
        <h2 className="section-title">แคลน — เข้าแล้วได้สเตตัสเพิ่ม</h2>
        <p className="muted" style={{ marginTop: 2, marginBottom: 10, maxWidth: '70ch' }}>
          หัวหน้าแคลนทั้งสี่ยืนอยู่จุดเดียวกันใน Prontera{' '}
          {navi && <code className="mono navicmd">{navi}</code>} · แคลนละ {CLAN_CAPACITY} คน ·{' '}
          <strong>อยู่แคลนแล้วเข้ากิลด์ไม่ได้</strong> ต้องออกจากแคลนก่อน
        </p>
        <div className="recipe__scroll">
          <table className="data-table recipe">
            <thead>
              <tr>
                <th>แคลน</th>
                <th>หัวหน้าแคลน</th>
                <th>โบนัสตอนเป็นสมาชิก</th>
              </tr>
            </thead>
            <tbody>
              {CLANS.map((clan) => (
                <tr key={clan.name}>
                  <td data-label="แคลน">{clan.name}</td>
                  <td data-label="หัวหน้า">{clan.master}</td>
                  <td data-label="โบนัส">{clan.bonus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section style={{ marginTop: 26 }}>
        <h2 className="section-title">แต่งงาน</h2>
        <p className="filterstate" style={{ marginTop: 2 }}>
          <strong>ยังไม่เปิดในเซิร์ฟโกลบอล</strong> — โรดแมประบุ ก.พ. 2027 · ข้างล่างคือระบบในเซิร์ฟเวอร์เวอร์ชันอื่น
        </p>
        <p className="muted" style={{ marginTop: 10, marginBottom: 10, maxWidth: '70ch' }}>
          เลเวลฐาน {MARRIAGE_MIN_LEVEL} ขึ้นไปทั้งคู่ · ตั้งปาร์ตี้ (ชาย-หญิง) ไปหา Wedding Assistant แล้วไป Bishop Bomars ที่โบสถ์ ·
          <strong>ฝ่ายชายขอก่อน</strong> อีกฝ่ายยืนยันภายใน 3 นาที · หลังพิธีรบไม่ได้ราว 1 ชั่วโมง ·
          แหวน<strong>ขาย ทิ้ง เทรดไม่ได้</strong>
        </p>
        <div className="recipe__scroll">
          <table className="data-table recipe">
            <thead>
              <tr>
                <th>สกิลของคู่ (ต้องใส่แหวนไว้)</th>
                <th>ผล</th>
              </tr>
            </thead>
            <tbody>
              {MARRIAGE_SKILLS.map((skill) => (
                <tr key={skill.nameEn}>
                  <td data-label="สกิล">{skill.nameEn}</td>
                  <td data-label="ผล">{skill.effect}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section style={{ marginTop: 26 }}>
        <h2 className="section-title">โบนัสเล็กๆ ที่คนมักไม่รู้</h2>
        <ul style={{ marginTop: 8, paddingInlineStart: 20, lineHeight: 1.9, maxWidth: '70ch' }}>
          <li>
            <strong>โรงแรมให้ EXP +10% นาน 30 นาที</strong> ตามช่วงเวลาของแต่ละโรงแรม (เวลาเซิร์ฟเป็น UTC) —{' '}
            <strong>ซ้อนกับยา Growth Elixir ไม่ได้</strong>
          </li>
          <li>
            <strong>ธนาคาร Zeny ใช้ร่วมกันทั้งบัญชี</strong> เปิดด้วย CTRL+B — ย้ายเงินข้ามตัวละครได้โดยไม่ต้องฝากผ่านใคร
          </li>
        </ul>
      </section>

      <Caveat label="เชื่อได้แค่ไหน">
        <strong>สองแหล่งตรงกัน:</strong> ชื่อแคลน หัวหน้า โบนัส และสกิลแต่งงานทั้งสาม — roz-global.info (8 ก.ย. 2026)
        กับข้อมูล rAthena เอง (9 ก.ย. 2026) ·{' '}
        <strong>แหล่งเดียว:</strong> ค่ารีเซ็ตสเตตัส โบนัสโรงแรม ธนาคาร ·
        rAthena เป็นโค้ดเบส Ragnarok ทั่วไป ถ้าขัดกับ Zero ให้ยึด Zero
      </Caveat>

      <p className="muted" style={{ marginTop: 16 }}>
        ดูต่อ: <Link href="/guides/exp">ตาราง EXP ต่อเลเวล</Link> · <Link href="/database/pets">สัตว์เลี้ยง</Link> ·{' '}
        <Link href="/guides/job-change">เปลี่ยนอาชีพ 2</Link>
      </p>
    </main>
  );
}
