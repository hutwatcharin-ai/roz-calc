'use client';

// ทิ้งบอท AFK: where a bot collects EXP overnight and survives. Per map, since
// a bot fights whatever it meets on the map, not one chosen monster. The gate
// is the same one the zeny mode uses (lib/farm-engine/survival, or the dodge
// gate in lib/farm-engine/safety while Max HP is blank).

import { useMemo, useState } from 'react';
import Caveat from '@/components/Caveat';
import RankedMaps from './RankedMaps';
import BlockedMaps from './BlockedMaps';
import { MapFilters, OvernightSummary, RateCaveat, SurvivalCaveat, type OvernightFilters } from './OvernightParts';
import { blockerText, nightLabel, botFigures, botSetupHref, botTags, mapCardTags, mobsFigure, survivalFigures, whole } from './card-helpers';
import type { ViewProps } from './LevelView';
import { rankMaps, type RankedMap } from '@/lib/farm-engine/rank';
import { canGate, canRate } from '@/lib/farm-engine/basics';
import { canSurvive } from '@/lib/farm-engine/survival';
import { NIGHT_HOURS } from '@/lib/farm-engine/types';

export const DEFAULT_FILTERS: OvernightFilters = { cleanOnly: false, noRiskOnly: false, hideLow: true };

export default function AfkView({ data, player, level, bot }: ViewProps) {
  const [filters, setFilters] = useState<OvernightFilters>(DEFAULT_FILTERS);
  const { ranked, blocked, hiddenLow } = useMemo(
    () => rankMaps(data, player, 'afk', { level, ...filters, hideLowMaps: filters.hideLow, bot }),
    [data, player, level, filters, bot],
  );
  const rate = canRate(player);
  const judged = canSurvive(player) || canGate(player);

  const toCard = (map: RankedMap) => ({
    code: map.code,
    name: map.name,
    image: map.image,
    channels: map.channels,
    headline:
      rate && map.perHour !== null
        ? { label: 'ได้ราว', value: whole(map.perHour), unit: ' EXP/ชม.' }
        : { label: 'เฉลี่ยตัวละ', value: whole(map.avgPerKill), unit: ' EXP' },
    stats: [
      ...(map.bot && map.perHour !== null
        ? [{ label: nightLabel(map.bot), value: whole(map.bot.exp), unit: ' EXP' }]
        : rate && map.perHour !== null
          ? [{ label: `ทั้งคืน ${NIGHT_HOURS} ชม. ราว`, value: whole(map.perHour * NIGHT_HOURS), unit: ' EXP' }]
          : []),
      mobsFigure(map),
      ...(map.bot ? botFigures(map.bot) : survivalFigures(map)),
    ],
    monsters: map.top.map((t) => {
      const m = data.monsters[t.id];
      return { id: t.id, name: m.name, sprite: m.sprite, note: `Lv${m.level ?? '?'} · ${whole(t.value)} EXP ×${t.amount}` };
    }),
    tags: [...botTags(map.bot, data), ...mapCardTags(map)],
    action: { href: botSetupHref(map.code, map.bot), label: 'ดูค่าเซ็ตบอทแมพนี้' },
  });

  return (
    <>
      <OvernightSummary
        player={player}
        ranked={ranked.length}
        blocked={blocked.length}
        hiddenLow={hiddenLow}
        data={data}
        unrated="เรียงตาม EXP ต่อ HP ของมอนคูณจำนวนตัว"
      />

      <MapFilters filters={filters} onChange={setFilters} canHideLow={player.level !== null} />

      {ranked.length === 0 ? (
        <div className="card farm-state">
          <p>
            {judged && blocked.length > 0
              ? `ไม่มีแมพไหนที่บอทอยู่รอดทั้งคืน ตัวอย่าง: ${blocked[0].name} — ${blockerText((blocked[0].blockers ?? [])[0])} ลองเลือกยา เพิ่มจำนวนยา หรือเช็คค่าที่กรอก`
              : 'ไม่มีแมพที่ผ่านตัวกรองที่ติ๊กไว้ ลองเอาติ๊กออก'}
          </p>
        </div>
      ) : (
        <RankedMaps maps={ranked} toCard={toCard} idPrefix="farm-afk" podiumTitle="3 แมพทิ้งบอทเก็บ EXP ที่ดีสุด" />
      )}
      {/* After the answer, not before it: the maps you cannot use are the
          explanation, not the result. */}
      {judged && <BlockedMaps blocked={blocked} />}

      <Caveat label="คิดยังไง และข้อจำกัดของตัวเลข">
        <p>
          ไม่กรอกเลข: เรียงตาม EXP ต่อ HP คูณจำนวนตัว · กรอกดาเมจกับความเร็วแล้ว: EXP/ชม. = EXP เฉลี่ยต่อตัว ÷ (เวลาฆ่า + เวลาเดินหามอน) โดยบอทตีมอนที่เจอตามสัดส่วนจำนวนตัวในแมพ
        </p>
        <SurvivalCaveat player={player} />
        <RateCaveat />
      </Caveat>
    </>
  );
}
