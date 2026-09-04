'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AggroBadge from '@/components/AggroBadge';
import { supabaseBrowser } from '@/lib/supabase';
import { useFarmPlan } from '@/components/FarmPlanProvider';
import ToolNumbers, { useRememberedNumbers } from '@/components/ToolNumbers';
import { attacksPerSecond } from '@/lib/player-numbers';
import { KILL_RATE_DISCLAIMER, expPerHour, killRate } from '@/lib/kills-per-hour';
import { hitChanceVsMob } from '@/lib/hit-flee';
import { formatExpPerHour, formatKillsPerHour } from '@/lib/format-rate';
import { DROP_PENALTY_LABELS, dropPenalty, dropPenaltyDetail } from '@/lib/drop-penalty';

interface PlannedMonster {
  monster_id: number;
  name_en: string;
  level: number;
  hp: number | null;
  base_exp: number | null;
  hit_100: number | null;
  exp_per_hp: number | null;
  avg_zeny_per_kill: number | null;
  image_url: string | null;
  is_aggressive: boolean | null;
  atk_max: number | null;
  spawn: string | null;
}

type LoadState = 'idle' | 'loading' | 'error';

export default function FarmPlannerBoard() {
  const { plan, remove, ready, persisted } = useFarmPlan();
  const [numbers, setNumbers, characterReady] = useRememberedNumbers();
  const aps = attacksPerSecond(numbers.aspd);
  const character =
    numbers.damagePerHit !== undefined && aps !== null
      ? { damagePerHit: numbers.damagePerHit, attacksPerSecond: aps, hit: numbers.hit ?? null, level: numbers.level ?? null }
      : null;
  const [rows, setRows] = useState<PlannedMonster[]>([]);
  const [state, setState] = useState<LoadState>('idle');

  // The plan is a list of ids, so the numbers are fetched fresh every visit
  // rather than stored beside them. A plan saved before an import would
  // otherwise keep showing the HP the monster had back then.
  useEffect(() => {
    if (!ready) return;
    if (plan.length === 0) {
      setRows([]);
      setState('idle');
      return;
    }

    let cancelled = false;
    setState('loading');

    (async () => {
      const db = supabaseBrowser();
      const [stats, spawns] = await Promise.all([
        db
          .from('monster_farming_stats')
          .select(
            'monster_id, name_en, level, hp, base_exp, exp_per_hp, avg_zeny_per_kill, image_url, is_aggressive, atk_max, hit_100',
          )
          .in('monster_id', plan),
        db.from('monster_spawns').select('monster_id, map_display_name').in('monster_id', plan),
      ]);

      if (cancelled) return;

      // A failed read must not render as an empty plan -- that would look like
      // the plan was lost.
      if (stats.error || spawns.error) {
        console.error('farm planner query failed', stats.error ?? spawns.error);
        setState('error');
        return;
      }

      const mapByMonster = new Map<number, string>();
      for (const row of spawns.data ?? []) {
        if (!mapByMonster.has(row.monster_id) && row.map_display_name) {
          mapByMonster.set(row.monster_id, row.map_display_name);
        }
      }

      const byId = new Map((stats.data ?? []).map((s) => [s.monster_id, s]));
      // Kept in the order the player added them, not the order Postgres
      // returned: the plan is a list they built, and reordering it under them
      // makes it hard to find what was just added.
      setRows(
        plan
          .map((id) => byId.get(id))
          .filter((s): s is NonNullable<typeof s> => Boolean(s))
          .map((s) => ({ ...s, spawn: mapByMonster.get(s.monster_id) ?? null })),
      );
      setState('idle');
    })();

    return () => {
      cancelled = true;
    };
  }, [plan, ready]);

  // Before storage has been read, this is a plain "reading your plan" line
  // rather than null or "your plan is empty". Null left the served page with
  // nothing under its heading -- the same hole the AFK finder shipped with --
  // and "empty" would be a wrong claim for anyone who does have a plan saved.
  if (!ready) {
    return (
      <div className="card" style={{ marginTop: 20 }}>
        <p className="muted" style={{ margin: 0 }}>กำลังอ่านแผนจากเบราว์เซอร์ของคุณ…</p>
      </div>
    );
  }

  if (plan.length === 0) {
    return (
      <div className="card" style={{ marginTop: 20 }}>
        <p className="muted" style={{ margin: 0 }}>
          ยังไม่มีมอนสเตอร์ในแผน — เปิด <Link href="/">หน้าหาจุดตี</Link> หรือ{' '}
          <Link href="/database/monsters">หน้ารายการมอนสเตอร์</Link> แล้วกด "เพิ่มเข้าแผน" ที่ตัวที่สนใจ
        </p>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="card" style={{ marginTop: 20 }}>
        <p className="muted" style={{ margin: 0 }}>
          ดึงข้อมูลมอนสเตอร์ในแผนไม่สำเร็จ ลองรีเฟรชอีกครั้ง — แผนของคุณยังอยู่ ไม่ได้หายไปไหน
        </p>
      </div>
    );
  }

  const personal = characterReady && character !== null;

  function rateFor(row: PlannedMonster) {
    if (!character || !row.hp) return null;
    const rate = killRate({
      monsterHp: row.hp,
      damagePerHit: character.damagePerHit,
      attacksPerSecond: character.attacksPerSecond,
      hitChancePercent:
        character.hit != null && row.hit_100 != null ? hitChanceVsMob(character.hit, row.hit_100) : null,
    });
    if (!rate) return null;
    return { rate, exp: expPerHour(rate.killsPerHour, row.base_exp ?? 0) };
  }

  const withRate = rows.map((row) => ({ row, personalRate: personal ? rateFor(row) : null }));
  const counted = withRate.filter((r) => r.personalRate?.exp);

  // Deliberately NOT a sum. Adding the EXP/hour of five monsters together would
  // claim a player can stand in five places at once; the spec asked for a
  // total, and the honest total here is the comparison -- which row in the plan
  // is worth going to, and by how much.
  const rates = counted.map((r) => r.personalRate?.exp ?? 0);
  const best = rates.length > 0 ? Math.max(...rates) : 0;
  const worst = rates.length > 0 ? Math.min(...rates) : 0;
  const bestRow = counted.find((r) => (r.personalRate?.exp ?? 0) === best)?.row ?? null;
  const skipped = rows.length - counted.length;

  return (
    <>

      <ToolNumbers
        fields={['damagePerHit', 'aspd', 'hit', 'level']}
        numbers={numbers}
        onChange={setNumbers}
        note="กรอกดาเมจกับ ASPD แล้วแผนจะบอก EXP/ชม. และเรียงตัวที่คุ้มสุดให้"
      />
      {!persisted && (
        <p className="charbar__error" style={{ marginTop: 16 }}>
          เบราว์เซอร์นี้เก็บค่าไม่ได้ (เช่นโหมดส่วนตัว) — แผนใช้ได้ระหว่างเปิดแท็บนี้ แต่ปิดแล้วจะหาย
        </p>
      )}

      <div className="card" style={{ marginTop: 20, overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>มอนสเตอร์</th>
              <th className="num">Lv</th>
              <th className="num">HP</th>
              <th className="num">EXP/HP</th>
              <th className="num">Zeny/ตัว</th>
              {personal && <th className="num">ตัว/ชม.</th>}
              {personal && <th className="num">EXP/ชม.</th>}
              {personal && numbers.level !== undefined && <th>ดรอปตามช่วงเลเวล</th>}
              <th>แมพ</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {withRate.map(({ row, personalRate }) => (
              <tr key={row.monster_id}>
                <td data-label="">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
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
                    <AggroBadge monster={{ is_aggressive: row.is_aggressive, atk_max: row.atk_max }} />
                  </div>
                </td>
                <td data-label="Lv" className="num">{row.level}</td>
                <td data-label="HP" className="num">
                  {row.hp && row.hp > 0 ? row.hp.toLocaleString() : '—'}
                </td>
                <td data-label="EXP/HP" className="num" style={{ color: 'var(--yellow)' }}>
                  {row.exp_per_hp ?? '—'}
                </td>
                <td data-label="Zeny/ตัว" className="num">
                  {row.avg_zeny_per_kill?.toLocaleString() ?? '—'}
                </td>
                {personal && (
                  <td data-label="ตัว/ชม." className="num">
                    {personalRate ? formatKillsPerHour(personalRate.rate.killsPerHour) : '—'}
                  </td>
                )}
                {personal && (
                  <td data-label="EXP/ชม." className="num">
                    {personalRate?.exp ? formatExpPerHour(personalRate.exp) : '—'}
                  </td>
                )}
                {personal && character?.level != null && (
                  <td data-label="ดรอปตามช่วงเลเวล">
                    <span
                      className={`tag tag--${dropPenalty(character.level, row.level)}`}
                      title={dropPenaltyDetail(character.level, row.level)}
                    >
                      {DROP_PENALTY_LABELS[dropPenalty(character.level, row.level)]}
                    </span>
                  </td>
                )}
                <td data-label="แมพ">{row.spawn ?? '—'}</td>
                <td data-label="">
                  <button type="button" className="planbtn planbtn--compact" onClick={() => remove(row.monster_id)}>
                    เอาออก
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {personal ? (
          <>
            <p className="muted" style={{ marginTop: 12 }}>
              {bestRow && (
                <>
                  ในแผน {counted.length} ตัวที่คิดได้ ตัวที่คุ้มที่สุดคือ <strong>{bestRow.name_en}</strong> ที่{' '}
                  <strong>{formatExpPerHour(best)}</strong> EXP ต่อชั่วโมง
                  {rates.length > 1 && ` — มากกว่าตัวที่ต่ำสุดในแผน ${(best / Math.max(worst, 1)).toFixed(1)} เท่า`}
                </>
              )}
              {skipped > 0 && ` · อีก ${skipped} ตัวไม่มีค่า HP หรือ EXP ในข้อมูล จึงคิดให้ไม่ได้`}
            </p>
            {/* No sum of EXP/hour anywhere on this page: a player stands in one
                place at a time, so adding the rates would state something that
                cannot happen. */}
            <p className="ceiling-note">{KILL_RATE_DISCLAIMER}</p>
          </>
        ) : (
          <p className="muted" style={{ marginTop: 12 }}>
            กรอกดาเมจต่อครั้งกับความเร็วโจมตีในแถบด้านบน แล้วหน้านี้จะคิด EXP ต่อชั่วโมงและผลรวมให้ด้วย
          </p>
        )}
      </div>
    </>
  );
}
