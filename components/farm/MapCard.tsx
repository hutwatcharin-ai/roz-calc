// One map card for every map mode of the farm tool. The mode decides what the
// headline figure is (EXP/ชม., z/ชม., เฉลี่ยตัวละ); the card only lays it out,
// so a player switching tabs reads the same shape every time.

import Link from 'next/link';

export interface CardFigure {
  label: string;
  value: string;
  unit?: string;
}

export interface CardMonster {
  id: number;
  name: string;
  sprite: string | null;
  note: string;
}

export interface CardTag {
  tone: 'warn' | 'info';
  text: string;
  title?: string;
}

export interface MapCardProps {
  rank: number;
  big?: boolean;
  code: string;
  name: string;
  image: string | null;
  channels: number;
  headline: CardFigure;
  stats: CardFigure[];
  monsters: CardMonster[];
  tags: CardTag[];
}

function Figure({ figure, money }: { figure: CardFigure; money?: boolean }) {
  // No "≈" inside the number: the mono face draws it as a rupee sign, so any
  // "about" belongs in the label.
  return (
    <>
      <dt>{figure.label}</dt>
      <dd className={money ? 'farm-money' : undefined}>
        {figure.value}
        {figure.unit && <span className="farm-unit">{figure.unit}</span>}
      </dd>
    </>
  );
}

export function CardTags({ tags }: { tags: CardTag[] }) {
  if (tags.length === 0) return null;
  return (
    <ul className="farmcard__tags">
      {tags.map((tag) => (
        <li key={tag.text} className={`tag ${tag.tone === 'warn' ? 'tag--risk' : 'tag--unknown'}`} title={tag.title}>
          {tag.text}
        </li>
      ))}
    </ul>
  );
}

export default function MapCard({ rank, big, code, name, image, channels, headline, stats, monsters, tags }: MapCardProps) {
  const href = `/database/maps/${encodeURIComponent(code)}`;
  return (
    <li className={`farmcard${big ? ' farmcard--big' : ''}`}>
      {/* The picture repeats the name link beside it, so it is hidden from
          the keyboard and screen readers rather than announced twice. */}
      <Link href={href} className="farmcard__pic" tabIndex={-1} aria-hidden="true">
        {image ? (
          <img src={image} alt="" loading={rank === 1 ? 'eager' : 'lazy'} decoding="async" />
        ) : (
          <span className="farmcard__nopic">ไม่มีรูปแมพ</span>
        )}
        {big && <span className="farmcard__badge">#{rank}</span>}
      </Link>
      <div className="farmcard__body">
        <div className="farmcard__head">
          {!big && <span className="farmcard__num">#{rank}</span>}
          <Link href={href} className="farmcard__name">
            {name}
          </Link>
        </div>
        <div className="farmcard__code">
          {code}
          {channels > 1 && ` · ${channels} ช่อง`}
        </div>
        <dl className="farmcard__stats">
          <div className="farmcard__rate">
            <Figure figure={headline} money />
          </div>
          {stats.map((figure) => (
            <div key={figure.label}>
              <Figure figure={figure} />
            </div>
          ))}
        </dl>
        <CardTags tags={tags} />
        <ul className="farmmob" aria-label="มอนหลักในแมพ">
          {monsters.map((mob) => (
            <li key={mob.id}>
              <Link href={`/database/monsters/${mob.id}`}>
                {mob.sprite && <img src={mob.sprite} alt="" loading="lazy" decoding="async" />}
                <span className="farmmob__name">{mob.name}</span>
                <span className="farmmob__z">{mob.note}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </li>
  );
}
