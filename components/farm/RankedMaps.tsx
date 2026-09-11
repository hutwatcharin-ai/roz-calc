// The ranked list every map mode shares: the top three large, four to ten
// compact, the rest folded away, forty at most.

import MapCard, { type MapCardProps } from './MapCard';
import type { RankedMap } from '@/lib/farm-engine/rank';

const PODIUM = 3;
const OPEN = 10;
const SHOWN = 40;

export type CardContent = Omit<MapCardProps, 'rank' | 'big'>;

export default function RankedMaps({
  maps,
  toCard,
  idPrefix,
  podiumTitle,
}: {
  maps: RankedMap[];
  toCard: (map: RankedMap) => CardContent;
  idPrefix: string;
  podiumTitle: string;
}) {
  const shown = maps.slice(0, SHOWN);
  if (shown.length === 0) return null;
  const card = (map: RankedMap, rank: number, big = false) => <MapCard key={map.code} {...toCard(map)} rank={rank} big={big} />;

  return (
    <>
      <section className="farm-section" aria-labelledby={`${idPrefix}-podium`}>
        <h2 id={`${idPrefix}-podium`} className="section-title">
          {podiumTitle}
        </h2>
        <ol className="farm-podium">{shown.slice(0, PODIUM).map((map, i) => card(map, i + 1, true))}</ol>
      </section>

      {shown.length > PODIUM && (
        <section className="farm-section" aria-labelledby={`${idPrefix}-list`}>
          <h2 id={`${idPrefix}-list`} className="section-title">
            อันดับ {PODIUM + 1}–{Math.min(OPEN, shown.length)}
          </h2>
          <ol className="farm-maplist">{shown.slice(PODIUM, OPEN).map((map, i) => card(map, PODIUM + i + 1))}</ol>
          {shown.length > OPEN && (
            <details className="farm-more">
              <summary>
                ดูอันดับ {OPEN + 1}–{shown.length}
              </summary>
              <ol className="farm-maplist">{shown.slice(OPEN).map((map, i) => card(map, OPEN + i + 1))}</ol>
            </details>
          )}
        </section>
      )}
    </>
  );
}
