// "Which monsters drop this", as sprite cards with the rate as the big
// number (owner, 30 Sep 2026), each card lit in its loot-tier colour like
// the monster page's drop table (lib/drop-tier, 1 Oct 2026). Shared by the
// item page and the gear/costume pages (components/GearDetail), which until
// then listed droppers as plain rows.

import Link from 'next/link';
import { isCVariant } from '@/lib/c-variant';
import { dropTier, TIER_LABEL } from '@/lib/drop-tier';
import { monsterLabel } from '@/lib/monster-known-as';

export interface Dropper {
  rate: number | null;
  monsters: { id: number; name_en: string; image_url: string | null; level?: number | null };
}

export default function DropperGrid({ droppers, isCard = false }: { droppers: Dropper[]; isCard?: boolean }) {
  return (
    <ul className="dropgrid">
      {droppers.map((d, i) => {
        const tier = dropTier(d.rate, isCard);
        return (
          <li key={i} className={isCVariant(d.monsters.name_en) ? 'cvariant' : undefined}>
            <Link href={`/database/monsters/${d.monsters.id}`} className="dropcard" data-tier={tier ?? undefined}>
              <span className="dropcard__art">
                {d.monsters.image_url && <img src={d.monsters.image_url} alt="" loading="lazy" />}
              </span>
              <span className="dropcard__name">
                {monsterLabel(d.monsters.id, d.monsters.name_en)}
                {d.monsters.level != null && <span className="dropcard__lv">Lv {d.monsters.level}</span>}
              </span>
              <span className="dropcard__rate">
                {d.rate != null ? `${d.rate}%` : '?'}
                {tier && <small>{TIER_LABEL[tier]}</small>}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
