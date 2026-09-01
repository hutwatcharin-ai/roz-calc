'use client';

import Link from 'next/link';
import AggroBadge from '@/components/AggroBadge';
import AddToPlanButton from '@/components/AddToPlanButton';
import { KILL_RATE_DISCLAIMER, expPerHour, killRate } from '@/lib/kills-per-hour';
import { formatExpPerHour, formatKillsPerHour } from '@/lib/format-rate';
import { DROP_PENALTY_LABELS, dropPenalty, dropPenaltyDetail } from '@/lib/drop-penalty';
import { useCharacterContext } from '@/components/CharacterContextProvider';
import { bySorted, useTableSort } from '@/lib/use-table-sort';
import { hitChanceVsMob } from '@/lib/hit-flee';

interface FarmingRow {
  monster_id: number;
  name_en: string;
  level: number;
  hp: number;
  base_exp: number | null;
  exp_per_hp: number;
  avg_zeny_per_kill: number;
  image_url: string | null;
  is_aggressive: boolean | null;
  atk_max: number | null;
  spawn?: string;
  hit100?: number | null;
}

export default function FarmingTable({ rows }: { rows: FarmingRow[] }) {
  const { character, ready } = useCharacterContext();
  const { sort, toggle, indicator } = useTableSort();

  if (rows.length === 0) {
    return <p style={{ color: 'var(--faint)' }}>ไม่พบมอนสเตอร์ในช่วงเลเวลนี้</p>;
  }

  // The two personal columns appear only once we know the player. Rendering
  // them full of dashes would advertise a feature as broken rather than as
  // waiting for input, and rendering them with a guessed damage figure would
  // rank the table on a number nobody supplied.
  const personal = ready && character !== null;

  // Hit chance needs the HIT the player copied off the status window; without
  // it the column simply does not render rather than assuming 100%.
  const canHit = character && character.hit != null;
  function hitPctFor(row: FarmingRow): number | null {
    if (!character || character.hit == null) return null;
    // hit_100 is the player-HIT threshold from midgardhub (100% at it,
    // -1%/point below) -- not the mob's own stats.
    if (row.hit100 == null) return null;
    return hitChanceVsMob(character.hit, row.hit100);
  }

  function rateFor(row: FarmingRow) {
    if (!character) return null;
    const rate = killRate({
      monsterHp: row.hp,
      damagePerHit: character.damagePerHit,
      attacksPerSecond: character.attacksPerSecond,
    });
    if (!rate) return null;
    // base_exp straight from the view, not exp_per_hp x hp: the ratio is stored
    // rounded, so reconstructing EXP from it would disagree with the figure the
    // monster page shows for the same monster.
    return { rate, exp: expPerHour(rate.killsPerHour, row.base_exp ?? 0) };
  }

  return (
    <div className="card card--yellow" style={{ overflowX: 'auto' }}>
      <table className="data-table">
        <thead>
          <tr>
            <th><button type="button" className="thsort" onClick={() => toggle('name', false)}>มอนสเตอร์ {indicator('name')}</button></th>
            <th className="num"><button type="button" className="thsort" onClick={() => toggle('level')}>Lv {indicator('level')}</button></th>
            <th className="num"><button type="button" className="thsort" onClick={() => toggle('hp')}>HP {indicator('hp')}</button></th>
            <th className="num"><button type="button" className="thsort" onClick={() => toggle('exp_per_hp')}>EXP/HP {indicator('exp_per_hp')}</button></th>
            <th className="num"><button type="button" className="thsort" onClick={() => toggle('zeny')}>Zeny/ตัว {indicator('zeny')}</button></th>
            {personal && canHit && <th className="num">ตีโดน</th>}
            {personal && <th className="num">ตัว/ชม.</th>}
            {personal && <th className="num">EXP/ชม.</th>}
            {personal && <th>ดรอปตามช่วงเลเวล</th>}
            <th>แมพ</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {bySorted(rows, sort, (r, key) =>
            key === 'name' ? r.name_en
            : key === 'level' ? r.level
            : key === 'hp' ? r.hp
            : key === 'exp_per_hp' ? r.exp_per_hp
            : key === 'zeny' ? r.avg_zeny_per_kill
            : null,
          ).map((row) => {
            const personalRate = personal ? rateFor(row) : null;
            return (
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
                    {/* The flag travels with the monster wherever it appears
                        (spec 3.15.1); this table is where a player picks a spot
                        to stand, so it matters most here. */}
                    <AggroBadge monster={{ is_aggressive: row.is_aggressive, atk_max: row.atk_max }} />
                  </div>
                </td>
                <td data-label="Lv" className="num">{row.level}</td>
                <td data-label="HP" className="num">{row.hp.toLocaleString()}</td>
                <td data-label="EXP/HP" className="num" style={{ color: 'var(--yellow)' }}>{row.exp_per_hp}</td>
                <td data-label="Zeny/ตัว" className="num">{row.avg_zeny_per_kill.toLocaleString()}</td>
                {personal && canHit && (
                  <td data-label="ตีโดน" className="num">
                    {(() => {
                      const p = hitPctFor(row);
                      return p === null ? '—' : `${p}%`;
                    })()}
                  </td>
                )}
                {personal && (
                  <td data-label="ตัว/ชม." className="num">
                    {personalRate ? formatKillsPerHour(personalRate.rate.killsPerHour) : '—'}
                  </td>
                )}
                {personal && (
                  <td data-label="EXP/ชม." className="num">
                    {(() => {
                      if (!personalRate?.exp) return '—';
                      // With DEX/LUK known, misses are real: scale by hit
                      // chance so the ranking stops assuming every swing lands.
                      const p = hitPctFor(row);
                      const exp = p === null ? personalRate.exp : (personalRate.exp * p) / 100;
                      return formatExpPerHour(exp);
                    })()}
                  </td>
                )}
                {/* Drops fall by half beyond a 40-level gap (spec 3.9), which
                    can matter more than the EXP this table sorts on. */}
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
                <td data-label="แมพ">{row.spawn ?? '—'}</td>
                {/* spec 3.6: the plan is built from the row a player is already
                    looking at, not by retyping a name on another page. */}
                <td data-label="">
                  <AddToPlanButton monsterId={row.monster_id} compact />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {personal && <p className="ceiling-note">{KILL_RATE_DISCLAIMER}</p>}
    </div>
  );
}
