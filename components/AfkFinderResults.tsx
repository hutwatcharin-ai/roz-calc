'use client';

import { isCVariant } from '@/lib/c-variant';
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

  // hp 0 is the importer's unknown-HP marker, so these rows can never pass the
  // one-hit filter. Saying so is cheaper than letting a reader wonder why the
  // total never adds up.
  const unknownHp = rows.filter((r) => !r.hp || r.hp <= 0).length;

  // No second damage box on this page. The character bar already holds the
  // level and the damage per hit, and a page-local copy is exactly the
  // duplicate source of truth the shared context exists to prevent (spec
  // 3.15.2) -- two boxes drift, and this one decides a safety verdict.
  //
  // Until it is filled in, the page shows every monster that does not attack
  // first rather than an empty prompt. That is a real answer to half the
  // question, it is what a crawler and a first-time visitor see (neither has
  // a character context, and this page exists to be findable and shareable),
  // and it renders on the server instead of appearing after hydration.
  const personal = ready && character !== null;

  const candidates = rows
    .filter((row) => (personal && character ? diesInOneHit(row.hp, character.damagePerHit) : true))
    .map((row) => ({ row, risks: riskySkills(row.skills) }))
    // Safety before EXP, which is the whole reason this is not just a filter on
    // the farming finder: a monster with a skill that can lock or swarm the bot
    // belongs below a clean one however much EXP it gives.
    .sort((a, b) => a.risks.length - b.risks.length || (b.row.exp_per_hp ?? 0) - (a.row.exp_per_hp ?? 0));

  const clean = candidates.filter((c) => c.risks.length === 0).length;

  // Measured at 31,164px on a phone -- 34.6 screens -- because with no
  // character filled in every non-aggressive monster qualifies and all 238 were
  // rendered. The list is sorted safest-first, so the tail is the part nobody
  // scrolls to; it is capped and the cap is stated rather than silently applied.
  const CAP = 40;
  const shown = candidates.slice(0, CAP);
  const hidden = candidates.length - shown.length;

  return (
    <>
      <div className="card" style={{ marginTop: 20 }}>
        {personal && character ? (
          <p className="muted" style={{ margin: 0 }}>
            จากมอนที่ไม่เข้าโจมตีก่อน {rows.length} ตัว ดาเมจ {character.damagePerHit.toLocaleString()} ต่อครั้งของคุณ
            ฆ่าได้ในหมัดเดียว <strong>{candidates.length}</strong> ตัว — ในจำนวนนี้ <strong>{clean}</strong>{' '}
            ตัวไม่มีสกิลที่เว็บนี้จัดว่าเสี่ยงกับบอท
            {unknownHp > 0 && ` (อีก ${unknownHp} ตัวไม่มีค่า HP ในข้อมูล จึงไม่ถูกนับ)`}
          </p>
        ) : (
          <p className="muted" style={{ margin: 0 }}>
            มอนที่ไม่เข้าโจมตีก่อนทั้งหมด <strong>{rows.length}</strong> ตัว — ในจำนวนนี้ <strong>{clean}</strong>{' '}
            ตัวไม่มีสกิลที่เว็บนี้จัดว่าเสี่ยงกับบอท ·{' '}
            <strong>กรอกเลเวลกับดาเมจต่อครั้งในแถบด้านบน</strong>{' '}
            แล้วรายการนี้จะเหลือเฉพาะตัวที่คุณฆ่าได้ในหมัดเดียว และบอกด้วยว่าดรอปโดนหักตามช่วงเลเวลหรือเปล่า
          </p>
        )}
      </div>

      {/* Two limits, stated up front rather than in a footnote, because both
          could turn this page's verdict into a wrong one. */}
      <div className="ceiling-note" style={{ marginTop: 12 }}>
        <strong>ข้อจำกัดที่ต้องรู้:</strong> หน้านี้ใช้ดาเมจที่คุณกรอกตรงๆ ไม่ได้คูณธาตุอาวุธกับธาตุมอนให้
        เพราะยังไม่มีข้อมูลว่าอาวุธของคุณเป็นธาตุอะไร ไม่ใช่เพราะไม่มีตารางธาตุ (ตารางทางการอยู่ที่หน้าตารางธาตุแล้ว) ·
        และการจัดสกิลว่าเสี่ยงมาจาก<strong>ชื่อสกิลในไฟล์เกม</strong> ไม่ได้มาจากการทดสอบจริง
      </div>

      {candidates.length === 0 ? (
        <p className="muted" style={{ marginTop: 20 }}>
          ดาเมจ {character?.damagePerHit.toLocaleString()} ต่อครั้งยังฆ่ามอนที่ไม่เข้าโจมตีก่อนตัวไหนไม่ได้ในหมัดเดียว
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
                {personal && <th>ดรอปตามช่วงเลเวล</th>}
                <th>สกิลที่ต้องระวัง</th>
                <th>แมพ</th>
              </tr>
            </thead>
            <tbody>
              {shown.map(({ row, risks }) => (
                <tr key={row.monster_id} className={isCVariant(row.name_en) ? 'cvariant' : undefined}>
                  <td data-label="">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {row.image_url && (
                        <img loading="lazy" decoding="async"
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
                  <td data-label="HP" className="num">
                    {row.hp && row.hp > 0 ? row.hp.toLocaleString() : '—'}
                  </td>
                  <td data-label="EXP/HP" className="num" style={{ color: 'var(--yellow)' }}>
                    {row.exp_per_hp ?? '—'}
                  </td>
                  {personal && character && (
                    <td data-label="ดรอปตามช่วงเลเวล">
                      <span
                        className={`tag tag--${dropPenalty(character.level, row.level)}`}
                        title={dropPenaltyDetail(character.level, row.level)}
                      >
                        {DROP_PENALTY_LABELS[dropPenalty(character.level, row.level)]}
                      </span>
                    </td>
                  )}
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
          {hidden > 0 && (
            <p className="source-note">
              แสดง {shown.length} ตัวแรกจาก {candidates.length} ตัวที่ผ่านเกณฑ์ · เรียงปลอดภัยที่สุดก่อน
              {' '}อีก {hidden} ตัวที่เหลือปลอดภัยน้อยกว่าหรือให้ EXP น้อยกว่าทั้งหมด
              {!character && ' · กรอกดาเมจของคุณในแถบด้านบนแล้วรายการจะเหลือเฉพาะตัวที่คุณฆ่าได้จริง'}
            </p>
          )}
        </div>
      )}
    </>
  );
}
