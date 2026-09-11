'use client';

// The fourth mode of /tools/leveling-spots: where to leave the bot all night
// for zeny, selling what the monsters drop. It was its own draft page
// (/tools/zeny-farm) until the owner asked whether it overlapped this tool --
// it did: the same numbers, the same AFK dodge rule, the same map list -- so it
// moved in (11 Sep 2026). The tab stays hidden until the owner publishes it;
// only ?mode=zeny shows it. The arithmetic is lib/zeny-farm.ts.

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import Caveat from '@/components/Caveat';
import ItemIcon from '@/components/ItemIcon';
import ToolNumbers, { useRememberedNumbers } from '@/components/ToolNumbers';
import { useToolUse } from '@/lib/use-tool-use';
import { attacksPerSecond, castsPerSecond, type PlayerField } from '@/lib/player-numbers';
import { KILL_RATE_DISCLAIMER } from '@/lib/kills-per-hour';
import { DODGE_CAP_RELAXED, DODGE_CAP_STRICT, type AfkStyle } from '@/lib/afk-safety';
import {
  NIGHT_HOURS,
  STEADY_DROPS_PER_NIGHT,
  rankZenyMaps,
  topEarners,
  type ScoredMap,
  type ZenyData,
  type ZenyMonster,
  type ZenyPlayer,
} from '@/lib/zeny-farm';

const PODIUM = 3;
const MAPS_OPEN = 10;
const MAPS_SHOWN = 40;
const MONSTERS_OPEN = 12;
const MONSTERS_SHOWN = 60;
const BLOCKED_SHOWN = 12;

// Shared with the AFK mode: a player who told one mode they cast spells has
// told both.
const STYLE_KEY = 'roz-calc:afk-style';
const FIELDS: Record<AfkStyle, PlayerField[]> = {
  melee: ['damagePerHit', 'aspd', 'hit', 'flee'],
  magic: ['damagePerHit', 'castSeconds', 'flee'],
};

const whole = (n: number) => Math.round(n).toLocaleString('en-US');
/** Small amounts keep a decimal so 0.4z does not read as nothing. */
const zeny = (n: number) => (n >= 100 ? whole(n) : n.toFixed(1));

function useBotStyle(): [AfkStyle, (s: AfkStyle) => void] {
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

function MapCard({
  map,
  rank,
  big,
  monsters,
  personal,
}: {
  map: ScoredMap;
  rank: number;
  big?: boolean;
  monsters: Record<number, ZenyMonster>;
  personal: boolean;
}) {
  const href = `/database/maps/${encodeURIComponent(map.code)}`;
  return (
    <li className={`zfmap${big ? ' zfmap--big' : ''}`}>
      {/* The picture repeats the name link beside it, so it is hidden from
          the keyboard and screen readers rather than announced twice. */}
      <Link href={href} className="zfmap__pic" tabIndex={-1} aria-hidden="true">
        {map.image ? (
          <img src={map.image} alt="" loading={rank === 1 ? 'eager' : 'lazy'} decoding="async" />
        ) : (
          <span className="zfmap__nopic">ไม่มีรูปแมพ</span>
        )}
        {big && <span className="zfmap__badge">#{rank}</span>}
      </Link>
      <div className="zfmap__body">
        <div className="zfmap__head">
          {!big && <span className="zfmap__num">#{rank}</span>}
          <Link href={href} className="zfmap__name">
            {map.name}
          </Link>
        </div>
        <div className="zfmap__code">
          {map.code}
          {map.channels > 1 && ` · ${map.channels} ช่อง`}
        </div>
        {/* No "≈" inside a number: the mono face draws it as a rupee sign.
            "ราว" in the label says the same thing in the label's own font. */}
        <dl className="zfmap__stats">
          {personal && map.zenyPerHour !== null ? (
            <>
              <div className="zfmap__rate">
                <dt>ได้ราว</dt>
                <dd className="zf-money">
                  {whole(map.zenyPerHour)}z<span className="zf-unit">/ชม.</span>
                </dd>
              </div>
              <div>
                <dt>ทั้งคืน {NIGHT_HOURS} ชม. ราว</dt>
                <dd>{whole(map.zenyPerHour * NIGHT_HOURS)}z</dd>
              </div>
            </>
          ) : (
            <div>
              <dt>เฉลี่ยตัวละ</dt>
              <dd className="zf-money">{zeny(map.avgPerKill)}z</dd>
            </div>
          )}
          <div>
            <dt>มอน</dt>
            <dd>
              {map.mobs}
              <span className="zf-unit"> ตัว</span>
            </dd>
          </div>
        </dl>
        <ul className="zfmob" aria-label="ตัวที่ทำเงินให้มากสุดในแมพ">
          {map.top.map((row) => {
            const monster = monsters[row.id];
            return (
              <li key={row.id}>
                <Link href={`/database/monsters/${row.id}`}>
                  {monster?.sprite && <img src={monster.sprite} alt="" loading="lazy" decoding="async" />}
                  <span className="zfmob__name">{monster?.name ?? `#${row.id}`}</span>
                  <span className="zfmob__z">
                    {zeny(row.perKill)}z ×{row.amount}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </li>
  );
}

function MonsterTile({ monster }: { monster: ZenyMonster }) {
  return (
    <li className="zfmon">
      <Link href={`/database/monsters/${monster.id}`}>
        {monster.sprite ? (
          <img className="zfmon__sprite" src={monster.sprite} alt="" loading="lazy" decoding="async" />
        ) : (
          <span className="zfmon__sprite" aria-hidden="true" />
        )}
        <span className="zfmon__body">
          <span className="zfmon__name">
            {monster.name}
            {monster.level != null && <span className="zfmon__lv"> Lv {monster.level}</span>}
          </span>
          <span className="zfmon__zeny">
            <small>เฉลี่ยตัวละ</small>
            {zeny(monster.perKill)}z
          </span>
          {monster.best && (
            <span className="zfmon__drop">
              <ItemIcon iconUrl={monster.best.icon} category={monster.best.category} size={20} />
              <span className="zfmon__dropname">
                {monster.best.name} ราว {zeny(monster.best.value)}z
              </span>
            </span>
          )}
        </span>
      </Link>
    </li>
  );
}

export default function ZenyFarm() {
  const [data, setData] = useState<ZenyData | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [numbers, setNumbers, ready] = useRememberedNumbers();
  const [style, setStyle] = useBotStyle();
  useToolUse(
    'leveling_spots',
    { mode: 'zeny', damage: numbers.damagePerHit, aspd: numbers.aspd, hit: numbers.hit, flee: numbers.flee },
    ready,
  );

  useEffect(() => {
    let live = true;
    setFailed(false);
    fetch('/tools/leveling-spots/zeny-data')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then((json: ZenyData) => {
        if (live) setData(json);
      })
      .catch((err) => {
        console.error('zeny data load failed', err);
        if (live) setFailed(true);
      });
    return () => {
      live = false;
    };
  }, [attempt]);

  const perSecond = style === 'magic' ? castsPerSecond(numbers.castSeconds) : attacksPerSecond(numbers.aspd);
  const complete =
    ready &&
    numbers.damagePerHit !== undefined &&
    perSecond !== null &&
    numbers.flee !== undefined &&
    (style === 'magic' || numbers.hit !== undefined);
  const player = useMemo<ZenyPlayer | null>(
    () =>
      complete
        ? {
            style,
            damagePerHit: numbers.damagePerHit as number,
            perSecond: perSecond as number,
            hit: style === 'magic' ? null : numbers.hit ?? null,
            flee: numbers.flee as number,
          }
        : null,
    [complete, style, numbers.damagePerHit, perSecond, numbers.hit, numbers.flee],
  );
  const result = useMemo(() => (data ? rankZenyMaps(data, player) : null), [data, player]);
  const earners = useMemo(() => (data ? topEarners(data, MONSTERS_SHOWN) : []), [data]);
  const personal = player !== null;
  const ranked = result?.ranked.slice(0, MAPS_SHOWN) ?? [];
  const blocked = result?.blocked ?? [];
  const fieldWords = style === 'magic' ? 'ดาเมจ วินาทีต่อร่าย FLEE' : 'ดาเมจ ASPD HIT FLEE';

  return (
    <>
      <div className="filterbar" style={{ marginBottom: 8 }} role="radiogroup" aria-label="สายตี หรือ สายเวท">
        <label className="cvtoggle">
          <input type="radio" name="zeny-style" checked={style === 'melee'} onChange={() => setStyle('melee')} />
          สายตี (ตีธรรมดา)
        </label>
        <label className="cvtoggle">
          <input type="radio" name="zeny-style" checked={style === 'magic'} onChange={() => setStyle('magic')} />
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
                damagePerHit: { label: 'ดาเมจต่อร่าย', hint: 'เช่น 900', unlocks: 'z/ชม.' },
                castSeconds: { unlocks: 'z/ชม.' },
                flee: { unlocks: 'ตัดแมพที่หลบไม่พ้น' },
              }
            : {
                damagePerHit: { label: 'ดาเมจต่อที', hint: 'เช่น 400', unlocks: 'z/ชม.' },
                aspd: { unlocks: 'z/ชม.' },
                flee: { unlocks: 'ตัดแมพที่หลบไม่พ้น' },
              }
        }
        note={`ไม่กรอกก็ดูได้ · กรอก${fieldWords}ครบ แล้วจะได้ z/ชม. ของคุณ และตัดแมพที่มีมอนตีคุณโดนบ่อยออก`}
      />

      {failed && (
        <div className="card zf-state">
          <p>ดึงข้อมูลแมพไม่สำเร็จ ค่าที่กรอกไว้ยังอยู่ครบ</p>
          <button type="button" className="btn" onClick={() => setAttempt((n) => n + 1)}>
            ลองโหลดอีกครั้ง
          </button>
        </div>
      )}
      {!failed && !result && <p className="muted zf-state">กำลังโหลดแมพกับของที่ดรอป…</p>}

      {result && data && (
        <>
          <p className="zf-summary">
            {personal ? (
              <>
                ปล่อยบอทได้ทั้งคืน <strong>{result.ranked.length}</strong> แมพ · ตัดออก <strong>{blocked.length}</strong> แมพ
                เพราะมีมอนที่คุณหลบไม่พ้น
              </>
            ) : (
              <>
                เรียงตามเงินที่มอนในแมพดรอป · <strong>กรอก{fieldWords}ข้างบน</strong> แล้วจะได้ z/ชม. ของคุณเอง
              </>
            )}
            <span className="zf-summary__rule">
              {' '}
              · ไม่นับ MVP {data.excluded.mvp} ตัว และมอนที่เกิดทีละตัว {data.excluded.solo} ตัว
            </span>
          </p>

          {personal && blocked.length > 0 && (
            <details className="zf-more">
              <summary>ดูแมพที่ถูกตัด และมอนตัวที่หลบไม่พ้น</summary>
              <ul className="zf-blocked">
                {blocked.slice(0, BLOCKED_SHOWN).map((map) => (
                  <li key={map.code}>
                    <Link href={`/database/maps/${encodeURIComponent(map.code)}`}>{map.name}</Link>
                    <span className="zfmap__code"> {map.code}</span>
                    <span className="zf-blocked__why">
                      {(map.blockers ?? [])
                        .slice(0, 3)
                        .map((b) => (b.reason === 'dodge' ? `${b.name} ตีคุณโดน ${b.theirHitPct}%` : `${b.name} ไม่มีค่า FLEE`))
                        .join(' · ')}
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          )}

          {ranked.length === 0 ? (
            <div className="card zf-state">
              <p>
                ไม่มีแมพไหนที่หลบมอนได้ครบทุกตัวด้วย FLEE {numbers.flee} — ลองเช็คค่า FLEE ที่กรอก หรือเปิดดูแมพที่ถูกตัดข้างบน
                ว่าติดมอนตัวไหน
              </p>
            </div>
          ) : (
            <>
              <section className="zf-section" aria-labelledby="zf-podium">
                <h2 id="zf-podium" className="section-title">
                  {Math.min(PODIUM, ranked.length)} แมพที่คุ้มสุด
                </h2>
                <ol className="zf-podium">
                  {ranked.slice(0, PODIUM).map((map, i) => (
                    <MapCard key={map.code} map={map} rank={i + 1} big monsters={data.monsters} personal={personal} />
                  ))}
                </ol>
              </section>

              {ranked.length > PODIUM && (
                <section className="zf-section" aria-labelledby="zf-maps">
                  <h2 id="zf-maps" className="section-title">
                    อันดับ {PODIUM + 1}–{Math.min(MAPS_OPEN, ranked.length)}
                  </h2>
                  <ol className="zf-maplist">
                    {ranked.slice(PODIUM, MAPS_OPEN).map((map, i) => (
                      <MapCard key={map.code} map={map} rank={PODIUM + i + 1} monsters={data.monsters} personal={personal} />
                    ))}
                  </ol>
                  {ranked.length > MAPS_OPEN && (
                    <details className="zf-more">
                      <summary>
                        ดูอันดับ {MAPS_OPEN + 1}–{ranked.length}
                      </summary>
                      <ol className="zf-maplist">
                        {ranked.slice(MAPS_OPEN).map((map, i) => (
                          <MapCard key={map.code} map={map} rank={MAPS_OPEN + i + 1} monsters={data.monsters} personal={personal} />
                        ))}
                      </ol>
                    </details>
                  )}
                </section>
              )}
            </>
          )}

          <section className="zf-section" aria-labelledby="zf-monsters">
            <h2 id="zf-monsters" className="section-title">
              ฆ่า 1 ตัว ได้เงินเฉลี่ยเท่าไร
            </h2>
            <p className="zf-section__note">เก็บของที่ดรอปทุกชิ้นไปขายร้าน NPC · ไม่นับ MVP และมอนที่เกิดทีละตัว</p>
            <ul className="zf-mongrid">
              {earners.slice(0, MONSTERS_OPEN).map((monster) => (
                <MonsterTile key={monster.id} monster={monster} />
              ))}
            </ul>
            {earners.length > MONSTERS_OPEN && (
              <details className="zf-more">
                <summary>ดูอีก {earners.length - MONSTERS_OPEN} ตัว</summary>
                <ul className="zf-mongrid">
                  {earners.slice(MONSTERS_OPEN).map((monster) => (
                    <MonsterTile key={monster.id} monster={monster} />
                  ))}
                </ul>
              </details>
            )}
          </section>

          <Caveat label="คิดยังไง และข้อจำกัดของตัวเลข">
            <p>
              <strong>ไม่กรอกเลข:</strong> เรียงตามมูลค่าของที่ดรอปต่อ HP ของมอน คูณจำนวนตัว (ตายเร็ว + ของแพง + มีเยอะ = อันดับดี) ·
              &ldquo;เฉลี่ยตัวละ&rdquo; คือเงินจากของที่ดรอปต่อการฆ่า 1 ตัว ถ่วงตามจำนวนแต่ละชนิดในแมพ
            </p>
            <p>
              <strong>กรอกเลขแล้ว:</strong> z/ชม. = เงินเฉลี่ยต่อตัว ÷ เวลาฆ่าเฉลี่ยต่อตัว โดยคิดว่าบอทตีมอนที่เจอตามสัดส่วนจำนวนตัวในแมพ ·
              นับเฉพาะของที่ทั้งคืน {NIGHT_HOURS} ชม. น่าจะดรอปอย่างน้อย {STEADY_DROPS_PER_NIGHT} ครั้ง ของดวงไม่นับ · แมพถูกตัดเมื่อมีมอนชนิดไหนก็ได้
              ตีคุณโดนเกิน {DODGE_CAP_RELAXED}% (มอนโจมตีก่อน แมพที่มีมอนโจมตีก่อน หรือสายเวท: เกิน {DODGE_CAP_STRICT}%) หรือไม่มีค่า FLEE ของมอน ·
              z/ชม. เป็น{KILL_RATE_DISCLAIMER}
            </p>
            <p>
              ตัวเลขเป็นอย่างน้อยที่สุด: ไอเทมมีราคาขาย {data.coverage.pricedItems.toLocaleString('en-US')} จาก{' '}
              {data.coverage.totalItems.toLocaleString('en-US')} ชิ้น ดรอปมีอัตรา {data.coverage.ratedDrops.toLocaleString('en-US')} จาก{' '}
              {data.coverage.totalDrops.toLocaleString('en-US')} แถว ของที่ไม่รู้ราคาถูกนับเป็นศูนย์ · ไม่รวมแมพ WoE ห้องสมบัติ ปราสาท และ Memorial
              Dungeon · ดาเมจใช้ตามที่กรอก ไม่ได้คูณธาตุ · ไม่คิดน้ำหนักของ บอทต้องกลับไปขายเองเมื่อกระเป๋าเต็ม
            </p>
          </Caveat>
        </>
      )}
    </>
  );
}
