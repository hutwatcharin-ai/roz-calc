// Reading a whole table without hitting PostgREST's row cap.
//
// A bare `.select()` returns at most 1,000 rows and reports no error when it
// truncates. This project has been bitten twice already -- `items` (1,300) and
// `monster_spawns` (3,032) -- and each time the symptom was missing content
// with a clean `error: null`, which is indistinguishable from "there is no more
// data" at the call site.
//
// The `.order()` is not decoration. Without a stable sort, PostgREST is free to
// return rows in any order per request, so consecutive `.range()` calls can
// overlap or skip rows entirely. It is only reliably wrong at scale, which is
// the worst way for it to be wrong.

import type { PostgrestError } from '@supabase/supabase-js';

export const FETCH_PAGE_SIZE = 1000;

export interface PagedResult<T> {
  data: T[] | null;
  error: PostgrestError | null;
}

/**
 * Reads every row a query matches, one page at a time.
 *
 * `page` must apply an `.order()` on a unique column and pass `from`/`to`
 * straight to `.range()`. On error the whole read fails: a partial list is
 * worse than no list, because the caller cannot tell it is partial.
 */
export async function fetchAllRows<T>(
  page: (from: number, to: number) => PromiseLike<PagedResult<T>>,
): Promise<PagedResult<T>> {
  const all: T[] = [];

  for (let from = 0; ; from += FETCH_PAGE_SIZE) {
    const { data, error } = await page(from, from + FETCH_PAGE_SIZE - 1);
    if (error) return { data: null, error };
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < FETCH_PAGE_SIZE) break;
  }

  return { data: all, error: null };
}
