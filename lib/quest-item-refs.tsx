// Quest text carries item references as "[Hard Horn]947" -- the bracketed
// display name followed by the item id, straight from the export. Turn each
// into a link to our item page; everything else passes through untouched.
import Link from 'next/link';
import type { ReactNode } from 'react';

const REF = /\[([^\]]+)\](\d+)/g;

export function linkItemRefs(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  REF.lastIndex = 0;
  while ((m = REF.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push(
      <Link key={`${m.index}-${m[2]}`} href={`/database/items/${m[2]}`}>
        {m[1]}
      </Link>,
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}
