// The line under a list card while an effect filter is on: what this item
// does for that filter ("FLEE +15 · +7 ขึ้นไป: FLEE +5"), so the list answers
// the question without opening every item.

import { bonusText, matchingBonuses, type EffectFilter, type ItemEffects } from '@/lib/item-effects';

export default function EffectMatchLine({ effects, filter }: { effects: ItemEffects | null; filter: EffectFilter }) {
  const hits = matchingBonuses(effects, filter).slice(0, 3);
  if (hits.length === 0) return null;
  return (
    <span className="itemcard__fx">
      {hits.map((h, i) => (
        <span key={i}>
          {i > 0 && ' · '}
          {h.when && <em>{h.when}: </em>}
          {bonusText(h.bonus)}
        </span>
      ))}
    </span>
  );
}
