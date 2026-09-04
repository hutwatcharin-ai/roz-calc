'use client';

// "How hard do I hit this monster, and how many per hour is that?"
//
// This is where the two panels that used to sit on a monster page went when
// the character bar was removed (4 Sep 2026). Database pages ask for nothing;
// this page asks, once, for the numbers it needs and answers all the way
// through: damage per hit, then kills and EXP per hour from the monster's own
// HP. A monster page links here with ?monster=<id> preselected.

import { useEffect, useMemo, useState } from 'react';
import { useToolUse } from '@/lib/use-tool-use';
import Link from 'next/link';
import { physicalDamagePerHit } from '@/lib/damage';
import { killRate, expPerHour, KILL_RATE_DISCLAIMER } from '@/lib/kills-per-hour';
import { hitChanceVsMob } from '@/lib/hit-flee';
import { ELEMENTS, type Element, type ElementLevel } from '@/lib/element-table';
import { SIZE_TABLE } from '@/lib/size-table';
import { formatExpPerHour, formatKillsPerHour, formatKillTime } from '@/lib/format-rate';
import ToolNumbers, { useRememberedNumbers } from '@/components/ToolNumbers';
import { attacksPerSecond } from '@/lib/player-numbers';

export interface CalcMonster {
  id: number;
  name_en: string;
  level: number;
  hp: number | null;
  base_exp: number | null;
  def: number | null;
  vit: number | null;
  size: string | null;
  element: string | null;
  element_level: number | null;
  hit_100: number | null;
}

const WEAPON_KEY = 'roz-calc:weapon';

interface WeaponChoice {
  weaponAtk: string;
  statusAtk: string;
  weaponType: string;
  weaponElement: Element;
}

const EMPTY: WeaponChoice = {
  weaponAtk: '',
  statusAtk: '',
  weaponType: 'One-Handed Sword',
  weaponElement: 'Neutral',
};

export default function MonsterDamageCalculator({
  monsters,
  initialMonsterId,
}: {
  monsters: CalcMonster[];
  initialMonsterId: number | null;
}) {
  const [numbers, setNumbers, ready] = useRememberedNumbers();
  const [weapon, setWeapon] = useState<WeaponChoice>(EMPTY);
  const [monsterId, setMonsterId] = useState<number | null>(initialMonsterId);
  const [query, setQuery] = useState('');
  // Armed once the remembered numbers (and, in the same commit, the weapon)
  // have loaded, so the localStorage read does not count as a use.
  useToolUse(
    'damage',
    { monster_id: monsterId, weapon_type: weapon.weaponType, weapon_element: weapon.weaponElement, has_atk: weapon.weaponAtk !== '', aspd: numbers.aspd, hit: numbers.hit },
    ready,
  );

  // localStorage only exists on the client; reading it during render would
  // make the server's markup and the browser's disagree.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(WEAPON_KEY);
      if (raw) setWeapon({ ...EMPTY, ...(JSON.parse(raw) as Partial<WeaponChoice>) });
    } catch {
      // Blocked site data: the fields simply start empty.
    }
  }, []);

  function updateWeapon(next: Partial<WeaponChoice>) {
    const merged = { ...weapon, ...next };
    setWeapon(merged);
    try {
      window.localStorage.setItem(WEAPON_KEY, JSON.stringify(merged));
    } catch {
      // Not remembering the weapon does not stop it being used.
    }
  }

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return monsters.slice(0, 40);
    return monsters.filter((m) => m.name_en.toLowerCase().includes(needle)).slice(0, 40);
  }, [monsters, query]);

  const monster = monsters.find((m) => m.id === monsterId) ?? null;

  const damage = monster
    ? physicalDamagePerHit({
        weaponAtk: Number(weapon.weaponAtk) || 0,
        statusAtk: Number(weapon.statusAtk) || 0,
        weaponType: weapon.weaponType,
        weaponElement: weapon.weaponElement,
        targetSize: monster.size,
        targetElement: (monster.element as Element | null) ?? null,
        targetElementLevel: (monster.element_level as ElementLevel | null) ?? null,
        targetDef: monster.def,
        targetLevel: monster.level,
        targetVit: monster.vit,
      })
    : null;

  const aps = attacksPerSecond(numbers.aspd);
  const hitChance =
    numbers.hit !== undefined && monster?.hit_100 != null ? hitChanceVsMob(numbers.hit, monster.hit_100) : null;
  const rate =
    damage && monster && aps !== null
      ? killRate({
          monsterHp: monster.hp ?? 0,
          damagePerHit: damage.damage,
          attacksPerSecond: aps,
          hitChancePercent: hitChance,
        })
      : null;
  const exp = rate && monster ? expPerHour(rate.killsPerHour, monster.base_exp ?? 0) : null;

  return (
    <>
      <div className="toolnumbers">
        <div className="toolnumbers__row">
          <label className="toolnumbers__field">
            <span className="toolnumbers__label">
              ATK อาวุธ<span className="toolnumbers__unlocks"> · โดนธาตุกับขนาด</span>
            </span>
            <input
              className="mono"
              type="number"
              inputMode="numeric"
              placeholder="เช่น 150"
              value={weapon.weaponAtk}
              onChange={(e) => updateWeapon({ weaponAtk: e.target.value })}
            />
          </label>
          <label className="toolnumbers__field">
            <span className="toolnumbers__label">
              ATK ตัวละคร<span className="toolnumbers__unlocks"> · ไร้ธาตุเสมอ</span>
            </span>
            <input
              className="mono"
              type="number"
              inputMode="numeric"
              placeholder="เช่น 200"
              value={weapon.statusAtk}
              onChange={(e) => updateWeapon({ statusAtk: e.target.value })}
            />
          </label>
          <label className="toolnumbers__field">
            <span className="toolnumbers__label">ชนิดอาวุธ</span>
            <select value={weapon.weaponType} onChange={(e) => updateWeapon({ weaponType: e.target.value })}>
              {SIZE_TABLE.map((row) => (
                <option key={row.weapon} value={row.weapon}>{row.label}</option>
              ))}
            </select>
          </label>
          <label className="toolnumbers__field">
            <span className="toolnumbers__label">ธาตุอาวุธ</span>
            <select
              value={weapon.weaponElement}
              onChange={(e) => updateWeapon({ weaponElement: e.target.value as Element })}
            >
              {ELEMENTS.map((el) => (
                <option key={el} value={el}>{el}</option>
              ))}
            </select>
          </label>
        </div>
        <p className="toolnumbers__note">
          ATK สองช่องอยู่ในหน้าต่างสเตตัส (Alt+A) — ตัวเลขคู่ &ldquo;ATK 200 + 150&rdquo; คือตัวละคร + อาวุธ ·
          ค่าเก็บในเบราว์เซอร์เครื่องนี้เท่านั้น
        </p>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <label style={{ display: 'block', marginBottom: 8, color: 'var(--dim)', fontSize: 13 }}>
          เลือกมอนสเตอร์
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="พิมพ์ชื่อมอน เช่น Orc"
            style={{ marginTop: 4, display: 'block', maxWidth: 320 }}
          />
        </label>
        <div className="chiprow">
          {matches.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`chiplink${m.id === monsterId ? ' chiplink--on' : ''}`}
              onClick={() => setMonsterId(m.id)}
            >
              {m.name_en} <span className="mono" style={{ color: 'var(--faint)' }}>Lv{m.level}</span>
            </button>
          ))}
          {matches.length === 0 && <span className="muted">ไม่พบมอนสเตอร์ชื่อนี้</span>}
        </div>
      </div>

      {!monster ? (
        <p className="muted">เลือกมอนสเตอร์ที่จะคำนวณ</p>
      ) : (
        <div className="card">
          <h2 className="section-title">
            <Link href={`/database/monsters/${monster.id}`}>{monster.name_en}</Link>{' '}
            <span className="mono" style={{ color: 'var(--faint)', fontSize: 13 }}>
              Lv{monster.level} · DEF {monster.def ?? '—'} · {monster.element ?? '—'} · {monster.size ?? '—'}
            </span>
          </h2>

          {damage ? (
            <div className="statgrid" style={{ marginTop: 12 }}>
              <div className="statgrid__cell">
                <span className="reward-label">ดาเมจต่อหมัด</span>
                <span className="reward-value mono">{damage.damage.toLocaleString()}</span>
              </div>
              <div className="statgrid__cell">
                <span className="reward-label">ตัวคูณขนาด</span>
                <span className="reward-value mono">{Math.round(damage.sizeModifier * 100)}%</span>
              </div>
              <div className="statgrid__cell">
                <span className="reward-label">ตัวคูณธาตุ (อาวุธ)</span>
                <span className="reward-value mono">{damage.elementModifier}%</span>
              </div>
              <div className="statgrid__cell">
                <span className="reward-label">DEF หักได้</span>
                <span className="reward-value mono">{Math.round((1 - damage.defFactor) * 100)}%</span>
              </div>
              <div className="statgrid__cell">
                <span className="reward-label">soft DEF ลบตรง ๆ</span>
                <span className="reward-value mono">−{damage.softDef}</span>
              </div>
              {hitChance !== null && (
                <div className="statgrid__cell">
                  <span className="reward-label">โอกาสตีโดน</span>
                  <span className="reward-value mono">{hitChance}%</span>
                </div>
              )}
            </div>
          ) : (
            <p className="muted" style={{ marginTop: 12 }}>
              {Number(weapon.weaponAtk) || Number(weapon.statusAtk)
                ? `ข้อมูลของ${monster.name_en} ไม่ครบ (DEF/เลเวล/ธาตุ/ขนาด) จึงคำนวณให้ไม่ได้`
                : 'กรอก ATK ด้านบนแล้วตัวเลขจะขึ้นตรงนี้'}
            </p>
          )}

          {/* The rate half needs one more number, and says which one rather
              than hiding until the form is full. */}
          <div style={{ marginTop: 14 }}>
            <ToolNumbers
              fields={['aspd', 'hit']}
              numbers={numbers}
              onChange={setNumbers}
              note="ASPD = คิดต่อเป็นตัว/ชม. และ EXP/ชม. · HIT = หักหมัดที่พลาดออกให้"
            />
          </div>

          {rate && ready ? (
            <div className="statgrid">
              <div className="statgrid__cell">
                <span className="reward-label">เวลาต่อตัว</span>
                <span className="reward-value mono">{formatKillTime(rate.secondsToKill)}</span>
              </div>
              <div className="statgrid__cell">
                <span className="reward-label">ตัว/ชม.</span>
                <span className="reward-value mono">{formatKillsPerHour(rate.killsPerHour)}</span>
              </div>
              <div className="statgrid__cell">
                <span className="reward-label">EXP/ชม.</span>
                <span className="reward-value mono">{exp !== null ? formatExpPerHour(exp) : '—'}</span>
              </div>
            </div>
          ) : (
            <p className="muted">{damage ? 'ใส่ ASPD เพื่อดูตัว/ชม. กับ EXP/ชม.' : ''}</p>
          )}

          {rate && <p className="ceiling-note" style={{ marginTop: 10 }}>{KILL_RATE_DISCLAIMER}</p>}
        </div>
      )}
    </>
  );
}
