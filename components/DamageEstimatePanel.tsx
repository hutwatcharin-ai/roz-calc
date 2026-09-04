'use client';

// "How hard do I actually hit THIS monster?" -- worked out from the monster's
// own DEF, level, VIT, size and element instead of asked for.
//
// Every rate on this site starts from ดาเมจต่อครั้ง, and until now that number
// had to be typed in from memory. This panel computes it against the monster
// whose page it sits on, and hands it to the character bar with one press, so
// the EXP/hour figures elsewhere start from something measured rather than
// guessed. The arithmetic is in lib/damage.ts.

import { useEffect, useState } from 'react';
import { physicalDamagePerHit } from '@/lib/damage';
import { ELEMENTS, type Element, type ElementLevel } from '@/lib/element-table';
import { SIZE_TABLE, type MonsterSize } from '@/lib/size-table';
import { useCharacterContext } from '@/components/CharacterContextProvider';

const STORAGE_KEY = 'roz-calc:atk';

interface Weapon {
  weaponAtk: string;
  statusAtk: string;
  weaponType: string;
  weaponElement: Element;
}

const EMPTY: Weapon = { weaponAtk: '', statusAtk: '', weaponType: 'One-Handed Sword', weaponElement: 'Neutral' };

function read(): Weapon {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<Weapon>;
    return {
      weaponAtk: typeof parsed.weaponAtk === 'string' ? parsed.weaponAtk : '',
      statusAtk: typeof parsed.statusAtk === 'string' ? parsed.statusAtk : '',
      weaponType: typeof parsed.weaponType === 'string' ? parsed.weaponType : EMPTY.weaponType,
      weaponElement: (ELEMENTS as readonly string[]).includes(parsed.weaponElement ?? '')
        ? (parsed.weaponElement as Element)
        : 'Neutral',
    };
  } catch {
    // Private mode and blocked site data throw on access, not just return null.
    return EMPTY;
  }
}

export default function DamageEstimatePanel({
  monsterName,
  size,
  element,
  elementLevel,
  def,
  level,
  vit,
}: {
  monsterName: string;
  size: MonsterSize | null;
  element: Element | null;
  elementLevel: ElementLevel | null;
  def: number | null;
  level: number | null;
  vit: number | null;
}) {
  const { character, setCharacter } = useCharacterContext();
  const [weapon, setWeapon] = useState<Weapon>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [applied, setApplied] = useState(false);

  // Read after mount, never during render: the server has no localStorage, and
  // reading it in the first render would make the markup differ from the
  // server's and blank the panel on hydration.
  useEffect(() => {
    setWeapon(read());
    setLoaded(true);
  }, []);

  function update(next: Partial<Weapon>) {
    const merged = { ...weapon, ...next };
    setWeapon(merged);
    setApplied(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    } catch {
      // Not being able to remember the weapon is not a reason to stop
      // calculating with it.
    }
  }

  const result = loaded
    ? physicalDamagePerHit({
        weaponAtk: Number(weapon.weaponAtk) || 0,
        statusAtk: Number(weapon.statusAtk) || 0,
        weaponType: weapon.weaponType,
        weaponElement: weapon.weaponElement,
        targetSize: size,
        targetElement: element,
        targetElementLevel: elementLevel,
        targetDef: def,
        targetLevel: level,
        targetVit: vit,
      })
    : null;

  return (
    <div className="card" style={{ marginTop: 20 }}>
      <h2 className="section-title">คุณตีตัวนี้แรงแค่ไหน</h2>
      <p className="muted" style={{ marginTop: 4, maxWidth: '70ch' }}>
        กรอก ATK จากหน้าต่างสเตตัส (Alt+A) — ตัวเลขซ้ายคือของอาวุธ ตัวขวาคือของตัวละคร — แล้วเว็บคิดดาเมจต่อหมัดกับ{monsterName}ให้เอง
      </p>

      <div className="filterbar" style={{ marginTop: 10 }}>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--dim)' }}>
          ATK อาวุธ{' '}
          <input
            className="mono"
            type="number"
            inputMode="numeric"
            value={weapon.weaponAtk}
            onChange={(e) => update({ weaponAtk: e.target.value })}
            style={{ width: 90 }}
          />
        </label>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--dim)' }}>
          ATK ตัวละคร{' '}
          <input
            className="mono"
            type="number"
            inputMode="numeric"
            value={weapon.statusAtk}
            onChange={(e) => update({ statusAtk: e.target.value })}
            style={{ width: 90 }}
          />
        </label>
        <select value={weapon.weaponType} onChange={(e) => update({ weaponType: e.target.value })} aria-label="ชนิดอาวุธ">
          {SIZE_TABLE.map((row) => (
            <option key={row.weapon} value={row.weapon}>{row.label}</option>
          ))}
        </select>
        <select
          value={weapon.weaponElement}
          onChange={(e) => update({ weaponElement: e.target.value as Element })}
          aria-label="ธาตุอาวุธ"
        >
          {ELEMENTS.map((el) => (
            <option key={el} value={el}>{el}</option>
          ))}
        </select>
      </div>

      {result ? (
        <>
          <div className="statgrid" style={{ marginTop: 12 }}>
            <div className="statgrid__cell">
              <span className="reward-label">ดาเมจต่อหมัด</span>
              <span className="reward-value mono">{result.damage.toLocaleString()}</span>
            </div>
            <div className="statgrid__cell">
              <span className="reward-label">ตัวคูณขนาด</span>
              <span className="reward-value mono">{Math.round(result.sizeModifier * 100)}%</span>
            </div>
            <div className="statgrid__cell">
              <span className="reward-label">ตัวคูณธาตุ (อาวุธ)</span>
              <span className="reward-value mono">{result.elementModifier}%</span>
            </div>
            <div className="statgrid__cell">
              <span className="reward-label">DEF หักได้</span>
              <span className="reward-value mono">{Math.round((1 - result.defFactor) * 100)}%</span>
            </div>
            <div className="statgrid__cell">
              <span className="reward-label">soft DEF ลบตรง ๆ</span>
              <span className="reward-value mono">−{result.softDef}</span>
            </div>
          </div>

          {/* The point of the panel: the rest of the site runs on
              damagePerHit, so this hands it over rather than making the
              player copy a number between two boxes. */}
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn"
              disabled={!character}
              onClick={() => {
                if (!character) return;
                setCharacter({ ...character, damagePerHit: result.damage });
                setApplied(true);
              }}
            >
              ใช้เป็นดาเมจต่อครั้งของฉัน
            </button>
            {!character && (
              <span className="muted" style={{ fontSize: 13 }}>
                กรอกเลเวลกับความเร็วตีในแถบตัวละครก่อน แล้วปุ่มนี้จะเอาตัวเลขนี้ไปใส่ให้
              </span>
            )}
            {applied && <span className="muted" style={{ fontSize: 13 }}>ใส่ให้แล้ว — EXP/ชม. ทั้งเว็บคิดจากตัวเลขนี้</span>}
          </div>
        </>
      ) : (
        <p className="muted" style={{ marginTop: 12 }}>
          {loaded && (Number(weapon.weaponAtk) || Number(weapon.statusAtk))
            ? `ข้อมูลของ${monsterName}ไม่ครบ (DEF/เลเวล/ธาตุ/ขนาด) จึงคำนวณให้ไม่ได้`
            : 'กรอก ATK แล้วตัวเลขจะขึ้นตรงนี้'}
        </p>
      )}
    </div>
  );
}
