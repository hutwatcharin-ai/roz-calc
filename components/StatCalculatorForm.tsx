// components/StatCalculatorForm.tsx
'use client';

import { useState } from 'react';
import { JOB_PROFILES, JobKey, totalAtk, maxHp, aspd, statusMatk } from '@/lib/formulas';

const JOB_KEYS = Object.keys(JOB_PROFILES) as JobKey[];

export default function StatCalculatorForm() {
  const [job, setJob] = useState<JobKey>('knight');
  const [level, setLevel] = useState(60);
  const [str, setStr] = useState(90);
  const [agi, setAgi] = useState(40);
  const [vit, setVit] = useState(70);
  const [int_, setInt] = useState(1);
  const [dex, setDex] = useState(60);
  const [luk, setLuk] = useState(10);
  const [weaponAtk, setWeaponAtk] = useState(100);

  const atk = totalAtk(weaponAtk, str, dex, luk);
  const hp = maxHp(level, vit, job);
  const speed = aspd(agi, dex);
  const matk = statusMatk(int_, dex, luk);

  return (
    <div className="card card--cyan">
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {JOB_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setJob(key)}
            style={{
              background: job === key ? 'var(--cyan)' : 'transparent',
              color: job === key ? '#00252B' : 'var(--dim)',
              border: '1px solid var(--hair)',
              borderRadius: 6,
              padding: '7px 13px',
              cursor: 'pointer',
            }}
          >
            {JOB_PROFILES[key].label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        <label>เลเวล <input className="mono" type="number" value={level} onChange={(e) => setLevel(Number(e.target.value))} /></label>
        <label>อาวุธ ATK <input className="mono" type="number" value={weaponAtk} onChange={(e) => setWeaponAtk(Number(e.target.value))} /></label>
        <label>STR <input className="mono" type="number" value={str} onChange={(e) => setStr(Number(e.target.value))} /></label>
        <label>AGI <input className="mono" type="number" value={agi} onChange={(e) => setAgi(Number(e.target.value))} /></label>
        <label>VIT <input className="mono" type="number" value={vit} onChange={(e) => setVit(Number(e.target.value))} /></label>
        <label>INT <input className="mono" type="number" value={int_} onChange={(e) => setInt(Number(e.target.value))} /></label>
        <label>DEX <input className="mono" type="number" value={dex} onChange={(e) => setDex(Number(e.target.value))} /></label>
        <label>LUK <input className="mono" type="number" value={luk} onChange={(e) => setLuk(Number(e.target.value))} /></label>
      </div>

      <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px dashed var(--hair)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>ATK รวม</span>
          <span className="mono" style={{ color: 'var(--cyan)', fontSize: 19, fontWeight: 700 }}>{atk}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>MATK</span>
          <span className="mono" style={{ color: 'var(--cyan)', fontSize: 19, fontWeight: 700 }}>
            {matk.min} – {matk.max}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>HP สูงสุด</span>
          <span className="mono" style={{ color: 'var(--cyan)', fontSize: 19, fontWeight: 700 }}>{hp.toLocaleString()}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>ASPD</span>
          <span className="mono" style={{ color: 'var(--cyan)', fontSize: 19, fontWeight: 700 }}>{speed}</span>
        </div>
      </div>

      <div
        style={{
          marginTop: 14,
          fontSize: 11.5,
          color: 'var(--dim)',
          padding: '10px 11px',
          border: '1px dashed var(--pink)',
          borderRadius: 6,
          background: 'rgba(255,61,154,0.06)',
        }}
      >
        ใช้สูตร Ragnarok Renewal มาตรฐาน — <b style={{ color: 'var(--pink)' }}>ค่าประมาณการ ยังไม่ยืนยันกับ Zero 100%</b>
      </div>
    </div>
  );
}
