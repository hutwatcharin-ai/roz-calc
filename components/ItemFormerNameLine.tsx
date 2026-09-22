// "เว็บนี้เคยเรียกว่า Orc Trophy" under an item renamed to the game's own name
// (22 Sep 2026). Same reason as FormerNameLine for monsters: a player who
// searched the old name lands on a different title and deserves to know why.
import { itemFormerNames } from '@/lib/item-former-names';

export default function ItemFormerNameLine({ id }: { id: number }) {
  const names = itemFormerNames(id);
  if (names.length === 0) return null;
  return (
    <p className="aliasline">
      เว็บนี้เคยเรียกว่า:{' '}
      {names.map((name, i) => (
        <span key={name}>
          {i > 0 && ' · '}
          <strong title="เปลี่ยนเป็นชื่อที่เกมแสดงจริง">{name}</strong>
        </span>
      ))}
    </p>
  );
}
