// The slim dress-up index the browser loads (data/dress-up-client.json), made from
// data/dress-up.json (1.0 MB, built by scripts/build-dress-up.py). The full index
// spells out has[class-sex] for every item, and almost every item is drawn on every
// class, so the client copy keeps only the exceptions. Run by `npm run dress-up:build`
// after the Python build; lib/dress-up/client-index.test.ts fails when the two drift.
//
// Shape:
//   v, hair                 as in the full index
//   classes[]               {slug, sexes, cloth, weapons, atk: attackTypeBySex, of?}
//                           of: the 2nd class a high class outfit dresses; cart: pushes a cart
//   carts                   how many cart looks there are (cart/0 .. cart/n-1)
//   items{id: [slots, view] | [slots, view, 0] | [slots, view, ["knight-f", ...]]}
//                           slots is letters: u upper, m mid, l lower, g garment.
//                           A third value 0 means no sprite anywhere; a list names
//                           the class-sexes without one.
//   files{logical key: hash8}  the published stem is `${key}.${hash}`
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SLOT_LETTER = { upper: 'u', mid: 'm', lower: 'l', garment: 'g' };

/** @param {any} full the parsed data/dress-up.json */
export function buildClient(full) {
  const classSexes = full.classes.flatMap((c) => c.sexes.map((s) => `${c.slug}-${s}`));
  const items = {};
  for (const [id, it] of Object.entries(full.items)) {
    const slots = it.slots.map((s) => {
      if (!SLOT_LETTER[s]) throw new Error(`item ${id}: unknown slot ${s}`);
      return SLOT_LETTER[s];
    }).join('');
    const without = classSexes.filter((k) => !it.has?.[k]);
    if (without.length === 0) items[id] = [slots, it.view];
    else if (without.length === classSexes.length) items[id] = [slots, it.view, 0];
    else items[id] = [slots, it.view, without];
  }
  const files = {};
  for (const [key, stem] of Object.entries(full.files)) {
    const m = stem.startsWith(`${key}.`) ? stem.slice(key.length + 1) : null;
    if (!m || !/^[0-9a-f]{8}$/.test(m)) throw new Error(`files[${key}] = ${stem}: not "<key>.<hash8>"`);
    files[key] = m;
  }
  return {
    v: full.v,
    classes: full.classes.map((c) => ({
      slug: c.slug, sexes: c.sexes, cloth: c.cloth, weapons: c.weapons, atk: c.attackTypeBySex, ...(c.of ? { of: c.of } : {}), ...(c.cart ? { cart: true } : {}),
    })),
    hair: full.hair,
    carts: full.carts ?? 0,
    items,
    files,
  };
}

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const full = JSON.parse(await readFile(path.join(ROOT, 'data', 'dress-up.json'), 'utf8'));
  const text = JSON.stringify(buildClient(full));
  await writeFile(path.join(ROOT, 'data', 'dress-up-client.json'), text);
  console.log(`data/dress-up-client.json: ${text.length} bytes`);
}
