'use client';

import Link from 'next/link';
import { diesInOneHit, riskySkills, SKILL_RISK_LABELS, SKILL_RISK_WHY, type SkillRisk } from '@/lib/afk-safety';
import { dropPenalty, dropPenaltyDetail, DROP_PENALTY_LABELS } from '@/lib/drop-penalty';
import { useCharacterContext } from '@/components/CharacterContextProvider';

export interface AfkCandidate {
  monster_id: number;
  name_en: string;
  level: number;
  hp: number | null;
  base_exp: number | null;
  exp_per_hp: number | null;
  avg_zeny_per_kill: number | null;
  image_url: string | null;
  skills: string[];
  spawn: string | null;
}

export default function AfkFinderResults({ rows }: { rows: AfkCandidate[] }) {
  const { character, ready } = useCharacterContext();

  if (!ready) return null;

  // hp 0 is the importer's unknown-HP marker, so these rows can never pass the
  // one-hit filter. Saying so is cheaper than letting a reader wonder why the
  // total never adds up.
  const unknownHp = rows.filter((r) => !r.hp || r.hp <= 0).length;

  // No second damage box on this page. The character bar already holds the
  // level and the damage per hit, and a page-local copy is exactly the
  // duplicate source of truth the shared context exists to prevent (spec
  // 3.15.2) -- two boxes drift, and this one decides a safety verdict.
  if (!character) {
    return (
      <div className="card" style={{ marginTop: 20 }}>
        <h2 className="section-title">ต้องรู้ดาเมจของคุณก่อน</h2>
        <p className="muted">
          กรอกเลเวลกับดาเมจต่อครั้งในแถบด้านบนของหน้า แล้วหน้านี้จะกรองให้เหลือเฉพาะมอนที่คุณฆ่าได้ในหมัดเดียว
        </p>
        <p className="muted">
          มอนที่ไม่เข้าโจมตีก่อนในเกมนี้มีทั้งหมด {rows.length} ตัว
          {unknownHp > 0 && ` — ในจำนวนนี้ ${unknownHp} ตัวไม่มีค่า HP ในข้อมูล จึงตัดสินให้ไม่ได้ไม่ว่าดาเมจเท่าไร`}
        </p>
      </div>
    );
  }

  const candidates = rows
    .filter((row) => diesInOneHit(row.hp, character.damagePerHit))
    .map((row) => ({ row, risks: riskySkills(row.skills) }))
    // Safety before EXP, which is the whole reason this is not just a filter on
    // the farming finder: a monster with a skill that can lock or swarm the bot
    // belongs below a clean one however much EXP it gives.
    .sort((a, b) => a.risks.length - b.risks.length || (b.row.exp_per_hp ?? 0) - (a.row.exp_per_hp ?? 0));

  const clean = candidates.filter((c) => c.risks.length === 0).length;

  return (
    <>
      <div className="card" style={{ marginTop: 20 }}>
        <p className="muted" style={{ margin: 0 }}>
          จากมอนที่ไม่เข้าโจมตีก่อน {rows.length} ตัว ดาเมจ {character.damagePerHit.toLocaleString()} ต่อครั้งของคุณ
          ฆ่าได้ในหมัดเดียว <strong>{candidates.length}</strong> ตัว — ในจำนวนนี้ <strong>{clean}</strong>{' '}
          ตัวไม่มีสกิลที่เว็บนี้จัดว่าเสี่ยงกับบอท
          {unknownHp > 0 && ` (อีก ${unknownHp} ตัวไม่มีค่า HP ในข้อมูล จึงไม่ถูกนับ)`}
        </p>
      </div>

      {/* Two limits, stated up front rather than in a footnote, because both
          could turn this page's verdict into a wrong one. */}
      <div className="ceiling-note" style={{ marginTop: 12 }}>
        <strong>ข้อจำกัดที่ต้องรู้:</strong> หน้านี้ใช้ดาเมจที่คุณกรอกตรงๆ ไม่ได้คูณธาตุอาวุธกับธาตุมอนให้
        เพราะตารางธาตุยังไม่ยืนยันว่าตรงกับ Zero การเอาตัวเลขที่ยังไม่ยืนยันมาตัดสินว่า "ปลอดภัย" อันตรายกว่าไม่คิดให้ ·
        และการจัดสกิลว่าเสี่ยงมาจาก<strong>ชื่อสกิลในไฟล์เกม</strong> ไม่ได้มาจากการทดสอบจริง
      </div>

      {candidates.length === 0 ? (
        <p className="muted" style={{ marginTop: 20 }}>
          ดาเมจ {character.damagePerHit.toLocaleString()} ต่อครั้งยังฆ่ามอนที่ไม่เข้าโจมตีก่อนตัวไหนไม่ได้ในหมัดเดียว
        </p>
      ) : (
        <div className="card" style={{ marginTop: 12, overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>มอนสเตอร์</th>
                <th className="num">Lv</th>
                <th className="num">HP</th>
                <th className="num">EXP/HP</th>
                <th>ดรอปตามช่วงเลเวล</th>
                <th>สกิลที่ต้องระวัง</th>
                <th>แมพ</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map(({ row, risks }) => (
                <tr key={row.monster_id}>
                  <td data-label="">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {row.image_url && (
                        <img
                          src={row.image_url}
                          alt=""
                          width={24}
                          height={24}
                          style={{ imageRendering: 'pixelated', flexShrink: 0 }}
                        />
                      )}
                      <Link href={`/database/monsters/${row.monster_id}`}>{row.name_en}</Link>
                    </div>
                  </td>
                  <td data-label="Lv" className="num">{row.level}</td>
                  <td data-label="HP" className="num">{(row.hp ?? 0).toLocaleString()}</td>
                  <td data-label="EXP/HP" className="num" style={{ color: 'var(--yellow)' }}>
                    {row.exp_per_hp ?? '—'}
                  </td>
                  <td data-label="ดรอปตามช่วงเลเวล">
                    <span
                      className={`tag tag--${dropPenalty(character.level, row.level)}`}
                      title={dropPenaltyDetail(character.level, row.level)}
                    >
                      {DROP_PENALTY_LABELS[dropPenalty(character.level, row.level)]}
                    </span>
                  </td>
                  <td data-label="สกิลที่ต้องระวัง">
                    {risks.length === 0 ? (
                      <span className="muted">ไม่มี</span>
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {risks.map((r) => (
                          <span
                            key={r.skillName}
                            className="tag tag--risk"
                            title={`${r.skillName} — ${SKILL_RISK_WHY[r.risk as SkillRisk]}`}
                          >
                            {SKILL_RISK_LABELS[r.risk as SkillRisk]}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td data-label="แมพ">{row.spawn ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
