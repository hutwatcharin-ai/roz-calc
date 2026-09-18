// Nuxt payload reader for roz.prontera.info pages.
//
// Lifted out of scripts/fetch-prontera-gap-items.mjs on 18 Sep 2026 so the
// monster fetcher can use it: importing that file ran its main() as a side
// effect, which re-ran an item fetch just to borrow one function.
//
// The payload is devalue's reference-array format: each slot is a primitive,
// an array of refs, or a {key: ref} object, and a two-element
// ["XReactive", ref] tags a wrapped ref, which is unwrapped rather than
// treated as a two-item array.
export function resolveNuxtData(data) {
  const cache = new Map();
  function resolve(i) {
    if (cache.has(i)) return cache.get(i);
    const val = data[i];
    if (val === null || typeof val !== 'object') return val;
    if (Array.isArray(val)) {
      if (val.length === 2 && typeof val[0] === 'string' && (val[0].endsWith('Reactive') || val[0] === 'Ref')) {
        return resolve(val[1]);
      }
      const arr = [];
      cache.set(i, arr);
      for (const r of val) arr.push(resolve(r));
      return arr;
    }
    const obj = {};
    cache.set(i, obj);
    for (const [k, r] of Object.entries(val)) obj[k] = resolve(r);
    return obj;
  }
  return resolve(1);
}
