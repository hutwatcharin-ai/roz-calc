// One place to build the "name matches, OR it is one of these ids" filter.
//
// It existed twice, copied, and both copies were broken the same way: the
// wildcard was written as `%25`, which is what a `%` looks like once a URL has
// been encoded. Inside a PostgREST `or=` string it is not decoded again, so
// `name_en.ilike.%25wolf%25` asked for names containing the literal text
// "%25wolf%25" and matched nothing. Every search that also hit an alias -- a
// Thai name, a former name, a card named after the monster -- silently dropped
// every plain name match it had: "wolf" on /database/monsters returned Baby
// Desert Wolf alone and hid Wolf and Vagabond Wolf, on the most-visited page
// on the site.
//
// Two other things this fixes, both found while proving the first:
//
//   The words are ANDed, matching the path taken when there is no alias.
//   Before, they were OR-ed, so "orc archer" on that path meant "orc" or
//   "archer" -- a wider search than the same words give on any other page.
//   PostgREST spells the intersection `and(...)` nested inside `or=`.
//
//   Values are quoted. A search containing a comma or a bracket -- "a,b",
//   "(x)" -- made PostgREST fail to parse the logic tree and the page rendered
//   its error state. Quoting is what the syntax provides for that, and a quote
//   or backslash inside the value is escaped rather than passed through.

import { escapeLikePattern } from '@/lib/like-escape';
import { searchWords } from '@/lib/smart-search';

/** PostgREST's own quoting for a filter value: wrap it, escape what would end
 *  the wrapper. */
function quote(value: string): string {
  return `"${value.replace(/["\\]/g, (character) => `\\${character}`)}"`;
}

/**
 * A PostgREST `or` filter: every word of `q` present in `column`, or the row
 * being one of `ids`. Null when there is nothing to match on, so the caller
 * can skip the filter rather than send an empty one.
 */
export function nameOrIdsFilter(column: string, q: string, ids: number[]): string | null {
  const like = searchWords(q).map((word) => `${column}.ilike.${quote(`%${escapeLikePattern(word)}%`)}`);
  const clauses: string[] = [];
  if (like.length > 0) clauses.push(`and(${like.join(',')})`);
  if (ids.length > 0) clauses.push(`id.in.(${ids.join(',')})`);
  return clauses.length > 0 ? clauses.join(',') : null;
}
