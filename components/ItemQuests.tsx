// "เควสที่ต้องใช้ของชิ้นนี้" on an item page.
//
// Quest text names its items by id, so this is the exact other half of the
// link lib/quest-item-refs already draws from the quest side.

import Link from 'next/link';
import { questsForItem } from '@/lib/quests-for-item';

export default async function ItemQuests({ itemId }: { itemId: number }) {
  const quests = await questsForItem(itemId);
  if (quests.length === 0) return null;

  return (
    <div className="card" style={{ marginTop: 20 }}>
      <h2 className="section-title">เควสที่ต้องใช้ของชิ้นนี้ ({quests.length})</h2>
      <ul className="shoplist">
        {quests.map((quest) => (
          <li key={quest.id} className="shoprow">
            <span className="shoprow__who">
              <Link href={`/database/quests/${quest.town_key}#q${quest.id}`}>{quest.name_th ?? quest.name}</Link>
              {quest.name_th && <span className="muted" style={{ marginInlineStart: 8, fontSize: 12.5 }}>{quest.name}</span>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
