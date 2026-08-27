'use client';

// "How many of these can I kill in an hour, and what EXP is that?" -- worked
// out from the monster's HP and the player's own damage rather than asked for
// (spec 3.15.3). Competing tools open by asking for a kills/hour figure that a
// player who has not gone and stood somewhere cannot answer.

import { KILL_RATE_DISCLAIMER, expPerHour, killRate } from '@/lib/kills-per-hour';
import { formatExpPerHour, formatKillTime, formatKillsPerHour } from '@/lib/format-rate';
import { useCharacterContext } from '@/components/CharacterContextProvider';

export default function KillRatePanel({
  monsterHp,
  expPerKill,
  monsterName,
}: {
  monsterHp: number | null;
  expPerKill: number | null;
  monsterName: string;
}) {
  const { character, ready } = useCharacterContext();

  if (!ready) return null;

  if (!character) {
    return (
      <div className="card">
        <h2 className="section-title">คุณตีตัวนี้ได้กี่ตัวต่อชั่วโมง</h2>
        <p className="muted">
          กรอกดาเมจต่อครั้งกับความเร็วโจมตีในแถบด้านบน แล้วเว็บจะคิดให้เอง — ไม่ต้องไปยืนจับเวลาเอง
        </p>
      </div>
    );
  }

  const rate = killRate({
    monsterHp: monsterHp ?? 0,
    damagePerHit: character.damagePerHit,
    attacksPerSecond: character.attacksPerSecond,
  });

  // monsterHp 0 is the unknown-HP marker the importer writes for a "???" feed
  // value, not a monster that dies to nothing -- so this says we do not know,
  // not that the answer is zero.
  if (!rate) {
    return (
      <div className="card">
        <h2 className="section-title">คุณตีตัวนี้ได้กี่ตัวต่อชั่วโมง</h2>
        <p className="muted">ไม่มีค่า HP ของ {monsterName} ในข้อมูล จึงคำนวณให้ไม่ได้</p>
      </div>
    );
  }

  const exp = expPerHour(rate.killsPerHour, expPerKill ?? 0);

  return (
    <div className="card">
      <h2 className="section-title">คุณตีตัวนี้ได้กี่ตัวต่อชั่วโมง</h2>
      <table className="stat-table">
        <tbody>
          <tr>
            <td>ตีกี่ครั้งตาย</td>
            <td className="num">{rate.hitsToKill.toLocaleString()} ครั้ง</td>
          </tr>
          <tr>
            <td>เวลาต่อตัว</td>
            <td className="num">{formatKillTime(rate.secondsToKill)}</td>
          </tr>
          <tr>
            <td>ตัวต่อชั่วโมง</td>
            <td className="num">{formatKillsPerHour(rate.killsPerHour)}</td>
          </tr>
          <tr>
            <td>EXP ต่อชั่วโมง</td>
            <td className="num">
              {exp === null ? <span className="muted">ไม่มีค่า EXP ในข้อมูล</span> : formatExpPerHour(exp)}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Required wherever a kill rate appears, and stated as a ceiling rather
          than a prediction. No fudge factor is applied: we have neither respawn
          rates nor monster density, and a plausible 0.7 would be a guess dressed
          up as precision. */}
      <p className="ceiling-note">{KILL_RATE_DISCLAIMER}</p>

      <p className="muted">
        คิดจาก ดาเมจ {character.damagePerHit.toLocaleString()} ต่อครั้ง และ {character.attacksPerSecond} ครั้ง/วินาที
        ที่คุณกรอกไว้ · แก้ได้ที่แถบด้านบนของหน้า
      </p>
    </div>
  );
}
