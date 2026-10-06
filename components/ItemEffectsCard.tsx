// "ผลของไอเทม" -- what a piece of gear or a card does, as short numbered
// lines (owner, 6 Oct 2026: use the prontera.info data on our old pages).
// The item's own text further down the page stays the authority; this is the
// at-a-glance version a player compares two items by.
//
// Server component; renders nothing when the item has no structured effect.

import { bonusText, conditionText, isPenalty, itemEffects, ITEM_EFFECTS_SOURCE } from '@/lib/item-effects';

/**
 * `onlyIfMore`: a card's hero already prints its effect, so a card with a
 * single unconditional bonus would repeat it; the card page passes this.
 */
export default function ItemEffectsCard({ id, onlyIfMore = false }: { id: number; onlyIfMore?: boolean }) {
  const effects = itemEffects(id);
  const groups = effects?.g ?? [];
  if (groups.length === 0) return null;
  const always = groups.filter((g) => !conditionText(g.c)).flatMap((g) => g.b);
  const conditional = groups.filter((g) => conditionText(g.c));
  if (onlyIfMore && conditional.length === 0 && always.length < 2) return null;

  return (
    <section className="card effects" style={{ marginTop: 20 }} aria-labelledby="effects-title">
      <h2 id="effects-title" className="section-title">ผลของไอเทม</h2>
      {always.length > 0 && (
        <ul className="effects__chips">
          {always.map((b, i) => (
            <li key={i} className={isPenalty(b) ? 'effects__chip effects__chip--minus' : 'effects__chip'}>
              {bonusText(b)}
            </li>
          ))}
        </ul>
      )}
      {conditional.length > 0 && (
        <dl className="effects__when">
          {conditional.map((g, i) => (
            <div key={i}>
              <dt>{conditionText(g.c)}</dt>
              <dd>
                {g.b.map((b, j) => (
                  <span key={j} className={isPenalty(b) ? 'effects__chip effects__chip--minus' : 'effects__chip'}>{bonusText(b)}</span>
                ))}
              </dd>
            </div>
          ))}
        </dl>
      )}
      <p className="muted effects__src">
        {effects?.src === 'text' ? 'สรุปจากข้อความในเกม' : `สรุปจากข้อมูล ${ITEM_EFFECTS_SOURCE}`} · ข้อความในเกมด้านล่างเป็นหลัก ถ้าไม่ตรงกันให้เชื่อข้อความในเกม
      </p>
    </section>
  );
}
