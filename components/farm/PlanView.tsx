'use client';

// รายการของฉัน: the monsters a player picked with "เพิ่มเข้าแผน", compared one
// at a time on EXP and zeny. Never added up -- a player stands in one place
// at a time, so a total would describe something that cannot happen.

import Link from 'next/link';
import { useMemo } from 'react';
import MonsterCard from './MonsterCard';
import { small, whole } from './card-helpers';
import type { CardFigure, CardTag } from './MapCard';
import type { ViewProps } from './LevelView';
import { useFarmPlan } from '@/components/FarmPlanProvider';
import { comparePlan, type PlanRow } from '@/lib/farm-engine/plan';
import { canRate } from '@/lib/farm-engine/basics';
import { SKILL_RISK_LABELS } from '@/lib/afk-safety';

function rowTags(row: PlanRow): CardTag[] {
  const tags: CardTag[] = [];
  if (row.m.isMvp) tags.push({ tone: 'warn', text: 'MVP', title: 'ไม่นับในอันดับแมพ' });
  else if (row.m.solo) tags.push({ tone: 'warn', text: 'เกิดทีละตัว', title: 'ทุกจุดเกิดมีตัวเดียว ไม่นับในอันดับแมพ' });
  if (row.m.isAggressive) tags.push({ tone: 'warn', text: 'โจมตีก่อน' });
  if (row.dropTag === 'halved') tags.push({ tone: 'info', text: 'ดรอปหักครึ่ง', title: 'ห่างจากเลเวลคุณเกิน 40 เลเวล' });
  if (row.dropTag === 'unconfirmed') tags.push({ tone: 'warn', text: 'ดรอปช่วงเลเวลนี้ยังไม่ยืนยัน', title: 'ห่าง 20–40 เลเวล ตัวเลขคิดเต็ม' });
  for (const risk of new Set(row.m.risks.map((r) => r.risk))) tags.push({ tone: 'warn', text: SKILL_RISK_LABELS[risk] });
  return tags;
}

export default function PlanView({ data, player }: ViewProps) {
  const { plan, remove, ready, persisted } = useFarmPlan();
  const result = useMemo(() => comparePlan(plan, data, player), [plan, data, player]);
  const rate = canRate(player);

  if (!ready) {
    return (
      <div className="card farm-state">
        <p>กำลังอ่านแผนจากเบราว์เซอร์ของคุณ…</p>
      </div>
    );
  }

  if (plan.length === 0) {
    return (
      <div className="card farm-state">
        <p>
          ยังไม่มีมอนสเตอร์ในแผน — เปิด <Link href="/database/monsters">หน้ารายการมอนสเตอร์</Link> แล้วกด &ldquo;เพิ่มเข้าแผน&rdquo; ที่ตัวที่สนใจ
        </p>
      </div>
    );
  }

  return (
    <>
      <p className="farm-summary">
        {rate ? (
          <>
            {result.bestExp && (
              <>
                EXP/ชม. ดีสุด: <strong>{result.bestExp.m.name}</strong> ราว {whole(result.bestExp.expPerHour as number)} ·{' '}
              </>
            )}
            {result.bestZeny && (
              <>
                z/ชม. ดีสุด: <strong>{result.bestZeny.m.name}</strong> ราว {whole(result.bestZeny.zenyPerHour as number)}z ·{' '}
              </>
            )}
            เทียบทีละตัว เพราะยืนฟาร์มได้ทีละที่
          </>
        ) : (
          <>
            ในแผน <strong>{result.rows.length}</strong> ตัว · กรอกดาเมจกับ ASPD ในแถบด้านบน แล้วจะได้ EXP/ชม. และ z/ชม. ของแต่ละตัว
          </>
        )}
        {result.missing.length > 0 && <> · มี {result.missing.length} ตัวในแผนที่ไม่มีในข้อมูลแล้ว</>}
      </p>
      {!persisted && <p className="charbar__error">เบราว์เซอร์นี้เก็บค่าไม่ได้ (เช่นโหมดส่วนตัว) — แผนใช้ได้ระหว่างเปิดแท็บนี้ แต่ปิดแล้วจะหาย</p>}

      <ul className="farmplan">
        {result.rows.map((row) => {
          const stats: CardFigure[] = [];
          if (row.zenyPerHour !== null) stats.push({ label: 'z/ชม. ราว', value: `${whole(row.zenyPerHour)}z` });
          stats.push({ label: 'เฉลี่ยตัวละ', value: `${small(row.zenyPerKill)}z` });
          if (row.m.hp !== null) stats.push({ label: 'HP', value: whole(row.m.hp) });
          if (row.myHitPct !== null) stats.push({ label: 'เราตีโดน', value: `${row.myHitPct}%` });
          if (row.theirHitPct !== null) stats.push({ label: 'มันตีเราโดน', value: `${row.theirHitPct}%` });
          return (
            <MonsterCard
              key={row.m.id}
              id={row.m.id}
              name={row.m.name}
              level={row.m.level}
              sprite={row.m.sprite}
              headline={
                row.expPerHour !== null
                  ? { label: 'ได้ราว', value: whole(row.expPerHour), unit: ' EXP/ชม.' }
                  : row.m.baseExp !== null
                    ? { label: 'EXP ต่อตัว', value: whole(row.m.baseExp) }
                    : null
              }
              stats={stats}
              tags={rowTags(row)}
              map={row.homeMap}
              onRemove={() => remove(row.m.id)}
            />
          );
        })}
      </ul>
    </>
  );
}
