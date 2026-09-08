// "เมื่อก่อนเว็บนี้เรียกว่า Wootan Fighter" under a renamed monster's name.
//
// A player who typed the old name is now looking at a page with a different
// title, and without this line the only honest reading is that the search
// sent them somewhere wrong. It also says plainly that the old name was
// ours, not the game's, so nobody goes hunting for a monster that does not
// exist under that name in-game.

import { formerNames } from '@/lib/former-names';

export default function FormerNameLine({ id }: { id: number }) {
  const names = formerNames(id);
  if (names.length === 0) return null;
  return (
    <p className="aliasline">
      เว็บนี้เคยเรียกว่า:{' '}
      {names.map((n, i) => (
        <span key={n.name}>
          {i > 0 && ' · '}
          <strong title={`เปลี่ยนชื่อเมื่อ ${n.until} ให้ตรงกับชื่อการ์ดของมันเอง`}>{n.name}</strong>
        </span>
      ))}
    </p>
  );
}
