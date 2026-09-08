'use client';

// The AFK list. Safe means what the user said it means (7 Sep 2026): "I
// dodge it, I hit it, I can farm all night" -- see lib/afk-safety for the
// rule and why "all night" is stood in for by a short fight. Before that the
// gate was "dies in one hit", which for any real character meant the Lv 1-25
// shelf no matter what was typed in.

import Caveat from '@/components/Caveat';
import MonsterLink from '@/components/MonsterLink';
import { isCVariant } from '@/lib/c-variant';
import { useEffect, useState } from 'react';
import { useToolUse } from '@/lib/use-tool-use';
import Link from 'next/link';
import {
  afkVerdict,
  AFK_FAIL_LABELS,
  DEFAULT_MAX_HITS,
  DODGE_CAP_RELAXED,
  DODGE_CAP_STRICT,
  MY_HIT_FLOOR,
  riskySkills,
  SKILL_RISK_LABELS,
  SKILL_RISK_WHY,
  type AfkStyle,
  type AfkVerdict,
  type SkillRisk,
} from '@/lib/afk-safety';
import { dropPenalty, dropPenaltyDetail, DROP_PENALTY_LABELS } from '@/lib/drop-penalty';
import { KILL_RATE_DISCLAIMER, expPerHour, killRate } from '@/lib/kills-per-hour';
import ToolNumbers, { useRememberedNumbers } from '@/components/ToolNumbers';
import { attacksPerSecond, castsPerSecond, type PlayerField } from '@/lib/player-numbers';
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
  /** The mob's hit_100 threshold: the EXP/hour column counts misses with it. */
  hit100?: number | null;
}

const STYLE_KEY = 'roz-calc:afk-style';

// What the form asks for, per style. A caster has no ASPD and never misses,
// so those two boxes go and "seconds per cast" comes in.
const FIELDS: Record<AfkStyle, PlayerField[]> = {
  melee: ['damagePerHit', 'aspd', 'hit', 'flee', 'level', 'maxHits'],
  magic: ['damagePerHit', 'castSeconds', 'flee', 'level', 'maxHits'],
};

function useAfkStyle(): [AfkStyle, (s: AfkStyle) => void] {
  const [style, setStyle] = useState<AfkStyle>('melee');
  useEffect(() => {
    try {
      if (window.localStorage.getItem(STYLE_KEY) === 'magic') setStyle('magic');
    } catch {
      // No storage: melee it is.
    }
  }, []);
  function set(next: AfkStyle) {
    setStyle(next);
    try {
      window.localStorage.setItem(STYLE_KEY, next);
    } catch {
      // Remembering is a convenience, not a requirement.
    }
  }
  return [style, set];
}

export default function AfkFinderResults({ rows }: { rows: AfkCandidate[] }) {
  const [numbers, setNumbers, ready] = useRememberedNumbers();
  const [style, setStyle] = useAfkStyle();
  useToolUse('leveling_spots', { mode: 'afk', level: numbers.level, damage: numbers.damagePerHit, aspd: numbers.aspd, hit: numbers.hit }, ready);

  const perSecond = style === 'magic' ? castsPerSecond(numbers.castSeconds) : attacksPerSecond(numbers.aspd);
  const maxHits = numbers.maxHits ?? DEFAULT_MAX_HITS;
  // The verdict needs damage, a rate, FLEE, and (melee) HIT. Until all are
  // in, the page shows every monster that does not attack first -- a real
  // answer to half the question, and what a crawler sees.
  const me =
    ready &&
    numbers.damagePerHit !== undefined &&
    perSecond !== null &&
    numbers.flee !== undefined &&
    (style === 'magic' || numbers.hit !== undefined)
      ? {
          level: numbers.level ?? null,
          damagePerHit: numbers.damagePerHit,
          perSecond,
          hit: numbers.hit ?? null,
          flee: numbers.flee,
        }
      : null;
  const personal = me !== null;

  const [cleanMapOnly, setCleanMapOnly] = useState(false);
  const [noRiskOnly, setNoRiskOnly] = useState(false);
  const { sort, toggle, indicator } = useTableSort();

  // Non-aggressive pool for the impersonal view; with numbers in, aggressive
  // monsters join and are simply held to the stricter dodge cap.
  const baseRows = rows.filter((r) => r.is_aggressive === false);

  type Judged = { row: AfkCandidate; verdict: AfkVerdict | null; risks: ReturnType<typeof riskySkills>; expHour: number | null };
  const judged: Judged[] = (personal ? rows : baseRows).map((row) => {
    const verdict = me
      ? afkVerdict({
          style,
          monster: {
            hp: row.hp ?? null,
            flee95: row.flee95 ?? null,
            hit100: row.hit100 ?? null,
            isAggressive: row.is_aggressive ?? null,
            mapAggroCount: row.spawn?.aggroCount ?? null,
          },
          me: { flee: me.flee, hit: me.hit, damagePerHit: me.damagePerHit },
          maxHits,
        })
      : null;
    let expHour: number | null = null;
    if (me && verdict) {
      const rate = killRate({
        monsterHp: row.hp ?? 0,
        damagePerHit: me.damagePerHit,
        attacksPerSecond: me.perSecond,
        hitChancePercent: verdict.myHitPct,
      });
      expHour = rate ? expPerHour(rate.killsPerHour, row.base_exp ?? 0) : null;
    }
    return { row, verdict, risks: riskySkills(row.skills), expHour };
  });

  const failed = personal ? judged.filter((j) => j.verdict && !j.verdict.ok) : [];
  const candidates = judged
    .filter((j) => !j.verdict || j.verdict.ok)
    .filter((j) => !cleanMapOnly || j.row.spawn?.aggroCount === 0)
    .filter((j) => !noRiskOnly || j.risks.length === 0)
    // Clean monsters first (a risky skill is the one thing the numbers cannot
    // price), then the most EXP for the hour.
    .sort(
      (a, b) =>
        a.risks.length - b.risks.length ||
        (b.expHour ?? -1) - (a.expHour ?? -1) ||
        (b.row.exp_per_hp ?? 0) - (a.row.exp_per_hp ?? 0),
    );
  const clean = candidates.filter((c) => c.risks.length === 0).length;

  const shown = bySorted(candidates, sort, (c, key) =>
    key === 'name' ? c.row.name_en
    : key === 'level' ? c.row.level
    : key === 'hp' ? c.row.hp
    : key === 'hits' ? c.verdict?.hits ?? null
    : key === 'myhit' ? c.verdict?.myHitPct ?? null
    : key === 'theirhit' ? c.verdict?.theirHitPct ?? null
    : key === 'exp' ? c.expHour
    : key === 'exp_per_hp' ? c.row.exp_per_hp
    : null,
  );

  // Why nothing passed, by the most common reason -- so an empty list says
  // "your FLEE is the problem" instead of just "nothing".
  const failCounts = new Map<string, number>();
  for (const f of failed) for (const reason of f.verdict!.fails) failCounts.set(reason, (failCounts.get(reason) ?? 0) + 1);
  const topFail = [...failCounts.entries()].sort((a, b) => b[1] - a[1])[0];

  const hitWord = style === 'magic' ? 'ร่าย' : 'ตี';

  return (
    <>
      <div className="filterbar" style={{ marginBottom: 8 }} role="radiogroup" aria-label="สายตี หรือ สายเวท">
        <label className="cvtoggle">
          <input type="radio" name="afk-style" checked={style === 'melee'} onChange={() => setStyle('melee')} />
          สายตี (ตีธรรมดา)
        </label>
        <label className="cvtoggle">
          <input type="radio" name="afk-style" checked={style === 'magic'} onChange={() => setStyle('magic')} />
          สายเวท (บอทร่ายสกิล)
        </label>
      </div>

      <ToolNumbers
        fields={FIELDS[style]}
        numbers={numbers}
        onChange={setNumbers}
        labels={
          style === 'magic'
            ? {
                damagePerHit: { label: 'ดาเมจต่อร่าย', hint: 'เช่น 900', unlocks: 'ร่ายกี่ครั้ง' },
                maxHits: { label: 'ฆ่าได้ภายใน (ครั้ง)', hint: 'เช่น 5', unlocks: 'ตัดตัวที่สู้นาน' },
                flee: { label: 'FLEE', hint: 'เช่น 195', unlocks: 'ร่ายไม่หลุด' },
              }
            : { damagePerHit: { label: 'ดาเมจต่อที', hint: 'เช่น 400', unlocks: 'ตีกี่ที' } }
        }
        note={
          style === 'magic'
            ? `ปลอดภัย = มันตีเราโดน ≤${DODGE_CAP_STRICT}% (โดนทีร่ายหลุด) และฆ่าได้ภายในจำนวนครั้งที่ตั้ง (ไม่ตั้ง = ${DEFAULT_MAX_HITS}) · เวทไม่พลาด ไม่ต้องกรอก HIT · เลเวล = ดรอปโดนหักไหม`
            : `ปลอดภัย = มันตีเราโดน ≤${DODGE_CAP_RELAXED}% (มอนโจมตีก่อน/แมพมีมอนโจมตีก่อน ≤${DODGE_CAP_STRICT}%) · เราตีโดน ≥${MY_HIT_FLOOR}% · ฆ่าได้ภายในจำนวนทีที่ตั้ง (ไม่ตั้ง = ${DEFAULT_MAX_HITS}) · เลเวล = ดรอปโดนหักไหม`
        }
      />

      <div className="card" style={{ marginTop: 20 }}>
        {personal ? (
          <p className="muted" style={{ margin: 0 }}>
            ผ่านเกณฑ์ <strong>{candidates.length}</strong> ตัว · ไม่มีสกิลเสี่ยง <strong>{clean}</strong> ตัว · ไม่ผ่าน {failed.length} ตัว
            {topFail && ` (ส่วนใหญ่เพราะ${AFK_FAIL_LABELS[topFail[0] as keyof typeof AFK_FAIL_LABELS]} ${topFail[1]} ตัว)`}
          </p>
        ) : (
          <p className="muted" style={{ margin: 0 }}>
            ไม่โจมตีก่อน <strong>{baseRows.length}</strong> ตัว · ไม่มีสกิลเสี่ยง <strong>{clean}</strong> ตัว ·{' '}
            <strong>กรอก{style === 'magic' ? 'ดาเมจ วินาทีต่อร่าย FLEE' : 'ดาเมจ ASPD HIT FLEE'}ข้างบน</strong> แล้วรายการจะเหลือตัวที่ปลอดภัยสำหรับคุณ
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

      <Caveat label="ข้อจำกัดของตัวเลขนี้">
        <strong>ข้อจำกัด:</strong> ไม่รับรองว่ารอดทั้งคืน — ไม่มีข้อมูลความเร็วโจมตีของมอน จึงใช้ &ldquo;สู้สั้น&rdquo; (ฆ่าได้ภายในไม่กี่ที) แทน ·
        ดาเมจใช้ตามที่กรอก ไม่ได้คูณธาตุให้ ·
        สกิล &ldquo;เสี่ยง&rdquo; ตัดสินจากชื่อสกิลในไฟล์เกม ไม่ใช่การทดสอบจริง ·
        คอลัมน์แมพเลือกแมพที่มีมอนโจมตีก่อนน้อยชนิดสุดที่ตัวนั้นเกิด{personal && <> · EXP/ชม. เป็น{KILL_RATE_DISCLAIMER}</>}
      </Caveat>

      {candidates.length === 0 ? (
        <p className="muted" style={{ marginTop: 20 }}>
          {cleanMapOnly || noRiskOnly
            ? 'ไม่มีตัวไหนผ่านทั้งเกณฑ์ที่ติ๊กไว้ ลองเอาติ๊กออกดู'
            : topFail
              ? `ไม่มีตัวไหนผ่านเกณฑ์ — ส่วนใหญ่ตกเพราะ${AFK_FAIL_LABELS[topFail[0] as keyof typeof AFK_FAIL_LABELS]} ลองเพิ่มจำนวน${hitWord}ที่ยอมได้ หรือเช็คตัวเลขที่กรอก`
              : 'ไม่มีตัวไหนผ่านเกณฑ์'}
        </p>
      ) : (
        <div className="card" style={{ marginTop: 12, overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th><button type="button" className="thsort" onClick={() => toggle('name', false)}>มอนสเตอร์ {indicator('name')}</button></th>
                <th className="num"><button type="button" className="thsort" onClick={() => toggle('level')}>Lv {indicator('level')}</button></th>
                <th className="num"><button type="button" className="thsort" onClick={() => toggle('hp')}>HP {indicator('hp')}</button></th>
                {personal ? (
                  <>
                    <th className="num"><button type="button" className="thsort" onClick={() => toggle('hits', false)}>{hitWord}กี่{style === 'magic' ? 'ครั้ง' : 'ที'} {indicator('hits')}</button></th>
                    {style === 'melee' && <th className="num"><button type="button" className="thsort" onClick={() => toggle('myhit')}>เราตีโดน {indicator('myhit')}</button></th>}
                    <th className="num"><button type="button" className="thsort" onClick={() => toggle('theirhit', false)}>มันตีเราโดน {indicator('theirhit')}</button></th>
                    <th className="num"><button type="button" className="thsort" onClick={() => toggle('exp')}>EXP/ชม. {indicator('exp')}</button></th>
                    {numbers.level !== undefined && <th>ดรอปตามช่วงเลเวล</th>}
                  </>
                ) : (
                  <th className="num"><button type="button" className="thsort" onClick={() => toggle('exp_per_hp')}>EXP/HP {indicator('exp_per_hp')}</button></th>
                )}
                <th>สกิลที่ต้องระวัง</th>
                <th>แมพที่เสี่ยงต่ำสุด</th>
              </tr>
            </thead>
            <tbody>
              {shown.map(({ row, risks, verdict, expHour }) => (
                <tr key={row.monster_id} className={isCVariant(row.name_en) ? 'cvariant' : undefined}>
                  <td data-label="">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {row.image_url && (
                        <img loading="lazy" decoding="async" src={row.image_url} alt="" width={24} height={24} style={{ imageRendering: 'pixelated', flexShrink: 0 }} />
                      )}
                      <MonsterLink id={row.monster_id} name={row.name_en} />
                      {row.is_aggressive && (
                        <span className="tag tag--risk" title={`มอนตัวนี้โจมตีก่อน จึงถูกคิดที่เกณฑ์เข้ม: มันตีเราโดนได้ไม่เกิน ${DODGE_CAP_STRICT}%`}>โจมตีก่อน·หลบได้</span>
                      )}
                    </div>
                  </td>
                  <td data-label="Lv" className="num">{row.level}</td>
                  <td data-label="HP" className="num">{row.hp && row.hp > 0 ? row.hp.toLocaleString() : '—'}</td>
                  {personal && verdict ? (
                    <>
                      <td data-label={`${hitWord}กี่ที`} className="num">{verdict.hits ?? '—'}</td>
                      {style === 'melee' && (
                        <td data-label="เราตีโดน" className="num">{verdict.myHitPct !== null ? `${verdict.myHitPct}%` : '—'}</td>
                      )}
                      <td data-label="มันตีเราโดน" className="num">
                        {verdict.theirHitPct !== null ? (
                          <span style={{ color: verdict.theirHitPct <= 5 ? 'var(--status-safe)' : undefined }}>{verdict.theirHitPct}%</span>
                        ) : '—'}
                      </td>
                      <td data-label="EXP/ชม." className="num" style={{ color: 'var(--yellow)' }}>
                        {expHour != null ? Math.round(expHour).toLocaleString() : '—'}
                      </td>
                      {me?.level != null && (
                        <td data-label="ดรอปตามช่วงเลเวล">
                          <span className={`tag tag--${dropPenalty(me.level, row.level)}`} title={dropPenaltyDetail(me.level, row.level)}>
                            {DROP_PENALTY_LABELS[dropPenalty(me.level, row.level)]}
                          </span>
                        </td>
                      )}
                    </>
                  ) : (
                    <td data-label="EXP/HP" className="num" style={{ color: 'var(--yellow)' }}>{row.exp_per_hp ?? '—'}</td>
                  )}
                  <td data-label="สกิลที่ต้องระวัง">
                    {risks.length === 0 ? (
                      <span className="muted">ไม่มี</span>
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {risks.map((r) => (
                          <span key={r.skillName} className="tag tag--risk" title={`${r.skillName} — ${SKILL_RISK_WHY[r.risk as SkillRisk]}`}>
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
                            title={`ในแมพนี้มีมอนสเตอร์ที่โจมตีก่อนอยู่ ${row.spawn.aggroCount} ชนิด — ตัวนี้จึงถูกคิดที่เกณฑ์เข้ม (มันตีเราโดนไม่เกิน ${DODGE_CAP_STRICT}%)`}
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
            แสดงครบทั้ง {shown.length} ตัวที่ผ่านเกณฑ์ · เรียงตัวไม่มีสกิลเสี่ยงก่อน แล้ว EXP/ชม. มากไปน้อย
          </p>
        </div>
      )}
    </>
  );
}
