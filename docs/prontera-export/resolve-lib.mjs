// Shared resolver for prontera.info's __NUXT_DATA__ payload (Nuxt 3's flat,
// index-referencing "devalue-shaped" format). Verified against the live
// /random-options page on 3 Sep 2026: picking an item in the browser's own
// UI showed the exact numbers this resolver reads out of the same payload.
const REACTIVE_TAGS = new Set(['ShallowReactive', 'Reactive', 'Ref', 'EmptyShallowReactive']);

export function resolvePayload(nuxtDataString) {
  const arr = JSON.parse(nuxtDataString);
  const isRef = (x) => typeof x === 'number' && Number.isInteger(x) && x >= 0 && x < arr.length;
  function resolve(i, depth = 0) {
    if (depth > 30) return '[too deep]';
    const v = arr[i];
    if (Array.isArray(v)) {
      if (v.length === 2 && REACTIVE_TAGS.has(v[0]) && isRef(v[1])) return resolve(v[1], depth + 1);
      return v.map((x) => (isRef(x) ? resolve(x, depth + 1) : x));
    }
    if (v && typeof v === 'object') {
      const out = {};
      for (const k of Object.keys(v)) out[k] = isRef(v[k]) ? resolve(v[k], depth + 1) : v[k];
      return out;
    }
    return v;
  }
  const root = resolve(arr[0][1]);
  return root;
}
