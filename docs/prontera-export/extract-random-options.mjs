// Resolves the __NUXT_DATA__ payload captured for /random-options into plain
// JSON. Confirmed against the live page (3 Sep 2026): picking Dagger in the
// browser's own UI shows "MATK 5-30" / "ATK 5-30" for its pool, which
// matches this resolver's output for the same pool exactly -- so the
// dereferencing scheme below is verified, not guessed.
//
// The payload is a flat array. Every integer that appears as an object
// property value or array element is an index into that same array; you
// dereference one level to get the target, and recurse only if the target
// is itself an array/object (a primitive target is the final value).
import fs from 'node:fs';
import path from 'node:path';

const SRC = path.resolve('prontera-export', 'data', 'random-options.jsonl');
const OUT = path.resolve('prontera-export', 'random-option-pools.json');

const record = JSON.parse(fs.readFileSync(SRC, 'utf8').trim().split('\n')[0]);
const arr = JSON.parse(record.nuxt_data);

// Vue reactivity wrappers: a 2-element array ["ShallowReactive", targetIndex]
// (also seen: "Reactive", "Ref", "EmptyShallowReactive") is transparent --
// unwrap straight to the target instead of keeping the tag around.
const REACTIVE_TAGS = new Set(['ShallowReactive', 'Reactive', 'Ref', 'EmptyShallowReactive']);

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
function isRef(x) {
  return typeof x === 'number' && Number.isInteger(x) && x >= 0 && x < arr.length;
}

// arr[0] is ["ShallowReactive", <root index>].
const root = resolve(arr[0][1]);
const pools = root.data['random-option-pools'];

fs.writeFileSync(OUT, JSON.stringify(pools, null, 2), 'utf8');
console.log(`${pools.pools?.length ?? 0} pools -> ${OUT}`);
