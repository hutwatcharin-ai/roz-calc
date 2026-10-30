'use client';

// จัดเซ็ตบอท: one map, the built-in bot's settings tab by tab, and what a run
// would come to (owner, 19 Oct 2026). The overnight lists say where to go;
// this says how to set the bot up there, and lets the player try changes.
//
// Every number comes from lib/farm-engine/bot-session. The suggestions are
// rules on that run, each with its reason on the page, never a guess:
//   - tick: the set bestTargets finds worth the most EXP over the night
//   - teleport on damage: just above the hardest hit any ticked monster
//     lands, so the bot never flees what it came to kill but does flee
//     anything stronger
//   - teleport on crowd: when unticked monsters follow, at the crowd the
//     run would otherwise reach
//   - potions: enough for the night at the rate the run drinks them

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import FarmNumbersBar from './FarmNumbersBar';
import MapPicker from './MapPicker';
import FeedbackButton from '@/components/FeedbackButton';
import { useRememberedNumbers } from '@/components/ToolNumbers';
import { useFarmData } from '@/lib/use-farm-data';
import { useBotStyle } from '@/lib/use-bot-style';
import { useBotSettings } from '@/lib/use-bot-settings';
import { farmedOn, metOn, playerFromNumbers } from '@/lib/farm-engine/basics';
import { MAX_RUN_HOURS, bestTargets, botRun, hardestHit, type BotRun, type BotSettings } from '@/lib/farm-engine/bot-session';
import { canSurvive, playerDefense, survivalContext } from '@/lib/farm-engine/survival';
import { NIGHT_HOURS, type FarmData } from '@/lib/farm-engine/types';
import { potionRange, small, whole } from './card-helpers';

const STOP: Record<BotRun['stop'], string> = {
  hp: 'ยาหมด เลือดไม่พอ',
  weight: 'กระเป๋าถึงน้ำหนักที่ตั้ง',
  none: '',
};

const DANGER: Record<string, string> = {
  one_shot: 'ตีทีเดียวเกินเลือดเต็มหลอด',
  burst: 'สู้ตัวเดียวเลือดหายเกินหลอด',
  followers: 'มอนโจมตีก่อนที่ไม่ได้ติ๊กจะเข้ามาตีบอทไม่หยุด บอทไม่ตีมันและไม่ได้ตั้งวาร์ปหนี',
  unknown_atk: 'ไม่มีค่า ATK คิดไม่ได้',
  interrupted: 'ตีขัดร่ายจนแทบร่ายไม่ออก',
};

function mapOptions(data: FarmData) {
  // One entry per map name+code; channel copies stay separate (different maps in game).
  return data.maps
    .filter((m) => farmedOn(m, data.monsters).length > 0)
    .map((m) => ({ code: m.code, name: m.name, image: m.image }))
    .sort((a, b) => `${a.name} (${a.code})`.localeCompare(`${b.name} (${b.code})`));
}

export default function BotSetup({ initialMap, initialTick }: { initialMap: string | null; initialTick: number[] | null }) {
  const farm = useFarmData();
  const [numbers, setNumbers] = useRememberedNumbers();
  const [style, setStyle] = useBotStyle();
  const [bot, setBot] = useBotSettings();
  const [code, setCode] = useState<string | null>(initialMap);
  const [tick, setTick] = useState<number[] | null>(initialTick);
  const player = useMemo(() => playerFromNumbers(numbers, style), [numbers, style]);
  const data = farm.data;
  const map = data?.maps.find((m) => m.code === code) ?? null;

  useEffect(() => {
    const url = new URL(window.location.href);
    if (code) url.searchParams.set('map', code);
    else url.searchParams.delete('map');
    if (tick && tick.length) url.searchParams.set('tick', tick.join(','));
    else url.searchParams.delete('tick');
    window.history.replaceState(null, '', url.toString());
  }, [code, tick]);

  const ctx = useMemo(() => (data ? survivalContext(data) : null), [data]);
  const ready = canSurvive(player);
  const recommended = useMemo(() => {
    if (!data || !map || !ctx || !ready) return null;
    return bestTargets(map, data, player, bot, ctx, NIGHT_HOURS, (r) => r.exp, undefined, (m) => (m.baseExp ?? 0) > 0);
  }, [data, map, ctx, ready, player, bot]);
  const targets = tick ?? recommended?.best?.targets ?? null;
  const run = useMemo(() => {
    if (!data || !map || !ctx || !ready || !targets || targets.length === 0) return null;
    return botRun(map, data, player, bot, targets, ctx, NIGHT_HOURS);
  }, [data, map, ctx, ready, targets, player, bot]);

  return (
    <>
      <FarmNumbersBar
        style={style}
        onStyle={setStyle}
        numbers={numbers}
        onNumbers={setNumbers}
        hints={ready ? [] : ['ดาเมจ + ความเร็ว + FLEE + Max HP → ผลของบอทรอบนี้']}
        potions={data?.potions ?? []}
        overnight
        bot={bot}
        onBot={setBot}
      />

      {farm.failed && (
        <div className="card farm-state">
          <p>ดึงข้อมูลแมพกับมอนไม่สำเร็จ</p>
          <button type="button" className="btn" onClick={farm.retry}>
            ลองโหลดอีกครั้ง
          </button>
        </div>
      )}
      {!data && !farm.failed && <p className="muted farm-state">กำลังโหลดแมพกับมอน…</p>}

      {data && (
        <section className="farm-section botsetup" aria-labelledby="bot-map">
          <h2 id="bot-map" className="section-title">
            1. เลือกแมพ
          </h2>
          <div className="botsetup__map">
            <MapPicker
              label="แมพที่จะทิ้งบอท"
              options={mapOptions(data)}
              value={code}
              onChange={(next) => {
                setCode(next);
                setTick(null);
              }}
            />
          </div>
          {!code && (
            <p className="muted">
              ยังไม่รู้จะไปแมพไหน ดูอันดับที่ <Link href="/tools/leveling-spots?mode=afk">ฟาร์มที่ไหนดี โหมดทิ้งบอท</Link> แล้วกด &ldquo;ดูค่าเซ็ตบอทแมพนี้&rdquo;
            </p>
          )}
        </section>
      )}

      {data && map && (
        <MonsterTicks
          data={data}
          code={map.code}
          targets={targets ?? []}
          recommended={recommended?.best?.targets ?? null}
          onChange={setTick}
        />
      )}

      {data && map && !ready && (
        <div className="card farm-state">
          <p>
            กรอก <strong>ดาเมจ, {style === 'magic' ? 'วินาทีต่อร่าย' : 'ASPD'}, FLEE และ Max HP</strong> ที่แถบด้านบนก่อน แล้วจะเห็นว่าบอทอยู่ได้กี่ชั่วโมง ได้เท่าไร
            และค่าที่ควรตั้ง
          </p>
        </div>
      )}

      {data && map && run && Result({ data, run })}
      {data && map && run && <Advice data={data} run={run} player={player} bot={bot} onBot={setBot} mapCode={map.code} />}

      {map && (
        <section className="farm-section">
          <p className="muted">ลองตั้งตามนี้แล้วผลไม่ตรง (อยู่ได้นานกว่า/สั้นกว่า ตาย หรือได้ EXP ต่างกันมาก) บอกได้ที่ปุ่มนี้ จะเอาไปปรับสูตร</p>
          <FeedbackButton pageType="bot-setup" entityId={`${map.code}:${(targets ?? []).join(',')}`} />
        </section>
      )}
    </>
  );

  function Result({ data, run }: { data: FarmData; run: BotRun }) {
    const fatal = run.dangers.length > 0;
    return (
      <section className="farm-section botsetup" aria-labelledby="bot-result">
        <h2 id="bot-result" className="section-title">
          3. ผลที่คาด
        </h2>
        {fatal ? (
          <div className="card botsetup__fatal">
            <p>
              <strong>ตั้งแบบนี้บอทไม่รอด</strong>
            </p>
            <ul>
              {run.dangers.map((d) => (
                <li key={d.kind + d.id}>
                  {d.name}: {DANGER[d.kind]}
                  {d.damage ? ` (ราว ${whole(d.damage)})` : ''}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <dl className="botsetup__grid">
            <div className="botsetup__big">
              <dt>บอทอยู่ได้</dt>
              <dd>
                {run.stop === 'none' ? `${MAX_RUN_HOURS}+ ชม.` : `${run.hours.toFixed(1)} ชม.`}
                {run.stop !== 'none' && <small> แล้วกลับเมืองเพราะ{STOP[run.stop]}</small>}
              </dd>
            </div>
            <div>
              <dt>EXP</dt>
              <dd>
                {whole(run.expPerHour)}/ชม. · {run.hours < NIGHT_HOURS ? `ทั้งรอบ` : `ทั้งคืน ${NIGHT_HOURS} ชม.`} {whole(run.exp)}
              </dd>
            </div>
            <div>
              <dt>เงิน (หักค่ายา{bot.creamy ? '' : ' ค่าปีก'})</dt>
              <dd>
                {whole(run.zenyPerHour)}z/ชม. · รวม {whole(run.zeny)}z
              </dd>
            </div>
            <div>
              <dt>ฆ่าได้</dt>
              <dd>{whole(run.killsPerHour)} ตัว/ชม.</dd>
            </div>
            <div>
              <dt>หามอนตัวต่อไป (รวมวาร์ป)</dt>
              <dd>{run.searchSeconds.toFixed(1)} วิ</dd>
            </div>
            <div>
              <dt>ยา</dt>
              <dd>
                {run.potionsPerHourHigh > 0 ? `${potionRange(run)} ขวด/ชม.` : 'ไม่ต้องใช้ (เลือดฟื้นเองทัน)'}
                {run.potionsCarried !== null && run.potionsPerHourHigh > 0 ? ` · ถือไป ${whole(run.potionsCarried)} ขวด` : ''}
                {run.potionsPerHourHigh > run.potionsPerHour && (
                  <small> ค่าน้อย = ดวงปกติ · ค่ามาก = เผื่อชั่วโมงที่ดวงไม่ดี โดนตีเข้าติดกัน และวาร์ปหนีไม่ทัน · ชั่วโมงที่บอทอยู่ได้คิดจากค่ามาก</small>
                )}
              </dd>
            </div>
            {run.potionsPerHourHigh > 0 && (
              <div className="botsetup__wide">
                <dt>เลือดหายต่อชั่วโมงมาจาก</dt>
                <dd>
                  มอนที่ติ๊ก (ตีธรรมดา) {whole(run.hurtPerHour.targets)} · มอนอื่นมารุมตอนสู้ {whole(run.hurtPerHour.crowd)} · สกิลมอน{' '}
                  {whole(run.hurtPerHour.skills)}
                  <small>
                    {' '}
                    เผื่อเพิ่มในค่ามาก: วาร์ปหนีไม่ทัน {whole(run.hurtPerHour.teleportHits)} · ดวงไม่ดี โดนตีเข้าติดกันหลายที {whole(run.hurtPerHour.badLuck)}
                  </small>
                </dd>
              </div>
            )}
            <div>
              <dt>วาร์ป</dt>
              <dd>
                {whole(run.teleportsPerHour)} ครั้ง/ชม.
                {bot.creamy && run.spShortPerHour > 0 && <small> SP ไม่พอ ขาดราว {whole(run.spShortPerHour)}/ชม.</small>}
                {!bot.creamy && run.wingCostPerHour > 0 && <small> ค่า Fly Wing {whole(run.wingCostPerHour)}z/ชม.</small>}
              </dd>
            </div>
            {Number.isFinite(run.lootHours) && (
              <div>
                <dt>กระเป๋าถึง {bot.stopWeightPct}%</dt>
                <dd>ใน {run.lootHours.toFixed(1)} ชม.</dd>
              </div>
            )}
            {run.followers.length > 0 && (
              <div className="botsetup__warn">
                <dt>ไม่ได้ติ๊ก แต่จะเข้ามาตีบอท</dt>
                <dd>
                  {run.followers.map((f) => f.name).join(', ')} ·{' '}
                  {run.avgFollowers >= 0.05 ? `บอทไม่ตีมัน โดนมันรุมตีอยู่เฉลี่ย ${run.avgFollowers.toFixed(1)} ตัว จนกว่าจะวาร์ป` : 'ตีแรงกว่าค่าวาร์ปที่ตั้ง เจอเมื่อไรบอทวาร์ปหนีทันที ส่วนใหญ่ไม่โดนดาเมจ แค่เสียเวลา (ค่ายามากเผื่อวาร์ปไม่ทันไว้แล้ว)'}
                </dd>
              </div>
            )}
          </dl>
        )}
        <p className="muted botsetup__note">
          คิดจากสูตร ความเร็วตี และสกิลของมอนจาก rAthena (ยังไม่ได้วัดใน Zero) · ยาเป็นช่วง: ดวงปกติ ถึงเผื่อดวงไม่ดีและวาร์ปหนีไม่ทัน 1 ใน 5 ครั้ง (ประมาณ) · ไม่คิดบอสที่เดินผ่าน · เวลาหามอนไม่รวมกำแพงกับคนแย่งมอน
          · {data.potions.length > 0 ? 'ยาฟื้นตามข้อความในเกม × (100 + VIT×2)%' : ''}
        </p>
      </section>
    );
  }
}

function MonsterTicks({
  data,
  code,
  targets,
  recommended,
  onChange,
}: {
  data: FarmData;
  code: string;
  targets: number[];
  recommended: number[] | null;
  onChange: (next: number[]) => void;
}) {
  const map = data.maps.find((m) => m.code === code)!;
  const farmed = farmedOn(map, data.monsters);
  const bosses = metOn(map, data.monsters).filter((row) => row.m.isMvp || row.m.solo);
  const same = recommended && recommended.length === targets.length && recommended.every((id) => targets.includes(id));
  return (
    <section className="farm-section botsetup" aria-labelledby="bot-ticks">
      <h2 id="bot-ticks" className="section-title">
        2. แท็บมอนสเตอร์: ติ๊กตัวไหน
      </h2>
      <p className="muted">
        {recommended
          ? same
            ? 'ติ๊กไว้ตามที่แนะนำ: ชุดที่ได้ EXP มากสุดทั้งคืนโดยบอทยังรอด'
            : 'คุณเปลี่ยนจากชุดที่แนะนำ'
          : 'ติ๊กมอนที่จะให้บอทล่า'}
        {recommended && !same && (
          <>
            {' '}
            ·{' '}
            <button type="button" className="linkbtn" onClick={() => onChange(recommended)}>
              กลับไปใช้ชุดที่แนะนำ
            </button>
          </>
        )}
      </p>
      <ul className="botsetup__ticks">
        {farmed
          .slice()
          .sort((a, b) => b.amount - a.amount)
          .map((row) => {
            const on = targets.includes(row.m.id);
            const aggressive = row.m.isAggressive !== false && row.m.attackDelay !== 0;
            return (
              <li key={row.m.id} className={on ? 'is-on' : undefined}>
                <label>
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={(e) => onChange(e.target.checked ? [...targets, row.m.id] : targets.filter((id) => id !== row.m.id))}
                  />
                  {row.m.sprite && <img src={row.m.sprite} alt="" loading="lazy" />}
                  <span className="botsetup__mon">
                    <strong>{row.m.name}</strong>
                    <small>
                      Lv {row.m.level ?? '?'} · {row.amount} ตัว · {whole(row.m.baseExp ?? 0)} EXP
                      {row.m.attackDelay === 0 ? ' · ไม่ตีคน' : aggressive ? ' · โจมตีก่อน' : ''}
                    </small>
                  </span>
                  {!on && aggressive && <span className="tag tag--risk" title="มอนโจมตีก่อนที่ไม่ได้ติ๊ก บอทจะไม่ตีมัน แต่มันจะเข้ามาตีบอทจนกว่าบอทจะวาร์ปหนี">ไม่ติ๊ก = มันมาตีบอท</span>}
                </label>
              </li>
            );
          })}
      </ul>
      {bosses.length > 0 && (
        <p className="muted">
          มีบอสเดินอยู่: {[...new Set(bosses.map((r) => r.m.name))].join(', ')} — ไม่ได้คิดในผล ถ้ากลัวเจอ ติ๊ก &ldquo;ใช้ Teleport เมื่อมี MVP บอสปรากฏ&rdquo; ในแท็บพื้นฐาน
        </p>
      )}
    </section>
  );
}

function Advice({
  data,
  run,
  player,
  bot,
  onBot,
  mapCode,
}: {
  data: FarmData;
  run: BotRun;
  player: ReturnType<typeof playerFromNumbers>;
  bot: BotSettings;
  onBot: (next: BotSettings) => void;
  mapCode: string;
}) {
  const map = data.maps.find((m) => m.code === mapCode)!;
  const def = playerDefense(player);
  // The hardest hit any ticked monster can land, after DEF, its skills
  // included: a limit under a ticked monster's skill sends the bot away from
  // the monster it came to hunt each time the skill lands.
  const ctx = survivalContext(data);
  const hits = farmedOn(map, data.monsters)
    .filter((row) => run.targets.includes(row.m.id))
    .map((row) => hardestHit(row.m, def, ctx.attackDelay));
  const normalTop = Math.max(0, ...hits.map((h) => h.normal));
  const skillTop = Math.max(0, ...hits.map((h) => h.skill));
  const hardest = Math.max(normalTop, skillTop);
  const fleeAbove = Math.ceil((hardest + 1) / 10) * 10;
  const night = Math.ceil(run.potionsPerHourHigh * NIGHT_HOURS);
  // apply: the settings change that makes the run above use this advice.
  const items: { tab: string; text: string; why: string; apply?: Partial<BotSettings> }[] = [];
  items.push({
    tab: 'พื้นฐาน',
    text: `ใช้ Teleport เมื่อได้รับ Damage มากกว่า ${whole(fleeAbove)}`,
    why: `มอนที่ติ๊กตีแรงสุดราว ${whole(hardest)} ต่อที${skillTop > normalTop ? ` (ตีธรรมดา ${whole(normalTop)} · สกิลมอน ${whole(skillTop)})` : ''} ตั้งเกินนี้นิดเดียว บอทจะไม่หนีมอนที่มาล่า แต่หนีตัวที่แรงกว่า (บอส มอนแชมเปียน มอนที่ไม่ได้ติ๊ก)`,
    apply: { teleportOnDamage: fleeAbove },
  });
  // Only followers that stay on the bot: the ones past the damage limit are
  // already shaken off by the damage teleport.
  if (run.avgFollowers >= 0.05) {
    const n = Math.max(3, Math.ceil(run.avgFollowers + 2));
    items.push({
      tab: 'พื้นฐาน',
      text: `ใช้ Teleport เมื่อมีมอนสเตอร์ ${n} ตัวขึ้นไปโจมตี`,
      why: `${run.followers.map((f) => f.name).join(', ')} เป็นมอนโจมตีก่อนที่ไม่ได้ติ๊ก บอทจะไม่ตีมัน แต่มันจะเข้ามาตีบอท ยิ่งนานยิ่งมาหลายตัว ตั้งค่านี้ให้บอทวาร์ปหนีเมื่อโดนรุม`,
      apply: { teleportOnMobs: n },
    });
  }
  if (bot.idleTeleport === null) {
    items.push({ tab: 'พื้นฐาน', text: 'ใช้ Teleport หากไม่มีการต่อสู้ภายใน 5 วินาที', why: 'มอนที่ติ๊กอยู่ไกล วาร์ปหาใหม่เร็วกว่าเดินไป', apply: { idleTeleport: 5 } });
  }
  // The Movement tab is where the bot is told what to teleport with
  // (docs/bot-settings/movement.jpg).
  items.push({
    tab: 'เคลื่อนที่',
    text: bot.creamy
      ? 'ตั้งค่าการใช้ Teleport: ติ๊ก "ใช่" ช่องสกิล แล้ววางสกิล Teleport (จาก Creamy Card)'
      : 'ตั้งค่าการใช้ Teleport: ติ๊ก "ใช่" ช่องไอเทม แล้ววาง Fly Wing',
    why: bot.creamy
      ? 'การวาร์ปทุกข้อในแท็บพื้นฐานใช้สิ่งที่วางในแท็บนี้ · Creamy วาร์ปได้ไม่จำกัด เสีย SP แทนปีก'
      : 'การวาร์ปทุกข้อในแท็บพื้นฐานใช้สิ่งที่วางในแท็บนี้ · ถือ Fly Wing ให้พอทั้งคืน',
  });
  items.push({
    tab: 'เคลื่อนที่',
    text: 'ตั้งค่าการกลับเมือง: วาง Butterfly Wing ในช่องไอเทม หรือสกิล Teleport Lv2 ในช่องสกิล',
    why: 'บอทใช้ช่องนี้กลับเมืองตอนยาหมด ไอเทมบัฟหมด หรือกระเป๋าถึงน้ำหนักที่ตั้ง · Creamy Card ให้แค่ Teleport Lv1 ใช้ช่องนี้ไม่ได้',
  });
  if (run.potionsPerHourHigh > 0) {
    const short = run.potionsCarried !== null && run.potionsCarried < night;
    items.push({
      tab: 'Potion',
      text: short
        ? `ถือยาเต็มเท่าที่ถือได้ (ราว ${whole(run.potionsCarried as number)} ขวด) บอทอยู่ได้ราว ${run.hours.toFixed(1)} ชม.`
        : `ใส่ยาที่เลือกไว้ ถือไปราว ${whole(night)} ขวดสำหรับ ${NIGHT_HOURS} ชม.`,
      why: short
        ? `อยู่ครบ ${NIGHT_HOURS} ชม. ต้องใช้ราว ${whole(night)} ขวด เกินน้ำหนักที่ถือได้ ลองยาที่ฟื้นเยอะกว่า เพิ่ม DEF/FLEE หรือเลือกแมพที่เบากว่า · บอทใช้ราว ${potionRange(run)} ขวด/ชม. คิดจากค่ามาก`
        : `บอทใช้ราว ${potionRange(run)} ขวด/ชม. คิดจำนวนที่ถือจากค่ามาก เผื่อชั่วโมงที่ดวงไม่ดีและวาร์ปหนีไม่ทัน`,
    });
  }
  if (Number.isFinite(run.lootHours) && run.lootHours < NIGHT_HOURS) {
    items.push({
      tab: 'เก็บไอเทม',
      text: 'ติ๊ก "จะล่าต่อโดยไม่เก็บไอเทมเมื่อน้ำหนักเกินค่าที่ตั้งไว้"',
      why: `กระเป๋าจะถึง ${bot.stopWeightPct}% ในราว ${run.lootHours.toFixed(1)} ชม. ถ้าไม่ติ๊ก บอทกลับเมืองแล้วจบรอบ เสีย EXP ที่เหลือ`,
      apply: bot.keepHunting ? undefined : { keepHunting: true },
    });
  }
  if (bot.creamy && run.spShortPerHour > 0) {
    items.push({
      tab: 'Potion',
      text: 'ใส่ของฟื้น SP ในช่อง SP',
      why: `วาร์ปด้วย Creamy ใช้ SP มากกว่าที่ฟื้นเองราว ${whole(run.spShortPerHour)} ต่อชั่วโมง`,
    });
  }
  return (
    <section className="farm-section botsetup" aria-labelledby="bot-advice">
      <h2 id="bot-advice" className="section-title">
        4. ค่าที่แนะนำให้ตั้ง
      </h2>
      <ol className="botsetup__advice">
        {items.map((it) => {
          const applied = it.apply && Object.entries(it.apply).every(([k, v]) => bot[k as keyof BotSettings] === v);
          return (
            <li key={it.text}>
              <span className="botsetup__tab">แท็บ{it.tab}</span>
              <strong>{it.text}</strong>
              <small>{it.why}</small>
              {it.apply &&
                (applied ? (
                  <span className="botsetup__applied">✓ ผลข้อ 3 คิดค่านี้แล้ว</span>
                ) : (
                  <button type="button" className="btn botsetup__apply" onClick={() => onBot({ ...bot, ...it.apply })}>
                    ลองใช้ค่านี้ในผลข้อ 3
                  </button>
                ))}
            </li>
          );
        })}
      </ol>
      <p className="muted botsetup__note">
        เปลี่ยนค่าในแถบด้านบนแล้วผลข้อ 3 เปลี่ยนตามทันที · ไม่ได้แนะนำแท็บสกิล เพราะแต่ละอาชีพต่างกัน ความแรงของเราคิดจากช่อง &ldquo;ดาเมจ&rdquo; ที่กรอกไว้ด้านบน
      </p>
    </section>
  );
}
