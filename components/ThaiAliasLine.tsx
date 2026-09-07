// "เรียกอีกชื่อ: คาราเมล" under an entity's name.
//
// In the page body, not only the title: Google matched Thai searches to
// these pages and ranked them 8th to 66th because the word appeared nowhere
// on them (lib/thai-aliases has the queries). The tooltip carries why the
// name is what it is, since half of them are nicknames rather than
// spellings -- หมาฟ้า means "blue dog" and Wolf is grey-blue.

import { thaiAliases } from '@/lib/thai-aliases';

export default function ThaiAliasLine({ kind, id }: { kind: 'monsters' | 'items'; id: number }) {
  const aliases = thaiAliases(kind, id);
  if (aliases.length === 0) return null;
  return (
    <p className="aliasline">
      เรียกอีกชื่อ:{' '}
      {aliases.map((a, i) => (
        <span key={a.name}>
          {i > 0 && ' · '}
          <strong title={a.why}>{a.name}</strong>
        </span>
      ))}
    </p>
  );
}
