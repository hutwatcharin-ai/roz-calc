// A planned monster, laid out like the map cards so the plan tab reads the
// same way as the others: a picture, one headline figure, the rest as stats.

import Link from 'next/link';
import { CardTags, type CardFigure, type CardTag } from './MapCard';

export interface MonsterCardProps {
  id: number;
  name: string;
  level: number | null;
  sprite: string | null;
  headline: CardFigure | null;
  stats: CardFigure[];
  tags: CardTag[];
  map: { code: string; name: string } | null;
  onRemove?: () => void;
}

export default function MonsterCard({ id, name, level, sprite, headline, stats, tags, map, onRemove }: MonsterCardProps) {
  return (
    <li className="farmplan__card">
      <div className="farmplan__top">
        {sprite ? (
          <img className="farmplan__sprite" src={sprite} alt="" loading="lazy" decoding="async" />
        ) : (
          <span className="farmplan__sprite" aria-hidden="true" />
        )}
        <div>
          <Link href={`/database/monsters/${id}`} className="farmplan__name">
            {name}
          </Link>
          {level !== null && <span className="farmplan__lv">Lv {level}</span>}
          {headline && (
            <div className="farmplan__headline">
              <span className="farm-unit">{headline.label} </span>
              {headline.value}
              {headline.unit && <span className="farm-unit">{headline.unit}</span>}
            </div>
          )}
        </div>
      </div>
      {stats.length > 0 && (
        <dl className="farmcard__stats">
          {stats.map((figure) => (
            <div key={figure.label}>
              <dt>{figure.label}</dt>
              <dd>
                {figure.value}
                {figure.unit && <span className="farm-unit">{figure.unit}</span>}
              </dd>
            </div>
          ))}
        </dl>
      )}
      <CardTags tags={tags} />
      {map && (
        <p className="farmplan__map">
          เจอเยอะสุดที่ <Link href={`/database/maps/${encodeURIComponent(map.code)}`}>{map.name}</Link>
        </p>
      )}
      {onRemove && (
        <div className="farmplan__actions">
          <button type="button" className="planbtn planbtn--compact" onClick={onRemove}>
            เอาออก
          </button>
        </div>
      )}
    </li>
  );
}
