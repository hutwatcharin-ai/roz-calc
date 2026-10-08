// Lines in the game's own item text that the owner has tested and found do
// nothing in the live game. The client text stays on the item page word for
// word (it is what players read in game), with a note under it; the lines are
// kept out of anything that lists items by effect.
//
// Crab Card (owner, 8 Oct 2026): in game it is ATK +5 and nothing else. The
// client's "Physical Damage to Water-property monsters +30%" line had put it
// on the "cards that hit Water monsters" page.

export interface ClientTextFix {
  /** Card topic slugs (lib/card-topics) this item must not appear on. */
  topics: string[];
  /** Shown under the in-game text on the item's page. */
  note: string;
}

export const CLIENT_TEXT_FIXES: Record<number, ClientTextFix> = {
  4153: {
    topics: ['vs-water'],
    note: 'บรรทัด "เพิ่ม Damage ทางกายภาพต่อมอนสเตอร์ธาตุ Water 30%" ไม่มีผลในเกมจริง ใส่แล้วได้แค่ ATK +5 (เจ้าของเว็บทดสอบ 8 ต.ค. 2026)',
  },
};

export function clientTextFix(id: number): ClientTextFix | null {
  return CLIENT_TEXT_FIXES[id] ?? null;
}
