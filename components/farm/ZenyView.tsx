'use client';

// หาเงิน: where a bot collects zeny overnight and survives. Same gate and
// cards as the AFK mode; the figure is zeny from drops sold to an NPC, after
// the level drop factor, counting only drops a night would actually see.

import Link from 'next/link';
import { useMemo, useState } from 'react';
import Caveat from '@/components/Caveat';
import ItemIcon from '@/components/ItemIcon';
import RankedMaps from './RankedMaps';
import BlockedMaps from './BlockedMaps';
import { MapFilters } from './AfkView';
import { commonestBlocker, mapCardTags, mobsFigure, small, whole } from './card-helpers';
import type { ViewProps } from './LevelView';
import { rankMaps, type RankedMap } from '@/lib/farm-engine/rank';
import { topEarners } from '@/lib/farm-engine/plan';
import { canGate, canRate } from '@/lib/farm-engine/basics';
import { NIGHT_HOURS, STEADY_DROPS_PER_NIGHT } from '@/lib/farm-engine/types';
import { DODGE_CAP_RELAXED, DODGE_CAP_STRICT } from '@/lib/afk-safety';
import { KILL_RATE_DISCLAIMER } from '@/lib/kills-per-hour';

const EARNERS_OPEN = 12;
const EARNERS_SHOWN = 60;

export default function ZenyView({ data, player, level }: ViewProps) {
  const [cleanOnly, setCleanOnly] = useState(false);
  const [noRiskOnly, setNoRiskOnly] = useState(false);
  const { ranked, blocked } = useMemo(
    () => rankMaps(data, player, 'zeny', { level, cleanOnly, noRiskOnly }),
    [data, player, level, cleanOnly, noRiskOnly],
  );
  const earners = useMemo(() => topEarners(data, EARNERS_SHOWN, player.level), [data, player.level]);
  const rate = canRate(player);
  const gate = canGate(player);

  const toCard = (map: RankedMap) => ({
    code: map.code,
    name: map.name,
    image: map.image,
    channels: map.channels,
    headline:
      rate && map.perHour !== null
        ? { label: 'ได้ราว', value: `${whole(map.perHour)}z`, unit: '/ชม.' }
        : { label: 'เฉลี่ยตัวละ', value: `${small(map.avgPerKill)}z` },
    stats:
      rate && map.perHour !== null
        ? [{ label: `ทั้งคืน ${NIGHT_HOURS} ชม. ราว`, value: `${whole(map.perHour * NIGHT_HOURS)}z` }, mobsFigure(map)]
        : [mobsFigure(map)],
    monsters: map.top.map((t) => {
      const m = data.monsters[t.id];
      return { id: t.id, name: m.name, sprite: m.sprite, note: `${small(t.value)}z ×${t.amount}` };
    }),
    tags: mapCardTags(map),
  });

  const blocker = commonestBlocker(blocked);

  return (
    <>
      <p className="farm-summary">
        {gate ? (
          <>
            ปล่อยบอทได้ทั้งคืน <strong>{ranked.length}</strong> แมพ · ตัดออก <strong>{blocked.length}</strong> แมพ เพราะมีมอนที่คุณหลบไม่พ้น
          </>
        ) : (
          <>
            เรียงตามเงินที่มอนในแมพดรอป · <strong>กรอก FLEE</strong> แล้วจะตัดแมพที่หลบไม่พ้นออก
          </>
        )}
        {player.level === null && <> · ยังไม่ได้หักดรอปตามเลเวล (กรอกเลเวลด้านบน)</>}
        <span className="farm-summary__rule"> · ไม่นับ MVP {data.excluded.mvp} ตัว และมอนที่เกิดทีละตัว {data.excluded.solo} ตัว</span>
      </p>

      <MapFilters cleanOnly={cleanOnly} noRiskOnly={noRiskOnly} onClean={setCleanOnly} onNoRisk={setNoRiskOnly} />

      {ranked.length === 0 ? (
        <div className="card farm-state">
          <p>
            {gate && blocker
              ? `ไม่มีแมพไหนที่หลบได้ครบทุกตัวด้วย FLEE ${player.flee} — ติดบ่อยสุดที่ ${blocker} ลองเช็คค่า FLEE หรือเปิดดูแมพที่ถูกตัด`
              : 'ไม่มีแมพที่ผ่านตัวกรองที่ติ๊กไว้ ลองเอาติ๊กออก'}
          </p>
        </div>
      ) : (
        <RankedMaps maps={ranked} toCard={toCard} idPrefix="farm-zeny" podiumTitle="3 แมพหาเงินที่คุ้มสุด" />
      )}
      {gate && <BlockedMaps blocked={blocked} />}

      <section className="farm-section" aria-labelledby="farm-earners">
        <h2 id="farm-earners" className="section-title">
          ฆ่า 1 ตัว ได้เงินเฉลี่ยเท่าไร
        </h2>
        <p className="farm-section__note">เก็บของที่ดรอปทุกชิ้นไปขายร้าน NPC · ไม่นับ MVP และมอนที่เกิดทีละตัว</p>
        <ul className="farm-mongrid">
          {earners.slice(0, EARNERS_OPEN).map((e) => (
            <EarnerTile key={e.m.id} earner={e} />
          ))}
        </ul>
        {earners.length > EARNERS_OPEN && (
          <details className="farm-more">
            <summary>ดูอีก {earners.length - EARNERS_OPEN} ตัว</summary>
            <ul className="farm-mongrid">
              {earners.slice(EARNERS_OPEN).map((e) => (
                <EarnerTile key={e.m.id} earner={e} />
              ))}
            </ul>
          </details>
        )}
      </section>

      <Caveat label="คิดยังไง และข้อจำกัดของตัวเลข">
        <p>
          ไม่กรอกเลข: เรียงตามมูลค่าของที่ดรอปต่อ HP คูณจำนวนตัว · กรอกเลขแล้ว: z/ชม. = เงินเฉลี่ยต่อตัว ÷ เวลาฆ่าเฉลี่ยต่อตัว
          โดยบอทตีมอนที่เจอตามสัดส่วนจำนวนตัวในแมพ · นับเฉพาะของที่ทั้งคืน {NIGHT_HOURS} ชม. น่าจะดรอปอย่างน้อย {STEADY_DROPS_PER_NIGHT} ครั้ง ·
          ห่างจากเลเวลคุณเกิน 40 เลเวลดรอปหักครึ่ง ห่าง 20–40 ยังไม่มีใครยืนยัน จึงคิดเต็มพร้อมป้ายเตือน
        </p>
        <p>
          แมพถูกตัดเมื่อมีมอนชนิดไหนก็ได้ตีคุณโดนเกิน {DODGE_CAP_RELAXED}% (แมพมีมอนโจมตีก่อนหรือสายเวท: เกิน {DODGE_CAP_STRICT}%) หรือไม่มีค่า FLEE ของมอน ·
          z/ชม. เป็น{KILL_RATE_DISCLAIMER}
        </p>
        <p>
          ตัวเลขเป็นอย่างน้อยที่สุด: ไอเทมมีราคาขาย {data.coverage.pricedItems.toLocaleString('en-US')} จาก{' '}
          {data.coverage.totalItems.toLocaleString('en-US')} ชิ้น ดรอปมีอัตรา {data.coverage.ratedDrops.toLocaleString('en-US')} จาก{' '}
          {data.coverage.totalDrops.toLocaleString('en-US')} แถว · ไม่คิดน้ำหนักของ บอทต้องกลับไปขายเองเมื่อกระเป๋าเต็ม
        </p>
      </Caveat>
    </>
  );
}

function EarnerTile({ earner }: { earner: ReturnType<typeof topEarners>[number] }) {
  const { m, value } = earner;
  return (
    <li className="farmmon">
      <Link href={`/database/monsters/${m.id}`}>
        {m.sprite ? (
          <img className="farmmon__sprite" src={m.sprite} alt="" loading="lazy" decoding="async" />
        ) : (
          <span className="farmmon__sprite" aria-hidden="true" />
        )}
        <span className="farmmon__body">
          <span className="farmmon__name">
            {m.name}
            {m.level !== null && <span className="farmmon__lv"> Lv {m.level}</span>}
          </span>
          <span className="farmmon__zeny">
            <small>เฉลี่ยตัวละ</small>
            {small(value)}z
          </span>
          {m.best && (
            <span className="farmmon__drop">
              <ItemIcon iconUrl={m.best.icon} category={m.best.category} size={20} />
              <span className="farmmon__dropname">
                {m.best.name} ราว {small(m.best.value)}z
              </span>
            </span>
          )}
        </span>
      </Link>
    </li>
  );
}
