'use client';

import Caveat from '@/components/Caveat';
import { isCVariant } from '@/lib/c-variant';
import { useState } from 'react';
import Link from 'next/link';
import { diesInOneHit, riskySkills, SKILL_RISK_LABELS, SKILL_RISK_WHY, type SkillRisk } from '@/lib/afk-safety';
import { dropPenalty, dropPenaltyDetail, DROP_PENALTY_LABELS } from '@/lib/drop-penalty';
import { KILL_RATE_DISCLAIMER, expPerHour, killRate } from '@/lib/kills-per-hour';
import { mobHitChance } from '@/lib/hit-flee';
import { useCharacterContext } from '@/components/CharacterContextProvider';
import { bySorted, useTableSort } from '@/lib/use-table-sort';

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
  spawn: { name: string; code: string; aggroCount: number } | null;
  is_aggressive?: boolean | null;
  flee95?: number | null;
}

export default function AfkFinderResults({ rows }: { rows: AfkCandidate[] }) {
  const { character, ready } = useCharacterContext();
  // Two safety toggles, client-side: the list is already filtered in the
  // browser (the one-hit rule needs the character context), so these belong
  // on the same side. Off by default -- the full picture first.
  const [cleanMapOnly, setCleanMapOnly] = useState(false);
  const [noRiskOnly, setNoRiskOnly] = useState(false);
  // Header sort overrides the safest-first default; null key = default order.
  const { sort, toggle, indicator } = useTableSort();

  // hp 0 is the importer's unknown-HP marker, so these rows can never pass the
  // one-hit filter. Saying so is cheaper than letting a reader wonder why the
  // total never adds up. Base pool = non-aggressive rows (aggressive ones only
  // enter via the dodge-cap rule below).
  const baseRows = rows.filter((r) => !r.is_aggressive);
  const unknownHp = baseRows.filter((r) => !r.hp || r.hp <= 0).length;

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
  // The dodge math turns on only with FLEE filled in (copied straight off the
  // status window); null keeps every aggressive monster out, exactly as
  // before the hit/flee wave.
  const myFlee = personal && character && character.flee != null ? character.flee : null;

  function theirHitPct(row: AfkCandidate): number | null {
    if (myFlee === null) return null;
    // flee_95 is the player-FLEE threshold from midgardhub -- the mob's
    // chance on us is 5% at that FLEE and +1%/point below it.
    if (row.flee95 == null) return null;
    return mobHitChance(row.flee95, myFlee);
  }

  // An aggressive monster qualifies only when it CANNOT realistically hit us:
  // our FLEE at or past its 95%-dodge threshold (the stored value itself).
  function safeFromAggro(row: AfkCandidate): boolean {
    if (myFlee === null) return false;
    if (row.flee95 == null) return false;
    return myFlee >= row.flee95;
  }

  const candidates = rows
    .filter((row) => (row.is_aggressive ? safeFromAggro(row) : true))
    .filter((row) => (personal && character ? diesInOneHit(row.hp, character.damagePerHit) : true))
    .filter((row) => !cleanMapOnly || row.spawn?.aggroCount === 0)
    .map((row) => ({ row, risks: riskySkills(row.skills) }))
    .filter((c) => !noRiskOnly || c.risks.length === 0)
    // Safety before EXP, which is the whole reason this is not just a filter on
    // the farming finder: own risky skills first, then how dangerous the best
    // map's neighbours are, then EXP. A clean monster on a map with aggressive
    // neighbours is still a worse AFK spot than one on an empty field.
    .sort(
      (a, b) =>
        a.risks.length - b.risks.length ||
        (a.row.spawn?.aggroCount ?? 99) - (b.row.spawn?.aggroCount ?? 99) ||
        (b.row.exp_per_hp ?? 0) - (a.row.exp_per_hp ?? 0),
    );

  const clean = candidates.filter((c) => c.risks.length === 0).length;

  const sorted = bySorted(candidates, sort, (c, key) =>
    key === 'name' ? c.row.name_en
    : key === 'level' ? c.row.level
    : key === 'hp' ? c.row.hp
    : key === 'exp_per_hp' ? c.row.exp_per_hp
    : null,
  );

  // No cap: every qualifying monster renders (user request, 31 Aug). The list
  // stays sorted safest-first, so the risky tail is at the bottom where it
  // belongs, and ~220 rows render fine.
  const shown = sorted;
  const hidden = 0;

  return (
    <>
      <div className="card" style={{ marginTop: 20 }}>
        {personal && character ? (
          <p className="muted" style={{ margin: 0 }}>
            ฆ่าได้ในหมัดเดียว <strong>{candidates.length}</strong> ตัว · ไม่มีสกิลเสี่ยง <strong>{clean}</strong> ตัว
            {unknownHp > 0 && ` · ไม่มีค่า HP ${unknownHp} ตัว จึงไม่นับ`}
            {myFlee !== null && (() => {
              const bonus = candidates.filter((c) => c.row.is_aggressive).length;
              return bonus > 0 ? ` · FLEE ${myFlee} เปิดเพิ่มอีก ${bonus} ตัว` : '';
            })()}
          </p>
        ) : (
          <p className="muted" style={{ margin: 0 }}>
            ไม่โจมตีก่อน <strong>{baseRows.length}</strong> ตัว · ไม่มีสกิลเสี่ยง <strong>{clean}</strong> ตัว ·{' '}
            <strong>กรอกเลเวลกับดาเมจข้างบน</strong> เพื่อกรองเหลือตัวที่ฆ่าได้ในหมัดเดียว
          </p>
        )}
      </div>

      <div className="filterbar" style={{ marginTop: 12 }}>
        <label className="cvtoggle">
          <input type="checkbox" checked={cleanMapOnly} onChange={(e) => setCleanMapOnly(e.target.checked)} />
          เฉพาะแมพสะอาด (ไม่มีมอนโจมตีก่อนร่วมแมพ)
        </label>
        <label className="cvtoggle">
          <input type="checkbox" checked={noRiskOnly} onChange={(e) => setNoRiskOnly(e.target.checked)} />
          เฉพาะตัวไม่มีสกิลเสี่ยง
        </label>
      </div>

      {/* Two limits, stated up front rather than in a footnote, because both
          could turn this page's verdict into a wrong one. */}
      <Caveat label="ข้อจำกัดของตัวเลขนี้">
        <strong>ข้อจำกัด:</strong> ดาเมจใช้ตามที่กรอก ไม่ได้คูณธาตุให้ ·
        สกิล &ldquo;เสี่ยง&rdquo; ตัดสินจากชื่อสกิลในไฟล์เกม ไม่ใช่การทดสอบจริง ·
        คอลัมน์แมพเลือกแมพที่มีมอนโจมตีก่อนน้อยชนิดสุดที่ตัวนั้นเกิด{personal && <> · EXP/ชม. เป็น{KILL_RATE_DISCLAIMER}</>}
      </Caveat>

      {candidates.length === 0 ? (
        <p className="muted" style={{ marginTop: 20 }}>
          {cleanMapOnly || noRiskOnly
            ? 'ไม่มีตัวไหนผ่านทั้งเกณฑ์ที่ติ๊กไว้ ลองเอาติ๊กออกดู'
            : `ดาเมจ ${character?.damagePerHit.toLocaleString()} ต่อครั้งยังฆ่ามอนที่ไม่เข้าโจมตีก่อนตัวไหนไม่ได้ในหมัดเดียว`}
        </p>
      ) : (
        <div className="card" style={{ marginTop: 12, overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th><button type="button" className="thsort" onClick={() => toggle('name', false)}>มอนสเตอร์ {indicator('name')}</button></th>
                <th className="num"><button type="button" className="thsort" onClick={() => toggle('level')}>Lv {indicator('level')}</button></th>
                <th className="num"><button type="button" className="thsort" onClick={() => toggle('hp')}>HP {indicator('hp')}</button></th>
                <th className="num"><button type="button" className="thsort" onClick={() => toggle('exp_per_hp')}>EXP/HP {indicator('exp_per_hp')}</button></th>
                {myFlee !== null && <th className="num">มันตีเราโดน</th>}
                {personal && <th className="num">EXP/ชม.</th>}
                {personal && <th>ดรอปตามช่วงเลเวล</th>}
                <th>สกิลที่ต้องระวัง</th>
                <th>แมพที่เสี่ยงต่ำสุด</th>
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
                      {row.is_aggressive && (
                        <span className="tag tag--risk" title="มอนตัวนี้โจมตีก่อน แต่ HIT ของมันตีค่า FLEE ของคุณแทบไม่โดน (หลบถึงเพดาน 95%)">โจมตีก่อน·หลบได้</span>
                      )}
                    </div>
                  </td>
                  <td data-label="Lv" className="num">{row.level}</td>
                  <td data-label="HP" className="num">
                    {row.hp && row.hp > 0 ? row.hp.toLocaleString() : '—'}
                  </td>
                  <td data-label="EXP/HP" className="num" style={{ color: 'var(--yellow)' }}>
                    {row.exp_per_hp ?? '—'}
                  </td>
                  {myFlee !== null && (
                    <td data-label="มันตีเราโดน" className="num">
                      {(() => {
                        const p = theirHitPct(row);
                        if (p === null) return '—';
                        return (
                          <span style={{ color: p <= 5 ? 'var(--status-safe)' : p >= 50 ? 'var(--status-danger)' : undefined }}>
                            {p}%
                          </span>
                        );
                      })()}
                    </td>
                  )}
                  {personal && character && (
                    <td data-label="EXP/ชม." className="num">
                      {(() => {
                        const rate = killRate({
                          monsterHp: row.hp ?? 0,
                          damagePerHit: character.damagePerHit,
                          attacksPerSecond: character.attacksPerSecond,
                        });
                        const exp = rate ? expPerHour(rate.killsPerHour, row.base_exp ?? 0) : null;
                        return exp != null ? Math.round(exp).toLocaleString() : '—';
                      })()}
                    </td>
                  )}
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
                  <td data-label="แมพที่เสี่ยงต่ำสุด">
                    {row.spawn ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <Link href={`/database/maps/${encodeURIComponent(row.spawn.code)}`}>{row.spawn.name}</Link>
                        {row.spawn.aggroCount === 0 ? (
                          <span className="tag tag--none" title="ไม่มีมอนสเตอร์ที่โจมตีก่อนเกิดในแมพนี้เลย">แมพสะอาด</span>
                        ) : (
                          <span
                            className="tag tag--risk"
                            title={`ในแมพนี้มีมอนสเตอร์ที่โจมตีก่อนอยู่ ${row.spawn.aggroCount} ชนิด — บอทอาจโดนตัวอื่นตีแม้เป้าหมายจะไม่โจมตีก่อน`}
                          >
                            โจมตีก่อน {row.spawn.aggroCount} ชนิด
                          </span>
                        )}
                      </div>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="source-note">
            แสดงครบทั้ง {shown.length} ตัวที่ผ่านเกณฑ์ · เรียงปลอดภัยที่สุดก่อน
            {!character && ' · กรอกดาเมจของคุณในแถบด้านบนแล้วรายการจะเหลือเฉพาะตัวที่คุณฆ่าได้จริง'}
          </p>
        </div>
      )}
    </>
  );
}
